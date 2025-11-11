import { useState, useEffect } from 'react';
import { CacheManager } from '../utils/cacheManager';
import { downloadFile } from '../utils/imageUtils';
import type { CachedGeneration, GenerationSource } from '../types/cache';
import './RecentGens.css';

export function RecentGens() {
  const [activeTab, setActiveTab] = useState<GenerationSource>('models');
  const [generations, setGenerations] = useState<CachedGeneration[]>([]);
  const [counts, setCounts] = useState({ models: 0, tools: 0, agents: 0 });
  const [viewModal, setViewModal] = useState<{ url: string; type: 'image' | 'video' } | null>(null);

  // Load generations when component mounts or tab changes
  useEffect(() => {
    loadGenerations();
  }, [activeTab]);

  const loadGenerations = () => {
    const gens = CacheManager.getBySource(activeTab);
    const newCounts = CacheManager.getCounts();
    setGenerations(gens);
    setCounts(newCounts);
  };

  const handleClearSource = () => {
    if (confirm(`Clear all ${activeTab} generations?`)) {
      CacheManager.clearSource(activeTab);
      loadGenerations();
    }
  };

  const handleClearAll = () => {
    if (confirm('Clear all recent generations from all sources?')) {
      CacheManager.clearAll();
      loadGenerations();
    }
  };

  const handleDelete = (id: string) => {
    CacheManager.delete(id);
    loadGenerations();
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      await downloadFile(url, filename);
    } catch (err) {
      console.error('Failed to download:', err);
      alert('Failed to download file');
    }
  };

  const handleView = (url: string, type: 'image' | 'video') => {
    setViewModal({ url, type });
  };

  const closeModal = () => {
    setViewModal(null);
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getFileExtension = (type: 'image' | 'video'): string => {
    return type === 'video' ? 'mp4' : 'png';
  };

  return (
    <div className="recent-gens">
      <div className="recent-gens-header">
        <h2>📦 Recent Generations</h2>
        <div className="recent-gens-actions">
          <button onClick={handleClearSource} className="clear-source-btn">
            Clear {activeTab}
          </button>
          <button onClick={handleClearAll} className="clear-all-btn">
            Clear All
          </button>
        </div>
      </div>

      <div className="recent-gens-tabs">
        <button
          className={`tab ${activeTab === 'models' ? 'active' : ''}`}
          onClick={() => setActiveTab('models')}
        >
          🎨 Models ({counts.models})
        </button>
        <button
          className={`tab ${activeTab === 'tools' ? 'active' : ''}`}
          onClick={() => setActiveTab('tools')}
        >
          🛠️ Tools ({counts.tools})
        </button>
        <button
          className={`tab ${activeTab === 'agents' ? 'active' : ''}`}
          onClick={() => setActiveTab('agents')}
        >
          🤖 Agents ({counts.agents})
        </button>
      </div>

      <div className="recent-gens-content">
        {generations.length === 0 ? (
          <div className="empty-state">
            <p>No {activeTab} generations yet</p>
            <p className="empty-hint">
              Generate images or videos from the {activeTab} section to see them here
            </p>
          </div>
        ) : (
          <div className="generations-list">
            {generations.map((gen) => (
              <div key={gen.id} className="generation-item">
                <div className="generation-thumbnail">
                  {gen.type === 'image' ? (
                    <img src={gen.url} alt={gen.sourceName} loading="lazy" />
                  ) : (
                    <video src={gen.url} controls={false} muted />
                  )}
                  <div className="generation-type-badge">
                    {gen.type === 'image' ? '🖼️' : '🎬'}
                  </div>
                </div>

                <div className="generation-info">
                  <div className="generation-meta">
                    <span className="generation-source-name">{gen.sourceName}</span>
                    <span className="generation-time">{formatDate(gen.timestamp)}</span>
                  </div>
                  
                  {gen.prompt && (
                    <div className="generation-prompt" title={gen.prompt}>
                      {gen.prompt}
                    </div>
                  )}

                  <div className="generation-actions">
                    <button
                      onClick={() => handleDownload(
                        gen.url,
                        `${gen.sourceName}-${gen.timestamp}.${getFileExtension(gen.type)}`
                      )}
                      className="download-btn"
                      title="Download"
                    >
                      ⬇️ Download
                    </button>
                    <button
                      onClick={() => handleView(gen.url, gen.type)}
                      className="view-btn"
                      title="View full size"
                    >
                      👁️ View
                    </button>
                    <button
                      onClick={() => handleDelete(gen.id)}
                      className="delete-btn"
                      title="Remove from history"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Modal */}
      {viewModal && (
        <div className="view-modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              ✕
            </button>
            {viewModal.type === 'image' ? (
              <img src={viewModal.url} alt="Full size" className="modal-image" />
            ) : (
              <video src={viewModal.url} controls autoPlay className="modal-video" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
