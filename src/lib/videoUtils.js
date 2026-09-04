/**
 * Universal Video & Thumbnail Helper Utilities for Zamani Tours & Travels
 * Ensures fast loading, instant poster thumbnails, zero black frames, and smooth autoplay playback.
 */

export function isVideoUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return (
    /\.(mp4|webm|mov|m4v|ogg|avi|mkv)($|\?)/i.test(url) ||
    url.includes('/video/upload/') ||
    (url.includes('cloudinary.com') && url.includes('/upload/'))
  );
}

/**
 * Parse and normalize Cloudinary video URL components
 */
export function parseCloudinaryVideoUrl(url) {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return null;
  let uploadPattern = '/video/upload/';
  if (!url.includes('/video/upload/') && url.includes('/upload/')) {
    uploadPattern = '/upload/';
  }
  if (!url.includes(uploadPattern)) return null;

  const parts = url.split(uploadPattern);
  if (parts.length < 2) return null;
  const baseUrl = parts[0];
  const tail = parts.slice(1).join(uploadPattern);

  // Match version prefix (e.g. v1712345678/...) if present
  const matchVersion = tail.match(/(v\d+\/.+)$/);
  let cleanTail = tail;
  if (matchVersion) {
    cleanTail = matchVersion[1];
  } else {
    // If no v\d+/, check if the first segment is a transformation string (e.g. f_auto,q_auto)
    const segments = tail.split('/');
    if (
      segments.length > 1 &&
      /^(?:f_|q_|w_|h_|c_|so_|vc_|br_|e_|b_|co_|fl_|g_|[a-z0-9_]+,[a-z0-9_]+)/i.test(segments[0])
    ) {
      cleanTail = segments.slice(1).join('/');
    }
  }

  return { baseUrl, cleanTail };
}

/**
 * Generates an instant high-quality static poster image from Cloudinary video (at second 0)
 */
export function getVideoPosterUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const parsed = parseCloudinaryVideoUrl(url);
  if (parsed) {
    const { baseUrl, cleanTail } = parsed;
    const jpgTail = cleanTail.replace(/\.(mp4|webm|mov|m4v|avi|mkv|ogg)($|\?)/i, '.jpg$2');
    return `${baseUrl}/video/upload/so_0,f_auto,q_auto:good,w_640/${jpgTail}`;
  }
  return '';
}

/**
 * Generates an optimized, fast-streaming video URL from Cloudinary.
 * Mode:
 *  - 'preview' / 'marquee': lightweight (w_480, compressed for instant smooth autoplay with 0 lag)
 *  - 'reel' / 'hd': high quality (w_1080) for full screen reels
 */
export function getOptimizedVideoUrl(url, mode = 'preview') {
  if (!url || typeof url !== 'string') return '';
  const parsed = parseCloudinaryVideoUrl(url);
  if (parsed) {
    const { baseUrl, cleanTail } = parsed;
    if (mode === 'preview' || mode === 'marquee') {
      return `${baseUrl}/video/upload/f_auto,q_auto:eco,vc_auto,w_480/${cleanTail}`;
    }
    return `${baseUrl}/video/upload/f_auto,q_auto:good,w_1080/${cleanTail}`;
  }
  return url;
}
