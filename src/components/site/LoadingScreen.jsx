'use client';
import { useState, useEffect, useRef } from 'react';

export default function LoadingScreen({ isReady = true }) {
  const [videoFinished, setVideoFinished] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [removed, setRemoved] = useState(false);
  const videoRef = useRef(null);

  const dismiss = () => {
    if (isExiting || removed) return;
    setIsExiting(true);
    setTimeout(() => {
      setRemoved(true);
    }, 400);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onEnded = () => {
      setVideoFinished(true);
    };

    const onTimeUpdate = () => {
      if (video.duration && video.currentTime >= video.duration - 0.15) {
        setVideoFinished(true);
      }
    };

    video.addEventListener('ended', onEnded);
    video.addEventListener('timeupdate', onTimeUpdate);

    // Snappy fallback safety timer: max 1.5s
    const maxTimer = setTimeout(() => {
      setVideoFinished(true);
    }, 1500);

    return () => {
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('timeupdate', onTimeUpdate);
      clearTimeout(maxTimer);
    };
  }, []);

  // When both the animation has completed AND the page is ready, initiate smooth transition
  useEffect(() => {
    if (videoFinished && isReady && !isExiting) {
      dismiss();
    }
  }, [videoFinished, isReady, isExiting]);

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
