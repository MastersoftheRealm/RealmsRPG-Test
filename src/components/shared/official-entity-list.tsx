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
import type { ListRowThumbnailProps } from '@/components/shared/list-row-thumbnail';
import { IconButton } from '@/components/ui';
import { useSort } from '@/hooks/use-sort';

export interface OfficialEntityRow {
  id: string;
  name: string;
  description?: string;
}

export interface OfficialEntityListProps<TRow extends OfficialEntityRow, TItem> {
  items: TItem[];
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  /** Build display rows from raw items. */
  buildRows: (items: TItem[]) => TRow[];
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
  /** Optional row badges (overrides library Realms default when set). */
  getBadges?: (row: TRow) => ComponentProps<typeof GridListRow>['badges'];
  /** Optional expanded chips (parts/properties). */
  getChips?: (row: TRow) => ChipData[] | undefined;
  chipsLabel?: string;
  /** Optional total cost for the expanded row. */
  getTotalCost?: (row: TRow) => number | undefined;
  costLabel?: string;
  /**
   * Optional list-row art (species/equipment/etc.). When set, ListHeader gets
   * `hasThumbnailColumn` and each row receives `GridListRow.thumbnail`.
   */
  getThumbnail?: (row: TRow) => ListRowThumbnailProps;

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
  /** Optional control beside search (e.g. admin Create). Keeps list chrome when empty. */
  searchTrailing?: ReactNode;
}

export function OfficialEntityList<TRow extends OfficialEntityRow, TItem>({
  items,
  isLoading,
  error,
  onRetry,
  buildRows,
  filterRows,
  gridColumns,
  headerColumns,
  getColumns,
  getBadges,
  getChips,
  chipsLabel,
  getTotalCost,
  costLabel = 'Training Points',
  getThumbnail,
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
  searchTrailing,
}: OfficialEntityListProps<TRow, TItem>) {
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

  // Bare empty when there is no create/trailing control; with searchTrailing keep chrome
  // so admin create is not a dead-end on an empty library.
  if (!isLoading && cardData.length === 0 && !searchTrailing) {
    return <ListEmptyState icon={emptyIcon} title={emptyTitle} message={emptyMessage} />;
  }

  const canAdd = () => variant === 'library' && !readOnly && !!onAddRequest;

  return (
    <div>
      {sectionTitle ? <SectionHeader title={sectionTitle} size="md" /> : null}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="min-w-[200px] flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder={searchPlaceholder} />
        </div>
        {searchTrailing}
      </div>
      <ListHeader
        columns={headerColumns}
        gridColumns={gridColumns}
        sortState={sortState}
        onSort={handleSort}
        hasThumbnailColumn={Boolean(getThumbnail)}
      />
      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          cardData.length === 0 ? (
            <ListEmptyState icon={emptyIcon} title={emptyTitle} message={emptyMessage} />
          ) : (
            <ListEmptyState title={searchEmptyMessage} size="sm" />
          )
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
                thumbnail={getThumbnail?.(row)}
                gridColumns={gridColumns}
                columns={getColumns(row)}
                chips={chips}
                chipsLabel={chipsLabel}
                totalCost={totalCost}
                costLabel={costLabel}
                badges={
                  getBadges?.(row) ??
                  (variant === 'library' ? [{ label: 'Realms', color: 'blue' }] : undefined)
                }
                rightSlot={
                  canAdd() ? (
                    <IconButton
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddRequest!(row);
                      }}
                      label="Add to my library"
                      className="text-primary-link-fg hover:text-primary-fg-hover hover:bg-primary-subtle-bg"
                    >
                      <Plus className="w-4 h-4" />
                    </IconButton>
                  ) : undefined
                }
                onAddToLibrary={canAdd() ? () => onAddRequest!(row) : undefined}
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
