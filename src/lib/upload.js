/**
 * Client-side direct upload helper to Cloudinary.
 * Directly uploads large images or videos from the browser to Cloudinary
 * using a server-generated cryptographic signature.
 * 
 * Bypasses Vercel/Next.js request body payload limits (4.5MB), eliminating
 * "413 Request Entity Too Large" errors when uploading high-res photos and MP4 videos.
 */

export async function uploadToCloudinary(file, onProgress) {
  if (!file) throw new Error('No file provided');

  // 1. Get signed credentials from signature endpoint
  let cloudName, apiKey, timestamp, signature, folder;
  try {
    const sigRes = await fetch('/api/upload/signature');
    if (!sigRes.ok) {
      const errText = await sigRes.text();
      throw new Error(`Failed to obtain upload signature: ${errText}`);
    }
    const data = await sigRes.json();
    cloudName = data.cloudName;
    apiKey = data.apiKey;
    timestamp = data.timestamp;
    signature = data.signature;
    folder = data.folder || 'zamani';
  } catch (sigErr) {
    console.warn('Direct upload signing failed, attempting fallback to /api/upload proxy:', sigErr);
    // Fallback: proxy via /api/upload
    const fd = new FormData();
    fd.append('file', file);
    const proxyRes = await fetch('/api/upload', { method: 'POST', body: fd });
    const proxyData = await proxyRes.json();
    if (proxyData.url) return proxyData.url;
    throw new Error(proxyData.error || 'Upload failed');
  }

  // 2. Build FormData for direct Cloudinary upload
  const uploadForm = new FormData();
  uploadForm.append('file', file);
  uploadForm.append('api_key', apiKey);
  uploadForm.append('timestamp', String(timestamp));
  uploadForm.append('signature', signature);
  uploadForm.append('folder', folder);

  // 3. Direct XMLHttpRequest to track progress and upload directly
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`);

    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && res.secure_url) {
          resolve(res.secure_url);
        } else {
          reject(new Error(res.error?.message || `Upload failed (Status ${xhr.status})`));
        }
      } catch (err) {
        reject(new Error(`Invalid response from Cloudinary: ${xhr.responseText.slice(0, 100)}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error occurred during direct Cloudinary upload. Please check your connection.'));
    };

    xhr.send(uploadForm);
  });
}
