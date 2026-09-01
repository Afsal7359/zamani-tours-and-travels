'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  subscribeToVideoComments,
  addVideoComment,
  subscribeToVideoLikes,
  updateVideoLikes,
  getCleanVideoId,
} from '@/lib/firestore';

export default function ReelModal({ videos = [], initialIndex = 0, onClose }) {
  // Normalize videos array to string URLs
  const normalizedVideos = (videos || [])
    .map(v => (typeof v === 'string' ? v : (v?.src || v?.url || '')))
    .filter(Boolean);

  const [currentIndex, setCurrentIndex] = useState(
    initialIndex >= 0 && initialIndex < normalizedVideos.length ? initialIndex : 0
  );
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
  const [progress, setProgress] = useState(0);

  const videoRefs = useRef({});
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  const isScrolling = useRef(false);
  const containerRef = useRef(null);

  const activeVideoUrl = normalizedVideos[currentIndex] || '';

  // Load saved user name from localStorage if available
  useEffect(() => {
    try {
      const savedName = localStorage.getItem('zamani_user_name');
      if (savedName) setCommentName(savedName);
    } catch (e) {}
  }, []);

  // Update like status for current video from localStorage
  useEffect(() => {
    if (!activeVideoUrl) return;
    try {
      const vidKey = `liked_${getCleanVideoId(activeVideoUrl)}`;
      setIsLiked(localStorage.getItem(vidKey) === 'true');
    } catch (e) {
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

  // Handle active video playback
  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([idx, vidEl]) => {
      if (!vidEl) return;
      if (parseInt(idx, 10) === currentIndex) {
        vidEl.currentTime = 0;
        vidEl.muted = isMuted;
        const playPromise = vidEl.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch(() => {
              // Autoplay policy fallback: mute and play
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
  }, [currentIndex, isMuted]);

  const goToIndex = useCallback((nextIdx) => {
    if (nextIdx < 0 || nextIdx >= normalizedVideos.length) return;
    setCurrentIndex(nextIdx);
    setProgress(0);
  }, [normalizedVideos.length]);

  const goNext = useCallback(() => {
    if (currentIndex < normalizedVideos.length - 1) {
      goToIndex(currentIndex + 1);
    } else {
      goToIndex(0); // loop back to first
    }
  }, [currentIndex, normalizedVideos.length, goToIndex]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      goToIndex(currentIndex - 1);
    } else {
      goToIndex(normalizedVideos.length - 1); // loop to last
    }
  }, [currentIndex, normalizedVideos.length, goToIndex]);

  // Mouse wheel scroll navigation (debounced)
  useEffect(() => {
    const handleWheel = (e) => {
      if (showComments && window.innerWidth <= 768) return; // allow scrolling inside comments modal on mobile
      if (isScrolling.current) return;
      if (Math.abs(e.deltaY) > 35) {
        isScrolling.current = true;
        if (e.deltaY > 0) {
          goNext();
        } else {
          goPrev();
        }
        setTimeout(() => {
          isScrolling.current = false;
        }, 550);
      }
    };

    const node = containerRef.current;
    if (node) {
      node.addEventListener('wheel', handleWheel, { passive: true });
      return () => node.removeEventListener('wheel', handleWheel);
    }
  }, [goNext, goPrev, showComments]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept typing in inputs
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'Escape') {
        if (showComments) {
          setShowComments(false);
        } else {
          onClose();
        }
      } else if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'm' || e.key === 'M') {
        setIsMuted(prev => !prev);
      } else if (e.key === 'l' || e.key === 'L') {
        handleLikeToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev, showComments, onClose]);

  // Lock background body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Touch Swipe Handlers for Mobile
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    const diff = touchStartY.current - touchEndY.current;
    if (Math.abs(diff) > 55) {
      if (diff > 0) {
        goNext();
      } else {
        goPrev();
      }
    }
  };

  const togglePlayPause = () => {
    const vid = videoRefs.current[currentIndex];
    if (!vid) return;
    if (vid.paused) {
      vid.play();
      setIsPlaying(true);
    } else {
      vid.pause();
      setIsPlaying(false);
    }
  };

  const handleDoubleTap = (e) => {
    e.stopPropagation();
    if (!isLiked) {
      handleLikeToggle();
    }
    setHeartAnimation(true);
    setTimeout(() => setHeartAnimation(false), 900);
  };

  const handleLikeToggle = async () => {
    if (!activeVideoUrl) return;
    const vidKey = `liked_${getCleanVideoId(activeVideoUrl)}`;
    const nextState = !isLiked;
    setIsLiked(nextState);
    try {
      localStorage.setItem(vidKey, String(nextState));
    } catch (e) {}

    // Optimistic UI update
    setLikesCount(prev => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    // Firestore sync
    try {
      await updateVideoLikes(activeVideoUrl, nextState ? 1 : -1);
    } catch (err) {
      console.warn('Error updating like:', err);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !activeVideoUrl) return;
    setSubmittingComment(true);
    const authorName = commentName.trim() || 'Travel Enthusiast';
    try {
      try {
        localStorage.setItem('zamani_user_name', authorName);
      } catch (e) {}

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

  const handleShare = async () => {
    const shareData = {
      title: 'Zamani Tours & Travels — Journey Highlight',
      text: 'Check out this travel reel from Zamani Tours & Travels!',
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {}
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2500);
      } catch (err) {}
    }
  };

  const handleTimeUpdate = (e) => {
    const vid = e.currentTarget;
    if (vid && vid.duration) {
      setProgress((vid.currentTime / vid.duration) * 100);
    }
  };

  return (
    <div
      className="reel-backdrop"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background blur overlay */}
      <div className="reel-backdrop-overlay" onClick={onClose} />

      {/* Top Bar: Brand, counter, and Close */}
      <div className="reel-top-bar">
        <div className="reel-brand-info">
          <div className="reel-avatar">Z</div>
          <div>
            <h4>Zamani Tours &amp; Travels</h4>
            <span>Reel {currentIndex + 1} of {normalizedVideos.length}</span>
          </div>
        </div>
        <div className="reel-top-actions">
          <button
            type="button"
            className="reel-icon-btn"
            onClick={() => setIsMuted(prev => !prev)}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
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
            aria-label="Close reels"
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
          title="Previous (Up Arrow)"
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
          title="Next (Down Arrow)"
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Video Card Container */}
        <div className="reel-card-wrapper">
          <div
            className="reel-slider-track"
            style={{ transform: `translateY(-${currentIndex * 100}%)` }}
          >
            {normalizedVideos.map((src, idx) => (
              <div
                className="reel-slide-item"
                key={`${src}-${idx}`}
                onDoubleClick={handleDoubleTap}
                onClick={togglePlayPause}
              >
                <video
                  ref={el => (videoRefs.current[idx] = el)}
                  src={src}
                  loop
                  playsInline
                  preload={Math.abs(currentIndex - idx) <= 1 ? 'auto' : 'none'}
                  onTimeUpdate={idx === currentIndex ? handleTimeUpdate : undefined}
                  className="reel-video-element"
                />

                {/* Big play icon overlay when paused */}
                {!isPlaying && idx === currentIndex && (
                  <div className="reel-play-indicator">
                    <svg width="40" height="40" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Floating Heart burst animation on double tap */}
          {heartAnimation && (
            <div className="reel-heart-burst">
              <svg width="90" height="90" viewBox="0 0 24 24" fill="#ef4444" stroke="#ffffff" strokeWidth="1">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          )}

          {/* Progress Bar on active video */}
          <div className="reel-progress-bar">
            <div className="reel-progress-fill" style={{ width: `${progress}%` }} />
          </div>

          {/* Reel Bottom Caption Overlay */}
          <div className="reel-caption-overlay">
            <div className="reel-caption-text">
              <span className="reel-tag">✦ Zamani Travel Experience</span>
              <p>Explore breathtaking destinations, premium holiday packages &amp; seamless visa journeys.</p>
            </div>
          </div>

          {/* Side Interaction Actions (Instagram Reels Style) */}
          <div className="reel-actions-panel" onClick={e => e.stopPropagation()}>
            {/* Like Button */}
            <div className="reel-action-group">
              <button
                type="button"
                className={`reel-action-btn ${isLiked ? 'active' : ''}`}
                onClick={handleLikeToggle}
                aria-label="Like video"
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

        {/* Real-time Comments Drawer (Mobile Bottom Sheet / Desktop Side Panel) */}
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
