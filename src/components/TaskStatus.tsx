import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MODELS } from '../config/models';
import './TaskStatus.css';

export function TaskStatus() {
  const { state } = useApp();
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!state.taskState.startTime || state.taskState.status === 'SUCCEEDED') {
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - state.taskState.startTime!) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [state.taskState.startTime, state.taskState.status]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (state.isSubmitting && !state.taskState.taskId) {
    return (
      <div className="task-status submitting">
        <div className="status-spinner"></div>
        <p className="status-message">Submitting your request...</p>
      </div>
    );
  }

  if (state.taskState.taskId && state.taskState.status && 
      ['PENDING', 'RUNNING'].includes(state.taskState.status)) {
    // Determine if this is a video task
    const modelEntry = state.taskState.modelId 
      ? Object.entries(MODELS).find(([_, config]) => config.model_id === state.taskState.modelId)
      : null;
    const isVideoTask = modelEntry ? modelEntry[1].category === 'video' : false;
    const estimatedTime = isVideoTask ? '5-30 minutes' : '1-5 minutes';

    return (
      <div className="task-status processing">
        <div className="status-spinner"></div>
        <p className="status-message">
          Generating your content. This may take {estimatedTime}...
        </p>
        <p className="status-detail">
          Status: <strong>{state.taskState.status}</strong>
        </p>
        <p className="task-id">
          Task ID: <code>{state.taskState.taskId}</code>
        </p>
        {elapsedTime > 0 && (
          <p className="elapsed-time">
            Elapsed: {formatTime(elapsedTime)}
          </p>
        )}
        <p className="status-hint">
          Please wait while we process your request. The page will automatically update when complete.
        </p>
      </div>
    );
  }

  if (state.result) {
    return (
      <div className="task-status completed">
        <div className="status-icon success">✓</div>
        <p className="status-message">Generation complete!</p>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="task-status failed">
        <div className="status-icon error">✕</div>
        <p className="status-message">Generation failed</p>
        <p className="error-detail">{state.error}</p>
      </div>
    );
  }

  return null;
}
