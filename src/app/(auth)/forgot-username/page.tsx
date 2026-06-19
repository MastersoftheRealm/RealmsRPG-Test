/**
 * Forgot Username Page
 * ====================
 * Username recovery is not yet available via email — contact support.
 */

'use client';

import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';
import { AuthCard } from '@/components/auth';
import { Button } from '@/components/ui';

const SUPPORT_EMAIL = 'RealmsRoleplayGame@gmail.com';

export default function ForgotUsernamePage() {
  return (
    <AuthCard title="Recover Username" subtitle="Automated recovery by email is not available yet">
      <div className="text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-primary-500/10 flex items-center justify-center">
          <Mail className="w-8 h-8 text-primary-400" aria-hidden />
        </div>
        <p className="text-gray-300 dark:text-text-secondary">
          If you forgot your username, email us from the address on your account and we can help you recover it.
        </p>
        <Button asChild className="w-full min-h-[44px]">
          <a href={`mailto:${SUPPORT_EMAIL}?subject=Username%20recovery%20request`}>
            Email {SUPPORT_EMAIL}
          </a>
        </Button>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-600/50 dark:border-border space-y-3 text-center text-sm">
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-1 text-primary-400 hover:text-primary-300 transition-colors font-medium min-h-[44px]"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden />
          Back to Sign In
        </Link>
        <p className="text-gray-300 dark:text-text-secondary">
          Need to reset your password?{' '}
          <Link href="/forgot-password" className="text-primary-400 hover:text-primary-300 font-medium">
            Reset Password
          </Link>
        </p>
        <p className="text-gray-300 dark:text-text-secondary">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-primary-400 hover:text-primary-300 font-medium">
            Create one
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
