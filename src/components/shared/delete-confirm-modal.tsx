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
  /** Name of the item being deleted */
  itemName: string;
  /** Type label for display (e.g., "power", "technique", "item") */
  itemType: string;
  /** Whether deletion is in progress */
  isDeleting?: boolean;
  /** Called when delete is confirmed */
  onConfirm: () => void;
  /** Called when modal is closed/cancelled */
  onClose: () => void;
}

export function DeleteConfirmModal({
  itemName,
  itemType,
  isDeleting = false,
  onConfirm,
  onClose,
}: DeleteConfirmModalProps) {
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-danger-light flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-danger" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          Delete {itemName}?
        </h3>
        <p className="text-text-muted mb-6">
          This action cannot be undone. This will permanently delete the {itemType} from your library.
        </p>
        <div className="flex items-center justify-center gap-3 w-full">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1"
          >
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

export default DeleteConfirmModal;
