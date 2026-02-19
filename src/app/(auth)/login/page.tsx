/**
 * Login Page
 * ===========
 * User authentication page (Supabase Auth)
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';

import { loginSchema, type LoginFormData } from '@/lib/validation';
import { AuthCard, FormInput, PasswordInput, SocialButton } from '@/components/auth';
import { Spinner } from '@/components/ui';
import { Button, Alert } from '@/components/ui';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(true);

  const getRedirectPath = () => {
    const urlRedirect = searchParams.get('redirect');
    const sessionRedirect = typeof window !== 'undefined' ? sessionStorage.getItem('loginRedirect') : null;
    const raw = urlRedirect || sessionRedirect || '/';
    if (raw === '/login' || raw === '/register' || raw === '/forgot-password' || raw === '/forgot-username') {
      return '/';
    }
    return raw;
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
      if (err) throw err;
      sessionStorage.removeItem('loginRedirect');
      router.push(getRedirectPath());
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const redirectPath = getRedirectPath();
      const { data, error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectPath)}` },
      });
      if (err) throw err;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: unknown) {
      console.error('Google sign-in error:', err);
      setError(getAuthErrorMessage(err));
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = () => {
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
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer select-none">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer transition-colors"
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
          disabled={isLoading || !ready}
        >
          {!ready ? 'Loading...' : isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <div className="flex-1 h-px bg-gray-600" />
        <span className="text-gray-300 text-sm">or</span>
        <div className="flex-1 h-px bg-gray-600" />
      </div>

      <div className="space-y-3">
        <SocialButton
          provider="google"
          onClick={handleGoogleSignIn}
          disabled={isLoading || !ready}
        />
        <SocialButton
          provider="apple"
          onClick={handleAppleSignIn}
          disabled={isLoading || !ready}
        />
      </div>

      <p className="mt-6 text-center text-gray-300">
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthCard title="Welcome Back" subtitle="Sign in to continue your adventure">
          <div className="flex items-center justify-center py-8">
            <Spinner size="md" />
          </div>
        </AuthCard>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

function getAuthErrorMessage(error: unknown): string {
  const e = error as { message?: string; code?: string };
  const msg = (e.message ?? '').toLowerCase();
  if (msg.includes('invalid') || msg.includes('credentials')) return 'Invalid email or password';
  if (msg.includes('too many') || msg.includes('rate')) return 'Too many failed attempts. Please try again later.';
  if (msg.includes('network') || msg.includes('fetch')) return 'Network error. Please check your connection.';
  return e.message ?? 'An error occurred during sign in. Please try again.';
}
