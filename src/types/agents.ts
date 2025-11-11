// Agent configuration and type definitions

export type AgentId = 'storyboard-generator' | 'script-analyzer' | 'video-planner';

export interface AgentConfig {
  id: AgentId;
  displayName: string;
  description: string;
  icon: string;
  category: 'generation' | 'analysis' | 'workflow';
  apiType: 'stream' | 'sync';
  inputSchema: InputField[];
  outputType: 'text' | 'json' | 'media';
}

export interface InputField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select';
  required: boolean;
  placeholder?: string;
  maxLength?: number;
  options?: Array<{ label: string; value: string }>;
  tooltip?: string;
}

// Storyboard Generator Types

export interface StoryboardRequest {
  appId: string;
  input: {
    prompt: string;
    biz_params: {
      playShotScripts: string;
    };
  };
  parameters?: {
    flow_stream_mode?: string;
  };
}

// Character information from workflow
export interface CharacterInfo {
  name: string;
  personality: string;
  features: string;
  image: string;
}

// Refined shot script from workflow
export interface RefinedShotScript {
  景别: string;
  画面内容: string;
  音效台词: string;
  场景地: string;
}

// Workflow SSE response
export interface WorkflowMessage {
  node_status: string;
  node_type: string;
  node_msg_seq_id: number;
  node_name: string;
  message: {
    content: string;
    role: string;
  };
  node_is_completed: boolean;
  node_id: string;
}

export interface WorkflowSSEData {
  output: {
    session_id: string;
    workflow_message: WorkflowMessage;
    finish_reason: string;
  };
  usage?: {};
  request_id: string;
}

// Storyboard generation result
export interface StoryboardGenerationResult {
  characters: CharacterInfo[];
  refinedScripts: RefinedShotScript[];
  shotImages: string[];
}

export interface StreamingEvent {
  event: 'result' | 'error';
  data: {
    output?: {
      text: string;
      finish_reason?: string;
      session_id?: string;
    };
    usage?: {
      models: Array<{
        model_id: string;
        input_tokens: number;
        output_tokens: number;
      }>;
    };
    error?: {
      code: string;
      message: string;
    };
    request_id?: string;
  };
}

export interface StoryboardResult {
  content: string;
  metadata: {
    appId: string;
    prompt: string;
    sessionId?: string;
    timestamp: string;
    usage?: {
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
    };
  };
}

// Agent state types

export type AgentStreamingStatus = 'idle' | 'connecting' | 'streaming' | 'completed' | 'error';

export interface AgentState {
  selectedAgent: AgentId | null;
  inputs: Record<string, any>;
  streamingContent: string;
  streamingStatus: AgentStreamingStatus;
  result: StoryboardResult | null;
  error: string | null;
  metadata: {
    requestId?: string;
    sessionId?: string;
    usage?: {
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
    };
  } | null;
}

// SSE parsing utilities

export interface SSEMessage {
  event?: string;
  data: string;
  id?: string;
  retry?: number;
}

export type StreamCallback = (chunk: string) => void;
export type ErrorCallback = (error: Error) => void;
export type CompleteCallback = () => void;
