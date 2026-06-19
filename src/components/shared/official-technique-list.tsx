/**
 * OfficialTechniqueList — shared grid list for Realms Library techniques (browse + admin).
 */

'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Plus, Swords } from 'lucide-react';
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
import type { TechniquePart } from '@/hooks/codex-types';
import {
  buildOfficialTechniqueRows,
  filterOfficialTechniqueRows,
  OFFICIAL_TECHNIQUE_GRID,
  OFFICIAL_TECHNIQUE_HEADER_COLUMNS,
  type OfficialTechniqueRow,
} from '@/lib/library/official-technique-list';

export type { OfficialTechniqueRow };

export interface OfficialTechniqueListProps {
  items: Array<Record<string, unknown>>;
  partsDb: TechniquePart[];
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  mode?: 'standard' | 'empowered';
  errorMessage?: string;
  sectionTitle?: string;
  searchPlaceholder?: string;
  emptyIcon?: ReactNode;
  emptyTitle: string;
  emptyMessage: string;
  searchEmptyMessage?: string;
  variant: 'library' | 'admin';
  readOnly?: boolean;
  onAddRequest?: (row: OfficialTechniqueRow) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string, name: string) => void;
}

export function OfficialTechniqueList({
  items,
  partsDb,
  isLoading,
  error,
  onRetry,
  mode = 'standard',
  errorMessage,
  sectionTitle,
  searchPlaceholder,
  emptyIcon = <Swords className="w-8 h-8" />,
  emptyTitle,
  emptyMessage,
  searchEmptyMessage,
  variant,
  readOnly = false,
  onAddRequest,
  onEdit,
  onDelete,
}: OfficialTechniqueListProps) {
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort('name');
  const empowered = mode === 'empowered';

  const cardData = useMemo(
    () => buildOfficialTechniqueRows(items, partsDb, mode),
    [items, partsDb, mode]
  );

  const filtered = useMemo(
    () => filterOfficialTechniqueRows(cardData, search, sortItems),
    [cardData, search, sortItems]
  );

  const resolvedErrorMessage =
    errorMessage ??
    `Failed to load ${empowered ? 'empowered techniques' : 'techniques'}`;
  const resolvedSearchPlaceholder =
    searchPlaceholder ?? (empowered ? 'Search empowered techniques...' : 'Search techniques...');
  const resolvedSearchEmptyMessage =
    searchEmptyMessage ??
    (empowered ? 'No empowered techniques match your search.' : 'No techniques match your search.');

  if (error) {
    return <ErrorDisplay message={resolvedErrorMessage} onRetry={onRetry} />;
  }

  if (!isLoading && cardData.length === 0) {
    return <ListEmptyState icon={emptyIcon} title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <div>
      {sectionTitle ? <SectionHeader title={sectionTitle} size="md" /> : null}
      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder={resolvedSearchPlaceholder} />
      </div>
      <ListHeader
        columns={OFFICIAL_TECHNIQUE_HEADER_COLUMNS}
        gridColumns={OFFICIAL_TECHNIQUE_GRID}
        sortState={sortState}
        onSort={handleSort}
      />
      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-text-secondary">{resolvedSearchEmptyMessage}</div>
        ) : (
          filtered.map((t) => (
            <GridListRow
              key={t.id}
              id={t.id}
              name={t.name}
              description={t.description}
              gridColumns={OFFICIAL_TECHNIQUE_GRID}
              columns={[
                { key: 'Energy', value: t.energy, highlight: true, align: 'center' },
                { key: 'TP', value: t.tp, align: 'center' },
                { key: 'Action', value: t.action, align: 'center' },
                { key: 'Weapon', value: t.weapon, align: 'center' },
                { key: 'Damage', value: t.damage, align: 'center' },
              ]}
              chips={t.parts}
              chipsLabel="Parts"
              totalCost={t.tp}
              costLabel="TP"
              badges={variant === 'library' ? [{ label: 'Realms', color: 'blue' }] : undefined}
              rightSlot={
                variant === 'library' && !readOnly && onAddRequest ? (
                  <IconButton
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddRequest(t);
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
                  ? () => onAddRequest(t)
                  : undefined
              }
              onEdit={variant === 'admin' && onEdit ? () => onEdit(t.id) : undefined}
              onDelete={variant === 'admin' && onDelete ? () => onDelete(t.id, t.name) : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}
