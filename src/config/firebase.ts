import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import type { Analytics } from 'firebase/analytics';
import { normalizeClientEnvString } from './env';

const firebaseConfig = {
  apiKey: normalizeClientEnvString(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: normalizeClientEnvString(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: normalizeClientEnvString(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: normalizeClientEnvString(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: normalizeClientEnvString(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: normalizeClientEnvString(import.meta.env.VITE_FIREBASE_APP_ID),
  measurementId: normalizeClientEnvString(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID),
};

const hasRequiredConfig = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.appId,
].every(Boolean);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let analyticsInstance: Analytics | null = null;
let analyticsPromise: Promise<Analytics | null> | null = null;

if (hasRequiredConfig) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: 'select_account',
    });
  } catch (error) {
    console.error('Firebase initialization failed:', error);
  }
} else {
  console.warn('Firebase config is incomplete. Social login is disabled.');
}

export const getFirebaseAnalytics = async (): Promise<Analytics | null> => {
  if (!app || !firebaseConfig.measurementId || typeof window === 'undefined') {
    return null;
  }

  if (analyticsInstance) {
    return analyticsInstance;
  }

  if (!analyticsPromise) {
    analyticsPromise = import('firebase/analytics')
      .then(async ({ getAnalytics, isSupported }) => {
        const supported = await isSupported().catch(() => false);
        if (!supported) {
          return null;
        }

        analyticsInstance = getAnalytics(app as FirebaseApp);
        return analyticsInstance;
      })
      .catch((error) => {
        console.warn('Firebase Analytics initialization skipped:', error);
        return null;
      });
  }

  return analyticsPromise;
};

export { app, auth, googleProvider };
export const isFirebaseReady = Boolean(auth && googleProvider);
export { GoogleAuthProvider };
