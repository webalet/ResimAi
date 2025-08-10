import jwt from 'jsonwebtoken';
import { User } from '../../shared/types.js';

const JWT_SECRET = process.env.JWT_SECRET as string || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required');
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export const generateToken = (user: User): string => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }

  const payload = {
    userId: user.id,
    email: user.email
  };

  return jwt.sign(payload, JWT_SECRET);
};

export const verifyToken = (token: string): JWTPayload => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
};