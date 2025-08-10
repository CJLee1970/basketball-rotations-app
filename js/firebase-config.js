// js/firebase-config.js
// Using Firebase *compat* because we include the compat CDN scripts in HTML.
// Do NOT use `import` lines here.

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "basketballrotations2025.firebaseapp.com",
  projectId: "basketballrotations2025",
  storageBucket: "basketballrotations2025.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialise (guarded so it won't double-init if run twice)
if (!firebase.apps || !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Expose for other scripts
window.auth = firebase.auth();
window.db = firebase.firestore();

