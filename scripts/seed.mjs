/**
 * Database seed script — uses Firebase Admin SDK (bypasses Firestore security rules).
 *
 * Setup (one-time):
 *   1. Firebase Console → Project Settings → Service Accounts → Generate new private key
 *   2. Save the downloaded JSON file as:  serviceAccountKey.json  (project root)
 *   3. npm install
 *
 * Usage:
 *   npm run seed              → seed only if database is empty
 *   npm run seed -- --force   → delete all data and re-seed from defaults
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Load service account key ─────────────────────────────────────────────────
const keyPath = resolve(__dirname, '../serviceAccountKey.json');
let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
} catch {
  console.error('\n✗  serviceAccountKey.json not found.\n');
  console.error('  1. Go to: Firebase Console → Project Settings → Service Accounts');
  console.error('  2. Click "Generate new private key" and download the JSON file');
  console.error('  3. Save it as serviceAccountKey.json in the project root\n');
  process.exit(1);
}

// ─── Firebase Admin init ──────────────────────────────────────────────────────
const admin = (await import('firebase-admin')).default;

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

// ─── Default data ─────────────────────────────────────────────────────────────
const {
  defaultServices,
  defaultTestimonials,
  defaultDestinations,
  defaultProcessSteps,
  defaultBlogPosts,
  defaultHomeContent,
  defaultSiteSettings,
  defaultAboutContent,
} = await import('../src/lib/defaultData.js');

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function clearCollection(name) {
  const snap = await db.collection(name).get();
  const batch = db.batch();
  snap.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
  console.log(`  cleared  ${name} (${snap.size} docs)`);
}

async function seedCollection(name, items) {
  const batch = db.batch();
  items.forEach(item => batch.set(db.collection(name).doc(), item));
  await batch.commit();
  console.log(`  ✓ ${name} (${items.length})`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const force = process.argv.includes('--force');

console.log('\n🌱 Zamani — database seed');
console.log('──────────────────────────');

if (!force) {
  const existing = await db.collection('services').limit(1).get();
  if (!existing.empty) {
    console.log('✗  Database already has data.\n');
    console.log('   To reset everything back to defaults run:\n');
    console.log('   npm run seed -- --force\n');
    process.exit(0);
  }
}

if (force) {
  console.log('⚠  Force mode — clearing existing data…');
  await clearCollection('services');
  await clearCollection('testimonials');
  await clearCollection('destinations');
  await clearCollection('process_steps');
  await clearCollection('blog_posts');
  console.log('');
}

console.log('Seeding…');
await seedCollection('services',      defaultServices);
await seedCollection('testimonials',  defaultTestimonials);
await seedCollection('destinations',  defaultDestinations);
await seedCollection('process_steps', defaultProcessSteps);
await seedCollection('blog_posts',    defaultBlogPosts);

await db.collection('site_data').doc('settings').set(defaultSiteSettings);
await db.collection('site_data').doc('home_content').set(defaultHomeContent);
await db.collection('site_data').doc('about_content').set(defaultAboutContent);
console.log('  ✓ site_data (settings, home_content, about_content)');

console.log('\n✅  Done!\n');
process.exit(0);
