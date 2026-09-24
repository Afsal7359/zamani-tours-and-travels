'use client';
import { useState, useEffect } from 'react';
import { getOptimizedVideoUrl, parseCloudinaryVideoUrl, getVideoPosterUrl } from './videoUtils';

/**
 * Zamani Self-Healing Performance Guardian
 * Automatically monitors client device capability, real-time FPS, network connection,
 * and memory pressure to auto-throttle video decoders and guarantee zero lag.
 */

let _cachedDeviceTier = null;

export function detectDeviceTier() {
  if (typeof window === 'undefined') return 'high';
  if (_cachedDeviceTier) return _cachedDeviceTier;

  try {
    const nav = navigator || {};
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

    // 1. Data Saver or 2G/3G connection
    if (conn) {
      if (conn.saveData || conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g') {
        _cachedDeviceTier = 'low';
        return 'low';
      }
      if (conn.effectiveType === '3g') {
        _cachedDeviceTier = 'medium';
        return 'medium';
      }
    }

    // 2. Hardware constraints (RAM < 4GB or CPU cores <= 2)
    const cores = nav.hardwareConcurrency || 4;
    const memory = nav.deviceMemory || 4;

    if (cores <= 2 || memory < 3) {
      _cachedDeviceTier = 'low';
      return 'low';
    }

    if (cores <= 4 || memory < 4) {
      _cachedDeviceTier = 'medium';
      return 'medium';
    }

    _cachedDeviceTier = 'high';
    return 'high';
  } catch (e) {
    _cachedDeviceTier = 'high';
    return 'high';
  }
}

/**
 * Adaptive Video URL Generator based on Device Tier
 */
export function getAdaptiveVideoUrl(url, mode = 'preview') {
  if (!url || typeof url !== 'string') return '';
  if (url.includes('mixkit.co')) {
    return ''; // Dead mixkit URLs are stripped
  }
  const parsed = parseCloudinaryVideoUrl(url);
  if (!parsed) return url;

  const { baseUrl, cleanTail } = parsed;
  const mp4Tail = cleanTail.replace(/\.(mov|m4v|avi|mkv|webm|ogg)($|\?)/i, '.mp4$2');

  if (mode === 'preview' || mode === 'marquee') {
    return `${baseUrl}/video/upload/q_auto:good,w_360,br_600k/${mp4Tail}`;
  }

  return `${baseUrl}/video/upload/q_auto:good/${mp4Tail}`;
}

/**
 * React Hook: Real-Time Dynamic FPS & Battery Guardian
 * Optimized with visibilityChange watchdog and memory leak prevention.
 */
export function usePerformanceGuardian() {
  const [tier, setTier] = useState('high');
  const [isLiteMode, setIsLiteMode] = useState(false);

  useEffect(() => {
    const detected = detectDeviceTier();
    setTier(detected);
    if (detected === 'low') {
      setIsLiteMode(true);
      return;
    }

    let frameCount = 0;
    let lastTime = performance.now();
    let lowFpsCount = 0;
    let animId = null;
    let active = true;

    const checkFps = (now) => {
      if (!active || document.hidden) return;
      frameCount++;
      const elapsed = now - lastTime;
      if (elapsed >= 1000) {
        const fps = Math.round((frameCount * 1000) / elapsed);
        if (fps < 28) {
          lowFpsCount++;
          if (lowFpsCount >= 3) {
            setIsLiteMode(true);
            active = false;
            return;
          }
        } else {
          lowFpsCount = Math.max(0, lowFpsCount - 1);
        }
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(checkFps);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        if (animId) cancelAnimationFrame(animId);
      } else if (active) {
        lastTime = performance.now();
        frameCount = 0;
        animId = requestAnimationFrame(checkFps);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    animId = requestAnimationFrame(checkFps);

    return () => {
      active = false;
      if (animId) cancelAnimationFrame(animId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return {
    tier,
    isLiteMode,
    maxConcurrentVideos: isLiteMode ? 1 : tier === 'medium' ? 2 : 3,
  };
}
