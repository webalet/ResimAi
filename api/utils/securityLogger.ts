import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Security logging configuration
const SECURITY_LOG_CONFIG = {
  enabled: true,
  logDir: path.join(process.cwd(), 'logs', 'security'),
  maxLogSize: 10 * 1024 * 1024, // 10MB per log file
  maxLogFiles: 50, // Keep max 50 log files
  rotationInterval: 24 * 60 * 60 * 1000, // 24 hours
  alertThresholds: {
    criticalEvents: 5, // Alert after 5 critical events in 1 hour
    suspiciousActivity: 10, // Alert after 10 suspicious activities in 1 hour
    failedUploads: 20 // Alert after 20 failed uploads in 1 hour
  }
};

// Security event types
export enum SecurityEventType {
  FILE_UPLOAD_BLOCKED = 'FILE_UPLOAD_BLOCKED',
  MALICIOUS_FILE_DETECTED = 'MALICIOUS_FILE_DETECTED',
  PATH_TRAVERSAL_ATTEMPT = 'PATH_TRAVERSAL_ATTEMPT',
  SUSPICIOUS_FILE_CONTENT = 'SUSPICIOUS_FILE_CONTENT',
  QUARANTINE_ACTION = 'QUARANTINE_ACTION',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  AUTHENTICATION_FAILURE = 'AUTHENTICATION_FAILURE',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  SECURITY_SCAN_RESULT = 'SECURITY_SCAN_RESULT'
}

// Security event severity levels
export enum SecuritySeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Security event interface
export interface SecurityEvent {
  id: string;
  timestamp: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
  filename?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  threats?: string[];
  warnings?: string[];
  quarantineId?: string;
  errorMessage?: string;
  stackTrace?: string;
  metadata?: Record<string, any>;
  source: string;
  action: string;
  result: 'SUCCESS' | 'FAILURE' | 'BLOCKED' | 'QUARANTINED';
}

/**
 * Advanced security logger with threat detection and alerting
 */
export class SecurityLogger {
  private static instance: SecurityLogger;
  private logDir: string;
  private currentLogFile: string;
  private eventBuffer: SecurityEvent[] = [];
  private alertCounts: Map<string, { count: number; lastReset: number }> = new Map();
  private rotationTimer?: NodeJS.Timeout;

  private constructor() {
    this.logDir = SECURITY_LOG_CONFIG.logDir;
    this.currentLogFile = this.generateLogFilename();
    this.ensureLogDirectory();
    this.startLogRotation();
  }

  public static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger();
    }
    return SecurityLogger.instance;
  }

  private ensureLogDirectory(): void {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
        console.log('📁 [SECURITY_LOG] Security log directory created:', this.logDir);
      }
    } catch (error) {
      console.error('❌ [SECURITY_LOG] Failed to create log directory:', error);
    }
  }

  private generateLogFilename(): string {
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
    return path.join(this.logDir, `security_${date}_${time}.log`);
  }

  /**
   * Logs a security event with comprehensive details
   * @param event - Security event to log
   */
  public async logSecurityEvent(event: Partial<SecurityEvent>): Promise<void> {
    try {
      if (!SECURITY_LOG_CONFIG.enabled) {
        return;
      }

      // Generate event ID and timestamp
      const securityEvent: SecurityEvent = {
        id: crypto.randomBytes(8).toString('hex'),
        timestamp: new Date().toISOString(),
        source: 'ResimAI-FileUpload',
        action: 'UNKNOWN',
        result: 'FAILURE',
        ...event
      } as SecurityEvent;

      // Add to buffer
      this.eventBuffer.push(securityEvent);

      // Write to log file
      await this.writeToLogFile(securityEvent);

      // Check for alert conditions
      this.checkAlertConditions(securityEvent);

      // Console logging for immediate visibility
      this.logToConsole(securityEvent);

      // Flush buffer if it gets too large
      if (this.eventBuffer.length > 1000) {
        this.eventBuffer = this.eventBuffer.slice(-500); // Keep last 500 events
      }
    } catch (error) {
      console.error('❌ [SECURITY_LOG] Failed to log security event:', error);
    }
  }

  private async writeToLogFile(event: SecurityEvent): Promise<void> {
    try {
      const logEntry = {
        ...event,
        _logLevel: 'SECURITY',
        _application: 'ResimAI'
      };

      const logLine = JSON.stringify(logEntry) + '\n';
      
      // Check if current log file is too large
      if (fs.existsSync(this.currentLogFile)) {
        const stats = fs.statSync(this.currentLogFile);
        if (stats.size > SECURITY_LOG_CONFIG.maxLogSize) {
          this.rotateLogFile();
        }
      }

      // Append to log file
      fs.appendFileSync(this.currentLogFile, logLine, 'utf8');
    } catch (error) {
      console.error('❌ [SECURITY_LOG] Failed to write to log file:', error);
    }
  }

  private logToConsole(event: SecurityEvent): void {
    const emoji = this.getSeverityEmoji(event.severity);
    const color = this.getSeverityColor(event.severity);
    
    console.log(`${emoji} [SECURITY_${event.severity}] ${event.type}:`, {
      id: event.id,
      userId: event.userId,
      filename: event.filename,
      result: event.result,
      threats: event.threats?.length || 0,
      warnings: event.warnings?.length || 0
    });

    // Log critical events with full details
    if (event.severity === SecuritySeverity.CRITICAL) {
      console.error('🚨 [CRITICAL_SECURITY_EVENT]', event);
    }
  }

  private getSeverityEmoji(severity: SecuritySeverity): string {
    switch (severity) {
      case SecuritySeverity.LOW: return '🟢';
      case SecuritySeverity.MEDIUM: return '🟡';
      case SecuritySeverity.HIGH: return '🟠';
      case SecuritySeverity.CRITICAL: return '🔴';
      default: return '⚪';
    }
  }

  private getSeverityColor(severity: SecuritySeverity): string {
    switch (severity) {
      case SecuritySeverity.LOW: return '\x1b[32m'; // Green
      case SecuritySeverity.MEDIUM: return '\x1b[33m'; // Yellow
      case SecuritySeverity.HIGH: return '\x1b[35m'; // Magenta
      case SecuritySeverity.CRITICAL: return '\x1b[31m'; // Red
      default: return '\x1b[0m'; // Reset
    }
  }

  private checkAlertConditions(event: SecurityEvent): void {
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);

    // Count events in the last hour
    const recentEvents = this.eventBuffer.filter(e => 
      new Date(e.timestamp).getTime() > hourAgo
    );

    // Check critical events threshold
    const criticalEvents = recentEvents.filter(e => 
      e.severity === SecuritySeverity.CRITICAL
    ).length;

    if (criticalEvents >= SECURITY_LOG_CONFIG.alertThresholds.criticalEvents) {
      this.triggerSecurityAlert('CRITICAL_EVENTS_THRESHOLD', {
        count: criticalEvents,
        threshold: SECURITY_LOG_CONFIG.alertThresholds.criticalEvents,
        timeWindow: '1 hour'
      });
    }

    // Check suspicious activity threshold
    const suspiciousEvents = recentEvents.filter(e => 
      e.type === SecurityEventType.SUSPICIOUS_FILE_CONTENT ||
      e.type === SecurityEventType.PATH_TRAVERSAL_ATTEMPT ||
      e.type === SecurityEventType.MALICIOUS_FILE_DETECTED
    ).length;

    if (suspiciousEvents >= SECURITY_LOG_CONFIG.alertThresholds.suspiciousActivity) {
      this.triggerSecurityAlert('SUSPICIOUS_ACTIVITY_THRESHOLD', {
        count: suspiciousEvents,
        threshold: SECURITY_LOG_CONFIG.alertThresholds.suspiciousActivity,
        timeWindow: '1 hour'
      });
    }

    // Check failed uploads threshold
    const failedUploads = recentEvents.filter(e => 
      e.result === 'FAILURE' || e.result === 'BLOCKED'
    ).length;

    if (failedUploads >= SECURITY_LOG_CONFIG.alertThresholds.failedUploads) {
      this.triggerSecurityAlert('FAILED_UPLOADS_THRESHOLD', {
        count: failedUploads,
        threshold: SECURITY_LOG_CONFIG.alertThresholds.failedUploads,
        timeWindow: '1 hour'
      });
    }
  }

  private triggerSecurityAlert(alertType: string, details: any): void {
    const alertKey = `${alertType}_${new Date().getHours()}`;
    const existing = this.alertCounts.get(alertKey);
    
    // Only alert once per hour for each type
    if (!existing || Date.now() - existing.lastReset > 60 * 60 * 1000) {
      console.error('🚨 [SECURITY_ALERT]', {
        type: alertType,
        details,
        timestamp: new Date().toISOString()
      });
      
      this.alertCounts.set(alertKey, {
        count: 1,
        lastReset: Date.now()
      });
      
      // In production, you would send this to monitoring systems
      // e.g., Slack, email, PagerDuty, etc.
    }
  }

  private rotateLogFile(): void {
    try {
      // Generate new log filename
      this.currentLogFile = this.generateLogFilename();
      
      // Clean up old log files
      this.cleanupOldLogFiles();
      
      console.log('🔄 [SECURITY_LOG] Log file rotated:', this.currentLogFile);
    } catch (error) {
      console.error('❌ [SECURITY_LOG] Failed to rotate log file:', error);
    }
  }

  private cleanupOldLogFiles(): void {
    try {
      const logFiles = fs.readdirSync(this.logDir)
        .filter(file => file.startsWith('security_') && file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(this.logDir, file),
          mtime: fs.statSync(path.join(this.logDir, file)).mtime
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      // Remove excess log files
      if (logFiles.length > SECURITY_LOG_CONFIG.maxLogFiles) {
        const filesToDelete = logFiles.slice(SECURITY_LOG_CONFIG.maxLogFiles);
        
        for (const file of filesToDelete) {
          fs.unlinkSync(file.path);
          console.log('🗑️ [SECURITY_LOG] Deleted old log file:', file.name);
        }
      }
    } catch (error) {
      console.error('❌ [SECURITY_LOG] Failed to cleanup old log files:', error);
    }
  }

  private startLogRotation(): void {
    this.rotationTimer = setInterval(() => {
      this.rotateLogFile();
    }, SECURITY_LOG_CONFIG.rotationInterval);
  }

  /**
   * Gets recent security events for analysis
   * @param hours - Number of hours to look back
   * @returns Recent security events
   */
  public getRecentEvents(hours: number = 24): SecurityEvent[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.eventBuffer.filter(event => 
      new Date(event.timestamp).getTime() > cutoff
    );
  }

  /**
   * Gets security statistics
   * @returns Security statistics
   */
  public getSecurityStats(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    recentThreats: number;
    quarantinedFiles: number;
  } {
    const recentEvents = this.getRecentEvents(24);
    
    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    let quarantinedFiles = 0;
    
    for (const event of recentEvents) {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
      
      if (event.result === 'QUARANTINED') {
        quarantinedFiles++;
      }
    }
    
    const recentThreats = recentEvents.filter(e => 
      e.severity === SecuritySeverity.HIGH || e.severity === SecuritySeverity.CRITICAL
    ).length;
    
    return {
      totalEvents: recentEvents.length,
      eventsByType,
      eventsBySeverity,
      recentThreats,
      quarantinedFiles
    };
  }

  public destroy(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
    }
  }
}

/**
 * Convenience functions for logging specific security events
 */
export const securityLogger = SecurityLogger.getInstance();

export function logFileUploadBlocked(details: {
  userId?: string;
  filename: string;
  reason: string;
  threats?: string[];
  userAgent?: string;
  ipAddress?: string;
}): void {
  securityLogger.logSecurityEvent({
    type: SecurityEventType.FILE_UPLOAD_BLOCKED,
    severity: SecuritySeverity.MEDIUM,
    userId: details.userId,
    filename: details.filename,
    threats: details.threats,
    userAgent: details.userAgent,
    ipAddress: details.ipAddress,
    action: 'FILE_UPLOAD',
    result: 'BLOCKED',
    errorMessage: details.reason
  });
}

export function logMaliciousFileDetected(details: {
  userId?: string;
  filename: string;
  filePath: string;
  threats: string[];
  quarantineId?: string;
  userAgent?: string;
  ipAddress?: string;
}): void {
  securityLogger.logSecurityEvent({
    type: SecurityEventType.MALICIOUS_FILE_DETECTED,
    severity: SecuritySeverity.CRITICAL,
    userId: details.userId,
    filename: details.filename,
    filePath: details.filePath,
    threats: details.threats,
    quarantineId: details.quarantineId,
    userAgent: details.userAgent,
    ipAddress: details.ipAddress,
    action: 'MALWARE_DETECTION',
    result: details.quarantineId ? 'QUARANTINED' : 'BLOCKED'
  });
}

export function logPathTraversalAttempt(details: {
  userId?: string;
  filename: string;
  attemptedPath: string;
  userAgent?: string;
  ipAddress?: string;
}): void {
  securityLogger.logSecurityEvent({
    type: SecurityEventType.PATH_TRAVERSAL_ATTEMPT,
    severity: SecuritySeverity.HIGH,
    userId: details.userId,
    filename: details.filename,
    userAgent: details.userAgent,
    ipAddress: details.ipAddress,
    action: 'PATH_TRAVERSAL',
    result: 'BLOCKED',
    metadata: { attemptedPath: details.attemptedPath }
  });
}

export function logSecurityScanResult(details: {
  userId?: string;
  filename: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  threats?: string[];
  warnings?: string[];
  quarantineId?: string;
  scanResults?: any;
}): void {
  const severity = details.threats && details.threats.length > 0 
    ? SecuritySeverity.HIGH 
    : details.warnings && details.warnings.length > 2 
      ? SecuritySeverity.MEDIUM 
      : SecuritySeverity.LOW;

  securityLogger.logSecurityEvent({
    type: SecurityEventType.SECURITY_SCAN_RESULT,
    severity,
    userId: details.userId,
    filename: details.filename,
    filePath: details.filePath,
    fileSize: details.fileSize,
    mimeType: details.mimeType,
    threats: details.threats,
    warnings: details.warnings,
    quarantineId: details.quarantineId,
    action: 'SECURITY_SCAN',
    result: details.threats && details.threats.length > 0 ? 'BLOCKED' : 'SUCCESS',
    metadata: { scanResults: details.scanResults }
  });
}

export function logSystemError(details: {
  error: Error;
  context: string;
  userId?: string;
  filename?: string;
}): void {
  securityLogger.logSecurityEvent({
    type: SecurityEventType.SYSTEM_ERROR,
    severity: SecuritySeverity.MEDIUM,
    userId: details.userId,
    filename: details.filename,
    action: details.context,
    result: 'FAILURE',
    errorMessage: details.error.message,
    stackTrace: details.error.stack
  });
}