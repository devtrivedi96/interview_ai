import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

// Client-safe Firebase initialization using NEXT_PUBLIC_ env vars
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

function initFirebase() {
  if (!getApps().length) {
    const app = initializeApp(firebaseConfig as any);
    try {
      // Analytics only works in browser
      if (typeof window !== 'undefined') getAnalytics(app);
    } catch (e) {
      // ignore analytics failures in non-browser env
    }
  }
  return getApp();
}

export const firebaseApp = initFirebase();
export default firebaseApp;
