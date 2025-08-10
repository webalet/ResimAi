import { Router, Request, Response } from 'express';
import multer from 'multer';
import fetch from 'node-fetch';
import { supabase } from '../config/supabase.js';
import { auth } from '../middleware/auth.js';
import { uploadToSupabase, deleteFromSupabase } from '../utils/storage.js';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Sadece görsel dosyaları yüklenebilir'));
    }
  }
});

// Simple file upload endpoint (just upload file and return URL)
router.post('/upload', auth, upload.single('image'), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const file = req.file;

    if (!file) {
      res.status(400).json({
        success: false,
        error: 'Görsel dosyası gereklidir'
      });
      return;
    }

    console.log('📤 [UPLOAD] File upload request:', {
      userId,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    });

    // Just upload the file to storage without processing

    // Upload image to Supabase Storage
    const imagePath = `uploads/${userId}/${Date.now()}-${file.originalname}`;
    const imageUrl = await uploadToSupabase(file.buffer, imagePath, file.mimetype);

    if (!imageUrl) {
      res.status(500).json({
        success: false,
        error: 'Görsel yüklenirken hata oluştu'
      });
      return;
    }

    console.log('✅ [UPLOAD] File uploaded successfully:', {
      userId,
      imageUrl: imageUrl.substring(0, 50) + '...'
    });

    // Return the uploaded image URL
    res.status(200).json({
      success: true,
      url: imageUrl,
      message: 'Görsel başarıyla yüklendi'
    });
  } catch (error) {
    console.error('❌ [UPLOAD] Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
    return;
  }
});

// Upload and process image (original endpoint renamed)
router.post('/upload-and-process', auth, upload.single('image'), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { categoryType, style } = req.body;
    const file = req.file;

    if (!file) {
      res.status(400).json({
        success: false,
        message: 'Görsel dosyası gereklidir'
      });
      return;
    }

    if (!categoryType || !style) {
      res.status(400).json({
        success: false,
        message: 'Kategori tipi ve stil gereklidir'
      });
      return;
    }

    // Check user credits
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
      return;
    }

    if (user.credits < 1) {
      res.status(400).json({
        success: false,
        message: 'Yetersiz kredi. Lütfen kredi satın alın.'
      });
      return;
    }

    // Get category
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('type', categoryType)
      .eq('is_active', true)
      .single();

    if (categoryError || !category) {
      res.status(404).json({
        success: false,
        message: 'Kategori bulunamadı'
      });
      return;
    }

    // Upload original image to Supabase Storage
    const originalImagePath = `originals/${userId}/${Date.now()}-${file.originalname}`;
    const originalImageUrl = await uploadToSupabase(file.buffer, originalImagePath, file.mimetype);

    if (!originalImageUrl) {
      res.status(500).json({
        success: false,
        message: 'Görsel yüklenirken hata oluştu'
      });
      return;
    }

    // Create image job record
    const { data: imageJob, error: jobError } = await supabase
      .from('image_jobs')
      .insert({
        user_id: userId,
        category_id: category.id,
        category_type: categoryType,
        style: style,
        original_image_url: originalImageUrl,
        status: 'processing'
      })
      .select()
      .single();

    if (jobError) {
      console.error('Image job creation error:', jobError);
      // Clean up uploaded image
      await deleteFromSupabase(originalImagePath);
      res.status(500).json({
        success: false,
        message: 'İş kaydı oluşturulurken hata oluştu'
      });
      return;
    }

    // Deduct credit
    const { error: creditError } = await supabase
      .from('users')
      .update({ credits: user.credits - 1 })
      .eq('id', userId);

    if (creditError) {
      console.error('Credit deduction error:', creditError);
    }

    // Record credit usage
    await supabase
      .from('credits_usage')
      .insert({
        user_id: userId,
        job_id: imageJob.id,
        credits_used: 1,
        operation_type: 'image_processing'
      });

    // Generate dynamic prompt based on category and style
    const dynamicPrompt = generatePrompt(categoryType, style);
    
    // Send direct webhook request (bypass n8n)
    console.log('🎯 [UPLOAD DEBUG] Sending direct webhook request to external URL:', {
      jobId: imageJob.id,
      imageUrl: originalImageUrl?.substring(0, 50) + '...',
      categoryType,
      style,
      userId,
      prompt: dynamicPrompt
    });

    // Send GET request to external webhook with proper parameters
    const webhookUrl = new URL('https://1qe4j72v.rpcld.net/webhook/cd11e789-5e4e-4dda-a86e-e1204e036c82');
    webhookUrl.searchParams.append('imageUrl', originalImageUrl || '');
    webhookUrl.searchParams.append('category', categoryType);
    webhookUrl.searchParams.append('style', style);
    webhookUrl.searchParams.append('prompt', dynamicPrompt);
    webhookUrl.searchParams.append('userId', userId);
    
    fetch(webhookUrl.toString(), {
      method: 'GET'
    }).then(response => {
      console.log('✅ [UPLOAD DEBUG] External webhook request completed:', {
        jobId: imageJob.id,
        status: response.status,
        statusText: response.statusText
      });
      return response.text();
    }).then(responseText => {
      console.log('📝 [UPLOAD DEBUG] External webhook response:', {
        jobId: imageJob.id,
        response: responseText
      });
    }).catch((error: Error) => {
      console.error('❌ [UPLOAD DEBUG] External webhook error:', {
        jobId: imageJob.id,
        error: error.message,
        stack: error.stack
      });
    });

    res.status(201).json({
      success: true,
      data: {
        job: imageJob,
        remainingCredits: user.credits - 1
      },
      message: 'Görsel yüklendi ve işleme başlandı'
    });
  } catch (error) {
    console.error('Upload and process error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
    return;
  }
});

// Generate dynamic prompt based on category and style
const generatePrompt = (category: string, style: string): string => {
  const prompts: { [key: string]: { [key: string]: string } } = {
    'Corporate': {
      'Klasik': 'Put the person in a traditional office environment with classic wooden furniture and formal atmosphere. Also, make sure they wear a classic business suit with traditional styling and conservative colors.',
      'Modern': 'Put the person in a modern tech office environment with glass walls, contemporary furniture, and innovative workspace design. Also, make sure they wear a sleek contemporary business suit with modern cut and trendy styling.',
      'Resmi': 'Put the person in a very formal corporate boardroom environment with mahogany furniture and executive atmosphere. Also, make sure they wear a strictly formal business suit with conservative styling, tie, and traditional corporate appearance.'
    },
    'Creative': {
      'Sanatsal': 'Transform the person with artistic effects: add colorful paint splashes on their face and hair, apply vibrant artistic makeup with bold colors, add creative face painting designs, and enhance with artistic lighting effects on the person. Keep the original background unchanged, focus only on making the person artistic and colorful.',
      'Renkli': 'Transform the person into a vibrant, colorful portrait with rainbow-like color gradients on their clothing, add bright neon lighting effects around them, enhance their features with vivid makeup in electric blues, hot pinks, and golden yellows. Create a dynamic atmosphere with colorful light rays and energetic visual elements while maintaining the person as the focal point.',
      'Minimalist': 'Create a clean, minimalist portrait with the person against a pure white or soft neutral background. Simplify their clothing to solid, muted colors like white, beige, or soft gray. Remove any distracting elements, use soft natural lighting, and focus on clean lines and elegant simplicity. The composition should be balanced and serene with plenty of negative space.'
    },
    'Avatar': {
      'Çizgi Film': 'Transform the person into a vibrant cartoon-style avatar with exaggerated facial features, bright cartoon colors, simplified geometric shapes, large expressive eyes, and smooth animated textures. Apply a cel-shaded effect with bold outlines and maintain the playful, animated character aesthetic typical of modern animation studios.',
      'Realistik': 'Create a high-quality realistic digital avatar that preserves all natural human features and proportions with enhanced detail. Improve skin texture, add subtle lighting effects, maintain authentic facial expressions, and ensure photorealistic quality while keeping the person\'s unique characteristics and identity intact.',
      'Fantastik': 'Transform the person into an enchanting fantasy avatar with magical elements such as glowing eyes, ethereal lighting effects, mystical aura, fantasy-themed accessories like elven ears or magical symbols, and otherworldly atmospheric effects. Add fantasy colors and magical particle effects while maintaining recognizable human features.'
    },
    'Outfit': {
      'Casual': 'Transform the person\'s outfit to stylish casual wear: fitted dark jeans or chinos, a trendy t-shirt or casual button-down shirt, comfortable sneakers or casual shoes, and add accessories like a watch or casual jacket. Create a relaxed, everyday look that\'s both comfortable and fashionable.',
      'Formal': 'Change the person\'s outfit to elegant formal attire: for men, a well-tailored dark suit with dress shirt, tie, and polished dress shoes; for women, an elegant cocktail dress or professional pantsuit with heels and refined accessories. Ensure the styling is sophisticated and appropriate for formal events.',
      'Spor': 'Transform the person into athletic sportswear: moisture-wicking workout clothes, athletic shorts or leggings, performance t-shirt or tank top, quality running shoes, and sport-specific accessories like a fitness tracker or gym bag. Create an active, energetic appearance suitable for exercise or sports activities.'
    },
    'Background': {
      'Ofis': 'Replace the background with a sophisticated modern office environment featuring floor-to-ceiling windows with city views, sleek glass conference tables, contemporary furniture, soft ambient lighting, and professional workplace atmosphere. Add subtle details like modern art on walls and high-tech equipment.',
      'Doğa': 'Transform the background into a breathtaking natural outdoor scene with lush green forests, golden sunlight filtering through trees, scenic mountain landscapes, or serene lakeside views. Include natural elements like flowing water, wildflowers, and soft natural lighting that creates a peaceful, organic atmosphere.',
      'Stüdyo': 'Create a professional photography studio background with seamless gradient lighting, soft diffused illumination, clean minimalist backdrop in neutral tones (white, gray, or subtle colors), and professional studio lighting setup that enhances the subject without distractions.'
    },
    'Skincare': {
      'Doğal': 'Apply professional natural skin enhancement: subtly even out skin tone, reduce minor blemishes while preserving natural texture and pores, enhance the skin\'s inherent glow with soft lighting, and maintain authentic skin characteristics. Focus on healthy, realistic improvements that look naturally beautiful.',
      'Pürüzsüz': 'Create flawless, magazine-quality skin with professional retouching: smooth out all imperfections, minimize pores, even skin tone completely, remove blemishes and fine lines, and apply subtle contouring for a polished, airbrushed finish while keeping facial features natural.',
      'Parlak': 'Transform the skin with a luminous, radiant glow: enhance natural skin luminosity, add subtle highlighting to cheekbones and high points of the face, create a healthy dewy finish, boost overall skin radiance with warm golden undertones, and apply professional-grade skin brightening effects for a vibrant, youthful appearance.'
    }
  };

  return prompts[category]?.[style] || 'Enhance and improve the person in the image with professional quality.';
};

// Process image endpoint (proxy to external webhook)
router.post('/process', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { imageUrl, category, style } = req.body;
    
    console.log('🎯 [PROCESS] Processing request:', {
      userId,
      imageUrl: imageUrl?.substring(0, 50) + '...',
      category,
      style
    });
    
    if (!imageUrl || !category || !style) {
      res.status(400).json({
        success: false,
        message: 'imageUrl, category ve style gereklidir'
      });
      return;
    }
    
    // Generate dynamic prompt based on category and style
    const dynamicPrompt = generatePrompt(category, style);
    
    console.log('📝 [PROCESS] Generated prompt:', {
      category,
      style,
      prompt: dynamicPrompt
    });
    
    // Send GET request to external webhook with query parameters including dynamic prompt
    const webhookUrl = new URL('https://1qe4j72v.rpcld.net/webhook/cd11e789-5e4e-4dda-a86e-e1204e036c82');
    webhookUrl.searchParams.append('imageUrl', imageUrl);
    webhookUrl.searchParams.append('category', category);
    webhookUrl.searchParams.append('style', style);
    webhookUrl.searchParams.append('prompt', dynamicPrompt);
    webhookUrl.searchParams.append('userId', userId);
    
    const webhookResponse = await fetch(webhookUrl.toString(), {
      method: 'GET'
    });
    
    const responseText = await webhookResponse.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }
    
    console.log('✅ [PROCESS] Webhook response:', {
      status: webhookResponse.status,
      statusText: webhookResponse.statusText,
      data: responseData
    });
    
    if (webhookResponse.ok) {
      res.status(200).json({
        success: true,
        message: 'Fotoğraf işleme başlatıldı',
        data: responseData,
        prompt: dynamicPrompt
      });
    } else {
      res.status(webhookResponse.status).json({
        success: false,
        message: 'Webhook isteği başarısız',
        error: responseData
      });
    }
    
  } catch (error) {
    console.error('❌ [PROCESS] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
    return;
  }
});

// Webhook test endpoint (proxy to external webhook)
router.get('/webhook-test', async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageUrl } = req.query;
    console.log('🧪 [WEBHOOK TEST] Test isteği alındı', { imageUrl });
    
    const webhookUrl = new URL('https://1qe4j72v.rpcld.net/webhook-test/cd11e789-5e4e-4dda-a86e-e1204e036c82');
    if (imageUrl && typeof imageUrl === 'string') {
      webhookUrl.searchParams.append('imageUrl', imageUrl);
    }
    
    console.log('🚀 [WEBHOOK TEST] Harici webhook\'a GET isteği gönderiliyor:', webhookUrl.toString());
    
    const response = await fetch(webhookUrl.toString(), {
      method: 'GET'
    });
    
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }
    
    console.log('✅ [WEBHOOK TEST] Webhook yanıtı:', {
      status: response.status,
      statusText: response.statusText,
      data: responseData
    });
    
    res.status(200).json({
      success: true,
      webhook: {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ [WEBHOOK TEST] Hata:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      timestamp: new Date().toISOString()
    });
    return;
  }
});

// Get user's image jobs
router.get('/jobs', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { status, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('image_jobs')
      .select(`
        id,
        category_type,
        style,
        status,
        original_image_url,
        created_at,
        processed_images (
          id,
          image_url,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: jobs, error } = await query;

    if (error) {
      console.error('Jobs fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'İşler yüklenirken hata oluştu'
      });
      return;
    }

    res.json({
      success: true,
      data: jobs || []
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
    return;
  }
});

// Get specific job
router.get('/jobs/:jobId', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { jobId } = req.params;

    const { data: job, error } = await supabase
      .from('image_jobs')
      .select(`
        id,
        category_type,
        style,
        status,
        original_image_url,
        created_at,
        processed_images (
          id,
          image_url,
          created_at
        )
      `)
      .eq('id', jobId)
      .eq('user_id', userId)
      .single();

    if (error || !job) {
      res.status(404).json({
        success: false,
        message: 'İş bulunamadı'
      });
      return;
    }

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
    return;
  }
});

// Get job status
router.get('/jobs/:jobId/status', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { jobId } = req.params;

    const { data: job, error } = await supabase
      .from('image_jobs')
      .select(`
        id,
        status,
        processed_images (
          id,
          image_url,
          created_at
        )
      `)
      .eq('id', jobId)
      .eq('user_id', userId)
      .single();

    if (error || !job) {
      res.status(404).json({
        success: false,
        message: 'İş bulunamadı'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        status: job.status,
        processed_images: job.processed_images || []
      }
    });
  } catch (error) {
    console.error('Get job status error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
    return;
  }
});

// Delete job
router.delete('/jobs/:jobId', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { jobId } = req.params;

    // Get job with images
    const { data: job, error: jobError } = await supabase
      .from('image_jobs')
      .select(`
        id,
        original_image_url,
        processed_images (
          id,
          image_url
        )
      `)
      .eq('id', jobId)
      .eq('user_id', userId)
      .single();

    if (jobError || !job) {
      res.status(404).json({
        success: false,
        message: 'İş bulunamadı'
      });
      return;
    }

    // Delete processed images from storage
    if (job.processed_images) {
      for (const processedImage of job.processed_images) {
        const imagePath = processedImage.image_url.split('/').pop();
        if (imagePath) {
          await deleteFromSupabase(`processed/${imagePath}`);
        }
      }
    }

    // Delete original image from storage
    if (job.original_image_url) {
      const originalPath = job.original_image_url.split('/').pop();
      if (originalPath) {
        await deleteFromSupabase(`originals/${userId}/${originalPath}`);
      }
    }

    // Delete job record (this will cascade delete processed_images)
    const { error: deleteError } = await supabase
      .from('image_jobs')
      .delete()
      .eq('id', jobId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Job deletion error:', deleteError);
      res.status(500).json({
        success: false,
        message: 'İş silinirken hata oluştu'
      });
      return;
    }

    res.json({
      success: true,
      message: 'İş başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
    return;
  }
});

// Webhook endpoint for n8n to update job status
router.post('/webhook/job-complete', async (req: Request, res: Response): Promise<void> => {
  console.log('🎣 [WEBHOOK DEBUG] Received webhook callback from n8n:', {
    body: req.body,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });

  try {
    const { jobId, status, processedImages, error: processingError } = req.body;

    console.log('📋 [WEBHOOK DEBUG] Parsed webhook data:', {
      jobId,
      status,
      processedImagesCount: processedImages?.length || 0,
      processingError
    });

    if (!jobId) {
      console.error('❌ [WEBHOOK DEBUG] Missing jobId in webhook payload');
      res.status(400).json({
        success: false,
        message: 'Job ID gereklidir'
      });
      return;
    }

    console.log('💾 [WEBHOOK DEBUG] Updating job status in database:', {
      jobId,
      newStatus: status || 'failed',
      errorMessage: processingError || null
    });

    // Update job status
    const { error: updateError } = await supabase
      .from('image_jobs')
      .update({ 
        status: status || 'failed',
        error_message: processingError || null
      })
      .eq('id', jobId);

    if (updateError) {
      console.error('❌ [WEBHOOK DEBUG] Job status update error:', updateError);
      res.status(500).json({
        success: false,
        message: 'İş durumu güncellenirken hata oluştu'
      });
      return;
    }

    console.log('✅ [WEBHOOK DEBUG] Job status updated successfully');

    // If successful and has processed images, save them
    if (status === 'completed' && processedImages && processedImages.length > 0) {
      console.log('🖼️ [WEBHOOK DEBUG] Processing completed images:', {
        count: processedImages.length,
        images: processedImages
      });

      const processedImageRecords = processedImages.map((imageUrl: string) => ({
        job_id: jobId,
        image_url: imageUrl
      }));

      const { error: imagesError } = await supabase
        .from('processed_images')
        .insert(processedImageRecords);

      if (imagesError) {
        console.error('❌ [WEBHOOK DEBUG] Processed images save error:', imagesError);
      } else {
        console.log('✅ [WEBHOOK DEBUG] Processed images saved successfully');
      }

      // Send notification to external webhook when processing is completed
      try {
        const externalWebhookUrl = 'https://1qe4j72v.rpcld.net/webhook-test/cd11e789-5e4e-4dda-a86e-e1204e036c82';
        
        const webhookPayload = {
          jobId,
          status: 'completed',
          processedImages,
          timestamp: new Date().toISOString(),
          message: 'Fotoğraf işleme tamamlandı'
        };

        console.log('🚀 [WEBHOOK DEBUG] Sending completion notification to external webhook:', {
          url: externalWebhookUrl,
          jobId,
          payload: webhookPayload
        });

        const webhookResponse = await fetch(externalWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'ResimAI-Backend/1.0'
          },
          body: JSON.stringify(webhookPayload)
        });

        console.log('📡 [WEBHOOK DEBUG] External webhook response:', {
          status: webhookResponse.status,
          statusText: webhookResponse.statusText,
          ok: webhookResponse.ok
        });

        if (webhookResponse.ok) {
          console.log('✅ [WEBHOOK DEBUG] External webhook notification sent successfully for job:', jobId);
        } else {
          console.error('❌ [WEBHOOK DEBUG] External webhook notification failed:', {
            jobId,
            status: webhookResponse.status,
            statusText: webhookResponse.statusText
          });
        }
      } catch (webhookError: unknown) {
        const error = webhookError as Error;
        console.error('💥 [WEBHOOK DEBUG] External webhook notification error:', {
          jobId,
          error: error.message,
          stack: error.stack
        });
        // Don't fail the main request if webhook fails
      }
    } else {
      console.log('ℹ️ [WEBHOOK DEBUG] No processed images to save or status is not completed:', {
        status,
        hasProcessedImages: !!(processedImages && processedImages.length > 0)
      });
    }

    res.json({
      success: true,
      message: 'İş durumu güncellendi'
    });
    return;
  } catch (error: unknown) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
    return;
  }
});

// Callback endpoint for n8n to send processed image results
router.post('/callback', async (req: Request, res: Response): Promise<void> => {
  console.log('🎯 [CALLBACK DEBUG] Received callback from n8n:', {
    body: req.body,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });

  try {
    const { jobId, processedImageUrl, status, error: processingError } = req.body;

    console.log('📋 [CALLBACK DEBUG] Parsed callback data:', {
      jobId,
      processedImageUrl,
      status,
      processingError
    });

    if (!jobId) {
      console.error('❌ [CALLBACK DEBUG] Missing jobId in callback payload');
      res.status(400).json({
        success: false,
        message: 'Job ID gereklidir'
      });
      return;
    }

    // Update job status
    const updateData: any = {
      status: status || 'completed',
      updated_at: new Date().toISOString()
    };

    if (processingError) {
      updateData.error_message = processingError;
      updateData.status = 'failed';
    }

    console.log('💾 [CALLBACK DEBUG] Updating job in database:', {
      jobId,
      updateData
    });

    const { error: updateError } = await supabase
      .from('image_jobs')
      .update(updateData)
      .eq('id', jobId);

    if (updateError) {
      console.error('❌ [CALLBACK DEBUG] Job update error:', updateError);
      res.status(500).json({
        success: false,
        message: 'İş durumu güncellenirken hata oluştu'
      });
      return;
    }

    console.log('✅ [CALLBACK DEBUG] Job updated successfully');

    // If successful and has processed image URL, save it
    if (processedImageUrl && status !== 'failed') {
      console.log('🖼️ [CALLBACK DEBUG] Saving processed image:', {
        jobId,
        processedImageUrl
      });

      const { error: imageError } = await supabase
        .from('processed_images')
        .insert({
          job_id: jobId,
          image_url: processedImageUrl
        });

      if (imageError) {
        console.error('❌ [CALLBACK DEBUG] Processed image save error:', imageError);
      } else {
        console.log('✅ [CALLBACK DEBUG] Processed image saved successfully');
      }
    }

    res.json({
      success: true,
      message: 'Callback işlendi',
      data: {
        jobId,
        status: updateData.status,
        processedImageUrl: processedImageUrl || null
      }
    });
    return;
  } catch (error: unknown) {
    console.error('❌ [CALLBACK DEBUG] Callback processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
    return;
  }
});

export default router;