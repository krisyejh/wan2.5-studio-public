import type { CachedGeneration, GenerationSource, CachedGenerations } from '../types/cache';

const STORAGE_KEY = 'wan_studio_recent_generations';
const MAX_ITEMS_PER_SOURCE = 100;

/**
 * LocalStorage-based cache manager for recent generations
 */
export class CacheManager {
  /**
   * Load all cached generations from localStorage
   */
  static load(): CachedGenerations {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return { models: [], tools: [], agents: [] };
      }
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to load cache:', error);
      return { models: [], tools: [], agents: [] };
    }
  }

  /**
   * Save all cached generations to localStorage
   */
  private static save(cache: CachedGenerations): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Failed to save cache:', error);
    }
  }

  /**
   * Add a new generation to cache
   */
  static add(generation: Omit<CachedGeneration, 'id'>): void {
    const cache = this.load();
    const source = generation.source;

    // Create new generation with unique ID
    const newGen: CachedGeneration = {
      ...generation,
      id: `${source}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    // Add to the beginning of the array
    cache[source].unshift(newGen);

    // Keep only the most recent MAX_ITEMS_PER_SOURCE items
    if (cache[source].length > MAX_ITEMS_PER_SOURCE) {
      cache[source] = cache[source].slice(0, MAX_ITEMS_PER_SOURCE);
    }

    this.save(cache);
  }

  /**
   * Add multiple URLs from the same generation (for n>1 images)
   */
  static addMultiple(
    urls: string[],
    type: 'image' | 'video',
    source: GenerationSource,
    sourceName: string,
    prompt?: string,
    metadata?: Record<string, any>
  ): void {
    const timestamp = Date.now();
    urls.forEach((url, index) => {
      this.add({
        url,
        type,
        source,
        sourceName,
        timestamp: timestamp + index, // Slight offset to maintain order
        prompt,
        metadata,
      });
    });
  }

  /**
   * Get all generations for a specific source
   */
  static getBySource(source: GenerationSource): CachedGeneration[] {
    const cache = this.load();
    return cache[source];
  }

  /**
   * Get all cached generations
   */
  static getAll(): CachedGenerations {
    return this.load();
  }

  /**
   * Clear all cached generations for a specific source
   */
  static clearSource(source: GenerationSource): void {
    const cache = this.load();
    cache[source] = [];
    this.save(cache);
  }

  /**
   * Clear all cached generations
   */
  static clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Delete a specific generation by ID
   */
  static delete(id: string): void {
    const cache = this.load();
    
    for (const source of ['models', 'tools', 'agents'] as GenerationSource[]) {
      cache[source] = cache[source].filter(gen => gen.id !== id);
    }
    
    this.save(cache);
  }

  /**
   * Get count of items per source
   */
  static getCounts(): Record<GenerationSource, number> {
    const cache = this.load();
    return {
      models: cache.models.length,
      tools: cache.tools.length,
      agents: cache.agents.length,
    };
  }
}
