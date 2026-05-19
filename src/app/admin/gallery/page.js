'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getGallery, saveGallery } from '@/lib/firestore';
import { defaultGallery } from '@/lib/defaultData';

export default function AdminGalleryPage() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileRef = useRef();

  useEffect(() => {
    async function load() {
      try {
        const data = await getGallery();
        setImages(data?.images?.length ? data.images : defaultGallery.images);
      } catch (e) {
        console.error(e);
        setImages(defaultGallery.images);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.url) urls.push(data.url);
        else throw new Error(data.error || 'Upload failed');
      }
      setImages(prev => [...prev, ...urls]);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Image upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function addUrl() {
    const u = urlInput.trim();
    if (!u) return;
    setImages(prev => [...prev, u]);
    setUrlInput('');
  }

  function removeImage(idx) {
    setImages(prev => prev.filter((_, i) => i !== idx));
  }

  function move(idx, dir) {
    setImages(prev => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveGallery({ images });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Error saving.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="admin-empty">Loading...</div>;

  return (
    <>
      <div className="admin-breadcrumb">
        <Link href="/admin">Dashboard</Link> / Gallery
      </div>

      <form onSubmit={handleSave}>
        <div className="admin-card">
          <div className="admin-card-head">
            <h2>Gallery Images</h2>
            <span style={{ fontSize: '.82rem', color: '#5a627d' }}>
              {images.length} image{images.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p style={{ fontSize: '.85rem', color: '#5a627d', marginBottom: '1.2rem' }}>
            These images appear in the scrolling strip on the Home page and the gallery grid on the
            About page. Portrait images (4:5) display best.
          </p>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleFiles}
          />
          <div
            style={{
              display: 'flex',
              gap: '.6rem',
              flexWrap: 'wrap',
              alignItems: 'center',
              marginBottom: '1.4rem',
            }}
          >
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={() => fileRef.current.click()}
              disabled={uploading}
              style={{ whiteSpace: 'nowrap' }}
            >
              {uploading ? 'Uploading...' : '+ Upload Images'}
            </button>
            <input
              type="text"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addUrl();
                }
              }}
              placeholder="or paste an image URL..."
              style={{ flex: 1, minWidth: '220px' }}
            />
            <button type="button" className="admin-btn admin-btn-secondary" onClick={addUrl}>
              Add URL
            </button>
          </div>

          {images.length === 0 ? (
            <div className="admin-empty">No images yet — upload some to get started.</div>
          ) : (
            <div className="admin-gallery-grid">
              {images.map((src, idx) => (
                <div className="admin-gallery-item" key={`${src}-${idx}`}>
                  <span className="admin-gallery-num">{idx + 1}</span>
                  <img src={src} alt={`Gallery ${idx + 1}`} />
                  <div className="admin-gallery-actions">
                    <button
                      type="button"
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0}
                      title="Move earlier"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={() => move(idx, 1)}
                      disabled={idx === images.length - 1}
                      title="Move later"
                    >
                      ›
                    </button>
                    <button
                      type="button"
                      className="del"
                      onClick={() => removeImage(idx)}
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {saved && (
            <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '.88rem' }}>
              ✓ Saved successfully
            </span>
          )}
        </div>
      </form>
    </>
  );
}
