import { createContext, useContext, useState, type ReactNode } from 'react';
import type { ModelId, GeneratedResult, TaskStatus } from '../types';

export type SectionType = 'models' | 'tools' | 'agents' | 'recent';

interface TaskState {
  taskId?: string;
  status?: TaskStatus;
  startTime?: number;
  modelId?: string;
}

interface AppState {
  activeSection: SectionType;
  selectedModel: ModelId | null;
  formData: Record<string, any>;
  uploadedImages: Record<string, Record<string, any[]>>; // Changed to support per-field images
  taskState: TaskState;
  result: GeneratedResult | null;
  error: string | null;
  isSubmitting: boolean;
}

interface AppContextType {
  state: AppState;
  setActiveSection: (section: SectionType) => void;
  selectModel: (modelId: ModelId | null) => void;
  updateFormData: (modelId: string, data: any) => void;
  setUploadedImages: (modelId: string, fieldName: string, images: any[]) => void;
  setTaskState: (taskState: Partial<TaskState>) => void;
  setResult: (result: GeneratedResult | null) => void;
  setError: (error: string | null) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  resetState: () => void;
}

const initialState: AppState = {
  activeSection: 'models',
  selectedModel: null,
  formData: {},
  uploadedImages: {},
  taskState: {},
  result: null,
  error: null,
  isSubmitting: false,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  const setActiveSection = (section: SectionType) => {
    setState(prev => ({
      ...prev,
      activeSection: section,
    }));
  };

  const selectModel = (modelId: ModelId | null) => {
    setState(prev => ({
      ...prev,
      selectedModel: modelId,
      error: null,
      result: null,
      taskState: {},
    }));
  };

  const updateFormData = (modelId: string, data: any) => {
    setState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [modelId]: data,
      },
    }));
  };

  const setUploadedImages = (modelId: string, fieldName: string, images: any[]) => {
    setState(prev => ({
      ...prev,
      uploadedImages: {
        ...prev.uploadedImages,
        [modelId]: {
          ...(prev.uploadedImages[modelId] || {}),
          [fieldName]: images,
        },
      },
    }));
  };

  const setTaskState = (taskState: Partial<TaskState>) => {
    setState(prev => ({
      ...prev,
      taskState: {
        ...prev.taskState,
        ...taskState,
      },
    }));
  };

  const setResult = (result: GeneratedResult | null) => {
    setState(prev => ({
      ...prev,
      result,
    }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({
      ...prev,
      error,
    }));
  };

  const setIsSubmitting = (isSubmitting: boolean) => {
    setState(prev => ({
      ...prev,
      isSubmitting,
    }));
  };

  const resetState = () => {
    setState(initialState);
  };

  return (
    <AppContext.Provider
      value={{
        state,
        setActiveSection,
        selectModel,
        updateFormData,
        setUploadedImages,
        setTaskState,
        setResult,
        setError,
        setIsSubmitting,
        resetState,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
