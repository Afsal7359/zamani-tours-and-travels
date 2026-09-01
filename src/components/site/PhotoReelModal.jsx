'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  subscribeToVideoComments,
  addVideoComment,
  subscribeToVideoLikes,
  updateVideoLikes,
  getCleanVideoId,
} from '@/lib/firestore';

export default function PhotoReelModal({
  photos = [],
  initialIndex = 0,
  categoryTitle = 'Zamani Photo Moments',
  onClose,
}) {
  // Normalize photo array: can be strings or objects { src, span, ... }
  const normalizedPhotos = (photos || []).map(p => (typeof p === 'string' ? p : p?.src || ''));
  const [currentIndex, setCurrentIndex] = useState(
    initialIndex >= 0 && initialIndex < normalizedPhotos.length ? initialIndex : 0
  );
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [heartAnimation, setHeartAnimation] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const isScrolling = useRef(false);
  const containerRef = useRef(null);

  const activePhotoUrl = normalizedPhotos[currentIndex] || '';

  // Load saved user name from localStorage
  useEffect(() => {
    try {
      const savedName = localStorage.getItem('zamani_user_name');
      if (savedName) setCommentName(savedName);
    } catch (e) {}
  }, []);

  // Update like status for current photo from localStorage
  useEffect(() => {
    if (!activePhotoUrl) return;
    try {
      const photoKey = `liked_${getCleanVideoId(activePhotoUrl)}`;
      setIsLiked(localStorage.getItem(photoKey) === 'true');
    } catch (e) {
      setIsLiked(false);
    }
  }, [activePhotoUrl]);

  // Subscribe to real-time likes
  useEffect(() => {
    if (!activePhotoUrl) return;
    const unsub = subscribeToVideoLikes(activePhotoUrl, (count) => {
      setLikesCount(count);
    });
    return () => unsub();
  }, [activePhotoUrl]);

  // Subscribe to real-time comments
  useEffect(() => {
    if (!activePhotoUrl) return;
    const unsub = subscribeToVideoComments(activePhotoUrl, (items) => {
      setComments(items);
    });
    return () => unsub();
  }, [activePhotoUrl]);

  const goToIndex = useCallback((nextIdx) => {
    if (nextIdx < 0 || nextIdx >= normalizedPhotos.length) return;
    setCurrentIndex(nextIdx);
  }, [normalizedPhotos.length]);

  const goNext = useCallback(() => {
    if (currentIndex < normalizedPhotos.length - 1) {
      goToIndex(currentIndex + 1);
    } else {
      goToIndex(0); // loop back
    }
  }, [currentIndex, normalizedPhotos.length, goToIndex]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      goToIndex(currentIndex - 1);
    } else {
      goToIndex(normalizedPhotos.length - 1); // loop to last
    }
  }, [currentIndex, normalizedPhotos.length, goToIndex]);

  // Mouse wheel scroll navigation
  useEffect(() => {
    const handleWheel = (e) => {
      if (showComments && window.innerWidth <= 768) return;
      if (isScrolling.current) return;
      if (Math.abs(e.deltaY) > 30) {
        isScrolling.current = true;
        if (e.deltaY > 0) {
          goNext();
        } else {
          goPrev();
        }
        setTimeout(() => {
          isScrolling.current = false;
        }, 450);
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
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'j') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'k') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'Escape') {
        if (showComments) {
          setShowComments(false);
        } else {
          onClose();
        }
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

  // Touch Swipe Handlers for Mobile (Vertical & Horizontal swipe)
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndY.current = e.touches[0].clientY;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diffY = touchStartY.current - touchEndY.current;
    const diffX = touchStartX.current - touchEndX.current;

    // Prefer vertical swipe (Reels style) or horizontal swipe
    if (Math.abs(diffY) > 50 && Math.abs(diffY) > Math.abs(diffX)) {
      if (diffY > 0) goNext();
      else goPrev();
    } else if (Math.abs(diffX) > 60) {
      if (diffX > 0) goNext();
      else goPrev();
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
    if (!activePhotoUrl) return;
    const photoKey = `liked_${getCleanVideoId(activePhotoUrl)}`;
    const nextState = !isLiked;
    setIsLiked(nextState);
    try {
      localStorage.setItem(photoKey, String(nextState));
    } catch (e) {}

    // Optimistic UI update
    setLikesCount(prev => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    // Firestore sync
    try {
      await updateVideoLikes(activePhotoUrl, nextState ? 1 : -1);
    } catch (err) {
      console.warn('Error updating like:', err);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !activePhotoUrl) return;
    setSubmittingComment(true);
    const authorName = commentName.trim() || 'Travel Enthusiast';
    try {
      try {
        localStorage.setItem('zamani_user_name', authorName);
      } catch (e) {}

      await addVideoComment(activePhotoUrl, {
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
      title: `Zamani Tours & Travels — ${categoryTitle}`,
      text: 'Check out this photo moment from Zamani Tours & Travels!',
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

  return (
    <div
      className="reel-backdrop photo-reel-backdrop"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background blur overlay */}
      <div className="reel-backdrop-overlay" onClick={onClose} />

      {/* Top Bar */}
      <div className="reel-top-bar">
        <div className="reel-brand-info">
          <div className="reel-avatar">Z</div>
          <div>
            <h4>Zamani Tours &amp; Travels</h4>
            <span>{categoryTitle} • {currentIndex + 1} of {normalizedPhotos.length}</span>
          </div>
        </div>
        <div className="reel-top-actions">
          <button
            type="button"
            className="reel-close-btn"
            onClick={onClose}
            aria-label="Close photo reels"
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Main Reels Viewport */}
      <div className="reel-viewport photo-reel-viewport">
        {/* Desktop Up / Down floating arrows */}
        <button
          type="button"
          className="reel-nav-btn reel-nav-prev"
          onClick={goPrev}
          aria-label="Previous photo"
          title="Previous (Up/Left Arrow)"
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>

        <button
          type="button"
          className="reel-nav-btn reel-nav-next"
          onClick={goNext}
          aria-label="Next photo"
          title="Next (Down/Right Arrow)"
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Photo Card Container */}
        <div className="reel-card-wrapper photo-reel-card-wrapper">
          <div
            className="reel-slider-track"
            style={{ transform: `translateY(-${currentIndex * 100}%)` }}
          >
            {normalizedPhotos.map((src, idx) => (
              <div
                className="reel-slide-item photo-reel-slide-item"
                key={`${src}-${idx}`}
                onDoubleClick={handleDoubleTap}
              >
                {/* Image element */}
                <img
                  src={src}
                  alt={`Zamani gallery photo ${idx + 1}`}
                  className="photo-reel-img"
                  loading={Math.abs(currentIndex - idx) <= 2 ? 'eager' : 'lazy'}
                />
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

          {/* Reel Bottom Caption Overlay */}
          <div className="reel-caption-overlay">
            <div className="reel-caption-text">
              <span className="reel-tag">✦ {categoryTitle}</span>
              <p>Swipe or scroll down to browse through all moments &amp; memories.</p>
            </div>
          </div>

          {/* Side Interaction Actions */}
          <div className="reel-actions-panel" onClick={e => e.stopPropagation()}>
            {/* Like Button */}
            <div className="reel-action-group">
              <button
                type="button"
                className={`reel-action-btn ${isLiked ? 'active' : ''}`}
                onClick={handleLikeToggle}
                aria-label="Like photo"
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
                aria-label="Share photo"
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

        {/* Real-time Comments Drawer */}
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
                  <span>Be the first to share your thoughts or memory about this photo!</span>
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
                  placeholder="Add a comment for this photo..."
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
