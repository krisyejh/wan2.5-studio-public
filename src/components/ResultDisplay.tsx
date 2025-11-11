import { useApp } from '../context/AppContext';
import { downloadFile, generateDownloadFilename } from '../utils/imageUtils';
import './ResultDisplay.css';

export function ResultDisplay() {
  const { state, selectModel, setResult } = useApp();

  if (!state.result) return null;

  const { type, url, urls, metadata } = state.result;
  const imageUrls = urls && urls.length > 0 ? urls : [url];

  console.log('=== RESULT DISPLAY DEBUG ===');
  console.log('Result type:', type);
  console.log('Result url:', url);
  console.log('Result urls:', urls);
  console.log('Computed imageUrls:', imageUrls);
  console.log('imageUrls length:', imageUrls.length);
  console.log('Will show gallery:', imageUrls.length > 1);
  console.log('============================');

  const handleDownload = async (imageUrl: string, index?: number) => {
    try {
      const filename = generateDownloadFilename(
        metadata.model, 
        type, 
        imageUrls.length > 1 ? index : undefined
      );
      await downloadFile(imageUrl, filename);
    } catch (error) {
      alert('Failed to download file. Please try again.');
    }
  };

  const handleDownloadAll = async () => {
    for (let i = 0; i < imageUrls.length; i++) {
      try {
        await handleDownload(imageUrls[i], i);
        // Add a small delay between downloads to avoid overwhelming the browser
        if (i < imageUrls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`Failed to download image ${i + 1}:`, error);
      }
    }
  };

  const handleStartNew = () => {
    setResult(null);
  };

  const handleBackToModels = () => {
    selectModel(null);
  };

  return (
    <div className="result-display">
      <div className="back-to-models-container">
        <button onClick={handleBackToModels} className="back-to-models-btn">
          ← Back to Models
        </button>
      </div>
      
      <div className="result-header">
        <h3>Generated Result{imageUrls.length > 1 ? 's' : ''}</h3>
        <p className="expiration-warning">
          ⚠️ Content expires in 24 hours. Please download to save.
        </p>
      </div>

      <div className="result-content">
        {type === 'image' ? (
          <div className="image-result">
            {imageUrls.length > 1 ? (
              <div className="image-gallery">
                {imageUrls.map((imgUrl, index) => (
                  <div key={index} className="gallery-item">
                    <img src={imgUrl} alt={`Generated image ${index + 1}`} className="result-image" />
                    <button 
                      onClick={() => handleDownload(imgUrl, index)} 
                      className="gallery-download-btn"
                      title="Download this image"
                    >
                      ⬇️ Download
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <img src={imageUrls[0]} alt="Generated image" className="result-image" />
            )}
            {metadata.width && metadata.height && (
              <p className="result-meta">
                Resolution: {metadata.width} × {metadata.height}
              </p>
            )}
          </div>
        ) : (
          <div className="video-result">
            <video src={url} controls className="result-video" />
            {metadata.duration && (
              <p className="result-meta">
                Duration: {metadata.duration} seconds
              </p>
            )}
          </div>
        )}
      </div>

      {metadata.prompt && (
        <div className="result-info">
          <p className="result-prompt">
            <strong>Prompt:</strong> {metadata.prompt}
          </p>
        </div>
      )}

      <div className="result-actions">
        {type === 'image' && imageUrls.length > 1 ? (
          <button onClick={handleDownloadAll} className="download-btn">
            ⬇️ Download All ({imageUrls.length})
          </button>
        ) : type === 'image' && imageUrls.length === 1 ? (
          <button onClick={() => handleDownload(imageUrls[0])} className="download-btn">
            ⬇️ Download
          </button>
        ) : (
          <button onClick={() => handleDownload(url)} className="download-btn">
            ⬇️ Download
          </button>
        )}
        <button onClick={handleStartNew} className="new-task-btn">
          Start New Generation
        </button>
      </div>
    </div>
  );
}
