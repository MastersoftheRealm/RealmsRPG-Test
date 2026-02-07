/**
 * Firebase Client-Side Configuration
 * ===================================
 * Client-side Firebase initialization for use in React components.
 * This file should only be imported in client components.
 * 
 * Uses Firebase Hosting's auto-generated config endpoint (/__/firebase/init.json)
 * which automatically injects configuration from Google Cloud Secrets.
 */

import { initializeApp, getApps, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getAuth, Auth, browserPopupRedirectResolver } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getDatabase, Database } from 'firebase/database';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFunctions, Functions } from 'firebase/functions';
import { initializeAppCheck, ReCaptchaV3Provider, AppCheck } from 'firebase/app-check';

// reCAPTCHA v3 Site Key for App Check (set via env; see .env.example)
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? '';

// Fallback config for local development (when not using Firebase Hosting)
const localConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'realmsrpg-test.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

// Initialize Firebase (singleton pattern)
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let rtdb: Database;
let storage: FirebaseStorage;
let functions: Functions;
let appCheck: AppCheck;
let initPromise: Promise<void> | null = null;

/**
 * Fetch Firebase config from Firebase Hosting's auto-generated endpoint.
 * This endpoint is automatically created when you deploy to Firebase Hosting
 * and injects your Google Cloud Secrets.
 */
async function fetchFirebaseConfig(): Promise<FirebaseOptions> {
  try {
    const response = await fetch('/__/firebase/init.json');
    if (!response.ok) {
      throw new Error('Failed to fetch Firebase config from hosting');
    }
    return await response.json();
  } catch (error) {
    console.warn('Using local Firebase config (not deployed to Firebase Hosting):', error);
    return localConfig;
  }
}

async function initializeFirebaseClient() {
  if (getApps().length > 0) {
    // Already initialized
    app = getApps()[0];
  } else {
    // Fetch config and initialize
    const config = await fetchFirebaseConfig();
    
    // ALWAYS override authDomain - this is critical for Google sign-in to work
    // The vanilla site does this exact same thing in firebase-init.js
    // The /__/firebase/init.json might return a different authDomain that doesn't work
    config.authDomain = 'realmsrpg-test.firebaseapp.com';
    
    app = initializeApp(config);
  }
  
  auth = getAuth(app);
  db = getFirestore(app);
  rtdb = getDatabase(app);
  storage = getStorage(app);
  functions = getFunctions(app);
  
  // Initialize App Check with reCAPTCHA v3 (set NEXT_PUBLIC_RECAPTCHA_SITE_KEY in .env)
  if (RECAPTCHA_SITE_KEY) {
    try {
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
        isTokenAutoRefreshEnabled: true
      });
    } catch (appCheckError) {
      // App Check may already be initialized — silently skip
    }
  }
  
  return { app, auth, db, rtdb, storage, functions, appCheck };
}

/**
 * Wait for Firebase to be initialized.
 * This is necessary because we fetch the config asynchronously.
 */
export async function waitForFirebase(): Promise<void> {
  if (!initPromise) {
    initPromise = initializeFirebaseClient().then(() => {});
  }
  return initPromise;
}

/**
 * Suppress common Firebase connection warnings in development.
 * These errors are typically caused by:
 * - Browser extensions intercepting messages
 * - Network instability or firewall issues
 * - Firebase cold starts
 * 
 * They don't affect functionality as Firebase auto-reconnects.
 */
function suppressConnectionWarnings() {
  if (typeof window === 'undefined') return;
  
  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    const message = args[0];
    if (typeof message === 'string') {
      // Suppress known benign Firebase connection messages
      if (
        message.includes('message channel closed before a response was received') ||
        message.includes('WebSocket connection to') && message.includes('failed')
      ) {
        // Suppress benign Firebase connection noise
        return;
      }
    }
    originalConsoleError.apply(console, args);
  };
}

// Auto-initialize on client side
if (typeof window !== 'undefined') {
  suppressConnectionWarnings();
  waitForFirebase().catch(err => {
    console.error('Failed to initialize Firebase:', err);
  });
}

export { app, auth, db, rtdb, storage, functions, appCheck, browserPopupRedirectResolver };
export { initializeFirebaseClient };
