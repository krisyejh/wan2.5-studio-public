// Cache types for Recent Gens feature

export type GenerationSource = 'models' | 'tools' | 'agents';

export interface CachedGeneration {
  id: string;
  url: string;
  type: 'image' | 'video';
  source: GenerationSource;
  sourceName: string; // model name, tool name, or agent name
  timestamp: number;
  prompt?: string;
  metadata?: Record<string, any>;
}

export interface CachedGenerations {
  models: CachedGeneration[];
  tools: CachedGeneration[];
  agents: CachedGeneration[];
}
