import { useApp } from '../context/AppContext';
import { MODELS } from '../config/models';
import { ModelSelection } from './ModelSelection';
import { ParameterForm } from './ParameterForm';
import { TaskStatus } from './TaskStatus';
import { ResultDisplay } from './ResultDisplay';
import { CacheManager } from '../utils/cacheManager';
import {
  generateT2I,
  generateI2I,
  generateI2V,
  generateT2V,
  generateKF2V,
  generateQwenI2I,
  pollTaskStatus,
  buildT2IRequest,
  buildI2IRequest,
  buildI2VRequest,
  buildT2VRequest,
  buildKF2VRequest,
  buildQwenI2IRequest,
} from '../services/api';
import type { GeneratedResult } from '../types';

export function ModelsSection() {
  const { state, selectModel, setTaskState, setResult, setError, setIsSubmitting } = useApp();

  const getModelKey = (modelId: string): string => {
    const entry = Object.entries(MODELS).find(([_, config]) => config.model_id === modelId);
    return entry ? entry[0] : '';
  };

  const handleFormSubmit = async (formData: any) => {
    if (!state.selectedModel) return;

    const modelKey = getModelKey(state.selectedModel);

    setError(null);
    setResult(null);
    setIsSubmitting(true);
    setTaskState({ startTime: Date.now(), modelId: state.selectedModel });

    try {
      // Handle synchronous vs async models
      const model = MODELS[modelKey];
      const isSync = model.api_type === 'sync';

      if (isSync && modelKey === 'qwen-i2i') {
        // Synchronous Qwen Image-to-Image
        const qwenRequest = buildQwenI2IRequest(formData);
        const syncResponse = await generateQwenI2I(qwenRequest);

        // Extract all generated image URLs
        const imageUrls = syncResponse.output.choices[0]?.message.content
          .map(item => item.image)
          .filter(Boolean) || [];

        if (imageUrls.length === 0) {
          throw new Error('No images generated in response');
        }

        const result: GeneratedResult = {
          type: 'image',
          url: imageUrls[0],
          urls: imageUrls.length > 1 ? imageUrls : undefined,
          metadata: {
            model: state.selectedModel,
            prompt: formData.prompt,
            timestamp: new Date().toISOString(),
            width: syncResponse.usage?.width,
            height: syncResponse.usage?.height,
            seed: formData.seed,
          },
        };

        setResult(result);
        setTaskState({ status: 'SUCCEEDED' });

        // Save to cache
        if (result.urls && result.urls.length > 1) {
          CacheManager.addMultiple(
            result.urls,
            'image',
            'models',
            model.display_name,
            result.metadata.prompt,
            result.metadata
          );
        } else {
          CacheManager.add({
            url: result.url,
            type: 'image',
            source: 'models',
            sourceName: model.display_name,
            timestamp: Date.now(),
            prompt: result.metadata.prompt,
            metadata: result.metadata,
          });
        }
      } else {
        // Asynchronous models (existing logic)
      let taskResponse;

      switch (modelKey) {
        case 't2i':
          const t2iRequest = buildT2IRequest(formData);
          taskResponse = await generateT2I(t2iRequest);
          break;
        case 'i2i':
          const i2iRequest = buildI2IRequest(formData);
          taskResponse = await generateI2I(i2iRequest);
          break;
        case 'i2v':
          const i2vRequest = buildI2VRequest(formData);
          taskResponse = await generateI2V(i2vRequest);
          break;
        case 't2v':
          const t2vRequest = buildT2VRequest(formData);
          taskResponse = await generateT2V(t2vRequest);
          break;
        case 'kf2v':
          const kf2vRequest = buildKF2VRequest(formData);
          taskResponse = await generateKF2V(kf2vRequest);
          break;
        default:
          throw new Error('Unknown model');
      }

      const taskId = taskResponse.output.task_id;
      setTaskState({ taskId, status: taskResponse.output.task_status });

      // Start polling with extended timeout for video generation (up to 40 minutes)
      const isVideo = model.category === 'video';
      const maxAttempts = isVideo ? 240 : 120; // 40 minutes for video, 20 minutes for images
      const statusResponse = await pollTaskStatus(
        taskId,
        (status) => {
          setTaskState({ status });
        },
        10000, // poll every 10 seconds
        maxAttempts
      );

      // Extract result with detailed error checking
      console.log('=== RESULT EXTRACTION DEBUG START ===');
      console.log('Task completed, full response:', JSON.stringify(statusResponse, null, 2));
      
      let resultUrl: string | undefined;
      let resultUrls: string[] = [];
      let origPrompt: string | undefined;

      // Handle different response formats
      // Format 1: Standard format with output.results array (T2I, I2I, KF2V)
      if (statusResponse.output?.results && statusResponse.output.results.length > 0) {
        // Extract all URLs for multiple image generation
        resultUrls = statusResponse.output.results.map(r => r.url).filter(Boolean);
        resultUrl = resultUrls[0];
        origPrompt = statusResponse.output.results[0]?.orig_prompt;
        console.log('✓ Found result in standard format (results array):', { 
          resultUrl, 
          resultUrls, 
          resultUrlsCount: resultUrls.length,
          origPrompt 
        });
      }
      // Format 2: Direct URL in output object (I2V model)
      else if (statusResponse.output?.video_url || statusResponse.output?.image_url) {
        resultUrl = statusResponse.output.video_url || statusResponse.output.image_url;
        origPrompt = statusResponse.output.orig_prompt || statusResponse.output.actual_prompt;
        console.log('✓ Found result directly in output object:', { resultUrl, origPrompt });
      }
      // Format 3: Alternative format with content array at root level
      else if (statusResponse.content && statusResponse.content.length > 0) {
        const contentText = statusResponse.content[0]?.text;
        console.log('Found content array, parsing text:', contentText);
        if (contentText) {
          try {
            const parsedContent = JSON.parse(contentText);
            resultUrl = parsedContent.video_url || parsedContent.image_url || parsedContent.url;
            origPrompt = parsedContent.orig_prompt;
            console.log('✓ Parsed content from alternative format:', parsedContent);
          } catch (e) {
            console.error('✗ Failed to parse content text:', e);
          }
        }
      }
      
      if (!resultUrl) {
        console.error('=== NO URL FOUND - FULL DEBUG INFO ===');
        console.error('Status Response:', statusResponse);
        throw new Error(`Task succeeded but no result URL found. Task ID: ${taskId}. Please check the browser console for details.`);
      }
      
      console.log('✓ Successfully extracted result URL:', resultUrl);
      console.log('=== RESULT EXTRACTION DEBUG END ===');

      const result: GeneratedResult = {
        type: isVideo ? 'video' : 'image',
        url: resultUrl,
        urls: resultUrls.length > 1 ? resultUrls : undefined, // Include all URLs if multiple images
        metadata: {
          model: state.selectedModel,
          prompt: origPrompt || formData.prompt,
          timestamp: new Date().toISOString(),
          seed: formData.seed,
        },
      };

      console.log('=== FINAL RESULT OBJECT ===');
      console.log('Result type:', result.type);
      console.log('Result url:', result.url);
      console.log('Result urls:', result.urls);
      console.log('Result urls length:', result.urls?.length);
      console.log('==========================');

      setResult(result);
      setTaskState({ status: 'SUCCEEDED' });

      // Save to cache
      const modelConfig = MODELS[modelKey];
      if (result.urls && result.urls.length > 1) {
        // Multiple images generated
        CacheManager.addMultiple(
          result.urls,
          result.type,
          'models',
          modelConfig.display_name,
          result.metadata.prompt,
          result.metadata
        );
      } else {
        // Single image/video
        CacheManager.add({
          url: result.url,
          type: result.type,
          source: 'models',
          sourceName: modelConfig.display_name,
          timestamp: Date.now(),
          prompt: result.metadata.prompt,
          metadata: result.metadata,
        });
      }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      setTaskState({ status: 'FAILED' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedModelKey = state.selectedModel ? getModelKey(state.selectedModel) : null;
  const showForm = state.selectedModel && !state.result;
  const showResult = !!state.result;

  return (
    <div className="models-section">
      {!state.selectedModel && <ModelSelection />}

      {showForm && selectedModelKey && (
        <>
          <div className="back-to-models-container">
            <button onClick={() => selectModel(null)} className="back-to-models-btn">
              ← Back to Models
            </button>
          </div>
          
          <div className="form-container">
            <div className="model-header">
              <h2 className="model-title">{MODELS[selectedModelKey].display_name}</h2>
            </div>

            <ParameterForm
              modelKey={selectedModelKey}
              onSubmit={handleFormSubmit}
            />
          </div>
        </>
      )}

      <TaskStatus />

      {showResult && <ResultDisplay />}

      {state.error && !state.result && (
        <div className="error-container">
          <div className="error-box">
            <h3>⚠️ Error</h3>
            <p>{state.error}</p>
            <button onClick={() => setError(null)} className="retry-btn">
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
