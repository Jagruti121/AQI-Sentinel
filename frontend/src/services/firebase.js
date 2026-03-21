// Firebase Configuration
// Replace with your Firebase project credentials
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

if (firebaseConfig.apiKey === "YOUR_FIREBASE_API_KEY" || !firebaseConfig.apiKey) {
  console.warn("⚠️ Firebase is using placeholder API keys. Authentication will fail. Please update your .env file with real Firebase credentials.");
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
