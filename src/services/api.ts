import type {
  T2IRequest,
  I2IRequest,
  I2VRequest,
  KF2VRequest,
  AsyncTaskCreationResponse,
  AsyncTaskStatusResponse,
  ApiErrorResponse,
  TaskStatus,
} from '../types';
import { TASK_QUERY_ENDPOINT } from '../config/models';

// Get API key from environment variable
const getApiKey = (): string => {
  const apiKey = import.meta.env.VITE_API_KEY;
  if (!apiKey) {
    throw new Error('API_KEY not configured. Please set VITE_API_KEY environment variable.');
  }
  return apiKey;
};

// Common headers for all requests
const getHeaders = (isAsync: boolean = false): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getApiKey()}`,
  };

  if (isAsync) {
    headers['X-DashScope-Async'] = 'enable';
  }

  return headers;
};

// Handle API response
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ApiErrorResponse = await response.json().catch(() => ({
      request_id: '',
      code: 'NetworkError',
      message: `HTTP ${response.status}: ${response.statusText}`,
    }));

    throw new Error(`${error.code}: ${error.message}`);
  }

  const data = await response.json();

  // Check for API-level errors
  if (data.code && data.message) {
    throw new Error(`${data.code}: ${data.message}`);
  }

  return data;
}

/**
 * Text-to-Image API call (Asynchronous)
 */
export async function generateT2I(request: T2IRequest): Promise<AsyncTaskCreationResponse> {
  const endpoint = '/api/api/v1/services/aigc/text2image/image-synthesis';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify(request),
  });

  return handleResponse<AsyncTaskCreationResponse>(response);
}

/**
 * Image-to-Image API call (Asynchronous)
 */
export async function generateI2I(request: I2IRequest): Promise<AsyncTaskCreationResponse> {
  const endpoint = '/api/api/v1/services/aigc/image2image/image-synthesis';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify(request),
  });

  return handleResponse<AsyncTaskCreationResponse>(response);
}

/**
 * Image-to-Video API call (Asynchronous)
 */
export async function generateI2V(request: I2VRequest): Promise<AsyncTaskCreationResponse> {
  const endpoint = '/api/api/v1/services/aigc/video-generation/video-synthesis';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify(request),
  });

  return handleResponse<AsyncTaskCreationResponse>(response);
}

/**
 * Keyframe-to-Video API call (Asynchronous)
 */
export async function generateKF2V(request: KF2VRequest): Promise<AsyncTaskCreationResponse> {
  const endpoint = '/api/api/v1/services/aigc/image2video/video-synthesis';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify(request),
  });

  return handleResponse<AsyncTaskCreationResponse>(response);
}

/**
 * Query async task status
 */
export async function queryTaskStatus(taskId: string): Promise<AsyncTaskStatusResponse> {
  const endpoint = `${TASK_QUERY_ENDPOINT}/${taskId}`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${getApiKey()}`,
    },
  });

  const rawResponse = await handleResponse<any>(response);
  
  // Debug: Log the complete raw response structure
  console.log('=== RAW RESPONSE DEBUG START ===');
  console.log('Response type:', typeof rawResponse);
  console.log('Response keys:', Object.keys(rawResponse));
  console.log('Full response:', JSON.stringify(rawResponse, null, 2));
  console.log('=== RAW RESPONSE DEBUG END ===');
  
  // Check if response is in wrapped format (I2V model)
  if (rawResponse.isError === false && rawResponse.content && Array.isArray(rawResponse.content)) {
    console.log('Detected wrapped format (isError=false, content array exists)');
    // Try to parse the content[0].text as JSON
    const contentText = rawResponse.content[0]?.text;
    console.log('Content text:', contentText);
    if (contentText) {
      try {
        const parsedContent = JSON.parse(contentText);
        console.log('Parsed content:', parsedContent);
        // Reconstruct as standard AsyncTaskStatusResponse format
        const normalizedResponse: AsyncTaskStatusResponse = {
          request_id: parsedContent.request_id || '',
          output: {
            task_id: parsedContent.task_id || taskId,
            task_status: parsedContent.task_status || 'UNKNOWN',
            submit_time: parsedContent.submit_time,
            scheduled_time: parsedContent.scheduled_time,
            end_time: parsedContent.end_time,
          },
          // Keep the original wrapped format for later URL extraction
          content: rawResponse.content,
        };
        console.log('Normalized wrapped response:', normalizedResponse);
        return normalizedResponse;
      } catch (e) {
        console.error('Failed to parse wrapped content:', e);
      }
    }
  }
  
  // Check if it has standard output structure
  if (rawResponse.output) {
    console.log('Detected standard format with output field');
    console.log('Output keys:', Object.keys(rawResponse.output));
    console.log('Task status:', rawResponse.output.task_status);
    if (rawResponse.output.results) {
      console.log('Results found:', rawResponse.output.results);
    }
  }
  
  // Return as-is if it's already in standard format
  return rawResponse as AsyncTaskStatusResponse;
}

/**
 * Poll task status until completion
 */
export async function pollTaskStatus(
  taskId: string,
  onProgress?: (status: TaskStatus) => void,
  pollingInterval: number = 10000,
  maxAttempts: number = 60
): Promise<AsyncTaskStatusResponse> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    // Wait before polling (initial delay of 2 seconds, then polling interval)
    const delay = attempts === 0 ? 2000 : pollingInterval;
    await new Promise(resolve => setTimeout(resolve, delay));

    const statusResponse = await queryTaskStatus(taskId);
    const status = statusResponse.output.task_status;

    // Log polling progress for debugging
    console.log(`Polling attempt ${attempts + 1}/${maxAttempts}, Task ID: ${taskId}, Status: ${status}`);

    // Notify progress
    if (onProgress) {
      onProgress(status);
    }

    // Check if task is complete
    if (status === 'SUCCEEDED') {
      console.log('Task succeeded, final response:', JSON.stringify(statusResponse, null, 2));
      return statusResponse;
    }

    if (status === 'FAILED' || status === 'CANCELED' || status === 'UNKNOWN') {
      const errorMessage = statusResponse.output.message || 'Task failed';
      throw new Error(`${statusResponse.output.code || 'TaskFailed'}: ${errorMessage}`);
    }

    attempts++;
  }

  throw new Error(`Task polling timeout after ${maxAttempts} attempts (${(maxAttempts * pollingInterval) / 60000} minutes). The task is taking longer than expected. Task ID: ${taskId}`);
}

/**
 * Build T2I request from form data
 */
export function buildT2IRequest(formData: any): T2IRequest {
  return {
    model: 'wan2.5-t2i-preview',
    input: {
      prompt: formData.prompt,
      negative_prompt: formData.negative_prompt || undefined,
    },
    parameters: {
      size: formData.size || '1280*1280',
      n: formData.n || 1,
      prompt_extend: formData.prompt_extend ?? false,
      watermark: formData.watermark ?? false,
      seed: formData.seed || undefined,
    },
  };
}

/**
 * Build I2I request from form data
 */
export function buildI2IRequest(formData: any): I2IRequest {
  return {
    model: 'wan2.5-i2i-preview',
    input: {
      prompt: formData.prompt,
      images: formData.images,
      negative_prompt: formData.negative_prompt || undefined,
    },
    parameters: {
      n: formData.n || 1,
      watermark: formData.watermark ?? false,
      seed: formData.seed || undefined,
    },
  };
}

/**
 * Build I2V request from form data
 */
export function buildI2VRequest(formData: any): I2VRequest {
  return {
    model: 'wan2.5-i2v-preview',
    input: {
      prompt: formData.prompt || undefined,
      img_url: formData.img_url,
      audio_url: formData.audio_url || undefined,
      negative_prompt: formData.negative_prompt || undefined,
    },
    parameters: {
      resolution: formData.resolution || '480P',
      duration: formData.duration || 10,
      prompt_extend: formData.prompt_extend ?? true,
      audio: formData.audio ?? true,
      watermark: formData.watermark ?? false,
      seed: formData.seed || undefined,
    },
  };
}

/**
 * Build KF2V request from form data
 */
export function buildKF2VRequest(formData: any): KF2VRequest {
  return {
    model: 'wan2.2-kf2v-flash',
    input: {
      first_frame_url: formData.first_frame_url,
      last_frame_url: formData.last_frame_url || undefined,
      prompt: formData.prompt || undefined,
      negative_prompt: formData.negative_prompt || undefined,
      template: formData.template || undefined,
    },
    parameters: {
      resolution: formData.resolution || '720P',
      prompt_extend: formData.prompt_extend ?? true,
      watermark: formData.watermark ?? false,
      seed: formData.seed || undefined,
    },
  };
}
