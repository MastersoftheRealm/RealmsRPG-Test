/**
 * Load From Library Modal
 * ========================
 * Reusable modal for loading saved items from library.
 * Unified list UX: expandable rows, chips, sortable columns, public/my/all via headerExtra.
 * Single selection + "Load" button; onSelect(selectedItem) with selectedItem.data = raw item.
 */

'use client';

import { useState, useMemo, useEffect, useRef, ReactNode } from 'react';
import { X } from 'lucide-react';
import { SearchInput, IconButton, Alert, Modal, LoadingState, EmptyState, Button } from '@/components/ui';
import { GridListRow, ListHeader } from '@/components/shared';
import { useSort } from '@/hooks/use-sort';
import type { SelectableItem } from '@/components/shared/unified-selection-modal';

export type LibraryItemType = 'power' | 'technique' | 'item' | 'creature';

export interface LibraryItem {
  id: string;
  docId: string;
  name: string;
  description?: string;
}

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { sortState, handleSort, sortItems } = useSort('name');
  const prevOpenRef = useRef(false);

  useEffect(() => {
    const justOpened = isOpen && !prevOpenRef.current;
    prevOpenRef.current = isOpen;
    if (justOpened) {
      setSelectedId(null);
      setSearchQuery('');
    }
  }, [isOpen]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return sortItems(selectableItems);
    const q = searchQuery.toLowerCase();
    const filtered = selectableItems.filter((item) => {
      if (item.name?.toLowerCase().includes(q)) return true;
      if (item.description?.toLowerCase().includes(q)) return true;
      return false;
    });
    return sortItems(filtered);
  }, [selectableItems, searchQuery, sortState, sortItems]);

  const selectedItem = useMemo(
    () => (selectedId ? selectableItems.find((i) => String(i.id) === selectedId) : null),
    [selectableItems, selectedId]
  );

  const handleLoad = () => {
    if (selectedItem) {
      onSelect(selectedItem);
      onClose();
    }
  };

  const modalHeader = (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h2 className="text-xl font-bold text-text-primary">{title}</h2>
        <p className="text-sm text-text-muted dark:text-text-secondary mt-1">
          Expand a row to view details. Select one item, then click Load.
        </p>
      </div>
      <IconButton variant="ghost" size="sm" onClick={onClose} label="Close">
        <X className="w-5 h-5" />
      </IconButton>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" showCloseButton={false} fullScreenOnMobile flexLayout titleA11y={title}>
      <div className="flex flex-col h-[70vh] max-h-[60vh] min-h-0 flex-1">
        {modalHeader}

        <div className="mb-4">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={searchPlaceholder}
          />
        </div>
        {headerExtra && <div className="mb-4">{headerExtra}</div>}

        {columns.length > 0 && (
          <ListHeader
            columns={columns.map((col) => ({
              key: col.key,
              label: col.label,
              sortable: col.sortable !== false,
            }))}
            gridColumns={gridColumns}
            sortState={sortState}
            onSort={handleSort}
            hasSelectionColumn
            compact
          />
        )}

        <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0">
          {isLoading ? (
            <LoadingState message="Loading..." size="md" padding="md" />
          ) : error ? (
            <Alert variant="danger" className="mx-4">
              {error.message}
            </Alert>
          ) : filteredItems.length === 0 ? (
            <EmptyState
              title={emptyMessage}
              description={emptySubMessage}
              size="sm"
            />
          ) : (
            <div className="space-y-2 min-w-0">
              {filteredItems.map((item) => {
                const itemIdStr = String(item.id);
                const isSelected = selectedId === itemIdStr;
                return (
                  <GridListRow
                    key={itemIdStr}
                    id={itemIdStr}
                    name={item.name}
                    description={item.description}
                    columns={item.columns}
                    chips={item.chips}
                    detailSections={item.detailSections}
                    totalCost={item.totalCost}
                    costLabel={item.costLabel}
                    badges={item.badges}
                    gridColumns={gridColumns ? `${gridColumns} 2.5rem` : undefined}
                    selectable
                    isSelected={isSelected}
                    onSelect={() => setSelectedId(isSelected ? null : itemIdStr)}
                    compact
                  />
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 pt-4 border-t border-border-light mt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted dark:text-text-secondary">
              {selectedId ? '1 item selected' : 'Select an item to load'}
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleLoad} disabled={!selectedId}>
                Load
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
