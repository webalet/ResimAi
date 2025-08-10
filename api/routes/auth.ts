import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// Register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
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
router.post('/login', async (req: Request, res: Response): Promise<void> => {
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
router.get('/me', auth, async (req: Request, res: Response): Promise<void> => {
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

// Update profile
router.put('/profile', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { name, email } = req.body;

    if (!name || !email) {
      res.status(400).json({
        success: false,
        message: 'İsim ve e-posta gereklidir'
      });
      return;
    }

    // Check if email is already taken by another user
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .neq('id', userId)
      .single();

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'Bu e-posta adresi zaten kullanılıyor'
      });
      return;
    }

    // Update user
    const { data: user, error } = await supabase
      .from('users')
      .update({ name, email })
      .eq('id', userId)
      .select('id, name, email, credits, created_at')
      .single();

    if (error) {
      console.error('Profile update error:', error);
      res.status(500).json({
        success: false,
        message: 'Profil güncellenirken hata oluştu'
      });
      return;
    }

    res.json({
      success: true,
      data: { user },
      message: 'Profil başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
    return;
  }
});

// Change password
router.put('/password', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Mevcut şifre ve yeni şifre gereklidir'
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Yeni şifre en az 6 karakter olmalıdır'
      });
      return;
    }

    // Get current user with password
    const { data: user, error } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single();

    if (error || !user) {
      res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
      return;
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        message: 'Mevcut şifre yanlış'
      });
      return;
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: hashedNewPassword })
      .eq('id', userId);

    if (updateError) {
      console.error('Password update error:', updateError);
      res.status(500).json({
        success: false,
        message: 'Şifre güncellenirken hata oluştu'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Şifre başarıyla değiştirildi'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
    return;
  }
});

// Delete account
router.delete('/account', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;

    // Delete user (this will cascade delete related records due to foreign keys)
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Account deletion error:', error);
      res.status(500).json({
        success: false,
        message: 'Hesap silinirken hata oluştu'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Hesap başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
    return;
  }
});

// Export user data
router.get('/export', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;

    // Get user data
    const { data: user } = await supabase
      .from('users')
      .select('id, name, email, credits, created_at')
      .eq('id', userId)
      .single();

    // Get image jobs
    const { data: imageJobs } = await supabase
      .from('image_jobs')
      .select(`
        id, category_type, style, status, created_at,
        processed_images (image_url, created_at)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Get credits usage
    const { data: creditsUsage } = await supabase
      .from('credits_usage')
      .select('credits_used, operation_type, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const exportData = {
      user,
      imageJobs: imageJobs || [],
      creditsUsage: creditsUsage || [],
      exportDate: new Date().toISOString()
    };

    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({
      success: false,
      message: 'Veri dışa aktarılırken hata oluştu'
    });
    return;
  }
});

export default router;