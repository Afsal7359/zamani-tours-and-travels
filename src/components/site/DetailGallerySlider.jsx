'use client';
import { useState, useEffect, useRef } from 'react';
import ReelModal from '@/components/site/ReelModal';
import PhotoReelModal from '@/components/site/PhotoReelModal';
import { isVideoUrl, getVideoPosterUrl, getOptimizedVideoUrl } from '@/lib/videoUtils';
import { getAdaptiveVideoUrl } from '@/lib/performanceGuardian';

export default function DetailGallerySlider({ images = [], title = 'Gallery' }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedReelIndex, setSelectedReelIndex] = useState(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const thumbsRef = useRef(null);

  const cleanMedia = images.filter(Boolean);

  // Pre-cache all gallery media into browser cache on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !cleanMedia.length) return;
    cleanMedia.forEach(url => {
      if (!isVideoUrl(url)) {
        const img = new Image();
        img.src = url;
      }
    });
  }, [cleanMedia]);

  // Auto slide every 4.5 seconds when not hovered and active item is not a video
  useEffect(() => {
    if (cleanMedia.length <= 1 || isHovered) return;
    const currentItem = cleanMedia[activeIdx];
    if (isVideoUrl(currentItem)) return; // don't auto-slide away while video is playing

    const timer = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % cleanMedia.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [cleanMedia.length, isHovered, activeIdx, cleanMedia]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (!thumbsRef.current) return;
    const activeThumb = thumbsRef.current.children[activeIdx];
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeIdx]);

  if (cleanMedia.length === 0) return null;

  const handlePrev = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    setActiveIdx(prev => (prev === 0 ? cleanMedia.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    setActiveIdx(prev => (prev + 1) % cleanMedia.length);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  const handleItemClick = (idx) => {
    const item = cleanMedia[idx];
    if (isVideoUrl(item)) {
      // Find index in video list
      const videoItems = cleanMedia.filter(isVideoUrl);
      const vIdx = videoItems.indexOf(item);
      setSelectedReelIndex(vIdx >= 0 ? vIdx : 0);
    } else {
      // Find index in photo list
      const photoItems = cleanMedia.filter(m => !isVideoUrl(m));
      const pIdx = photoItems.indexOf(item);
      setSelectedPhotoIndex(pIdx >= 0 ? pIdx : 0);
    }
  };

  const videoList = cleanMedia.filter(isVideoUrl);
  const photoList = cleanMedia.filter(m => !isVideoUrl(m));

  return (
    <div className="svc-detail-gallery reveal">
      <div className="svc-gallery-header">
        <h3>Media Gallery</h3>
        {cleanMedia.length > 1 && (
          <span className="svc-gallery-badge">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {activeIdx + 1} / {cleanMedia.length}
          </span>
        )}
      </div>

      {/* Main Slider Viewport */}
      <div
        className="svc-gallery-main"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: 'pointer', position: 'relative' }}
      >
        <div
          className="svc-gallery-track"
          style={{ transform: `translate3d(-${activeIdx * 100}%, 0, 0)` }}
        >
          {cleanMedia.map((mediaUrl, i) => {
            const isVid = isVideoUrl(mediaUrl);
            const isActive = activeIdx === i;
            return (
              <div
                className="svc-gallery-slide"
                key={i}
                onClick={() => handleItemClick(i)}
                style={{ position: 'relative', overflow: 'hidden' }}
              >
                {isVid ? (
                  <>
                    <video
                      ref={(el) => {
                        if (el) {
                          if (isActive) {
                            const p = el.play();
                            if (p !== undefined) p.catch(() => {});
                          } else {
                            el.pause();
                          }
                        }
                      }}
                      src={mediaUrl ? getAdaptiveVideoUrl(mediaUrl, 'reel') : ''}
                      poster={getVideoPosterUrl(mediaUrl) || undefined}
                      autoPlay={isActive}
                      muted
                      loop
                      playsInline
                      webkit-playsinline="true"
                      x5-playsinline="true"
                      preload={isActive ? 'auto' : 'metadata'}
                      onError={(e) => {
                        if (e.currentTarget.src !== mediaUrl && mediaUrl) {
                          e.currentTarget.src = mediaUrl;
                          if (isActive) e.currentTarget.play().catch(() => {});
                        }
                      }}
                      className="svc-gallery-video-element"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#050b26' }}
                    />
                    <div className="svc-gallery-video-overlay">
                      <div className="svc-gallery-play-btn">
                        <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                      <span className="svc-gallery-fullscreen-tag">✦ Watch Full Reel</span>
                    </div>
                  </>
                ) : (
                  <>
                    <img src={mediaUrl} alt={`${title} ${i + 1}`} loading="eager" decoding="async" />
                    <div className="svc-gallery-photo-overlay">
                      <span className="svc-gallery-fullscreen-tag">
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}>
                          <polyline points="15 3 21 3 21 9"/>
                          <polyline points="9 21 3 21 3 15"/>
                          <line x1="21" y1="3" x2="14" y2="10"/>
                          <line x1="3" y1="21" x2="10" y2="14"/>
                        </svg>
                        View Full Screen
                      </span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {cleanMedia.length > 1 && (
          <>
            <button
              type="button"
              className="svc-gallery-nav svc-gallery-nav-prev"
              onClick={handlePrev}
              aria-label="Previous item"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              className="svc-gallery-nav svc-gallery-nav-next"
              onClick={handleNext}
              aria-label="Next item"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Row */}
      {cleanMedia.length > 1 && (
        <div className="svc-gallery-thumbs" ref={thumbsRef}>
          {cleanMedia.map((mediaUrl, i) => {
            const isVid = isVideoUrl(mediaUrl);
            return (
              <button
                key={i}
                type="button"
                className={`svc-gallery-thumb${activeIdx === i ? ' active' : ''}`}
                onClick={() => setActiveIdx(i)}
                aria-label={`View item ${i + 1}`}
                style={{ position: 'relative' }}
              >
                {isVid ? (
                  <>
                    <video
                      src={mediaUrl}
                      muted
                      preload="metadata"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff'
                    }}>
                      <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </>
                ) : (
                  <img src={mediaUrl} alt={`${title} thumbnail ${i + 1}`} />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Full-Screen Video Reel Modal */}
      {selectedReelIndex !== null && videoList.length > 0 && (
        <ReelModal
          videos={videoList}
          initialIndex={selectedReelIndex}
          onClose={() => setSelectedReelIndex(null)}
        />
      )}

      {/* Full-Screen Photo Reel Modal */}
      {selectedPhotoIndex !== null && photoList.length > 0 && (
        <PhotoReelModal
          photos={photoList}
          initialIndex={selectedPhotoIndex}
          categoryTitle={`${title} Gallery`}
          onClose={() => setSelectedPhotoIndex(null)}
        />
      )}
    </div>
  );
}
