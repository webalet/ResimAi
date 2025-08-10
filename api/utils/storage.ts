import { supabase } from '../config/supabase.js';

/**
 * Upload file to Supabase Storage
 * @param fileBuffer - File buffer
 * @param filePath - Path where file will be stored
 * @param contentType - MIME type of the file
 * @returns Public URL of uploaded file or null if failed
 */
export async function uploadToSupabase(
  fileBuffer: Buffer,
  filePath: string,
  contentType: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return null;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Upload to Supabase error:', error);
    return null;
  }
}

/**
 * Delete file from Supabase Storage
 * @param filePath - Path of file to delete
 * @returns True if successful, false otherwise
 */
export async function deleteFromSupabase(filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('images')
      .remove([filePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete from Supabase error:', error);
    return false;
  }
}

/**
 * Get signed URL for private file access
 * @param filePath - Path of file
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Signed URL or null if failed
 */
export async function getSignedUrl(
  filePath: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('images')
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Supabase signed URL error:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Get signed URL error:', error);
    return null;
  }
}

/**
 * List files in a directory
 * @param folderPath - Directory path
 * @param limit - Maximum number of files to return
 * @returns Array of file objects or empty array if failed
 */
export async function listFiles(
  folderPath: string,
  limit: number = 100
): Promise<any[]> {
  try {
    const { data, error } = await supabase.storage
      .from('images')
      .list(folderPath, {
        limit,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error('Supabase list files error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('List files error:', error);
    return [];
  }
}

/**
 * Get file info
 * @param filePath - Path of file
 * @returns File info object or null if failed
 */
export async function getFileInfo(filePath: string): Promise<any | null> {
  try {
    const { data, error } = await supabase.storage
      .from('images')
      .list('', {
        search: filePath
      });

    if (error || !data || data.length === 0) {
      console.error('Supabase get file info error:', error);
      return null;
    }

    return data[0];
  } catch (error) {
    console.error('Get file info error:', error);
    return null;
  }
}

/**
 * Copy file within Supabase Storage
 * @param fromPath - Source file path
 * @param toPath - Destination file path
 * @returns True if successful, false otherwise
 */
export async function copyFile(fromPath: string, toPath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('images')
      .copy(fromPath, toPath);

    if (error) {
      console.error('Supabase copy file error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Copy file error:', error);
    return false;
  }
}

/**
 * Move file within Supabase Storage
 * @param fromPath - Source file path
 * @param toPath - Destination file path
 * @returns True if successful, false otherwise
 */
export async function moveFile(fromPath: string, toPath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('images')
      .move(fromPath, toPath);

    if (error) {
      console.error('Supabase move file error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Move file error:', error);
    return false;
  }
}

/**
 * Generate unique file path
 * @param userId - User ID
 * @param originalName - Original file name
 * @param folder - Folder name (default: 'uploads')
 * @returns Unique file path
 */
export function generateFilePath(
  userId: string,
  originalName: string,
  folder: string = 'uploads'
): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  const fileName = `${timestamp}-${randomString}.${extension}`;
  
  return `${folder}/${userId}/${fileName}`;
}

/**
 * Validate file type
 * @param mimetype - File MIME type
 * @param allowedTypes - Array of allowed MIME types
 * @returns True if valid, false otherwise
 */
export function validateFileType(
  mimetype: string,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
): boolean {
  return allowedTypes.includes(mimetype);
}

/**
 * Validate file size
 * @param size - File size in bytes
 * @param maxSize - Maximum allowed size in bytes (default: 10MB)
 * @returns True if valid, false otherwise
 */
export function validateFileSize(
  size: number,
  maxSize: number = 10 * 1024 * 1024
): boolean {
  return size <= maxSize;
}

/**
 * Get file extension from MIME type
 * @param mimetype - File MIME type
 * @returns File extension
 */
export function getExtensionFromMimeType(mimetype: string): string {
  const mimeToExt: { [key: string]: string } = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/bmp': 'bmp',
    'image/tiff': 'tiff'
  };
  
  return mimeToExt[mimetype] || 'jpg';
}