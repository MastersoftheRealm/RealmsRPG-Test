'use client';

import { Button, Modal } from '@/components/ui';

export interface UnifiedSelectionModalLeavePromptProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  discardLabel: string;
  showConfirm: boolean;
  onConfirm: () => void;
  isConfirmDisabled: boolean;
  confirmLabel: string;
  selectedCount: number;
  onDiscard: () => void;
}

export function UnifiedSelectionModalLeavePrompt({
  isOpen,
  onClose,
  title,
  description,
  discardLabel,
  showConfirm,
  onConfirm,
  isConfirmDisabled,
  confirmLabel,
  selectedCount,
  onDiscard,
}: UnifiedSelectionModalLeavePromptProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      showCloseButton
    >
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          variant="secondary"
          onClick={onDiscard}
          className="min-h-11 w-full sm:w-auto"
        >
          {discardLabel}
        </Button>
        {showConfirm ? (
          <Button
            onClick={onConfirm}
            disabled={isConfirmDisabled}
            className="min-h-11 w-full sm:w-auto"
          >
            {confirmLabel}
            {selectedCount > 0 ? ` (${selectedCount})` : ''}
          </Button>
        ) : null}
      </div>
    </Modal>
  );
}
