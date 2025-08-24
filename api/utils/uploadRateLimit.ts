import { Request, Response, NextFunction } from 'express';
import { logFileUploadBlocked } from './securityLogger.js';

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  // General upload limits
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxUploads: 50, // 50 uploads per 15 minutes
    maxTotalSize: 500 * 1024 * 1024, // 500MB total per window
  },
  
  // Per-user limits
  perUser: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxUploads: 100, // 100 uploads per hour per user
    maxTotalSize: 1024 * 1024 * 1024, // 1GB total per hour per user
  },
  
  // Suspicious activity limits (stricter)
  suspicious: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxUploads: 5, // Only 5 uploads per 5 minutes for suspicious users
    maxTotalSize: 50 * 1024 * 1024, // 50MB total per 5 minutes
  },
  
  // Burst protection
  burst: {
    windowMs: 60 * 1000, // 1 minute
    maxUploads: 10, // Max 10 uploads per minute
  },
  
  // File size based limits
  largeFile: {
    threshold: 10 * 1024 * 1024, // 10MB threshold
    windowMs: 30 * 60 * 1000, // 30 minutes
    maxUploads: 5, // Only 5 large files per 30 minutes
  }
};

// Rate limit storage (in production, use Redis or similar)
interface RateLimitEntry {
  count: number;
  totalSize: number;
  firstRequest: number;
  lastRequest: number;
  suspiciousActivity: boolean;
}

class UploadRateLimiter {
  private static instance: UploadRateLimiter;
  private generalLimits: Map<string, RateLimitEntry> = new Map();
  private userLimits: Map<string, RateLimitEntry> = new Map();
  private burstLimits: Map<string, RateLimitEntry> = new Map();
  private largeLimits: Map<string, RateLimitEntry> = new Map();
  private suspiciousUsers: Set<string> = new Set();
  private cleanupTimer?: NodeJS.Timeout;

  private constructor() {
    this.startCleanupTimer();
  }

  public static getInstance(): UploadRateLimiter {
    if (!UploadRateLimiter.instance) {
      UploadRateLimiter.instance = new UploadRateLimiter();
    }
    return UploadRateLimiter.instance;
  }

  /**
   * Checks if upload is allowed based on rate limits
   * @param identifier - IP address or user identifier
   * @param userId - User ID (if authenticated)
   * @param fileSize - Size of the file being uploaded
   * @returns Rate limit check result
   */
  public checkUploadLimit(identifier: string, userId?: string, fileSize: number = 0): {
    allowed: boolean;
    reason?: string;
    retryAfter?: number;
    limits?: {
      general: { remaining: number; resetTime: number };
      user?: { remaining: number; resetTime: number };
      burst: { remaining: number; resetTime: number };
    };
  } {
    const now = Date.now();
    const isSuspicious = this.suspiciousUsers.has(identifier) || (userId && this.suspiciousUsers.has(userId));
    const isLargeFile = fileSize > RATE_LIMIT_CONFIG.largeFile.threshold;

    // Check burst protection first (most restrictive)
    const burstCheck = this.checkBurstLimit(identifier, now);
    if (!burstCheck.allowed) {
      return burstCheck;
    }

    // Check large file limits
    if (isLargeFile) {
      const largeFileCheck = this.checkLargeFileLimit(identifier, now, fileSize);
      if (!largeFileCheck.allowed) {
        return largeFileCheck;
      }
    }

    // Check suspicious user limits (stricter)
    if (isSuspicious) {
      const suspiciousCheck = this.checkSuspiciousLimit(identifier, now, fileSize);
      if (!suspiciousCheck.allowed) {
        return suspiciousCheck;
      }
    }

    // Check general limits
    const generalCheck = this.checkGeneralLimit(identifier, now, fileSize);
    if (!generalCheck.allowed) {
      return generalCheck;
    }

    // Check per-user limits (if authenticated)
    if (userId) {
      const userCheck = this.checkUserLimit(userId, now, fileSize);
      if (!userCheck.allowed) {
        return userCheck;
      }
    }

    // All checks passed - record the upload
    this.recordUpload(identifier, userId, now, fileSize);

    return {
      allowed: true,
      limits: {
        general: this.getRemainingLimits(this.generalLimits.get(identifier), RATE_LIMIT_CONFIG.general, now),
        user: userId ? this.getRemainingLimits(this.userLimits.get(userId), RATE_LIMIT_CONFIG.perUser, now) : undefined,
        burst: this.getRemainingLimits(this.burstLimits.get(identifier), RATE_LIMIT_CONFIG.burst, now)
      }
    };
  }

  private checkBurstLimit(identifier: string, now: number): { allowed: boolean; reason?: string; retryAfter?: number } {
    const entry = this.burstLimits.get(identifier);
    const config = RATE_LIMIT_CONFIG.burst;

    if (!entry || now - entry.firstRequest > config.windowMs) {
      return { allowed: true };
    }

    if (entry.count >= config.maxUploads) {
      const retryAfter = Math.ceil((entry.firstRequest + config.windowMs - now) / 1000);
      return {
        allowed: false,
        reason: `Burst limit exceeded: ${config.maxUploads} uploads per minute`,
        retryAfter
      };
    }

    return { allowed: true };
  }

  private checkLargeFileLimit(identifier: string, now: number, fileSize: number): { allowed: boolean; reason?: string; retryAfter?: number } {
    const entry = this.largeLimits.get(identifier);
    const config = RATE_LIMIT_CONFIG.largeFile;

    if (!entry || now - entry.firstRequest > config.windowMs) {
      return { allowed: true };
    }

    if (entry.count >= config.maxUploads) {
      const retryAfter = Math.ceil((entry.firstRequest + config.windowMs - now) / 1000);
      return {
        allowed: false,
        reason: `Large file limit exceeded: ${config.maxUploads} large files per 30 minutes`,
        retryAfter
      };
    }

    return { allowed: true };
  }

  private checkSuspiciousLimit(identifier: string, now: number, fileSize: number): { allowed: boolean; reason?: string; retryAfter?: number } {
    const entry = this.userLimits.get(identifier) || this.generalLimits.get(identifier);
    const config = RATE_LIMIT_CONFIG.suspicious;

    if (!entry || now - entry.firstRequest > config.windowMs) {
      return { allowed: true };
    }

    if (entry.count >= config.maxUploads || entry.totalSize + fileSize > config.maxTotalSize) {
      const retryAfter = Math.ceil((entry.firstRequest + config.windowMs - now) / 1000);
      return {
        allowed: false,
        reason: `Suspicious activity detected - restricted upload limits applied`,
        retryAfter
      };
    }

    return { allowed: true };
  }

  private checkGeneralLimit(identifier: string, now: number, fileSize: number): { allowed: boolean; reason?: string; retryAfter?: number } {
    const entry = this.generalLimits.get(identifier);
    const config = RATE_LIMIT_CONFIG.general;

    if (!entry || now - entry.firstRequest > config.windowMs) {
      return { allowed: true };
    }

    if (entry.count >= config.maxUploads) {
      const retryAfter = Math.ceil((entry.firstRequest + config.windowMs - now) / 1000);
      return {
        allowed: false,
        reason: `Upload limit exceeded: ${config.maxUploads} uploads per 15 minutes`,
        retryAfter
      };
    }

    if (entry.totalSize + fileSize > config.maxTotalSize) {
      const retryAfter = Math.ceil((entry.firstRequest + config.windowMs - now) / 1000);
      return {
        allowed: false,
        reason: `Upload size limit exceeded: ${Math.round(config.maxTotalSize / (1024 * 1024))}MB per 15 minutes`,
        retryAfter
      };
    }

    return { allowed: true };
  }

  private checkUserLimit(userId: string, now: number, fileSize: number): { allowed: boolean; reason?: string; retryAfter?: number } {
    const entry = this.userLimits.get(userId);
    const config = RATE_LIMIT_CONFIG.perUser;

    if (!entry || now - entry.firstRequest > config.windowMs) {
      return { allowed: true };
    }

    if (entry.count >= config.maxUploads) {
      const retryAfter = Math.ceil((entry.firstRequest + config.windowMs - now) / 1000);
      return {
        allowed: false,
        reason: `User upload limit exceeded: ${config.maxUploads} uploads per hour`,
        retryAfter
      };
    }

    if (entry.totalSize + fileSize > config.maxTotalSize) {
      const retryAfter = Math.ceil((entry.firstRequest + config.windowMs - now) / 1000);
      return {
        allowed: false,
        reason: `User size limit exceeded: ${Math.round(config.maxTotalSize / (1024 * 1024))}MB per hour`,
        retryAfter
      };
    }

    return { allowed: true };
  }

  private recordUpload(identifier: string, userId: string | undefined, now: number, fileSize: number): void {
    // Record general limit
    this.updateEntry(this.generalLimits, identifier, now, fileSize, RATE_LIMIT_CONFIG.general.windowMs);
    
    // Record burst limit
    this.updateEntry(this.burstLimits, identifier, now, fileSize, RATE_LIMIT_CONFIG.burst.windowMs);
    
    // Record user limit
    if (userId) {
      this.updateEntry(this.userLimits, userId, now, fileSize, RATE_LIMIT_CONFIG.perUser.windowMs);
    }
    
    // Record large file limit
    if (fileSize > RATE_LIMIT_CONFIG.largeFile.threshold) {
      this.updateEntry(this.largeLimits, identifier, now, fileSize, RATE_LIMIT_CONFIG.largeFile.windowMs);
    }
  }

  private updateEntry(map: Map<string, RateLimitEntry>, key: string, now: number, fileSize: number, windowMs: number): void {
    const entry = map.get(key);
    
    if (!entry || now - entry.firstRequest > windowMs) {
      map.set(key, {
        count: 1,
        totalSize: fileSize,
        firstRequest: now,
        lastRequest: now,
        suspiciousActivity: false
      });
    } else {
      entry.count++;
      entry.totalSize += fileSize;
      entry.lastRequest = now;
    }
  }

  private getRemainingLimits(entry: RateLimitEntry | undefined, config: any, now: number): { remaining: number; resetTime: number } {
    if (!entry || now - entry.firstRequest > config.windowMs) {
      return {
        remaining: config.maxUploads,
        resetTime: now + config.windowMs
      };
    }

    return {
      remaining: Math.max(0, config.maxUploads - entry.count),
      resetTime: entry.firstRequest + config.windowMs
    };
  }

  /**
   * Marks a user/IP as suspicious for stricter rate limiting
   * @param identifier - User ID or IP address
   * @param duration - Duration in milliseconds (default: 1 hour)
   */
  public markSuspicious(identifier: string, duration: number = 60 * 60 * 1000): void {
    this.suspiciousUsers.add(identifier);
    
    // Auto-remove after duration
    setTimeout(() => {
      this.suspiciousUsers.delete(identifier);
      console.log('🔓 [RATE_LIMIT] Suspicious status removed for:', identifier);
    }, duration);
    
    console.log('🚨 [RATE_LIMIT] User marked as suspicious:', identifier);
  }

  /**
   * Gets current rate limit status for debugging
   * @param identifier - IP address or user ID
   * @returns Current status
   */
  public getStatus(identifier: string): {
    general?: RateLimitEntry;
    user?: RateLimitEntry;
    burst?: RateLimitEntry;
    large?: RateLimitEntry;
    isSuspicious: boolean;
  } {
    return {
      general: this.generalLimits.get(identifier),
      user: this.userLimits.get(identifier),
      burst: this.burstLimits.get(identifier),
      large: this.largeLimits.get(identifier),
      isSuspicious: this.suspiciousUsers.has(identifier)
    };
  }

  private startCleanupTimer(): void {
    // Clean up expired entries every 5 minutes
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000);
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleanedCount = 0;

    // Clean up general limits
    for (const [key, entry] of this.generalLimits.entries()) {
      if (now - entry.firstRequest > RATE_LIMIT_CONFIG.general.windowMs) {
        this.generalLimits.delete(key);
        cleanedCount++;
      }
    }

    // Clean up user limits
    for (const [key, entry] of this.userLimits.entries()) {
      if (now - entry.firstRequest > RATE_LIMIT_CONFIG.perUser.windowMs) {
        this.userLimits.delete(key);
        cleanedCount++;
      }
    }

    // Clean up burst limits
    for (const [key, entry] of this.burstLimits.entries()) {
      if (now - entry.firstRequest > RATE_LIMIT_CONFIG.burst.windowMs) {
        this.burstLimits.delete(key);
        cleanedCount++;
      }
    }

    // Clean up large file limits
    for (const [key, entry] of this.largeLimits.entries()) {
      if (now - entry.firstRequest > RATE_LIMIT_CONFIG.largeFile.windowMs) {
        this.largeLimits.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 [RATE_LIMIT] Cleaned up ${cleanedCount} expired rate limit entries`);
    }
  }

  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }
}

// Express middleware for upload rate limiting
export function createUploadRateLimit() {
  const rateLimiter = UploadRateLimiter.getInstance();

  return (req: Request, res: Response, next: NextFunction): void => {
    const identifier = req.ip || req.connection.remoteAddress || 'unknown';
    const userId = (req as any).userId;
    const fileSize = req.file?.size || 0;

    console.log('🔍 [RATE_LIMIT] Checking upload rate limit:', {
      identifier,
      userId,
      fileSize,
      filename: req.file?.originalname
    });

    const result = rateLimiter.checkUploadLimit(identifier, userId, fileSize);

    if (!result.allowed) {
      console.log('❌ [RATE_LIMIT] Upload blocked:', {
        identifier,
        userId,
        reason: result.reason,
        retryAfter: result.retryAfter
      });

      // Log rate limit violation
      logFileUploadBlocked({
        userId,
        filename: req.file?.originalname || 'unknown',
        reason: `Rate limit exceeded: ${result.reason}`,
        userAgent: req.headers['user-agent'],
        ipAddress: identifier
      });

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': '50',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(Date.now() + (result.retryAfter || 900) * 1000).toISOString(),
        'Retry-After': (result.retryAfter || 900).toString()
      });

      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: result.reason,
        retryAfter: result.retryAfter
      });
      return;
    }

    // Set rate limit headers for successful requests
    if (result.limits) {
      res.set({
        'X-RateLimit-Limit': RATE_LIMIT_CONFIG.general.maxUploads.toString(),
        'X-RateLimit-Remaining': result.limits.general.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.limits.general.resetTime).toISOString()
      });
    }

    console.log('✅ [RATE_LIMIT] Upload allowed:', {
      identifier,
      userId,
      remaining: result.limits?.general.remaining
    });

    next();
  };
}

// Utility function to mark suspicious users
export function markUserSuspicious(identifier: string, duration?: number): void {
  const rateLimiter = UploadRateLimiter.getInstance();
  rateLimiter.markSuspicious(identifier, duration);
}

// Utility function to get rate limit status
export function getRateLimitStatus(identifier: string): any {
  const rateLimiter = UploadRateLimiter.getInstance();
  return rateLimiter.getStatus(identifier);
}