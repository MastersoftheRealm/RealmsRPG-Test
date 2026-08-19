'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui';
import type { SelectableItem } from './unified-selection-modal-types';

export interface UnifiedSelectionModalFooterProps {
  selectedItems: SelectableItem[];
  selectedCount: number;
  itemLabel: string;
  maxSelections?: number | undefined;
  footerExtra?: ((selectedItems: SelectableItem[]) => ReactNode) | undefined;
  onRequestClose: () => void;
  onConfirm: () => void;
  isConfirmDisabled: boolean;
  confirmLabel: string;
  primaryActions?: ReactNode | ((selectedItems: SelectableItem[]) => ReactNode) | undefined;
}

export function UnifiedSelectionModalFooter({
  selectedItems,
  selectedCount,
  itemLabel,
  maxSelections,
  footerExtra,
  onRequestClose,
  onConfirm,
  isConfirmDisabled,
  confirmLabel,
  primaryActions,
}: UnifiedSelectionModalFooterProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-border-light bg-surface">
      {footerExtra?.(selectedItems)}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-text-muted">
          {selectedCount} {itemLabel}
          {selectedCount !== 1 ? 's' : ''} selected
          {maxSelections !== undefined && maxSelections !== 1 && ` (max ${maxSelections})`}
        </span>
        <div className="flex w-full gap-2 sm:w-auto [&_button]:min-h-11 [&_button]:flex-1 sm:[&_button]:flex-initial">
          <Button variant="secondary" onClick={onRequestClose}>
            Cancel
          </Button>
          {primaryActions ? (
            typeof primaryActions === 'function' ? (
              primaryActions(selectedItems)
            ) : (
              primaryActions
            )
          ) : (
            <Button onClick={onConfirm} disabled={isConfirmDisabled}>
              {confirmLabel}
              {selectedCount > 0 ? ` (${selectedCount})` : ''}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
