import { getFirebaseStorage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

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
    contentType: file.type || (ext === 'mp4' ? 'video/mp4' : 'image/jpeg'),
  };

  const uploadTask = uploadBytesResumable(storageRef, file, metadata);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
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

  const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|avi|mkv)$/i.test(file.name);
  const resourceType = isVideo ? 'video' : 'image';

  // 2. Build FormData for direct Cloudinary upload
  const uploadForm = new FormData();
  uploadForm.append('file', file);
  uploadForm.append('api_key', apiKey);
  uploadForm.append('timestamp', String(timestamp));
  uploadForm.append('signature', signature);
  uploadForm.append('folder', folder || 'zamani');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    // Use the appropriate resource_type endpoint for video/image
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`);

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
          reject(new Error(res.error?.message || `Cloudinary upload error (${xhr.status})`));
        }
      } catch (err) {
        reject(new Error(`Invalid response from Cloudinary: ${xhr.responseText.slice(0, 100)}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Cloudinary direct network error'));
    };

    xhr.send(uploadForm);
  });
}

/**
 * Universal, Self-Healing Multi-Layer Upload:
 * 1. Attempts Cloudinary Direct Upload
 * 2. If Cloudinary fails (size limits, network/CORS error), automatically uploads to Firebase Storage (Google Cloud Storage)
 * 3. If both fail, falls back to serverless proxy
 */
export async function uploadToCloudinary(file, onProgress) {
  if (!file) throw new Error('No file provided');

  // Strategy 1: Cloudinary Direct
  try {
    const url = await uploadDirectToCloudinary(file, onProgress);
    if (url) return url;
  } catch (cloudinaryErr) {
    console.warn('Cloudinary upload failed, engaging Firebase Storage fallback:', cloudinaryErr?.message || cloudinaryErr);
  }

  // Strategy 2: Firebase Storage (Google Cloud Storage — handles large 100MB+ videos of any length)
  try {
    if (onProgress) onProgress(5);
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
