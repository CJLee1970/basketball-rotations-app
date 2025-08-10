// Firebase config (client-side config is safe to expose; secure your data via Firestore Rules)
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDA6iCgvu_HMGHkc3JV4qJoio8CSGekcl8",
  authDomain: "basketballrotations2025.firebaseapp.com",
  projectId: "basketballrotations2025",
  storageBucket: "basketballrotations2025.firebasestorage.app",
  messagingSenderId: "824151000894",
  appId: "1:824151000894:web:88c4582c2b9317868a4e6f",
  measurementId: "G-MK4QLJQSJ1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
