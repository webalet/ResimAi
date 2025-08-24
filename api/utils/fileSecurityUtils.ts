import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);

// Magic numbers (file signatures) for common image formats
const IMAGE_MAGIC_NUMBERS = {
  // JPEG
  'FFD8FF': 'image/jpeg',
  // PNG
  '89504E47': 'image/png',
  // GIF87a
  '474946383761': 'image/gif',
  // GIF89a
  '474946383961': 'image/gif',
  // WebP
  '52494646': 'image/webp', // RIFF header, need to check WEBP at offset 8
  // BMP
  '424D': 'image/bmp',
  // TIFF (little endian)
  '49492A00': 'image/tiff',
  // TIFF (big endian)
  '4D4D002A': 'image/tiff',
  // ICO
  '00000100': 'image/x-icon'
};

// Dangerous file extensions that should never be allowed
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
  '.php', '.asp', '.aspx', '.jsp', '.py', '.rb', '.pl', '.sh', '.ps1',
  '.msi', '.deb', '.rpm', '.dmg', '.app', '.ipa', '.apk'
];

// Allowed image extensions (whitelist)
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.ico'];

// Maximum file sizes by type (in bytes)
const MAX_FILE_SIZES = {
  'image/jpeg': 50 * 1024 * 1024, // 50MB
  'image/png': 50 * 1024 * 1024,  // 50MB
  'image/gif': 20 * 1024 * 1024,  // 20MB
  'image/webp': 30 * 1024 * 1024, // 30MB
  'image/bmp': 100 * 1024 * 1024, // 100MB (BMP files are larger)
  'image/tiff': 100 * 1024 * 1024, // 100MB
  'image/x-icon': 1 * 1024 * 1024  // 1MB
};

/**
 * Validates file magic number (file signature) to ensure file type authenticity
 * @param filePath - Path to the file to validate
 * @returns Object with validation result and detected MIME type
 */
export async function validateFileMagicNumber(filePath: string): Promise<{
  isValid: boolean;
  detectedMimeType: string | null;
  error?: string;
}> {
  try {
    // Read first 16 bytes to check magic number
    const buffer = Buffer.alloc(16);
    const fd = fs.openSync(filePath, 'r');
    const bytesRead = fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);

    if (bytesRead === 0) {
      return {
        isValid: false,
        detectedMimeType: null,
        error: 'Dosya boş veya okunamıyor'
      };
    }

    // Convert buffer to hex string
    const hex = buffer.toString('hex').toUpperCase();
    
    // Check for exact matches first
    for (const [signature, mimeType] of Object.entries(IMAGE_MAGIC_NUMBERS)) {
      if (hex.startsWith(signature)) {
        // Special case for WebP - need to check WEBP signature at offset 8
        if (signature === '52494646') {
          const webpBuffer = Buffer.alloc(4);
          const webpFd = fs.openSync(filePath, 'r');
          fs.readSync(webpFd, webpBuffer, 0, 4, 8);
          fs.closeSync(webpFd);
          const webpHex = webpBuffer.toString('hex').toUpperCase();
          if (webpHex === '57454250') { // 'WEBP'
            return {
              isValid: true,
              detectedMimeType: 'image/webp'
            };
          }
        } else {
          return {
            isValid: true,
            detectedMimeType: mimeType
          };
        }
      }
    }

    return {
      isValid: false,
      detectedMimeType: null,
      error: 'Geçersiz dosya formatı - desteklenmeyen görsel türü'
    };
  } catch (error) {
    return {
      isValid: false,
      detectedMimeType: null,
      error: `Dosya okuma hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`
    };
  }
}

/**
 * Validates file extension against whitelist and blacklist
 * @param filename - Original filename
 * @returns Validation result
 */
export function validateFileExtension(filename: string): {
  isValid: boolean;
  error?: string;
} {
  const ext = path.extname(filename).toLowerCase();
  
  // Check against dangerous extensions
  if (DANGEROUS_EXTENSIONS.includes(ext)) {
    return {
      isValid: false,
      error: `Tehlikeli dosya uzantısı: ${ext}`
    };
  }
  
  // Check against allowed image extensions
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    return {
      isValid: false,
      error: `Desteklenmeyen dosya uzantısı: ${ext}. İzin verilen: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}`
    };
  }
  
  return { isValid: true };
}

/**
 * Generates a secure filename to prevent path traversal attacks
 * @param originalFilename - Original filename
 * @param userId - User ID for namespacing
 * @returns Secure filename
 */
export function generateSecureFilename(originalFilename: string, userId: string): string {
  // Validate inputs
  if (!originalFilename || typeof originalFilename !== 'string') {
    throw new Error('Geçersiz dosya adı');
  }
  
  if (!userId || typeof userId !== 'string') {
    throw new Error('Geçersiz kullanıcı ID');
  }
  
  // Remove any path components and normalize
  let basename = path.basename(originalFilename);
  
  // Check for path traversal attempts
  const pathTraversalPatterns = [
    '../', '..\\', '..\/', '\.\.',
    '%2e%2e', '%2E%2E', '%2e%2e%2f', '%2e%2e%5c',
    '..%2f', '..%5c', '%252e%252e',
    '0x2e0x2e0x2f', '0x2e0x2e0x5c'
  ];
  
  for (const pattern of pathTraversalPatterns) {
    if (originalFilename.toLowerCase().includes(pattern.toLowerCase())) {
      console.warn('🚨 [SECURITY] Path traversal attempt detected:', {
        filename: originalFilename,
        pattern,
        userId
      });
      // Use only the actual filename part
      basename = path.basename(basename);
      break;
    }
  }
  
  // Remove dangerous characters and normalize
  const safeName = basename
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // Remove control characters
    .replace(/[<>:"/\\|?*]/g, '_') // Replace filesystem reserved chars
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace other unsafe chars
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
    .replace(/^[._-]+|[._-]+$/g, '') // Remove leading/trailing special chars
    .substring(0, 100); // Limit length
  
  // Validate the cleaned name
  if (!safeName || safeName.length === 0) {
    console.warn('🚨 [SECURITY] Filename became empty after sanitization:', originalFilename);
    basename = 'secure_upload';
  } else {
    basename = safeName;
  }
  
  // Generate cryptographically secure timestamp and random component
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(8).toString('hex'); // Increased to 8 bytes
  const userIdHash = crypto.createHash('sha256').update(userId).digest('hex').substring(0, 8);
  
  // Extract extension safely
  const ext = path.extname(basename).toLowerCase();
  let nameWithoutExt = path.basename(basename, ext);
  
  // Ensure name part is not empty
  if (!nameWithoutExt || nameWithoutExt.length === 0) {
    nameWithoutExt = 'file';
  }
  
  // Limit name part length
  if (nameWithoutExt.length > 50) {
    nameWithoutExt = nameWithoutExt.substring(0, 50);
  }
  
  // Construct secure filename with multiple security layers
  const secureFilename = `${userIdHash}_${timestamp}_${randomBytes}_${nameWithoutExt}${ext}`;
  
  // Final validation
  if (secureFilename.length > 255) {
    // Truncate if too long for filesystem
    const maxNameLength = 255 - ext.length - userIdHash.length - timestamp.toString().length - randomBytes.length - 3; // 3 for underscores
    nameWithoutExt = nameWithoutExt.substring(0, Math.max(1, maxNameLength));
    return `${userIdHash}_${timestamp}_${randomBytes}_${nameWithoutExt}${ext}`;
  }
  
  console.log('✅ [SECURITY] Secure filename generated:', {
    original: originalFilename,
    secure: secureFilename,
    userId: userIdHash
  });
  
  return secureFilename;
}

/**
 * Validates and sanitizes file paths to prevent directory traversal
 * @param filePath - File path to validate
 * @param allowedBasePath - Base path that files should be within
 * @returns Validation result with sanitized path
 */
export function validateAndSanitizePath(filePath: string, allowedBasePath: string): {
  isValid: boolean;
  sanitizedPath?: string;
  error?: string;
} {
  try {
    // Normalize paths
    const normalizedFilePath = path.normalize(filePath);
    const normalizedBasePath = path.normalize(allowedBasePath);
    
    // Resolve to absolute paths
    const resolvedFilePath = path.resolve(normalizedFilePath);
    const resolvedBasePath = path.resolve(normalizedBasePath);
    
    // Check if file path is within allowed base path
    const relativePath = path.relative(resolvedBasePath, resolvedFilePath);
    
    // If relative path starts with '..' or is absolute, it's outside the base path
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      return {
        isValid: false,
        error: 'Path traversal attempt detected - file outside allowed directory'
      };
    }
    
    // Additional checks for suspicious patterns
    const suspiciousPatterns = [
      /\.\.[\/\\]/,  // ../ or ..\
      /[\/\\]\.\.[\/\\]/, // /../ or \..\
      /[\/\\]\.$/, // Ends with /. or \.
      /^\.\./, // Starts with ..
      /\x00/, // Null bytes
      /%2e%2e/i, // URL encoded ..
      /%2f/i, // URL encoded /
      /%5c/i  // URL encoded \
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(filePath)) {
        return {
          isValid: false,
          error: `Suspicious path pattern detected: ${pattern.source}`
        };
      }
    }
    
    return {
      isValid: true,
      sanitizedPath: resolvedFilePath
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Path validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Creates a secure upload directory structure
 * @param userId - User ID for directory namespacing
 * @param baseUploadPath - Base upload directory
 * @returns Secure directory path
 */
export function createSecureUploadDirectory(userId: string, baseUploadPath: string): {
  success: boolean;
  directoryPath?: string;
  error?: string;
} {
  try {
    // Validate inputs
    if (!userId || !baseUploadPath) {
      return {
        success: false,
        error: 'Invalid userId or baseUploadPath'
      };
    }
    
    // Create user-specific directory with hash for privacy
    const userIdHash = crypto.createHash('sha256').update(userId).digest('hex').substring(0, 16);
    const datePath = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const userDirectory = path.join(baseUploadPath, userIdHash, datePath);
    
    // Validate the constructed path
    const pathValidation = validateAndSanitizePath(userDirectory, baseUploadPath);
    if (!pathValidation.isValid) {
      return {
        success: false,
        error: pathValidation.error
      };
    }
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(userDirectory)) {
      fs.mkdirSync(userDirectory, { recursive: true, mode: 0o755 });
    }
    
    return {
      success: true,
      directoryPath: userDirectory
    };
  } catch (error) {
    return {
      success: false,
      error: `Directory creation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Validates file size against type-specific limits
 * @param fileSize - File size in bytes
 * @param mimeType - MIME type of the file
 * @returns Validation result
 */
export function validateFileSize(fileSize: number, mimeType: string): {
  isValid: boolean;
  error?: string;
} {
  const maxSize = MAX_FILE_SIZES[mimeType as keyof typeof MAX_FILE_SIZES];
  
  if (!maxSize) {
    return {
      isValid: false,
      error: `Desteklenmeyen MIME türü: ${mimeType}`
    };
  }
  
  if (fileSize > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    const fileSizeMB = Math.round(fileSize / (1024 * 1024));
    return {
      isValid: false,
      error: `Dosya boyutu çok büyük: ${fileSizeMB}MB. Maksimum: ${maxSizeMB}MB`
    };
  }
  
  return { isValid: true };
}

/**
 * Performs comprehensive content scanning and validation
 * @param filePath - Path to the file to scan
 * @returns Detailed scan result
 */
export async function performAdvancedContentScan(filePath: string): Promise<{
  isSafe: boolean;
  threats?: string[];
  warnings?: string[];
  contentAnalysis?: {
    entropy: number;
    suspiciousPatterns: number;
    embeddedFiles: boolean;
    metadataIssues: string[];
  };
  error?: string;
}> {
  try {
    const fileContent = fs.readFileSync(filePath);
    const contentString = fileContent.toString('binary');
    const stats = fs.statSync(filePath);
    
    const threats: string[] = [];
    const warnings: string[] = [];
    const metadataIssues: string[] = [];
    let suspiciousPatterns = 0;
    let embeddedFiles = false;
    
    // 1. Check for executable signatures in image files
    const executablePatterns = [
      { pattern: 'MZ', description: 'DOS/Windows executable header' },
      { pattern: '\x7fELF', description: 'Linux ELF executable' },
      { pattern: '\xca\xfe\xba\xbe', description: 'Mach-O executable (macOS)' },
      { pattern: '\xfe\xed\xfa', description: 'Mach-O executable' },
      { pattern: 'PK\x03\x04', description: 'ZIP/JAR archive (potential malware container)' },
      { pattern: '\x50\x4b', description: 'ZIP archive signature' },
      { pattern: 'Rar!', description: 'RAR archive signature' }
    ];
    
    for (const { pattern, description } of executablePatterns) {
      if (contentString.includes(pattern)) {
        threats.push(`Tehlikeli: ${description} tespit edildi`);
        suspiciousPatterns++;
        embeddedFiles = true;
      }
    }
    
    // 2. Check for script injections and web exploits
    const scriptPatterns = [
      { pattern: '<script', severity: 'high', description: 'JavaScript injection' },
      { pattern: '</script>', severity: 'high', description: 'JavaScript injection' },
      { pattern: 'javascript:', severity: 'high', description: 'JavaScript protocol' },
      { pattern: 'vbscript:', severity: 'high', description: 'VBScript protocol' },
      { pattern: 'onload=', severity: 'medium', description: 'Event handler injection' },
      { pattern: 'onerror=', severity: 'medium', description: 'Error handler injection' },
      { pattern: 'onclick=', severity: 'medium', description: 'Click handler injection' },
      { pattern: 'eval(', severity: 'high', description: 'Dynamic code execution' },
      { pattern: 'document.write', severity: 'medium', description: 'DOM manipulation' },
      { pattern: 'innerHTML', severity: 'low', description: 'HTML injection potential' }
    ];
    
    for (const { pattern, severity, description } of scriptPatterns) {
      if (contentString.toLowerCase().includes(pattern.toLowerCase())) {
        if (severity === 'high') {
          threats.push(`Yüksek risk: ${description} tespit edildi`);
        } else if (severity === 'medium') {
          warnings.push(`Orta risk: ${description} tespit edildi`);
        } else {
          warnings.push(`Düşük risk: ${description} tespit edildi`);
        }
        suspiciousPatterns++;
      }
    }
    
    // 3. Check for SQL injection patterns
    const sqlPatterns = [
      'union select', 'drop table', 'delete from', 'insert into',
      'update set', 'alter table', 'create table', 'exec(',
      'xp_cmdshell', 'sp_executesql'
    ];
    
    for (const pattern of sqlPatterns) {
      if (contentString.toLowerCase().includes(pattern)) {
        threats.push(`SQL injection pattern tespit edildi: ${pattern}`);
        suspiciousPatterns++;
      }
    }
    
    // 4. Check for command injection patterns
    const commandPatterns = [
      '$(', '`', '&&', '||', ';', '|',
      'cmd.exe', '/bin/sh', '/bin/bash', 'powershell'
    ];
    
    let commandPatternCount = 0;
    for (const pattern of commandPatterns) {
      if (contentString.includes(pattern)) {
        commandPatternCount++;
      }
    }
    
    if (commandPatternCount > 3) {
      threats.push(`Çoklu komut injection pattern tespit edildi (${commandPatternCount} pattern)`);
      suspiciousPatterns += commandPatternCount;
    }
    
    // 5. Check for polyglot file attacks
    const polyglotIndicators = [
      { pattern: 'GIF89a', description: 'GIF header in non-GIF file' },
      { pattern: 'JFIF', description: 'JPEG header in non-JPEG file' },
      { pattern: '\x89PNG', description: 'PNG header in non-PNG file' },
      { pattern: '%PDF', description: 'PDF header in image file' },
      { pattern: '<?php', description: 'PHP code in image file' },
      { pattern: '<%', description: 'ASP/JSP code in image file' }
    ];
    
    // Get actual file type from magic number
    const magicValidation = await validateFileMagicNumber(filePath);
    const detectedType = magicValidation.detectedMimeType;
    
    for (const { pattern, description } of polyglotIndicators) {
      if (contentString.includes(pattern)) {
        // Check if this pattern matches the detected file type
        const isValidForType = (
          (pattern === 'GIF89a' && detectedType === 'image/gif') ||
          (pattern === 'JFIF' && detectedType === 'image/jpeg') ||
          (pattern === '\x89PNG' && detectedType === 'image/png')
        );
        
        if (!isValidForType) {
          threats.push(`Polyglot saldırısı: ${description}`);
          suspiciousPatterns++;
        }
      }
    }
    
    // 6. Calculate entropy for encryption/obfuscation detection
    const entropy = calculateEntropy(fileContent.slice(0, Math.min(4096, fileContent.length)));
    
    if (entropy > 7.8) {
      threats.push(`Çok yüksek entropi (${entropy.toFixed(2)}) - şifrelenmiş/gizlenmiş içerik`);
    } else if (entropy > 7.5) {
      warnings.push(`Yüksek entropi (${entropy.toFixed(2)}) - sıkıştırılmış içerik olabilir`);
    }
    
    // 7. Check for suspicious metadata or EXIF data
    if (contentString.includes('\x00\x00')) {
      const nullByteCount = (contentString.match(/\x00/g) || []).length;
      if (nullByteCount > fileContent.length * 0.1) {
        warnings.push(`Yüksek null byte oranı (${nullByteCount}) - veri gizleme olasılığı`);
      }
    }
    
    // 8. File size anomaly detection
    if (stats.size > 100 * 1024 * 1024) { // Files larger than 100MB
      warnings.push(`Çok büyük dosya boyutu (${Math.round(stats.size / (1024 * 1024))}MB) - DoS saldırısı riski`);
    }
    
    // 9. Check for steganography indicators
    const steganographyPatterns = [
      'steghide', 'outguess', 'jsteg', 'f5',
      'LSB', 'least significant bit'
    ];
    
    for (const pattern of steganographyPatterns) {
      if (contentString.toLowerCase().includes(pattern.toLowerCase())) {
        warnings.push(`Steganografi göstergesi tespit edildi: ${pattern}`);
      }
    }
    
    return {
      isSafe: threats.length === 0,
      threats: threats.length > 0 ? threats : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      contentAnalysis: {
        entropy,
        suspiciousPatterns,
        embeddedFiles,
        metadataIssues
      }
    };
  } catch (error) {
    return {
      isSafe: false,
      error: `İçerik tarama hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`
    };
  }
}

/**
 * Legacy function - kept for backward compatibility
 * @deprecated Use performAdvancedContentScan instead
 */
export async function performBasicVirusScan(filePath: string): Promise<{
  isSafe: boolean;
  threats?: string[];
  error?: string;
}> {
  const result = await performAdvancedContentScan(filePath);
  return {
    isSafe: result.isSafe,
    threats: result.threats,
    error: result.error
  };
}

/**
 * Calculates Shannon entropy of data (for detecting encrypted/compressed content)
 * @param data - Buffer to analyze
 * @returns Entropy value (0-8)
 */
function calculateEntropy(data: Buffer): number {
  const frequency: { [key: number]: number } = {};
  
  // Count byte frequencies
  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    frequency[byte] = (frequency[byte] || 0) + 1;
  }
  
  // Calculate entropy
  let entropy = 0;
  const length = data.length;
  
  for (const count of Object.values(frequency)) {
    const probability = count / length;
    entropy -= probability * Math.log2(probability);
  }
  
  return entropy;
}

/**
 * Enhanced image dimensions and size validation to prevent memory exhaustion attacks
 * @param filePath - Path to the image file
 * @param mimeType - Detected MIME type of the image
 * @returns Detailed validation result with dimensions and size analysis
 */
export async function validateImageDimensions(filePath: string, mimeType?: string): Promise<{
  isValid: boolean;
  width?: number;
  height?: number;
  fileSize?: number;
  estimatedMemoryUsage?: number;
  compressionRatio?: number;
  warnings?: string[];
  error?: string;
}> {
  try {
    const stats = fs.statSync(filePath);
    const warnings: string[] = [];
    
    // Enhanced size limits based on image type
    const sizeLimits = {
      'image/jpeg': { maxSize: 50 * 1024 * 1024, maxPixels: 100 * 1024 * 1024, maxDimension: 15000 },
      'image/png': { maxSize: 100 * 1024 * 1024, maxPixels: 50 * 1024 * 1024, maxDimension: 10000 },
      'image/gif': { maxSize: 20 * 1024 * 1024, maxPixels: 10 * 1024 * 1024, maxDimension: 5000 },
      'image/webp': { maxSize: 30 * 1024 * 1024, maxPixels: 75 * 1024 * 1024, maxDimension: 12000 },
      'image/bmp': { maxSize: 200 * 1024 * 1024, maxPixels: 25 * 1024 * 1024, maxDimension: 8000 },
      'image/tiff': { maxSize: 500 * 1024 * 1024, maxPixels: 200 * 1024 * 1024, maxDimension: 20000 },
      'default': { maxSize: 50 * 1024 * 1024, maxPixels: 50 * 1024 * 1024, maxDimension: 10000 }
    };
    
    const limits = sizeLimits[mimeType as keyof typeof sizeLimits] || sizeLimits.default;
    
    // Basic file size validation
    if (stats.size > limits.maxSize) {
      return {
        isValid: false,
        fileSize: stats.size,
        error: `Dosya boyutu çok büyük: ${Math.round(stats.size / (1024 * 1024))}MB. Maksimum: ${Math.round(limits.maxSize / (1024 * 1024))}MB`
      };
    }
    
    // Try to extract basic image information from headers
    let width: number | undefined;
    let height: number | undefined;
    
    try {
      const dimensions = await extractImageDimensions(filePath, mimeType);
      width = dimensions.width;
      height = dimensions.height;
    } catch (error) {
      warnings.push(`Boyut bilgisi çıkarılamadı: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
    
    // If we have dimensions, perform advanced validation
    if (width && height) {
      // Check individual dimension limits
      if (width > limits.maxDimension || height > limits.maxDimension) {
        return {
          isValid: false,
          width,
          height,
          fileSize: stats.size,
          error: `Görsel boyutları çok büyük: ${width}x${height}. Maksimum boyut: ${limits.maxDimension}px`
        };
      }
      
      // Check total pixel count
      const totalPixels = width * height;
      if (totalPixels > limits.maxPixels) {
        return {
          isValid: false,
          width,
          height,
          fileSize: stats.size,
          error: `Toplam piksel sayısı çok yüksek: ${totalPixels.toLocaleString()}. Maksimum: ${limits.maxPixels.toLocaleString()}`
        };
      }
      
      // Estimate memory usage (RGB + Alpha = 4 bytes per pixel)
      const estimatedMemoryUsage = totalPixels * 4;
      const maxMemoryUsage = 1024 * 1024 * 1024; // 1GB
      
      if (estimatedMemoryUsage > maxMemoryUsage) {
        return {
          isValid: false,
          width,
          height,
          fileSize: stats.size,
          estimatedMemoryUsage,
          error: `Tahmini bellek kullanımı çok yüksek: ${Math.round(estimatedMemoryUsage / (1024 * 1024))}MB`
        };
      }
      
      // Calculate compression ratio for anomaly detection
      const uncompressedSize = totalPixels * 3; // RGB without alpha
      const compressionRatio = uncompressedSize / stats.size;
      
      // Suspicious compression ratios might indicate steganography or malicious content
      if (compressionRatio < 1) {
        warnings.push(`Şüpheli sıkıştırma oranı: ${compressionRatio.toFixed(2)} - dosya boyutu beklenenden büyük`);
      } else if (compressionRatio > 1000) {
        warnings.push(`Çok yüksek sıkıştırma oranı: ${compressionRatio.toFixed(2)} - veri gizleme olasılığı`);
      }
      
      // Check for suspicious aspect ratios
      const aspectRatio = width / height;
      if (aspectRatio > 100 || aspectRatio < 0.01) {
        warnings.push(`Şüpheli en-boy oranı: ${aspectRatio.toFixed(2)} - potansiyel saldırı göstergesi`);
      }
      
      // Memory usage warnings
      if (estimatedMemoryUsage > 100 * 1024 * 1024) { // 100MB
        warnings.push(`Yüksek bellek kullanımı: ${Math.round(estimatedMemoryUsage / (1024 * 1024))}MB`);
      }
      
      return {
        isValid: true,
        width,
        height,
        fileSize: stats.size,
        estimatedMemoryUsage,
        compressionRatio,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    }
    
    // If we couldn't extract dimensions, do basic validation
    return {
      isValid: true,
      fileSize: stats.size,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Boyut doğrulama hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`
    };
  }
}

/**
 * Extracts image dimensions from file headers (basic implementation)
 * @param filePath - Path to the image file
 * @param mimeType - MIME type of the image
 * @returns Image dimensions
 */
async function extractImageDimensions(filePath: string, mimeType?: string): Promise<{
  width: number;
  height: number;
}> {
  const buffer = fs.readFileSync(filePath);
  
  switch (mimeType) {
    case 'image/png':
      return extractPNGDimensions(buffer);
    case 'image/jpeg':
      return extractJPEGDimensions(buffer);
    case 'image/gif':
      return extractGIFDimensions(buffer);
    case 'image/bmp':
      return extractBMPDimensions(buffer);
    case 'image/webp':
      return extractWebPDimensions(buffer);
    default:
      throw new Error(`Desteklenmeyen görsel formatı: ${mimeType}`);
  }
}

/**
 * Extract PNG dimensions from buffer
 */
function extractPNGDimensions(buffer: Buffer): { width: number; height: number } {
  if (buffer.length < 24) {
    throw new Error('Geçersiz PNG dosyası - çok kısa');
  }
  
  // PNG signature check
  if (!buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))) {
    throw new Error('Geçersiz PNG signature');
  }
  
  // IHDR chunk should be at offset 8
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  
  return { width, height };
}

/**
 * Extract JPEG dimensions from buffer
 */
function extractJPEGDimensions(buffer: Buffer): { width: number; height: number } {
  let offset = 2; // Skip SOI marker
  
  while (offset < buffer.length - 4) {
    // Find SOF marker (0xFFC0 to 0xFFC3)
    if (buffer[offset] === 0xFF && (buffer[offset + 1] >= 0xC0 && buffer[offset + 1] <= 0xC3)) {
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      return { width, height };
    }
    
    // Skip to next marker
    if (buffer[offset] === 0xFF) {
      const markerLength = buffer.readUInt16BE(offset + 2);
      offset += 2 + markerLength;
    } else {
      offset++;
    }
  }
  
  throw new Error('JPEG boyut bilgisi bulunamadı');
}

/**
 * Extract GIF dimensions from buffer
 */
function extractGIFDimensions(buffer: Buffer): { width: number; height: number } {
  if (buffer.length < 10) {
    throw new Error('Geçersiz GIF dosyası - çok kısa');
  }
  
  // Check GIF signature
  const signature = buffer.subarray(0, 6).toString('ascii');
  if (signature !== 'GIF87a' && signature !== 'GIF89a') {
    throw new Error('Geçersiz GIF signature');
  }
  
  const width = buffer.readUInt16LE(6);
  const height = buffer.readUInt16LE(8);
  
  return { width, height };
}

/**
 * Extract BMP dimensions from buffer
 */
function extractBMPDimensions(buffer: Buffer): { width: number; height: number } {
  if (buffer.length < 26) {
    throw new Error('Geçersiz BMP dosyası - çok kısa');
  }
  
  // Check BMP signature
  if (buffer.readUInt16LE(0) !== 0x4D42) { // 'BM'
    throw new Error('Geçersiz BMP signature');
  }
  
  const width = buffer.readInt32LE(18);
  const height = Math.abs(buffer.readInt32LE(22)); // Height can be negative
  
  return { width, height };
}

/**
 * Extract WebP dimensions from buffer
 */
function extractWebPDimensions(buffer: Buffer): { width: number; height: number } {
  if (buffer.length < 30) {
    throw new Error('Geçersiz WebP dosyası - çok kısa');
  }
  
  // Check RIFF signature
  if (buffer.subarray(0, 4).toString('ascii') !== 'RIFF') {
    throw new Error('Geçersiz RIFF signature');
  }
  
  // Check WebP signature
  if (buffer.subarray(8, 12).toString('ascii') !== 'WEBP') {
    throw new Error('Geçersiz WebP signature');
  }
  
  // Check VP8 format
  const format = buffer.subarray(12, 16).toString('ascii');
  
  if (format === 'VP8 ') {
    // Simple VP8 format
    const width = buffer.readUInt16LE(26) & 0x3FFF;
    const height = buffer.readUInt16LE(28) & 0x3FFF;
    return { width, height };
  } else if (format === 'VP8L') {
    // Lossless VP8 format
    const bits = buffer.readUInt32LE(21);
    const width = (bits & 0x3FFF) + 1;
    const height = ((bits >> 14) & 0x3FFF) + 1;
    return { width, height };
  } else if (format === 'VP8X') {
    // Extended VP8 format
    const width = (buffer.readUInt32LE(24) & 0xFFFFFF) + 1;
    const height = (buffer.readUInt32LE(27) & 0xFFFFFF) + 1;
    return { width, height };
  }
  
  throw new Error('Desteklenmeyen WebP formatı');
}

// Quarantine system configuration
const QUARANTINE_CONFIG = {
  enabled: true,
  quarantineDir: path.join(process.cwd(), 'quarantine'),
  maxQuarantineTime: 24 * 60 * 60 * 1000, // 24 hours
  maxQuarantineSize: 1024 * 1024 * 1024, // 1GB total quarantine size
  cleanupInterval: 60 * 60 * 1000 // 1 hour cleanup interval
};

/**
 * File quarantine system for suspicious files
 */
export class FileQuarantine {
  private static instance: FileQuarantine;
  private quarantineDir: string;
  private cleanupTimer?: NodeJS.Timeout;

  private constructor() {
    this.quarantineDir = QUARANTINE_CONFIG.quarantineDir;
    this.ensureQuarantineDir();
    this.startCleanupTimer();
  }

  public static getInstance(): FileQuarantine {
    if (!FileQuarantine.instance) {
      FileQuarantine.instance = new FileQuarantine();
    }
    return FileQuarantine.instance;
  }

  private async ensureQuarantineDir(): Promise<void> {
    try {
      if (!fs.existsSync(this.quarantineDir)) {
        await mkdir(this.quarantineDir, { recursive: true });
        console.log('🔒 [QUARANTINE] Quarantine directory created:', this.quarantineDir);
      }
    } catch (error) {
      console.error('❌ [QUARANTINE] Failed to create quarantine directory:', error);
    }
  }

  /**
   * Quarantines a suspicious file
   * @param filePath - Path to the suspicious file
   * @param reason - Reason for quarantine
   * @param metadata - Additional metadata
   * @returns Quarantine result
   */
  public async quarantineFile(filePath: string, reason: string, metadata?: any): Promise<{
    success: boolean;
    quarantineId?: string;
    quarantinePath?: string;
    error?: string;
  }> {
    try {
      if (!QUARANTINE_CONFIG.enabled) {
        return {
          success: false,
          error: 'Quarantine system is disabled'
        };
      }

      // Generate unique quarantine ID
      const quarantineId = crypto.randomBytes(16).toString('hex');
      const timestamp = new Date().toISOString();
      const originalFilename = path.basename(filePath);
      
      // Create quarantine subdirectory by date
      const dateDir = new Date().toISOString().split('T')[0];
      const quarantineSubDir = path.join(this.quarantineDir, dateDir);
      
      if (!fs.existsSync(quarantineSubDir)) {
        await mkdir(quarantineSubDir, { recursive: true });
      }

      // Create quarantine filename
      const quarantineFilename = `${quarantineId}_${originalFilename}`;
      const quarantinePath = path.join(quarantineSubDir, quarantineFilename);
      
      // Copy file to quarantine (don't move to preserve original for investigation)
      const fileContent = await readFile(filePath);
      await writeFile(quarantinePath, fileContent);

      // Create metadata file
      const metadataPath = path.join(quarantineSubDir, `${quarantineId}_metadata.json`);
      const quarantineMetadata = {
        quarantineId,
        originalPath: filePath,
        originalFilename,
        reason,
        timestamp,
        fileSize: fileContent.length,
        fileHash: crypto.createHash('sha256').update(fileContent).digest('hex'),
        metadata: metadata || {},
        status: 'quarantined'
      };

      await writeFile(metadataPath, JSON.stringify(quarantineMetadata, null, 2));

      console.log('🔒 [QUARANTINE] File quarantined:', {
        quarantineId,
        originalPath: filePath,
        reason,
        quarantinePath
      });

      return {
        success: true,
        quarantineId,
        quarantinePath
      };
    } catch (error) {
      console.error('❌ [QUARANTINE] Failed to quarantine file:', error);
      return {
        success: false,
        error: `Quarantine failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Releases a file from quarantine
   * @param quarantineId - Quarantine ID
   * @returns Release result
   */
  public async releaseFile(quarantineId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const metadataFiles = await this.findMetadataFiles(quarantineId);
      
      if (metadataFiles.length === 0) {
        return {
          success: false,
          error: 'Quarantine record not found'
        };
      }

      const metadataPath = metadataFiles[0];
      const metadata = JSON.parse(await readFile(metadataPath, 'utf8'));
      
      // Delete quarantined file and metadata
      const quarantineDir = path.dirname(metadataPath);
      const quarantineFilename = `${quarantineId}_${metadata.originalFilename}`;
      const quarantinePath = path.join(quarantineDir, quarantineFilename);

      if (fs.existsSync(quarantinePath)) {
        await unlink(quarantinePath);
      }
      
      await unlink(metadataPath);

      console.log('🔓 [QUARANTINE] File released from quarantine:', {
        quarantineId,
        originalFilename: metadata.originalFilename
      });

      return { success: true };
    } catch (error) {
      console.error('❌ [QUARANTINE] Failed to release file:', error);
      return {
        success: false,
        error: `Release failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Lists quarantined files
   * @returns List of quarantined files
   */
  public async listQuarantinedFiles(): Promise<{
    success: boolean;
    files?: any[];
    error?: string;
  }> {
    try {
      const files: any[] = [];
      const dateDirs = fs.readdirSync(this.quarantineDir).filter(dir => 
        fs.statSync(path.join(this.quarantineDir, dir)).isDirectory()
      );

      for (const dateDir of dateDirs) {
        const dateDirPath = path.join(this.quarantineDir, dateDir);
        const metadataFiles = fs.readdirSync(dateDirPath).filter(file => 
          file.endsWith('_metadata.json')
        );

        for (const metadataFile of metadataFiles) {
          const metadataPath = path.join(dateDirPath, metadataFile);
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
          files.push(metadata);
        }
      }

      return {
        success: true,
        files: files.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to list quarantined files: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async findMetadataFiles(quarantineId: string): Promise<string[]> {
    const metadataFiles: string[] = [];
    
    try {
      const dateDirs = fs.readdirSync(this.quarantineDir).filter(dir => 
        fs.statSync(path.join(this.quarantineDir, dir)).isDirectory()
      );

      for (const dateDir of dateDirs) {
        const dateDirPath = path.join(this.quarantineDir, dateDir);
        const metadataFile = path.join(dateDirPath, `${quarantineId}_metadata.json`);
        
        if (fs.existsSync(metadataFile)) {
          metadataFiles.push(metadataFile);
        }
      }
    } catch (error) {
      console.error('❌ [QUARANTINE] Error finding metadata files:', error);
    }

    return metadataFiles;
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredFiles();
    }, QUARANTINE_CONFIG.cleanupInterval);
  }

  private async cleanupExpiredFiles(): Promise<void> {
    try {
      const now = Date.now();
      const files = await this.listQuarantinedFiles();
      
      if (!files.success || !files.files) {
        return;
      }

      let cleanedCount = 0;
      for (const file of files.files) {
        const quarantineTime = new Date(file.timestamp).getTime();
        if (now - quarantineTime > QUARANTINE_CONFIG.maxQuarantineTime) {
          const result = await this.releaseFile(file.quarantineId);
          if (result.success) {
            cleanedCount++;
          }
        }
      }

      if (cleanedCount > 0) {
        console.log(`🧹 [QUARANTINE] Cleaned up ${cleanedCount} expired quarantine files`);
      }
    } catch (error) {
      console.error('❌ [QUARANTINE] Cleanup error:', error);
    }
  }

  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }
}

/**
 * Advanced virus scanning with quarantine integration
 * @param filePath - Path to the file to scan
 * @param shouldQuarantine - Whether to quarantine suspicious files
 * @returns Comprehensive scan result
 */
export async function performAdvancedVirusScanning(filePath: string, shouldQuarantine: boolean = true): Promise<{
  isSafe: boolean;
  threats?: string[];
  warnings?: string[];
  quarantineId?: string;
  scanResults?: {
    signatureMatches: number;
    behaviorScore: number;
    entropyScore: number;
    suspiciousPatterns: string[];
  };
  error?: string;
}> {
  try {
    const contentScan = await performAdvancedContentScan(filePath);
    const quarantine = FileQuarantine.getInstance();
    
    // Calculate behavior score based on multiple factors
    let behaviorScore = 0;
    const suspiciousPatterns: string[] = [];
    
    if (contentScan.contentAnalysis) {
      // High entropy indicates encryption/obfuscation
      if (contentScan.contentAnalysis.entropy > 7.8) {
        behaviorScore += 30;
        suspiciousPatterns.push('High entropy detected');
      } else if (contentScan.contentAnalysis.entropy > 7.5) {
        behaviorScore += 15;
        suspiciousPatterns.push('Elevated entropy detected');
      }
      
      // Multiple suspicious patterns increase score
      behaviorScore += contentScan.contentAnalysis.suspiciousPatterns * 10;
      
      // Embedded files are suspicious
      if (contentScan.contentAnalysis.embeddedFiles) {
        behaviorScore += 25;
        suspiciousPatterns.push('Embedded files detected');
      }
    }
    
    // Count signature matches
    const signatureMatches = (contentScan.threats?.length || 0) + (contentScan.warnings?.length || 0);
    behaviorScore += signatureMatches * 20;
    
    // Determine threat level
    const isHighRisk = behaviorScore >= 50 || (contentScan.threats && contentScan.threats.length > 0);
    const isMediumRisk = behaviorScore >= 25 || (contentScan.warnings && contentScan.warnings.length > 2);
    
    let quarantineId: string | undefined;
    
    // Quarantine high-risk files
    if (shouldQuarantine && isHighRisk) {
      const quarantineResult = await quarantine.quarantineFile(
        filePath,
        `High-risk file detected (score: ${behaviorScore})`,
        {
          behaviorScore,
          signatureMatches,
          entropy: contentScan.contentAnalysis?.entropy,
          threats: contentScan.threats,
          warnings: contentScan.warnings
        }
      );
      
      if (quarantineResult.success) {
        quarantineId = quarantineResult.quarantineId;
        console.log('🔒 [VIRUS_SCAN] High-risk file quarantined:', {
          filePath,
          quarantineId,
          behaviorScore
        });
      }
    }
    
    return {
      isSafe: !isHighRisk,
      threats: contentScan.threats,
      warnings: contentScan.warnings,
      quarantineId,
      scanResults: {
        signatureMatches,
        behaviorScore,
        entropyScore: contentScan.contentAnalysis?.entropy || 0,
        suspiciousPatterns
      }
    };
  } catch (error) {
    return {
      isSafe: false,
      error: `Advanced virus scanning failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Comprehensive file security validation
 * @param filePath - Path to the file to validate
 * @param originalFilename - Original filename
 * @param userId - User ID for secure naming
 * @returns Complete validation result
 */
export async function validateFileComprehensive(filePath: string, originalFilename: string, userId: string): Promise<{
  isValid: boolean;
  secureFilename?: string;
  detectedMimeType?: string;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // 1. Extension validation
    const extValidation = validateFileExtension(originalFilename);
    if (!extValidation.isValid) {
      errors.push(extValidation.error!);
    }
    
    // 2. Magic number validation
    const magicValidation = await validateFileMagicNumber(filePath);
    if (!magicValidation.isValid) {
      errors.push(magicValidation.error!);
    }
    
    // 3. File size validation (if we have detected MIME type)
    if (magicValidation.detectedMimeType) {
      const stats = fs.statSync(filePath);
      const sizeValidation = validateFileSize(stats.size, magicValidation.detectedMimeType);
      if (!sizeValidation.isValid) {
        errors.push(sizeValidation.error!);
      }
    }
    
    // 4. Enhanced image dimensions validation
    const dimensionValidation = await validateImageDimensions(filePath, magicValidation.detectedMimeType || undefined);
    if (!dimensionValidation.isValid) {
      errors.push(dimensionValidation.error!);
    }
    
    // Add dimension validation warnings
    if (dimensionValidation.warnings) {
      warnings.push(...dimensionValidation.warnings);
    }
    
    // 5. Advanced virus scanning with quarantine
    const virusScan = await performAdvancedVirusScanning(filePath, true);
    if (!virusScan.isSafe) {
      if (virusScan.error) {
        warnings.push(virusScan.error);
      }
      if (virusScan.threats) {
        errors.push(...virusScan.threats);
      }
      
      // If file was quarantined, add to errors
      if (virusScan.quarantineId) {
        errors.push(`Dosya karantinaya alındı (ID: ${virusScan.quarantineId})`);
      }
    }
    
    // Add virus scan warnings
    if (virusScan.warnings) {
      warnings.push(...virusScan.warnings);
    }
    
    // 6. Generate secure filename
    const secureFilename = generateSecureFilename(originalFilename, userId);
    
    return {
      isValid: errors.length === 0,
      secureFilename,
      detectedMimeType: magicValidation.detectedMimeType || undefined,
      errors,
      warnings
    };
  } catch (error) {
    errors.push(`Doğrulama hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    
    return {
      isValid: false,
      errors,
      warnings
    };
  }
}