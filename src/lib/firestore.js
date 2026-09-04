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

// ─── High-Performance Client Caching Layer (0ms Instant Navigation) ───────────
const cacheStore = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes fresh in-memory

function getCachedData(key) {
  if (cacheStore.has(key)) {
    const entry = cacheStore.get(key);
    if (Date.now() - entry.timestamp < CACHE_TTL_MS) {
      return entry.data;
    }
  }
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem(`zamani_cache_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
          cacheStore.set(key, parsed);
          return parsed.data;
        }
      }
    } catch (e) {}
  }
  return null;
}

function setCachedData(key, data) {
  const entry = { data, timestamp: Date.now() };
  cacheStore.set(key, entry);
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(`zamani_cache_${key}`, JSON.stringify(entry));
    } catch (e) {}
  }
}

export function clearFirestoreCache(prefix = '') {
  if (!prefix) {
    cacheStore.clear();
    if (typeof window !== 'undefined') {
      try {
        Object.keys(sessionStorage).forEach(k => {
          if (k.startsWith('zamani_cache_')) sessionStorage.removeItem(k);
        });
      } catch (e) {}
    }
  } else {
    for (const key of cacheStore.keys()) {
      if (key.startsWith(prefix)) cacheStore.delete(key);
    }
    if (typeof window !== 'undefined') {
      try {
        Object.keys(sessionStorage).forEach(k => {
          if (k.startsWith(`zamani_cache_${prefix}`)) sessionStorage.removeItem(k);
        });
      } catch (e) {}
    }
  }
}

// ─── Services ─────────────────────────────────────────────────────────────────

export async function getServices() {
  const cached = getCachedData('services');
  if (cached) return cached;

  try {
    const db = getFirebaseDb();
    if (!db) {
      setCachedData('services', defaultServices);
      return defaultServices;
    }
    const q = query(collection(db, 'services'), orderBy('order', 'asc'));
    const snap = await getDocs(q);
    const data = snap.empty ? defaultServices : snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setCachedData('services', data);
    return data;
  } catch (e) {
    console.warn('Could not fetch services from Firestore, falling back to default data:', e);
    return defaultServices;
  }
}

export async function getService(id) {
  const cacheKey = `service_${id}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const db = getFirebaseDb();
    if (db) {
      const snap = await getDoc(doc(db, 'services', id));
      if (snap.exists()) {
        const item = { id: snap.id, ...snap.data() };
        setCachedData(cacheKey, item);
        return item;
      }
    }
  } catch (e) {
    console.warn('Error fetching service:', e);
  }
  const fallback = defaultServices.find(s => s.id === id || s.slug === id || String(s.order) === id) || null;
  if (fallback) setCachedData(cacheKey, fallback);
  return fallback;
}

export async function getServiceBySlug(slug) {
  const cacheKey = `service_slug_${slug}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const db = getFirebaseDb();
    if (db) {
      const q = query(collection(db, 'services'), where('slug', '==', slug));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        const item = { id: d.id, ...d.data() };
        setCachedData(cacheKey, item);
        return item;
      }
    }
  } catch (e) {
    console.warn('Error fetching service by slug:', e);
  }
  const fallback = defaultServices.find(s => s.slug === slug || s.id === slug) || null;
  if (fallback) setCachedData(cacheKey, fallback);
  return fallback;
}

export async function saveService(id, data) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not configured');
  clearFirestoreCache('service');
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
  clearFirestoreCache('service');
  await deleteDoc(doc(db, 'services', id));
}

// ─── Tour Packages ────────────────────────────────────────────────────────────

export async function getPackages() {
  const cached = getCachedData('packages');
  if (cached) return cached;

  try {
    const db = getFirebaseDb();
    if (!db) {
      setCachedData('packages', defaultPackages);
      return defaultPackages;
    }
    const q = query(collection(db, 'packages'), orderBy('order', 'asc'));
    const snap = await getDocs(q);
    const data = snap.empty ? defaultPackages : snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setCachedData('packages', data);
    return data;
  } catch (e) {
    console.warn('Could not fetch packages from Firestore, falling back to default data:', e);
    return defaultPackages;
  }
}

export async function getPackage(id) {
  const cacheKey = `package_${id}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const db = getFirebaseDb();
    if (db) {
      const snap = await getDoc(doc(db, 'packages', id));
      if (snap.exists()) {
        const item = { id: snap.id, ...snap.data() };
        setCachedData(cacheKey, item);
        return item;
      }
    }
  } catch (e) {
    console.warn('Error fetching package:', e);
  }
  const fallback = defaultPackages.find(p => p.id === id || p.slug === id || String(p.order) === id) || null;
  if (fallback) setCachedData(cacheKey, fallback);
  return fallback;
}

export async function getPackageBySlug(slug) {
  const cacheKey = `package_slug_${slug}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const db = getFirebaseDb();
    if (db) {
      const q = query(collection(db, 'packages'), where('slug', '==', slug));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        const item = { id: d.id, ...d.data() };
        setCachedData(cacheKey, item);
        return item;
      }
    }
  } catch (e) {
    console.warn('Error fetching package by slug:', e);
  }
  const fallback = defaultPackages.find(p => p.slug === slug || p.id === slug) || null;
  if (fallback) setCachedData(cacheKey, fallback);
  return fallback;
}

export async function savePackage(id, data) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not configured');
  clearFirestoreCache('package');
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
  clearFirestoreCache('package');
  await deleteDoc(doc(db, 'packages', id));
}

// ─── Blog Posts ───────────────────────────────────────────────────────────────

export async function getBlogPosts(options = {}) {
  const cacheKey = `blog_posts_${JSON.stringify(options)}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const db = getFirebaseDb();
    if (!db) {
      let posts = [...defaultBlogPosts];
      if (options.category) posts = posts.filter(p => p.category === options.category);
      if (options.featured !== undefined) posts = posts.filter(p => p.featured === options.featured);
      if (options.limit) posts = posts.slice(0, options.limit);
      setCachedData(cacheKey, posts);
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
    const data = snap.empty ? defaultBlogPosts : snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setCachedData(cacheKey, data);
    return data;
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
  const cacheKey = `blog_post_${id}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const db = getFirebaseDb();
    if (db) {
      const snap = await getDoc(doc(db, 'blog_posts', id));
      if (snap.exists()) {
        const item = { id: snap.id, ...snap.data() };
        setCachedData(cacheKey, item);
        return item;
      }
    }
  } catch (e) {
    console.warn('Error fetching blog post:', e);
  }
  const fallback = defaultBlogPosts.find(p => p.id === id || p.slug === id) || defaultBlogPosts[0] || null;
  if (fallback) setCachedData(cacheKey, fallback);
  return fallback;
}

export async function saveBlogPost(id, data) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not configured');
  clearFirestoreCache('blog_post');
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
  clearFirestoreCache('blog_post');
  await deleteDoc(doc(db, 'blog_posts', id));
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

export async function getTestimonials() {
  const cached = getCachedData('testimonials');
  if (cached) return cached;

  try {
    const db = getFirebaseDb();
    if (!db) {
      setCachedData('testimonials', defaultTestimonials);
      return defaultTestimonials;
    }
    const snap = await getDocs(collection(db, 'testimonials'));
    const data = snap.empty ? defaultTestimonials : snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setCachedData('testimonials', data);
    return data;
  } catch (e) {
    console.warn('Could not fetch testimonials from Firestore, falling back to default data:', e);
    return defaultTestimonials;
  }
}

export async function saveTestimonial(id, data) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not configured');
  clearFirestoreCache('testimonials');
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
  clearFirestoreCache('testimonials');
  await deleteDoc(doc(db, 'testimonials', id));
}

// ─── Process Steps ────────────────────────────────────────────────────────────

export async function getProcessSteps() {
  const cached = getCachedData('process_steps');
  if (cached) return cached;

  try {
    const db = getFirebaseDb();
    if (!db) {
      setCachedData('process_steps', defaultProcessSteps);
      return defaultProcessSteps;
    }
    const q = query(collection(db, 'process_steps'), orderBy('step', 'asc'));
    const snap = await getDocs(q);
    const data = snap.empty ? defaultProcessSteps : snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setCachedData('process_steps', data);
    return data;
  } catch (e) {
    console.warn('Could not fetch process steps from Firestore, falling back to default data:', e);
    return defaultProcessSteps;
  }
}

export async function saveProcessStep(id, data) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not configured');
  clearFirestoreCache('process_steps');
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
  clearFirestoreCache('process_steps');
  await deleteDoc(doc(db, 'process_steps', id));
}

// ─── Site Settings ────────────────────────────────────────────────────────────

export async function getSiteSettings() {
  const cached = getCachedData('site_settings');
  if (cached) return cached;

  try {
    const db = getFirebaseDb();
    if (!db) {
      setCachedData('site_settings', defaultSiteSettings);
      return defaultSiteSettings;
    }
    const snap = await getDoc(doc(db, 'site_data', 'settings'));
    const data = !snap.exists() ? defaultSiteSettings : { ...defaultSiteSettings, ...snap.data() };
    setCachedData('site_settings', data);
    return data;
  } catch (e) {
    console.warn('Could not fetch site settings from Firestore, falling back to default data:', e);
    return defaultSiteSettings;
  }
}

export async function saveSiteSettings(data) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not configured');
  clearFirestoreCache('site_settings');
  await setDoc(doc(db, 'site_data', 'settings'), data, { merge: true });
}

// ─── Home Page Content ────────────────────────────────────────────────────────

export async function getHomeContent() {
  const cached = getCachedData('home_content');
  if (cached) return cached;

  try {
    const db = getFirebaseDb();
    if (!db) {
      setCachedData('home_content', defaultHomeContent);
      return defaultHomeContent;
    }
    const snap = await getDoc(doc(db, 'site_data', 'home_content'));
    const data = !snap.exists() ? defaultHomeContent : { ...defaultHomeContent, ...snap.data() };
    setCachedData('home_content', data);
    return data;
  } catch (e) {
    console.warn('Could not fetch home content from Firestore, falling back to default data:', e);
    return defaultHomeContent;
  }
}

export async function saveHomeContent(data) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not configured');
  clearFirestoreCache('home_content');
  await setDoc(doc(db, 'site_data', 'home_content'), data, { merge: true });
}

// ─── About Page Content ───────────────────────────────────────────────────────

export async function getAboutContent() {
  const cached = getCachedData('about_content');
  if (cached) return cached;

  try {
    const db = getFirebaseDb();
    if (!db) {
      setCachedData('about_content', defaultAboutContent);
      return defaultAboutContent;
    }
    const snap = await getDoc(doc(db, 'site_data', 'about_content'));
    const data = !snap.exists() ? defaultAboutContent : { ...defaultAboutContent, ...snap.data() };
    setCachedData('about_content', data);
    return data;
  } catch (e) {
    console.warn('Could not fetch about content from Firestore, falling back to default data:', e);
    return defaultAboutContent;
  }
}

export async function saveAboutContent(data) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not configured');
  clearFirestoreCache('about_content');
  await setDoc(doc(db, 'site_data', 'about_content'), data, { merge: true });
}

// ─── Gallery ──────────────────────────────────────────────────────────────────

export async function getGallery() {
  const cached = getCachedData('gallery');
  if (cached) return cached;

  try {
    const db = getFirebaseDb();
    if (!db) {
      setCachedData('gallery', defaultGallery);
      return defaultGallery;
    }
    const snap = await getDoc(doc(db, 'site_data', 'gallery'));
    const data = !snap.exists() ? defaultGallery : { ...defaultGallery, ...snap.data() };
    setCachedData('gallery', data);
    return data;
  } catch (e) {
    console.warn('Could not fetch gallery from Firestore, falling back to default data:', e);
    return defaultGallery;
  }
}

export async function saveGallery(data) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not configured');
  clearFirestoreCache('gallery');
  await setDoc(doc(db, 'site_data', 'gallery'), data, { merge: true });
}

export async function getFeedbackGallery() {
  const cached = getCachedData('feedback_gallery');
  if (cached) return cached;

  try {
    const db = getFirebaseDb();
    if (!db) {
      setCachedData('feedback_gallery', defaultFeedbackGallery);
      return defaultFeedbackGallery;
    }
    const snap = await getDoc(doc(db, 'site_data', 'feedback_gallery'));
    const data = !snap.exists() ? defaultFeedbackGallery : { ...defaultFeedbackGallery, ...snap.data() };
    setCachedData('feedback_gallery', data);
    return data;
  } catch (e) {
    console.warn('Could not fetch feedback gallery from Firestore, falling back to default data:', e);
    return defaultFeedbackGallery;
  }
}

export async function saveFeedbackGallery(data) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not configured');
  clearFirestoreCache('feedback_gallery');
  await setDoc(doc(db, 'site_data', 'feedback_gallery'), data, { merge: true });
}

export async function getVideoGallery() {
  const cached = getCachedData('video_gallery');
  if (cached) return cached;

  try {
    const db = getFirebaseDb();
    if (!db) {
      setCachedData('video_gallery', defaultVideoGallery);
      return defaultVideoGallery;
    }
    const snap = await getDoc(doc(db, 'site_data', 'video_gallery'));
    const data = !snap.exists() ? defaultVideoGallery : { ...defaultVideoGallery, ...snap.data() };
    setCachedData('video_gallery', data);
    return data;
  } catch (e) {
    console.warn('Could not fetch video gallery from Firestore, falling back to default data:', e);
    return defaultVideoGallery;
  }
}

export async function saveVideoGallery(data) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not configured');
  clearFirestoreCache('video_gallery');
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

  // 2. Canonicalize Cloudinary URLs: strip out transformation segments
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

        // Client-side sort: newest comments first
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
  clearFirestoreCache('package');
  
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
