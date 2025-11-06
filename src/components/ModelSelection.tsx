import { useApp } from '../context/AppContext';
import { MODELS } from '../config/models';
import type { ModelId } from '../types';
import './ModelSelection.css';

export function ModelSelection() {
  const { state, selectModel } = useApp();

  const handleModelSelect = (modelId: ModelId) => {
    // Confirm if switching models with data entered
    if (state.selectedModel && state.selectedModel !== modelId) {
      const hasData = state.formData[state.selectedModel] && 
        Object.keys(state.formData[state.selectedModel]).length > 0;
      
      if (hasData) {
        const confirmed = window.confirm(
          'Switching models will clear your current input. Continue?'
        );
        if (!confirmed) return;
      }
    }

    selectModel(modelId);
  };

  const modelKeys = Object.keys(MODELS) as Array<keyof typeof MODELS>;

  return (
    <div className="model-selection">
      <h2>Select a Model</h2>
      <div className="model-grid">
        {modelKeys.map((key) => {
          const model = MODELS[key];
          const isSelected = state.selectedModel === model.model_id;

          return (
            <button
              key={model.model_id}
              className={`model-card ${isSelected ? 'selected' : ''}`}
              onClick={() => handleModelSelect(model.model_id)}
              aria-pressed={isSelected}
            >
              <div className="model-icon">{model.icon}</div>
              <h3 className="model-name">{model.display_name}</h3>
              <p className="model-description">{model.description}</p>
              <span className="model-type-badge">{model.api_type === 'sync' ? 'Instant' : 'Async'}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
