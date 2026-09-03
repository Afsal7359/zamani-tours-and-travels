import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  addDoc,
  query,
  orderBy,
  where,
  limit as firestoreLimit,
  serverTimestamp,
  onSnapshot,
  increment,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import {
  defaultServices,
  defaultPackages,
  defaultBlogPosts,
  defaultTestimonials,
  defaultProcessSteps,
  defaultSiteSettings,
  defaultHomeContent,
  defaultAboutContent,
  defaultGallery,
  defaultFeedbackGallery,
  defaultVideoGallery,
} from './defaultData';

// ─── Services ─────────────────────────────────────────────────────────────────

export async function getServices() {
  try {
    const db = getFirebaseDb();
    if (!db) return defaultServices;
    const q = query(collection(db, 'services'), orderBy('order', 'asc'));
    const snap = await getDocs(q);
    if (snap.empty) return defaultServices;
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('Could not fetch services from Firestore, falling back to default data:', e);
    return defaultServices;
  }
}

export async function getService(id) {
  try {
    const db = getFirebaseDb();
    if (db) {
      const snap = await getDoc(doc(db, 'services', id));
      if (snap.exists()) return { id: snap.id, ...snap.data() };
    }
  } catch (e) {
    console.warn('Error fetching service:', e);
  }
  return defaultServices.find(s => s.id === id || s.slug === id || String(s.order) === id) || null;
}

export async function getServiceBySlug(slug) {
  try {
    const db = getFirebaseDb();
    if (db) {
      const q = query(collection(db, 'services'), where('slug', '==', slug));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        return { id: d.id, ...d.data() };
      }
    }
  } catch (e) {
    console.warn('Error fetching service by slug:', e);
  }
  return defaultServices.find(s => s.slug === slug || s.id === slug) || null;
}

export async function saveService(id, data) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not configured');
  if (id) {
    await setDoc(doc(db, 'services', id), data, { merge: true });
    return id;
  } else {
    const ref = await addDoc(collection(db, 'services'), data);
    return ref.id;
  }
}

export async function deleteService(id) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not configured');
  await deleteDoc(doc(db, 'services', id));
}

// ─── Tour Packages ────────────────────────────────────────────────────────────

export async function getPackages() {
  try {
    const db = getFirebaseDb();
    if (!db) return defaultPackages;
    const q = query(collection(db, 'packages'), orderBy('order', 'asc'));
    const snap = await getDocs(q);
    if (snap.empty) return defaultPackages;
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('Could not fetch packages from Firestore, falling back to default data:', e);
    return defaultPackages;
  }
}

export async function getPackage(id) {
  try {
    const db = getFirebaseDb();
    if (db) {
      const snap = await getDoc(doc(db, 'packages', id));
      if (snap.exists()) return { id: snap.id, ...snap.data() };
    }
  } catch (e) {
    console.warn('Error fetching package:', e);
  }
  return defaultPackages.find(p => p.id === id || p.slug === id || String(p.order) === id) || null;
}

export async function getPackageBySlug(slug) {
  try {
    const db = getFirebaseDb();
    if (db) {
      const q = query(collection(db, 'packages'), where('slug', '==', slug));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        return { id: d.id, ...d.data() };
      }
    }
  } catch (e) {
    console.warn('Error fetching package by slug:', e);
  }
  return defaultPackages.find(p => p.slug === slug || p.id === slug) || null;
}

export async function savePackage(id, data) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not configured');
  if (id) {
    await setDoc(doc(db, 'packages', id), data, { merge: true });
    return id;
  } else {
    const ref = await addDoc(collection(db, 'packages'), data);
    return ref.id;
  }
}

export async function deletePackage(id) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not configured');
  await deleteDoc(doc(db, 'packages', id));
}

// ─── Blog Posts ───────────────────────────────────────────────────────────────

export async function getBlogPosts(options = {}) {
  try {
    const db = getFirebaseDb();
    if (!db) {
      let posts = [...defaultBlogPosts];
      if (options.category) posts = posts.filter(p => p.category === options.category);
      if (options.featured !== undefined) posts = posts.filter(p => p.featured === options.featured);
      if (options.limit) posts = posts.slice(0, options.limit);
      return posts;
    }
    let q = collection(db, 'blog_posts');
    const constraints = [];

    if (options.category) {
      constraints.push(where('category', '==', options.category));
    }
    if (options.featured !== undefined) {
      constraints.push(where('featured', '==', options.featured));
    }
    if (options.limit) {
      constraints.push(firestoreLimit(options.limit));
    }

    constraints.push(orderBy('date', 'desc'));
    q = query(q, ...constraints);
    const snap = await getDocs(q);
    if (snap.empty) return defaultBlogPosts;
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('Could not fetch blog posts from Firestore, falling back to default data:', e);
    let posts = [...defaultBlogPosts];
    if (options.category) posts = posts.filter(p => p.category === options.category);
    if (options.featured !== undefined) posts = posts.filter(p => p.featured === options.featured);
    if (options.limit) posts = posts.slice(0, options.limit);
    return posts;
  }
}

export async function getBlogPost(id) {
  try {
    const db = getFirebaseDb();
    if (db) {
      const snap = await getDoc(doc(db, 'blog_posts', id));
      if (snap.exists()) return { id: snap.id, ...snap.data() };
    }
  } catch (e) {
    console.warn('Error fetching blog post:', e);
  }
  return defaultBlogPosts.find(p => p.id === id || p.slug === id) || defaultBlogPosts[0] || null;
}

export async function saveBlogPost(id, data) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not configured');
  if (id) {
    await setDoc(doc(db, 'blog_posts', id), data, { merge: true });
    return id;
  } else {
    const ref = await addDoc(collection(db, 'blog_posts'), data);
    return ref.id;
  }
}

export async function deleteBlogPost(id) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not configured');
  await deleteDoc(doc(db, 'blog_posts', id));
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

export async function getTestimonials() {
  try {
    const db = getFirebaseDb();
    if (!db) return defaultTestimonials;
    const snap = await getDocs(collection(db, 'testimonials'));
    if (snap.empty) return defaultTestimonials;
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('Could not fetch testimonials from Firestore, falling back to default data:', e);
    return defaultTestimonials;
  }
}

export async function saveTestimonial(id, data) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not configured');
  if (id) {
    await setDoc(doc(db, 'testimonials', id), data, { merge: true });
    return id;
  } else {
    const ref = await addDoc(collection(db, 'testimonials'), data);
    return ref.id;
  }
}

export async function deleteTestimonial(id) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not configured');
  await deleteDoc(doc(db, 'testimonials', id));
}

// ─── Process Steps ────────────────────────────────────────────────────────────

export async function getProcessSteps() {
  try {
    const db = getFirebaseDb();
    if (!db) return defaultProcessSteps;
    const q = query(collection(db, 'process_steps'), orderBy('order', 'asc'));
    const snap = await getDocs(q);
    if (snap.empty) return defaultProcessSteps;
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('Could not fetch process steps from Firestore, falling back to default data:', e);
    return defaultProcessSteps;
  }
}

export async function saveProcessStep(id, data) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not configured');
  if (id) {
    await setDoc(doc(db, 'process_steps', id), data, { merge: true });
    return id;
  } else {
    const ref = await addDoc(collection(db, 'process_steps'), data);
    return ref.id;
  }
}

export async function deleteProcessStep(id) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not configured');
  await deleteDoc(doc(db, 'process_steps', id));
}

// ─── Site Settings ────────────────────────────────────────────────────────────

export async function getSiteSettings() {
  try {
    const db = getFirebaseDb();
    if (!db) return defaultSiteSettings;
    const snap = await getDoc(doc(db, 'site_data', 'settings'));
    if (!snap.exists()) return defaultSiteSettings;
    const data = snap.data();
    if (data?.whatsapp && data.whatsapp.includes('8592002549')) {
      data.whatsapp = 'https://wa.me/918592042002';
    }
    return { ...defaultSiteSettings, ...data };
  } catch (e) {
    console.warn('Could not fetch site settings from Firestore, falling back to default data:', e);
    return defaultSiteSettings;
  }
}

export async function saveSiteSettings(data) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not configured');
  await setDoc(doc(db, 'site_data', 'settings'), data, { merge: true });
}

// ─── Home Content ─────────────────────────────────────────────────────────────

export async function getHomeContent() {
  try {
    const db = getFirebaseDb();
    if (!db) return defaultHomeContent;
    const snap = await getDoc(doc(db, 'site_data', 'home_content'));
    if (!snap.exists()) return defaultHomeContent;
    return { ...defaultHomeContent, ...snap.data() };
  } catch (e) {
    console.warn('Could not fetch home content from Firestore, falling back to default data:', e);
    return defaultHomeContent;
  }
}

export async function saveHomeContent(data) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not configured');
  await setDoc(doc(db, 'site_data', 'home_content'), data, { merge: true });
}

// ─── About Content ────────────────────────────────────────────────────────────

export async function getAboutContent() {
  try {
    const db = getFirebaseDb();
    if (!db) return defaultAboutContent;
    const snap = await getDoc(doc(db, 'site_data', 'about_content'));
    if (!snap.exists()) return defaultAboutContent;
    return { ...defaultAboutContent, ...snap.data() };
  } catch (e) {
    console.warn('Could not fetch about content from Firestore, falling back to default data:', e);
    return defaultAboutContent;
  }
}

export async function saveAboutContent(data) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not configured');
  await setDoc(doc(db, 'site_data', 'about_content'), data, { merge: true });
}

// ─── Gallery ──────────────────────────────────────────────────────────────────

export async function getGallery() {
  try {
    const db = getFirebaseDb();
    if (!db) return defaultGallery;
    const snap = await getDoc(doc(db, 'site_data', 'gallery'));
    if (!snap.exists()) return defaultGallery;
    return { ...defaultGallery, ...snap.data() };
  } catch (e) {
    console.warn('Could not fetch gallery from Firestore, falling back to default data:', e);
    return defaultGallery;
  }
}

export async function saveGallery(data) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not configured');
  await setDoc(doc(db, 'site_data', 'gallery'), data, { merge: true });
}

export async function getFeedbackGallery() {
  try {
    const db = getFirebaseDb();
    if (!db) return defaultFeedbackGallery;
    const snap = await getDoc(doc(db, 'site_data', 'feedback_gallery'));
    if (!snap.exists()) return defaultFeedbackGallery;
    return { ...defaultFeedbackGallery, ...snap.data() };
  } catch (e) {
    console.warn('Could not fetch feedback gallery from Firestore, falling back to default data:', e);
    return defaultFeedbackGallery;
  }
}

export async function saveFeedbackGallery(data) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not configured');
  await setDoc(doc(db, 'site_data', 'feedback_gallery'), data, { merge: true });
}

export async function getVideoGallery() {
  try {
    const db = getFirebaseDb();
    if (!db) return defaultVideoGallery;
    const snap = await getDoc(doc(db, 'site_data', 'video_gallery'));
    if (!snap.exists()) return defaultVideoGallery;
    return { ...defaultVideoGallery, ...snap.data() };
  } catch (e) {
    console.warn('Could not fetch video gallery from Firestore, falling back to default data:', e);
    return defaultVideoGallery;
  }
}

export async function saveVideoGallery(data) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not configured');
  await setDoc(doc(db, 'site_data', 'video_gallery'), data, { merge: true });
}

// ─── Contact Submissions ──────────────────────────────────────────────────────

export async function saveContactSubmission(data) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not configured');
  const ref = await addDoc(collection(db, 'contact_submissions'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getContactSubmissions() {
  try {
    const db = getFirebaseDb();
    if (!db) return [];
    const q = query(collection(db, 'contact_submissions'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('Could not fetch contact submissions from Firestore:', e);
    return [];
  }
}

export async function deleteContactSubmission(id) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not configured');
  await deleteDoc(doc(db, 'contact_submissions', id));
}

// ─── Video Reels Interactions (Likes & Real-time Comments) ───────────────────

export function getCleanVideoId(videoUrl) {
  let url = typeof videoUrl === 'string' ? videoUrl : (videoUrl?.src || videoUrl?.url || '');
  if (!url) return 'default_media';

  // 1. Remove query parameters and hashes
  url = url.split('?')[0].split('#')[0].trim();

  // 2. Canonicalize Cloudinary URLs: strip out transformation segments (/video/upload/.../ or /upload/.../)
  if (url.includes('cloudinary.com')) {
    const uploadMatch = url.match(/\/(?:video\/)?upload\/(?:[a-zA-Z0-9_,]+\/)*(.*)/);
    if (uploadMatch && uploadMatch[1]) {
      url = uploadMatch[1];
    }
  }

  // 3. Remove file extensions (.mp4, .jpg, .jpeg, .png, .webp, .mov, etc.)
  url = url.replace(/\.[a-zA-Z0-9]+$/, '');

  // 4. Generate deterministic alphanumeric ID
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  const cleanName = url.split('/').pop().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
  return `reel_${cleanName || 'media'}_${Math.abs(hash)}`;
}

export function subscribeToVideoComments(videoUrl, callback) {
  const db = getFirebaseDb();
  if (!db) {
    callback([]);
    return () => {};
  }
  const vid = getCleanVideoId(videoUrl);

  try {
    const q = query(
      collection(db, 'video_comments'),
      where('videoId', '==', vid)
    );

    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map(d => {
          const data = d.data();
          let createdAt = new Date();
          if (data.createdAt?.toDate) {
            createdAt = data.createdAt.toDate();
          } else if (data.timestamp) {
            createdAt = new Date(data.timestamp);
          }
          return {
            id: d.id,
            ...data,
            createdAt,
          };
        });

        // Client-side sort: newest comments first (eliminates composite index requirements)
        list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        callback(list);
      },
      (err) => {
        console.warn('Comments subscription warning:', err?.message || err);
        callback([]);
      }
    );
  } catch (e) {
    console.warn('Could not setup comments listener:', e);
    callback([]);
    return () => {};
  }
}

export async function addVideoComment(videoUrl, { name, text }) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not configured');
  const vid = getCleanVideoId(videoUrl);
  const docRef = await addDoc(collection(db, 'video_comments'), {
    videoId: vid,
    name: name?.trim() || 'Travel Enthusiast',
    text: text?.trim() || '',
    createdAt: serverTimestamp(),
    timestamp: Date.now(),
  });
  return docRef.id;
}

export function subscribeToVideoLikes(videoUrl, callback) {
  const db = getFirebaseDb();
  if (!db) {
    callback(0);
    return () => {};
  }
  try {
    const vid = getCleanVideoId(videoUrl);
    const docRef = doc(db, 'video_likes', vid);
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const count = snap.data()?.likes || 0;
          callback(Math.max(0, count));
        } else {
          callback(0);
        }
      },
      (err) => {
        console.warn('Likes subscription warning:', err?.message || err);
        callback(0);
      }
    );
  } catch (e) {
    console.warn('Could not setup likes listener:', e);
    callback(0);
    return () => {};
  }
}

export async function updateVideoLikes(videoUrl, delta) {
  const db = getFirebaseDb();
  if (!db) return;
  const vid = getCleanVideoId(videoUrl);
  const docRef = doc(db, 'video_likes', vid);
  await setDoc(
    docRef,
    {
      videoId: vid,
      likes: increment(delta),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// ─── Package Requests / Partner Submissions ───────────────────────────────────

export async function savePackageRequest(data) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not configured');
  const ref = await addDoc(collection(db, 'package_requests'), {
    ...data,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getPackageRequests() {
  try {
    const db = getFirebaseDb();
    if (!db) return [];
    const q = query(collection(db, 'package_requests'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('Could not fetch package requests from Firestore:', e);
    return [];
  }
}

export async function getPackageRequest(id) {
  try {
    const db = getFirebaseDb();
    if (db) {
      const snap = await getDoc(doc(db, 'package_requests', id));
      if (snap.exists()) return { id: snap.id, ...snap.data() };
    }
  } catch (e) {
    console.warn('Error fetching package request:', e);
  }
  return null;
}

export async function updatePackageRequestStatus(id, status, extraData = {}) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not configured');
  await setDoc(doc(db, 'package_requests', id), {
    status,
    ...extraData,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function deletePackageRequest(id) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not configured');
  await deleteDoc(doc(db, 'package_requests', id));
}

export async function approveAndPublishPackage(requestId, packageData) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not configured');
  
  // 1. Save as live package
  const pkgId = await savePackage(null, packageData);
  
  // 2. Mark request as approved
  await setDoc(doc(db, 'package_requests', requestId), {
    status: 'approved',
    publishedPackageId: pkgId,
    approvedAt: serverTimestamp(),
  }, { merge: true });
  
  return pkgId;
}


