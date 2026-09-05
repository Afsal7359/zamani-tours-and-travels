'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

export default function LoadingScreen({ isReady = true }) {
  const [mounted, setMounted] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const videoRef = useRef(null);
  const isDismissingRef = useRef(false);
  const fallbackTimerRef = useRef(null);

  const dismiss = useCallback(() => {
    if (isDismissingRef.current) return;
    isDismissingRef.current = true;

    // Clear any fallback timers
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }

    // 1. Pause video immediately to free 100% of GPU decoders for silky 120fps slide transition
    try {
      const vid = videoRef.current;
      if (vid && !vid.paused) {
        vid.pause();
      }
    } catch (e) {}

    // 2. Trigger hardware-accelerated slide-up transition
    setIsExiting(true);

    // 3. Remove from DOM after CSS transition completes
    setTimeout(() => {
      setRemoved(true);
      document.body.style.overflow = '';
    }, 850);
  }, []);

  useEffect(() => {
    // If running in browser and splash was already shown once in this session, remove immediately
    if (typeof window !== 'undefined' && sessionStorage.getItem('zamani_splash_shown')) {
      setRemoved(true);
      return;
    }
    // Mark as shown for this session
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('zamani_splash_shown', '1');
    }
    setMounted(true);

    // Hard safety timeout: video is ~8s; guarantee dismiss by 8.8s even if all events fail
    fallbackTimerRef.current = setTimeout(() => {
      dismiss();
    }, 8800);

    return () => {
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    };
  }, [dismiss]);

  // Lock body scroll while splash screen is visible to prevent background layout thrashing
  useEffect(() => {
    if (!mounted || removed) {
      document.body.style.overflow = '';
      return;
    }
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mounted, removed]);

  // Video play guard: only initiate play if actually paused
  useEffect(() => {
    if (!mounted) return;
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;

    const playVideo = () => {
      if (video.paused && !isDismissingRef.current) {
        video.play().catch(() => {});
      }
    };

    if (video.readyState >= 2) {
      playVideo();
    } else {
      video.addEventListener('canplay', playVideo, { once: true });
    }

    return () => {
      video.removeEventListener('canplay', playVideo);
    };
  }, [mounted]);

  // Continuous time tracking: ensures ZERO FREEZE on the final frame
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || isDismissingRef.current) return;
    // Video is 8.008s. When within 180ms of completion, seamlessly trigger exit slide!
    if (video.duration && video.currentTime >= video.duration - 0.18) {
      dismiss();
    }
  };

  // If video pauses after reaching > 5 seconds, it has reached the end
  const handlePause = () => {
    const video = videoRef.current;
    if (!video || isDismissingRef.current) return;
    if (video.currentTime >= 5) {
      dismiss();
    }
  };

  // SSR or already shown in session -> Render nothing!
  if (!mounted || removed) return null;

  return (
    <div
      className={`page-loader ${isExiting ? 'page-loader-exit' : ''}`}
      aria-hidden={isExiting}
      onClick={dismiss}
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
        onPause={handlePause}
        onError={dismiss}
        className="page-loader-video"
      />
    </div>
  );
}
