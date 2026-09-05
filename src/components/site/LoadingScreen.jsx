'use client';
import { useState, useEffect, useRef } from 'react';

export default function LoadingScreen({ isReady = true }) {
  const [removed, setRemoved] = useState(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('zamani_splash_shown')) {
      return true;
    }
    return false;
  });
  const [isExiting, setIsExiting] = useState(false);
  const [videoFinished, setVideoFinished] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !sessionStorage.getItem('zamani_splash_shown')) {
      sessionStorage.setItem('zamani_splash_shown', '1');
    }
  }, []);

  const dismiss = () => {
    if (isExiting || removed) return;
    setIsExiting(true);
    setTimeout(() => {
      setRemoved(true);
    }, 450);
  };

  useEffect(() => {
    if (removed) return;
    const video = videoRef.current;

    const startPlayback = () => {
      if (!video) return;
      video.muted = true;
      video.defaultMuted = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          video.muted = true;
          video.play().catch(() => {});
        });
      }
    };

    if (video) {
      if (video.readyState >= 3) {
        startPlayback();
      } else {
        video.addEventListener('canplay', startPlayback, { once: true });
      }

      // As soon as the video ends, immediately dismiss into website
      const handleEnded = () => {
        dismiss();
      };
      video.addEventListener('ended', handleEnded, { once: true });
    }

    // Absolute fail-safe: guarantees transition to website within 2.4s max
    const maxTimer = setTimeout(() => {
      dismiss();
    }, 2400);

    return () => {
      if (video) {
        video.removeEventListener('canplay', startPlayback);
      }
      clearTimeout(maxTimer);
    };
  }, [removed]);

  if (removed) return null;

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
        className="page-loader-video"
      />
    </div>
  );
}
