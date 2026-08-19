'use client';

/**
 * DeleteConfirmModal
 * ==================
 * Reusable confirmation modal for delete operations.
 * Used by Library, Creature Creator, and other pages.
 */

import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Name of the item being deleted */
  itemName: string;
  /** Type label for display (e.g., "power", "technique", "item", "feat") */
  itemType: string;
  /** Context for delete message (e.g., "library", "character"). Default: "library" */
  deleteContext?: string | undefined;
  /** Whether deletion is in progress */
  isDeleting?: boolean | undefined;
  /** Called when delete is confirmed */
  onConfirm: () => void;
  /** Called when modal is closed/cancelled */
  onClose: () => void;
}

export function DeleteConfirmModal({
  isOpen,
  itemName,
  itemType,
  deleteContext = 'library',
  isDeleting = false,
  onConfirm,
  onClose,
}: DeleteConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      fullScreenOnMobile
      size="sm"
      showCloseButton={false}
      titleA11y={`Delete ${itemName}?`}
    >
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-light">
          <AlertTriangle className="h-6 w-6 text-danger-fg" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-text-primary">Delete {itemName}?</h3>
        <p className="mb-6 text-text-muted">
          This action cannot be undone. This will permanently remove the {itemType} from your{' '}
          {deleteContext}.
        </p>
        <div className="flex w-full items-center justify-center gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isDeleting} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={isDeleting}
            isLoading={isDeleting}
            className="flex-1"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
