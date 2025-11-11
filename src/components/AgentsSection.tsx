import { useState } from 'react';
import { StoryboardGeneratorAgent } from './StoryboardGeneratorAgent';
import './AgentsSection.css';

export function AgentsSection() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  if (selectedAgent === 'storyboard') {
    return (
      <div className="agents-section">
        <button 
          onClick={() => setSelectedAgent(null)} 
          className="back-btn"
          style={{
            marginBottom: '1rem',
            padding: '0.5rem 1rem',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          ← Back to Agents
        </button>
        <StoryboardGeneratorAgent />
      </div>
    );
  }

  return (
    <div className="agents-section">
      <div className="section-header">
        <h2>🤖 AI Agents</h2>
        <p>Intelligent workflow applications for video creation</p>
      </div>
      
      <div className="agent-grid">
        <div className="agent-card">
          <div className="agent-icon">📋</div>
          <h3 className="agent-name">AI Storyboard Generator</h3>
          <p className="agent-description">
            Generate creative storyboard shots for video production using AI workflow
          </p>
          <button 
            className="agent-btn"
            onClick={() => setSelectedAgent('storyboard')}
          >
            Launch Agent
          </button>
        </div>
        
        <div className="agent-card disabled">
          <div className="agent-icon">✍️</div>
          <h3 className="agent-name">Script Analyzer</h3>
          <p className="agent-description">
            Analyze and optimize your video scripts with AI suggestions
          </p>
          <button className="agent-btn" disabled>
            Coming Soon
          </button>
        </div>
        
        <div className="agent-card disabled">
          <div className="agent-icon">🎬</div>
          <h3 className="agent-name">Video Planner</h3>
          <p className="agent-description">
            Plan complete video production workflows with AI assistance
          </p>
          <button className="agent-btn" disabled>
            Coming Soon
          </button>
        </div>
      </div>
    </div>
  );
}
