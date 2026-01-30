/**
 * Forgot Username Page
 * ====================
 * Allows users to recover their username by entering their email address.
 * Sends an email with their username if an account exists.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Button, Alert } from '@/components/ui';
import { Mail, ArrowLeft, Check, Loader2 } from 'lucide-react';

export default function ForgotUsernamePage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Look up user by email in Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email.toLowerCase().trim()));
      const snapshot = await getDocs(q);
      
      // For security, we show the same success message whether or not
      // the email exists. In a production app, you'd call a Cloud Function
      // to actually send an email with the username.
      
      if (!snapshot.empty) {
        // In production: Call Cloud Function to send email with username
        // const userDoc = snapshot.docs[0];
        // const username = userDoc.data().username;
        // await sendUsernameRecoveryEmail(email, username);
      }

      // Always show success for security (don't reveal if email exists)
      setSubmitted(true);
    } catch (err) {
      console.error('Error looking up username:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Recover Username</h1>
          <p className="text-gray-600 mt-2">
            Enter your email address and we&apos;ll send you your username.
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface rounded-xl shadow-lg p-8">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label 
                  htmlFor="email" 
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <Alert variant="danger">
                  {error}
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || !email}
                isLoading={loading}
                className="w-full"
              >
                {loading ? 'Sending...' : 'Send Username'}
              </Button>
            </form>
          ) : (
            /* Success State */
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Check Your Email</h2>
              <p className="text-gray-600">
                If an account exists with that email address, we&apos;ve sent your username to it.
              </p>
              <p className="text-sm text-gray-500 mt-4">
                Don&apos;t see it? Check your spam folder.
              </p>
            </div>
          )}

          {/* Links */}
          <div className="mt-6 pt-6 border-t border-gray-200 space-y-3 text-center text-sm">
            <Link 
              href="/login" 
              className="flex items-center justify-center gap-1 text-primary-600 hover:text-primary-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
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

        {/* Footer Info */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Remember your credentials?{' '}
          <Link href="/login" className="text-primary-600 hover:text-primary-700">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
