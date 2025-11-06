import { useApp } from '../context/AppContext';
import { MODELS } from '../config/models';
import { ModelSelection } from './ModelSelection';
import { ParameterForm } from './ParameterForm';
import { TaskStatus } from './TaskStatus';
import { ResultDisplay } from './ResultDisplay';
import {
  generateT2I,
  generateI2I,
  generateI2V,
  generateKF2V,
  pollTaskStatus,
  buildT2IRequest,
  buildI2IRequest,
  buildI2VRequest,
  buildKF2VRequest,
} from '../services/api';
import type { GeneratedResult } from '../types';
import './App.css';

function App() {
  const { state, selectModel, setTaskState, setResult, setError, setIsSubmitting } = useApp();

  const getModelKey = (modelId: string): string => {
    const entry = Object.entries(MODELS).find(([_, config]) => config.model_id === modelId);
    return entry ? entry[0] : '';
  };

  const handleFormSubmit = async (formData: any) => {
    if (!state.selectedModel) return;

    const modelKey = getModelKey(state.selectedModel);
    const model = MODELS[modelKey];

    setError(null);
    setResult(null);
    setIsSubmitting(true);
    setTaskState({ startTime: Date.now(), modelId: state.selectedModel });

    try {
      // All models now use async API
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
      console.log('Response type:', typeof statusResponse);
      console.log('Response keys:', Object.keys(statusResponse));
      console.log('Has output?:', !!statusResponse.output);
      if (statusResponse.output) {
        console.log('Output keys:', Object.keys(statusResponse.output));
        console.log('Has results?:', !!statusResponse.output.results);
        console.log('Results:', statusResponse.output.results);
      }
      console.log('Has content?:', !!statusResponse.content);
      if (statusResponse.content) {
        console.log('Content:', statusResponse.content);
      }
      console.log('Has isError?:', 'isError' in statusResponse);
      console.log('=== RESULT EXTRACTION DEBUG END ===');
      
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
        console.log('✓ Found result in standard format (results array):', { resultUrl, resultUrls, origPrompt });
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
            console.log('Extracted URL:', resultUrl);
          } catch (e) {
            console.error('✗ Failed to parse content text:', e);
          }
        }
      }
      // Format 4: Check if response itself is wrapped differently
      else if ((statusResponse as any).isError === false && (statusResponse as any).content) {
        const content = (statusResponse as any).content;
        console.log('Found wrapped content format:', content);
        if (Array.isArray(content) && content.length > 0 && content[0]?.text) {
          try {
            const parsedContent = JSON.parse(content[0].text);
            resultUrl = parsedContent.video_url || parsedContent.image_url || parsedContent.url;
            origPrompt = parsedContent.orig_prompt;
            console.log('✓ Parsed from wrapped format:', parsedContent);
            console.log('Extracted URL:', resultUrl);
          } catch (e) {
            console.error('✗ Failed to parse wrapped content:', e);
          }
        }
      }
      
      if (!resultUrl) {
        console.error('=== NO URL FOUND - FULL DEBUG INFO ===');
        console.error('Status Response:', statusResponse);
        console.error('Response keys:', Object.keys(statusResponse));
        console.error('Output exists?:', !!statusResponse.output);
        if (statusResponse.output) {
          console.error('Output keys:', Object.keys(statusResponse.output));
        }
        console.error('Content exists?:', !!statusResponse.content);
        if (statusResponse.content) {
          console.error('Content:', statusResponse.content);
        }
        console.error('=== END DEBUG INFO ===');
        throw new Error(`Task succeeded but no result URL found. Task ID: ${taskId}. Please check the browser console for details.`);
      }
      
      console.log('✓ Successfully extracted result URL:', resultUrl);

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

      setResult(result);
      setTaskState({ status: 'SUCCEEDED' });
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
    <div className="app">
      <header className="app-header">
        <h1>🎨 Wanxiang Model Experience</h1>
        <p className="app-subtitle">Experience the latest AI image and video generation models</p>
      </header>

      <main className="app-main">
        {!state.selectedModel && <ModelSelection />}

        {showForm && selectedModelKey && (
          <div className="form-container">
            <div className="model-breadcrumb">
              <button onClick={() => selectModel(null)} className="back-btn">
                ← Back to Model Selection
              </button>
              <span className="current-model">{MODELS[selectedModelKey].display_name}</span>
            </div>

            <ParameterForm
              modelKey={selectedModelKey}
              onSubmit={handleFormSubmit}
            />
          </div>
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
      </main>

      <footer className="app-footer">
        <p>Powered by Alibaba Cloud Model Studio | Wanxiang AI Models</p>
      </footer>
    </div>
  );
}

export default App;
