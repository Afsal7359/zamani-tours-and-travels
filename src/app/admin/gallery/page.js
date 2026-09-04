'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  getGallery,
  saveGallery,
  getVideoGallery,
  saveVideoGallery,
  getFeedbackGallery,
  saveFeedbackGallery,
} from '@/lib/firestore';
import { defaultGallery, defaultFeedbackGallery, defaultVideoGallery } from '@/lib/defaultData';
import { uploadToCloudinary } from '@/lib/upload';
import { getVideoPosterUrl } from '@/lib/videoUtils';

function normalizeItems(list = []) {
  if (!Array.isArray(list)) return [];
  return list
    .map(item => {
      if (typeof item === 'string') return { src: item, span: 1, connectNext: false };
      if (item && typeof item === 'object') {
        return {
          src: item.src || item.url || '',
          span: [1, 2, 3].includes(Number(item.span)) ? Number(item.span) : 1,
          connectNext: Boolean(item.connectNext),
        };
      }
      return null;
    })
    .filter(item => item && Boolean(item.src));
}

export default function AdminGalleryPage() {
  const [activeTab, setActiveTab] = useState('main'); // 'main' | 'videos' | 'feedback'
  const [mainImages, setMainImages] = useState([]);
  const [videoList, setVideoList] = useState([]);
  const [feedbackImages, setFeedbackImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const fileRef = useRef();

  useEffect(() => {
    async function load() {
      try {
        const [gData, vData, fgData] = await Promise.all([
          getGallery(),
          getVideoGallery(),
          getFeedbackGallery(),
        ]);
        setMainImages(gData?.images?.length ? normalizeItems(gData.images) : normalizeItems(defaultGallery.images));
        setVideoList(vData?.videos?.length ? normalizeItems(vData.videos) : normalizeItems(defaultVideoGallery.videos));
        setFeedbackImages(fgData?.images?.length ? normalizeItems(fgData.images) : normalizeItems(defaultFeedbackGallery.images));
      } catch (e) {
        console.error('Error fetching gallery data:', e);
        setMainImages(normalizeItems(defaultGallery.images));
        setVideoList(normalizeItems(defaultVideoGallery.videos));
        setFeedbackImages(normalizeItems(defaultFeedbackGallery.images));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const currentList =
    activeTab === 'main'
      ? mainImages
      : activeTab === 'videos'
      ? videoList
      : feedbackImages;

  const setCurrentList =
    activeTab === 'main'
      ? setMainImages
      : activeTab === 'videos'
      ? setVideoList
      : setFeedbackImages;

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setUploadProgress(`Preparing ${files.length} file${files.length > 1 ? 's' : ''}...`);
    try {
      const newItems = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Uploading ${i + 1} of ${files.length} (${file.name})...`);
        const url = await uploadToCloudinary(file, (pct) => {
          setUploadProgress(`Uploading ${i + 1} of ${files.length} (${file.name}) — ${pct}%`);
        });
        if (url) {
          newItems.push({ src: url, span: 1, connectNext: false });
        }
      }

      if (newItems.length > 0) {
        let updatedMain = mainImages;
        let updatedVideos = videoList;
        let updatedFeedback = feedbackImages;

        if (activeTab === 'main') {
          updatedMain = [...mainImages, ...newItems];
          setMainImages(updatedMain);
        } else if (activeTab === 'videos') {
          updatedVideos = [...videoList, ...newItems];
          setVideoList(updatedVideos);
        } else {
          updatedFeedback = [...feedbackImages, ...newItems];
          setFeedbackImages(updatedFeedback);
        }

        // Auto-save changes immediately to Firestore
        await Promise.all([
          saveGallery({ images: updatedMain }),
          saveVideoGallery({ videos: updatedVideos }),
          saveFeedbackGallery({ images: updatedFeedback }),
        ]);
        setSaved(true);
        setTimeout(() => setSaved(false), 4000);
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert(`Upload failed: ${err.message || 'Please check your file format/size and try again.'}`);
    } finally {
      setUploading(false);
      setUploadProgress('');
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function addUrl() {
    const raw = urlInput.trim();
    if (!raw) return;
    // Support multiple comma or newline-separated URLs
    const splitUrls = raw
      .split(/[\n,]+/)
      .map(u => u.trim())
      .filter(Boolean);
    if (splitUrls.length > 0) {
      const newItems = splitUrls.map(u => ({ src: u, span: 1, connectNext: false }));
      setCurrentList(prev => [...prev, ...newItems]);
      setUrlInput('');
    }
  }

  function setItemSpan(idx, span) {
    setCurrentList(prev => {
      const next = [...prev];
      if (next[idx]) {
        next[idx] = { ...next[idx], span: Number(span) || 1 };
      }
      return next;
    });
  }

  function toggleConnectNext(idx) {
    setCurrentList(prev => {
      const next = [...prev];
      if (next[idx]) {
        next[idx] = { ...next[idx], connectNext: !next[idx].connectNext };
      }
      return next;
    });
  }

  // Quick helper: Merge sets of 3 consecutive images into seamless panorama groups
  function mergeSetsOf3() {
    setCurrentList(prev =>
      prev.map((item, idx) => ({
        ...item,
        connectNext: idx % 3 !== 2 && idx < prev.length - 1,
      }))
    );
  }

  // Quick helper: Merge sets of 2 consecutive images
  function mergeSetsOf2() {
    setCurrentList(prev =>
      prev.map((item, idx) => ({
        ...item,
        connectNext: idx % 2 === 0 && idx < prev.length - 1,
      }))
    );
  }

  // Reset all connections
  function disconnectAll() {
    setCurrentList(prev =>
      prev.map(item => ({
        ...item,
        connectNext: false,
      }))
    );
  }

  function removeItem(idx) {
    setCurrentList(prev => prev.filter((_, i) => i !== idx));
  }

  function move(idx, dir) {
    setCurrentList(prev => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  }

  async function handleSave(e) {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      // Save all 3 rows simultaneously so no changes from any tab are lost
      await Promise.all([
        saveGallery({ images: mainImages }),
        saveVideoGallery({ videos: videoList }),
        saveFeedbackGallery({ images: feedbackImages }),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      console.error('Error saving gallery:', err);
      alert('Error saving gallery data. Please check connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="admin-empty">Loading gallery data...</div>;

  return (
    <>
      <div className="admin-breadcrumb">
        <Link href="/admin">Dashboard</Link> / Gallery
      </div>

      {/* ─── Gallery Tabs ─── */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => { setActiveTab('main'); setUrlInput(''); }}
            className={`admin-btn ${activeTab === 'main' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            style={{ padding: '0.65rem 1.3rem', borderRadius: '10px', fontSize: '0.88rem' }}
          >
            📷 Row 1: Company Banners ({mainImages.length})
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('videos'); setUrlInput(''); }}
            className={`admin-btn ${activeTab === 'videos' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            style={{ padding: '0.65rem 1.3rem', borderRadius: '10px', fontSize: '0.88rem' }}
          >
            🎥 Row 2: Video Highlights ({videoList.length})
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('feedback'); setUrlInput(''); }}
            className={`admin-btn ${activeTab === 'feedback' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            style={{ padding: '0.65rem 1.3rem', borderRadius: '10px', fontSize: '0.88rem' }}
          >
            💬 Row 3: Customer Feedbacks ({feedbackImages.length})
          </button>
        </div>

        {/* Global Save Button in Header */}
        <button
          type="button"
          onClick={handleSave}
          className="admin-btn admin-btn-primary"
          disabled={saving || uploading}
          style={{ minWidth: '180px' }}
        >
          {saving ? 'Saving All Rows...' : '💾 Save All 3 Rows'}
        </button>
      </div>

      <form onSubmit={handleSave}>
        <div className="admin-card">
          <div className="admin-card-head">
            <h2>
              {activeTab === 'main' && 'Gallery Row 1 — Company Banners & Updates'}
              {activeTab === 'videos' && 'Gallery Row 2 — Video Reels & Highlights'}
              {activeTab === 'feedback' && 'Gallery Row 3 — Customer Feedbacks & Reviews'}
            </h2>
            <span style={{ fontSize: '.82rem', color: '#5a627d' }}>
              {currentList.length} {activeTab === 'videos' ? 'video' : 'image'}{currentList.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p style={{ fontSize: '.85rem', color: '#5a627d', marginBottom: '0.8rem' }}>
            {activeTab === 'main' && 'These banner images appear in Row 1 of the scrolling strip on the Home page and About page.'}
            {activeTab === 'videos' && 'These video clips appear in the middle Row 2 of the Home page gallery with autoplay reels.'}
            {activeTab === 'feedback' && 'These customer feedback images appear in Row 3 of the scrolling gallery on the Home page.'}
          </p>

          {/* Merge 3 / Multi-Image Panorama Toolbar */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(37,99,235,0.08))',
              border: '1.5px solid rgba(16,185,129,0.25)',
              borderRadius: '12px',
              padding: '0.85rem 1.1rem',
              marginBottom: '1.4rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.25rem' }}>🔗</span>
                <div>
                  <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>
                    Multi-Image Seamless Merge (Panorama Slices):
                  </strong>
                  <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                    Click <strong>🔗 Merge with Next</strong> on any card to attach 2 or 3 separate images together with <strong>0px gap</strong> seamlessly!
                  </div>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={mergeSetsOf3}
                  className="admin-btn admin-btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', background: '#ecfdf5', borderColor: '#10b981', color: '#065f46' }}
                  title="Connect images in groups of 3 (Card 1+2+3, Card 4+5+6, etc.)"
                >
                  🔗 Merge in Sets of 3 (Panorama)
                </button>
                <button
                  type="button"
                  onClick={mergeSetsOf2}
                  className="admin-btn admin-btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', background: '#eff6ff', borderColor: '#3b82f6', color: '#1e40af' }}
                  title="Connect images in pairs of 2 (Card 1+2, Card 3+4, etc.)"
                >
                  🔗 Merge in Pairs of 2
                </button>
                <button
                  type="button"
                  onClick={disconnectAll}
                  className="admin-btn admin-btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                >
                  ✂️ Separate All
                </button>
              </div>
            </div>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept={activeTab === 'videos' ? 'video/mp4,video/webm,video/quicktime,video/m4v,video/*' : 'image/*'}
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
              {uploading
                ? uploadProgress || 'Uploading...'
                : activeTab === 'videos'
                ? '+ Upload Videos (MP4/WebM)'
                : '+ Upload Images'}
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
              placeholder={activeTab === 'videos' ? 'or paste direct video URL (.mp4)...' : 'or paste image URL(s)...'}
              style={{ flex: 1, minWidth: '240px' }}
            />
            <button type="button" className="admin-btn admin-btn-secondary" onClick={addUrl}>
              Add URL
            </button>
          </div>

          {currentList.length === 0 ? (
            <div className="admin-empty">
              No {activeTab === 'videos' ? 'videos' : 'images'} in this row yet — click Upload above or add URLs to get started.
            </div>
          ) : (
            <div className="admin-gallery-grid">
              {currentList.map((item, idx) => (
                <div
                  className={`admin-gallery-item ${item.connectNext ? 'connected-to-next' : ''} ${item.span === 2 ? 'admin-gallery-span-2' : item.span === 3 ? 'admin-gallery-span-3' : ''}`}
                  key={`${item.src}-${idx}`}
                >
                  <div className="admin-gallery-top-controls">
                    <span className="admin-gallery-num">#{idx + 1}</span>

                    {/* Merge with Next Button */}
                    <button
                      type="button"
                      className={`admin-gallery-connect-btn ${item.connectNext ? 'active' : ''}`}
                      onClick={() => toggleConnectNext(idx)}
                      title={item.connectNext ? 'Currently connected to next image with 0px gap. Click to disconnect.' : 'Connect seamlessly with next image (0px gap)'}
                    >
                      {item.connectNext ? `🔗 Merged with #${idx + 2}` : '🔗 Merge Next'}
                    </button>
                  </div>

                  {activeTab === 'videos' ? (
                    <video
                      src={item.src || ''}
                      poster={getVideoPosterUrl(item.src) || undefined}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      onMouseEnter={e => e.currentTarget.play().catch(() => {})}
                      onMouseLeave={e => e.currentTarget.pause()}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', background: '#050b26' }}
                    />
                  ) : (
                    <img src={item.src} alt={`Gallery ${idx + 1}`} />
                  )}

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
                      disabled={idx === currentList.length - 1}
                      title="Move later"
                    >
                      ›
                    </button>
                    <button
                      type="button"
                      className="del"
                      onClick={() => removeItem(idx)}
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

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1.5rem' }}>
          <button type="submit" className="admin-btn admin-btn-primary" disabled={saving || uploading} style={{ minWidth: '200px' }}>
            {uploading
              ? uploadProgress || 'Uploading…'
              : saving
              ? 'Saving All Rows...'
              : '💾 Save All 3 Rows to Site'}
          </button>
          {saved && (
            <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '.92rem' }}>
              ✓ All 3 gallery rows saved successfully!
            </span>
          )}
        </div>
      </form>
    </>
  );
}
