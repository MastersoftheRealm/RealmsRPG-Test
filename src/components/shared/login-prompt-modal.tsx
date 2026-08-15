/**
 * Login Prompt Modal
 * ==================
 * Soft-gate modal for creator Save/Load when the user is signed out.
 * Progress stays local; login/register returns via returnPath.
 */

'use client';

import { useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';
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

  const handleContinueWithoutAuth = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onClose();
  };

  const title = reason === 'load' ? 'Login Required to Load' : 'Login Required to Save';
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
      footer={
        <div className="space-y-3">
          <Button
            type="button"
            onClick={handleLogin}
            variant="primary"
            size="lg"
            className="w-full"
          >
            <LogIn className="h-5 w-5" />
            Log In
          </Button>

          <Button
            type="button"
            onClick={handleRegister}
            variant="secondary"
            size="lg"
            className="w-full"
          >
            <UserPlus className="h-5 w-5" />
            Create Account
          </Button>

          <Button
            type="button"
            onClick={handleContinueWithoutAuth}
            variant="ghost"
            className="w-full"
          >
            {reason === 'load' ? 'Continue Without Loading' : 'Continue Without Saving'}
          </Button>
        </div>
      }
    >
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-subtle-bg">
          <LogIn className="h-8 w-8 text-primary-link-fg" />
        </div>

        <h2 className="mb-2 text-xl font-semibold text-text-primary">{title}</h2>

        <p className="mb-6 text-text-muted">{message || defaultMessage}</p>

        <Alert variant="info" className="text-left">
          <strong>Don&apos;t worry!</strong> Your work is automatically saved in your browser. You
          can continue working, and your progress will be here when you return.
        </Alert>
      </div>
    </Modal>
  );
}
