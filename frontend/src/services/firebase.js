// Firebase Configuration
// Replace with your Firebase project credentials
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_FIREBASE_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:000000:web:000000"
};

if (firebaseConfig.apiKey === "YOUR_FIREBASE_API_KEY" || !firebaseConfig.apiKey) {
  console.warn("⚠️ Firebase is using placeholder API keys. Authentication will fail. Please update your .env file with real Firebase credentials.");
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
