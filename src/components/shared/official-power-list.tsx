/**
 * OfficialPowerList — shared grid list for Realms Library powers (browse + admin).
 */

'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Plus, Wand2 } from 'lucide-react';
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
import type { PowerPart } from '@/hooks/codex-types';
import {
  buildOfficialPowerRows,
  filterOfficialPowerRows,
  OFFICIAL_POWER_GRID,
  OFFICIAL_POWER_HEADER_COLUMNS,
  type OfficialPowerRow,
} from '@/lib/library/official-power-list';

export type { OfficialPowerRow };

export interface OfficialPowerListProps {
  items: Array<Record<string, unknown>>;
  partsDb: PowerPart[];
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  /** Shown when the query fails */
  errorMessage?: string;
  /** Admin tab title; omitted in library browse mode */
  sectionTitle?: string;
  searchPlaceholder?: string;
  emptyIcon?: ReactNode;
  emptyTitle: string;
  emptyMessage: string;
  searchEmptyMessage?: string;
  /** Library browse: show Realms badge + add control */
  variant: 'library' | 'admin';
  readOnly?: boolean;
  onAddRequest?: (row: OfficialPowerRow) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string, name: string) => void;
}

export function OfficialPowerList({
  items,
  partsDb,
  isLoading,
  error,
  onRetry,
  errorMessage = 'Failed to load powers',
  sectionTitle,
  searchPlaceholder = 'Search powers...',
  emptyIcon = <Wand2 className="w-8 h-8" />,
  emptyTitle,
  emptyMessage,
  searchEmptyMessage = 'No powers match your search.',
  variant,
  readOnly = false,
  onAddRequest,
  onEdit,
  onDelete,
}: OfficialPowerListProps) {
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort('name');

  const cardData = useMemo(
    () => buildOfficialPowerRows(items, partsDb),
    [items, partsDb]
  );

  const filtered = useMemo(
    () => filterOfficialPowerRows(cardData, search, sortItems),
    [cardData, search, sortItems]
  );

  if (error) {
    return <ErrorDisplay message={errorMessage} onRetry={onRetry} />;
  }

  if (!isLoading && cardData.length === 0) {
    return (
      <ListEmptyState icon={emptyIcon} title={emptyTitle} message={emptyMessage} />
    );
  }

  return (
    <div>
      {sectionTitle ? <SectionHeader title={sectionTitle} size="md" /> : null}
      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder={searchPlaceholder} />
      </div>
      <ListHeader
        columns={OFFICIAL_POWER_HEADER_COLUMNS}
        gridColumns={OFFICIAL_POWER_GRID}
        sortState={sortState}
        onSort={handleSort}
      />
      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-text-secondary">{searchEmptyMessage}</div>
        ) : (
          filtered.map((p) => (
            <GridListRow
              key={p.id}
              id={p.id}
              name={p.name}
              description={p.description}
              gridColumns={OFFICIAL_POWER_GRID}
              columns={[
                { key: 'Energy', value: p.energy, highlight: true, align: 'center' },
                { key: 'Action', value: p.action, align: 'center' },
                { key: 'Duration', value: p.duration, align: 'center' },
                { key: 'Range', value: p.range, align: 'center' },
                { key: 'Area', value: p.area, align: 'center' },
                { key: 'Damage', value: p.damage, align: 'center' },
              ]}
              chips={p.parts}
              chipsLabel="Parts"
              totalCost={p.tp}
              costLabel="TP"
              badges={variant === 'library' ? [{ label: 'Realms', color: 'blue' }] : undefined}
              rightSlot={
                variant === 'library' && !readOnly && onAddRequest ? (
                  <IconButton
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddRequest(p);
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
                  ? () => onAddRequest(p)
                  : undefined
              }
              onEdit={variant === 'admin' && onEdit ? () => onEdit(p.id) : undefined}
              onDelete={
                variant === 'admin' && onDelete ? () => onDelete(p.id, p.name) : undefined
              }
            />
          ))
        )}
      </div>
    </div>
  );
}
