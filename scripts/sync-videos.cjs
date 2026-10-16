const fs = require('fs');
const path = require('path');
const https = require('https');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = (match[2] || '').trim();
});

const cloudName = env.CLOUDINARY_CLOUD_NAME;
const apiKey = env.CLOUDINARY_API_KEY;
const apiSecret = env.CLOUDINARY_API_SECRET;
const auth = Buffer.from(apiKey + ':' + apiSecret).toString('base64');

console.log('Fetching videos from Cloudinary account:', cloudName);

const req = https.request({
  hostname: 'api.cloudinary.com',
  path: `/v1_1/${cloudName}/resources/video?max_results=100`,
  headers: { Authorization: `Basic ${auth}` },
  method: 'GET'
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', async () => {
    try {
      const json = JSON.parse(data);
      if (!json.resources) {
        console.error('No resources returned:', json);
        process.exit(1);
      }

      const zamaniVideos = json.resources
        .filter(r => r.public_id && r.public_id.startsWith('zamani/'))
        .map(r => {
          let url = r.secure_url;
          if (url.endsWith('.mov')) {
            url = url.replace(/\.mov$/i, '.mp4');
          }
          return {
            src: url,
            span: 1,
            connectNext: false
          };
        });

      console.log(`Found ${zamaniVideos.length} Zamani videos. Saving to Firestore...`);

      const firebaseConfig = {
        apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };

      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);

      await setDoc(doc(db, 'site_data', 'video_gallery'), { videos: zamaniVideos });
      console.log('SUCCESS! Updated site_data/video_gallery with', zamaniVideos.length, 'videos!');
      process.exit(0);
    } catch (err) {
      console.error('Error during sync:', err);
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
  process.exit(1);
});

req.end();
