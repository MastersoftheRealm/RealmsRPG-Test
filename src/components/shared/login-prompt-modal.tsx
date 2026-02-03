/**
 * Login Prompt Modal
 * ==================
 * Displays a modal prompting users to log in to save their work.
 * Shows options to go to login, continue as guest, or dismiss.
 */

'use client';

import { useRouter } from 'next/navigation';
import { LogIn, UserPlus } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
    >
      {/* Content */}
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
          <LogIn className="w-8 h-8 text-primary-600" />
        </div>

        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Login Required to Save
        </h2>

        <p className="text-text-muted mb-6">
          {message || `Your ${contentType} progress is saved locally. Log in or create an account to save your ${contentType} permanently to your library.`}
        </p>

        {/* Info box */}
        <Alert variant="info" className="mb-6 text-left">
          <strong>Don&apos;t worry!</strong> Your work is automatically saved in your browser.
          You can continue working, and your progress will be here when you return.
        </Alert>

        {/* Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleLogin}
            variant="primary"
            size="lg"
            className="w-full"
          >
            <LogIn className="w-5 h-5" />
            Log In
          </Button>

          <Button
            onClick={handleRegister}
            variant="secondary"
            size="lg"
            className="w-full"
          >
            <UserPlus className="w-5 h-5" />
            Create Account
          </Button>

          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full"
          >
            Continue Without Saving
          </Button>
        </div>
      </div>
    </Modal>
  );
}
