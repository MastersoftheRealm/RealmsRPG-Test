'use client';

import type { ReactNode } from 'react';
import { Button, Modal } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { SelectableItem } from './unified-selection-modal-types';

export interface UnifiedSelectionModalLeavePromptProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  discardLabel: string;
  showConfirm: boolean;
  onConfirm: () => void;
  isConfirmDisabled: boolean;
  confirmDescribedBy?: string | undefined;
  confirmLabel: string;
  selectedCount: number;
  onDiscard: () => void;
  /** Same add actions as the picker footer, so every trait picker can add before leaving. */
  primaryActions?: ReactNode | ((selectedItems: SelectableItem[]) => ReactNode) | undefined;
  selectedItems?: SelectableItem[] | undefined;
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
  confirmDescribedBy,
  confirmLabel,
  selectedCount,
  onDiscard,
  primaryActions,
  selectedItems = [],
}: UnifiedSelectionModalLeavePromptProps) {
  const resolvedPrimaryActions =
    typeof primaryActions === 'function' ? primaryActions(selectedItems) : primaryActions;
  let confirmAction: ReactNode = null;
  if (resolvedPrimaryActions) {
    confirmAction = resolvedPrimaryActions;
  } else if (showConfirm) {
    confirmAction = (
      <Button
        size="lg"
        onClick={onConfirm}
        disabled={isConfirmDisabled}
        aria-describedby={confirmDescribedBy}
        className="w-full sm:w-auto"
      >
        {confirmLabel}
        {selectedCount > 0 ? ` (${selectedCount})` : ''}
      </Button>
    );
  }
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      showCloseButton
    >
      <div
        className={cn(
          'flex flex-col-reverse gap-3 sm:flex-row sm:justify-end',
          resolvedPrimaryActions &&
            'sm:flex-wrap [&_button]:h-auto [&_button]:max-w-full [&_button]:whitespace-normal',
        )}
      >
        <Button variant="secondary" onClick={onDiscard} className="w-full sm:w-auto">
          {discardLabel}
        </Button>
        {confirmAction}
      </div>
    </Modal>
  );
}
