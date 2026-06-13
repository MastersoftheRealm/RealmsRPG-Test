/**
 * Forgot Username Page
 * ====================
 * Username recovery is not yet available via email.
 */

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';
import { Mail, ArrowLeft } from 'lucide-react';

const SUPPORT_EMAIL = 'RealmsRoleplayGame@gmail.com';

export default function ForgotUsernamePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Recover Username</h1>
          <p className="text-gray-600 mt-2">
            Automated username recovery by email is not available yet.
          </p>
        </div>

        <div className="bg-surface rounded-xl shadow-lg p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-primary-700" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Contact Support</h2>
            <p className="text-gray-600">
              If you forgot your username, email us from the address on your account and we can help you recover it.
            </p>
            <Button asChild className="w-full min-h-[44px]">
              <a href={`mailto:${SUPPORT_EMAIL}?subject=Username%20recovery%20request`}>
                Email {SUPPORT_EMAIL}
              </a>
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 space-y-3 text-center text-sm">
            <Link
              href="/login"
              className="flex items-center justify-center gap-1 text-primary-600 hover:text-primary-700 font-medium min-h-[44px]"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Login
            </Link>
            <div className="text-gray-500">
              Need to reset your password?{' '}
              <Link href="/forgot-password" className="text-primary-600 hover:text-primary-700 font-medium">
                Reset Password
              </Link>
            </div>
            <div className="text-gray-500">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
