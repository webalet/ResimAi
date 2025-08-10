import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase';

interface JwtPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export const auth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    // Verify user still exists in database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      res.status(401).json({
        success: false,
        message: 'Kullanici bulunamadi'
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
      // Verify user still exists in database
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email')
        .eq('id', decoded.userId)
        .single();

      if (!error && user) {
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
    
    // Check if user is admin
    const { data: user, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (error || !user || !user.is_admin) {
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