'use client';
import { useState, useEffect, useRef } from 'react';

export default function LoadingScreen({ isReady = true }) {
  const [isExiting, setIsExiting] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [videoFinished, setVideoFinished] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    // Only show the full-screen splash animation once on initial session entry.
    // Subsequent internal page navigations are instantaneous (0ms blocking).
    if (typeof window !== 'undefined' && sessionStorage.getItem('zamani_splash_shown')) {
      setRemoved(true);
      return;
    }
    if (typeof window !== 'undefined') {
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

    const onEnded = () => setVideoFinished(true);
    const onTimeUpdate = () => {
      if (video.duration && video.currentTime >= video.duration - 0.15) {
        setVideoFinished(true);
      }
    };

    video.addEventListener('ended', onEnded);
    video.addEventListener('timeupdate', onTimeUpdate);

    // Fast snappy safety timer: max 900ms
    const maxTimer = setTimeout(() => {
      setVideoFinished(true);
    }, 900);

    return () => {
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('timeupdate', onTimeUpdate);
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
        autoPlay
        muted
        playsInline
        preload="auto"
        className="page-loader-video"
      >
        <source src="/logoloading.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
