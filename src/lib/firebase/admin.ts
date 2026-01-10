/**
 * Firebase Admin Configuration
 * =============================
 * Server-side Firebase Admin SDK initialization.
 * Only use this in API routes and Server Components.
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getDatabase, Database } from 'firebase-admin/database';

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  if (!privateKey || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PROJECT_ID) {
    throw new Error('Missing Firebase Admin credentials in environment variables');
  }

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;
let adminRtdb: Database;

try {
  adminApp = getAdminApp();
  adminAuth = getAuth(adminApp);
  adminDb = getFirestore(adminApp);
  adminRtdb = getDatabase(adminApp);
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
}

export { adminApp, adminAuth, adminDb, adminRtdb };
