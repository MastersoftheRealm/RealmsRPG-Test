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
import {
  GridListRow,
  SearchInput,
  ListHeader,
  LoadingState,
  ErrorDisplay,
  ListEmptyState,
  SectionHeader,
} from '@/components/shared';
import { LibraryAddToLibraryButton } from '@/components/shared/library-add-to-library-button';
import type { ColumnValue, ChipData } from '@/components/shared/grid-list-row';
import type { ListHeaderRowChrome } from '@/components/shared/grid-list-row-chrome';
import type { ListRowThumbnailProps } from '@/components/shared/list-row-thumbnail';
import type { MetadataDetailSection } from '@/lib/chip/list-row-metadata';
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
  /** Collapsed-row column values for a single row (not used when `renderRow` is set). */
  getColumns?: (row: TRow) => ColumnValue[];
  /** Optional row badges (e.g. Enhanced on admin enhanced items). */
  getBadges?: (row: TRow) => ComponentProps<typeof GridListRow>['badges'];
  /** Optional expanded chips (parts/properties). Prefer getDetailSections for Parts/Properties tips. */
  getChips?: (row: TRow) => ChipData[] | undefined;
  chipsLabel?: string;
  /** Labeled sections (Parts/Properties & Proficiencies with collapse + family tip). Overrides chips when set. */
  getDetailSections?: (row: TRow) => MetadataDetailSection[] | undefined;
  /** Optional total cost for the expanded row. */
  getTotalCost?: (row: TRow) => number | undefined;
  costLabel?: string;
  /**
   * Optional list-row art (species/equipment/etc.). When set, ListHeader gets
   * `hasThumbnailColumn` and each row receives `GridListRow.thumbnail`.
   */
  getThumbnail?: (row: TRow) => ListRowThumbnailProps;
  /** Override ListHeader thumbnail column when using custom `renderRow`. */
  hasThumbnailColumn?: boolean;
  /** Custom row renderer (e.g. CreatureStatBlock). Skips GridListRow when set. */
  renderRow?: (
    row: TRow,
    ctx: { canAdd: boolean; onAddRequest?: () => void }
  ) => ReactNode;
  listClassName?: string;
  afterList?: ReactNode;

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
  getDetailSections,
  getTotalCost,
  costLabel = 'TP',
  getThumbnail,
  hasThumbnailColumn: hasThumbnailColumnProp,
  renderRow,
  listClassName = 'flex flex-col gap-1 mt-2',
  afterList,
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
  const hasThumbnailColumn = hasThumbnailColumnProp ?? Boolean(getThumbnail);
  const rowChrome: ListHeaderRowChrome | undefined = (() => {
    const chrome: ListHeaderRowChrome = {};
    if (canAdd()) chrome.rightSlot = true;
    if (variant === 'admin' && onEdit) chrome.edit = true;
    if (variant === 'admin' && onDelete) chrome.delete = true;
    return chrome.rightSlot || chrome.edit || chrome.delete ? chrome : undefined;
  })();

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
        hasThumbnailColumn={hasThumbnailColumn}
        rowChrome={rowChrome}
      />
      <div className={listClassName}>
        {isLoading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          cardData.length === 0 ? (
            <ListEmptyState icon={emptyIcon} title={emptyTitle} message={emptyMessage} />
          ) : (
            <ListEmptyState title={searchEmptyMessage} size="sm" />
          )
        ) : renderRow ? (
          filtered.map((row) => (
            <div key={row.id}>
              {renderRow(row, {
                canAdd: canAdd(),
                onAddRequest: canAdd() ? () => onAddRequest!(row) : undefined,
              })}
            </div>
          ))
        ) : (
          filtered.map((row) => {
            const detailSections = getDetailSections?.(row);
            const chips = detailSections ? undefined : getChips?.(row);
            const totalCost = getTotalCost?.(row);
            return (
              <GridListRow
                key={row.id}
                id={row.id}
                name={row.name}
                description={row.description}
                thumbnail={getThumbnail?.(row)}
                gridColumns={gridColumns}
                columns={getColumns!(row)}
                chips={chips}
                chipsLabel={detailSections ? undefined : chipsLabel}
                detailSections={detailSections}
                totalCost={totalCost}
                costLabel={costLabel}
                badges={getBadges?.(row)}
                rightSlot={
                  canAdd() ? (
                    <LibraryAddToLibraryButton
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddRequest!(row);
                      }}
                    />
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
      {afterList}
    </div>
  );
}
