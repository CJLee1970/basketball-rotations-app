# Basketball Rotation Manager (MVP, modular)

A clean, modularised version of your working MVP. Frontend-only HTML/CSS/JS using Firebase Auth + Firestore and html2pdf.js.

## Quick Start (GitHub Pages or Firebase Hosting)

1) **Create Firebase project** (or reuse yours). Enable:
   - Authentication: Email/Password
   - Firestore Database

2) **Update Authorized domains** (Firebase Console → Authentication → Settings):
   - Add `*.github.io` (for GitHub Pages) or your custom domain.

3) **Deploy**
   - GitHub Pages: push this folder to a repo and enable Pages (root).
   - or Firebase Hosting:
     ```bash
     npm i -g firebase-tools
     firebase login
     firebase init hosting
     firebase deploy
     ```

4) **Firestore Rules (minimum)** — secure data per-user:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

## Pages

- `index.html` — Sign in/up
- `dashboard.html` — List & manage saved rotations
- `players.html` — Roster CRUD
- `rotation.html` — Builder, analytics, export

## JS Modules

- `js/firebase-config.js` — Firebase init (client config)
- `js/common.js` — helpers, auth guards
- `js/auth.js` — login/signup flows
- `js/dashboard.js` — rotations list/delete
- `js/roster.js` — player CRUD
- `js/builder.js` — drag/drop, stints, save/load
- `js/analytics.js` — minutes + simple lineup sums
- `js/export.js` — html2pdf + print by quarter

## Notes

- Client config keys are **public by design**; protect data with **Firestore Rules**.
- If you change project ID or domain, update **Authorized domains** and `firebase-config.js`.
- The **Live Lineup** currently sums the latest stint per position in Q1 as a simple baseline. We can evolve this to a time-scrubber across quarters.

## Head Coach Role (Next)

- Add a Cloud Function / structured sharing to let Head Coach read assistants' rotations, e.g. save rotations under a `teamId` with subcollection per coach, and grant read access to head coach role via custom claims.
