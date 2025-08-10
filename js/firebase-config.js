// js/firebase-config.js
// Using Firebase *compat* because we include the compat CDN scripts in HTML.
// Do NOT use `import` lines here.

const firebaseConfig = {
  apiKey: "AIzaSyDA6iCgvu_HMGHkc3JV4qJoio8CSGekcl8",
  authDomain: "basketballrotations2025.firebaseapp.com",
  projectId: "basketballrotations2025",
  storageBucket: "basketballrotations2025.firebasestorage.app",
  messagingSenderId: "824151000894",
  appId: "1:824151000894:web:88c4582c2b9317868a4e6f",
  measurementId: "G-MK4QLJQSJ1"
};

// Initialise (guarded so it won't double-init if run twice)
if (!firebase.apps || !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Expose for other scripts
window.auth = firebase.auth();
window.db = firebase.firestore();

