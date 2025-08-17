import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';

interface JwtPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export const auth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  console.log('🔐 [AUTH] Middleware called for:', req.method, req.url);
  console.log('🔐 [AUTH] Authorization header:', req.headers.authorization ? 'Bearer ***' : 'None');
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Yetkilendirme tokeni gereklidir'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Token bulunamadı'
      });
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'your-secret-key'
    ) as JwtPayload;

    if (!decoded.userId) {
      res.status(401).json({
        success: false,
        message: 'Gecersiz token'
      });
      return;
    }

    // Verify user still exists in database and is not banned
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, is_banned')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      res.status(401).json({
        success: false,
        message: 'Kullanici bulunamadi'
      });
      return;
    }

    // Check if user is banned
    if (user.is_banned) {
      res.status(403).json({
        success: false,
        message: 'Hesabınız yasaklanmıştır. Lütfen destek ekibi ile iletişime geçin.'
      });
      return;
    }

    // Add user info to request object
    (req as any).userId = decoded.userId;
    (req as any).userEmail = decoded.email;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Gecersiz token'
      });
      return;
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token suresi dolmus'
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      message: 'Yetkilendirme hatasi'
    });
    return;
  }
};

// Optional auth middleware - doesn't fail if no token provided
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next(); // Continue without authentication
      return;
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      next(); // Continue without authentication
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'your-secret-key'
    ) as JwtPayload;

    if (decoded.userId) {
      // Verify user still exists in database and is not banned
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, is_banned')
        .eq('id', decoded.userId)
        .single();

      if (!error && user && !user.is_banned) {
        // Add user info to request object
        (req as any).userId = decoded.userId;
        (req as any).userEmail = decoded.email;
      }
    }
    
    next();
  } catch (error) {
    // If token verification fails, continue without authentication
    console.warn('Optional auth failed:', error);
    next();
  }
};

// Admin auth middleware
export const adminAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // First run regular auth
    await new Promise<void>((resolve, reject) => {
      auth(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const userId = (req as any).userId;
    
    // Check if user is admin and not banned
    const { data: user, error } = await supabase
      .from('users')
      .select('is_admin, is_banned')
      .eq('id', userId)
      .single();

    if (error || !user) {
      res.status(403).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
      return;
    }

    if (user.is_banned) {
      res.status(403).json({
        success: false,
        message: 'Hesabınız yasaklanmıştır'
      });
      return;
    }

    if (!user.is_admin) {
      res.status(403).json({
        success: false,
        message: 'Admin yetkisi gereklidir'
      });
      return;
    }
    
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Yetkilendirme hatasi'
    });
    return;
  }
};