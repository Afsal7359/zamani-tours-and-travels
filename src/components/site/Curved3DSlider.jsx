'use client';
import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { getVideoPosterUrl } from '@/lib/videoUtils';
import { getAdaptiveVideoUrl } from '@/lib/performanceGuardian';

/**
 * Curved3DSlider
 * Ultra-smooth, zero-lag 3D curved perspective carousel.
 * Arranges cards in a 3D cylindrical arc with hardware-accelerated transforms.
 * Features:
 * - 60/120 FPS requestAnimationFrame with direct DOM transforms (no React re-render lag)
 * - Inertial touch/mouse drag with momentum decay
 * - Pauses on hover; auto-scrolls smoothly with configurable direction & speed
 * - Selective video playback: only active front video decodes frames to prevent GPU lag
 * - Instant click detection vs drag detection to open Reel / Photo modals
 * - Fully responsive on Mobile, Tablet & Desktop via ResizeObserver
 * - Auto-pauses when scrolled out of view via IntersectionObserver
 */
export default memo(function Curved3DSlider({
  items = [],
  isVideo = false,
  direction = 'left', // 'left' or 'right'
  speed = 0.038, // base angular speed (deg/frame)
  onSelect,
  badgeText = '',
  badgeIcon = null,
  badgeColor = '',
  rowTitle = '',
  rowSubtitle = '',
}) {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const cardRefs = useRef([]);
  const videoRefs = useRef([]);

  // Responsive dimensions cache (measured only on resize)
  const dimsRef = useRef({
    width: 1200,
    radius: 1200,
    cardWidth: 240,
    cardHeight: 330,
    stageHeight: 390,
    maxVisibleAngle: 62,
    arcSpacing: 22,
  });

  // Animation & Physics state (stored in refs to eliminate React re-render overhead)
  const angleRef = useRef(0);
  const velocityRef = useRef(0);
  const isPointerDownRef = useRef(false);
  const startXRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const dragDistanceRef = useRef(0);
  const isHoveredRef = useRef(false);
  const isInViewRef = useRef(true);
  const rafIdRef = useRef(null);
  const baseSpeedRef = useRef(direction === 'right' ? speed : -speed);

  // Re-sync speed if props change
  useEffect(() => {
    baseSpeedRef.current = direction === 'right' ? Math.abs(speed) : -Math.abs(speed);
  }, [direction, speed]);

  // Clean items array
  const cleanItems = items.filter(Boolean);
  const originalLength = cleanItems.length;

  // Duplicate items to form a dense circular ring with at least 14-18 cards
  const targetSlots = Math.max(14, originalLength);
  const repeatCount = originalLength > 0 ? Math.ceil(targetSlots / originalLength) : 1;
  const ringItems = [];
  for (let r = 0; r < repeatCount; r++) {
    for (let i = 0; i < originalLength; i++) {
      ringItems.push({
        ...cleanItems[i],
        originalIndex: i,
        slotIndex: ringItems.length,
      });
    }
  }
  const totalSlots = ringItems.length;

  // Measure container and adapt 3D radius & card sizes
  const updateDimensions = useCallback(() => {
    if (!containerRef.current) return;
    const w = containerRef.current.clientWidth || window.innerWidth;
    let cardW, cardH, radius, stageH, maxAngle;

    if (w < 480) {
      // Mobile Small
      cardW = 160;
      cardH = 225;
      radius = 520;
      stageH = 280;
      maxAngle = 54;
    } else if (w < 768) {
      // Mobile / Phablet
      cardW = 185;
      cardH = 260;
      radius = 680;
      stageH = 320;
      maxAngle = 56;
    } else if (w < 1024) {
      // Tablet
      cardW = 215;
      cardH = 295;
      radius = 920;
      stageH = 360;
      maxAngle = 60;
    } else {
      // Desktop
      cardW = 245;
      cardH = 335;
      radius = 1250;
      stageH = 410;
      maxAngle = 64;
    }

    const arcSpacing = totalSlots > 0 ? 360 / totalSlots : 22;

    dimsRef.current = {
      width: w,
      radius,
      cardWidth: cardW,
      cardHeight: cardH,
      stageHeight: stageH,
      maxVisibleAngle: maxAngle,
      arcSpacing,
    };

    // Apply height to stage directly
    if (stageRef.current) {
      stageRef.current.style.height = `${stageH}px`;
    }
  }, [totalSlots]);

  // Set up ResizeObserver
  useEffect(() => {
    updateDimensions();
    const ro = new ResizeObserver(() => {
      updateDimensions();
    });
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', updateDimensions);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, [updateDimensions]);

  // Set up IntersectionObserver to pause loop when scrolled out of view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        isInViewRef.current = entry.isIntersecting;
      },
      { rootMargin: '150px 0px 150px 0px', threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Main 60/120 FPS Transform & Physics Loop
  useEffect(() => {
    if (totalSlots === 0) return;

    let activeCenterIndex = -1;

    const render = () => {
      // If out of view, sleep this frame
      if (!isInViewRef.current) {
        rafIdRef.current = requestAnimationFrame(render);
        return;
      }

      // Physics update
      if (isPointerDownRef.current) {
        // Pointer is actively dragging; angle driven by pointer event
      } else {
        if (Math.abs(velocityRef.current) > 0.002) {
          angleRef.current += velocityRef.current;
          velocityRef.current *= 0.94; // inertia decay
        } else if (!isHoveredRef.current) {
          angleRef.current += baseSpeedRef.current;
        }
      }

      const { radius, cardWidth, cardHeight, maxVisibleAngle, arcSpacing } = dimsRef.current;
      const currentAngle = angleRef.current;
      const degToRad = Math.PI / 180;

      let closestToCenterDist = 999;
      let closestCardIndex = -1;

      // Update cards in 3D arc
      for (let i = 0; i < totalSlots; i++) {
        const cardEl = cardRefs.current[i];
        if (!cardEl) continue;

        // Base angle for slot i
        const baseSlotAngle = i * arcSpacing;
        // Compute relative angle to center [ -180, +180 ]
        let theta = ((baseSlotAngle + currentAngle) % 360 + 540) % 360 - 180;

        const absTheta = Math.abs(theta);

        // Track closest card to center
        if (absTheta < closestToCenterDist) {
          closestToCenterDist = absTheta;
          closestCardIndex = i;
        }

        // Culling: offscreen / back arc cards
        if (absTheta > maxVisibleAngle) {
          if (cardEl.style.visibility !== 'hidden') {
            cardEl.style.visibility = 'hidden';
            cardEl.style.pointerEvents = 'none';
          }
          continue;
        }

        // Visible card: Compute 3D Cylindrical Coordinates
        const thetaRad = theta * degToRad;
        // X along screen horizontal
        const x = radius * Math.sin(thetaRad);
        // Z pushes back into the screen (0 at front apex)
        const z = radius * (Math.cos(thetaRad) - 1);
        // rotateY points inward towards center (negative of angle)
        const rotY = -theta;

        // Subtle scale & brightness curves for realistic 3D lighting depth
        const progress = absTheta / maxVisibleAngle; // 0 (center) to 1 (edge)
        const scale = 1 - 0.08 * progress * progress;
        const brightness = (1 - 0.22 * progress).toFixed(3);
        const opacity = progress > 0.85 ? Math.max(0, (1 - progress) / 0.15).toFixed(3) : '1';
        const zIndex = Math.round(1000 - absTheta * 10);

        // Apply fast GPU-composited transform directly to DOM
        cardEl.style.width = `${cardWidth}px`;
        cardEl.style.height = `${cardHeight}px`;
        cardEl.style.transform = `translate3d(calc(-50% + ${x.toFixed(2)}px), -50%, ${z.toFixed(2)}px) rotateY(${rotY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        cardEl.style.filter = `brightness(${brightness})`;
        cardEl.style.opacity = opacity;
        cardEl.style.zIndex = zIndex;
        if (cardEl.style.visibility !== 'visible') {
          cardEl.style.visibility = 'visible';
          cardEl.style.pointerEvents = 'auto';
        }
      }

      // Selective video playback optimization:
      // Only the card nearest to the center plays video! All other video decoders stay paused.
      if (isVideo && closestCardIndex !== activeCenterIndex) {
        activeCenterIndex = closestCardIndex;
        videoRefs.current.forEach((vid, vIdx) => {
          if (!vid) return;
          if (vIdx === closestCardIndex && closestToCenterDist < 25) {
            if (vid.paused) {
              vid.play().catch(() => {});
            }
          } else {
            if (!vid.paused) {
              vid.pause();
            }
          }
        });
      }

      rafIdRef.current = requestAnimationFrame(render);
    };

    rafIdRef.current = requestAnimationFrame(render);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [totalSlots, isVideo]);

  // Unified Pointer Event Handlers (Mouse & Touch)
  const handlePointerDown = (e) => {
    isPointerDownRef.current = true;
    startXRef.current = e.clientX;
    lastXRef.current = e.clientX;
    lastTimeRef.current = performance.now();
    dragDistanceRef.current = 0;
    velocityRef.current = 0;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
  };

  const handlePointerMove = (e) => {
    if (!isPointerDownRef.current) return;
    const currentX = e.clientX;
    const dx = currentX - lastXRef.current;
    dragDistanceRef.current += Math.abs(dx);

    const radius = dimsRef.current.radius || 1000;
    // Map pixel drag to arc angle degrees
    const deltaAngle = (dx / radius) * (180 / Math.PI) * 1.15;
    angleRef.current += deltaAngle;

    const now = performance.now();
    const dt = now - lastTimeRef.current;
    if (dt > 0) {
      velocityRef.current = (deltaAngle / dt) * 16.67;
    }
    lastXRef.current = currentX;
    lastTimeRef.current = now;
  };

  const handlePointerUp = (e) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  const handleCardClick = (origIdx) => {
    // If dragged more than 6px, treat as scroll/drag, not a click
    if (dragDistanceRef.current > 6) return;
    if (typeof onSelect === 'function') {
      onSelect(origIdx);
    }
  };

  // Step button nudges
  const handleNudge = (dir) => {
    const step = (dimsRef.current.arcSpacing || 22) * (dir === 'left' ? 1 : -1);
    velocityRef.current += step * 0.18;
  };

  if (!cleanItems.length) return null;

  return (
    <div className="curved3d-wrapper">
      {/* Optional Row Header & Badge */}
      {(rowTitle || badgeText) && (
        <div className="container" style={{ marginBottom: '1.25rem' }}>
          <div className="gallery-row-label">
            <span
              className={`gallery-row-badge ${isVideo ? 'video-badge' : badgeColor ? badgeColor : ''}`}
            >
              {badgeIcon || (
                isVideo ? (
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                ) : (
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                )
              )}
              {badgeText || rowTitle}
            </span>
            {rowSubtitle && <span className="gallery-row-desc">{rowSubtitle}</span>}
          </div>
        </div>
      )}

      {/* 3D Curved Perspective Stage Container */}
      <div
        ref={containerRef}
        className="curved3d-container"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onMouseEnter={() => { isHoveredRef.current = true; }}
        onMouseLeave={() => { isHoveredRef.current = false; }}
        tabIndex={0}
        role="region"
        aria-label={`${rowTitle || 'Gallery'} 3D Curved Carousel`}
      >
        {/* Subtle Navigation Arrow Buttons on Hover */}
        <button
          type="button"
          className="curved3d-nav-btn curved3d-nav-prev"
          onClick={(e) => { e.stopPropagation(); handleNudge('left'); }}
          aria-label="Previous items"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <button
          type="button"
          className="curved3d-nav-btn curved3d-nav-next"
          onClick={(e) => { e.stopPropagation(); handleNudge('right'); }}
          aria-label="Next items"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* 3D Stage */}
        <div ref={stageRef} className="curved3d-stage">
          {ringItems.map((item, idx) => {
            const rawSrc = item.src || item.rawSrc || '';
            const poster = isVideo
              ? getVideoPosterUrl(rawSrc) || `/images/gallery-${String((item.originalIndex % 17) + 1).padStart(2, '0')}.jpeg`
              : item.src;
            const adaptiveVidSrc = isVideo ? getAdaptiveVideoUrl(rawSrc, 'preview') || rawSrc : '';

            return (
              <div
                key={`c3d-${idx}`}
                ref={(el) => { cardRefs.current[idx] = el; }}
                className={`curved3d-card ${isVideo ? 'curved3d-card-video' : ''}`}
                onClick={() => handleCardClick(item.originalIndex)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick(item.originalIndex);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`View ${isVideo ? 'video reel' : 'image'} ${item.originalIndex + 1}`}
              >
                {/* Poster / Image Layer */}
                <img
                  src={poster}
                  alt={`Gallery item ${item.originalIndex + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="curved3d-card-img"
                  onError={(e) => {
                    const fallbackNum = (item.originalIndex % 17) + 1;
                    const fallbackSrc = `/images/gallery-${String(fallbackNum).padStart(2, '0')}.jpeg`;
                    if (e.currentTarget.src !== fallbackSrc) {
                      e.currentTarget.src = fallbackSrc;
                    }
                  }}
                />

                {/* Autoplay Video Layer (if video row) */}
                {isVideo && adaptiveVidSrc && (
                  <video
                    ref={(el) => { videoRefs.current[idx] = el; }}
                    src={adaptiveVidSrc}
                    muted
                    loop
                    playsInline
                    preload="none"
                    className="curved3d-card-video-el"
                  />
                )}

                {/* Sleek Floating Reel Badge & Play Overlay */}
                {isVideo ? (
                  <div className="curved3d-card-overlay">
                    <div className="curved3d-play-btn">
                      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <span className="curved3d-tag">Watch Reel</span>
                  </div>
                ) : (
                  <div className="curved3d-card-photo-hover">
                    <span className="curved3d-expand-icon">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="15 3 21 3 21 9" />
                        <polyline points="9 21 3 21 3 15" />
                        <line x1="21" y1="3" x2="14" y2="10" />
                        <line x1="3" y1="21" x2="10" y2="14" />
                      </svg>
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
