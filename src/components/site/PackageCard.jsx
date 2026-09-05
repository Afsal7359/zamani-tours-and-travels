'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getOptimizedImageUrl } from '@/lib/videoUtils';

export default function PackageCard({ pkg, index = 0, className = '' }) {
  const itineraryImages = Array.isArray(pkg.itinerary)
    ? pkg.itinerary.map(item => item?.image).filter(Boolean)
    : [];
  const images = Array.from(new Set([pkg.image, ...(pkg.images || []), ...itineraryImages])).filter(Boolean);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Pre-cache first images into memory
  useEffect(() => {
    if (typeof window === 'undefined' || !images.length) return;
    images.slice(0, 2).forEach(src => {
      const img = new Image();
      img.src = getOptimizedImageUrl(src, 600);
    });
  }, [images]);

  // Auto-slide every 5 seconds when card has multiple photos and user is not hovering
  useEffect(() => {
    if (images.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length, isHovered]);

  const handlePrev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIdx(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIdx(prev => (prev + 1) % images.length);
  };

  const handleDotClick = (e, idx) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIdx(idx);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 35) {
      if (diff > 0) {
        // swipe left -> next
        setCurrentIdx(prev => (prev + 1) % images.length);
      } else {
        // swipe right -> prev
        setCurrentIdx(prev => (prev === 0 ? images.length - 1 : prev - 1));
      }
    }
  };

  return (
    <Link
      href={`/packages/${pkg.slug || pkg.id}`}
      className={`pkg-card ${className}`.trim()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="pkg-img pkg-img-slider"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {images.length > 0 ? (
          <div
            className="pkg-slider-track"
            style={{ transform: `translate3d(-${currentIdx * 100}%, 0, 0)` }}
          >
            {images.map((src, idx) => (
              <div className="pkg-slider-slide" key={idx}>
                <img src={getOptimizedImageUrl(src, 600)} alt={`${pkg.title} - ${idx + 1}`} loading={idx === 0 ? "eager" : "lazy"} decoding="async" />
              </div>
            ))}
          </div>
        ) : (
          <div className="pkg-slider-track">
            <div className="pkg-slider-slide">
              <div className="pkg-img-placeholder" />
            </div>
          </div>
        )}

        {/* Badges */}
        {pkg.badge && <span className="pkg-badge">{pkg.badge}</span>}
        {pkg.duration && <span className="pkg-duration">{pkg.duration}</span>}

        {/* Multiple image controls */}
        {images.length > 1 && (
          <>
            {/* Prev / Next Arrows */}
            <button
              type="button"
              className="pkg-slider-btn pkg-slider-btn-prev"
              onClick={handlePrev}
              aria-label="Previous image"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              className="pkg-slider-btn pkg-slider-btn-next"
              onClick={handleNext}
              aria-label="Next image"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Indicator dots */}
            <div className="pkg-slider-dots">
              {images.map((_, idx) => (
                <button
                  type="button"
                  key={idx}
                  className={`pkg-slider-dot ${idx === currentIdx ? 'active' : ''}`}
                  onClick={(e) => handleDotClick(e, idx)}
                  aria-label={`Go to image ${idx + 1}`}
                />
              ))}
            </div>

            {/* Photo count indicator */}
            <span className="pkg-slider-count">
              <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {currentIdx + 1}/{images.length}
            </span>
          </>
        )}
      </div>

      <div className="pkg-body">
        {pkg.location && (
          <span className="pkg-location">
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {pkg.location}
          </span>
        )}
        <h3>{pkg.title}</h3>
        <p>{pkg.description}</p>
        <div className="pkg-tags">
          {(pkg.tags || []).slice(0, 3).map((tag, ti) => (
            <span key={ti}>{tag}</span>
          ))}
        </div>
        <div className="pkg-card-foot">
          <div className="pkg-price">
            {pkg.price && <strong>{pkg.price}</strong>}
            {pkg.priceNote && <small>{pkg.priceNote}</small>}
          </div>
          <span className="pkg-view">
            View Details
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
