'use client';

/**
 * ConfirmActionModal
 * ==================
 * Generic reusable confirmation modal for actions that need user verification.
 * Used for: publishing to public library, destructive actions, etc.
 * 
 * For delete-specific confirmations, see `DeleteConfirmModal`.
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
  confirmLabel?: string;
  /** Label for the cancel button (default: "Cancel") */
  cancelLabel?: string;
  /** Button variant for the confirm button */
  confirmVariant?: 'primary' | 'danger';
  /** Whether the action is in progress */
  isLoading?: boolean;
  /** Label for confirm button when loading (default: "Publishing..." when confirmVariant is primary, else "Confirming...") */
  loadingLabel?: string;
  /** Icon to display: 'warning' | 'publish' (default: 'warning') */
  icon?: 'warning' | 'publish';
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
  const iconBg = icon === 'publish' ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-danger-light';
  const iconColor = icon === 'publish' ? 'text-primary-600' : 'text-danger';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
    >
      <div className="flex flex-col items-center text-center">
        <div className={cn('w-12 h-12 rounded-full flex items-center justify-center mb-4', iconBg)}>
          <IconComponent className={cn('w-6 h-6', iconColor)} />
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          {title}
        </h3>
        <p className="text-text-muted mb-6">
          {description}
        </p>
        <div className="flex items-center justify-center gap-3 w-full">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={isLoading}
            isLoading={isLoading}
            className="flex-1"
          >
            {confirmButtonLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
