'use client';
import { useState, useEffect, useRef } from 'react';

export default function LoadingScreen({ isReady = true }) {
  const [videoFinished, setVideoFinished] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [removed, setRemoved] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onEnded = () => {
      setVideoFinished(true);
    };

    const onTimeUpdate = () => {
      // If video is within 0.1s of end or reached duration
      if (video.duration && video.currentTime >= video.duration - 0.1) {
        setVideoFinished(true);
      }
    };

    video.addEventListener('ended', onEnded);
    video.addEventListener('timeupdate', onTimeUpdate);

    // Fallback safety timer: if video fails to play or load, don't trap the user forever
    const maxTimer = setTimeout(() => {
      setVideoFinished(true);
    }, 4500);

    return () => {
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('timeupdate', onTimeUpdate);
      clearTimeout(maxTimer);
    };
  }, []);

  // When both the animation has completed AND the page is ready, initiate smooth transition
  useEffect(() => {
    if (videoFinished && isReady && !isExiting) {
      setIsExiting(true);
      const exitTimer = setTimeout(() => {
        setRemoved(true);
      }, 850);
      return () => clearTimeout(exitTimer);
    }
  }, [videoFinished, isReady, isExiting]);

  if (removed) return null;

  return (
    <div
      className={`page-loader ${isExiting ? 'page-loader-exit' : ''}`}
      aria-hidden={isExiting}
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
