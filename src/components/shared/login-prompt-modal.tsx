/**
 * Login Prompt Modal
 * ==================
 * Soft-gate modal for creator Save/Load when the user is signed out.
 * Progress stays local; login/register returns via returnPath.
 */

'use client';

import { useRouter } from 'next/navigation';
import { LogIn, UserPlus } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

export type LoginPromptReason = 'save' | 'load';

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The path to return to after login */
  returnPath: string;
  /** Type of content being saved/loaded (for display purposes) */
  contentType?: string;
  /** Whether the user tried Save or Load (affects title/copy) */
  reason?: LoginPromptReason;
  /** Optional message to display (overrides default body copy) */
  message?: string;
}

export function LoginPromptModal({
  isOpen,
  onClose,
  returnPath,
  contentType = 'content',
  reason = 'save',
  message,
}: LoginPromptModalProps) {
  const router = useRouter();

  const handleLogin = () => {
    sessionStorage.setItem('loginRedirect', returnPath);
    router.push(`/login?redirect=${encodeURIComponent(returnPath)}`);
  };

  const handleRegister = () => {
    sessionStorage.setItem('loginRedirect', returnPath);
    router.push(`/register?redirect=${encodeURIComponent(returnPath)}`);
  };

  const title =
    reason === 'load' ? 'Login Required to Load' : 'Login Required to Save';
  const defaultMessage =
    reason === 'load'
      ? `Log in or create an account to load ${contentType} from your library. Guest progress on this page stays in your browser.`
      : `Your ${contentType} progress is saved locally. Log in or create an account to save your ${contentType} permanently to your library.`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      fullScreenOnMobile
      size="md"
      titleA11y={title}
    >
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary-subtle-bg rounded-full flex items-center justify-center mb-4">
          <LogIn className="w-8 h-8 text-primary-link-fg" />
        </div>

        <h2 className="text-xl font-semibold text-text-primary mb-2">{title}</h2>

        <p className="text-text-muted dark:text-text-secondary mb-6">
          {message || defaultMessage}
        </p>

        <Alert variant="info" className="mb-6 text-left">
          <strong>Don&apos;t worry!</strong> Your work is automatically saved in your browser.
          You can continue working, and your progress will be here when you return.
        </Alert>

        <div className="space-y-3">
          <Button onClick={handleLogin} variant="primary" size="lg" className="w-full">
            <LogIn className="w-5 h-5" />
            Log In
          </Button>

          <Button onClick={handleRegister} variant="secondary" size="lg" className="w-full">
            <UserPlus className="w-5 h-5" />
            Create Account
          </Button>

          <Button onClick={onClose} variant="ghost" className="w-full">
            {reason === 'load' ? 'Continue Without Loading' : 'Continue Without Saving'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
