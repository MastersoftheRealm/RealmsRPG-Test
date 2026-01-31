/**
 * Session Management Utilities
 * =============================
 * Cookie-based session management for SSR authentication.
 * 
 * This enables Server Components to access the authenticated user
 * without requiring client-side hydration first.
 * 
 * Flow:
 * 1. Client signs in with Firebase Auth
 * 2. Client gets ID token and calls /api/session endpoint
 * 3. Server verifies token and creates secure httpOnly cookie
 * 4. Server Components can now read the session cookie
 */

import { cookies } from 'next/headers';
import { getAdminAuth, verifyIdToken } from './server';

// Session cookie configuration
export const SESSION_COOKIE_NAME = '__session';
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  // 5 days - Firebase ID tokens are valid for 1 hour, but we verify on each request
  maxAge: 60 * 60 * 24 * 5,
};

/**
 * Create a session cookie from a Firebase ID token.
 * Call this from an API route after the client signs in.
 */
export async function createSession(idToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify the ID token first
    const { user, error } = await verifyIdToken(idToken);
    if (error || !user) {
      console.error('Token verification failed:', error);
      return { success: false, error: error || 'Invalid token' };
    }
    
    // Create a session cookie using Firebase Admin
    const auth = getAdminAuth();
    const expiresIn = SESSION_COOKIE_OPTIONS.maxAge * 1000; // Convert to milliseconds
    
    try {
      const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
      
      // Set the cookie
      const cookieStore = await cookies();
      cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, SESSION_COOKIE_OPTIONS);
      
      return { success: true };
    } catch (cookieError) {
      // createSessionCookie can fail if:
      // 1. Service account credentials are not properly configured
      // 2. The token is expired or invalid
      // 3. IAM permissions are not set correctly
      console.error('Failed to create session cookie:', cookieError);
      const errorMessage = cookieError instanceof Error ? cookieError.message : 'Failed to create session cookie';
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    console.error('Error creating session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create session';
    return { success: false, error: errorMessage };
  }
}

/**
 * Verify the current session and return the user.
 * Use this in Server Components to get the authenticated user.
 */
export async function getSession() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    
    if (!sessionCookie?.value) {
      return { user: null, error: null };
    }
    
    const auth = getAdminAuth();
    const decodedClaims = await auth.verifySessionCookie(sessionCookie.value, true);
    
    return { 
      user: {
        uid: decodedClaims.uid,
        email: decodedClaims.email,
        name: decodedClaims.name,
        picture: decodedClaims.picture,
        emailVerified: decodedClaims.email_verified,
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Error verifying session:', error);
    return { user: null, error: 'Invalid session' };
  }
}

/**
 * Clear the session cookie.
 * Call this when the user signs out.
 */
export async function clearSession() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    return { success: true };
  } catch (error) {
    console.error('Error clearing session:', error);
    return { success: false };
  }
}

/**
 * Get the current user's UID from the session.
 * Convenience function for data fetching.
 */
export async function getSessionUserId(): Promise<string | null> {
  const { user } = await getSession();
  return user?.uid || null;
}

/**
 * Require authentication - throws if not authenticated.
 * Use this in Server Actions that require auth.
 */
export async function requireAuth() {
  const { user, error } = await getSession();
  if (!user) {
    throw new Error(error || 'Authentication required');
  }
  return user;
}

// Type for session user
export interface SessionUser {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  emailVerified?: boolean;
}
