# Zamani Tours & Travels — Next.js Website

A full-stack travel agency website built with Next.js 14 (App Router) and Firebase.

## Tech Stack

- **Next.js 14** (App Router, JavaScript)
- **Firebase 10** — Firestore, Authentication, Storage
- **Plain CSS** — no Tailwind or CSS framework

---

## Setup Instructions

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com) and create a new project.
2. Enable **Firestore Database** (start in production or test mode).
3. Enable **Authentication** → Sign-in method → **Email/Password**.
4. Go to Project Settings → Your Apps → Add a **Web App**.
5. Copy the Firebase config values.

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Firebase values:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Create Admin User

In the Firebase Console:
1. Go to **Authentication** → **Users** → **Add User**
2. Enter email and password (e.g. `admin@zamanitours.com` + a strong password)
3. Use these credentials to log in at `/admin/login`

### 4. Seed the Database

After setting up Firebase and environment variables, seed the database with default content:

**Option A — From the browser console (after running dev server):**

1. Open the site in your browser (e.g. `http://localhost:3000`)
2. Open browser DevTools → Console
3. Run:
```js
import('/src/lib/seed.js').then(m => m.seedDatabase().then(console.log))
```

**Option B — Create a temporary seed page:**

Create `/src/app/seed/page.js`:
```jsx
'use client';
import { useEffect, useState } from 'react';
import { seedDatabase } from '@/lib/seed';

export default function SeedPage() {
  const [result, setResult] = useState('Click to seed...');
  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>Database Seeder</h1>
      <p>{result}</p>
      <button onClick={() => seedDatabase().then(r => setResult(JSON.stringify(r, null, 2)))}>
        Seed Database
      </button>
    </div>
  );
}
```
Then visit `http://localhost:3000/seed` and click the button.
**Delete this page after seeding.**

### 5. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Admin panel: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## Project Structure

```
src/
  app/
    (site)/           # Public website pages
      page.js         # Home
      about/page.js
      services/page.js
      process/page.js
      blog/page.js
      contact/page.js
    admin/            # Admin panel
      page.js         # Dashboard
      login/page.js
      home/page.js
      about/page.js
      services/page.js
      process/page.js
      blog/page.js
      testimonials/page.js
      destinations/page.js
      contacts/page.js
      settings/page.js
    globals.css
    layout.js
  components/
    site/
      Navbar.jsx
      Footer.jsx
    admin/
      AdminSidebar.jsx
  lib/
    firebase.js       # Firebase init
    firestore.js      # Data access layer
    defaultData.js    # Default/seed data
    seed.js           # Database seeder
```

## Firebase Collections

| Collection | Purpose |
|---|---|
| `services` | All 11 services |
| `blog_posts` | Blog articles |
| `testimonials` | Client testimonials |
| `destinations` | Featured destinations |
| `process_steps` | How it works steps |
| `contact_submissions` | Contact form submissions |
| `site_data/settings` | Site-wide settings (phones, email, social) |
| `site_data/home_content` | Home page editable content |
| `site_data/about_content` | About page editable content |

## Adding the Logo

Place your logo file at:
```
public/images/zamaniLogo.png
```

## Deployment

1. Deploy to [Vercel](https://vercel.com) (recommended for Next.js):
   ```bash
   npx vercel
   ```
2. Add all environment variables in the Vercel dashboard under **Settings → Environment Variables**.
3. Redeploy after adding variables.

## Firestore Security Rules (Recommended)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read for site content
    match /services/{doc} { allow read: if true; allow write: if request.auth != null; }
    match /blog_posts/{doc} { allow read: if true; allow write: if request.auth != null; }
    match /testimonials/{doc} { allow read: if true; allow write: if request.auth != null; }
    match /destinations/{doc} { allow read: if true; allow write: if request.auth != null; }
    match /process_steps/{doc} { allow read: if true; allow write: if request.auth != null; }
    match /site_data/{doc} { allow read: if true; allow write: if request.auth != null; }
    
    // Contact submissions: write public, read admin only
    match /contact_submissions/{doc} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
  }
}
```
