/**
 * Packages-only seed — adds the default tour packages without touching any
 * other collection. Safe to run on a live database.
 *
 * Usage:
 *   npm run seed:packages              → seed only if the packages collection is empty
 *   npm run seed:packages -- --force   → delete all packages and re-seed from defaults
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
const { defaultPackages } = await import('../src/lib/defaultData.js');

// ─── Main ─────────────────────────────────────────────────────────────────────
const force = process.argv.includes('--force');

console.log('\n🌱 Zamani — tour packages seed');
console.log('──────────────────────────────');

const existing = await db.collection('packages').get();

if (!existing.empty && !force) {
  console.log(`✗  The packages collection already has ${existing.size} doc(s).\n`);
  console.log('   To wipe and re-seed packages run:\n');
  console.log('   npm run seed:packages -- --force\n');
  process.exit(0);
}

if (!existing.empty && force) {
  console.log(`⚠  Force mode — clearing ${existing.size} existing package(s)…`);
  const clearBatch = db.batch();
  existing.docs.forEach(d => clearBatch.delete(d.ref));
  await clearBatch.commit();
}

const batch = db.batch();
defaultPackages.forEach(item => batch.set(db.collection('packages').doc(), item));
await batch.commit();

console.log(`  ✓ packages (${defaultPackages.length})`);
console.log('\n✅  Done!\n');
process.exit(0);
