'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

const TOTAL_FRAMES = 47;

const getFramePath = (index) =>
  `/imageheroscetion/ezgif-frame-${String(index + 1).padStart(3, '0')}.jpg`;

export default function HeroImageSequence({ fallbackImage }) {
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);
  const currentFrameRef = useRef(0);
  const targetFrameRef = useRef(0);
  const animFrameIdRef = useRef(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const autoPlayTriggeredRef = useRef(false);

  // Draw a specific frame index to canvas with cover fitting
  const drawFrame = useCallback((frameIndex) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imagesRef.current[frameIndex];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const cW = canvas.width;
    const cH = canvas.height;
    const iW = img.naturalWidth;
    const iH = img.naturalHeight;

    const scale = Math.max(cW / iW, cH / iH);
    const x = (cW - iW * scale) / 2;
    const y = (cH - iH * scale) / 2;

    ctx.clearRect(0, 0, cW, cH);
    ctx.drawImage(img, x, y, iW * scale, iH * scale);
  }, []);

  // Responsive retina sizing
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);
    const rect = parent.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    drawFrame(Math.round(currentFrameRef.current));
  }, [drawFrame]);

  // Preload all 47 frame images
  useEffect(() => {
    let loadedCount = 0;
    const imgs = [];

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFramePath(i);
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
      imgs.push(img);
    }

    imagesRef.current = imgs;
  }, [drawFrame, handleResize]);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Smooth 60fps lerp render loop
  const renderLoop = useCallback(() => {
    const diff = targetFrameRef.current - currentFrameRef.current;
    if (Math.abs(diff) > 0.01) {
      currentFrameRef.current += diff * 0.14; // smooth fluid spring lerp
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

  // Scroll event listener for smooth frame progression
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const heroHeight = window.innerHeight * 0.9;
      const progress = Math.min(1, Math.max(0, scrollY / heroHeight));

      const calculatedTarget = Math.round(progress * (TOTAL_FRAMES - 1));

      // Single scroll auto-advance: when user initiates scroll from top, smoothly complete frame animation
      if (scrollY > 10 && !autoPlayTriggeredRef.current && progress < 0.8) {
        autoPlayTriggeredRef.current = true;
        targetFrameRef.current = TOTAL_FRAMES - 1;
      } else if (scrollY === 0) {
        autoPlayTriggeredRef.current = false;
        targetFrameRef.current = 0;
      } else if (!autoPlayTriggeredRef.current) {
        targetFrameRef.current = calculatedTarget;
      }

      triggerRender();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [triggerRender]);

  // Wheel listener for instant auto-play on first scroll nudge
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.deltaY > 0 && window.scrollY < 50 && !autoPlayTriggeredRef.current) {
        autoPlayTriggeredRef.current = true;
        targetFrameRef.current = TOTAL_FRAMES - 1;
        triggerRender();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [triggerRender]);

  return (
    <div className="hero-sequence-wrapper" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        className="hero-sequence-canvas"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          objectFit: 'cover'
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
