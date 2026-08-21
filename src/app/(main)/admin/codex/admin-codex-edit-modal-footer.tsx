'use client';

import { Button } from '@/components/ui';

/**
 * Shared Admin Codex edit-modal footer (TASK-842).
 * Delete opens DeleteConfirmModal; Cancel stays Standard; Save is Primary lg.
 */
export function AdminCodexEditModalFooter({
  onDelete,
  onClose,
  onSave,
  saveDisabled,
  saving,
}: {
  onDelete?: (() => void) | undefined;
  onClose: () => void;
  onSave: () => void;
  saveDisabled: boolean;
  saving: boolean;
}) {
  return (
    <div className="flex justify-between">
      <div>
        {onDelete ? (
          <Button variant="outline" onClick={onDelete}>
            Delete
          </Button>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button size="lg" onClick={onSave} disabled={saveDisabled}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
