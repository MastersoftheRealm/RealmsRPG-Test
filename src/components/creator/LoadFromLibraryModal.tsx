/**
 * Load From Library Modal
 * ========================
 * Thin wrapper over UnifiedSelectionModal for creator load flows.
 * Single selection + "Load"; onSelect(selectedItem) with selectedItem.data = raw item.
 */

'use client';

import type { ReactNode } from 'react';
import { UnifiedSelectionModal, type SelectableItem } from '@/components/shared/unified-selection-modal';

export interface LoadFromLibraryModalProps {
  selectableItems: SelectableItem[];
  columns: Array<{ key: string; label: string; sortable?: boolean }>;
  gridColumns: string;
  onSelect: (selectedItem: SelectableItem) => void;
  isLoading: boolean;
  error?: Error | null;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  headerExtra?: ReactNode;
  emptyMessage?: string;
  emptySubMessage?: string;
  searchPlaceholder?: string;
}

export function LoadFromLibraryModal({
  isOpen,
  onClose,
  selectableItems,
  columns,
  gridColumns,
  onSelect,
  isLoading,
  error,
  title,
  headerExtra,
  emptyMessage = 'No items found',
  emptySubMessage,
  searchPlaceholder = 'Search...',
}: LoadFromLibraryModalProps) {
  return (
    <UnifiedSelectionModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description="Expand a row to view details. Select one item, then click Load."
      items={selectableItems}
      isLoading={isLoading}
      error={error}
      onConfirm={(selected) => {
        if (selected[0]) onSelect(selected[0]);
      }}
      maxSelections={1}
      columns={columns}
      gridColumns={gridColumns}
      headerExtra={headerExtra}
      emptyMessage={emptyMessage}
      emptySubMessage={emptySubMessage}
      searchPlaceholder={searchPlaceholder}
      confirmLabel="Load"
      itemLabel="item"
      size="lg"
      className="md:max-h-[60vh]"
    />
  );
}
