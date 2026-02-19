/**
 * Register Page
 * ==============
 * User registration page (Supabase Auth)
 */

'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';

import { registerSchema, type RegisterFormData } from '@/lib/validation';
import { createUserProfileAction } from '@/app/(auth)/actions';
import { AuthCard, FormInput, PasswordInput, SocialButton } from '@/components/auth';
import { Spinner } from '@/components/ui';
import { Button, Alert } from '@/components/ui';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: authData, error: err } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });
      if (err) throw err;
      if (authData.user) {
        const chosenUsername = data.username?.trim();
        await createUserProfileAction({
          uid: authData.user.id,
          email: data.email,
          username: chosenUsername || undefined,
          displayName: undefined,
        });
      }
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
      const redirectPath = getRedirectPath();
      const supabase = createClient();
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
    <AuthCard title="Create Account" subtitle="Join the adventure">
      {error ? (
        <Alert variant="danger" className="mb-6">
          {error}
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormInput
          label="Username (optional)"
          type="text"
          placeholder="Leave blank for random e.g. Player123456"
          autoComplete="username"
          error={errors.username?.message}
          {...register('username')}
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

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating account...' : 'Create Account'}
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
          disabled={isLoading}
        />
        <SocialButton provider="apple" onClick={handleAppleSignIn} disabled={isLoading} />
      </div>

      <p className="mt-6 text-center text-gray-300">
        Already have an account?{' '}
        <Link href="/login" className="text-primary-400 hover:text-primary-300 transition-colors font-medium">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <AuthCard title="Join the Adventure" subtitle="Create your account to begin">
          <div className="flex items-center justify-center py-8">
            <Spinner size="md" />
          </div>
        </AuthCard>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}

function getAuthErrorMessage(error: unknown): string {
  const e = error as { message?: string };
  const msg = (e.message ?? '').toLowerCase();
  if (msg.includes('already') || msg.includes('exists')) return 'An account with this email already exists.';
  if (msg.includes('weak') || msg.includes('password')) return 'Password is too weak. Please choose a stronger password.';
  if (msg.includes('invalid') || msg.includes('email')) return 'Invalid email address.';
  if (msg.includes('network') || msg.includes('fetch')) return 'Network error. Please check your connection.';
  return e.message ?? 'An error occurred during registration. Please try again.';
}
