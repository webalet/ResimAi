import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { supabase } from '../config/supabase.js';
import { adminAuth } from '../middleware/adminAuth.js';
import { fileURLToPath } from 'url';

// Job interface for TypeScript
interface JobWithUser {
  id: string;
  user_id: string;
  category_type: string;
  style: string;
  status: string;
  original_image_url: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
  users: {
    name: string;
    email: string;
  }[];
  processed_images: {
    image_url: string;
  }[];
}

const __filename = fileURLToPath(import.meta.url);

const router = Router();

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

// Get admin settings from admin-settings.json
router.get('/admin-settings', adminAuth, async (_req: Request, res: Response) => {
  try {
    const settingsPath = path.join(process.cwd(), 'admin-settings.json');
    const settingsData = fs.readFileSync(settingsPath, 'utf8');
    const settings = JSON.parse(settingsData);
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error reading admin settings:', error);
    res.status(500).json({
      success: false,
      message: 'Admin ayarları yüklenirken hata oluştu'
    });
  }
});

// Update admin settings in admin-settings.json
router.put('/admin-settings', adminAuth, async (req: Request, res: Response) => {
  try {
    const settingsPath = path.join(process.cwd(), 'admin-settings.json');
    const updatedSettings = req.body;
    fs.writeFileSync(settingsPath, JSON.stringify(updatedSettings, null, 2));
    res.json({
      success: true,
      message: 'Admin ayarları başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Error updating admin settings:', error);
    res.status(500).json({
      success: false,
      message: 'Admin ayarları güncellenirken hata oluştu'
    });
  }
});

// Admin Dashboard Stats
router.get('/stats', adminAuth, async (req: Request, res: Response) => {
  try {
    // Get total users count
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get active users (users who logged in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', thirtyDaysAgo.toISOString());

    // Get total jobs count
    const { count: totalJobs } = await supabase
      .from('image_jobs')
      .select('*', { count: 'exact', head: true });

    // Get jobs from last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { count: dailyJobs } = await supabase
      .from('image_jobs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday.toISOString());

    // Get jobs from last 30 days
    const { count: monthlyJobs } = await supabase
      .from('image_jobs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Get category usage stats
    const { data: categoryStats } = await supabase
      .from('image_jobs')
      .select('category_type')
      .eq('status', 'completed');

    const categoryUsage = categoryStats?.reduce((acc: any, job: any) => {
      acc[job.category_type] = (acc[job.category_type] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get recent activities
    const { data: recentJobs } = await supabase
      .from('image_jobs')
      .select(`
        id,
        category_type,
        style,
        status,
        created_at,
        users!inner(name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalJobs: totalJobs || 0,
        dailyJobs: dailyJobs || 0,
        monthlyJobs: monthlyJobs || 0,
        categoryUsage,
        recentActivities: recentJobs || []
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'İstatistikler alınırken hata oluştu'
    });
  }
});

// Get all users with pagination
router.get('/users', adminAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        credits,
        is_admin,
        created_at,
        updated_at
      `, { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: users, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: {
        users: users || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcılar alınırken hata oluştu'
    });
  }
});

// Get user details with job history
router.get('/users/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (userError || !user) {
      res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
      return;
    }

    // Get user's job history
    const { data: jobs } = await supabase
      .from('image_jobs')
      .select(`
        id,
        category_type,
        style,
        status,
        original_image_url,
        error_message,
        created_at,
        processed_images(image_url)
      `)
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(50);

    // Get user's credit usage
    const { data: creditUsage } = await supabase
      .from('credits_usage')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(20);

    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        jobs: jobs || [],
        creditUsage: creditUsage || []
      }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcı detayları alınırken hata oluştu'
    });
    return;
  }
});

// Update user (credits, password, admin status)
router.put('/users/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { credits, password, is_admin } = req.body;

    const updateData: any = {};

    if (credits !== undefined) {
      updateData.credits = parseInt(credits);
    }

    if (password) {
      if (password.length < 6) {
        res.status(400).json({
          success: false,
          message: 'Şifre en az 6 karakter olmalıdır'
        });
        return;
      }
      updateData.password_hash = await bcrypt.hash(password, 12);
    }

    if (is_admin !== undefined) {
      updateData.is_admin = Boolean(is_admin);
    }

    updateData.updated_at = new Date().toISOString();

    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('id, name, email, credits, is_admin, created_at, updated_at')
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: { user },
      message: 'Kullanıcı başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcı güncellenirken hata oluştu'
    });
    return;
  }
});

// Get all jobs with filters
router.get('/jobs', adminAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string;
    const status = req.query.status as string;
    const dateFrom = req.query.dateFrom as string;
    const dateTo = req.query.dateTo as string;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('image_jobs')
      .select(`
        id,
        user_id,
        category_type,
        style,
        status,
        original_image_url,
        error_message,
        created_at,
        updated_at,
        users(name, email),
        processed_images(image_url)
      `, { count: 'exact' });

    if (category) {
      query = query.eq('category_type', category);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    const { data: jobs, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Transform the data to match frontend expectations
    const transformedJobs = (jobs as JobWithUser[] || []).map(job => ({
      ...job,
      user_name: job.users?.[0]?.name || 'Bilinmeyen Kullanıcı',
      user_email: job.users?.[0]?.email || 'Bilinmeyen E-posta',
      updated_at: job.updated_at || job.created_at
    }));

    res.json({
      success: true,
      data: {
        jobs: transformedJobs,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'İşlemler alınırken hata oluştu'
    });
  }
});

// Retry failed job
router.post('/jobs/:id/retry', adminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Update job status to pending
    const { data: job, error } = await supabase
      .from('image_jobs')
      .update({
        status: 'pending',
        error_message: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    // Here you would trigger the webhook again
    // This depends on your webhook implementation

    res.json({
      success: true,
      data: { job },
      message: 'İşlem yeniden başlatıldı'
    });
  } catch (error) {
    console.error('Retry job error:', error);
    res.status(500).json({
      success: false,
      message: 'İşlem yeniden başlatılırken hata oluştu'
    });
  }
});

// Get system settings
router.get('/settings', adminAuth, async (req: Request, res: Response) => {
  try {
    // Read settings from file
    const settingsPath = path.join(process.cwd(), 'admin-settings.json');
    let savedSettings: any = {};
    
    try {
      if (fs.existsSync(settingsPath)) {
        const settingsData = fs.readFileSync(settingsPath, 'utf8');
        savedSettings = JSON.parse(settingsData);
      }
    } catch (error) {
      console.log('No saved settings found, using defaults');
    }

    // Default settings with saved overrides
    const settings = {
      systemConfig: {
        supabase: {
          url: savedSettings.supabase?.url || 'https://pfpaeiyshitndugrzmmb.supabase.co',
          anonKey: savedSettings.supabase?.anonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcGFlaXlzaGl0bmR1Z3J6bW1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NzM0MTAsImV4cCI6MjA3MDI0OTQxMH0.CZzstaQmMmEdA1PVntBskuzdqHKe6_ovVSLfYFkD23E',
          serviceRoleKey: savedSettings.supabase?.serviceRoleKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcGFlaXlzaGl0bmR1Z3J6bW1iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDY3MzQxMCwiZXhwIjoyMDcwMjQ5NDEwfQ.ZZdQIiHsHJm43fPoRNGYjPAzXztkckmV2e27LmnnRiY'
        },
        n8n: {
          webhookUrl: savedSettings.n8n?.webhookUrl || 'https://1qe4j72v.rpcld.net/webhook/cd11e789-5e4e-4dda-a86e-e1204e036c82',
          apiKey: savedSettings.n8n?.apiKey || 'n8n_api_key_example_12345'
        },
        jwt: {
          secret: savedSettings.jwt?.secret || 'your-super-secret-jwt-key-here-make-it-long-and-secure',
          expiresIn: savedSettings.jwt?.expiresIn || '7d'
        },
        server: {
          port: savedSettings.server?.port || '80',
          url: savedSettings.server?.url || 'http://64.226.75.76:80'
        }
      },
      categories: savedSettings.categories || [
        {
          name: 'Corporate',
          styles: ['Professional', 'Business Casual', 'Executive', 'Formal Meeting'],
          image_url: ''
        },
        {
          name: 'Creative', 
          styles: ['Artistic', 'Bohemian', 'Vintage', 'Modern Art'],
          image_url: ''
        },
        {
          name: 'Avatar',
          styles: ['Cartoon', 'Realistic', 'Anime', 'Fantasy'],
          image_url: ''
        }
      ],
      aiPrompts: savedSettings.aiPrompts || {
        Corporate: {
          Professional: 'professional corporate headshot, business attire, clean background, high quality, studio lighting'
        }
      }
    };

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Sistem ayarları alınırken hata oluştu'
    });
  }
});

// Update system configuration
router.put('/settings/config', adminAuth, async (req: Request, res: Response) => {
  try {
    const { section, config } = req.body;

    // Read current settings
    const settingsPath = path.join(process.cwd(), 'admin-settings.json');
    let currentSettings: any = {};
    
    try {
      if (fs.existsSync(settingsPath)) {
        const settingsData = fs.readFileSync(settingsPath, 'utf8');
        currentSettings = JSON.parse(settingsData);
      }
    } catch (error) {
      console.log('Creating new settings file');
    }

    // Update the specific section
    currentSettings[section] = config;
    currentSettings.lastUpdated = new Date().toISOString();

    // Save to file
    fs.writeFileSync(settingsPath, JSON.stringify(currentSettings, null, 2));

    res.json({
      success: true,
      data: config,
      message: `${section} konfigürasyonu başarıyla kaydedildi`
    });
  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({
      success: false,
      message: 'Sistem konfigürasyonu güncellenirken hata oluştu'
    });
    return;
  }
});

// Update categories
router.put('/settings/categories', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { categories } = req.body;

    // Validate categories
    if (!Array.isArray(categories)) {
      res.status(400).json({
        success: false,
        message: 'Kategoriler array formatında olmalıdır'
      });
      return;
    }

    // Read current settings
    const settingsPath = path.join(process.cwd(), 'admin-settings.json');
    let currentSettings: any = {};
    
    try {
      if (fs.existsSync(settingsPath)) {
        const settingsData = fs.readFileSync(settingsPath, 'utf8');
        currentSettings = JSON.parse(settingsData);
      }
    } catch (error) {
      console.log('Creating new settings file');
    }

    // Update categories
    currentSettings.categories = categories;
    currentSettings.lastUpdated = new Date().toISOString();

    // Save to file
    fs.writeFileSync(settingsPath, JSON.stringify(currentSettings, null, 2));

    res.json({
      success: true,
      data: categories,
      message: 'Kategoriler başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Update categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Kategoriler güncellenirken hata oluştu'
    });
    return;
  }
});

// Update AI prompts
router.put('/settings/prompts', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompts } = req.body;

    // Validate prompts
    if (typeof prompts !== 'object' || prompts === null) {
      res.status(400).json({
        success: false,
        message: 'Prompt\'lar object formatında olmalıdır'
      });
      return;
    }

    // Read current settings
    const settingsPath = path.join(process.cwd(), 'admin-settings.json');
    let currentSettings: any = {};
    
    try {
      if (fs.existsSync(settingsPath)) {
        const settingsData = fs.readFileSync(settingsPath, 'utf8');
        currentSettings = JSON.parse(settingsData);
      }
    } catch (error) {
      console.log('Creating new settings file');
    }

    // Update prompts
    currentSettings.aiPrompts = prompts;
    currentSettings.lastUpdated = new Date().toISOString();

    // Save to file
    fs.writeFileSync(settingsPath, JSON.stringify(currentSettings, null, 2));

    res.json({
      success: true,
      data: prompts,
      message: 'AI prompt\'ları başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Update prompts error:', error);
    res.status(500).json({
      success: false,
      message: 'AI prompt\'ları güncellenirken hata oluştu'
    });
    return;
  }
});

// Image upload endpoint - supports before/after images
router.post('/upload-image', adminAuth, upload.single('image'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'Resim dosyası bulunamadı'
      });
      return;
    }

    const { type, imageType } = req.body; // type: 'category', imageType: 'before' | 'after' | undefined
    const file = req.file;
    
    // Generate unique filename with imageType support
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = path.extname(file.originalname);
    const imageTypePrefix = imageType ? `${imageType}_` : '';
    const fileName = `${type}_${imageTypePrefix}${timestamp}_${randomString}${fileExtension}`;
    
    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Save file to disk
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, file.buffer);
    
    // Return the URL path
    const imageUrl = `/uploads/${fileName}`;
    
    res.json({
      success: true,
      url: imageUrl,
      imageType: imageType || 'default',
      message: `${imageType ? imageType.charAt(0).toUpperCase() + imageType.slice(1) + ' r' : 'R'}esim başarıyla yüklendi`
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Resim yüklenirken hata oluştu'
    });
  }
});

// Analytics data
router.get('/analytics', adminAuth, async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // User registration over time
    const { data: userRegistrations } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    // Job completion over time
    const { data: jobCompletions } = await supabase
      .from('image_jobs')
      .select('created_at, status')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    // Category usage statistics
    const { data: categoryData } = await supabase
      .from('image_jobs')
      .select('category_type, status')
      .gte('created_at', startDate.toISOString());

    // Get credit usage for revenue calculation
    const { data: creditUsage } = await supabase
      .from('credits_usage')
      .select('created_at, credits_used')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    // Get top users with job counts
    const { data: topUsersData } = await supabase
      .from('users')
      .select('id, name, email')
      .limit(50);

    // Get job counts for users
    const { data: userJobCounts } = await supabase
      .from('image_jobs')
      .select('user_id')
      .gte('created_at', startDate.toISOString());

    // Get credit usage for users
    const { data: userCreditUsage } = await supabase
      .from('credits_usage')
      .select('user_id, credits_used')
      .gte('created_at', startDate.toISOString());

    // Process data for charts
    const userGrowth = processTimeSeriesData(userRegistrations || [], 'created_at', days);
    const jobCompletionsTimeSeries = processJobCompletionsTimeSeries(jobCompletions || [], days);
    const jobStats = processJobStats(jobCompletions || [], days);
    const categoryStats = processCategoryStats(categoryData || []);
    const revenueData = processRevenueData(creditUsage || [], days);
    const topUsers = processTopUsers(topUsersData || [], userJobCounts || [], userCreditUsage || []);

    // Calculate average jobs per user
    const totalUsers = userRegistrations?.length || 0;
    const totalJobs = jobCompletions?.length || 0;
    const avgJobsPerUser = totalUsers > 0 ? totalJobs / totalUsers : 0;

    res.json({
      success: true,
      data: {
        userGrowth,
        jobCompletions: jobCompletionsTimeSeries,
        jobStats,
        categoryStats,
        revenueData,
        topUsers,
        avgJobsPerUser,
        period: `${days} days`
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Analitik veriler alınırken hata oluştu'
    });
    return;
  }
});

// Helper functions
function processTimeSeriesData(data: any[], dateField: string, days: number) {
  const result = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    const count = data.filter(item => 
      item[dateField].startsWith(dateStr)
    ).length;

    result.push({
      date: dateStr,
      count
    });
  }

  return result;
}

function processJobStats(data: any[], days: number) {
  const completed = data.filter(job => job.status === 'completed').length;
  const failed = data.filter(job => job.status === 'failed').length;
  const pending = data.filter(job => job.status === 'pending').length;
  const processing = data.filter(job => job.status === 'processing').length;

  return {
    completed,
    failed,
    pending,
    processing,
    total: data.length
  };
}

function processJobCompletionsTimeSeries(data: any[], days: number) {
  const result = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    const dayJobs = data.filter(item => 
      item.created_at.startsWith(dateStr)
    );

    const completed = dayJobs.filter(job => job.status === 'completed').length;
    const failed = dayJobs.filter(job => job.status === 'failed').length;

    result.push({
      date: dateStr,
      completed,
      failed
    });
  }

  return result;
}

function processRevenueData(data: any[], days: number) {
  const result = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const creditPrice = 1; // 1 TL per credit

  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    const dayCredits = data.filter(item => 
      item.created_at.startsWith(dateStr)
    );

    const totalCredits = dayCredits.reduce((sum, item) => sum + (item.credits_used || 0), 0);
    const revenue = totalCredits * creditPrice;
    const transactions = dayCredits.length;

    result.push({
      date: dateStr,
      revenue,
      transactions
    });
  }

  return result;
}

function processTopUsers(users: any[], jobCounts: any[], creditUsage: any[]) {
  return users.map(user => {
    const jobCount = jobCounts.filter(job => job.user_id === user.id).length;
    const creditsUsed = creditUsage
      .filter(usage => usage.user_id === user.id)
      .reduce((sum, usage) => sum + (usage.credits_used || 0), 0);
    
    return {
      id: user.id,
      name: user.name || 'Bilinmeyen Kullanıcı',
      email: user.email || 'Bilinmeyen E-posta',
      jobCount,
      creditsUsed
    };
  })
  .filter(user => user.jobCount > 0) // Only users with jobs
  .sort((a, b) => b.jobCount - a.jobCount)
  .slice(0, 5);
}

function processCategoryStats(data: any[]) {
  const stats: any = {};
  const total = data.length;
  
  data.forEach(job => {
    if (!stats[job.category_type]) {
      stats[job.category_type] = {
        total: 0,
        completed: 0,
        failed: 0
      };
    }
    
    stats[job.category_type].total++;
    if (job.status === 'completed') {
      stats[job.category_type].completed++;
    } else if (job.status === 'failed') {
      stats[job.category_type].failed++;
    }
  });

  // Convert to array format with percentages for frontend
  return Object.entries(stats).map(([category, categoryStats]: [string, any]) => ({
    category,
    count: categoryStats.total,
    percentage: total > 0 ? (categoryStats.total / total) * 100 : 0
  }));
}

export default router;