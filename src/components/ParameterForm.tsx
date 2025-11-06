import { useState, useEffect, type FormEvent } from 'react';
import { useApp } from '../context/AppContext';
import { MODEL_PARAMETERS } from '../config/models';
import { ImageUpload } from './ImageUpload';
import type { ParameterDefinition, UploadedImage } from '../types';
import './ParameterForm.css';

interface ParameterFormProps {
  modelKey: string;
  onSubmit: (formData: any) => void;
}

export function ParameterForm({ modelKey, onSubmit }: ParameterFormProps) {
  const { state, updateFormData, setUploadedImages } = useApp();
  const parameters = MODEL_PARAMETERS[modelKey] || [];
  
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [charCounts, setCharCounts] = useState<Record<string, number>>({});

  // Initialize form data with defaults
  useEffect(() => {
    const initialData: Record<string, any> = {};
    parameters.forEach(param => {
      if (param.defaultValue !== undefined) {
        initialData[param.name] = param.defaultValue;
      }
    });
    setFormData(initialData);
  }, [modelKey]);

  // Load saved form data
  useEffect(() => {
    const savedData = state.formData[modelKey];
    if (savedData) {
      setFormData(savedData);
    }
  }, [modelKey, state.formData]);

  const handleInputChange = (name: string, value: any) => {
    const updatedData = { ...formData, [name]: value };
    setFormData(updatedData);
    updateFormData(modelKey, updatedData);

    // Clear error for this field
    if (errors[name]) {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }

    // Update character count for text fields
    if (typeof value === 'string') {
      setCharCounts(prev => ({ ...prev, [name]: value.length }));
    }
  };

  const handleImageUpload = (name: string, images: UploadedImage[]) => {
    const base64Values = images.map(img => img.base64!);
    handleInputChange(name, name === 'images' ? base64Values : base64Values[0]);
    setUploadedImages(modelKey, name, images);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    parameters.forEach(param => {
      // Skip if field is conditionally hidden
      if (param.showWhen && !param.showWhen(formData)) {
        return;
      }

      const value = formData[param.name];

      // Required field validation
      if (param.required && (!value || (Array.isArray(value) && value.length === 0))) {
        newErrors[param.name] = `${param.label} is required`;
        return;
      }

      // Max length validation for text
      if (param.maxLength && typeof value === 'string' && value.length > param.maxLength) {
        newErrors[param.name] = `Maximum ${param.maxLength} characters allowed`;
      }

      // Number range validation
      if (param.type === 'number' && value !== undefined && value !== '') {
        const numValue = Number(value);
        if (param.min !== undefined && numValue < param.min) {
          newErrors[param.name] = `Minimum value is ${param.min}`;
        }
        if (param.max !== undefined && numValue > param.max) {
          newErrors[param.name] = `Maximum value is ${param.max}`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const renderField = (param: ParameterDefinition) => {
    // Check if field should be shown
    if (param.showWhen && !param.showWhen(formData)) {
      return null;
    }

    const value = formData[param.name] ?? '';
    const hasError = !!errors[param.name];

    switch (param.type) {
      case 'text':
        return (
          <div key={param.name} className="form-field">
            <label htmlFor={param.name}>
              {param.label} {param.required && <span className="required">*</span>}
              {param.tooltip && <span className="tooltip" title={param.tooltip}>ⓘ</span>}
            </label>
            <input
              id={param.name}
              type="text"
              value={value}
              onChange={(e) => handleInputChange(param.name, e.target.value)}
              placeholder={param.placeholder}
              maxLength={param.maxLength}
              className={hasError ? 'error' : ''}
            />
            {param.maxLength && (
              <span className="char-count">
                {charCounts[param.name] || 0}/{param.maxLength}
              </span>
            )}
            {hasError && <span className="error-message">{errors[param.name]}</span>}
          </div>
        );

      case 'textarea':
        return (
          <div key={param.name} className="form-field">
            <label htmlFor={param.name}>
              {param.label} {param.required && <span className="required">*</span>}
              {param.tooltip && <span className="tooltip" title={param.tooltip}>ⓘ</span>}
            </label>
            <textarea
              id={param.name}
              value={value}
              onChange={(e) => handleInputChange(param.name, e.target.value)}
              placeholder={param.placeholder}
              maxLength={param.maxLength}
              rows={4}
              className={hasError ? 'error' : ''}
            />
            {param.maxLength && (
              <span className="char-count">
                {charCounts[param.name] || 0}/{param.maxLength}
              </span>
            )}
            {hasError && <span className="error-message">{errors[param.name]}</span>}
          </div>
        );

      case 'number':
        return (
          <div key={param.name} className="form-field">
            <label htmlFor={param.name}>
              {param.label} {param.required && <span className="required">*</span>}
              {param.tooltip && <span className="tooltip" title={param.tooltip}>ⓘ</span>}
            </label>
            <input
              id={param.name}
              type="number"
              value={value}
              onChange={(e) => handleInputChange(param.name, e.target.value ? Number(e.target.value) : '')}
              placeholder={param.placeholder}
              min={param.min}
              max={param.max}
              className={hasError ? 'error' : ''}
            />
            {hasError && <span className="error-message">{errors[param.name]}</span>}
          </div>
        );

      case 'boolean':
        return (
          <div key={param.name} className="form-field checkbox-field">
            <label>
              <input
                type="checkbox"
                checked={!!value}
                onChange={(e) => handleInputChange(param.name, e.target.checked)}
              />
              <span>
                {param.label}
                {param.tooltip && <span className="tooltip" title={param.tooltip}>ⓘ</span>}
              </span>
            </label>
          </div>
        );

      case 'select':
        return (
          <div key={param.name} className="form-field">
            <label htmlFor={param.name}>
              {param.label} {param.required && <span className="required">*</span>}
              {param.tooltip && <span className="tooltip" title={param.tooltip}>ⓘ</span>}
            </label>
            <select
              id={param.name}
              value={value}
              onChange={(e) => handleInputChange(param.name, e.target.value)}
              className={hasError ? 'error' : ''}
            >
              {param.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {hasError && <span className="error-message">{errors[param.name]}</span>}
          </div>
        );

      case 'image':
      case 'images':
        return (
          <div key={param.name} className="form-field">
            <ImageUpload
              label={param.label}
              onChange={(images) => handleImageUpload(param.name, images)}
              maxImages={param.type === 'images' ? 2 : 1}
              currentImages={(state.uploadedImages[modelKey]?.[param.name]) || []}
              required={param.required}
            />
            {hasError && <span className="error-message">{errors[param.name]}</span>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="parameter-form">
      <h3>Configure Parameters</h3>
      <div className="form-fields">
        {parameters.map(param => renderField(param))}
      </div>
      <div className="form-actions">
        <button
          type="submit"
          className="submit-btn"
          disabled={state.isSubmitting}
        >
          {state.isSubmitting ? 'Generating...' : 'Generate'}
        </button>
      </div>
    </form>
  );
}
