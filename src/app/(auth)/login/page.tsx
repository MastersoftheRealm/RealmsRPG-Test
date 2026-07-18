/**
 * Login Page
 * ===========
 * User authentication page (Supabase Auth)
 */

'use client';

import { useState, Suspense } from 'react';import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { hasGuestEncountersToMigrate, migrateGuestEncountersOnSignIn } from '@/lib/guest-encounter-migration';

import { loginSchema, type LoginFormData } from '@/lib/validation';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { sanitizeRedirectPath } from '@/lib/safe-redirect';
import { resendConfirmationAction } from '@/app/(auth)/auth-actions';
import { AuthCard, FormInput, PasswordInput, SocialButton } from '@/components/auth';
import { Spinner } from '@/components/ui';
import { Button, Alert } from '@/components/ui';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [lastAttemptEmail, setLastAttemptEmail] = useState<string>('');
  /** When true, ignore ?error= from the URL (user started a new sign-in attempt). */
  const [ignoreAuthParam, setIgnoreAuthParam] = useState(false);
  const errorParam = searchParams.get('error');
  const [prevErrorParam, setPrevErrorParam] = useState(errorParam);
  if (errorParam !== prevErrorParam) {
    setPrevErrorParam(errorParam);
    setIgnoreAuthParam(false);
  }

  const getRedirectPath = () => {
    const urlRedirect = searchParams.get('redirect') ?? searchParams.get('returnTo');
    const sessionRedirect = typeof window !== 'undefined' ? sessionStorage.getItem('loginRedirect') : null;
    return sanitizeRedirectPath(urlRedirect || sessionRedirect || '/');
  };

  const authParamError =
    !ignoreAuthParam && errorParam === 'confirm'
      ? 'Email confirmation failed or expired. Please sign in again, or request a new confirmation email.'
      : !ignoreAuthParam && errorParam === 'auth_callback'
        ? 'Sign-in failed. Please try again.'
        : null;
  const displayError = error ?? authParamError;

  const clearDisplayedError = () => {
    setError(null);
    setIgnoreAuthParam(true);
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
    clearDisplayedError();
    setResendStatus('idle');
    setLastAttemptEmail(data.email);

    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
      if (err) throw err;
      if (hasGuestEncountersToMigrate()) {
        await migrateGuestEncountersOnSignIn();
      }
      sessionStorage.removeItem('loginRedirect');
      router.push(getRedirectPath());
    } catch (err) {
      setError(getAuthErrorMessage(err, 'login'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    const email = lastAttemptEmail.trim();
    if (!email) {
      setError('Enter your email above, then try again.');
      return;
    }
    setResendStatus('sending');
    clearDisplayedError();
    try {
      const redirectPath = getRedirectPath();
      const result = await resendConfirmationAction(email, redirectPath);
      if (!result.success) throw new Error(result.error);
      setResendStatus('sent');
    } catch (e) {
      setResendStatus('idle');
      setError(getAuthErrorMessage(e, 'resend'));
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    clearDisplayedError();

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
      setError(getAuthErrorMessage(err, 'login'));
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title="Welcome Back"
      subtitle="Sign in to continue your adventure"
    >
      {displayError ? (
        <Alert variant="danger" className="mb-6">
          {displayError}
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
          <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer select-none">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border-light dark:border-border bg-surface text-primary-fg focus:ring-2 focus:ring-primary-outline-border focus:ring-offset-0 cursor-pointer transition-colors"
              {...register('rememberMe')}
            />
            Remember me
          </label>
          <Link
            href="/forgot-password"
            className="text-sm text-primary-link-fg hover:text-primary-fg-hover transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
          aria-label="Sign in"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      {error && error.toLowerCase().includes('confirm your email') ? (
        <div className="mt-4">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={handleResendConfirmation}
            disabled={resendStatus === 'sending'}
          >
            {resendStatus === 'sending'
              ? 'Sending...'
              : resendStatus === 'sent'
                ? 'Confirmation email sent'
                : 'Resend confirmation email'}
          </Button>
        </div>
      ) : null}

      <div className="my-6 flex items-center gap-4">
        <div className="flex-1 h-px bg-border-light dark:bg-border" />
        <span className="text-text-secondary text-sm">or</span>
        <div className="flex-1 h-px bg-border-light dark:bg-border" />
      </div>

      <div className="space-y-3">
        <SocialButton
          provider="google"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        />
      </div>

      <p className="mt-6 text-center text-text-secondary">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="text-primary-link-fg hover:text-primary-fg-hover transition-colors font-medium"
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

