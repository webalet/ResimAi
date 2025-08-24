

import express, { type Request, type Response, type NextFunction }  from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';

// for esm mode
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// load env
dotenv.config();

const app: express.Application = express();

// CORS configuration
app.use(cors({
  origin: [
    'https://64.226.75.76',
    'https://64.226.75.76'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from public directory
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));
app.use(express.static(path.join(process.cwd(), 'public')));

// Supabase config
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration');
}

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(supabaseUrl, supabaseKey);

// Auth middleware
const auth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Token gereklidir'
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
    (req as any).userId = decoded.userId;
    (req as any).userEmail = decoded.email;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Geçersiz token'
    });
    return;
  }
};

// Admin auth middleware
const adminAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Token gereklidir'
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', decoded.userId)
      .single();

    if (!user?.is_admin) {
      res.status(403).json({
        success: false,
        message: 'Admin yetkisi gereklidir'
      });
      return;
    }

    (req as any).userId = decoded.userId;
    (req as any).userEmail = decoded.email;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Geçersiz token'
    });
    return;
  }
};

// Multer config for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

/**
 * AUTH ROUTES
 */

// Register
app.post('/api/auth/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Tüm alanlar gereklidir'
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Şifre en az 6 karakter olmalıdır'
      });
      return;
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'Bu e-posta adresi zaten kullanılıyor'
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name,
        email,
        password_hash: hashedPassword,
        credits: 1 // Free trial credit for new users
      })
      .select('id, name, email, credits, created_at')
      .single();

    if (error) {
      console.error('User creation error:', error);
      res.status(500).json({
        success: false,
        message: 'Kullanıcı oluşturulurken hata oluştu'
      });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        user,
        token
      },
      message: 'Hesap başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
    return;
  }
});

// Login
app.post('/api/auth/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'E-posta ve şifre gereklidir'
      });
      return;
    }

    // Get user with password
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, password_hash, credits, created_at')
      .eq('email', email)
      .single();

    if (error || !user) {
      res.status(401).json({
        success: false,
        message: 'Geçersiz e-posta veya şifre'
      });
      return;
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        message: 'Geçersiz e-posta veya şifre'
      });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Remove password from response
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      },
      message: 'Giriş başarılı'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
    return;
  }
});

// Get current user
app.get('/api/auth/me', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, credits, created_at')
      .eq('id', userId)
      .single();

    if (error || !user) {
      res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
      return;
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
    return;
  }
});

/**
 * CATEGORIES ROUTES
 */

// Get all categories
app.get('/api/categories', async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Categories fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Kategoriler yüklenirken hata oluştu'
      });
      return;
    }

    res.json({
      success: true,
      data: { categories: categories || [] }
    });
  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
    return;
  }
});

/**
 * IMAGES ROUTES
 */

// Process image
app.post('/api/images/process', auth, upload.single('image'), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { style } = req.body;
    const imageFile = req.file;

    if (!imageFile) {
      res.status(400).json({
        success: false,
        message: 'Resim dosyası gereklidir'
      });
      return;
    }

    if (!style) {
      res.status(400).json({
        success: false,
        message: 'Stil seçimi gereklidir'
      });
      return;
    }

    // Check user credits
    const { data: user } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();

    if (!user || user.credits < 1) {
      res.status(400).json({
        success: false,
        message: 'Yetersiz kredi'
      });
      return;
    }

    // Create image job
    const { data: job, error: jobError } = await supabase
      .from('image_jobs')
      .insert({
        user_id: userId,
        style,
        status: 'processing'
      })
      .select()
      .single();

    if (jobError) {
      console.error('Job creation error:', jobError);
      res.status(500).json({
        success: false,
        message: 'İş oluşturulurken hata oluştu'
      });
      return;
    }

    // Deduct credit
    await supabase
      .from('users')
      .update({ credits: user.credits - 1 })
      .eq('id', userId);

    // Record credit usage
    await supabase
      .from('credits_usage')
      .insert({
        user_id: userId,
        credits_used: 1,
        operation_type: 'image_processing'
      });

    res.json({
      success: true,
      data: { job },
      message: 'Resim işleme başlatıldı'
    });
  } catch (error) {
    console.error('Process image error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
    return;
  }
});

// Get user's image jobs
app.get('/api/images/jobs', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const { data: jobs, error } = await supabase
      .from('image_jobs')
      .select(`
        id, category_type, style, status, created_at,
        processed_images (image_url, created_at)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

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
      data: { jobs: jobs || [] }
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

/**
 * SUBSCRIPTIONS ROUTES
 */

// Get subscription plans
app.get('/api/subscriptions/plans', async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price');

    if (error) {
      console.error('Plans fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Planlar yüklenirken hata oluştu'
      });
      return;
    }

    res.json({
      success: true,
      data: { plans: plans || [] }
    });
  } catch (error) {
    console.error('Plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
    return;
  }
});

/**
 * ADMIN ROUTES
 */

// Get admin stats
app.get('/api/admin/stats', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    // Get user count
    const { count: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get job count
    const { count: jobCount } = await supabase
      .from('image_jobs')
      .select('*', { count: 'exact', head: true });

    // Get processed images count
    const { count: imageCount } = await supabase
      .from('processed_images')
      .select('*', { count: 'exact', head: true });

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers: userCount || 0,
          totalJobs: jobCount || 0,
          totalImages: imageCount || 0
        }
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
    return;
  }
});

/**
 * health
 */
app.use('/api/health', (req: Request, res: Response, next: NextFunction): void => {
  res.status(200).json({
    success: true,
    message: 'ok'
  });
});

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error'
  });
});

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found'
  });
});

export default app;