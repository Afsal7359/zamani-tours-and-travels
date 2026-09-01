'use client';
import { useState, useRef, useEffect } from 'react';
import { useUpload } from './UploadContext';
import { uploadToCloudinary } from '@/lib/upload';

export default function ImageUpload({ value, onChange, label }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();
  const { beginUpload, endUpload } = useUpload();
  const activeRef = useRef(false);

  // If this field unmounts mid-upload (e.g. modal closed), release the counter.
  useEffect(() => () => {
    if (activeRef.current) {
      endUpload();
      activeRef.current = false;
    }
  }, [endUpload]);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    beginUpload();
    activeRef.current = true;
    try {
      const url = await uploadToCloudinary(file);
      if (url) {
        onChange(url);
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Image upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (activeRef.current) {
        endUpload();
        activeRef.current = false;
      }
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="admin-form-group">
      {label && <label>{label}</label>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={() => inputRef.current.click()}
          disabled={uploading}
          style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          {uploading ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Uploading...
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload Image
            </>
          )}
        </button>
        <input
          type="text"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder="or paste image URL..."
          style={{ flex: 1 }}
        />
      </div>
      {value && (
        <img src={value} className="admin-img-preview" alt="Preview" />
      )}
    </div>
  );
}
