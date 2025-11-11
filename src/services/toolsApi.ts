import type {
  SuperResolutionResponse,
  UploadedImageData,
} from '../types/tools';

// Base URL for tools API (backend proxy)
const TOOLS_API_BASE = '/api';

/**
 * Upload image file to backend and get accessible URL
 * Backend will either upload to OSS or convert to base64
 */
export async function uploadImageForProcessing(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch(`${TOOLS_API_BASE}/upload-image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    
    if (!data.success || !data.url) {
      throw new Error('Invalid upload response');
    }

    return data.url;
  } catch (error) {
    console.error('Image upload error:', error);
    throw error instanceof Error ? error : new Error('Failed to upload image');
  }
}

/**
 * Get image dimensions from file
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
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
 * Validate image file
 */
export function validateImage(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file format. Only JPG, JPEG, and PNG are supported.',
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size exceeds 10MB limit.',
    };
  }

  return { valid: true };
}

/**
 * Prepare uploaded image data
 */
export async function prepareImageData(file: File): Promise<UploadedImageData> {
  const validation = validateImage(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const dimensions = await getImageDimensions(file);
  
  // Create local preview URL for display
  const preview = URL.createObjectURL(file);

  return {
    file,
    preview,
    width: dimensions.width,
    height: dimensions.height,
    size: file.size,
  };
}

/**
 * Call super-resolution API with file upload
 */
export async function callSuperResolution(
  file: File,
  mode: 'base' | 'enhancement',
  upscaleFactor: 2 | 4
): Promise<SuperResolutionResponse> {
  try {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('mode', mode);
    formData.append('upscaleFactor', upscaleFactor.toString());

    const response = await fetch(`${TOOLS_API_BASE}/super-resolution`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: { code: 'HTTP_ERROR', message: response.statusText },
      }));
      throw new Error(errorData.error?.message || 'Super-resolution request failed');
    }

    const data: SuperResolutionResponse = await response.json();
    
    if (!data.success) {
      throw new Error(data.error?.message || 'Super-resolution processing failed');
    }

    return data;
  } catch (error) {
    console.error('Super-resolution API error:', error);
    throw error instanceof Error ? error : new Error('Unknown error occurred');
  }
}

/**
 * Download enhanced image
 */
export async function downloadImage(url: string, filename: string): Promise<void> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Download error:', error);
    throw new Error('Failed to download image');
  }
}


