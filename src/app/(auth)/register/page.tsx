/**
 * Register Page
 * ==============
 * User registration page
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup, Auth } from 'firebase/auth';
import { doc, setDoc, Firestore } from 'firebase/firestore';

import { waitForFirebase, auth as firebaseAuth, db as firebaseDb } from '@/lib/firebase/client';
import { registerSchema, type RegisterFormData } from '@/lib/validation';
import { AuthCard, FormInput, PasswordInput, SocialButton } from '@/components/auth';
import { Button } from '@/components/ui';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [db, setDb] = useState<Firestore | null>(null);

  // Wait for Firebase to initialize
  useEffect(() => {
    waitForFirebase()
      .then(() => {
        setAuth(firebaseAuth);
        setDb(firebaseDb);
        setFirebaseReady(true);
      })
      .catch((err) => {
        console.error('Firebase initialization failed:', err);
        setError('Failed to connect to authentication service.');
      });
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    if (!auth || !db) {
      setError('Authentication service not ready. Please wait a moment and try again.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        data.email, 
        data.password
      );
      
      // Update display name
      await updateProfile(userCredential.user, {
        displayName: data.displayName,
      });

      // Create user document (includes username for vanilla site compatibility)
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        username: data.displayName, // For vanilla site compatibility
        displayName: data.displayName,
        email: data.email,
        createdAt: new Date(),
      });

      // Create username mapping for vanilla site compatibility
      await setDoc(doc(db, 'usernames', data.displayName), {
        uid: userCredential.user.uid,
      });

      router.push('/characters');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth || !db) {
      setError('Authentication service not ready. Please wait a moment and try again.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Create user document if it does not exist (includes username for vanilla site compatibility)
      await setDoc(doc(db, 'users', result.user.uid), {
        username: result.user.displayName || result.user.email?.split('@')[0],
        displayName: result.user.displayName,
        email: result.user.email,
        createdAt: new Date(),
      }, { merge: true });

      // Create username mapping if displayName exists
      if (result.user.displayName) {
        await setDoc(doc(db, 'usernames', result.user.displayName), {
          uid: result.user.uid,
        }, { merge: true });
      }

      router.push('/characters');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = () => {
    setError('Apple Sign-In coming soon!');
  };

  return (
    <AuthCard 
      title="Create Account" 
      subtitle="Join the adventure"
    >
      {error ? (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormInput
          label="Display Name"
          type="text"
          placeholder="Choose a display name"
          autoComplete="name"
          error={errors.displayName?.message}
          {...register('displayName')}
        />

        <FormInput
          label="Email"
          type="email"
          placeholder="Enter your email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />

        <PasswordInput
          label="Password"
          placeholder="Create a password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <PasswordInput
          label="Confirm Password"
          placeholder="Confirm your password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="acceptTerms"
            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-primary-500 focus:ring-primary-500"
            {...register('acceptTerms')}
          />
          <label htmlFor="acceptTerms" className="text-sm text-gray-300">
            I agree to the{' '}
            <Link href="/terms" className="text-primary-400 hover:text-primary-300">
              Terms of Service
            </Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-primary-400 hover:text-primary-300">
              Privacy Policy
            </Link>
          </label>
        </div>
        {errors.acceptTerms ? (
          <p className="text-sm text-red-400 -mt-3">{errors.acceptTerms.message}</p>
        ) : null}

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || !firebaseReady}
        >
          {!firebaseReady ? 'Loading...' : isLoading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <div className="flex-1 h-px bg-gray-600" />
        <span className="text-gray-400 text-sm">or</span>
        <div className="flex-1 h-px bg-gray-600" />
      </div>

      <div className="space-y-3">
        <SocialButton
          provider="google"
          onClick={handleGoogleSignIn}
          disabled={isLoading || !firebaseReady}
        />
        <SocialButton
          provider="apple"
          onClick={handleAppleSignIn}
          disabled={isLoading || !firebaseReady}
        />
      </div>

      <p className="mt-6 text-center text-gray-400">
        Already have an account?{' '}
        <Link 
          href="/login"
          className="text-primary-400 hover:text-primary-300 transition-colors font-medium"
        >
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}

function getAuthErrorMessage(error: unknown): string {
  const firebaseError = error as { code?: string };
  
  switch (firebaseError.code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a stronger password.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed. Please try again.';
    default:
      return 'An error occurred during registration. Please try again.';
  }
}
