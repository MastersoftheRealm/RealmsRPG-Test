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
import { sanitizeRedirectPath } from '@/lib/safe-redirect';
import { createUserProfileAction } from '@/app/(auth)/actions';
import { resendConfirmationAction } from '@/app/(auth)/auth-actions';
import { AuthCard, FormInput, PasswordInput, SocialButton } from '@/components/auth';
import { Spinner } from '@/components/ui';
import { Button, Alert } from '@/components/ui';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const getRedirectPath = () => {
    const urlRedirect = searchParams.get('redirect') ?? searchParams.get('returnTo');
    const sessionRedirect = typeof window !== 'undefined' ? sessionStorage.getItem('loginRedirect') : null;
    return sanitizeRedirectPath(urlRedirect || sessionRedirect || '/');
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
    setNeedsEmailConfirm(false);
    setResendStatus('idle');
    setSignupEmail(data.email);

    try {
      const supabase = createClient();
      const redirectPath = getRedirectPath();
      const chosenUsername = data.username?.trim();
      const { data: authData, error: err } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(redirectPath)}`,
          data: chosenUsername ? { username_display: chosenUsername } : undefined,
        },
      });
      if (err) throw err;

      // If email confirmation is enabled, Supabase may return a user but no session.
      // In that case, show a "Check your email" state instead of redirecting into the app.
      if (!authData.session) {
        setNeedsEmailConfirm(true);
        return;
      }

      if (authData.user) {
        await createUserProfileAction({
          uid: authData.user.id,
          email: data.email,
          username: chosenUsername || undefined,
          displayName: undefined,
        });
      }

      sessionStorage.removeItem('loginRedirect');
      router.push(redirectPath);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    const email = signupEmail.trim();
    if (!email) {
      setError('Missing email. Please try signing up again.');
      return;
    }
    setResendStatus('sending');
    setError(null);
    try {
      const redirectPath = getRedirectPath();
      const result = await resendConfirmationAction(email, redirectPath);
      if (!result.success) throw new Error(result.error);
      setResendStatus('sent');
    } catch (e) {
      setResendStatus('idle');
      setError(getAuthErrorMessage(e));
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

  if (needsEmailConfirm) {
    return (
      <AuthCard title="Check Your Email" subtitle="Confirm your account to continue">
        {error ? (
          <Alert variant="danger" className="mb-6">
            {error}
          </Alert>
        ) : null}

        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckIcon className="w-8 h-8 text-green-400" />
          </div>

          <p className="text-gray-300">
            We sent a confirmation link to{' '}
            <span className="font-semibold text-gray-100">{signupEmail || 'your email'}</span>.
            Open it to finish creating your account.
          </p>

          <p className="text-sm text-gray-300">
            Didn&apos;t get an email? Check spam, or resend the confirmation.
          </p>

          <div className="space-y-3">
            <Button
              type="button"
              className="w-full"
              disabled={resendStatus === 'sending'}
              onClick={handleResendConfirmation}
            >
              {resendStatus === 'sending'
                ? 'Sending...'
                : resendStatus === 'sent'
                  ? 'Confirmation email sent'
                  : 'Resend confirmation email'}
            </Button>

            <Link
              href={`/login?redirect=${encodeURIComponent(getRedirectPath())}`}
              className="inline-block text-primary-400 hover:text-primary-300 transition-colors font-medium"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </AuthCard>
    );
  }

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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}
