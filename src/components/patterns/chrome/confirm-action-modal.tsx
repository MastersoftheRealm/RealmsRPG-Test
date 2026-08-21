'use client';

/**
 * ConfirmActionModal
 * ==================
 * Generic reusable confirmation modal for actions that need user verification.
 * Used for: publishing to Realms Library, destructive actions, etc.
 *
 * For delete-specific copy, use `DeleteConfirmModal` (a preset of this modal).
 */

import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmActionModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Called when the action is confirmed */
  onConfirm: () => void;
  /** Called when modal is closed/cancelled */
  onClose: () => void;
  /** Title text */
  title: string;
  /** Description/body text */
  description: string;
  /** Label for the confirm button (default: "Confirm") */
  confirmLabel?: string | undefined;
  /** Label for the cancel button (default: "Cancel") */
  cancelLabel?: string | undefined;
  /** Button variant for the confirm button */
  confirmVariant?: 'primary' | 'danger' | undefined;
  /** Whether the action is in progress */
  isLoading?: boolean | undefined;
  /** Label for confirm button when loading (default: "Publishing..." when confirmVariant is primary, else "Confirming...") */
  loadingLabel?: string | undefined;
  /** Icon to display: 'warning' | 'publish' (default: 'warning') */
  icon?: 'warning' | 'publish' | undefined;
}

export function ConfirmActionModal({
  isOpen,
  onConfirm,
  onClose,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  isLoading = false,
  loadingLabel,
  icon = 'warning',
}: ConfirmActionModalProps) {
  if (!isOpen) return null;

  const defaultLoadingLabel = confirmVariant === 'primary' ? 'Publishing...' : 'Confirming...';
  const confirmButtonLabel = isLoading ? (loadingLabel ?? defaultLoadingLabel) : confirmLabel;

  const IconComponent = icon === 'publish' ? Upload : AlertTriangle;
  const iconBg = icon === 'publish' ? 'bg-primary-subtle-bg' : 'bg-danger-light';
  const iconColor = icon === 'publish' ? 'text-primary-link-fg' : 'text-danger-fg';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      fullScreenOnMobile
      size="sm"
      showCloseButton={false}
      titleA11y={title}
      footer={
        <div className="flex w-full items-center justify-center gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isLoading} className="flex-1">
            {cancelLabel}
          </Button>
          <Button
            size="lg"
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={isLoading}
            isLoading={isLoading}
            className="flex-1"
          >
            {confirmButtonLabel}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col items-center text-center">
        <div className={cn('mb-4 flex h-12 w-12 items-center justify-center rounded-full', iconBg)}>
          <IconComponent className={cn('h-6 w-6', iconColor)} />
        </div>
        <h2 className="mb-2 text-lg font-semibold text-text-primary">{title}</h2>
        <p className="text-text-muted">{description}</p>
      </div>
    </Modal>
  );
}
