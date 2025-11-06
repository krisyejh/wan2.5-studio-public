// Model identifiers
export type ModelId = 'wan2.5-t2i-preview' | 'wan2.5-i2i-preview' | 'wan2.5-i2v-preview' | 'wan2.2-kf2v-flash';

// API types
export type ApiType = 'sync' | 'async';

// Model configuration
export interface ModelConfig {
  model_id: ModelId;
  model_name: string;
  display_name: string;
  description: string;
  api_type: ApiType;
  endpoint: string;
  icon: string;
  category: 'image' | 'video';
}

// Parameter types
export type ParameterType = 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'image' | 'images';

export interface ParameterOption {
  label: string;
  value: string | number;
}

export interface ParameterDefinition {
  name: string;
  label: string;
  type: ParameterType;
  required: boolean;
  defaultValue?: any;
  placeholder?: string;
  min?: number;
  max?: number;
  maxLength?: number;
  options?: ParameterOption[];
  tooltip?: string;
  showWhen?: (formData: any) => boolean;
}

// Form data structures for each model
export interface T2IFormData {
  text: string;
  negative_prompt: string;
  prompt_extend: boolean;
  watermark: boolean;
  size: string;
  seed?: number;
}

export interface I2IFormData {
  prompt: string;
  images: string[];
  negative_prompt: string;
  n: number;
  watermark: boolean;
  seed?: number;
}

export interface I2VFormData {
  prompt: string;
  img_url: string;
  audio_url?: string;
  negative_prompt: string;
  resolution: string;
  duration: number;
  prompt_extend: boolean;
  audio: boolean;
  watermark: boolean;
  seed?: number;
}

export interface KF2VFormData {
  first_frame_url: string;
  last_frame_url?: string;
  prompt: string;
  negative_prompt: string;
  resolution: string;
  prompt_extend: boolean;
  watermark: boolean;
  template?: string;
  seed?: number;
}

export type FormData = T2IFormData | I2IFormData | I2VFormData | KF2VFormData;

// Uploaded image metadata
export interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  base64?: string;
  size: number;
  width?: number;
  height?: number;
}
