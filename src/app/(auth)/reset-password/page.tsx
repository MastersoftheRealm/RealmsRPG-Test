/**
 * Reset Password Page
 * =====================
 * Set a new password after email recovery OTP verification.
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { AuthCard, PasswordInput } from '@/components/auth';
import { Button, Alert } from '@/components/ui';

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) setSessionReady(!!session);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      });
      if (updateError) throw updateError;
      router.push('/login?message=password_updated');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (sessionReady === null) {
    return (
      <AuthCard title="Set New Password" subtitle="Loading...">
        <p className="text-center text-gray-300">Verifying your reset link...</p>
      </AuthCard>
    );
  }

  if (!sessionReady) {
    return (
      <AuthCard title="Reset Link Expired" subtitle="Request a new password reset">
        <Alert variant="danger" className="mb-6">
          This password reset link is invalid or has expired. Please request a new one.
        </Alert>
        <Link
          href="/forgot-password"
          className="inline-block w-full text-center text-primary-link-fg hover:text-primary-fg-hover transition-colors font-medium min-h-[44px] flex items-center justify-center"
        >
          Request a new reset link
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Set New Password" subtitle="Choose a new password for your account">
      {error ? (
        <Alert variant="danger" className="mb-6">
          {error}
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <PasswordInput
          label="New Password"
          placeholder="Enter a new password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <PasswordInput
          label="Confirm New Password"
          placeholder="Confirm your new password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Updating...' : 'Update Password'}
        </Button>
      </form>
    </AuthCard>
  );
}

function getAuthErrorMessage(error: unknown): string {
  const msg = (error as { message?: string })?.message ?? '';
  if (msg.includes('weak') || msg.includes('password')) {
    return 'Password is too weak. Please choose a stronger password.';
  }
  if (msg.includes('session') || msg.includes('expired')) {
    return 'Your reset session expired. Please request a new reset link.';
  }
  return msg || 'An error occurred. Please try again.';
}
