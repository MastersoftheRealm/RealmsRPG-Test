/**
 * OfficialEntityList — generic Realms Library grid list (browse + admin).
 *
 * Powers, techniques, items and creatures previously had four near-identical
 * list components. This generic holds the shared search/sort/empty/loading/row
 * scaffolding; each entity provides its row builder, filter, columns config and
 * chips via props. (DUP-09)
 */

'use client';

import { useMemo, useState, type ReactNode, type ComponentProps } from 'react';
import { Plus } from 'lucide-react';
import {
  GridListRow,
  SearchInput,
  ListHeader,
  LoadingState,
  ErrorDisplay,
  ListEmptyState,
  SectionHeader,
} from '@/components/shared';
import type { ColumnValue, ChipData } from '@/components/shared/grid-list-row';
import { IconButton } from '@/components/ui';
import { useSort } from '@/hooks/use-sort';

export interface OfficialEntityRow {
  id: string;
  name: string;
  description?: string;
}

export interface OfficialEntityListProps<TRow extends OfficialEntityRow> {
  items: Array<Record<string, unknown>>;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  /** Build display rows from raw items. */
  buildRows: (items: Array<Record<string, unknown>>) => TRow[];
  /** Filter + sort built rows by the current search term. */
  filterRows: (
    rows: TRow[],
    search: string,
    sortItems: (items: TRow[]) => TRow[]
  ) => TRow[];
  gridColumns: string;
  headerColumns: ComponentProps<typeof ListHeader>['columns'];
  /** Collapsed-row column values for a single row. */
  getColumns: (row: TRow) => ColumnValue[];
  /** Optional expanded chips (parts/properties). */
  getChips?: (row: TRow) => ChipData[] | undefined;
  chipsLabel?: string;
  /** Optional total cost for the expanded row. */
  getTotalCost?: (row: TRow) => number | undefined;
  costLabel?: string;

  errorMessage: string;
  sectionTitle?: string;
  searchPlaceholder: string;
  emptyIcon: ReactNode;
  emptyTitle: string;
  emptyMessage: string;
  searchEmptyMessage: string;

  variant: 'library' | 'admin';
  readOnly?: boolean;
  onAddRequest?: (row: TRow) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string, name: string) => void;
}

export function OfficialEntityList<TRow extends OfficialEntityRow>({
  items,
  isLoading,
  error,
  onRetry,
  buildRows,
  filterRows,
  gridColumns,
  headerColumns,
  getColumns,
  getChips,
  chipsLabel,
  getTotalCost,
  costLabel = 'TP',
  errorMessage,
  sectionTitle,
  searchPlaceholder,
  emptyIcon,
  emptyTitle,
  emptyMessage,
  searchEmptyMessage,
  variant,
  readOnly = false,
  onAddRequest,
  onEdit,
  onDelete,
}: OfficialEntityListProps<TRow>) {
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort('name');

  const cardData = useMemo(() => buildRows(items), [buildRows, items]);
  const filtered = useMemo(
    () => filterRows(cardData, search, sortItems),
    [filterRows, cardData, search, sortItems]
  );

  if (error) {
    return <ErrorDisplay message={errorMessage} onRetry={onRetry} />;
  }

  if (!isLoading && cardData.length === 0) {
    return <ListEmptyState icon={emptyIcon} title={emptyTitle} message={emptyMessage} />;
  }

  const canAdd = (row: TRow) => variant === 'library' && !readOnly && !!onAddRequest;

  return (
    <div>
      {sectionTitle ? <SectionHeader title={sectionTitle} size="md" /> : null}
      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder={searchPlaceholder} />
      </div>
      <ListHeader
        columns={headerColumns}
        gridColumns={gridColumns}
        sortState={sortState}
        onSort={handleSort}
      />
      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-text-secondary">{searchEmptyMessage}</div>
        ) : (
          filtered.map((row) => {
            const chips = getChips?.(row);
            const totalCost = getTotalCost?.(row);
            return (
              <GridListRow
                key={row.id}
                id={row.id}
                name={row.name}
                description={row.description}
                gridColumns={gridColumns}
                columns={getColumns(row)}
                chips={chips}
                chipsLabel={chipsLabel}
                totalCost={totalCost}
                costLabel={costLabel}
                badges={variant === 'library' ? [{ label: 'Realms', color: 'blue' }] : undefined}
                rightSlot={
                  canAdd(row) ? (
                    <IconButton
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddRequest!(row);
                      }}
                      label="Add to my library"
                      className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                    >
                      <Plus className="w-4 h-4" />
                    </IconButton>
                  ) : undefined
                }
                onAddToLibrary={canAdd(row) ? () => onAddRequest!(row) : undefined}
                onEdit={variant === 'admin' && onEdit ? () => onEdit(row.id) : undefined}
                onDelete={variant === 'admin' && onDelete ? () => onDelete(row.id, row.name) : undefined}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
