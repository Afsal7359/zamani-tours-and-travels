/**
 * Universal Video & Thumbnail Helper Utilities for Zamani Tours & Travels
 * Ensures fast loading, instant poster thumbnails, zero black frames, and smooth playback.
 */

export function isVideoUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return /\.(mp4|webm|mov|m4v|ogg|avi|mkv)($|\?)/i.test(url) || url.includes('/video/upload/');
}

export function getVideoPosterUrl(url) {
  if (!url || typeof url !== 'string') return '';
  // Cloudinary video instant poster generation at second 0
  if (url.includes('cloudinary.com') && url.includes('/video/upload/')) {
    const transformed = url.replace(
      /\/video\/upload(\/[a-zA-Z0-9_,]+)*\//,
      '/video/upload/so_0,f_auto,q_auto,w_640/'
    );
    return transformed.replace(/\.[a-zA-Z0-9]+(\?.*)?$/, '.jpg$1');
  }
  return '';
}

export function getOptimizedVideoUrl(url) {
  if (!url || typeof url !== 'string') return '';
  // Optimize Cloudinary streaming delivery with fast bitrate & resolution optimization
  if (url.includes('cloudinary.com') && url.includes('/video/upload/')) {
    if (!url.includes('f_auto') && !url.includes('q_auto') && !url.includes('so_0')) {
      return url.replace(
        /\/video\/upload\//,
        '/video/upload/f_auto,q_auto,w_720,vc_h264/'
      );
    }
  }
  return url;
}
