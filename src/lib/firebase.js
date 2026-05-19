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

function initFirebase() {
  if (typeof window === 'undefined') return false;
  if (!_app) {
    _app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    _db = getFirestore(_app);
    _auth = getAuth(_app);
    _storage = getStorage(_app);
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
