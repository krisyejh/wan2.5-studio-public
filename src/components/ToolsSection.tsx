import { useState } from 'react';
import { SuperResolutionTool } from './SuperResolutionTool';
import './ToolsSection.css';

export function ToolsSection() {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  if (activeTool === 'super-resolution') {
    return <SuperResolutionTool onBack={() => setActiveTool(null)} />;
  }

  return (
    <div className="tools-section">
      <div className="section-header">
        <h2>🛠️ Tools</h2>
        <p>Image and video enhancement utilities</p>
      </div>
      
      <div className="tool-grid">
        <div className="tool-card">
          <div className="tool-icon">🔍</div>
          <h3 className="tool-name">Image Super-Resolution</h3>
          <p className="tool-description">
            Enhance image quality and increase resolution using AI
          </p>
          <button 
            className="tool-btn" 
            onClick={() => setActiveTool('super-resolution')}
          >
            Launch Tool
          </button>
        </div>
        
        <div className="tool-card disabled">
          <div className="tool-icon">✂️</div>
          <h3 className="tool-name">Caption Eraser</h3>
          <p className="tool-description">
            Remove subtitles and watermarks from images
          </p>
          <button className="tool-btn" disabled>
            Coming Soon
          </button>
        </div>
        
        <div className="tool-card disabled">
          <div className="tool-icon">🎭</div>
          <h3 className="tool-name">Background Remover</h3>
          <p className="tool-description">
            Automatically remove or replace image backgrounds
          </p>
          <button className="tool-btn" disabled>
            Coming Soon
          </button>
        </div>
      </div>
    </div>
  );
}
