import { Router, Request, Response } from 'express';
import multer from 'multer';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { supabase } from '../config/supabase.js';
import { auth } from '../middleware/auth.js';
import { uploadToSupabase, deleteFromSupabase } from '../utils/storage.js';
import { 
  validateFileComprehensive,
  generateSecureFilename,
  validateFileMagicNumber,
  validateFileExtension,
  validateAndSanitizePath,
  createSecureUploadDirectory
} from '../utils/fileSecurityUtils.js';
import {
  logFileUploadBlocked,
  logMaliciousFileDetected,
  logPathTraversalAttempt,
  logSecurityScanResult,
  logSystemError
} from '../utils/securityLogger.js';
import { createUploadRateLimit, markUserSuspicious } from '../utils/uploadRateLimit.js';

const router = Router();

// Create upload rate limiting middleware
const uploadRateLimit = createUploadRateLimit();

// Configure multer for secure disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const userId = (req as any).userId;
      const baseUploadPath = path.join(process.cwd(), 'public', 'uploads');
      
      console.log('🔍 [SECURITY] Creating secure upload directory:', {
        userId,
        baseUploadPath
      });
      
      // Create secure user-specific directory
      const secureDirectory = createSecureUploadDirectory(userId, baseUploadPath);
      
      if (!secureDirectory.success) {
        console.error('❌ [SECURITY] Failed to create secure directory:', secureDirectory.error);
        cb(new Error(`Güvenli dizin oluşturulamadı: ${secureDirectory.error}`), '');
        return;
      }
      
      // Validate the directory path
      const pathValidation = validateAndSanitizePath(secureDirectory.directoryPath!, baseUploadPath);
      if (!pathValidation.isValid) {
        console.error('❌ [SECURITY] Directory path validation failed:', pathValidation.error);
        cb(new Error(`Güvenlik: ${pathValidation.error}`), '');
        return;
      }
      
      console.log('✅ [SECURITY] Secure directory created:', secureDirectory.directoryPath);
      cb(null, secureDirectory.directoryPath!);
    } catch (error) {
      console.error('❌ [SECURITY] Directory creation error:', error);
      cb(new Error('Güvenli dizin oluşturma hatası'), '');
    }
  },
  filename: (req, file, cb) => {
    try {
      const userId = (req as any).userId;
      
      console.log('🔍 [SECURITY] Generating secure filename:', {
        userId,
        originalFilename: file.originalname
      });
      
      // Generate secure filename with comprehensive security checks
      const secureFilename = generateSecureFilename(file.originalname, userId);
      
      console.log('✅ [SECURITY] Secure filename generated:', {
        original: file.originalname,
        secure: secureFilename
      });
      
      cb(null, secureFilename);
    } catch (error) {
      console.error('❌ [SECURITY] Filename generation error:', error);
      cb(new Error(`Güvenli dosya adı oluşturulamadı: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`), '');
    }
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB limit (will be validated more strictly later)
    files: 1, // Only one file at a time
    fieldSize: 1024 * 1024, // 1MB field size limit
    fieldNameSize: 100, // Limit field name size
    headerPairs: 20 // Limit number of header pairs
  },
  fileFilter: async (req, file, cb) => {
    try {
      console.log('🔍 [SECURITY] Initial file filter check:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      });
      
      // Basic extension validation
       const extValidation = validateFileExtension(file.originalname);
       if (!extValidation.isValid) {
         console.log('❌ [SECURITY] Extension validation failed:', extValidation.error);
         
         // Log security event
         logFileUploadBlocked({
           userId: (req as any).userId,
           filename: file.originalname,
           reason: `Extension validation failed: ${extValidation.error}`,
           userAgent: req.headers['user-agent'],
           ipAddress: req.ip || req.connection.remoteAddress
         });
         
         cb(new Error(`Güvenlik: ${extValidation.error}`));
         return;
       }
       
       // Basic MIME type check (will be validated more thoroughly later)
       if (!file.mimetype.startsWith('image/')) {
         console.log('❌ [SECURITY] MIME type validation failed:', file.mimetype);
         
         // Log security event
         logFileUploadBlocked({
           userId: (req as any).userId,
           filename: file.originalname,
           reason: `Invalid MIME type: ${file.mimetype}`,
           userAgent: req.headers['user-agent'],
           ipAddress: req.ip || req.connection.remoteAddress
         });
         
         cb(new Error('Güvenlik: Sadece görsel dosyaları yüklenebilir'));
         return;
       }
      
      console.log('✅ [SECURITY] Initial validation passed');
      cb(null, true);
    } catch (error) {
      console.error('❌ [SECURITY] File filter error:', error);
      cb(new Error('Güvenlik doğrulama hatası'));
    }
  }
});

// Simple file upload endpoint (just upload file and return URL)
router.post('/upload', auth, uploadRateLimit, upload.single('image'), async (req: Request, res: Response): Promise<void> => {
  let tempFilePath: string | null = null;
  
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

    tempFilePath = file.path;

    console.log('📤 [UPLOAD] File upload request:', {
      userId,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      localPath: file.path
    });

    // 🔒 COMPREHENSIVE SECURITY VALIDATION
    console.log('🔍 [SECURITY] Starting comprehensive file validation...');
    const securityValidation = await validateFileComprehensive(file.path, file.originalname, userId);
    
    if (!securityValidation.isValid) {
      console.log('❌ [SECURITY] File validation failed:', securityValidation.errors);
      
      // Log comprehensive security scan result
      logSecurityScanResult({
        userId,
        filename: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        threats: securityValidation.errors,
        warnings: securityValidation.warnings
      });
      
      // Check for specific threat types and log accordingly
      const hasPathTraversal = securityValidation.errors.some(error => 
        error.toLowerCase().includes('path') || error.toLowerCase().includes('traversal')
      );
      
      if (hasPathTraversal) {
        logPathTraversalAttempt({
          userId,
          filename: file.originalname,
          attemptedPath: file.path,
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip || req.connection.remoteAddress
        });
      }
      
      const hasMaliciousContent = securityValidation.errors.some(error => 
        error.toLowerCase().includes('malicious') || 
        error.toLowerCase().includes('virus') ||
        error.toLowerCase().includes('threat')
      );
      
      if (hasMaliciousContent) {
         logMaliciousFileDetected({
           userId,
           filename: file.originalname,
           filePath: file.path,
           threats: securityValidation.errors,
           userAgent: req.headers['user-agent'],
           ipAddress: req.ip || req.connection.remoteAddress
         });
         
         // Mark user as suspicious for stricter rate limiting
         const identifier = req.ip || req.connection.remoteAddress || 'unknown';
         markUserSuspicious(identifier, 2 * 60 * 60 * 1000); // 2 hours
         if (userId) {
           markUserSuspicious(userId, 2 * 60 * 60 * 1000); // 2 hours
         }
       }
      
      // Clean up temporary file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      
      res.status(400).json({
        success: false,
        error: 'Güvenlik doğrulaması başarısız',
        details: securityValidation.errors,
        warnings: securityValidation.warnings
      });
      return;
    }
    
    if (securityValidation.warnings && securityValidation.warnings.length > 0) {
      console.log('⚠️ [SECURITY] Validation warnings:', securityValidation.warnings);
    }
    
    console.log('✅ [SECURITY] File validation passed:', {
      detectedMimeType: securityValidation.detectedMimeType,
      secureFilename: securityValidation.secureFilename
    });

    // File is now saved to disk and validated, upload to Supabase Storage
    const fileBuffer = fs.readFileSync(file.path);
    
    // Use secure filename for Supabase path
    const secureFilename = securityValidation.secureFilename || generateSecureFilename(file.originalname, userId);
    const imagePath = `uploads/${userId}/${secureFilename}`;
    
    // Use detected MIME type from security validation
    const validatedMimeType = securityValidation.detectedMimeType || file.mimetype;
    const imageUrl = await uploadToSupabase(fileBuffer, imagePath, validatedMimeType);
    
    // Create local URL for the file (using secure filename)
    const localImageUrl = `/uploads/${secureFilename}`;

    if (!imageUrl) {
      // Clean up temporary file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      
      res.status(500).json({
        success: false,
        error: 'Görsel yüklenirken hata oluştu'
      });
      return;
    }

    // Clean up temporary file after successful upload
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
      tempFilePath = null;
    }

    console.log('✅ [UPLOAD] File uploaded successfully:', {
      userId,
      originalFilename: file.originalname,
      secureFilename,
      detectedMimeType: validatedMimeType,
      supabaseUrl: imageUrl.substring(0, 50) + '...',
      localUrl: localImageUrl
    });

    // Return both URLs with security info
    res.status(200).json({
      success: true,
      url: imageUrl, // Supabase URL for n8n workflow
      localUrl: localImageUrl, // Local URL for serving
      secureFilename,
      detectedMimeType: validatedMimeType,
      message: 'Görsel başarıyla yüklendi ve güvenlik doğrulaması tamamlandı',
      warnings: securityValidation.warnings
    });
  } catch (error) {
    console.error('❌ [UPLOAD] Upload error:', error);
    
    // Log system error
    logSystemError({
      error: error instanceof Error ? error : new Error('Unknown upload error'),
      context: 'FILE_UPLOAD',
      userId: (req as any).userId,
      filename: req.file?.originalname
    });
    
    // Clean up temporary file on error
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.error('❌ [CLEANUP] Failed to clean up temp file:', cleanupError);
        
        // Log cleanup error
        logSystemError({
          error: cleanupError instanceof Error ? cleanupError : new Error('Cleanup failed'),
          context: 'FILE_CLEANUP',
          userId: (req as any).userId,
          filename: req.file?.originalname
        });
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
    return;
  }
});

// End of processUploadRequest function

// Upload and process image (original endpoint renamed)
router.post('/upload-and-process', auth, uploadRateLimit, async (req: Request, res: Response): Promise<void> => {
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
  let tempFilePath: string | null = null;
  
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
    // Handle both multipart form data and JSON requests
    const isMultipart = req.headers['content-type']?.includes('multipart/form-data');
    
    let style: string | undefined;
    let imageUrl: string | undefined;
    
    // Backend Category Parsing - undefined olarak başlat
    let category: string | undefined = undefined;
    
    if (isMultipart) {
      // For multipart requests, data comes from req.body (parsed by multer)
      style = req.body.style;
      imageUrl = req.body.imageUrl;
      const receivedCategory = req.body.category;
      
      // Güvenli kategori kontrolü - string 'undefined' ve boş değerleri kontrol et
      if (receivedCategory && 
          receivedCategory !== 'undefined' && 
          receivedCategory !== 'null' && 
          receivedCategory.trim() !== '' && 
          receivedCategory.trim() !== 'undefined') {
        category = receivedCategory.trim();
        console.log('✅ [MULTIPART CATEGORY] Valid category received:', category);
      } else {
        console.log('🚨 [MULTIPART CATEGORY FIX] Invalid category received, will use Avatar. Received:', receivedCategory);
      }
    } else {
      // For JSON requests, data comes from req.body
      const bodyData = req.body;
      style = bodyData.style;
      imageUrl = bodyData.imageUrl;
      const receivedCategory = bodyData.category;
      
      // Güvenli kategori kontrolü - string 'undefined' ve boş değerleri kontrol et
      if (receivedCategory && 
          receivedCategory !== 'undefined' && 
          receivedCategory !== 'null' && 
          receivedCategory.trim() !== '' && 
          receivedCategory.trim() !== 'undefined') {
        category = receivedCategory.trim();
        console.log('✅ [JSON CATEGORY] Valid category received:', category);
      } else {
        console.log('🚨 [JSON CATEGORY FIX] Invalid category received, will use Avatar. Received:', receivedCategory);
      }
    }
    
    const file = req.file;
    if (file) {
      tempFilePath = file.path;
    }

    console.log('🚀 [UPLOAD-AND-PROCESS] Request received:', {
      userId,
      style,
      imageUrl,
      category,
      isMultipart,
      fileName: file?.originalname,
      fileSize: file?.size,
      bodyKeys: Object.keys(req.body || {}),
      body: req.body
    });
    
    // CRITICAL DEBUG: Category parsing analysis
    console.log('🔍 [CATEGORY DEBUG] Detailed category analysis:', {
      'req.body.category': req.body.category,
      'category variable': category,
      'category type': typeof category,
      'category length': category ? category.length : 0,
      'category === undefined': category === undefined,
      'category === "undefined"': category === 'undefined',
      'isMultipart': isMultipart,
      'req.body keys': Object.keys(req.body || {}),
      'req.body values': Object.values(req.body || {})
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

    if (!style) {
      console.log('❌ [UPLOAD-AND-PROCESS] Missing parameters:', { style });
      res.status(400).json({
        success: false,
        message: 'Stil gereklidir'
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

    // Category lookup removed - using style-based processing only

    let originalImageUrl: string | null = null;
    let originalImagePath: string | null = null;

    if (file) {
      // 🔒 COMPREHENSIVE SECURITY VALIDATION FOR FILE UPLOAD
      console.log('🔍 [SECURITY] Starting comprehensive file validation for processing...');
      const securityValidation = await validateFileComprehensive(file.path, file.originalname, userId);
      
      if (!securityValidation.isValid) {
        console.log('❌ [SECURITY] File validation failed:', securityValidation.errors);
        
        // Clean up temporary file
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        
        res.status(400).json({
          success: false,
          message: 'Güvenlik doğrulaması başarısız',
          details: securityValidation.errors,
          warnings: securityValidation.warnings
        });
        return;
      }
      
      if (securityValidation.warnings && securityValidation.warnings.length > 0) {
        console.log('⚠️ [SECURITY] Validation warnings:', securityValidation.warnings);
      }
      
      console.log('✅ [SECURITY] File validation passed for processing:', {
        detectedMimeType: securityValidation.detectedMimeType,
        secureFilename: securityValidation.secureFilename
      });
      
      // Handle file upload - read from disk since we're using disk storage
      const fileBuffer = fs.readFileSync(file.path);
      
      // Use secure filename for Supabase path
      const secureFilename = securityValidation.secureFilename || generateSecureFilename(file.originalname, userId);
      originalImagePath = `originals/${userId}/${secureFilename}`;
      
      // Use detected MIME type from security validation
      const validatedMimeType = securityValidation.detectedMimeType || file.mimetype;
      originalImageUrl = await uploadToSupabase(fileBuffer, originalImagePath, validatedMimeType);
      
      console.log('📁 [UPLOAD-AND-PROCESS] File processed with security validation:', {
        originalFilename: file.originalname,
        secureFilename,
        detectedMimeType: validatedMimeType,
        localPath: file.path,
        supabasePath: originalImagePath,
        supabaseUrl: originalImageUrl?.substring(0, 50) + '...'
      });
      
      // Clean up temporary file after successful upload
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        tempFilePath = null;
      }
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
        category_type: style, // Add required category_type field
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

    // Send webhook notification
    await sendWebhook({
      imageUrl: originalImageUrl || '',
      category: category || 'Avatar',
      style: style || 'Professional',
      userId: userId,
      jobId: imageJob.id
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
    
    // Clean up temporary file on error
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
        console.log('🧹 [CLEANUP] Temporary file cleaned up after error:', tempFilePath);
      } catch (cleanupError) {
        console.error('❌ [CLEANUP] Failed to clean up temp file:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined,
      timestamp: new Date().toISOString()
    });
    return;
  }
}

// 🚨 TAMAMEN YENİDEN YAZILDI: Generate dynamic prompt based on category and style
const generatePrompt = (category: string, style: string): string => {
  // Güvenli kategori ve style kontrolü
  const safeCategory = category && category !== 'undefined' && category.trim() !== '' ? category : 'Avatar';
  const safeStyle = style && style !== 'undefined' && style.trim() !== '' ? style : 'Professional';
  
  console.log('🔍 [GENERATE PROMPT] Safe values:', { 
    originalCategory: category, 
    originalStyle: style,
    safeCategory, 
    safeStyle 
  });
  
  // admin-settings.json okuma garantisi
  try {
    const settingsPath = path.join(process.cwd(), 'admin-settings.json');
    
    // Dosya varlığı kontrolü
    if (!fs.existsSync(settingsPath)) {
      console.error('❌ [GENERATE PROMPT] admin-settings.json not found, using ultimate fallback');
      return getUltimateFallbackPrompt(safeCategory, safeStyle);
    }
    
    const settingsData = fs.readFileSync(settingsPath, 'utf8');
    const settings = JSON.parse(settingsData);
    const aiPrompts = settings.aiPrompts;
    
    console.log('🔍 [GENERATE PROMPT] aiPrompts loaded:', {
      exists: !!aiPrompts,
      categories: aiPrompts ? Object.keys(aiPrompts) : [],
      targetCategory: safeCategory,
      targetStyle: safeStyle
    });
    
    // Öncelik 1: Tam eşleşme (kategori + style)
    if (aiPrompts && aiPrompts[safeCategory] && aiPrompts[safeCategory][safeStyle]) {
      const prompt = aiPrompts[safeCategory][safeStyle];
      console.log('✅ [GENERATE PROMPT] Perfect match found:', {
        category: safeCategory,
        style: safeStyle,
        promptLength: prompt.length,
        promptPreview: prompt.substring(0, 100) + '...'
      });
      return prompt;
    }
    
    // Öncelik 2: Aynı kategoride farklı style ara
    if (aiPrompts && aiPrompts[safeCategory]) {
      const categoryStyles = Object.keys(aiPrompts[safeCategory]);
      if (categoryStyles.length > 0) {
        const firstAvailableStyle = categoryStyles[0];
        const prompt = aiPrompts[safeCategory][firstAvailableStyle];
        console.log('✅ [GENERATE PROMPT] Category match with different style:', {
          category: safeCategory,
          requestedStyle: safeStyle,
          usedStyle: firstAvailableStyle,
          promptPreview: prompt.substring(0, 100) + '...'
        });
        return prompt;
      }
    }
    
    // Öncelik 3: Farklı kategoride aynı style ara
    for (const categoryName of Object.keys(aiPrompts)) {
      if (aiPrompts[categoryName] && aiPrompts[categoryName][safeStyle]) {
        const prompt = aiPrompts[categoryName][safeStyle];
        console.log('✅ [GENERATE PROMPT] Style match in different category:', {
          requestedCategory: safeCategory,
          foundCategory: categoryName,
          style: safeStyle,
          promptPreview: prompt.substring(0, 100) + '...'
        });
        return prompt;
      }
    }
    
    console.warn('⚠️ [GENERATE PROMPT] No matches found in admin-settings.json, using ultimate fallback');
    return getUltimateFallbackPrompt(safeCategory, safeStyle);
    
  } catch (error) {
    console.error('❌ [GENERATE PROMPT] Critical error:', {
      error: error instanceof Error ? error.message : error,
      category: safeCategory,
      style: safeStyle
    });
    return getUltimateFallbackPrompt(safeCategory, safeStyle);
  }
}

// 🚨 ULTIMATE FALLBACK: Kesin çalışacak prompt sistemi
function getUltimateFallbackPrompt(category: string, style: string): string {
  console.log('🚨 [ULTIMATE FALLBACK] Generating guaranteed prompt for:', { category, style });
  
  // Kategori-style kombinasyonları için kesin prompt'lar
  const guaranteedPrompts: { [key: string]: { [key: string]: string } } = {
    'Avatar': {
      'Cartoon': 'Transform the person into a vibrant cartoon-style avatar with exaggerated facial features, bright cartoon colors, simplified geometric shapes, large expressive eyes, and smooth animated textures. Apply a cel-shaded effect with bold outlines.',
      'Realistic': 'Create a high-quality realistic digital avatar that preserves all natural human features and proportions with enhanced detail. Improve skin texture, add subtle lighting effects, maintain authentic facial expressions.',
      'Anime': 'Transform the person into an anime-style avatar with characteristic large eyes, stylized facial features, vibrant hair colors, and typical anime aesthetic. Apply smooth shading and bright, saturated colors.',
      'Professional': 'Transform this person into a professional business portrait with formal attire, clean background, and confident pose suitable for corporate use.',
      'Fantasy': 'Transform the person into an enchanting fantasy avatar with magical elements such as glowing eyes, ethereal lighting effects, mystical aura, and otherworldly atmospheric effects.'
    },
    'Corporate': {
      'Professional': 'Put the person in a traditional office environment with classic wooden furniture and formal atmosphere. Also, make sure they wear a classic business suit with traditional styling and conservative colors.',
      'Business Casual': 'Put the person in a modern tech office environment with glass walls, contemporary furniture, and innovative workspace design. Also, make sure they wear a sleek contemporary business suit.',
      'Executive': 'Put the person in a very formal corporate boardroom environment with mahogany furniture and executive atmosphere. Also, make sure they wear a strictly formal business suit.'
    },
    'Skincare': {
      'Natural': 'Apply professional natural skin enhancement: subtly even out skin tone, reduce minor blemishes while preserving natural texture and pores, enhance the skin\'s inherent glow.',
      'Glowing': 'Transform the skin with a luminous, radiant glow: enhance natural skin luminosity, add subtle highlighting to cheekbones and high points of the face.',
      'Flawless': 'Create flawless, magazine-quality skin with professional retouching: smooth out all imperfections, minimize pores, even skin tone completely.'
    }
  };
  
  // Tam eşleşme kontrolü
  if (guaranteedPrompts[category] && guaranteedPrompts[category][style]) {
    const prompt = guaranteedPrompts[category][style];
    console.log('✅ [ULTIMATE FALLBACK] Perfect match:', { category, style, promptLength: prompt.length });
    return prompt;
  }
  
  // Kategori eşleşmesi
  if (guaranteedPrompts[category]) {
    const availableStyles = Object.keys(guaranteedPrompts[category]);
    const firstStyle = availableStyles[0];
    const prompt = guaranteedPrompts[category][firstStyle];
    console.log('✅ [ULTIMATE FALLBACK] Category match:', { category, requestedStyle: style, usedStyle: firstStyle });
    return prompt;
  }
  
  // Son çare: Avatar Cartoon (en zengin prompt)
  const finalPrompt = guaranteedPrompts['Avatar']['Cartoon'];
  console.log('🚨 [ULTIMATE FALLBACK] Final resort - Avatar Cartoon:', { category, style });
  return finalPrompt;
}



// Generate dynamic prompt function ends here

// Process endpoint removed - using only upload-and-process

// Simple webhook function
async function sendWebhook(data: {
  imageUrl: string;
  category: string;
  style: string;
  userId: string;
  jobId: string;
}): Promise<void> {
  try {
    // Get webhook URL from admin-settings.json
    let webhookUrl = 'https://1qe4j72v.rpcld.net/webhook/cd11e789-5e4e-4dda-a86e-e1204e036c82';
    
    try {
      const settingsPath = path.join(process.cwd(), 'admin-settings.json');
      const settingsData = fs.readFileSync(settingsPath, 'utf8');
      const settings = JSON.parse(settingsData);
      webhookUrl = settings.n8n?.webhookUrl || webhookUrl;
    } catch (error) {
      console.log('Using fallback webhook URL');
    }
    
    // Generate prompt
    const prompt = generatePrompt(data.category, data.style);
    
    // Create webhook parameters
    const params = new URLSearchParams();
    params.set('query[imageUrl]', data.imageUrl);
    params.set('query[category]', data.category);
    params.set('query[style]', data.style);
    params.set('query[prompt]', prompt);
    params.set('query[userId]', data.userId);
    params.set('query[jobId]', data.jobId);
    
    console.log('Sending webhook:', {
      category: data.category,
      style: data.style,
      jobId: data.jobId
    });
    
    // Send webhook
    const response = await fetch(`${webhookUrl}?${params.toString()}`, {
      method: 'GET'
    });
    
    console.log('Webhook sent:', response.status);
    
  } catch (error) {
    console.error('Webhook error:', error);
    // Don't throw error - continue processing
  }
}

// Webhook test endpoint removed

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
