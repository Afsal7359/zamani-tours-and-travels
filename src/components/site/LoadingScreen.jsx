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
    }, 300);
  };

  useEffect(() => {
    if (removed) return;
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;

    const startPlayback = () => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          video.muted = true;
          video.play().catch(() => {});
        });
      }
    };

    if (video.readyState >= 3) {
      startPlayback();
    } else {
      video.addEventListener('canplay', startPlayback, { once: true });
    }

    const handleEnded = () => {
      setVideoFinished(true);
    };

    video.addEventListener('ended', handleEnded, { once: true });

    // Failsafe timer: ensures smooth dismiss if video end event is delayed
    const maxTimer = setTimeout(() => {
      setVideoFinished(true);
    }, 3800);

    return () => {
      video.removeEventListener('canplay', startPlayback);
      video.removeEventListener('ended', handleEnded);
      clearTimeout(maxTimer);
    };
  }, [removed]);

  useEffect(() => {
    if (videoFinished && isReady && !isExiting && !removed) {
      dismiss();
    }
  }, [videoFinished, isReady, isExiting, removed]);

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
