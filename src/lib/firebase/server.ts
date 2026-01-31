/**
 * Firebase Admin SDK Server Configuration
 * =========================================
 * Server-side Firebase initialization using Admin SDK.
 * This file should only be imported in Server Components or Server Actions.
 * 
 * The Admin SDK bypasses client-side security rules and uses service account
 * credentials, making it suitable for trusted server-side operations.
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getDatabase, Database } from 'firebase-admin/database';

// Singleton instances
let adminApp: App | null = null;
let adminAuth: Auth | null = null;
let adminDb: Firestore | null = null;
let adminRtdb: Database | null = null;

/**
 * Get the Firebase Admin service account credentials.
 * In production, these come from environment variables set by Firebase Hosting.
 * For local development, use GOOGLE_APPLICATION_CREDENTIALS or explicit config.
 */
function getServiceAccount() {
  // Check for explicit service account JSON
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } catch {
      console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY');
    }
  }
  
  // Use individual environment variables (Firebase Hosting pattern)
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'realmsrpg-test';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  if (clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey };
  }
  
  // Return null to use Application Default Credentials (ADC)
  // This works automatically in Google Cloud environments (Cloud Functions, Cloud Run, etc.)
  return null;
}

/**
 * Initialize Firebase Admin SDK.
 * This is idempotent - calling multiple times returns the same instance.
 */
export function initializeFirebaseAdmin(): App {
  if (adminApp) {
    return adminApp;
  }
  
  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return adminApp;
  }
  
  const serviceAccount = getServiceAccount();
  const databaseURL = process.env.FIREBASE_DATABASE_URL || 'https://realmsrpg-test-default-rtdb.firebaseio.com';
  
  if (serviceAccount) {
    // Use explicit credentials
    adminApp = initializeApp({
      credential: cert(serviceAccount),
      databaseURL,
    });
  } else {
    // Use Application Default Credentials (Google Cloud environments)
    // or the default Firebase Admin initialization (Firebase Hosting)
    adminApp = initializeApp({
      databaseURL,
    });
  }
  
  return adminApp;
}

/**
 * Get Firebase Admin Auth instance.
 */
export function getAdminAuth(): Auth {
  if (!adminAuth) {
    const app = initializeFirebaseAdmin();
    adminAuth = getAuth(app);
  }
  return adminAuth;
}

/**
 * Get Firebase Admin Firestore instance.
 */
export function getAdminFirestore(): Firestore {
  if (!adminDb) {
    initializeFirebaseAdmin();
    adminDb = getFirestore();
  }
  return adminDb;
}

/**
 * Get Firebase Admin Realtime Database instance.
 */
export function getAdminDatabase(): Database {
  if (!adminRtdb) {
    const app = initializeFirebaseAdmin();
    adminRtdb = getDatabase(app);
  }
  return adminRtdb;
}

// =============================================================================
// Server-Side Data Fetching Utilities
// =============================================================================

/**
 * Verify a Firebase ID token and return the decoded claims.
 * Use this in Server Components to verify the user's session.
 */
export async function verifyIdToken(idToken: string) {
  try {
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    return { user: decodedToken, error: null };
  } catch (error) {
    console.error('Error verifying ID token:', error);
    return { user: null, error: 'Invalid or expired token' };
  }
}

/**
 * Get user data by UID.
 */
export async function getUserByUid(uid: string) {
  try {
    const auth = getAdminAuth();
    return await auth.getUser(uid);
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

/**
 * Get a user's characters from Firestore.
 */
export async function getUserCharacters(uid: string) {
  try {
    const db = getAdminFirestore();
    const charactersRef = db.collection('users').doc(uid).collection('character');
    const snapshot = await charactersRef.orderBy('updatedAt', 'desc').get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
    }));
  } catch (error) {
    console.error('Error fetching characters:', error);
    return [];
  }
}

/**
 * Get a single character by ID.
 */
export async function getCharacterById(uid: string, characterId: string) {
  try {
    const db = getAdminFirestore();
    const characterRef = db.collection('users').doc(uid).collection('character').doc(characterId);
    const doc = await characterRef.get();
    
    if (!doc.exists) {
      return null;
    }
    
    const data = doc.data()!;
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
    };
  } catch (error) {
    console.error('Error fetching character:', error);
    return null;
  }
}

// =============================================================================
// RTDB Data Fetching (for game data like feats, skills, species, etc.)
// =============================================================================

/**
 * Fetch data from Realtime Database.
 * This is useful for fetching game data that doesn't require authentication.
 */
export async function fetchFromRTDB<T = unknown>(path: string): Promise<T | null> {
  try {
    const rtdb = getAdminDatabase();
    const snapshot = await rtdb.ref(path).once('value');
    return snapshot.val() as T;
  } catch (error) {
    console.error(`Error fetching RTDB path ${path}:`, error);
    return null;
  }
}

/**
 * Fetch all feats from RTDB.
 */
export async function getFeats() {
  return fetchFromRTDB<Record<string, unknown>>('feats');
}

/**
 * Fetch all skills from RTDB.
 */
export async function getSkills() {
  return fetchFromRTDB<Record<string, unknown>>('skills');
}

/**
 * Fetch all species from RTDB.
 */
export async function getSpecies() {
  return fetchFromRTDB<Record<string, unknown>>('species');
}

/**
 * Fetch all traits from RTDB.
 */
export async function getTraits() {
  return fetchFromRTDB<Record<string, unknown>>('traits');
}

/**
 * Fetch all archetypes from RTDB.
 */
export async function getArchetypes() {
  return fetchFromRTDB<Record<string, unknown>>('archetypes');
}

/**
 * Fetch power parts from RTDB.
 */
export async function getPowerParts() {
  return fetchFromRTDB<Record<string, unknown>>('powerParts');
}

/**
 * Fetch technique parts from RTDB.
 */
export async function getTechniqueParts() {
  return fetchFromRTDB<Record<string, unknown>>('techniqueParts');
}

/**
 * Fetch item properties from RTDB.
 */
export async function getItemProperties() {
  return fetchFromRTDB<Record<string, unknown>>('itemProperties');
}

/**
 * Fetch equipment from RTDB.
 */
export async function getEquipment() {
  return fetchFromRTDB<Record<string, unknown>>('equipment');
}
