'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  subscribeToVideoComments,
  addVideoComment,
  subscribeToVideoLikes,
  updateVideoLikes,
  getCleanVideoId,
} from '@/lib/firestore';
import { getVideoPosterUrl, isYouTubeUrl, parseYouTubeUrl } from '@/lib/videoUtils';
import { getAdaptiveVideoUrl } from '@/lib/performanceGuardian';

export default function ReelModal({ videos = [], initialIndex = 0, onClose }) {
  // Normalize videos array to string URLs
  const normalizedVideos = (videos || [])
    .map(v => (typeof v === 'string' ? v : (v?.src || v?.url || '')))
    .filter(Boolean);

  const [currentIndex, setCurrentIndex] = useState(() => {
    return initialIndex >= 0 && initialIndex < normalizedVideos.length ? initialIndex : 0;
  });

  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [heartAnimation, setHeartAnimation] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Playback & Scrubber State
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubTime, setScrubTime] = useState(0);
  const [isHoveringScrubber, setIsHoveringScrubber] = useState(false);
  const [soundToast, setSoundToast] = useState(null);
  const [skipToast, setSkipToast] = useState(null);
  const [rippleEffect, setRippleEffect] = useState(null);
  const [playIndicator, setPlayIndicator] = useState(null);

  // Touch & Mouse Vertical Drag State (Instagram Reels Swipe)
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDraggingReel, setIsDraggingReel] = useState(false);

  const videoRefs = useRef({});
  const ytIframeRefs = useRef({});
  const ytPlayersRef = useRef({});
  const scrubberContainerRef = useRef(null);
  const containerRef = useRef(null);
  const isScrubbingRef = useRef(false);
  const isWheelLockedRef = useRef(false);
  const isLikedRef = useRef(isLiked);
  const singleTapTimerRef = useRef(null);
  const lastTapRef = useRef({ time: 0, x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0, time: 0, active: false });

  const activeVideoUrl = normalizedVideos[currentIndex] || '';
  const isYt = isYouTubeUrl(activeVideoUrl);
  const ytInfo = isYt ? parseYouTubeUrl(activeVideoUrl) : null;

  // Sync isLikedRef
  useEffect(() => {
    isLikedRef.current = isLiked;
  }, [isLiked]);

  // Lock background body scroll
  useEffect(() => {
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    try {
      const savedName = localStorage.getItem('zamani_user_name');
      if (savedName) setCommentName(savedName);
    } catch (_) {}
    return () => {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
    };
  }, []);

  // Update like status for current video from localStorage
  useEffect(() => {
    if (!activeVideoUrl) return;
    try {
      const vidKey = `liked_${getCleanVideoId(activeVideoUrl)}`;
      setIsLiked(localStorage.getItem(vidKey) === 'true');
    } catch (_) {
      setIsLiked(false);
    }
  }, [activeVideoUrl]);

  // Subscribe to real-time likes
  useEffect(() => {
    if (!activeVideoUrl) return;
    const unsub = subscribeToVideoLikes(activeVideoUrl, (count) => {
      setLikesCount(count);
    });
    return () => unsub();
  }, [activeVideoUrl]);

  // Subscribe to real-time comments
  useEffect(() => {
    if (!activeVideoUrl) return;
    const unsub = subscribeToVideoComments(activeVideoUrl, (items) => {
      setComments(items);
    });
    return () => unsub();
  }, [activeVideoUrl]);

  // Auto-dismiss toasts
  useEffect(() => {
    if (!soundToast) return;
    const t = setTimeout(() => setSoundToast(null), 1200);
    return () => clearTimeout(t);
  }, [soundToast]);

  useEffect(() => {
    if (!skipToast) return;
    const t = setTimeout(() => setSkipToast(null), 900);
    return () => clearTimeout(t);
  }, [skipToast]);

  useEffect(() => {
    if (!rippleEffect) return;
    const t = setTimeout(() => setRippleEffect(null), 700);
    return () => clearTimeout(t);
  }, [rippleEffect]);

  // YouTube postMessage Helper
  const postToYt = useCallback((func, args = [], idx = currentIndex) => {
    const ifr = ytIframeRefs.current[idx];
    if (ifr && ifr.contentWindow) {
      try {
        ifr.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func, args }),
          '*'
        );
      } catch (_) {}
    }
  }, [currentIndex]);

  // Load YouTube IFrame API script once if not already present
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }
  }, []);

  // Listen to YouTube postMessage events (infoDelivery)
  useEffect(() => {
    const handleWindowMessage = (e) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (!data) return;

        if (data.event === 'infoDelivery' && data.info) {
          const info = data.info;
          if (typeof info.duration === 'number' && info.duration > 0) {
            setDuration(info.duration);
          }
          if (typeof info.currentTime === 'number' && !isScrubbingRef.current) {
            setCurrentTime(info.currentTime);
            if (info.duration > 0) {
              setProgress((info.currentTime / info.duration) * 100);
            }
          }
          if (typeof info.playerState === 'number') {
            // 1 = playing, 2 = paused, 0 = ended
            if (info.playerState === 1) setIsPlaying(true);
            else if (info.playerState === 2) setIsPlaying(false);
          }
        }
      } catch (_) {}
    };

    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, []);

  // Periodic active playback sync for YouTube & HTML5
  useEffect(() => {
    const interval = setInterval(() => {
      if (isScrubbingRef.current) return;

      if (isYt) {
        // Poll YouTube current time & duration
        postToYt('getCurrentTime', []);
        postToYt('getDuration', []);

        // Also check if YT.Player instance exists
        const player = ytPlayersRef.current[currentIndex];
        if (player && typeof player.getCurrentTime === 'function') {
          try {
            const ct = player.getCurrentTime();
            const dur = player.getDuration();
            if (typeof dur === 'number' && dur > 0) {
              setDuration(dur);
            }
            if (typeof ct === 'number') {
              setCurrentTime(ct);
              if (dur > 0) {
                setProgress((ct / dur) * 100);
              }
            }
          } catch (_) {}
        }
      } else {
        const vid = videoRefs.current[currentIndex];
        if (vid && vid.duration) {
          setCurrentTime(vid.currentTime);
          setDuration(vid.duration);
          setProgress((vid.currentTime / vid.duration) * 100);
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isYt, currentIndex, postToYt]);

  // Handle active video playback & mute synchronization when changing slides
  const lastIndexRef = useRef(currentIndex);
  useEffect(() => {
    const isNewSlide = lastIndexRef.current !== currentIndex;
    lastIndexRef.current = currentIndex;

    // Reset progress on slide change
    if (isNewSlide) {
      setProgress(0);
      setCurrentTime(0);
      setDuration(0);
      setScrubTime(0);
      setIsScrubbing(false);
      isScrubbingRef.current = false;
    }

    // HTML5 Video Playback
    Object.entries(videoRefs.current).forEach(([idx, vidEl]) => {
      if (!vidEl) return;
      if (parseInt(idx, 10) === currentIndex) {
        if (isNewSlide) vidEl.currentTime = 0;
        vidEl.muted = isMuted;
        if (!isMuted) vidEl.volume = 1.0;
        const p = vidEl.play();
        if (p !== undefined) {
          p.then(() => setIsPlaying(true)).catch(() => {
            // Autoplay fallback: mute and play
            vidEl.muted = true;
            setIsMuted(true);
            vidEl.play().catch(() => {});
          });
        }
      } else {
        vidEl.pause();
        vidEl.currentTime = 0;
      }
    });

    // YouTube Video Playback
    Object.entries(ytIframeRefs.current).forEach(([idx, ifrEl]) => {
      if (!ifrEl || !ifrEl.contentWindow) return;
      const i = parseInt(idx, 10);
      if (i === currentIndex) {
        try {
          ifrEl.contentWindow.postMessage(JSON.stringify({ event: 'listening' }), '*');
          ifrEl.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
          ifrEl.contentWindow.postMessage(JSON.stringify({ event: 'command', func: isMuted ? 'mute' : 'unMute', args: [] }), '*');
          if (!isMuted) {
            ifrEl.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [100] }), '*');
          }
        } catch (_) {}
      } else {
        try {
          ifrEl.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*');
          ifrEl.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [0, true] }), '*');
        } catch (_) {}
      }
    });
  }, [currentIndex, isMuted]);

  // Navigate to slide
  const goToIndex = useCallback((nextIdx) => {
    if (nextIdx < 0 || nextIdx >= normalizedVideos.length) return;
    setCurrentIndex(nextIdx);
    setDragOffsetY(0);
    setIsDraggingReel(false);
  }, [normalizedVideos.length]);

  const goNext = useCallback(() => {
    if (currentIndex < normalizedVideos.length - 1) {
      goToIndex(currentIndex + 1);
    } else {
      goToIndex(0); // loop back
    }
  }, [currentIndex, normalizedVideos.length, goToIndex]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      goToIndex(currentIndex - 1);
    } else {
      goToIndex(normalizedVideos.length - 1); // loop to end
    }
  }, [currentIndex, normalizedVideos.length, goToIndex]);

  // Toggle Sound (HTML5 + YouTube)
  const toggleSound = useCallback((e) => {
    if (e) e.stopPropagation();
    setIsMuted(prev => {
      const next = !prev;
      // HTML5 video
      const vid = videoRefs.current[currentIndex];
      if (vid) {
        vid.muted = next;
        if (!next) vid.volume = 1.0;
      }
      // YouTube
      postToYt(next ? 'mute' : 'unMute', []);
      if (!next) {
        postToYt('setVolume', [100]);
      }
      setSoundToast({
        muted: next,
        text: next ? 'Sound Muted' : 'Sound On',
      });
      return next;
    });
  }, [currentIndex, postToYt]);

  // Seek video helper (HTML5 + YouTube)
  const seekToTime = useCallback((targetSec) => {
    if (isYt) {
      postToYt('seekTo', [targetSec, true]);
      const player = ytPlayersRef.current[currentIndex];
      if (player && typeof player.seekTo === 'function') {
        try { player.seekTo(targetSec, true); } catch (_) {}
      }
    } else {
      const vid = videoRefs.current[currentIndex];
      if (vid) {
        vid.currentTime = targetSec;
      }
    }
  }, [isYt, currentIndex, postToYt]);

  // Skip seconds helper (+10s or -10s)
  const skipSeconds = useCallback((delta) => {
    const effDur = duration > 0 ? duration : 60;
    const newTime = Math.max(0, Math.min(effDur, currentTime + delta));

    setCurrentTime(newTime);
    if (effDur > 0) {
      setProgress((newTime / effDur) * 100);
    }
    seekToTime(newTime);

    setSkipToast({
      delta,
      text: delta > 0 ? `+${delta}s` : `${delta}s`,
    });
    setRippleEffect({
      side: delta > 0 ? 'right' : 'left',
      id: Date.now(),
    });
  }, [currentTime, duration, seekToTime]);

  // Toggle Play / Pause
  const togglePlayPause = useCallback(() => {
    if (isScrubbingRef.current) return;
    const nextPlay = !isPlaying;
    setIsPlaying(nextPlay);

    if (isYt) {
      postToYt(nextPlay ? 'playVideo' : 'pauseVideo', []);
    } else {
      const vid = videoRefs.current[currentIndex];
      if (vid) {
        if (nextPlay) vid.play().catch(() => {});
        else vid.pause();
      }
    }

    setPlayIndicator(nextPlay ? 'play' : 'pause');
    setTimeout(() => setPlayIndicator(null), 550);
  }, [isPlaying, isYt, postToYt, currentIndex]);

  // Like video toggle
  const handleLikeToggle = useCallback(async () => {
    if (!activeVideoUrl) return;
    const vidKey = `liked_${getCleanVideoId(activeVideoUrl)}`;
    const nextState = !isLikedRef.current;
    setIsLiked(nextState);
    try {
      localStorage.setItem(vidKey, String(nextState));
    } catch (_) {}

    setLikesCount(prev => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    try {
      await updateVideoLikes(activeVideoUrl, nextState ? 1 : -1);
    } catch (err) {
      console.warn('Error updating like:', err);
    }
  }, [activeVideoUrl]);

  // Share video handler
  const handleShare = async () => {
    const shareData = {
      title: 'Zamani Tours & Travels — Travel Reel',
      text: 'Watch this stunning travel highlight from Zamani Tours & Travels!',
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (_) {}
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2400);
      } catch (_) {}
    }
  };

  // Submit comment
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !activeVideoUrl) return;
    setSubmittingComment(true);
    const authorName = commentName.trim() || 'Travel Enthusiast';
    try {
      try { localStorage.setItem('zamani_user_name', authorName); } catch (_) {}
      await addVideoComment(activeVideoUrl, {
        name: authorName,
        text: commentText.trim(),
      });
      setCommentText('');
    } catch (err) {
      console.error('Error posting comment:', err);
      alert('Could not post comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (e.key === 'ArrowDown' || e.key === 'j' || e.key === 'J' || e.key === 'PageDown') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowUp' || e.key === 'k' || e.key === 'K' || e.key === 'PageUp') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        skipSeconds(-10);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        skipSeconds(10);
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleSound();
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        handleLikeToggle();
      } else if (e.key === 'Escape') {
        if (showComments) setShowComments(false);
        else onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev, skipSeconds, togglePlayPause, toggleSound, handleLikeToggle, showComments, onClose]);

  // Mouse wheel scroll navigation (Instagram Reels snap scroll)
  useEffect(() => {
    const handleWheel = (e) => {
      if (showComments && window.innerWidth <= 768) return;
      if (isScrubbingRef.current) return;
      if (isWheelLockedRef.current) return;

      if (Math.abs(e.deltaY) > 28) {
        isWheelLockedRef.current = true;
        if (e.deltaY > 0) {
          goNext();
        } else {
          goPrev();
        }
        setTimeout(() => {
          isWheelLockedRef.current = false;
        }, 460);
      }
    };

    const node = containerRef.current;
    if (node) {
      node.addEventListener('wheel', handleWheel, { passive: true });
      return () => node.removeEventListener('wheel', handleWheel);
    }
  }, [goNext, goPrev, showComments]);

  // Card Pointer Gestures: Tactile Vertical Drag + Tap/Double-Tap
  const handleCardPointerDown = (e) => {
    if (isScrubbingRef.current) return;
    if (e.button !== undefined && e.button !== 0) return;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: performance.now(),
      active: true,
    };
    setIsDraggingReel(false);
  };

  const handleCardPointerMove = (e) => {
    if (!dragStartRef.current.active || isScrubbingRef.current) return;
    const dy = e.clientY - dragStartRef.current.y;
    const dx = e.clientX - dragStartRef.current.x;

    if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
      setIsDraggingReel(true);
      // Smooth rubber-band resistance
      setDragOffsetY(dy * 0.7);
    }
  };

  const handleCardPointerUp = (e) => {
    if (!dragStartRef.current.active || isScrubbingRef.current) return;
    dragStartRef.current.active = false;

    const dy = e.clientY - dragStartRef.current.y;
    const dx = e.clientX - dragStartRef.current.x;
    const dt = performance.now() - dragStartRef.current.time;

    setDragOffsetY(0);

    // If it was a vertical swipe:
    if (isDraggingReel || Math.abs(dy) > 45) {
      setIsDraggingReel(false);
      if (dy < -45) {
        goNext();
      } else if (dy > 45) {
        goPrev();
      }
      return;
    }

    setIsDraggingReel(false);

    // If movement was small, it's a tap or double-tap!
    if (Math.abs(dx) < 14 && Math.abs(dy) < 14 && dt < 450) {
      const now = performance.now();
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const isDouble = (now - lastTapRef.current.time) < 320;

      lastTapRef.current = { time: now, x: e.clientX, y: e.clientY };

      if (isDouble) {
        // Cancel pending single tap play/pause
        if (singleTapTimerRef.current) {
          clearTimeout(singleTapTimerRef.current);
          singleTapTimerRef.current = null;
        }

        // Left 33% = -10s rewind
        if (clickX < rect.width * 0.32) {
          skipSeconds(-10);
        }
        // Right 33% = +10s forward
        else if (clickX > rect.width * 0.68) {
          skipSeconds(10);
        }
        // Center = Like video + Heart burst
        else {
          if (!isLikedRef.current) {
            handleLikeToggle();
          }
          setHeartAnimation(true);
          setTimeout(() => setHeartAnimation(false), 850);
        }
      } else {
        // Single tap: toggle play/pause after brief double-tap window
        singleTapTimerRef.current = setTimeout(() => {
          togglePlayPause();
          singleTapTimerRef.current = null;
        }, 220);
      }
    }
  };

  // Scrubber Pointer & Drag Helpers
  const formatTime = (secs) => {
    if (!secs || isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const updateSeekFromPointer = useCallback((e) => {
    if (!scrubberContainerRef.current) return;
    const rect = scrubberContainerRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const offsetX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const pct = Math.max(0, Math.min(100, (offsetX / rect.width) * 100));

    const effDuration = duration > 0 ? duration : (currentTime > 0 ? currentTime + 15 : 60);
    const targetTime = (pct / 100) * effDuration;

    setScrubTime(targetTime);
    setCurrentTime(targetTime);
    setProgress(pct);
    seekToTime(targetTime);
  }, [duration, currentTime, seekToTime]);

  const handleScrubberPointerDown = (e) => {
    e.stopPropagation();
    setIsScrubbing(true);
    isScrubbingRef.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    updateSeekFromPointer(e);
  };

  const handleScrubberPointerMove = (e) => {
    if (!isScrubbingRef.current) return;
    e.stopPropagation();
    updateSeekFromPointer(e);
  };

  const handleScrubberPointerUp = (e) => {
    if (!isScrubbingRef.current) return;
    e.stopPropagation();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
    setIsScrubbing(false);
    isScrubbingRef.current = false;

    // Resume video playback
    if (isPlaying) {
      if (isYt) postToYt('playVideo', []);
      else {
        const vid = videoRefs.current[currentIndex];
        if (vid) vid.play().catch(() => {});
      }
    }
  };

  const displayProgress = Math.max(0, Math.min(100, progress || 0));
  const activeDuration = duration > 0 ? duration : (currentTime > 0 ? currentTime + 10 : 0);

  return (
    <div
      className="reel-backdrop"
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Instagram Reels Viewer"
    >
      {/* Background blur overlay - Click to close */}
      <div className="reel-backdrop-overlay" onClick={onClose} />

      {/* Top Bar: Brand, counter, Sound and Close */}
      <div className="reel-top-bar">
        <div className="reel-brand-info">
          <div className="reel-avatar">
            <img
              src="/images/zamani-logo-white.png"
              alt="Zamani Tours & Travels"
              onError={e => { e.currentTarget.src = '/images/zamaniLogo.png'; }}
            />
          </div>
          <div>
            <h4>Zamani Tours &amp; Travels</h4>
            <span>Reel {currentIndex + 1} of {normalizedVideos.length}</span>
          </div>
        </div>

        <div className="reel-top-actions">
          <button
            type="button"
            className={`reel-icon-btn ${!isMuted ? 'active-audio' : ''}`}
            onClick={toggleSound}
            aria-label={isMuted ? 'Unmute video sound' : 'Mute video sound'}
            title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
          >
            {isMuted ? (
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                <line x1="23" y1="9" x2="17" y2="15"/>
                <line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            ) : (
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            )}
          </button>
          <button
            type="button"
            className="reel-close-btn"
            onClick={onClose}
            aria-label="Close reels viewer"
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Main Reels Viewport */}
      <div className="reel-viewport">
        {/* Desktop Navigation Floating Arrows */}
        <button
          type="button"
          className="reel-nav-btn reel-nav-prev"
          onClick={goPrev}
          aria-label="Previous reel"
          title="Previous (Up Arrow / K)"
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>

        <button
          type="button"
          className="reel-nav-btn reel-nav-next"
          onClick={goNext}
          aria-label="Next reel"
          title="Next (Down Arrow / J)"
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Video Card Container */}
        <div
          className="reel-card-wrapper"
          onPointerDown={handleCardPointerDown}
          onPointerMove={handleCardPointerMove}
          onPointerUp={handleCardPointerUp}
          onPointerCancel={handleCardPointerUp}
          style={{
            touchAction: 'none',
            userSelect: 'none',
          }}
        >
          {/* Quick Floating Sound Button directly on Reel Card */}
          <button
            type="button"
            className={`reel-floating-sound-btn ${!isMuted ? 'active-audio' : ''}`}
            onClick={toggleSound}
            aria-label={isMuted ? 'Unmute video sound' : 'Mute video sound'}
            title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
          >
            {isMuted ? (
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                <line x1="23" y1="9" x2="17" y2="15"/>
                <line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            ) : (
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            )}
          </button>

          {/* Quick Floating Close Button directly on Reel Card */}
          <button
            type="button"
            className="reel-floating-close-btn"
            onClick={onClose}
            aria-label="Close popup"
            title="Close (Esc)"
          >
            ✕
          </button>

          {/* Animated Sound Toast Overlay */}
          {soundToast && (
            <div className="reel-sound-toast" key={soundToast.text}>
              {soundToast.muted ? (
                <>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                    <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                    <line x1="23" y1="9" x2="17" y2="15"/>
                    <line x1="17" y1="9" x2="23" y2="15"/>
                  </svg>
                  <span>Sound Muted</span>
                </>
              ) : (
                <>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                  </svg>
                  <span>Sound On</span>
                </>
              )}
            </div>
          )}

          {/* Animated Skip Toast Overlay */}
          {skipToast && (
            <div className="reel-skip-toast" key={`${skipToast.text}-${Date.now()}`}>
              <span>{skipToast.text}</span>
            </div>
          )}

          {/* Double-tap side ripple indicator */}
          {rippleEffect && (
            <div className={`reel-side-ripple ${rippleEffect.side}`} key={rippleEffect.id}>
              <div className="reel-ripple-icon">
                {rippleEffect.side === 'left' ? '⏪ -10s' : '+10s ⏩'}
              </div>
            </div>
          )}

          {/* Center Play / Pause indicator flash */}
          {playIndicator && (
            <div className="reel-play-indicator">
              {playIndicator === 'play' ? (
                <svg width="42" height="42" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                <svg width="42" height="42" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              )}
            </div>
          )}

          {/* Vertical Reel Slider Track (Instagram smooth transitions) */}
          <div
            className="reel-slider-track"
            style={{
              transform: `translateY(calc(-${currentIndex * 100}% + ${dragOffsetY}px))`,
              transition: isDraggingReel ? 'none' : 'transform 0.42s cubic-bezier(0.18, 0.9, 0.28, 1)',
            }}
          >
            {normalizedVideos.map((src, idx) => {
              const isNearActive = Math.abs(currentIndex - idx) <= 1;
              const yt = parseYouTubeUrl(src);
              const isThisYt = Boolean(yt);
              const poster = getVideoPosterUrl(src) || (yt?.posterUrl || '');

              return (
                <div
                  className="reel-slide-item"
                  key={`${src}-${idx}`}
                  style={isThisYt ? { background: '#000000' } : undefined}
                >
                  {/* Poster Thumbnail Layer (Zero black frames) */}
                  {poster ? (
                    <img
                      src={poster}
                      alt={`Reel ${idx + 1}`}
                      loading={isNearActive ? 'eager' : 'lazy'}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        zIndex: 0,
                      }}
                    />
                  ) : null}

                  {isNearActive && (
                    isThisYt ? (
                      idx === currentIndex ? (
                        <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
                          <iframe
                            id={`yt-player-${idx}`}
                            ref={el => {
                              if (el) ytIframeRefs.current[idx] = el;
                              else delete ytIframeRefs.current[idx];
                            }}
                            src={`https://www.youtube-nocookie.com/embed/${yt.videoId}?enablejsapi=1&autoplay=1&mute=${isMuted ? 1 : 0}&playsinline=1&controls=0&rel=0&modestbranding=1&loop=1&playlist=${yt.videoId}&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
                            title={`YouTube Reel ${idx + 1}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            className="reel-video-element"
                            onLoad={(e) => {
                              try {
                                e.currentTarget.contentWindow.postMessage(
                                  JSON.stringify({ event: 'listening' }),
                                  '*'
                                );
                                e.currentTarget.contentWindow.postMessage(
                                  JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
                                  '*'
                                );
                                e.currentTarget.contentWindow.postMessage(
                                  JSON.stringify({ event: 'command', func: isMuted ? 'mute' : 'unMute', args: [] }),
                                  '*'
                                );
                              } catch (_) {}
                            }}
                            style={{
                              position: 'relative',
                              zIndex: 1,
                              width: '100%',
                              height: '100%',
                              border: 'none',
                              display: 'block',
                            }}
                          />
                        </div>
                      ) : null
                    ) : (
                      <video
                        ref={el => {
                          if (el) videoRefs.current[idx] = el;
                          else delete videoRefs.current[idx];
                        }}
                        src={src ? getAdaptiveVideoUrl(src, 'reel') : ''}
                        poster={poster || undefined}
                        loop
                        playsInline
                        webkit-playsinline="true"
                        x5-playsinline="true"
                        preload={idx === currentIndex ? 'auto' : 'metadata'}
                        onError={(e) => {
                          if (e.currentTarget.src !== src && src) {
                            e.currentTarget.src = src;
                            e.currentTarget.play().catch(() => {});
                          }
                        }}
                        className="reel-video-element"
                        style={{ position: 'relative', zIndex: 1 }}
                      />
                    )
                  )}
                </div>
              );
            })}
          </div>

          {/* Floating Heart burst animation on double tap */}
          {heartAnimation && (
            <div className="reel-heart-burst">
              <svg width="96" height="96" viewBox="0 0 24 24" fill="#ef4444" stroke="#ffffff" strokeWidth="1">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          )}

          {/* Reel Caption & Time Meta Overlay */}
          <div className="reel-caption-overlay" onClick={e => e.stopPropagation()}>
            <div className="reel-caption-text">
              <div className="reel-caption-meta-row">
                <span className="reel-tag">
                  {isYt ? '▶ YouTube Reel' : '✦ Zamani Experience'}
                </span>

                {/* Live Playback Time Badge + Quick 10s Skips */}
                <div className="reel-time-controls-row">
                  <button
                    type="button"
                    className="reel-mini-skip-btn"
                    onClick={(e) => { e.stopPropagation(); skipSeconds(-10); }}
                    title="Rewind 10s (Left Arrow)"
                    aria-label="Rewind 10 seconds"
                  >
                    ⏪ -10s
                  </button>

                  <span className="reel-time-badge">
                    {formatTime(currentTime)} / {formatTime(activeDuration)}
                  </span>

                  <button
                    type="button"
                    className="reel-mini-skip-btn"
                    onClick={(e) => { e.stopPropagation(); skipSeconds(10); }}
                    title="Forward 10s (Right Arrow)"
                    aria-label="Forward 10 seconds"
                  >
                    +10s ⏩
                  </button>
                </div>
              </div>
              <p>Explore breathtaking destinations, premium holiday packages &amp; seamless visa journeys.</p>
            </div>
          </div>

          {/* ─── Universal Interactive Scrubber & Draggable Playhead (HTML5 & YouTube) ─── */}
          <div
            className={`reel-scrubber-container ${isScrubbing ? 'is-scrubbing' : ''}`}
            ref={scrubberContainerRef}
            onPointerDown={handleScrubberPointerDown}
            onPointerMove={handleScrubberPointerMove}
            onPointerUp={handleScrubberPointerUp}
            onPointerCancel={handleScrubberPointerUp}
            onMouseEnter={() => setIsHoveringScrubber(true)}
            onMouseLeave={() => setIsHoveringScrubber(false)}
            onClick={(e) => {
              e.stopPropagation();
              updateSeekFromPointer(e);
            }}
            title="Click or drag playhead to seek anywhere"
            aria-label="Video timeline progress bar"
          >
            {/* Live seeking time tooltip above playhead */}
            {(isScrubbing || isHoveringScrubber) && (
              <div
                className="reel-scrubber-tooltip"
                style={{
                  left: `${Math.max(6, Math.min(94, displayProgress))}%`,
                }}
              >
                <span>{formatTime(isScrubbing ? scrubTime : currentTime)} / {formatTime(activeDuration)}</span>
              </div>
            )}

            <div className="reel-scrubber-track">
              {/* Progress filled line */}
              <div
                className="reel-scrubber-fill"
                style={{ width: `${displayProgress}%` }}
              />
              {/* Draggable Playhead Knob */}
              <div
                className="reel-scrubber-thumb"
                style={{ left: `${displayProgress}%` }}
                role="slider"
                aria-label="Video seek playhead"
                aria-valuenow={Math.round(displayProgress)}
                aria-valuemin="0"
                aria-valuemax="100"
              />
            </div>
          </div>

          {/* Side Interaction Actions (Instagram Reels Style) */}
          <div className="reel-actions-panel" onClick={e => e.stopPropagation()}>
            {/* Sound Toggle Action */}
            <div className="reel-action-group">
              <button
                type="button"
                className={`reel-action-btn ${!isMuted ? 'active-sound' : ''}`}
                onClick={toggleSound}
                aria-label={isMuted ? 'Unmute video sound' : 'Mute video sound'}
                title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
              >
                {isMuted ? (
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#ffffff" strokeWidth="2">
                    <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                    <line x1="23" y1="9" x2="17" y2="15"/>
                    <line x1="17" y1="9" x2="23" y2="15"/>
                  </svg>
                ) : (
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#d4af37" strokeWidth="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="rgba(212,175,55,0.2)"/>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                  </svg>
                )}
              </button>
              <span className="reel-action-count">{isMuted ? 'Muted' : 'Sound'}</span>
            </div>

            {/* Like Button */}
            <div className="reel-action-group">
              <button
                type="button"
                className={`reel-action-btn ${isLiked ? 'active' : ''}`}
                onClick={handleLikeToggle}
                aria-label="Like video"
                title="Like (L)"
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill={isLiked ? '#ef4444' : 'none'}
                  stroke={isLiked ? '#ef4444' : '#ffffff'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
              <span className="reel-action-count">{likesCount}</span>
            </div>

            {/* Comment Button */}
            <div className="reel-action-group">
              <button
                type="button"
                className={`reel-action-btn ${showComments ? 'active-comment' : ''}`}
                onClick={() => setShowComments(prev => !prev)}
                aria-label="Comments"
                title="View comments"
              >
                <svg
                  width="27"
                  height="27"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </button>
              <span className="reel-action-count">{comments.length}</span>
            </div>

            {/* Share Button */}
            <div className="reel-action-group">
              <button
                type="button"
                className="reel-action-btn"
                onClick={handleShare}
                aria-label="Share video"
                title="Share reel"
              >
                <svg
                  width="26"
                  height="26"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
              <span className="reel-action-count">{shareCopied ? 'Copied!' : 'Share'}</span>
            </div>
          </div>
        </div>

        {/* Real-Time Comments Drawer (Mobile Bottom Sheet / Desktop Side Panel) */}
        {showComments && (
          <div className="reel-comments-drawer" onClick={e => e.stopPropagation()}>
            <div className="reel-comments-head">
              <h3>
                Comments <span className="reel-comments-badge">{comments.length}</span>
              </h3>
              <button
                type="button"
                className="reel-comments-close"
                onClick={() => setShowComments(false)}
                aria-label="Close comments"
              >
                ✕
              </button>
            </div>

            <div className="reel-comments-list">
              {comments.length === 0 ? (
                <div className="reel-comments-empty">
                  <div className="reel-comments-empty-icon">💬</div>
                  <p>No comments yet.</p>
                  <span>Be the first to share your thoughts about this destination!</span>
                </div>
              ) : (
                comments.map(c => {
                  const initials = (c.name || 'U')
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                  const timeFormatted = c.createdAt instanceof Date
                    ? c.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Just now';

                  return (
                    <div className="reel-comment-card" key={c.id}>
                      <div className="reel-comment-avatar">{initials}</div>
                      <div className="reel-comment-content">
                        <div className="reel-comment-meta">
                          <strong>{c.name}</strong>
                          <span>{timeFormatted}</span>
                        </div>
                        <p>{c.text}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Comment Form */}
            <form className="reel-comment-form" onSubmit={handleCommentSubmit}>
              <input
                type="text"
                placeholder="Your Name"
                value={commentName}
                onChange={e => setCommentName(e.target.value)}
                className="reel-comment-name-input"
                maxLength={40}
                required
              />
              <div className="reel-comment-input-row">
                <input
                  type="text"
                  placeholder="Add a comment for this video..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  className="reel-comment-text-input"
                  maxLength={300}
                  required
                />
                <button
                  type="submit"
                  disabled={submittingComment || !commentText.trim()}
                  className="reel-comment-submit-btn"
                  aria-label="Post comment"
                >
                  {submittingComment ? (
                    '...'
                  ) : (
                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
