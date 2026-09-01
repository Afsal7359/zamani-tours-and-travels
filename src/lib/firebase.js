import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let _app = null;
let _db = null;
let _auth = null;
let _storage = null;

export function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== 'your_api_key' &&
    !firebaseConfig.apiKey.startsWith('your_') &&
    firebaseConfig.apiKey.length > 20 &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== 'your_project_id' &&
    !firebaseConfig.projectId.startsWith('your_')
  );
}

function initFirebase() {
  if (typeof window === 'undefined') return false;
  if (!isFirebaseConfigured()) return false;
  if (!_app) {
    try {
      _app = getApps().length ? getApp() : initializeApp(firebaseConfig);
      if (_app) {
        try { _db = getFirestore(_app); } catch (e) { _db = null; }
        try { _auth = getAuth(_app); } catch (e) { _auth = null; }
        try { _storage = getStorage(_app); } catch (e) { _storage = null; }
      }
    } catch (e) {
      console.warn('Firebase initialization error:', e);
      _app = null;
      _db = null;
      _auth = null;
      _storage = null;
      return false;
    }
  }
  return true;
}

export function getFirebaseDb() {
  initFirebase();
  return _db;
}

export function getFirebaseAuth() {
  initFirebase();
  return _auth;
}

export function getFirebaseStorage() {
  initFirebase();
  return _storage;
}
