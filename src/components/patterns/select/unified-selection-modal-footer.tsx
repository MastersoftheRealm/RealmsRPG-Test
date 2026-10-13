'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
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
  /** Visible limit text the disabled Add button describes. */
  confirmDescribedBy?: string | undefined;
  confirmLabel: string;
  primaryActions?: ReactNode | ((selectedItems: SelectableItem[]) => ReactNode) | undefined;
  wrapFooterActions?: boolean | undefined;
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
  confirmDescribedBy,
  confirmLabel,
  primaryActions,
  wrapFooterActions = false,
}: UnifiedSelectionModalFooterProps) {
  const countLabel = `${selectedCount} ${itemLabel}${selectedCount !== 1 ? 's' : ''} selected${
    maxSelections !== undefined && maxSelections !== 1 ? ` (max ${maxSelections})` : ''
  }`;

  return (
    <div className="flex flex-col gap-2 border-t border-border-light bg-surface">
      {footerExtra?.(selectedItems)}
      <div
        className={cn(
          'flex gap-2',
          wrapFooterActions ? 'flex-col' : 'items-center justify-between',
        )}
      >
        <span
          className="min-w-0 truncate text-sm text-text-muted max-sm:sr-only"
          title={countLabel}
        >
          {countLabel}
        </span>
        <div
          className={cn(
            'flex min-w-0 gap-2',
            wrapFooterActions
              ? 'w-full max-w-full flex-wrap justify-end [&_button]:h-auto [&_button]:min-h-12 [&_button]:max-w-full [&_button]:whitespace-normal'
              : 'w-full sm:w-auto [&_button]:flex-1 sm:[&_button]:flex-initial',
          )}
        >
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
            <Button
              size="lg"
              onClick={onConfirm}
              disabled={isConfirmDisabled}
              aria-describedby={confirmDescribedBy}
            >
              {confirmLabel}
              {selectedCount > 0 ? ` (${selectedCount})` : ''}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
