/**
 * Load From Library Modal
 * ========================
 * Reusable modal for loading saved items from library.
 * Two modes:
 * - Unified: pass selectableItems, columns, gridColumns, headerExtra (e.g. SourceFilter).
 *   Same list UX as Add Library Item modal: expandable rows, chips, sortable columns, public/my/all.
 *   Single selection + "Load" button; onSelect(selectedItem) with selectedItem.data = raw item.
 * - Legacy: pass items, itemType for simple name/description list (e.g. backward compat).
 */

'use client';

import { useState, useMemo, useEffect, useRef, ReactNode } from 'react';
import { X, FileText, Zap, Sword, Shield } from 'lucide-react';
import { SearchInput, IconButton, Alert, Modal, LoadingState, EmptyState, Button } from '@/components/ui';
import { GridListRow, ListHeader } from '@/components/shared';
import { useModalListState } from '@/hooks/use-modal-list-state';
import { useSort } from '@/hooks/use-sort';
import type { SelectableItem } from '@/components/shared/unified-selection-modal';

export type LibraryItemType = 'power' | 'technique' | 'item' | 'creature';

export interface LibraryItem {
  id: string;
  docId: string;
  name: string;
  description?: string;
}

// Legacy mode: simple list from raw items
interface LegacyLoadProps<T extends LibraryItem> {
  selectableItems?: never;
  columns?: never;
  gridColumns?: never;
  headerExtra?: never;
  emptyMessage?: never;
  emptySubMessage?: never;
  searchPlaceholder?: never;
  items: T[] | undefined;
  itemType: LibraryItemType;
  onSelect: (item: T) => void;
  isLoading: boolean;
  error: Error | null;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

// Unified mode: same as add modals (SourceFilter, columns, chips, expandable)
interface UnifiedLoadProps {
  items?: never;
  itemType?: never;
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

export type LoadFromLibraryModalProps<T extends LibraryItem> = LegacyLoadProps<T> | UnifiedLoadProps;

function isUnifiedProps<T extends LibraryItem>(
  props: LoadFromLibraryModalProps<T>
): props is UnifiedLoadProps {
  return Array.isArray((props as UnifiedLoadProps).selectableItems);
}

const TYPE_CONFIG: Record<LibraryItemType, { icon: React.ReactNode; color: string; emptyText: string }> = {
  power: {
    icon: <Zap className="w-5 h-5" />,
    color: 'text-energy',
    emptyText: 'No saved powers found. Create some powers first!',
  },
  technique: {
    icon: <Sword className="w-5 h-5" />,
    color: 'text-martial',
    emptyText: 'No saved techniques found. Create some techniques first!',
  },
  item: {
    icon: <Shield className="w-5 h-5" />,
    color: 'text-tp',
    emptyText: 'No saved items found. Create some items first!',
  },
  creature: {
    icon: <FileText className="w-5 h-5" />,
    color: 'text-success',
    emptyText: 'No saved creatures found. Create some creatures first!',
  },
};

export function LoadFromLibraryModal<T extends LibraryItem>(
  props: LoadFromLibraryModalProps<T>
) {
  if (isUnifiedProps(props)) {
    return <LoadFromLibraryModalUnified {...props} />;
  }
  return <LoadFromLibraryModalLegacy {...props} />;
}

function LoadFromLibraryModalLegacy<T extends LibraryItem>({
  isOpen,
  onClose,
  onSelect,
  items,
  isLoading,
  error,
  itemType,
  title,
}: LegacyLoadProps<T>) {
  const config = TYPE_CONFIG[itemType];
  const displayTitle = title || `Load ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`;

  const { search, setSearch, sortedItems, sortState, handleSort } = useModalListState({
    items: items ?? [],
    searchFields: ['name', 'description'],
    initialSortKey: 'name',
  });

  const handleSelect = (item: T) => {
    onSelect(item);
    onClose();
    setSearch('');
  };

  const modalHeader = (
    <div className="px-6 py-4 border-b border-border-light flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={config.color}>{config.icon}</span>
        <h2 className="text-xl font-bold text-text-primary">{displayTitle}</h2>
      </div>
      <IconButton label="Close modal" variant="ghost" onClick={onClose}>
        <X className="w-5 h-5" />
      </IconButton>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      header={modalHeader}
      showCloseButton={false}
      flexLayout
      contentClassName=""
      className="max-h-[80vh]"
    >
      <div className="px-6 py-3 border-b border-border-light">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={`Search ${itemType}s...`}
          size="sm"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <LoadingState message="Loading..." size="md" padding="md" />
        ) : error ? (
          <Alert variant="danger" className="mx-4">
            Error loading library: {error.message}
          </Alert>
        ) : sortedItems.length === 0 ? (
          <EmptyState
            title={items?.length === 0 ? config.emptyText : 'No matching items found.'}
            size="sm"
          />
        ) : (
          <>
            <ListHeader
              columns={[{ key: 'name', label: 'Name', width: '1fr' }]}
              gridColumns="1fr"
              sortState={sortState}
              onSort={handleSort}
              hasSelectionColumn
              className="mx-0 mb-2"
            />
            <div className="space-y-2">
              {sortedItems.map((item) => (
                <GridListRow
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  description={item.description}
                  compact
                  selectable
                  isSelected={false}
                  onSelect={() => handleSelect(item as T)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

function LoadFromLibraryModalUnified({
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
}: UnifiedLoadProps) {
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
        <p className="text-sm text-text-muted mt-1">
          Expand a row to view details. Select one item, then click Load.
        </p>
      </div>
      <IconButton variant="ghost" size="sm" onClick={onClose} label="Close">
        <X className="w-5 h-5" />
      </IconButton>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" showCloseButton={false}>
      <div className="flex flex-col h-[70vh] max-h-[60vh]">
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
            className="border-0 rounded-none bg-transparent dark:bg-transparent"
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
            <span className="text-sm text-text-muted">
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
