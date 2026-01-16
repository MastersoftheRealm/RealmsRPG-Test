/**
 * Login Prompt Modal
 * ==================
 * Displays a modal prompting users to log in to save their work.
 * Shows options to go to login, continue as guest, or dismiss.
 */

'use client';

import { useRouter } from 'next/navigation';
import { X, LogIn, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The path to return to after login */
  returnPath: string;
  /** Type of content being saved (for display purposes) */
  contentType?: string;
  /** Optional message to display */
  message?: string;
}

export function LoginPromptModal({
  isOpen,
  onClose,
  returnPath,
  contentType = 'content',
  message,
}: LoginPromptModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleLogin = () => {
    // Store the return path in sessionStorage so we can redirect back after login
    sessionStorage.setItem('loginRedirect', returnPath);
    router.push(`/login?redirect=${encodeURIComponent(returnPath)}`);
  };

  const handleRegister = () => {
    sessionStorage.setItem('loginRedirect', returnPath);
    router.push(`/register?redirect=${encodeURIComponent(returnPath)}`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={cn(
            'relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6',
            'transform transition-all'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <LogIn className="w-8 h-8 text-primary-600" />
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Login Required to Save
            </h2>

            <p className="text-gray-600 mb-6">
              {message || `Your ${contentType} progress is saved locally. Log in or create an account to save your ${contentType} permanently to your library.`}
            </p>

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 text-left">
              <p className="text-sm text-blue-700">
                <strong>Don&apos;t worry!</strong> Your work is automatically saved in your browser.
                You can continue working, and your progress will be here when you return.
              </p>
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleLogin}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
              >
                <LogIn className="w-5 h-5" />
                Log In
              </button>

              <button
                onClick={handleRegister}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
              >
                <UserPlus className="w-5 h-5" />
                Create Account
              </button>

              <button
                onClick={onClose}
                className="w-full px-4 py-2 text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                Continue Without Saving
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
