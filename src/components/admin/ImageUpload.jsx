'use client';
import { useState, useRef, useEffect } from 'react';
import { useUpload } from './UploadContext';
import { uploadToCloudinary } from '@/lib/upload';
import { isVideoUrl, getVideoPosterUrl, getOptimizedImageUrl } from '@/lib/videoUtils';

export default function ImageUpload({
  value,
  onChange,
  label,
  accept = 'image/*,video/*',
  showTypeBadge = true,
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();
  const { beginUpload, endUpload } = useUpload();
  const activeRef = useRef(false);
  const [progress, setProgress] = useState(0);

  // If this field unmounts mid-upload (e.g. modal closed), release the counter.
  useEffect(() => () => {
    if (activeRef.current) {
      endUpload();
      activeRef.current = false;
    }
  }, [endUpload]);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setProgress(0);
    beginUpload();
    activeRef.current = true;
    try {
      const url = await uploadToCloudinary(file, (pct) => setProgress(pct));
      if (url) {
        onChange(url);
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert(err.message || 'File upload failed. Please try again.');
    } finally {
      setUploading(false);
      setProgress(0);
      if (activeRef.current) {
        endUpload();
        activeRef.current = false;
      }
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const isVid = isVideoUrl(value);

  return (
    <div className="admin-form-group">
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
          <label style={{ margin: 0 }}>{label}</label>
          {showTypeBadge && value && (
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                background: isVid ? '#e0e7ff' : '#ecfdf5',
                color: isVid ? '#3730a3' : '#065f46',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {isVid ? '🎬 Video' : '📷 Image'}
            </span>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={handleFile}
      />

      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          {uploading ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Uploading {progress > 0 ? `${progress}%` : '...'}
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload Media
            </>
          )}
        </button>

        <input
          type="text"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder="or paste image / video URL..."
          style={{ flex: 1 }}
        />

        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            title="Clear media"
            style={{
              background: '#fee2e2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              padding: '0.45rem 0.7rem',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Preview */}
      {value && (
        <div style={{ marginTop: '0.6rem', position: 'relative', display: 'inline-block' }}>
          {isVid ? (
            <video
              src={value}
              poster={getVideoPosterUrl(value) || undefined}
              controls
              muted
              playsInline
              preload="metadata"
              style={{
                maxWidth: '100%',
                maxHeight: '180px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                display: 'block',
                background: '#050b26',
              }}
            />
          ) : (
            <img
              src={getOptimizedImageUrl(value, 400)}
              className="admin-img-preview"
              alt="Preview"
              onError={(e) => {
                if (e.currentTarget.src !== value) {
                  e.currentTarget.src = value;
                }
              }}
              style={{
                maxWidth: '100%',
                maxHeight: '180px',
                objectFit: 'cover',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                display: 'block',
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
