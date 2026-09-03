/**
 * Universal Video & Thumbnail Helper Utilities for Zamani Tours & Travels
 * Ensures fast loading, instant poster thumbnails, zero black frames, and smooth playback.
 */

export function isVideoUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return /\.(mp4|webm|mov|m4v|ogg|avi|mkv)($|\?)/i.test(url) || url.includes('/video/upload/') || url.includes('/upload/');
}

export function getVideoPosterUrl(url) {
  if (!url || typeof url !== 'string') return '';
  if (url.includes('cloudinary.com')) {
    try {
      let uploadPath = '/video/upload/';
      if (!url.includes('/video/upload/') && url.includes('/upload/')) {
        uploadPath = '/upload/';
      }
      if (url.includes(uploadPath)) {
        const parts = url.split(uploadPath);
        if (parts.length === 2) {
          let after = parts[1];
          // If after has existing transformation segment (e.g. f_auto,q_auto/ or similar), strip it
          if (/^(?:[a-zA-Z0-9_,]+(?:\/[a-zA-Z0-9_,]+)*\/)(?:v\d+\/|zamani\/|[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+)/.test(after) && !/^v\d+\//.test(after) && !after.startsWith('zamani/')) {
            const slashIdx = after.indexOf('/');
            if (slashIdx !== -1) {
              after = after.slice(slashIdx + 1);
            }
          }
          const poster = `${parts[0]}/video/upload/so_0,f_auto,q_auto,w_640/${after}`;
          return poster.replace(/\.(mp4|webm|mov|m4v|avi|mkv|ogg)($|\?)/i, '.jpg$2');
        }
      }
    } catch (e) {
      console.warn('Error constructing poster url:', e);
    }
  }
  return '';
}

export function getOptimizedVideoUrl(url) {
  if (!url || typeof url !== 'string') return '';
  if (url.includes('cloudinary.com') && url.includes('/video/upload/')) {
    try {
      const parts = url.split('/video/upload/');
      if (parts.length === 2) {
        const after = parts[1];
        // Only inject f_auto,q_auto,w_720 if no transformations already exist
        if (/^(?:v\d+\/|zamani\/|[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+)/.test(after)) {
          return `${parts[0]}/video/upload/f_auto,q_auto,w_720/${after}`;
        }
      }
    } catch (e) {}
  }
  return url;
}
