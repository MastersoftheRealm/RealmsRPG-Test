/**
 * Login Page
 * ===========
 * User authentication page (Supabase Auth)
 */

'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import {
  hasGuestEncountersToMigrate,
  migrateGuestEncountersOnSignIn,
} from '@/lib/guest-encounter-migration';
import {
  hasGuestCharactersToMigrate,
  migrateGuestCharactersOnSignIn,
} from '@/lib/guest-character-migration';

import { loginSchema, type LoginFormData } from '@/lib/validation';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { sanitizeRedirectPath } from '@/lib/safe-redirect';
import { resendConfirmationAction } from '@/app/(auth)/auth-actions';
import { AuthCard, AuthTurnstile, FormInput, PasswordInput, SocialButton } from '@/components/auth';
import { Spinner } from '@/components/ui';
import { Button, Alert } from '@/components/ui';
import { useAuthCaptcha } from '@/hooks/use-auth-captcha';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [lastAttemptEmail, setLastAttemptEmail] = useState<string>('');
  /** When true, ignore ?error= from the URL (user started a new sign-in attempt). */
  const [ignoreAuthParam, setIgnoreAuthParam] = useState(false);
  const {
    captchaReady,
    captchaBlockMessage,
    captchaOptions,
    captchaResetKey,
    setCaptchaToken,
    resetCaptcha,
  } = useAuthCaptcha();
  const errorParam = searchParams.get('error');
  const [prevErrorParam, setPrevErrorParam] = useState(errorParam);
  if (errorParam !== prevErrorParam) {
    setPrevErrorParam(errorParam);
    setIgnoreAuthParam(false);
  }

  const getRedirectPath = () => {
    const urlRedirect = searchParams.get('redirect') ?? searchParams.get('returnTo');
    const sessionRedirect =
      typeof window !== 'undefined' ? sessionStorage.getItem('loginRedirect') : null;
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

    if (captchaBlockMessage) {
      setError(captchaBlockMessage);
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
        options: captchaOptions,
      });
      if (err) throw err;
      if (hasGuestEncountersToMigrate()) {
        await migrateGuestEncountersOnSignIn();
      }
      if (hasGuestCharactersToMigrate()) {
        await migrateGuestCharactersOnSignIn();
      }
      sessionStorage.removeItem('loginRedirect');
      router.push(getRedirectPath());
    } catch (err) {
      resetCaptcha();
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
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`,
        },
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
    <AuthCard title="Welcome Back" subtitle="Sign in to continue your adventure">
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
          <label className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary select-none">
            <input
              type="checkbox"
              className="h-4 w-4 cursor-pointer rounded border-border-light bg-surface text-primary-fg transition-colors focus:ring-2 focus:ring-primary-outline-border focus:ring-offset-0 dark:border-border"
              {...register('rememberMe')}
            />
            Remember me
          </label>
          <Link
            href="/forgot-password"
            className="text-sm text-primary-link-fg transition-colors hover:text-primary-fg-hover"
          >
            Forgot password?
          </Link>
        </div>

        <AuthTurnstile resetKey={captchaResetKey} onToken={setCaptchaToken} />

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || !captchaReady}
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
        <div className="h-px flex-1 bg-border-light dark:bg-border" />
        <span className="text-sm text-text-secondary">or</span>
        <div className="h-px flex-1 bg-border-light dark:bg-border" />
      </div>

      <div className="space-y-3">
        <SocialButton provider="google" onClick={handleGoogleSignIn} disabled={isLoading} />
      </div>

      <p className="mt-6 text-center text-text-secondary">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-medium text-primary-link-fg transition-colors hover:text-primary-fg-hover"
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
