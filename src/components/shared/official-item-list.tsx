/**
 * OfficialItemList — shared grid list for Realms Library armaments (browse + admin).
 */

'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Plus, Shield } from 'lucide-react';
import {
  GridListRow,
  SearchInput,
  ListHeader,
  LoadingState,
  ErrorDisplay,
  ListEmptyState,
  SectionHeader,
} from '@/components/shared';
import { IconButton } from '@/components/ui';
import { useSort } from '@/hooks/use-sort';
import type { ItemProperty } from '@/hooks/codex-types';
import {
  buildOfficialItemRows,
  filterOfficialItemRows,
  OFFICIAL_ITEM_GRID,
  OFFICIAL_ITEM_HEADER_COLUMNS,
  type OfficialItemRow,
} from '@/lib/library/official-item-list';

export type { OfficialItemRow };

export interface OfficialItemListProps {
  items: Array<Record<string, unknown>>;
  propertiesDb: ItemProperty[];
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  errorMessage?: string;
  sectionTitle?: string;
  searchPlaceholder?: string;
  emptyIcon?: ReactNode;
  emptyTitle: string;
  emptyMessage: string;
  searchEmptyMessage?: string;
  variant: 'library' | 'admin';
  readOnly?: boolean;
  onAddRequest?: (row: OfficialItemRow) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string, name: string) => void;
}

export function OfficialItemList({
  items,
  propertiesDb,
  isLoading,
  error,
  onRetry,
  errorMessage = 'Failed to load armaments',
  sectionTitle,
  searchPlaceholder = 'Search armaments...',
  emptyIcon = <Shield className="w-8 h-8" />,
  emptyTitle,
  emptyMessage,
  searchEmptyMessage = 'No armaments match your search.',
  variant,
  readOnly = false,
  onAddRequest,
  onEdit,
  onDelete,
}: OfficialItemListProps) {
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort('name');

  const cardData = useMemo(
    () => buildOfficialItemRows(items, propertiesDb),
    [items, propertiesDb]
  );

  const filtered = useMemo(
    () => filterOfficialItemRows(cardData, search, sortItems),
    [cardData, search, sortItems]
  );

  if (error) {
    return <ErrorDisplay message={errorMessage} onRetry={onRetry} />;
  }

  if (!isLoading && cardData.length === 0) {
    return <ListEmptyState icon={emptyIcon} title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <div>
      {sectionTitle ? <SectionHeader title={sectionTitle} size="md" /> : null}
      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder={searchPlaceholder} />
      </div>
      <ListHeader
        columns={OFFICIAL_ITEM_HEADER_COLUMNS}
        gridColumns={OFFICIAL_ITEM_GRID}
        sortState={sortState}
        onSort={handleSort}
      />
      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-text-secondary">{searchEmptyMessage}</div>
        ) : (
          filtered.map((i) => (
            <GridListRow
              key={i.id}
              id={i.id}
              name={i.name}
              description={i.description}
              gridColumns={OFFICIAL_ITEM_GRID}
              columns={[
                { key: 'Type', value: i.type, align: 'center' },
                { key: 'Rarity', value: i.rarity, align: 'center' },
                { key: 'Currency', value: i.currency, align: 'center' },
                { key: 'TP', value: i.tp, align: 'center' },
                { key: 'Range', value: i.range, align: 'center' },
                { key: 'Damage', value: i.damage, align: 'center' },
              ]}
              chips={i.parts}
              chipsLabel="Properties"
              totalCost={i.tp}
              costLabel="TP"
              badges={variant === 'library' ? [{ label: 'Realms', color: 'blue' }] : undefined}
              rightSlot={
                variant === 'library' && !readOnly && onAddRequest ? (
                  <IconButton
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddRequest(i);
                    }}
                    label="Add to my library"
                    className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                  >
                    <Plus className="w-4 h-4" />
                  </IconButton>
                ) : undefined
              }
              onAddToLibrary={
                variant === 'library' && !readOnly && onAddRequest
                  ? () => onAddRequest(i)
                  : undefined
              }
              onEdit={variant === 'admin' && onEdit ? () => onEdit(i.id) : undefined}
              onDelete={variant === 'admin' && onDelete ? () => onDelete(i.id, i.name) : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}
