'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

const TOTAL_FRAMES = 47;

const getFramePath = (index) =>
  `/imageheroscetion/ezgif-frame-${String(index + 1).padStart(3, '0')}.jpg`;

export default function HeroImageSequence({ wrapperRef, fallbackImage }) {
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);
  const currentFrameRef = useRef(0);
  const targetFrameRef = useRef(0);
  const animFrameIdRef = useRef(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // High-precision crystal-clear canvas rendering
  const drawFrame = useCallback((frameIndex) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: false });
    if (!ctx) return;

    const img = imagesRef.current[frameIndex];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const cW = canvas.width;
    const cH = canvas.height;
    const iW = img.naturalWidth;
    const iH = img.naturalHeight;

    // Enable high-quality image smoothing & bicubic scaling for 4K crispness
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const canvasAspect = cW / cH;
    let scale;
    if (canvasAspect < 1.0) {
      // Mobile vertical view: cover nicely with height fit focus to maintain full frame clarity
      const heightFitScale = cH / iH;
      const widthFitScale = cW / iW;
      scale = Math.max(heightFitScale, widthFitScale * 1.05);
    } else {
      // Desktop / Tablet landscape: full cover
      scale = Math.max(cW / iW, cH / iH);
    }

    const x = (cW - iW * scale) / 2;
    const y = (cH - iH * scale) / 2;

    ctx.fillStyle = '#050b26';
    ctx.fillRect(0, 0, cW, cH);
    ctx.drawImage(img, x, y, iW * scale, iH * scale);
  }, []);

  // Responsive retina DPI sizing up to 2.5x for ultra-high pixel density
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2.5);
    const rect = parent.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    drawFrame(Math.round(currentFrameRef.current));
  }, [drawFrame]);

  // Preload all 47 frame images reliably
  useEffect(() => {
    let loadedCount = 0;
    const imgs = [];

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.onload = () => {
        loadedCount++;
        if (i === 0) {
          handleResize();
          drawFrame(0);
        }
        if (loadedCount === TOTAL_FRAMES) {
          setImagesLoaded(true);
        }
      };
      img.onerror = () => {
        loadedCount++;
      };
      img.src = getFramePath(i);

      if (img.complete && img.naturalWidth > 0) {
        if (i === 0) {
          handleResize();
          drawFrame(0);
        }
      }

      imgs.push(img);
    }

    imagesRef.current = imgs;
  }, [drawFrame, handleResize]);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [handleResize]);

  useEffect(() => {
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  // Silky smooth video-like 60fps lerp loop (continuous video playback flow)
  const renderLoop = useCallback(() => {
    const diff = targetFrameRef.current - currentFrameRef.current;
    if (Math.abs(diff) > 0.001) {
      currentFrameRef.current += diff * 0.08; // Continuous video-like smooth playback
      drawFrame(Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(currentFrameRef.current))));
      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    } else {
      currentFrameRef.current = targetFrameRef.current;
      drawFrame(Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(currentFrameRef.current))));
      animFrameIdRef.current = null;
    }
  }, [drawFrame]);

  const triggerRender = useCallback(() => {
    if (!animFrameIdRef.current) {
      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    }
  }, [renderLoop]);

  // Scroll handler with accurate progress mapping for desktop & mobile
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = typeof window !== 'undefined' ? window.scrollY || window.pageYOffset || 0 : 0;
      
      if (scrollY <= 5) {
        targetFrameRef.current = 0;
        triggerRender();
        return;
      }

      const wrapper = wrapperRef?.current;
      if (!wrapper) {
        const heroHeight = window.innerHeight * 1.8;
        const progress = Math.min(1, Math.max(0, scrollY / heroHeight));
        targetFrameRef.current = progress * (TOTAL_FRAMES - 1);
        triggerRender();
        return;
      }

      const rect = wrapper.getBoundingClientRect();
      const viewportH = typeof window !== 'undefined' ? window.innerHeight || document.documentElement.clientHeight : 800;
      const scrollableHeight = wrapper.clientHeight - viewportH;
      if (scrollableHeight <= 0) return;

      const currentScroll = Math.max(0, -rect.top);
      const progress = Math.min(1, Math.max(0, currentScroll / scrollableHeight));
      
      targetFrameRef.current = progress * (TOTAL_FRAMES - 1);
      triggerRender();
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    return () => window.removeEventListener('scroll', handleScroll, { capture: true });
  }, [wrapperRef, triggerRender]);

  return (
    <div className="hero-sequence-wrapper" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        className="hero-sequence-canvas"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
      {fallbackImage && !imagesLoaded && (
        <img
          src={fallbackImage}
          alt="Hero background"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: -1
          }}
        />
      )}
    </div>
  );
}


