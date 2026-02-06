/**
 * Authentication Server Actions
 * ==============================
 * Server actions for authentication-related operations.
 * 
 * Note: Firebase Auth is primarily client-side, so these actions
 * handle server-side tasks like session management and user profile updates.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { clearSession, requireAuth, getSession } from '@/lib/firebase/session';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/server';

/**
 * Sign out the user by clearing their session.
 * This is called after the client-side Firebase signOut.
 */
export async function signOutAction() {
  await clearSession();
  revalidatePath('/', 'layout');
  redirect('/login');
}

/**
 * Create or update user profile in Firestore.
 * Called after successful sign-up or first Google sign-in.
 */
export async function createUserProfileAction(data: {
  uid: string;
  email: string;
  username: string;
  displayName?: string;
}) {
  try {
    const db = getAdminFirestore();
    const userRef = db.collection('users').doc(data.uid);
    
    await userRef.set({
      email: data.email,
      username: data.username,
      displayName: data.displayName || data.username,
      createdAt: new Date(),
      updatedAt: new Date(),
    }, { merge: true });
    
    return { success: true };
  } catch (error) {
    console.error('Error creating user profile:', error);
    return { success: false, error: 'Failed to create user profile' };
  }
}

/**
 * Update the current user's profile.
 */
export async function updateUserProfileAction(data: {
  displayName?: string;
  username?: string;
}) {
  try {
    const user = await requireAuth();
    const db = getAdminFirestore();
    const userRef = db.collection('users').doc(user.uid);
    
    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    
    if (data.displayName !== undefined) {
      updates.displayName = data.displayName;
      
      // Also update Firebase Auth display name
      const auth = getAdminAuth();
      await auth.updateUser(user.uid, { displayName: data.displayName });
    }
    
    if (data.username !== undefined) {
      updates.username = data.username;
    }
    
    await userRef.update(updates);
    revalidatePath('/profile');
    
    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error: 'Failed to update profile' };
  }
}

/**
 * Get the current user's profile from Firestore.
 */
export async function getUserProfileAction() {
  try {
    const { user } = await getSession();
    if (!user) {
      return { profile: null, error: null };
    }
    
    const db = getAdminFirestore();
    const userRef = db.collection('users').doc(user.uid);
    const doc = await userRef.get();
    
    if (!doc.exists) {
      return { profile: null, error: null };
    }
    
    return { 
      profile: { 
        uid: user.uid, 
        ...doc.data() 
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { profile: null, error: 'Failed to get profile' };
  }
}

/**
 * Check if a username is available.
 */
export async function checkUsernameAvailableAction(username: string) {
  try {
    const db = getAdminFirestore();
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('username', '==', username.toLowerCase()).get();
    
    return { available: snapshot.empty };
  } catch (error) {
    console.error('Error checking username:', error);
    return { available: false, error: 'Failed to check username' };
  }
}

/** Basic blocklist of inappropriate username substrings (case-insensitive) */
const USERNAME_BLOCKLIST = [
  'admin', 'moderator', 'support', 'realmsrpg', 'realms', 'official',
  'null', 'undefined', 'delete', 'remove', 'system', 'root',
];

const USERNAME_MIN_LEN = 3;
const USERNAME_MAX_LEN = 24;
const RATE_LIMIT_DAYS = 7;

/**
 * Change the current user's username.
 * Enforces: uniqueness, blocklist, rate limit (once per week).
 */
export async function changeUsernameAction(newUsername: string) {
  try {
    const user = await requireAuth();
    const db = getAdminFirestore();
    
    const trimmed = newUsername.trim();
    const normalized = trimmed.toLowerCase();
    
    if (trimmed.length < USERNAME_MIN_LEN) {
      return { success: false, error: `Username must be at least ${USERNAME_MIN_LEN} characters` };
    }
    if (trimmed.length > USERNAME_MAX_LEN) {
      return { success: false, error: `Username must be at most ${USERNAME_MAX_LEN} characters` };
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      return { success: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
    }
    
    const blocked = USERNAME_BLOCKLIST.some((w) => normalized.includes(w));
    if (blocked) {
      return { success: false, error: 'This username is not allowed' };
    }
    
    const userRef = db.collection('users').doc(user.uid);
    const userDoc = await userRef.get();
    const userData = userDoc.data();
    const currentUsername = (userData?.username as string) || '';
    const currentNormalized = currentUsername.toLowerCase();
    
    if (normalized === currentNormalized) {
      return { success: false, error: 'New username is the same as your current username' };
    }
    
    const lastChange = userData?.lastUsernameChange?.toDate?.();
    if (lastChange) {
      const daysSince = (Date.now() - lastChange.getTime()) / (24 * 60 * 60 * 1000);
      if (daysSince < RATE_LIMIT_DAYS) {
        const remaining = Math.ceil(RATE_LIMIT_DAYS - daysSince);
        return { success: false, error: `You can change your username again in ${remaining} day(s)` };
      }
    }
    
    const usersRef = db.collection('users');
    const existingUser = await usersRef.where('username', '==', normalized).get();
    const takenByOther = existingUser.docs.some((d) => d.id !== user.uid);
    if (takenByOther) {
      return { success: false, error: 'This username is already taken' };
    }
    
    const usernamesRef = db.collection('usernames');
    
    const batch = db.batch();
    
    if (currentNormalized) {
      batch.delete(usernamesRef.doc(currentNormalized));
      if (currentUsername !== currentNormalized) {
        batch.delete(usernamesRef.doc(currentUsername));
      }
    }
    
    batch.set(usernamesRef.doc(normalized), { uid: user.uid });
    batch.update(userRef, {
      username: normalized,
      lastUsernameChange: new Date(),
      updatedAt: new Date(),
    });
    
    await batch.commit();
    revalidatePath('/my-account');
    
    return { success: true };
  } catch (error) {
    console.error('Error changing username:', error);
    return { success: false, error: 'Failed to change username' };
  }
}

/**
 * Delete the current user's account.
 * This removes:
 * 1. Firebase Auth account
 * 2. User profile in Firestore
 * 3. All user's characters
 * 4. User's library items
 */
export async function deleteAccountAction() {
  try {
    const user = await requireAuth();
    const auth = getAdminAuth();
    const db = getAdminFirestore();
    
    // Delete user data from Firestore
    const userRef = db.collection('users').doc(user.uid);
    
    // Delete subcollections
    const collections = ['character', 'powers', 'techniques', 'items'];
    for (const collectionName of collections) {
      const collectionRef = userRef.collection(collectionName);
      const snapshot = await collectionRef.get();
      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      if (!snapshot.empty) {
        await batch.commit();
      }
    }
    
    // Delete user document
    await userRef.delete();
    
    // Delete Firebase Auth account
    await auth.deleteUser(user.uid);
    
    // Clear session
    await clearSession();
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting account:', error);
    return { success: false, error: 'Failed to delete account' };
  }
}
