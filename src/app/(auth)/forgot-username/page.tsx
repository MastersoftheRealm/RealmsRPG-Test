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
import { SITE_CONTACT_EMAIL } from '@/lib/constants/site-copy';

export default function ForgotUsernamePage() {
  return (
    <AuthCard title="Recover Username" subtitle="Automated recovery by email is not available yet">
      <div className="space-y-6 text-center">
        <div className="bg-primary-subtle-bg0/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
          <Mail className="h-8 w-8 text-primary-link-fg" aria-hidden />
        </div>
        <p className="text-gray-300 dark:text-text-secondary">
          If you forgot your username, email us from the address on your account and we can help you
          recover it.
        </p>
        <Button asChild className="min-h-[44px] w-full">
          <a href={`mailto:${SITE_CONTACT_EMAIL}?subject=Username%20recovery%20request`}>
            Email {SITE_CONTACT_EMAIL}
          </a>
        </Button>
      </div>

      <div className="mt-6 space-y-3 border-t border-gray-600/50 pt-6 text-center text-sm dark:border-border">
        <Link
          href="/login"
          className="inline-flex min-h-[44px] items-center justify-center gap-1 font-medium text-primary-link-fg transition-colors hover:text-primary-fg-hover"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
          Back to Sign In
        </Link>
        <p className="text-gray-300 dark:text-text-secondary">
          Need to reset your password?{' '}
          <Link
            href="/forgot-password"
            className="font-medium text-primary-link-fg hover:text-primary-fg-hover"
          >
            Reset Password
          </Link>
        </p>
        <p className="text-gray-300 dark:text-text-secondary">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="font-medium text-primary-link-fg hover:text-primary-fg-hover"
          >
            Create one
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
