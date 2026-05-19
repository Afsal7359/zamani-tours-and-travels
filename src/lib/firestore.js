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
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase';

// ─── Services ─────────────────────────────────────────────────────────────────

export async function getServices() {
  const db = getFirebaseDb();
  const q = query(collection(db, 'services'), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getService(id) {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, 'services', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function getServiceBySlug(slug) {
  const db = getFirebaseDb();
  const q = query(collection(db, 'services'), where('slug', '==', slug));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

export async function saveService(id, data) {
  const db = getFirebaseDb();
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
  await deleteDoc(doc(db, 'services', id));
}

// ─── Blog Posts ───────────────────────────────────────────────────────────────

export async function getBlogPosts(options = {}) {
  const db = getFirebaseDb();
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
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getBlogPost(id) {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, 'blog_posts', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function saveBlogPost(id, data) {
  const db = getFirebaseDb();
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
  await deleteDoc(doc(db, 'blog_posts', id));
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

export async function getTestimonials() {
  const db = getFirebaseDb();
  const snap = await getDocs(collection(db, 'testimonials'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function saveTestimonial(id, data) {
  const db = getFirebaseDb();
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
  await deleteDoc(doc(db, 'testimonials', id));
}

// ─── Destinations ─────────────────────────────────────────────────────────────

export async function getDestinations() {
  const db = getFirebaseDb();
  const q = query(collection(db, 'destinations'), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function saveDestination(id, data) {
  const db = getFirebaseDb();
  if (id) {
    await setDoc(doc(db, 'destinations', id), data, { merge: true });
    return id;
  } else {
    const ref = await addDoc(collection(db, 'destinations'), data);
    return ref.id;
  }
}

export async function deleteDestination(id) {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, 'destinations', id));
}

// ─── Process Steps ────────────────────────────────────────────────────────────

export async function getProcessSteps() {
  const db = getFirebaseDb();
  const q = query(collection(db, 'process_steps'), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function saveProcessStep(id, data) {
  const db = getFirebaseDb();
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
  await deleteDoc(doc(db, 'process_steps', id));
}

// ─── Site Settings ────────────────────────────────────────────────────────────

export async function getSiteSettings() {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, 'site_data', 'settings'));
  if (!snap.exists()) return null;
  return snap.data();
}

export async function saveSiteSettings(data) {
  const db = getFirebaseDb();
  await setDoc(doc(db, 'site_data', 'settings'), data, { merge: true });
}

// ─── Home Content ─────────────────────────────────────────────────────────────

export async function getHomeContent() {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, 'site_data', 'home_content'));
  if (!snap.exists()) return null;
  return snap.data();
}

export async function saveHomeContent(data) {
  const db = getFirebaseDb();
  await setDoc(doc(db, 'site_data', 'home_content'), data, { merge: true });
}

// ─── About Content ────────────────────────────────────────────────────────────

export async function getAboutContent() {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, 'site_data', 'about_content'));
  if (!snap.exists()) return null;
  return snap.data();
}

export async function saveAboutContent(data) {
  const db = getFirebaseDb();
  await setDoc(doc(db, 'site_data', 'about_content'), data, { merge: true });
}

// ─── Contact Submissions ──────────────────────────────────────────────────────

export async function saveContactSubmission(data) {
  const db = getFirebaseDb();
  const ref = await addDoc(collection(db, 'contact_submissions'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getContactSubmissions() {
  const db = getFirebaseDb();
  const q = query(collection(db, 'contact_submissions'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deleteContactSubmission(id) {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, 'contact_submissions', id));
}
