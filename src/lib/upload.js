import { getFirebaseStorage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const CHUNK_SIZE = 6 * 1024 * 1024; // 6MB chunk size for large files & HD/4K videos

/**
 * Upload a file directly to Firebase Storage (Google Cloud Storage).
 * Supports unlimited file sizes, large 4K/HD MP4/MOV videos, and resumable chunked streams.
 */
export async function uploadToFirebaseStorage(file, onProgress) {
  const storage = getFirebaseStorage();
  if (!storage) throw new Error('Firebase Storage is not initialized');

  const ext = file.name.split('.').pop() || (file.type.startsWith('video/') ? 'mp4' : 'jpg');
  const cleanBase = file.name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
  const path = `zamani_media/${Date.now()}_${cleanBase}.${ext}`;
  const storageRef = ref(storage, path);

  const metadata = {
    contentType: file.type || (ext.toLowerCase() === 'mov' ? 'video/quicktime' : 'video/mp4'),
  };

  const uploadTask = uploadBytesResumable(storageRef, file, metadata);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          const percent = Math.min(99, Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
          onProgress(percent);
        }
      },
      (error) => {
        console.warn('Firebase Storage upload error:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          if (onProgress) onProgress(100);
          resolve(downloadUrl);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

/**
 * Upload a file directly to Cloudinary using signed authentication.
 * Automatically switches to Cloudinary chunked upload for videos & large files (> 8MB)
 * to support large iPhone 4K/HD videos (like IMG_2832.MP4) without timeout or rejection.
 */
async function uploadDirectToCloudinary(file, onProgress) {
  // 1. Get signed credentials from signature endpoint
  const sigRes = await fetch('/api/upload/signature');
  if (!sigRes.ok) {
    const errText = await sigRes.text();
    throw new Error(`Failed to obtain upload signature: ${errText}`);
  }
  const { cloudName, apiKey, timestamp, signature, folder } = await sigRes.json();

  if (!cloudName || !apiKey || !signature) {
    throw new Error('Cloudinary configuration is incomplete');
  }

  const isVideo =
    file.type.startsWith('video/') ||
    /\.(mp4|webm|mov|m4v|avi|mkv|3gp|flv)$/i.test(file.name);
  const resourceType = isVideo ? 'video' : 'auto';

  // For smaller files (<= 8MB) and regular images, perform direct single-request upload
  if (file.size <= 8 * 1024 * 1024 && !isVideo) {
    return new Promise((resolve, reject) => {
      const uploadForm = new FormData();
      uploadForm.append('file', file);
      uploadForm.append('api_key', apiKey);
      uploadForm.append('timestamp', String(timestamp));
      uploadForm.append('signature', signature);
      uploadForm.append('folder', folder || 'zamani');

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`);

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.min(99, Math.round((e.loaded / e.total) * 100));
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        try {
          const res = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && res.secure_url) {
            if (onProgress) onProgress(100);
            resolve(res.secure_url);
          } else {
            reject(new Error(res.error?.message || `Cloudinary upload error (${xhr.status})`));
          }
        } catch (err) {
          reject(new Error(`Invalid response from Cloudinary: ${xhr.responseText.slice(0, 100)}`));
        }
      };

      xhr.onerror = () => reject(new Error('Cloudinary direct network error'));
      xhr.send(uploadForm);
    });
  }

  // For videos or files > 8MB (e.g. iPhone videos like IMG_2832.MP4):
  // Perform chunked multi-part upload with unique ID & Content-Range
  const uniqueUploadId = `zamani_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const totalSize = file.size;
  let start = 0;
  let lastResult = null;

  while (start < totalSize) {
    const end = Math.min(start + CHUNK_SIZE, totalSize);
    const chunk = file.slice(start, end);

    const chunkForm = new FormData();
    chunkForm.append('file', chunk, file.name);
    chunkForm.append('api_key', apiKey);
    chunkForm.append('timestamp', String(timestamp));
    chunkForm.append('signature', signature);
    chunkForm.append('folder', folder || 'zamani');

    lastResult = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`);
      xhr.setRequestHeader('X-Unique-Upload-Id', uniqueUploadId);
      xhr.setRequestHeader('Content-Range', `bytes ${start}-${end - 1}/${totalSize}`);

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const uploadedBytes = start + e.loaded;
            const percent = Math.min(99, Math.round((uploadedBytes / totalSize) * 100));
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        try {
          const res = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(res);
          } else {
            reject(new Error(res.error?.message || `Chunk upload error (${xhr.status})`));
          }
        } catch (err) {
          reject(new Error(`Invalid chunk response: ${xhr.responseText.slice(0, 100)}`));
        }
      };

      xhr.onerror = () => reject(new Error('Chunk upload network error'));
      xhr.send(chunkForm);
    });

    start = end;
  }

  if (lastResult?.secure_url) {
    if (onProgress) onProgress(100);
    return lastResult.secure_url;
  }

  throw new Error('Upload completed but no secure URL was returned');
}

/**
 * Universal, Self-Healing Multi-Layer Upload:
 * 1. Attempts Cloudinary Chunked Direct Upload (supports 4K/HD iPhone videos of any size)
 * 2. If Cloudinary fails (size limits, network error), automatically falls back to Firebase Storage
 * 3. If both fail, falls back to serverless proxy
 */
export async function uploadToCloudinary(file, onProgress) {
  if (!file) throw new Error('No file provided');

  // Strategy 1: Cloudinary Chunked Direct
  try {
    const url = await uploadDirectToCloudinary(file, onProgress);
    if (url) return url;
  } catch (cloudinaryErr) {
    console.warn('Cloudinary upload failed, engaging Firebase Storage fallback:', cloudinaryErr?.message || cloudinaryErr);
  }

  // Strategy 2: Firebase Storage (Google Cloud Storage — handles large 100MB+ videos of any length)
  try {
    const fbUrl = await uploadToFirebaseStorage(file, onProgress);
    if (fbUrl) return fbUrl;
  } catch (firebaseErr) {
    console.warn('Firebase Storage upload failed, engaging API proxy fallback:', firebaseErr?.message || firebaseErr);
  }

  // Strategy 3: Next.js API Proxy
  try {
    const fd = new FormData();
    fd.append('file', file);
    const proxyRes = await fetch('/api/upload', { method: 'POST', body: fd });
    const proxyData = await proxyRes.json();
    if (proxyData.url) return proxyData.url;
    throw new Error(proxyData.error || 'Upload failed across all storage providers');
  } catch (proxyErr) {
    throw new Error(proxyErr.message || 'Upload failed. Please check your internet connection.');
  }
}
