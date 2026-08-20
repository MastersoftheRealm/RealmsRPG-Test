'use client';

/**
 * DeleteConfirmModal
 * ==================
 * Delete-copy preset of ConfirmActionModal (TASK-799 / TASK-841).
 * Callers keep itemName / itemType / deleteContext; chrome lives on ConfirmActionModal.
 */

import { ConfirmActionModal } from './confirm-action-modal';

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
    <ConfirmActionModal
      isOpen={isOpen}
      onConfirm={onConfirm}
      onClose={onClose}
      title={`Delete ${itemName}?`}
      description={`This action cannot be undone. This will permanently remove the ${itemType} from your ${deleteContext}.`}
      confirmLabel="Delete"
      confirmVariant="danger"
      isLoading={isDeleting}
      loadingLabel="Deleting..."
      icon="warning"
    />
  );
}
