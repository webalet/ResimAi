import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase.js';

export const adminAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('🔥 [ADMIN AUTH] Starting admin auth middleware');
    console.log('🔥 [ADMIN AUTH] Authorization header:', req.headers.authorization ? 'Bearer ***' : 'None');
    
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      console.log('🔥 [ADMIN AUTH] No token found');
      res.status(401).json({
        success: false,
        message: 'Erişim token bulunamadı'
      });
      return;
    }

    console.log('🔥 [ADMIN AUTH] Token found, verifying...');
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    console.log('🔥 [ADMIN AUTH] Token decoded:', { userId: decoded.userId, email: decoded.email });
    
    // Get user from database and check admin status
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, is_admin')
      .eq('id', decoded.userId)
      .single();

    console.log('🔥 [ADMIN AUTH] User query result:', { user, error });

    if (error || !user) {
      console.log('🔥 [ADMIN AUTH] User not found or error:', error);
      res.status(401).json({
        success: false,
        message: 'Geçersiz token'
      });
      return;
    }

    if (!user.is_admin) {
      console.log('🔥 [ADMIN AUTH] User is not admin:', user.is_admin);
      res.status(403).json({
        success: false,
        message: 'Bu işlem için admin yetkisi gereklidir'
      });
      return;
    }

    console.log('🔥 [ADMIN AUTH] Admin auth successful');
    // Add user info to request
    (req as any).userId = user.id;
    (req as any).userEmail = user.email;
    (req as any).isAdmin = user.is_admin;
    
    next();
  } catch (error) {
    console.error('🔥 [ADMIN AUTH] Error:', error);
    res.status(401).json({
      success: false,
      message: 'Geçersiz token'
    });
    return;
  }
};

// Admin login endpoint
export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'E-posta ve şifre gereklidir'
      });
      return;
    }

    // Get admin user
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, password_hash, is_admin')
      .eq('email', email)
      .eq('is_admin', true)
      .single();

    if (error || !user) {
      res.status(401).json({
        success: false,
        message: 'Geçersiz admin bilgileri'
      });
      return;
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        message: 'Geçersiz admin bilgileri'
      });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, isAdmin: true },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' } // Shorter expiry for admin sessions
    );

    // Remove password from response
    const { password_hash, ...adminWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        admin: adminWithoutPassword,
        token
      },
      message: 'Admin girişi başarılı'
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};