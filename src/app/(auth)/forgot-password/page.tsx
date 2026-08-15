/**
 * Forgot Password Page
 * =====================
 * Password reset request page
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validation';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { AuthCard, FormInput } from '@/components/auth';
import { Button, Alert } from '@/components/ui';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/confirm?next=${encodeURIComponent('/reset-password')}`,
      });
      if (err) throw err;
      setIsSuccess(true);
    } catch (err) {
      setError(getAuthErrorMessage(err, 'forgot-password'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthCard title="Check Your Email" subtitle="Password reset instructions sent">
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <CheckIcon className="h-8 w-8 text-green-400" />
          </div>
          <p className="text-text-secondary">
            We have sent password reset instructions to your email address. Please check your inbox
            and follow the link to reset your password.
          </p>
          <p className="text-sm text-text-secondary">
            Did not receive the email? Check your spam folder or{' '}
            <Button variant="link" type="button" onClick={() => setIsSuccess(false)}>
              try again
            </Button>
          </p>
          <Link
            href="/login"
            className="inline-block font-medium text-primary-link-fg transition-colors hover:text-primary-fg-hover"
          >
            Back to Sign In
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Reset Password" subtitle="Enter your email to receive reset instructions">
      {error ? (
        <Alert variant="danger" className="mb-6">
          {error}
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormInput
          label="Email"
          type="email"
          placeholder="Enter your email address"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </form>

      <p className="mt-6 text-center text-text-secondary">
        Remember your password?{' '}
        <Link
          href="/login"
          className="font-medium text-primary-link-fg transition-colors hover:text-primary-fg-hover"
        >
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
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
