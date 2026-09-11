'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * High-Performance Smooth Video Intro & Preloader
 * - Hardware-accelerated 60/120fps playback of /logoloading.mp4
 * - Automatic smooth curtain slide-up reveal at end of video
 * - Instant skip on click, tap, scroll, or keypress
 * - Guaranteed non-blocking scroll restoration so the page NEVER gets stuck
 */
export default function LoadingScreen({ onFinished }) {
  const [mounted, setMounted] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [removed, setRemoved] = useState(false);
  const videoRef = useRef(null);
  const isDismissingRef = useRef(false);
  const fallbackTimerRef = useRef(null);
  const onFinishedRef = useRef(onFinished);

  // Keep latest onFinished without triggering re-runs
  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  const unlockScroll = useCallback(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('intro-scroll-lock');
      document.body.style.overflow = '';
      document.body.style.overflowY = '';
    }
  }, []);

  const dismiss = useCallback(() => {
    if (isDismissingRef.current) return;
    isDismissingRef.current = true;

    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('zamani_intro_played', 'true');
      }
    } catch (_) {}

    // Immediately unlock page scrolling so user can scroll as curtain begins rising
    unlockScroll();

    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }

    // Trigger smooth curtain slide-up
    setIsExiting(true);

    // Pause video to free hardware decoders for page transitions
    try {
      const vid = videoRef.current;
      if (vid && !vid.paused) {
        vid.pause();
      }
    } catch (_) {}

    // Complete exit and unmount after CSS transition completes
    setTimeout(() => {
      setRemoved(true);
      unlockScroll();
      if (typeof onFinishedRef.current === 'function') {
        onFinishedRef.current();
      }
    }, 750);
  }, [unlockScroll]);

  // Mount effect: runs ONCE only
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && sessionStorage.getItem('zamani_intro_played') === 'true') {
        setRemoved(true);
        if (typeof onFinishedRef.current === 'function') {
          onFinishedRef.current();
        }
        return;
      }
    } catch (_) {}

    setMounted(true);
    if (typeof document !== 'undefined') {
      document.body.classList.add('intro-scroll-lock');
    }

    // Maximum safety timeout (video is 8s; max wait 9.5s)
    fallbackTimerRef.current = setTimeout(() => {
      dismiss();
    }, 9500);

    return () => {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }
      unlockScroll();
    };
  }, [dismiss, unlockScroll]);

  // Skip immediately on any scroll, wheel, or swipe gesture
  useEffect(() => {
    if (!mounted || removed || isExiting) return;

    const handleScrollOrSwipe = () => {
      dismiss();
    };

    window.addEventListener('wheel', handleScrollOrSwipe, { passive: true });
    window.addEventListener('touchmove', handleScrollOrSwipe, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleScrollOrSwipe);
      window.removeEventListener('touchmove', handleScrollOrSwipe);
    };
  }, [mounted, removed, isExiting, dismiss]);

  // Handle video autoplay smoothly
  useEffect(() => {
    if (!mounted || removed) return;
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;

    const tryPlay = () => {
      if (video.paused && !isDismissingRef.current) {
        video.play().catch(() => {});
      }
    };

    if (video.readyState >= 2) {
      tryPlay();
    } else {
      video.addEventListener('canplay', tryPlay, { once: true });
    }

    return () => {
      video.removeEventListener('canplay', tryPlay);
    };
  }, [mounted, removed]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || isDismissingRef.current) return;
    if (video.duration && video.currentTime >= video.duration - 0.15) {
      dismiss();
    }
  };

  if (!mounted || removed) return null;

  return (
    <div
      className={`page-loader ${isExiting ? 'page-loader-exit' : ''}`}
      aria-hidden={isExiting}
      onClick={dismiss}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
          e.preventDefault();
          dismiss();
        }
      }}
      style={{ cursor: 'pointer' }}
    >
      <video
        ref={videoRef}
        src="/logoloading.mp4"
        autoPlay
        muted
        playsInline
        webkit-playsinline="true"
        x5-playsinline="true"
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onEnded={dismiss}
        onError={dismiss}
        className="page-loader-video"
      />
      <div className="page-loader-skip-hint">
        <span>Skip ✕</span>
      </div>
    </div>
  );
}
