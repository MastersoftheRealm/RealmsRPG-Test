/**
 * Login Page
 * ===========
 * User authentication page
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, Auth, browserPopupRedirectResolver } from 'firebase/auth';
import { doc, setDoc, Firestore } from 'firebase/firestore';

import { waitForFirebase, auth as firebaseAuth, db as firebaseDb } from '@/lib/firebase/client';
import { loginSchema, type LoginFormData } from '@/lib/validation';
import { AuthCard, FormInput, PasswordInput, SocialButton } from '@/components/auth';
import { Button, Alert } from '@/components/ui';

export default function LoginPage() {
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
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    if (!auth) {
      setError('Authentication service not ready. Please wait a moment and try again.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
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
      // Use browserPopupRedirectResolver explicitly for bundled environments (Next.js)
      // This is required when Firebase Auth is bundled by a module bundler
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
      
      // Create/update user document like vanilla site does
      const user = result.user;
      const email = user.email || '';
      const username = email.split('@')[0].substring(0, 5);
      await setDoc(doc(db, 'users', user.uid), { username }, { merge: true });
      
      router.push('/characters');
    } catch (err: unknown) {
      const authError = err as { code?: string; message?: string; customData?: unknown };
      console.error('Google sign-in error:', err);
      console.error('Error code:', authError.code);
      console.error('Error message:', authError.message);
      console.error('Error customData:', authError.customData);
      setError(getAuthErrorMessage(err));
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = () => {
    // Apple Sign-In placeholder
    setError('Apple Sign-In coming soon!');
  };

  return (
    <AuthCard 
      title="Welcome Back" 
      subtitle="Sign in to continue your adventure"
    >
      {error ? (
        <Alert variant="danger" className="mb-6">
          {error}
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
          placeholder="Enter your password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-primary-500 focus:ring-primary-500"
              {...register('rememberMe')}
            />
            Remember me
          </label>
          <Link 
            href="/forgot-password"
            className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || !firebaseReady}
        >
          {!firebaseReady ? 'Loading...' : isLoading ? 'Signing in...' : 'Sign In'}
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
        Don&apos;t have an account?{' '}
        <Link 
          href="/register"
          className="text-primary-400 hover:text-primary-300 transition-colors font-medium"
        >
          Create one
        </Link>
      </p>
    </AuthCard>
  );
}

function getAuthErrorMessage(error: unknown): string {
  const firebaseError = error as { code?: string; message?: string };
  
  switch (firebaseError.code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed. Please try again.';
    case 'auth/popup-blocked':
      return 'Popup was blocked. Please allow popups and try again.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized. Please contact support.';
    default:
      console.error('Auth error:', firebaseError);
      return firebaseError.message || 'An error occurred during sign in. Please try again.';
  }
}
