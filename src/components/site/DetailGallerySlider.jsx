'use client';
import { useState, useEffect, useRef } from 'react';

export default function DetailGallerySlider({ images = [], title = 'Gallery' }) {
  const [activeImg, setActiveImg] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const thumbsRef = useRef(null);

  const cleanImages = images.filter(Boolean);

  // Auto slide every 4 seconds when not hovered
  useEffect(() => {
    if (cleanImages.length <= 1 || isHovered) return;
    const timer = setInterval(() => {
      setActiveImg(prev => (prev + 1) % cleanImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [cleanImages.length, isHovered]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (!thumbsRef.current) return;
    const activeThumb = thumbsRef.current.children[activeImg];
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeImg]);

  if (cleanImages.length === 0) return null;

  const handlePrev = () => {
    setActiveImg(prev => (prev === 0 ? cleanImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveImg(prev => (prev + 1) % cleanImages.length);
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

  return (
    <div className="svc-detail-gallery reveal">
      <div className="svc-gallery-header">
        <h3>Gallery</h3>
        {cleanImages.length > 1 && (
          <span className="svc-gallery-badge">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {activeImg + 1} / {cleanImages.length}
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
      >
        <div
          className="svc-gallery-track"
          style={{ transform: `translateX(-${activeImg * 100}%)` }}
        >
          {cleanImages.map((img, i) => (
            <div className="svc-gallery-slide" key={i}>
              <img src={img} alt={`${title} ${i + 1}`} loading="lazy" />
            </div>
          ))}
        </div>

        {cleanImages.length > 1 && (
          <>
            <button
              type="button"
              className="svc-gallery-nav svc-gallery-nav-prev"
              onClick={handlePrev}
              aria-label="Previous photo"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              className="svc-gallery-nav svc-gallery-nav-next"
              onClick={handleNext}
              aria-label="Next photo"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Row */}
      {cleanImages.length > 1 && (
        <div className="svc-gallery-thumbs" ref={thumbsRef}>
          {cleanImages.map((img, i) => (
            <button
              key={i}
              type="button"
              className={`svc-gallery-thumb${activeImg === i ? ' active' : ''}`}
              onClick={() => setActiveImg(i)}
              aria-label={`View photo ${i + 1}`}
            >
              <img src={img} alt={`${title} thumbnail ${i + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
