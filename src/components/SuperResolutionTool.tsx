import { useState, useRef } from 'react';
import {
  prepareImageData,
  callSuperResolution,
  downloadImage,
} from '../services/toolsApi';
import { CacheManager } from '../utils/cacheManager';
import type { UploadedImageData, SuperResolutionResult } from '../types/tools';
import './SuperResolutionTool.css';

interface SuperResolutionToolProps {
  onBack?: () => void;
}

export function SuperResolutionTool({ onBack }: SuperResolutionToolProps = {}) {
  const [uploadedImage, setUploadedImage] = useState<UploadedImageData | null>(null);
  const [mode, setMode] = useState<'base' | 'enhancement'>('base');
  const [upscaleFactor, setUpscaleFactor] = useState<2 | 4>(2);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<SuperResolutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      const imageData = await prepareImageData(file);
      setUploadedImage(imageData);
      setResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load image');
    }
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (!file) return;

    try {
      setError(null);
      const imageData = await prepareImageData(file);
      setUploadedImage(imageData);
      setResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load image');
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const getImageDimensionsFromUrl = async (url: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      img.src = url;
    });
  };

  const handleProcess = async () => {
    if (!uploadedImage) return;

    setProcessing(true);
    setError(null);

    try {
      // Call super-resolution API directly with the file
      const response = await callSuperResolution(
        uploadedImage.file,
        mode,
        upscaleFactor
      );

      if (response.success && response.imageUrl && response.metadata) {
        // Get actual dimensions from the images
        const originalDimensions = await getImageDimensionsFromUrl(uploadedImage.preview);
        const enhancedDimensions = await getImageDimensionsFromUrl(response.imageUrl);

        const result: SuperResolutionResult = {
          originalUrl: uploadedImage.preview,
          enhancedUrl: response.imageUrl,
          metadata: {
            originalSize: originalDimensions,
            enhancedSize: enhancedDimensions,
            upscaleFactor,
            mode,
            processingTime: response.metadata.processingTime,
            timestamp: new Date().toISOString(),
          },
        };
        setResult(result);

        // Save to cache
        CacheManager.add({
          url: response.imageUrl,
          type: 'image',
          source: 'tools',
          sourceName: 'Image Super-Resolution',
          timestamp: Date.now(),
          metadata: {
            originalSize: originalDimensions,
            enhancedSize: enhancedDimensions,
            upscaleFactor,
            mode,
          },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!result) return;

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      await downloadImage(result.enhancedUrl, `enhanced-${timestamp}.png`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    }
  };

  const handleReset = () => {
    // Cleanup object URL to prevent memory leaks
    if (uploadedImage?.preview.startsWith('blob:')) {
      URL.revokeObjectURL(uploadedImage.preview);
    }
    if (result?.originalUrl.startsWith('blob:')) {
      URL.revokeObjectURL(result.originalUrl);
    }
    
    setUploadedImage(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="super-resolution-tool">
      {onBack && (
        <div className="back-to-tools-container">
          <button onClick={onBack} className="back-to-tools-btn">
            ← Back to Tools
          </button>
        </div>
      )}
      
      <div className="tool-header">
        <h2>🔍 Image Super-Resolution</h2>
        <p>Enhance image quality and increase resolution using AI</p>
      </div>

      {!uploadedImage && !result && (
        <div
          className="upload-area"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="upload-icon">📁</div>
          <p className="upload-text">Drag & drop an image or click to browse</p>
          <p className="upload-hint">Supports JPG, PNG (max 10MB)</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {uploadedImage && !result && (
        <div className="processing-section">
          <div className="image-preview">
            <img src={uploadedImage.preview} alt="Uploaded" />
            <div className="image-info">
              <p>
                <strong>Size:</strong> {uploadedImage.width} × {uploadedImage.height}
              </p>
              <p>
                <strong>File size:</strong> {(uploadedImage.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>

          <div className="parameters-section">
            <h3>Enhancement Parameters</h3>
            
            <div className="parameter-group">
              <label>Mode</label>
              <select value={mode} onChange={(e) => setMode(e.target.value as 'base' | 'enhancement')}>
                <option value="base">Base (Faster)</option>
                <option value="enhancement">Enhancement (Higher Quality)</option>
              </select>
              <p className="parameter-hint">
                Note: Mode parameter is deprecated and doesn't affect the result
              </p>
            </div>

            <div className="parameter-group">
              <label>Upscale Factor</label>
              <select value={upscaleFactor} onChange={(e) => setUpscaleFactor(Number(e.target.value) as 2 | 4)}>
                <option value={2}>2× (Doubles resolution)</option>
                <option value={4}>4× (Quadruples resolution)</option>
              </select>
              <p className="parameter-hint">
                Output: {uploadedImage.width * upscaleFactor} × {uploadedImage.height * upscaleFactor}
              </p>
            </div>

            <div className="action-buttons">
              <button onClick={handleProcess} disabled={processing} className="process-btn">
                {processing ? 'Processing...' : 'Enhance Image'}
              </button>
              <button onClick={handleReset} className="reset-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="result-section">
          <h3>✨ Enhancement Complete</h3>
          
          <div className="comparison-view">
            <div className="comparison-item">
              <h4>Original</h4>
              <img src={result.originalUrl} alt="Original" />
              <p className="image-size">
                {result.metadata.originalSize.width} × {result.metadata.originalSize.height}
              </p>
            </div>

            <div className="comparison-arrow">→</div>

            <div className="comparison-item">
              <h4>Enhanced</h4>
              <img src={result.enhancedUrl} alt="Enhanced" />
              <p className="image-size">
                {result.metadata.enhancedSize.width} × {result.metadata.enhancedSize.height}
              </p>
            </div>
          </div>

          <div className="result-metadata">
            <p><strong>Mode:</strong> {result.metadata.mode}</p>
            <p><strong>Upscale Factor:</strong> {result.metadata.upscaleFactor}×</p>
            <p><strong>Processing Time:</strong> {(result.metadata.processingTime / 1000).toFixed(2)}s</p>
          </div>

          <div className="action-buttons">
            <button onClick={handleDownload} className="download-btn">
              📥 Download Enhanced Image
            </button>
            <button onClick={handleReset} className="reset-btn">
              Process Another Image
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>⚠️ {error}</p>
        </div>
      )}
    </div>
  );
}
