// Tool configuration and type definitions

export type ToolId = 'super-resolution' | 'caption-eraser' | 'background-remover';

export interface ToolConfig {
  id: ToolId;
  displayName: string;
  description: string;
  icon: string;
  category: 'enhancement' | 'editing' | 'conversion';
  endpoint: string;
  enabled: boolean;
}

// Super-Resolution Types

export interface SuperResolutionRequest {
  imageUrl: string;
  mode: 'base' | 'advanced';
  upscaleFactor: 2 | 4;
}

export interface SuperResolutionResponse {
  success: boolean;
  imageUrl?: string;
  metadata?: {
    originalSize: {
      width: number;
      height: number;
    };
    enhancedSize: {
      width: number;
      height: number;
    };
    processingTime: number;
    requestId: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface UploadedImageData {
  file: File;
  preview: string;
  width: number;
  height: number;
  size: number;
}

export interface SuperResolutionResult {
  originalUrl: string;
  enhancedUrl: string;
  metadata: {
    originalSize: { width: number; height: number };
    enhancedSize: { width: number; height: number };
    upscaleFactor: number;
    mode: string;
    processingTime: number;
    timestamp: string;
  };
}

// Tool state types

export type ToolProcessingStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

export interface ToolState {
  selectedTool: ToolId | null;
  uploadedImage: UploadedImageData | null;
  parameters: Record<string, any>;
  processingStatus: ToolProcessingStatus;
  result: SuperResolutionResult | null;
  error: string | null;
}
