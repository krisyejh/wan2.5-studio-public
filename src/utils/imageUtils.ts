import type { UploadedImage } from '../types';

// Supported image formats
export const SUPPORTED_IMAGE_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/webp'];
export const SUPPORTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.bmp', '.webp'];

// Image size constraints
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MIN_IMAGE_DIMENSION = 384;
export const MAX_IMAGE_DIMENSION = 5000;
export const MIN_KF2V_DIMENSION = 360;
export const MAX_KF2V_DIMENSION = 2000;

/**
 * Validate image file format
 */
export function validateImageFormat(file: File): boolean {
  return SUPPORTED_IMAGE_FORMATS.includes(file.type);
}

/**
 * Validate image file size
 */
export function validateImageSize(file: File): boolean {
  return file.size <= MAX_IMAGE_SIZE;
}

/**
 * Get image dimensions from file
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Validate image dimensions
 */
export async function validateImageDimensions(
  file: File,
  minDim: number = MIN_IMAGE_DIMENSION,
  maxDim: number = MAX_IMAGE_DIMENSION
): Promise<{ valid: boolean; width?: number; height?: number; error?: string }> {
  try {
    const { width, height } = await getImageDimensions(file);

    if (width < minDim || width > maxDim || height < minDim || height > maxDim) {
      return {
        valid: false,
        width,
        height,
        error: `Image dimensions must be between ${minDim}×${minDim} and ${maxDim}×${maxDim} pixels. Current: ${width}×${height}`,
      };
    }

    return { valid: true, width, height };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Failed to validate image dimensions',
    };
  }
}

/**
 * Convert file to Base64 string with MIME type prefix
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Create preview URL for uploaded image
 */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revoke preview URL to free memory
 */
export function revokePreviewUrl(url: string): void {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

/**
 * Process uploaded image file
 */
export async function processImageFile(file: File): Promise<UploadedImage> {
  // Validate format
  if (!validateImageFormat(file)) {
    throw new Error(
      `Unsupported image format. Supported formats: ${SUPPORTED_IMAGE_EXTENSIONS.join(', ')}`
    );
  }

  // Validate size
  if (!validateImageSize(file)) {
    throw new Error(`Image size must not exceed ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`);
  }

  // Get dimensions
  const dimensionResult = await validateImageDimensions(file);
  if (!dimensionResult.valid) {
    throw new Error(dimensionResult.error);
  }

  // Create preview
  const preview = createPreviewUrl(file);

  // Convert to Base64
  const base64 = await fileToBase64(file);

  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    file,
    preview,
    base64,
    size: file.size,
    width: dimensionResult.width,
    height: dimensionResult.height,
  };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Download file from URL
 * For external URLs (OSS), use direct link to bypass CORS
 * For local/proxied URLs, use fetch + blob
 */
export async function downloadFile(url: string, filename: string): Promise<void> {
  try {
    // Check if URL is external (OSS or other external sources)
    const isExternal = url.startsWith('http://') || url.startsWith('https://');
    
    if (isExternal && !url.includes(window.location.hostname)) {
      // For external URLs, use direct download link to bypass CORS
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank'; // Fallback if download attribute doesn't work
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // For local/proxied URLs, use fetch + blob method
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(blobUrl);
    }
  } catch (error) {
    console.error('Download error:', error);
    throw new Error('Failed to download file');
  }
}

/**
 * Get file extension from URL
 */
export function getFileExtension(url: string): string {
  const urlPath = url.split('?')[0];
  const parts = urlPath.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : 'png';
}

/**
 * Generate download filename
 */
export function generateDownloadFilename(modelId: string, type: 'image' | 'video', index?: number): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const extension = type === 'video' ? 'mp4' : 'png';
  const indexSuffix = index !== undefined ? `-${index + 1}` : '';
  return `wanxiang-${modelId}-${timestamp}${indexSuffix}.${extension}`;
}
