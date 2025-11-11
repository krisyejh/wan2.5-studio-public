import type {
  StoryboardRequest,
  ErrorCallback,
  CompleteCallback,
  WorkflowSSEData,
  CharacterInfo,
  RefinedShotScript,
  StoryboardGenerationResult,
} from '../types/agents';

/**
 * Callback for partial storyboard workflow results
 */
export type PartialResultCallback = (characters: CharacterInfo[]) => void;

/**
 * Callback for storyboard workflow results
 */
export type WorkflowResultCallback = (result: StoryboardGenerationResult) => void;



/**
 * Call storyboard generation with streaming (workflow format)
 */
export async function callStoryboardGeneration(
  request: StoryboardRequest,
  onProgress: (message: string) => void,
  onPartialResult: PartialResultCallback,
  onResult: WorkflowResultCallback,
  onError: ErrorCallback,
  onComplete: CompleteCallback
): Promise<void> {
  const { appId, input, parameters } = request;

  // Build request URL - use backend proxy endpoint
  const url = `/api/agents/storyboard`;

  const requestBody = {
    appId,
    input: {
      prompt: input.prompt,
      biz_params: input.biz_params,
    },
    parameters: {
      flow_stream_mode: parameters?.flow_stream_mode ?? 'message_format',
    },
  };

  let lastRequestId = '';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    // Process SSE stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let characters: CharacterInfo[] = [];
    let refinedScripts: RefinedShotScript[] = [];
    let shotImages: string[] = [];
    let hasReceivedScripts = false;
    let hasReceivedImages = false;

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('Stream completed');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = line.slice(5).trim();
            
            if (data === '[DONE]') {
              continue;
            }

            try {
              const parsed: WorkflowSSEData = JSON.parse(data);
              
              // Capture request_id for error logging
              if (parsed.request_id) {
                lastRequestId = parsed.request_id;
              }
              
              if (parsed.output?.workflow_message) {
                const workflow = parsed.output.workflow_message;
                const nodeName = workflow.node_name;
                
                // Progress message
                onProgress(`Processing: ${nodeName}`);
                
                // Parse character library output
                if (nodeName === '角色库输出' && workflow.message?.content) {
                  try {
                    const parsedChars = JSON.parse(workflow.message.content);
                    characters = parsedChars.filter((char: any) => char.name && char.image);
                    // Immediately show characters
                    onPartialResult(characters);
                  } catch (e) {
                    console.error('Failed to parse character data:', e);
                  }
                }
                
                // Parse refined script output
                if (nodeName === '细化分镜脚本输出' && workflow.message?.content) {
                  try {
                    const parsedScripts = JSON.parse(workflow.message.content);
                    refinedScripts = Array.isArray(parsedScripts) ? parsedScripts : [];
                    hasReceivedScripts = true;
                    
                    // If we have both scripts and images, show shots immediately
                    if (hasReceivedImages && refinedScripts.length > 0 && shotImages.length > 0) {
                      onResult({
                        characters,
                        refinedScripts,
                        shotImages,
                      });
                    }
                  } catch (e) {
                    console.error('Failed to parse refined script data:', e);
                  }
                }
                
                // Parse storyboard images output
                if (nodeName === '分镜图输出' && workflow.message?.content) {
                  try {
                    const parsedImages = JSON.parse(workflow.message.content);
                    shotImages = parsedImages.filter((url: string) => url && url.startsWith('http'));
                    hasReceivedImages = true;
                    
                    // If we have both scripts and images, show shots immediately
                    if (hasReceivedScripts && refinedScripts.length > 0 && shotImages.length > 0) {
                      onResult({
                        characters,
                        refinedScripts,
                        shotImages,
                      });
                    }
                  } catch (e) {
                    console.error('Failed to parse image data:', e);
                  }
                }
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', data, e);
            }
          }
        }
      }
    } catch (readError) {
      console.error('Stream read error:', readError);
      // Don't throw here - we may have partial data that's useful
    } finally {
      // Always release the reader
      reader.releaseLock();
    }

    // Return final result
    const result: StoryboardGenerationResult = {
      characters,
      refinedScripts,
      shotImages,
    };
    
    onResult(result);
    onComplete();
  } catch (error) {
    console.error('Streaming error:', error);
    if (lastRequestId) {
      console.error('Workflow API Request ID:', lastRequestId);
    }
    onError(error instanceof Error ? error : new Error('Unknown streaming error'));
  }
}

/**
 * Build storyboard request from form data
 */
export function buildStoryboardRequest(
  appId: string,
  prompt: string,
  playShotScripts: string
): StoryboardRequest {
  return {
    appId,
    input: {
      prompt,
      biz_params: {
        playShotScripts,
      },
    },
    parameters: {
      flow_stream_mode: 'message_format',
    },
  };
}

/**
 * Download storyboard as text file
 */
export function downloadStoryboard(content: string, filename: string = 'storyboard.txt'): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Copy storyboard to clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

/**
 * Validate storyboard request inputs
 */
export function validateStoryboardRequest(
  appId: string,
  prompt: string,
  playShotScripts: string
): { valid: boolean; error?: string } {
  if (!appId || appId.trim().length === 0) {
    return {
      valid: false,
      error: 'Application ID is required',
    };
  }

  if (!prompt || prompt.trim().length === 0) {
    return {
      valid: false,
      error: 'Prompt is required',
    };
  }

  if (prompt.length > 2000) {
    return {
      valid: false,
      error: 'Prompt exceeds maximum length of 2000 characters',
    };
  }

  if (!playShotScripts || playShotScripts.trim().length === 0) {
    return {
      valid: false,
      error: 'Play shot scripts are required',
    };
  }

  if (playShotScripts.length > 10000) {
    return {
      valid: false,
      error: 'Play shot scripts exceed maximum length of 10000 characters',
    };
  }

  return { valid: true };
}
