// Task status for async operations
export type TaskStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED' | 'UNKNOWN';

// API Request types
export interface T2IRequest {
  model: string;
  input: {
    prompt: string;
    negative_prompt?: string;
  };
  parameters: {
    size?: string;
    n?: number;
    prompt_extend?: boolean;
    watermark?: boolean;
    seed?: number;
  };
}

export interface I2IRequest {
  model: string;
  input: {
    prompt: string;
    images: string[];
    negative_prompt?: string;
  };
  parameters: {
    n?: number;
    watermark?: boolean;
    seed?: number;
  };
}

export interface I2VRequest {
  model: string;
  input: {
    prompt?: string;
    img_url: string;
    audio_url?: string;
    negative_prompt?: string;
  };
  parameters: {
    resolution?: string;
    duration?: number;
    prompt_extend?: boolean;
    audio?: boolean;
    watermark?: boolean;
    seed?: number;
  };
}

export interface KF2VRequest {
  model: string;
  input: {
    first_frame_url: string;
    last_frame_url?: string;
    prompt?: string;
    negative_prompt?: string;
    template?: string;
  };
  parameters: {
    resolution?: string;
    prompt_extend?: boolean;
    watermark?: boolean;
    seed?: number;
  };
}

export type ApiRequest = T2IRequest | I2IRequest | I2VRequest | KF2VRequest;

// API Response types
export interface T2IResponse {
  request_id: string;
  output: {
    choices: Array<{
      finish_reason: string;
      message: {
        role: string;
        content: Array<{
          image: string;
        }>;
      };
    }>;
    task_metric: {
      TOTAL: number;
      SUCCEEDED: number;
      FAILED: number;
    };
  };
  usage: {
    image_count: number;
    width: number;
    height: number;
  };
}

export interface AsyncTaskCreationResponse {
  request_id: string;
  output: {
    task_id: string;
    task_status: TaskStatus;
  };
}

export interface ResultItem {
  url: string;
  orig_prompt?: string;
}

export interface AsyncTaskStatusResponse {
  request_id: string;
  output: {
    task_id: string;
    task_status: TaskStatus;
    submit_time?: string;
    scheduled_time?: string;
    end_time?: string;
    results?: ResultItem[];
    task_metrics?: {
      TOTAL: number;
      SUCCEEDED: number;
      FAILED: number;
    };
    code?: string;
    message?: string;
    // I2V specific fields - video URL directly in output
    video_url?: string;
    image_url?: string;
    orig_prompt?: string;
    actual_prompt?: string;
  };
  usage?: {
    image_count?: number;
    duration?: number;
    video_count?: number;
    SR?: number;
  };
  // Alternative response format (for I2V model)
  isError?: boolean;
  content?: Array<{
    text?: string;
    type?: string;
  }>;
}

export interface ApiErrorResponse {
  request_id: string;
  code: string;
  message: string;
}

// Result types
export interface GeneratedResult {
  type: 'image' | 'video';
  url: string;
  urls?: string[]; // Support multiple URLs for n>1 image generation
  metadata: {
    model: string;
    prompt?: string;
    timestamp: string;
    width?: number;
    height?: number;
    duration?: number;
    seed?: number;
  };
}
