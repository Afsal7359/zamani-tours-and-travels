'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
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
import { getVideoPosterUrl, isVideoUrl } from '@/lib/videoUtils';

function normalizeItems(list = []) {
  if (!Array.isArray(list)) return [];
  return list
    .map(item => {
      let raw = '';
      let span = 1;
      let connectNext = false;
      if (typeof item === 'string') {
        raw = item.trim();
      } else if (item && typeof item === 'object') {
        raw = (item.src || item.url || '').trim();
        span = [1, 2, 3].includes(Number(item.span)) ? Number(item.span) : 1;
        connectNext = Boolean(item.connectNext);
      }
      if (!raw) return null;

      // Filter out 403-dead mixkit preview URLs
      if (raw.includes('mixkit.co')) {
        return null;
      }

      const localMatch = raw.match(/\/images\/gallery-(\d+)\.jpe?g$/i);
      if (localMatch) {
        const num = parseInt(localMatch[1], 10);
        if (num > 17 || num < 1) {
          const wrapped = ((Math.max(1, num) - 1) % 17) + 1;
          raw = `/images/gallery-${String(wrapped).padStart(2, '0')}.jpeg`;
        }
      }
      return { src: raw, span, connectNext };
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const fileRef = useRef();

  // Keep live refs to avoid stale closures in async upload handlers
  const mainImagesRef = useRef(mainImages);
  const videoListRef = useRef(videoList);
  const feedbackImagesRef = useRef(feedbackImages);
  const activeTabRef = useRef(activeTab);

  useEffect(() => {
    mainImagesRef.current = mainImages;
  }, [mainImages]);

  useEffect(() => {
    videoListRef.current = videoList;
  }, [videoList]);

  useEffect(() => {
    feedbackImagesRef.current = feedbackImages;
  }, [feedbackImages]);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      // Always fetch fresh data directly from Firestore (bypassing stale cache)
      const results = await Promise.allSettled([
        getGallery(true),
        getVideoGallery(true),
        getFeedbackGallery(true),
      ]);
      const [gRes, vRes, fgRes] = results;
      const gData = gRes.status === 'fulfilled' ? gRes.value : null;
      const vData = vRes.status === 'fulfilled' ? vRes.value : null;
      const fgData = fgRes.status === 'fulfilled' ? fgRes.value : null;

      setMainImages(Array.isArray(gData?.images) ? normalizeItems(gData.images) : normalizeItems(defaultGallery.images));
      setVideoList(Array.isArray(vData?.videos) ? normalizeItems(vData.videos) : normalizeItems(defaultVideoGallery.videos));
      setFeedbackImages(Array.isArray(fgData?.images) ? normalizeItems(fgData.images) : normalizeItems(defaultFeedbackGallery.images));
      setHasUnsavedChanges(false);
    } catch (e) {
      console.error('Error fetching gallery data:', e);
      setMainImages(normalizeItems(defaultGallery.images));
      setVideoList(normalizeItems(defaultVideoGallery.videos));
      setFeedbackImages(normalizeItems(defaultFeedbackGallery.images));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const currentList =
    activeTab === 'main'
      ? mainImages
      : activeTab === 'videos'
      ? videoList
      : feedbackImages;

  const updateCurrentList = (updater) => {
    setHasUnsavedChanges(true);
    if (activeTab === 'main') {
      setMainImages(updater);
    } else if (activeTab === 'videos') {
      setVideoList(updater);
    } else {
      setFeedbackImages(updater);
    }
  };

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
        const currentTab = activeTabRef.current;
        if (currentTab === 'main') {
          const updated = [...mainImagesRef.current, ...newItems];
          setMainImages(updated);
          await saveGallery({ images: updated });
        } else if (currentTab === 'videos') {
          const updated = [...videoListRef.current, ...newItems];
          setVideoList(updated);
          await saveVideoGallery({ videos: updated });
        } else {
          const updated = [...feedbackImagesRef.current, ...newItems];
          setFeedbackImages(updated);
          await saveFeedbackGallery({ images: updated });
        }

        setSaved(true);
        setHasUnsavedChanges(false);
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
    const splitUrls = raw
      .split(/[\n,]+/)
      .map(u => u.trim())
      .filter(Boolean);
    if (splitUrls.length > 0) {
      const newItems = splitUrls.map(u => ({ src: u, span: 1, connectNext: false }));
      updateCurrentList(prev => [...prev, ...newItems]);
      setUrlInput('');
    }
  }

  function toggleConnectNext(idx) {
    updateCurrentList(prev => {
      const next = [...prev];
      if (next[idx]) {
        next[idx] = { ...next[idx], connectNext: !next[idx].connectNext };
      }
      return next;
    });
  }

  function mergeSetsOf3() {
    updateCurrentList(prev =>
      prev.map((item, idx) => ({
        ...item,
        connectNext: idx % 3 !== 2 && idx < prev.length - 1,
      }))
    );
  }

  function mergeSetsOf2() {
    updateCurrentList(prev =>
      prev.map((item, idx) => ({
        ...item,
        connectNext: idx % 2 === 0 && idx < prev.length - 1,
      }))
    );
  }

  function disconnectAll() {
    updateCurrentList(prev =>
      prev.map(item => ({
        ...item,
        connectNext: false,
      }))
    );
  }

  function removeDemoPlaceholders() {
    const isVideo = activeTab === 'videos';
    const rowName =
      activeTab === 'main'
        ? 'Row 1 (Company Banners)'
        : activeTab === 'videos'
        ? 'Row 2 (Video Highlights)'
        : 'Row 3 (Customer Feedbacks)';

    if (!confirm(`Remove sample/demo placeholder items from ${rowName}? Your uploaded custom media will remain.`)) {
      return;
    }

    updateCurrentList(prev =>
      prev.filter(item => {
        const src = item?.src || '';
        if (isVideo) {
          return !src.includes('mixkit.co') && !src.includes('sea_turtle.mp4') && !src.includes('elephants.mp4') && !src.includes('ship.mp4') && !src.includes('dog.mp4');
        }
        return !src.startsWith('/images/gallery-') && !src.includes('unsplash.com');
      })
    );
  }

  function restoreDefaults() {
    const rowName =
      activeTab === 'main'
        ? 'Row 1 (Company Banners)'
        : activeTab === 'videos'
        ? 'Row 2 (Video Highlights)'
        : 'Row 3 (Customer Feedbacks)';

    if (!confirm(`Restore default sample items for ${rowName}?`)) return;

    if (activeTab === 'main') {
      updateCurrentList(() => normalizeItems(defaultGallery.images));
    } else if (activeTab === 'videos') {
      updateCurrentList(() => normalizeItems(defaultVideoGallery.videos));
    } else {
      updateCurrentList(() => normalizeItems(defaultFeedbackGallery.images));
    }
  }

  function clearAll() {
    const rowName =
      activeTab === 'main'
        ? 'Row 1 (Company Banners)'
        : activeTab === 'videos'
        ? 'Row 2 (Video Highlights)'
        : 'Row 3 (Customer Feedbacks)';
    if (!confirm(`Are you sure you want to remove all items from ${rowName}?`)) return;
    updateCurrentList(() => []);
  }

  function removeItem(idx) {
    updateCurrentList(prev => prev.filter((_, i) => i !== idx));
  }

  function move(idx, dir) {
    updateCurrentList(prev => {
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
      await Promise.all([
        saveGallery({ images: mainImages }),
        saveVideoGallery({ videos: videoList }),
        saveFeedbackGallery({ images: feedbackImages }),
      ]);
      setSaved(true);
      setHasUnsavedChanges(false);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      console.error('Error saving gallery:', err);
      alert('Error saving gallery data. Please check connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="admin-empty">Loading gallery data directly from database...</div>;

  return (
    <>
      <div className="admin-breadcrumb">
        <Link href="/admin">Dashboard</Link> / Media &amp; Gallery
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {hasUnsavedChanges && (
            <span style={{ fontSize: '0.82rem', color: '#d97706', fontWeight: 600 }}>
              ● Unsaved changes
            </span>
          )}
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
                    Multi-Image Seamless Merge &amp; Cleanup:
                  </strong>
                  <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                    Connect images with 0px gap, or remove demo placeholders so only your real uploads appear.
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
                  🔗 Merge in 3s
                </button>
                <button
                  type="button"
                  onClick={mergeSetsOf2}
                  className="admin-btn admin-btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', background: '#eff6ff', borderColor: '#3b82f6', color: '#1e40af' }}
                  title="Connect images in pairs of 2 (Card 1+2, Card 3+4, etc.)"
                >
                  🔗 Merge in 2s
                </button>
                <button
                  type="button"
                  onClick={disconnectAll}
                  className="admin-btn admin-btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                >
                  ✂️ Separate All
                </button>
                <button
                  type="button"
                  onClick={removeDemoPlaceholders}
                  className="admin-btn admin-btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem', background: '#fffbeb', borderColor: '#f59e0b', color: '#b45309' }}
                  title="Remove sample/demo placeholder images so only your uploaded files remain"
                >
                  🧹 Remove Demo Items
                </button>
                <button
                  type="button"
                  onClick={restoreDefaults}
                  className="admin-btn admin-btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                  title="Restore default sample images"
                >
                  🔄 Restore Samples
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="admin-btn admin-btn-danger"
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                  title="Remove all items from this row"
                >
                  🗑️ Clear Row
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
                : activeTab === 'feedback'
                ? '+ Upload Customer Feedback Images'
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
              {activeTab === 'feedback'
                ? 'No customer feedback images in this row yet — click "+ Upload Customer Feedback Images" or add image URLs to display them in Row 3 on the home page.'
                : `No ${activeTab === 'videos' ? 'videos' : 'images'} in this row yet — click Upload above or add URLs to get started.`}
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

                  {activeTab === 'videos' || isVideoUrl(item.src) ? (
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
                    <img
                      src={item.src}
                      alt={`Gallery ${idx + 1}`}
                      onError={(e) => {
                        e.currentTarget.style.opacity = '0.5';
                      }}
                    />
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

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <button type="submit" className="admin-btn admin-btn-primary" disabled={saving || uploading} style={{ minWidth: '200px' }}>
            {uploading
              ? uploadProgress || 'Uploading…'
              : saving
              ? 'Saving All Rows...'
              : '💾 Save All 3 Rows to Site'}
          </button>
          {hasUnsavedChanges && (
            <span style={{ color: '#d97706', fontSize: '.88rem', fontWeight: 600 }}>
              ⚠️ You have unsaved changes. Click &quot;Save All 3 Rows&quot; to update the live website.
            </span>
          )}
          {saved && (
            <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '.92rem' }}>
              ✓ All 3 gallery rows saved successfully to database!
            </span>
          )}
        </div>
      </form>
    </>
  );
}
