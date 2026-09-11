const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

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

async function check() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const docs = ['gallery', 'feedback_gallery', 'video_gallery'];
  for (const id of docs) {
    const snap = await getDoc(doc(db, 'site_data', id));
    console.log(`=== site_data/${id} ===`);
    if (snap.exists()) {
      console.log(JSON.stringify(snap.data(), null, 2));
    } else {
      console.log('(does not exist)');
    }
  }

  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
