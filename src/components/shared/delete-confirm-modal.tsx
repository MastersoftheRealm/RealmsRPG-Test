'use client';

/**
 * DeleteConfirmModal
 * ==================
 * Reusable confirmation modal for delete operations.
 * Used by Library, Creature Creator, and other pages.
 */

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 p-6 max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Delete {itemName}?
        </h3>
        <p className="text-gray-600 mb-6">
          This action cannot be undone. This will permanently delete the {itemType} from your library.
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;
