const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, collection, getDocs } = require('firebase/firestore');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let key = match[1];
    let val = (match[2] || '').trim();
    env[key] = val;
  }
});

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

async function listAll() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const siteDataSnap = await getDocs(collection(db, 'site_data'));
  console.log('--- ALL SITE_DATA DOCS ---');
  siteDataSnap.forEach(d => {
    console.log(d.id, '=>', JSON.stringify(d.data()).slice(0, 120));
  });

  process.exit(0);
}

listAll().catch(e => {
  console.error(e);
  process.exit(1);
});
