/**
 * useAuth Hook
 * =============
 * React hook for authentication with Firebase listener
 */

'use client';

import { useEffect, useCallback, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth, waitForFirebase } from '@/lib/firebase/client';
import { useAuthStore } from '@/stores/auth-store';

export function useAuth() {
  const {
    user,
    loading,
    error,
    initialized,
    setUser,
    setLoading,
    setError,
    setInitialized,
    clearError,
  } = useAuthStore();

  const [firebaseReady, setFirebaseReady] = useState(false);

  // Wait for Firebase to initialize
  useEffect(() => {
    waitForFirebase()
      .then(() => {
        setFirebaseReady(true);
      })
      .catch((err) => {
        console.error('Firebase initialization failed:', err);
        setError('Failed to initialize Firebase');
        setInitialized(true);
      });
  }, [setError, setInitialized]);

  // Set up auth state listener once Firebase is ready
  useEffect(() => {
    if (!firebaseReady) return;

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUser(user);
        setInitialized(true);
      },
      (error) => {
        setError(error.message);
        setInitialized(true);
      }
    );

    return () => unsubscribe();
  }, [firebaseReady, setUser, setError, setInitialized]);

  // Sign in with email/password
  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      clearError();
      try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return result.user;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to sign in';
        setError(message);
        throw err;
      }
    },
    [setLoading, setError, clearError]
  );

  // Sign up with email/password
  const signUp = useCallback(
    async (email: string, password: string, displayName?: string) => {
      setLoading(true);
      clearError();
      try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        
        if (displayName && result.user) {
          await updateProfile(result.user, { displayName });
        }
        
        return result.user;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create account';
        setError(message);
        throw err;
      }
    },
    [setLoading, setError, clearError]
  );

  // Sign out
  const signOut = useCallback(async () => {
    setLoading(true);
    clearError();
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign out';
      setError(message);
      throw err;
    }
  }, [setLoading, setError, clearError]);

  // Reset password
  const resetPassword = useCallback(
    async (email: string) => {
      setLoading(true);
      clearError();
      try {
        await sendPasswordResetEmail(auth, email);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send reset email';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, clearError]
  );

  // Update user profile
  const updateUserProfile = useCallback(
    async (updates: { displayName?: string; photoURL?: string }) => {
      if (!user) throw new Error('No user logged in');
      
      setLoading(true);
      clearError();
      try {
        await updateProfile(user, updates);
        // Force refresh the user object
        setUser(auth.currentUser);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update profile';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user, setUser, setLoading, setError, clearError]
  );

  return {
    user,
    loading,
    error,
    initialized,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateUserProfile,
    clearError,
  };
}

// Re-export for convenience
export { useAuthStore };
