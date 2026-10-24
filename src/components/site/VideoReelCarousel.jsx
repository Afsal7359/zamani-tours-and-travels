'use client';

import React, { useRef, useState, useEffect, useCallback, memo } from 'react';
import {
  parseYouTubeUrl,
  isYouTubeUrl,
  isVideoUrl,
  getVideoPosterUrl,
  getOptimizedImageUrl,
} from '@/lib/videoUtils';

/**
 * High-performance, ultra-smooth Horizontal Video Reel Carousel
 * - Horizontal scrolling row of video thumbnails/cards
 * - Pause on hover
 * - Drag-to-scroll support with distinction between drag & click
 * - Left/Right navigation buttons
 * - Instant mouse-click opening of ReelModal
 */
const VideoCard = memo(function VideoCard({
  item,
  index,
  onCardClick,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const pointerStartRef = useRef({ x: 0, y: 0, time: 0 });
  const rawSrc = item.src || item.rawSrc || '';
  const isYt = isYouTubeUrl(rawSrc);
  const ytInfo = isYt ? parseYouTubeUrl(rawSrc) : null;

  // Determine thumbnail
  let poster = '';
  if (isYt && ytInfo) {
    poster = ytInfo.maxResPosterUrl || ytInfo.posterUrl;
  } else {
    poster = getVideoPosterUrl(rawSrc) || getOptimizedImageUrl(rawSrc, 700);
  }

  const handlePointerDown = (e) => {
    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: performance.now(),
    };
  };

  const handleClick = (e) => {
    e.stopPropagation();
    const dx = Math.abs(e.clientX - pointerStartRef.current.x);
    const dy = Math.abs(e.clientY - pointerStartRef.current.y);
    const dt = performance.now() - pointerStartRef.current.time;

    // Movement < 10px and duration < 800ms is a genuine click/tap
    if (dx < 10 && dy < 10 && dt < 800) {
      onCardClick(index);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={`video-reel-card ${isHovered ? 'hovered' : ''}`}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onCardClick(index);
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={`Play Video Reel ${index + 1}`}
    >
      {/* Background Poster Image */}
      <div className="video-reel-media-wrapper">
        {poster ? (
          <img
            src={poster}
            alt={item.title || `Travel Highlight ${index + 1}`}
            className="video-reel-poster"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              if (isYt && ytInfo?.posterUrl && e.currentTarget.src !== ytInfo.posterUrl) {
                e.currentTarget.src = ytInfo.posterUrl;
              } else {
                e.currentTarget.style.opacity = '0.7';
              }
            }}
          />
        ) : (
          <div className="video-reel-placeholder">
            <span className="placeholder-icon">🎬</span>
          </div>
        )}

        {/* Video Type Badge */}
        <div className="video-reel-badge">
          <span className="badge-dot" />
          <span>{isYt ? 'YOUTUBE REEL' : 'VIDEO REEL'}</span>
        </div>

        {/* Center Play Button Overlay */}
        <div className="video-reel-play-btn" aria-hidden="true">
          <div className="play-btn-circle">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Bottom Gradient & Info */}
        <div className="video-reel-info-bar">
          <span className="video-reel-tag">
            {isYt ? 'YouTube Short' : 'Highlights'}
          </span>
          <h4 className="video-reel-title">
            {item.title || `Highlight #${index + 1}`}
          </h4>
        </div>

        {/* Subtle shine highlight */}
        <div className="video-reel-glow-overlay" />
      </div>
    </div>
  );
});

export default function VideoReelCarousel({
  videos = [],
  onSelect,
  title = 'Video Highlights & Reels',
  subtitle = 'Real glimpses of our tours, destinations & experiences',
}) {
  const trackRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const isHoveredRef = useRef(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Check scroll position to update arrows
  const checkScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, videos]);

  // Smooth gentle auto-scroll when not hovered
  useEffect(() => {
    let animId;
    let lastTime = performance.now();

    const scrollLoop = (time) => {
      const dt = time - lastTime;
      lastTime = time;

      const el = trackRef.current;
      if (el && !isHoveredRef.current && !isDraggingRef.current) {
        // Scroll 28px per second gently
        const step = (28 * dt) / 1000;
        el.scrollLeft += step;

        // Loop smoothly when reached the end
        if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 2) {
          el.scrollLeft = 0;
        }
      }

      animId = requestAnimationFrame(scrollLoop);
    };

    animId = requestAnimationFrame(scrollLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Arrow navigation
  const scrollByAmount = (amount) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  // Drag-to-scroll handlers
  const handleMouseDown = (e) => {
    const el = trackRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    const el = trackRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    el.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  if (!videos || videos.length === 0) return null;

  return (
    <section className="video-reel-carousel-container" aria-label="Video Highlights and Reels Carousel">
      {/* Header with Title, Badge & Navigation Arrows */}
      <div className="video-reel-header">
        <div className="video-reel-header-text">
          <div className="video-reel-badge-pill">
            <span className="badge-live-pulse" />
            <span className="badge-pill-text">{title}</span>
          </div>
          <p className="video-reel-subtitle">{subtitle}</p>
        </div>

        {/* Carousel Navigation Arrows */}
        <div className="video-reel-nav-buttons">
          <button
            type="button"
            className="video-reel-nav-btn prev"
            onClick={() => scrollByAmount(-340)}
            disabled={!canScrollLeft}
            aria-label="Scroll Left"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            className="video-reel-nav-btn next"
            onClick={() => scrollByAmount(340)}
            disabled={!canScrollRight}
            aria-label="Scroll Right"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Horizontal Scrolling Video Track */}
      <div className="video-reel-track-wrapper">
        {/* Left edge shadow mask */}
        <div className={`video-reel-mask-left ${canScrollLeft ? 'visible' : ''}`} />

        <div
          ref={trackRef}
          className="video-reel-track"
          onMouseEnter={() => { isHoveredRef.current = true; }}
          onMouseLeave={() => { isHoveredRef.current = false; handleMouseUpOrLeave(); }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
        >
          {videos.map((item, idx) => (
            <VideoCard
              key={idx}
              item={item}
              index={idx}
              onCardClick={onSelect}
            />
          ))}
        </div>

        {/* Right edge shadow mask */}
        <div className={`video-reel-mask-right ${canScrollRight ? 'visible' : ''}`} />
      </div>
    </section>
  );
}
