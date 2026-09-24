/**
 * Universal Video & Thumbnail Helper Utilities for Zamani Tours & Travels
 * Ensures fast loading, instant poster thumbnails, zero black frames, robust Cloudinary/Firebase URL handling,
 * and smooth autoplay across all devices.
 */

/**
 * Accurately detects if a URL points to a video file or video stream.
 * Handles encoded URLs, query params (Firebase Storage tokens, Cloudinary resource_type),
 * and all common video formats (MP4, MOV, WebM, M4V, etc.).
 */
export function isVideoUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const decoded = decodeURIComponent(url).toLowerCase().trim();
    
    // Direct video format extension check
    if (/\.(mp4|webm|mov|m4v|ogg|ogv|avi|mkv|3gp|flv|wmv|m4p|quicktime)($|\?|#)/i.test(decoded)) {
      return true;
    }
    
    // Cloudinary video upload path check
    if (decoded.includes('/video/upload/') || decoded.includes('resource_type=video')) {
      return true;
    }
    
    // Mixkit / CDN video sources
    if (decoded.includes('mixkit.co/videos') || decoded.includes('assets.mixkit.co')) {
      return true;
    }
  } catch (e) {
    // In case decodeURIComponent fails on malformed characters
    return /\.(mp4|webm|mov|m4v|ogg|avi|mkv)($|\?)/i.test(url) || url.includes('/video/upload/');
  }
  
  return false;
}

/**
 * Parse and normalize Cloudinary video & image URL components.
 * Strips existing transformations cleanly while preserving folder paths and version tags.
 */
/**
 * Parse and normalize Cloudinary video & image URL components.
 * Strips existing transformations cleanly while preserving folder paths and version tags.
 */
export function parseCloudinaryUrl(url, expectedType = 'auto') {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return null;

  let uploadPattern = '/upload/';
  let detectedType = 'image';

  if (url.includes('/video/upload/')) {
    uploadPattern = '/video/upload/';
    detectedType = 'video';
  } else if (url.includes('/image/upload/')) {
    uploadPattern = '/image/upload/';
    detectedType = 'image';
  } else if (url.includes('/raw/upload/')) {
    uploadPattern = '/raw/upload/';
    detectedType = 'raw';
  }

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
    // If no version prefix, strip out known transformation tokens from the first path segments
    const segments = tail.split('/');
    let startIndex = 0;
    
    while (
      startIndex < segments.length &&
      /^(?:[a-z0-9_]+:[a-z0-9_:]+|[a-z0-9_]+,[a-z0-9_:]+|f_[a-z0-9]+|q_[a-z0-9:]+|w_\d+|h_\d+|c_[a-z]+|so_\d+|vc_[a-z0-9]+|br_[a-z0-9]+|e_[a-z0-9_]+|b_[a-z0-9_]+|co_[a-z0-9_]+|fl_[a-z0-9_]+|g_[a-z0-9_]+|[a-z0-9_,-]+)/i.test(segments[startIndex]) &&
      !segments[startIndex].includes('.') &&
      !segments[startIndex].startsWith('zamani') &&
      !segments[startIndex].startsWith('uploads')
    ) {
      startIndex++;
    }
    
    cleanTail = segments.slice(startIndex).join('/') || tail;
  }

  return { baseUrl, cleanTail, detectedType };
}

/**
 * Backward-compatible Cloudinary video parser
 */
export function parseCloudinaryVideoUrl(url) {
  const res = parseCloudinaryUrl(url, 'video');
  if (res) return { baseUrl: res.baseUrl, cleanTail: res.cleanTail };
  return null;
}

/**
 * Helper to extract media URL from any itinerary step structure safely
 */
export function getItineraryMedia(step) {
  if (!step) return '';
  if (typeof step === 'string') return step.trim();
  return (
    step.image ||
    step.photo ||
    step.img ||
    step.src ||
    step.imageUrl ||
    step.image_url ||
    step.url ||
    step.media ||
    step.picture ||
    ''
  ).trim();
}

/**
 * Generates an instant high-quality static poster image from video.
 * For Cloudinary videos, extracts the exact first frame (second 0) as optimized JPEG.
 * For other video hosts, returns a clean fallback.
 */
export function getVideoPosterUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  
  if (trimmed.includes('cloudinary.com')) {
    const parsed = parseCloudinaryUrl(trimmed, 'video');
    if (parsed) {
      const { baseUrl, cleanTail } = parsed;
      // Replace video extension with .jpg for instant Cloudinary static thumbnail
      const jpgTail = cleanTail.replace(/\.(mp4|webm|mov|m4v|avi|mkv|ogg|3gp|flv)($|\?)/i, '.jpg$2');
      return `${baseUrl}/video/upload/so_0,f_auto,q_auto:good,w_600/${jpgTail}`;
    }
  }

  // If already an image, return optimized
  if (!isVideoUrl(trimmed)) {
    return getOptimizedImageUrl(trimmed, 600);
  }

  return '';
}

/**
 * Generates an ultra-fast, lightweight WebP/AVIF CDN image URL from Cloudinary.
 * Reduces large photos down to ~30-50KB for instant 0ms rendering while preserving crisp details.
 * Safely passes through external and Firebase Storage URLs.
 */
export function getOptimizedImageUrl(url, width = 800) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // If passed a video URL, automatically get its static poster frame
  if (isVideoUrl(trimmed)) {
    const poster = getVideoPosterUrl(trimmed);
    if (poster) return poster;
  }

  // Handle Cloudinary images
  if (trimmed.includes('cloudinary.com')) {
    const parsed = parseCloudinaryUrl(trimmed, 'image');
    if (parsed) {
      const { baseUrl, cleanTail } = parsed;
      // Ensure unrenderable formats on mobile (HEIC, TIFF) are requested as .jpg from Cloudinary
      const safeTail = cleanTail.replace(/\.(heic|heif|tiff|bmp)($|\?)/i, '.jpg$2');
      return `${baseUrl}/image/upload/f_auto,q_auto:good,w_${width},c_limit/${safeTail}`;
    }
  }

  // Handle Unsplash images
  if (trimmed.includes('images.unsplash.com')) {
    try {
      const u = new URL(trimmed);
      u.searchParams.set('w', String(width));
      u.searchParams.set('q', '80');
      u.searchParams.set('auto', 'format');
      return u.toString();
    } catch (e) {
      return trimmed;
    }
  }

  return trimmed;
}

/**
 * Generates a clean, reliable, fast-streaming video URL with universal codec compatibility.
 */
export function getOptimizedVideoUrl(url, mode = 'preview') {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  
  if (trimmed.includes('mixkit.co') && trimmed.includes('-large.mp4') && (mode === 'preview' || mode === 'marquee')) {
    return trimmed.replace('-large.mp4', '-small.mp4');
  }

  if (trimmed.includes('cloudinary.com')) {
    const parsed = parseCloudinaryUrl(trimmed, 'video');
    if (parsed) {
      const { baseUrl, cleanTail } = parsed;
      const mp4Tail = cleanTail.replace(/\.(mov|m4v|avi|mkv|webm|ogg)($|\?)/i, '.mp4$2');
      if (mode === 'preview' || mode === 'marquee') {
        return `${baseUrl}/video/upload/q_auto:good,w_360,br_600k/${mp4Tail}`;
      }
      return `${baseUrl}/video/upload/q_auto:good,w_1080/${mp4Tail}`;
    }
  }

  return trimmed;
}

/**
 * Safe Image Error Handler helper: sets fallback or hides broken indicator
 */
export function handleImageError(e, fallbackUrl = '') {
  const el = e.currentTarget;
  if (!el) return;
  if (fallbackUrl && el.src !== fallbackUrl) {
    el.src = fallbackUrl;
  } else {
    // Hide or style gracefully if no fallback
    el.style.opacity = '0.6';
  }
}
