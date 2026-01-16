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
import { sendPasswordResetEmail } from 'firebase/auth';

import { auth } from '@/lib/firebase/client';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validation';
import { AuthCard, FormInput } from '@/components/auth';
import { Button } from '@/components/ui';

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
      await sendPasswordResetEmail(auth, data.email);
      setIsSuccess(true);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthCard 
        title="Check Your Email" 
        subtitle="Password reset instructions sent"
      >
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckIcon className="w-8 h-8 text-green-400" />
          </div>
          <p className="text-gray-300">
            We have sent password reset instructions to your email address. 
            Please check your inbox and follow the link to reset your password.
          </p>
          <p className="text-sm text-gray-400">
            Did not receive the email? Check your spam folder or{' '}
            <button
              type="button"
              onClick={() => setIsSuccess(false)}
              className="text-primary-400 hover:text-primary-300 transition-colors"
            >
              try again
            </button>
          </p>
          <Link 
            href="/login"
            className="inline-block text-primary-400 hover:text-primary-300 transition-colors font-medium"
          >
            Back to Sign In
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard 
      title="Reset Password" 
      subtitle="Enter your email to receive reset instructions"
    >
      {error ? (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
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

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </form>

      <p className="mt-6 text-center text-gray-400">
        Remember your password?{' '}
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

function getAuthErrorMessage(error: unknown): string {
  const firebaseError = error as { code?: string };
  
  switch (firebaseError.code) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/too-many-requests':
      return 'Too many requests. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    default:
      return 'An error occurred. Please try again.';
  }
}
