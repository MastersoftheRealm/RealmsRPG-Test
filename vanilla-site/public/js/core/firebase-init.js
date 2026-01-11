/**
 * RealmsRPG Shared Firebase Initialization
 * =========================================
 * Centralized Firebase initialization for the entire site.
 * Import this module instead of initializing Firebase in each file.
 */

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-functions.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app-check.js";
import { RECAPTCHA_SITE_KEY, AUTH_DOMAIN } from './environment.js';

// Singleton instances
let app = null;
let auth = null;
let db = null;
let rtdb = null;
let functions = null;
let initialized = false;
let initPromise = null;

/**
 * Get the Firebase configuration from the hosting environment.
 * @returns {Promise<Object>} Firebase config object
 */
async function getFirebaseConfig() {
    try {
        const response = await fetch('/__/firebase/init.json');
        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        console.warn('Could not fetch Firebase config from hosting, using fallback');
    };
}

/**
 * Initialize Firebase app and all services.
 * This is idempotent - calling it multiple times will return the same instances.
 * 
 * @returns {Promise<{app: FirebaseApp, auth: Auth, db: Firestore, rtdb: Database, functions: Functions}>}
 */
export async function initializeFirebase() {
    // Return existing promise if initialization is in progress
    if (initPromise) {
        return initPromise;
    }
    
    // Return cached instances if already initialized
    if (initialized && app) {
        return { app, auth, db, rtdb, functions };
    }
    
    initPromise = (async () => {
        try {
            // Check if Firebase is already initialized
            if (getApps().length > 0) {
                app = getApp();
                console.debug('Firebase already initialized, reusing existing app');
            } else {
                const config = await getFirebaseConfig();
                // Override authDomain with centralized environment config
                config.authDomain = AUTH_DOMAIN;
                try {
                    app = initializeApp(config);
                } catch (initError) {
                    // Handle race condition - another call may have initialized while we fetched config
                    if (initError.code === 'app/duplicate-app' && getApps().length > 0) {
                        app = getApp();
                        console.debug('Firebase initialized by another module, reusing existing app');
                    } else {
                        throw initError;
                    }
                }
            }
            
            // Initialize services
            auth = getAuth(app);
            db = getFirestore(app);
            rtdb = getDatabase(app);
            functions = getFunctions(app);
            
            // Initialize App Check
            try {
                initializeAppCheck(app, {
                    provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
                    isTokenAutoRefreshEnabled: true
                });
            } catch (appCheckError) {
                // App Check may already be initialized
                console.debug('App Check initialization skipped:', appCheckError.message);
            }
            
            initialized = true;
            return { app, auth, db, rtdb, functions };
        } catch (error) {
            console.error('Firebase initialization error:', error);
            throw error;
        }
    })();
    
    return initPromise;
}

/**
 * Wait for Firebase Auth to be ready and return the current user.
 * 
 * @returns {Promise<User|null>} The current user or null if not authenticated
 */
export async function waitForAuth() {
    await initializeFirebase();
    
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve(user);
        });
    });
}

/**
 * Check if a user is currently authenticated.
 * 
 * @returns {Promise<boolean>} True if a user is logged in
 */
export async function isAuthenticated() {
    const user = await waitForAuth();
    return user !== null;
}

/**
 * Get the current user, throwing an error if not authenticated.
 * 
 * @returns {Promise<User>} The current user
 * @throws {Error} If no user is authenticated
 */
export async function requireAuth() {
    const user = await waitForAuth();
    if (!user) {
        throw new Error('Authentication required');
    }
    return user;
}

/**
 * Fetch data from Realtime Database with retry logic.
 * 
 * @param {string} path - The database path to fetch
 * @param {number} [attempts=3] - Number of retry attempts
 * @returns {Promise<DataSnapshot>} The database snapshot
 */
export async function getWithRetry(path, attempts = 3) {
    await initializeFirebase();
    const dbRef = ref(rtdb, path);
    let lastError;
    
    for (let i = 0; i < attempts; i++) {
        try {
            return await get(dbRef);
        } catch (err) {
            lastError = err;
            const msg = (err && err.message) || '';
            const isOffline = msg.includes('Client is offline') || msg.toLowerCase().includes('network');
            
            if (!isOffline || i === attempts - 1) {
                throw err;
            }
            
            // Wait before retry with exponential backoff
            await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
        }
    }
    
    throw lastError;
}

/**
 * Get the Auth instance (after initialization).
 * @returns {Auth}
 */
export function getAuthInstance() {
    if (!auth) {
        throw new Error('Firebase not initialized. Call initializeFirebase() first.');
    }
    return auth;
}

/**
 * Get the Firestore instance (after initialization).
 * @returns {Firestore}
 */
export function getFirestoreInstance() {
    if (!db) {
        throw new Error('Firebase not initialized. Call initializeFirebase() first.');
    }
    return db;
}

/**
 * Get the Realtime Database instance (after initialization).
 * @returns {Database}
 */
export function getDatabaseInstance() {
    if (!rtdb) {
        throw new Error('Firebase not initialized. Call initializeFirebase() first.');
    }
    return rtdb;
}

/**
 * Get the Functions instance (after initialization).
 * @returns {Functions}
 */
export function getFunctionsInstance() {
    if (!functions) {
        throw new Error('Firebase not initialized. Call initializeFirebase() first.');
    }
    return functions;
}

// Export singleton instances for direct access (use after initializeFirebase() is called)
export { auth, db, rtdb, functions };

// Re-export commonly used Firebase functions for convenience
export { 
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

export {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

export {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

export {
    httpsCallable
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-functions.js";

export {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    updateEmail,
    updatePassword
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
