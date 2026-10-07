'use client';
import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { getVideoPosterUrl } from '@/lib/videoUtils';
import { getAdaptiveVideoUrl } from '@/lib/performanceGuardian';

/**
 * Curved3DCard
 * Individual card supporting instant poster display, fast autoplay video with metadata preload,
 * seamless multi-image panorama merge styling (connectNext), and click handling.
 */
const Curved3DCard = memo(function Curved3DCard({
  item,
  idx,
  isVideo,
  onCardClick,
  setCardEl,
  setVideoEl,
  cardWidth,
  cardHeight,
}) {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const rawSrc = item.src || item.rawSrc || '';
  const [videoSrc, setVideoSrc] = useState(() => {
    return isVideo ? (getAdaptiveVideoUrl(rawSrc, 'preview') || rawSrc) : '';
  });

  const poster = isVideo
    ? (getVideoPosterUrl(rawSrc) || `/images/gallery-${String((item.originalIndex % 17) + 1).padStart(2, '0')}.jpeg`)
    : item.src;

  const handleVideoError = () => {
    if (videoSrc !== rawSrc && rawSrc) {
      setVideoSrc(rawSrc);
    }
  };

  const handleVideoRef = (node) => {
    setVideoEl(idx, node);
    if (node) {
      node.muted = true;
      node.defaultMuted = true;
      node.playsInline = true;
      node.setAttribute('muted', '');
      node.setAttribute('playsinline', '');
      node.setAttribute('webkit-playsinline', 'true');
      const p = node.play();
      if (p !== undefined) {
        p.then(() => setVideoLoaded(true)).catch(() => {});
      }
    }
  };

  const connClass = item.isConnStart
    ? 'curved3d-connect-start'
    : item.isConnMiddle
    ? 'curved3d-connect-middle'
    : item.isConnEnd
    ? 'curved3d-connect-end'
    : '';

  return (
    <div
      ref={(el) => setCardEl(idx, el)}
      className={`curved3d-card ${isVideo ? 'curved3d-card-video' : ''} ${connClass}`}
      style={{
        width: `${cardWidth}px`,
        height: `${cardHeight}px`,
      }}
      onClick={() => onCardClick(item.originalIndex)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onCardClick(item.originalIndex);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`View ${isVideo ? 'video reel' : 'gallery item'} ${item.originalIndex + 1}`}
    >
      {/* 1. Instant Static Poster Layer (Never black/blank, immediate paint) */}
      <img
        src={poster}
        alt={`Gallery item ${item.originalIndex + 1}`}
        loading="lazy"
        decoding="async"
        className="curved3d-card-img"
        style={{ zIndex: 0 }}
        onError={(e) => {
          const fallbackNum = (item.originalIndex % 17) + 1;
          const fallbackSrc = `/images/gallery-${String(fallbackNum).padStart(2, '0')}.jpeg`;
          if (e.currentTarget.src !== fallbackSrc) {
            e.currentTarget.src = fallbackSrc;
          }
        }}
      />

      {/* 2. Fast Autoplay Video Layer with Metadata Preload & Smooth Fade-in */}
      {isVideo && videoSrc && (
        <video
          ref={handleVideoRef}
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          webkit-playsinline="true"
          x5-playsinline="true"
          preload="metadata"
          onError={handleVideoError}
          onLoadedData={() => setVideoLoaded(true)}
          onCanPlay={() => setVideoLoaded(true)}
          onPlaying={() => setVideoLoaded(true)}
          className="curved3d-card-video-el"
          style={{
            zIndex: 1,
            opacity: videoLoaded ? 1 : 0,
            transition: 'opacity 0.35s ease',
          }}
        />
      )}

      {/* 3. Floating Interactive Overlay */}
      {isVideo ? (
        <div className="curved3d-card-overlay" style={{ zIndex: 3 }}>
          <div className="curved3d-play-btn">
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span className="curved3d-tag">Watch Reel</span>
        </div>
      ) : (
        <div className="curved3d-card-photo-hover" style={{ zIndex: 2 }}>
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
});

/**
 * Curved3DSlider
 * Hardware-accelerated 3D cylindrical arc perspective carousel.
 * Guarantees:
 * - Proper, distinct gap/distance between normal cards (not crowded or overlapping).
 * - Seamless 0px gap and continuous corner rounding for merged panorama groups (connectNext).
 * - Fast, instant video loading with metadata preloading and zero black frames.
 * - Smooth 60/120 FPS continuous motion with inertial drag/swipe on mobile & desktop.
 */
export default memo(function Curved3DSlider({
  items = [],
  isVideo = false,
  direction = 'left',
  speed = 0.038,
  onSelect,
  badgeText = '',
  badgeIcon = null,
  badgeColor = '',
  rowTitle = '',
  rowSubtitle = '',
}) {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const cardElementsRef = useRef([]);
  const videoElementsRef = useRef([]);

  // Responsive dimensions & spacing state
  const dimsRef = useRef({
    width: 1200,
    radius: 1200,
    baseCardWidth: 240,
    cardHeight: 330,
    normalGap: 32,
    stageHeight: 400,
    maxVisibleAngle: 65,
    perimeter: 7500,
    cumulativeAngles: [],
    cardWidths: [],
  });

  // Animation & Physics state (stored in refs for 0 React re-renders during motion)
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

  useEffect(() => {
    baseSpeedRef.current = direction === 'right' ? Math.abs(speed) : -Math.abs(speed);
  }, [direction, speed]);

  // Clean items
  const cleanItems = items.filter(Boolean);
  const origLen = cleanItems.length;

  // Determine repeat count so that the 3D cylinder has enough density (~24 to 28 cards)
  const targetSlots = 26;
  const repeatCount = origLen > 0 ? Math.max(1, Math.ceil(targetSlots / origLen)) : 1;

  // Build the ring items with merged connection metadata
  const ringItems = [];
  for (let r = 0; r < repeatCount; r++) {
    for (let i = 0; i < origLen; i++) {
      const it = cleanItems[i];
      const prevIt = cleanItems[(i - 1 + origLen) % origLen];
      const isConnStart = Boolean(it.connectNext && !prevIt?.connectNext);
      const isConnMiddle = Boolean(it.connectNext && prevIt?.connectNext);
      const isConnEnd = Boolean(!it.connectNext && prevIt?.connectNext);

      ringItems.push({
        ...it,
        originalIndex: i,
        slotIndex: ringItems.length,
        isConnStart,
        isConnMiddle,
        isConnEnd,
      });
    }
  }
  const totalSlots = ringItems.length;

  // Calculate layout geometry (responsive card width, gap, and cumulative angles)
  const updateDimensions = useCallback(() => {
    if (!containerRef.current) return;
    const w = containerRef.current.clientWidth || window.innerWidth;
    let baseWidth, cardHeight, normalGap, stageHeight, maxAngle;

    if (w < 480) {
      baseWidth = 160;
      cardHeight = 225;
      normalGap = 18;
      stageHeight = 285;
      maxAngle = 54;
    } else if (w < 768) {
      baseWidth = 180;
      cardHeight = 255;
      normalGap = 22;
      stageHeight = 320;
      maxAngle = 58;
    } else if (w < 1024) {
      baseWidth = 205;
      cardHeight = 290;
      normalGap = 26;
      stageHeight = 360;
      maxAngle = 62;
    } else {
      baseWidth = 240;
      cardHeight = 330;
      normalGap = 32;
      stageHeight = 410;
      maxAngle = 65;
    }

    if (totalSlots === 0) return;

    // 1. Calculate card width and step distance for each slot
    const cardWidths = [];
    const stepDistances = [];

    for (let i = 0; i < totalSlots; i++) {
      const item = ringItems[i];
      const span = [1, 2, 3].includes(Number(item.span)) ? Number(item.span) : 1;
      const cWidth = baseWidth * span + (span - 1) * normalGap;
      cardWidths.push(cWidth);

      // Gap after this card: 0px if connected to next (merged panorama), normalGap if independent
      const gapAfter = item.connectNext ? 0 : normalGap;
      const nextItem = ringItems[(i + 1) % totalSlots];
      const nextSpan = [1, 2, 3].includes(Number(nextItem.span)) ? Number(nextItem.span) : 1;
      const nextWidth = baseWidth * nextSpan + (nextSpan - 1) * normalGap;

      const dist = cWidth / 2 + gapAfter + nextWidth / 2;
      stepDistances.push(dist);
    }

    // 2. Total perimeter and natural cylinder radius R = perimeter / (2 * PI)
    const perimeter = stepDistances.reduce((acc, d) => acc + d, 0);
    const radius = Math.max(500, perimeter / (2 * Math.PI));

    // 3. Exact cumulative base angles summing to 360 degrees
    const cumulativeAngles = [0];
    for (let i = 0; i < totalSlots - 1; i++) {
      const deltaAngle = (stepDistances[i] / perimeter) * 360;
      cumulativeAngles.push(cumulativeAngles[i] + deltaAngle);
    }

    dimsRef.current = {
      width: w,
      radius,
      baseCardWidth: baseWidth,
      cardHeight,
      normalGap,
      stageHeight,
      maxVisibleAngle: maxAngle,
      perimeter,
      cumulativeAngles,
      cardWidths,
    };

    if (stageRef.current) {
      stageRef.current.style.height = `${stageHeight}px`;
    }
  }, [totalSlots, ringItems]);

  useEffect(() => {
    updateDimensions();
    const ro = new ResizeObserver(() => updateDimensions());
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', updateDimensions);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, [updateDimensions]);

  // Pause animation when scrolled out of view
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

    const degToRad = Math.PI / 180;

    const render = () => {
      if (!isInViewRef.current) {
        rafIdRef.current = requestAnimationFrame(render);
        return;
      }

      // Physics update
      if (isPointerDownRef.current) {
        // Dragging: controlled by pointer
      } else {
        if (Math.abs(velocityRef.current) > 0.002) {
          angleRef.current += velocityRef.current;
          velocityRef.current *= 0.94; // inertia decay
        } else if (!isHoveredRef.current) {
          angleRef.current += baseSpeedRef.current;
        }
      }

      const { radius, cardHeight, maxVisibleAngle, cumulativeAngles, cardWidths } = dimsRef.current;
      const currentAngle = angleRef.current;

      for (let i = 0; i < totalSlots; i++) {
        const cardEl = cardElementsRef.current[i];
        if (!cardEl) continue;

        const baseAngle = cumulativeAngles[i] || 0;
        // Compute relative angle to center [ -180, +180 ]
        let theta = ((baseAngle + currentAngle) % 360 + 540) % 360 - 180;
        const absTheta = Math.abs(theta);

        // Culling: cards on the back half of the cylinder
        if (absTheta > maxVisibleAngle) {
          if (cardEl.style.visibility !== 'hidden') {
            cardEl.style.visibility = 'hidden';
            cardEl.style.pointerEvents = 'none';
          }
          // Pause offscreen video decoders to free GPU
          if (isVideo) {
            const vid = videoElementsRef.current[i];
            if (vid && !vid.paused) {
              vid.pause();
            }
          }
          continue;
        }

        // Visible card: 3D coordinates on cylinder arc
        const thetaRad = theta * degToRad;
        const x = radius * Math.sin(thetaRad);
        const z = radius * (Math.cos(thetaRad) - 1);
        const rotY = -theta;

        const progress = absTheta / maxVisibleAngle;
        const scale = (1 - 0.08 * progress * progress).toFixed(3);
        const brightness = (1 - 0.2 * progress).toFixed(3);
        const opacity = progress > 0.88 ? Math.max(0, (1 - progress) / 0.12).toFixed(3) : '1';
        const zIndex = Math.round(1000 - absTheta * 10);
        const cWidth = cardWidths[i] || dimsRef.current.baseCardWidth;

        // Apply fast GPU transform directly to DOM
        cardEl.style.width = `${cWidth}px`;
        cardEl.style.height = `${cardHeight}px`;
        cardEl.style.transform = `translate3d(calc(-50% + ${x.toFixed(2)}px), -50%, ${z.toFixed(2)}px) rotateY(${rotY.toFixed(2)}deg) scale(${scale})`;
        cardEl.style.filter = `brightness(${brightness})`;
        cardEl.style.opacity = opacity;
        cardEl.style.zIndex = zIndex;

        if (cardEl.style.visibility !== 'visible') {
          cardEl.style.visibility = 'visible';
          cardEl.style.pointerEvents = 'auto';
        }

        // Keep visible video playing smoothly
        if (isVideo) {
          const vid = videoElementsRef.current[i];
          if (vid && vid.paused) {
            vid.play().catch(() => {});
          }
        }
      }

      rafIdRef.current = requestAnimationFrame(render);
    };

    rafIdRef.current = requestAnimationFrame(render);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [totalSlots, isVideo]);

  // Unified Pointer Handlers
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
    if (dragDistanceRef.current > 6) return;
    if (typeof onSelect === 'function') {
      onSelect(origIdx);
    }
  };

  const handleNudge = (dir) => {
    const step = 14 * (dir === 'left' ? 1 : -1);
    velocityRef.current += step * 0.18;
  };

  const setCardEl = useCallback((idx, el) => {
    cardElementsRef.current[idx] = el;
  }, []);

  const setVideoEl = useCallback((idx, el) => {
    videoElementsRef.current[idx] = el;
  }, []);

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
        {/* Navigation Arrow Buttons */}
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
          {ringItems.map((item, idx) => (
            <Curved3DCard
              key={`c3d-${idx}`}
              item={item}
              idx={idx}
              isVideo={isVideo}
              onCardClick={handleCardClick}
              setCardEl={setCardEl}
              setVideoEl={setVideoEl}
              cardWidth={dimsRef.current.cardWidths[idx] || dimsRef.current.baseCardWidth}
              cardHeight={dimsRef.current.cardHeight}
            />
          ))}
        </div>
      </div>
    </div>
  );
});
