import { Router, Request, Response } from 'express';
import multer from 'multer';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
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

// End of processUploadRequest function

// Upload and process image (original endpoint renamed)
router.post('/upload-and-process', auth, async (req: Request, res: Response): Promise<void> => {
  // Handle both multipart/form-data and JSON requests
  const isMultipart = req.headers['content-type']?.includes('multipart/form-data');
  
  if (isMultipart) {
    // Use multer for multipart requests
    upload.single('image')(req, res, async (err) => {
      if (err) {
        console.error('❌ [UPLOAD-AND-PROCESS] Multer error:', err);
        res.status(400).json({
          success: false,
          message: err.message
        });
        return;
      }
      await processUploadRequest(req, res);
    });
  } else {
    // Handle JSON requests directly
    await processUploadRequest(req, res);
  }
});

// Extracted processing logic
async function processUploadRequest(req: Request, res: Response): Promise<void> {
  console.log('🔥 [UPLOAD-AND-PROCESS] ENDPOINT HIT - Request received:', {
    method: req.method,
    url: req.url,
    headers: {
      'content-type': req.headers['content-type'],
      'authorization': req.headers.authorization ? 'Bearer ***' : 'None',
      'user-agent': req.headers['user-agent']
    },
    bodyKeys: Object.keys(req.body || {}),
    hasFile: !!req.file,
    timestamp: new Date().toISOString()
  });
  try {
    const userId = (req as any).userId;
    const { category, categoryType, style, imageUrl } = req.body;
    const file = req.file;

    console.log('🚀 [UPLOAD-AND-PROCESS] Request received:', {
      userId,
      category,
      categoryType,
      style,
      imageUrl,
      fileName: file?.originalname,
      fileSize: file?.size,
      body: req.body
    });

    // Check if either file or imageUrl is provided
    if (!file && !imageUrl) {
      console.log('❌ [UPLOAD-AND-PROCESS] No file or imageUrl provided');
      res.status(400).json({
        success: false,
        message: 'Görsel dosyası veya URL gereklidir'
      });
      return;
    }

    // Use category parameter (frontend sends 'category', not 'categoryType')
    const categoryParam = category || categoryType;
    if (!categoryParam || !style) {
      console.log('❌ [UPLOAD-AND-PROCESS] Missing parameters:', { category, categoryType, style });
      res.status(400).json({
        success: false,
        message: 'Kategori ve stil gereklidir'
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
    console.log('🔍 [UPLOAD-AND-PROCESS] Looking for category:', categoryParam);
    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('name', categoryParam)
      .eq('is_active', true)
      .single();

    if (categoryError || !categoryData) {
      console.log('❌ [UPLOAD-AND-PROCESS] Category not found:', { categoryParam, error: categoryError });
      res.status(404).json({
        success: false,
        message: 'Kategori bulunamadı'
      });
      return;
    }

    console.log('✅ [UPLOAD-AND-PROCESS] Category found:', categoryData);

    let originalImageUrl: string | null = null;
    let originalImagePath: string | null = null;

    if (file) {
      // Handle file upload
      originalImagePath = `originals/${userId}/${Date.now()}-${file.originalname}`;
      originalImageUrl = await uploadToSupabase(file.buffer, originalImagePath, file.mimetype);
    } else if (imageUrl) {
      // Handle URL upload - download and upload to Supabase
      console.log('📥 [UPLOAD-AND-PROCESS] Downloading image from URL:', imageUrl);
      try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const buffer = Buffer.from(await response.arrayBuffer());
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const extension = contentType.split('/')[1] || 'jpg';
        originalImagePath = `originals/${userId}/${Date.now()}-url-image.${extension}`;
        
        originalImageUrl = await uploadToSupabase(buffer, originalImagePath, contentType);
        console.log('✅ [UPLOAD-AND-PROCESS] Image downloaded and uploaded:', originalImageUrl?.substring(0, 50) + '...');
      } catch (error) {
        console.error('❌ [UPLOAD-AND-PROCESS] Error downloading image from URL:', error);
        res.status(400).json({
          success: false,
          message: 'URL\'den görsel indirilemedi. Lütfen geçerli bir görsel URL\'si girin.'
        });
        return;
      }
    }

    if (!originalImageUrl) {
      res.status(500).json({
        success: false,
        message: 'Görsel yüklenirken hata oluştu'
      });
      return;
    }

    // Create image job record
    console.log('💾 [UPLOAD-AND-PROCESS] Creating image job record');
    const { data: imageJob, error: jobError } = await supabase
      .from('image_jobs')
      .insert({
        user_id: userId,
        category_id: categoryData.id,
        category_type: categoryParam,
        style_type: style,
        style: style,
        original_image_url: originalImageUrl,
        status: 'processing'
      })
      .select()
      .single();

    console.log('📝 [UPLOAD-AND-PROCESS] Image job created:', imageJob?.id);

    if (jobError) {
      console.error('Image job creation error:', jobError);
      // Clean up uploaded image
      if (originalImagePath) {
        await deleteFromSupabase(originalImagePath);
      }
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
    const dynamicPrompt = generatePrompt(categoryParam, style);
    
    // Send direct webhook request (bypass n8n)
    console.log('🎯 [UPLOAD DEBUG] Sending direct webhook request to external URL:', {
      jobId: imageJob.id,
      imageUrl: originalImageUrl?.substring(0, 50) + '...',
      category: categoryParam,
      style,
      userId,
      prompt: dynamicPrompt
    });

    // Get webhook URL from admin-settings.json
    let webhookUrl = 'https://1qe4j72v.rpcld.net/webhook/cd11e789-5e4e-4dda-a86e-e1204e036c82'; // fallback
    try {
      const settingsPath = path.join(process.cwd(), 'admin-settings.json');
      const settingsData = fs.readFileSync(settingsPath, 'utf8');
      const settings = JSON.parse(settingsData);
      webhookUrl = settings.n8n?.webhookUrl || webhookUrl;
      console.log('🔗 [WEBHOOK URL] Using webhook URL from admin-settings:', webhookUrl);
    } catch (error) {
      console.warn('⚠️ [WEBHOOK URL] Could not read admin-settings.json, using fallback URL:', error);
    }
    
    // Send POST request to external webhook with JSON body format for FAL AI
    const webhookPayload = {
      imageUrl: originalImageUrl || '',
      category: categoryParam,
      style: style,
      prompt: dynamicPrompt,
      userId: userId,
      jobId: imageJob.id.toString(),
      image_url: originalImageUrl || '', // FAL AI expects this field
      // Additional FAL AI parameters
      strength: 0.8,
      guidance_scale: 7.5,
      num_inference_steps: 50
    };
    
    console.log('🔍 [WEBHOOK DEBUG] Full payload being sent to N8N:', {
      url: webhookUrl,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      payload: webhookPayload,
      payloadString: JSON.stringify(webhookPayload, null, 2)
    });
    
    fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookPayload)
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
    console.error('❌ [UPLOAD-AND-PROCESS] CRITICAL ERROR:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      userId: (req as any).userId,
      body: req.body,
      file: req.file ? {
        name: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      } : 'No file',
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined,
      timestamp: new Date().toISOString()
    });
    return;
  }
}

// Generate dynamic prompt based on category and style - synchronized with AdminSettings
const generatePrompt = (category: string, style: string): string => {
  // Load prompts from admin-settings.json
  try {
    const settingsPath = path.join(process.cwd(), 'admin-settings.json');
    const settingsData = fs.readFileSync(settingsPath, 'utf8');
    const settings = JSON.parse(settingsData);
    
    const aiPrompts = settings.aiPrompts;
    if (aiPrompts && aiPrompts[category] && aiPrompts[category][style]) {
      return aiPrompts[category][style];
    }
  } catch (error) {
    console.warn('⚠️ [PROMPT] Could not read admin-settings.json, using fallback prompts:', error);
  }

  // Fallback prompts if admin-settings.json is not available
  const fallbackPrompts: { [key: string]: { [key: string]: string } } = {
    'Corporate': {
      'Professional': 'Put the person in a traditional office environment with classic wooden furniture and formal atmosphere. Also, make sure they wear a classic business suit with traditional styling and conservative colors.',
      'Business Casual': 'Put the person in a modern tech office environment with glass walls, contemporary furniture, and innovative workspace design. Also, make sure they wear a sleek contemporary business suit with modern cut and trendy styling.',
      'Executive': 'Put the person in a very formal corporate boardroom environment with mahogany furniture and executive atmosphere. Also, make sure they wear a strictly formal business suit with conservative styling, tie, and traditional corporate appearance.'
    },
    'Skincare': {
      'Natural': 'Apply professional natural skin enhancement: subtly even out skin tone, reduce minor blemishes while preserving natural texture and pores, enhance the skin\'s inherent glow with soft lighting, and maintain authentic skin characteristics. Focus on healthy, realistic improvements that look naturally beautiful.',
      'Glowing': 'Transform the skin with a luminous, radiant glow: enhance natural skin luminosity, add subtle highlighting to cheekbones and high points of the face, create a healthy dewy finish, boost overall skin radiance with warm golden undertones, and apply professional-grade skin brightening effects for a vibrant, youthful appearance.',
      'Flawless': 'Create flawless, magazine-quality skin with professional retouching: smooth out all imperfections, minimize pores, even skin tone completely, remove blemishes and fine lines, and apply subtle contouring for a polished, airbrushed finish while keeping facial features natural.'
    }
  };

  return fallbackPrompts[category]?.[style] || 'professional portrait, high quality, studio lighting';
};

// Process image endpoint (simplified - no webhook call)
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
    
    // Return success response without webhook call
    res.status(200).json({
      success: true,
      message: 'Fotoğraf işleme başlatıldı',
      data: {
        imageUrl,
        category,
        style,
        prompt: dynamicPrompt,
        userId,
        status: 'processing'
      }
    });
    
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
    
    // Get webhook URL from admin-settings.json
    let webhookUrl = 'https://1qe4j72v.rpcld.net/webhook/cd11e789-5e4e-4dda-a86e-e1204e036c82'; // fallback
    try {
      const settingsPath = path.join(process.cwd(), 'admin-settings.json');
      const settingsData = fs.readFileSync(settingsPath, 'utf8');
      const settings = JSON.parse(settingsData);
      webhookUrl = settings.n8n?.webhookUrl || webhookUrl;
      console.log('🔗 [WEBHOOK TEST] Using webhook URL from admin-settings:', webhookUrl);
    } catch (error) {
      console.warn('⚠️ [WEBHOOK TEST] Could not read admin-settings.json, using fallback URL:', error);
    }
    const webhookData = {
      imageUrl: imageUrl || '',
      category: 'test',
      style: 'test',
      prompt: 'Test webhook request',
      userId: 'test-user'
    };
    
    console.log('🚀 [WEBHOOK TEST] Harici webhook\'a GET isteği gönderiliyor:', webhookUrl);
    
    const webhookParams = new URLSearchParams({
      'query[imageUrl]': String(webhookData.imageUrl || ''),
      'query[category]': String(webhookData.category),
      'query[style]': String(webhookData.style),
      'query[prompt]': String(webhookData.prompt),
      'query[userId]': String(webhookData.userId)
    });
    
    const response = await fetch(`${webhookUrl}?${webhookParams.toString()}`, {
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
        category_id,
        category_type,
        style,
        status,
        original_image_url,
        created_at,
        categories (
          id,
          name,
          display_name_tr,
          type
        ),
        processed_images (
          id,
          image_url,
          thumbnail_url,
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
      data: {
        jobs: jobs || []
      }
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
        category_id,
        category_type,
        style,
        status,
        original_image_url,
        created_at,
        categories (
          id,
          name,
          display_name_tr,
          type
        ),
        processed_images (
          id,
          image_url,
          thumbnail_url,
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
          thumbnail_url,
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
        const externalWebhookUrl = 'https://1qe4j72v.rpcld.net/webhook/cd11e789-5e4e-4dda-a86e-e1204e036c82';
        
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

// N8n result callback endpoint - handles the specific format from n8n workflow
router.post('/n8n-result', async (req: Request, res: Response): Promise<void> => {
  console.log('🎯 [N8N-RESULT] Received result from n8n workflow:', {
    body: req.body,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });

  try {
    // Extract jobId from query parameters or headers
    const jobId = req.query.jobId || req.headers['x-job-id'];
    const resultData = req.body;

    console.log('📋 [N8N-RESULT] Parsed n8n result data:', {
      jobId,
      resultData
    });

    if (!jobId) {
      console.error('❌ [N8N-RESULT] Missing jobId in request');
      res.status(400).json({
        success: false,
        message: 'Job ID gereklidir'
      });
      return;
    }

    // Parse n8n result format - handle both old and new formats
    let processedImageUrl = null;
    let imageWidth = null;
    let imageHeight = null;
    let prompt = null;

    // Handle direct object format: { "images": "url", "width": 880, "height": 1184, "prompt": "..." }
    if (resultData && typeof resultData === 'object' && !Array.isArray(resultData)) {
      processedImageUrl = resultData.images || resultData.image_url || resultData.processedImageUrl;
      imageWidth = resultData.width || resultData.imageWidth;
      imageHeight = resultData.height || resultData.imageHeight;
      prompt = resultData.prompt;
    }
    // Handle array format: [{ "images": [{ "url": "...", "width": 880, "height": 1184 }], "prompt": "..." }]
    else if (Array.isArray(resultData) && resultData.length > 0) {
      const firstResult = resultData[0];
      if (firstResult.images && Array.isArray(firstResult.images) && firstResult.images.length > 0) {
        const firstImage = firstResult.images[0];
        processedImageUrl = firstImage.url;
        imageWidth = firstImage.width;
        imageHeight = firstImage.height;
        prompt = firstResult.prompt;
      } else if (firstResult.images && typeof firstResult.images === 'string') {
        // Handle case where images is a direct URL string
        processedImageUrl = firstResult.images;
        imageWidth = firstResult.width;
        imageHeight = firstResult.height;
        prompt = firstResult.prompt;
      }
    }

    console.log('🖼️ [N8N-RESULT] Extracted image data:', {
      processedImageUrl,
      imageWidth,
      imageHeight,
      prompt
    });

    if (!processedImageUrl) {
      console.error('❌ [N8N-RESULT] No processed image URL found in n8n result');
      
      // Update job status to failed
      await supabase
        .from('image_jobs')
        .update({
          status: 'failed',
          error_message: 'N8n sonucunda işlenmiş görsel bulunamadı',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      res.status(400).json({
        success: false,
        message: 'İşlenmiş görsel bulunamadı'
      });
      return;
    }

    // Update job status to completed
    console.log('💾 [N8N-RESULT] Updating job status to completed:', { jobId });
    
    const { error: updateError } = await supabase
      .from('image_jobs')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    if (updateError) {
      console.error('❌ [N8N-RESULT] Job update error:', updateError);
      res.status(500).json({
        success: false,
        message: 'İş durumu güncellenirken hata oluştu'
      });
      return;
    }

    console.log('✅ [N8N-RESULT] Job status updated successfully');

    // Save processed image
    console.log('🖼️ [N8N-RESULT] Saving processed image:', {
      jobId,
      processedImageUrl,
      imageWidth,
      imageHeight
    });

    const { error: imageError } = await supabase
      .from('processed_images')
      .insert({
        job_id: jobId,
        image_url: processedImageUrl,
        width: imageWidth,
        height: imageHeight,
        prompt: prompt
      });

    if (imageError) {
      console.error('❌ [N8N-RESULT] Processed image save error:', imageError);
      res.status(500).json({
        success: false,
        message: 'İşlenmiş görsel kaydedilirken hata oluştu'
      });
      return;
    }

    console.log('✅ [N8N-RESULT] Processed image saved successfully');

    res.json({
      success: true,
      message: 'N8n sonucu başarıyla işlendi',
      data: {
        jobId,
        status: 'completed',
        processedImageUrl,
        imageWidth,
        imageHeight,
        prompt
      }
    });
    return;
  } catch (error: unknown) {
    console.error('❌ [N8N-RESULT] N8n result processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
    return;
  }
});

// Delete job endpoint
router.delete('/jobs/:jobId', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { jobId } = req.params;

    console.log('🗑️ [DELETE] Delete job request:', { userId, jobId });

    // Check if job exists and belongs to user
    const { data: job, error: jobError } = await supabase
      .from('image_jobs')
      .select('id, user_id')
      .eq('id', jobId)
      .eq('user_id', userId)
      .single();

    if (jobError || !job) {
      console.log('❌ [DELETE] Job not found or access denied:', { jobId, userId });
      res.status(404).json({
        success: false,
        error: 'İş bulunamadı veya erişim reddedildi'
      });
      return;
    }

    // Delete processed images first
    const { error: imagesError } = await supabase
      .from('processed_images')
      .delete()
      .eq('job_id', jobId);

    if (imagesError) {
      console.error('❌ [DELETE] Error deleting processed images:', imagesError);
      res.status(500).json({
        success: false,
        error: 'İşlenmiş görseller silinirken hata oluştu'
      });
      return;
    }

    // Delete the job
    const { error: deleteError } = await supabase
      .from('image_jobs')
      .delete()
      .eq('id', jobId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('❌ [DELETE] Error deleting job:', deleteError);
      res.status(500).json({
        success: false,
        error: 'İş silinirken hata oluştu'
      });
      return;
    }

    console.log('✅ [DELETE] Job deleted successfully:', { jobId });

    res.json({
      success: true,
      message: 'İş başarıyla silindi'
    });
    return;
  } catch (error) {
    console.error('❌ [DELETE] Delete job error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
    return;
  }
});



export default router;
