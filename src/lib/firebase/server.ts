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
 * In production, these come from Google Cloud Secret Manager (accessed via environment variables).
 * Supports multiple formats for flexibility with existing Secret Manager setup.
 */
function getServiceAccount(): Record<string, unknown> | { projectId: string; clientEmail: string; privateKey: string } | null {
  // 1. Full JSON key (FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS_JSON)
  const jsonKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (jsonKey) {
    try {
      const parsed = JSON.parse(jsonKey);
      if (parsed.project_id && parsed.client_email && parsed.private_key) {
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse service account JSON key:', e);
    }
  }

  // 2. Individual env vars from Secret Manager (SERVICE_ACCOUNT_EMAIL, SERVICE_ACCOUNT_PRIVATE_KEY)
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'realmsrpg-test';
  const clientEmail = process.env.SERVICE_ACCOUNT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.SERVICE_ACCOUNT_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY)?.replace(/\\n/g, '\n');

  if (clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey };
  }

  // Log which env vars are missing for debugging (only in dev to avoid log noise)
  if (process.env.NODE_ENV !== 'production') {
    if (!clientEmail) console.warn('SERVICE_ACCOUNT_EMAIL not set - session cookies may not work');
    if (!privateKey) console.warn('SERVICE_ACCOUNT_PRIVATE_KEY not set - session cookies may not work');
  }

  // 3. Fall back to Application Default Credentials (ADC)
  // Works in Google Cloud (Cloud Run, Cloud Functions) when service account is attached
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
    const app = initializeFirebaseAdmin();
    adminDb = getFirestore(app);
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
// Codex Data Fetching (from Firestore — migrated from RTDB)
// =============================================================================

/**
 * Fetch all documents from a Firestore codex collection.
 * Returns Record<id, data> for compatibility with existing consumers.
 */
async function fetchCodexCollection(
  collectionName: string
): Promise<Record<string, unknown> | null> {
  try {
    const db = getAdminFirestore();
    const snapshot = await db.collection(collectionName).get();
    const out: Record<string, unknown> = {};
    snapshot.docs.forEach((d) => {
      out[d.id] = d.data();
    });
    return out;
  } catch (error) {
    console.error(`Error fetching Firestore ${collectionName}:`, error);
    return null;
  }
}

/**
 * Fetch all feats from Firestore codex_feats.
 */
export async function getFeats() {
  return fetchCodexCollection('codex_feats');
}

/**
 * Fetch all skills from Firestore codex_skills.
 */
export async function getSkills() {
  return fetchCodexCollection('codex_skills');
}

/**
 * Fetch all species from Firestore codex_species.
 */
export async function getSpecies() {
  return fetchCodexCollection('codex_species');
}

/**
 * Fetch all traits from Firestore codex_traits.
 */
export async function getTraits() {
  return fetchCodexCollection('codex_traits');
}

/**
 * Fetch all archetypes from Firestore codex_archetypes.
 */
export async function getArchetypes() {
  return fetchCodexCollection('codex_archetypes');
}

/**
 * Fetch power parts from Firestore codex_parts (filtered by type).
 */
export async function getPowerParts() {
  const all = await fetchCodexCollection('codex_parts');
  if (!all) return null;
  return Object.fromEntries(
    Object.entries(all).filter(
      ([_, v]) => (v as Record<string, unknown>)?.type === 'power'
    )
  );
}

/**
 * Fetch technique parts from Firestore codex_parts (filtered by type).
 */
export async function getTechniqueParts() {
  const all = await fetchCodexCollection('codex_parts');
  if (!all) return null;
  return Object.fromEntries(
    Object.entries(all).filter(
      ([_, v]) => (v as Record<string, unknown>)?.type === 'technique'
    )
  );
}

/**
 * Fetch item properties from Firestore codex_properties.
 */
export async function getItemProperties() {
  return fetchCodexCollection('codex_properties');
}

/**
 * Fetch equipment from Firestore codex_equipment.
 */
export async function getEquipment() {
  return fetchCodexCollection('codex_equipment');
}

/**
 * Fetch data from Realtime Database (legacy — use codex Firestore for game data).
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
