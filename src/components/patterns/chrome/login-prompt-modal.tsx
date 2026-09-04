/**
 * Login Prompt Modal
 * ==================
 * Soft-gate modal for creator Save/Load when the user is signed out.
 * Progress stays local; login/register returns via returnPath.
 * Character finalize may pass onContinueWithoutSigningIn (ADR-0026) to persist
 * a browser-only sheet instead of dismissing without creating.
 */

'use client';

import { useState } from 'react';
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
  contentType?: string | undefined;
  /** Whether the user tried Save or Load (affects title/copy) */
  reason?: LoginPromptReason | undefined;
  /** Optional message to display (overrides default body copy) */
  message?: string | undefined;
  /**
   * Character finalize only: persist locally and open the sheet.
   * Library / creator Load keep omit this so tertiary remains dismiss-only.
   */
  onContinueWithoutSigningIn?: (() => void | Promise<void>) | undefined;
}

export function LoginPromptModal({
  isOpen,
  onClose,
  returnPath,
  contentType = 'content',
  reason = 'save',
  message,
  onContinueWithoutSigningIn,
}: LoginPromptModalProps) {
  const router = useRouter();
  const [localBusy, setLocalBusy] = useState(false);
  const allowLocalSheet = reason === 'save' && typeof onContinueWithoutSigningIn === 'function';

  const handleLogin = () => {
    sessionStorage.setItem('loginRedirect', returnPath);
    router.push(`/login?redirect=${encodeURIComponent(returnPath)}`);
  };

  const handleRegister = () => {
    sessionStorage.setItem('loginRedirect', returnPath);
    router.push(`/register?redirect=${encodeURIComponent(returnPath)}`);
  };

  const handleTertiary = async () => {
    if (!allowLocalSheet || !onContinueWithoutSigningIn) {
      onClose();
      return;
    }
    setLocalBusy(true);
    try {
      await onContinueWithoutSigningIn();
    } finally {
      setLocalBusy(false);
    }
  };

  const title =
    reason === 'load'
      ? 'Login Required to Load'
      : allowLocalSheet
        ? 'Save to your account'
        : 'Login Required to Save';
  const defaultMessage =
    reason === 'load'
      ? `Log in or create an account to load ${contentType} from your library. Guest progress on this page stays in your browser.`
      : allowLocalSheet
        ? `Log in or create an account to keep this ${contentType} on every device and use it in campaigns. You can also continue without signing in — it stays in this browser.`
        : `Your ${contentType} progress is saved locally. Log in or create an account to save your ${contentType} permanently to your library.`;

  const tertiaryLabel =
    reason === 'load'
      ? 'Continue Without Loading'
      : allowLocalSheet
        ? 'Continue without signing in'
        : 'Continue Without Saving';

  return (
    <Modal
      isOpen={isOpen}
      onClose={localBusy ? () => undefined : onClose}
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
            disabled={localBusy}
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
            disabled={localBusy}
          >
            <UserPlus className="h-5 w-5" />
            Create Account
          </Button>

          <Button
            type="button"
            onClick={() => void handleTertiary()}
            variant="ghost"
            className="w-full"
            disabled={localBusy}
            isLoading={localBusy}
          >
            {tertiaryLabel}
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
          {allowLocalSheet ? (
            <>
              <strong>This browser only.</strong> The {contentType} stays on this device until you
              sign in. Clearing site data removes it.
            </>
          ) : (
            <>
              <strong>Don&apos;t worry!</strong> Your work is automatically saved in your browser.
              You can continue working, and your progress will be here when you return.
            </>
          )}
        </Alert>
      </div>
    </Modal>
  );
}
