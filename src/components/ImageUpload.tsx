import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { processImageFile, revokePreviewUrl, formatFileSize } from '../utils/imageUtils';
import type { UploadedImage } from '../types';
import './ImageUpload.css';

interface ImageUploadProps {
  label: string;
  onChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  currentImages?: UploadedImage[];
  required?: boolean;
}

export function ImageUpload({
  label,
  onChange,
  maxImages = 1,
  currentImages = [],
  required = false,
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (files: File[]) => {
    setErrors([]);

    // Check max images limit
    if (currentImages.length + files.length > maxImages) {
      setErrors([`Maximum ${maxImages} image${maxImages > 1 ? 's' : ''} allowed`]);
      return;
    }

    const newImages: UploadedImage[] = [];
    const processingErrors: string[] = [];

    for (const file of files) {
      try {
        const processedImage = await processImageFile(file);
        newImages.push(processedImage);
      } catch (error) {
        processingErrors.push(
          error instanceof Error ? error.message : 'Failed to process image'
        );
      }
    }

    if (processingErrors.length > 0) {
      setErrors(processingErrors);
    }

    if (newImages.length > 0) {
      onChange([...currentImages, ...newImages]);
    }
  };

  const handleRemove = (imageId: string) => {
    const imageToRemove = currentImages.find(img => img.id === imageId);
    if (imageToRemove) {
      revokePreviewUrl(imageToRemove.preview);
    }

    const updatedImages = currentImages.filter(img => img.id !== imageId);
    onChange(updatedImages);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="image-upload">
      <label className="image-upload-label">
        {label} {required && <span className="required">*</span>}
      </label>

      {currentImages.length < maxImages && (
        <div
          className={`image-upload-zone ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/bmp,image/webp"
            multiple={maxImages > 1}
            onChange={handleChange}
            style={{ display: 'none' }}
          />

          <div className="upload-icon">📁</div>
          <p className="upload-text">
            Drag and drop images here, or <span className="browse-link">browse</span>
          </p>
          <p className="upload-hint">
            Supported: JPEG, PNG, BMP, WEBP (max 10MB)
          </p>
        </div>
      )}

      {currentImages.length > 0 && (
        <div className="uploaded-images">
          {currentImages.map((image) => (
            <div key={image.id} className="uploaded-image-item">
              <img
                src={image.preview}
                alt="Uploaded preview"
                className="image-preview"
              />
              <div className="image-info">
                <p className="image-filename">{image.file.name}</p>
                <p className="image-details">
                  {image.width}×{image.height} • {formatFileSize(image.size)}
                </p>
              </div>
              <button
                type="button"
                className="image-remove-btn"
                onClick={() => handleRemove(image.id)}
                aria-label="Remove image"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {errors.length > 0 && (
        <div className="upload-errors">
          {errors.map((error, index) => (
            <p key={index} className="error-message">
              {error}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
