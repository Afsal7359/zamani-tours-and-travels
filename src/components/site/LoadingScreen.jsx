'use client';
import { useState, useEffect, useRef } from 'react';

export default function LoadingScreen({ isReady = true }) {
  const [mounted, setMounted] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const videoRef = useRef(null);

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

    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.defaultMuted = true;
      video.play().catch(() => {});
    }

    // Safety fallback timeout (video is ~8s, allow up to 10s if onEnded does not fire)
    const maxTimer = setTimeout(() => {
      dismiss();
    }, 10000);

    return () => clearTimeout(maxTimer);
  }, []);

  const isDismissingRef = useRef(false);

  const dismiss = () => {
    if (isDismissingRef.current) return;
    isDismissingRef.current = true;
    setIsExiting(true);
    setTimeout(() => {
      setRemoved(true);
    }, 900);
  };

  // SSR or already shown in session -> Render nothing! Zero flash, zero freeze!
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
        onEnded={dismiss}
        onError={dismiss}
        className="page-loader-video"
      />
    </div>
  );
}
