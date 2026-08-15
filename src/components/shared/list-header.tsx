'use client';

/**
 * ListHeader - Unified Sortable Column Headers
 * =============================================
 * Consistent column header row for all list views.
 * Matches Codex/Library patterns with ascending/descending sort functionality.
 *
 * Features:
 * - Grid-based layout matching GridListRow columns (desktop)
 * - Mobile: expandable "Sort by" control using same sort logic (no column headers on small screens)
 * - Sortable columns with click-to-toggle
 * - Visual indicator for active sort column and direction
 */

import { useState, useRef, useEffect, type RefObject } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  hasListHeaderRowChrome,
  type ListHeaderRowChrome,
  GRID_LIST_ROW_LEFT_SLOT_WIDTH,
  GRID_LIST_ROW_RIGHT_SLOT_FLEX_WIDTH,
  GRID_LIST_ROW_ICON_COLUMN_WIDTH,
  GRID_LIST_ROW_SELECTION_COLUMN_WIDTH,
  GRID_LIST_INLINE_SELECTION_COLUMN_TRACK,
  gridTemplateColumnsWithThumbnail,
  prependThumbnailHeaderColumn,
  THUMBNAIL_HEADER_COLUMN_KEY,
} from './grid-list-row-chrome';

export type { ListHeaderRowChrome } from './grid-list-row-chrome';

export interface ListColumn {
  /** Column key for sorting */
  key: string;
  /** Display label */
  label: string;
  /** Is this column sortable? Default true */
  sortable?: boolean;
  /** Column width (for grid template) */
  width?: string;
  /** Additional className */
  className?: string;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
}

export interface SortState {
  /** Currently sorted column key */
  col: string;
  /** Sort direction: 1 = ascending, -1 = descending */
  dir: 1 | -1;
}

export interface ListHeaderProps {
  /** Column definitions */
  columns: ListColumn[];
  /** Grid template columns CSS (alternative to individual column widths) */
  gridColumns?: string;
  /** Current sort state */
  sortState?: SortState;
  /** Callback when a sortable column is clicked */
  onSort?: (columnKey: string) => void;
  /** Whether the list is in selectable mode (adds space for selection button) */
  hasSelectionColumn?: boolean;
  /** Fixed width for a right slot (e.g. quantity); uses flex so header grid aligns with row grid */
  rightSlotWidth?: string;
  /**
   * Reserve the same horizontal space as `GridListRow` outer flex chrome (leftSlot / rightSlot / edit / delete / selection).
   * Pair flags with row actions — CI: `lib/glr/validate-glr-chrome-spacing.test.ts` (TASK-631).
   * Do not combine with `rightSlotWidth` (equipment-step pattern uses `rightSlotWidth` only).
   */
  rowChrome?: ListHeaderRowChrome;
  /**
   * Reserve a blank first column aligned with `GridListRow.thumbnail` (44px).
   * Prepends to `gridColumns` automatically — pass the same base template as rows (without thumb track).
   */
  hasThumbnailColumn?: boolean;
  /** Compact mode: use px-3 to match GridListRow compact rows (e.g. in modals) */
  compact?: boolean;
  /** Additional className */
  className?: string;
}

const alignStyles = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

const justifyStyles = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
};

function MobileSortMenu({
  sortableColumns,
  sortState,
  currentLabel,
  currentDir,
  open,
  onOpenChange,
  menuRef,
  onColumnClick,
}: {
  sortableColumns: Array<{ key: string; label: string }>;
  sortState?: SortState;
  currentLabel: string;
  currentDir: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuRef: RefObject<HTMLDivElement | null>;
  onColumnClick: (column: ListColumn) => void;
}) {
  return (
    <div ref={menuRef} className="mb-2 lg:hidden">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm font-medium',
          'border-primary-subtle-border bg-primary-subtle-bg',
          'text-primary-fg',
          'transition-colors hover:bg-primary-subtle-bg-hover',
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Sort by. Current: ${currentLabel} ${currentDir}. Choose sort order.`}
      >
        <span className="flex items-center gap-1.5">
          <span className="text-primary-link-fg">Sort by</span>
          <span>{currentLabel}</span>
          <span className="text-xs text-primary-link-fg">({currentDir})</span>
        </span>
        <ChevronsUpDown
          className={cn('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div
          className="mt-1 overflow-hidden rounded-lg border border-border-light bg-surface shadow-lg"
          role="listbox"
        >
          {sortableColumns.map((column) => {
            const isActive = sortState?.col === column.key;
            return (
              <button
                key={column.key}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  onColumnClick(column);
                  onOpenChange(false);
                }}
                className={cn(
                  'flex min-h-[44px] w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm',
                  'transition-colors hover:bg-surface-alt',
                  isActive && 'bg-primary-subtle-bg font-medium text-primary-fg',
                )}
              >
                <span>{column.label}</span>
                {isActive &&
                  (sortState?.dir === 1 ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-primary-link-fg" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-primary-link-fg" />
                  ))}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ListHeader({
  columns,
  gridColumns,
  sortState,
  onSort,
  hasSelectionColumn = false,
  rightSlotWidth,
  rowChrome,
  hasThumbnailColumn = false,
  compact = false,
  className,
}: ListHeaderProps) {
  const displayColumns = hasThumbnailColumn ? prependThumbnailHeaderColumn(columns) : columns;
  // Build grid template from columns if not provided
  const baseGridTemplate = gridColumns || columns.map((c) => c.width || '1fr').join(' ');
  const gridTemplate = hasThumbnailColumn
    ? gridTemplateColumnsWithThumbnail(baseGridTemplate)
    : baseGridTemplate;

  const useRowChrome = hasListHeaderRowChrome(rowChrome) && !rightSlotWidth;
  const selectionColumnInGrid =
    !rightSlotWidth && hasSelectionColumn && !rowChrome?.externalSelection;

  // Add selection column space when the selection toggle lives inside the row grid (inline track constant)
  const finalGridTemplate = selectionColumnInGrid
    ? `${gridTemplate} ${GRID_LIST_INLINE_SELECTION_COLUMN_TRACK}`
    : gridTemplate;

  const handleColumnClick = (column: ListColumn) => {
    if (column.sortable !== false && onSort) {
      onSort(column.key);
    }
  };

  const sortableColumns = [
    ...displayColumns.filter(
      (c) => c.sortable !== false && onSort && c.key !== THUMBNAIL_HEADER_COLUMN_KEY,
    ),
    ...(rowChrome?.rightSlot && rowChrome.rightSlotLabel && rowChrome.rightSlotSortKey && onSort
      ? [
          {
            key: rowChrome.rightSlotSortKey,
            label: rowChrome.rightSlotLabel,
            align: 'center' as const,
          },
        ]
      : []),
  ];
  const hasSortable = sortableColumns.length > 0;
  const currentCol =
    sortState && hasSortable
      ? sortableColumns.find((c) => c.key === sortState.col)
      : sortableColumns[0];
  const currentLabel = currentCol?.label ?? sortState?.col ?? 'Name';
  const currentDir = (sortState?.dir ?? 1) === 1 ? 'A→Z' : 'Z→A';

  // Mobile sort dropdown state
  const [mobileSortOpen, setMobileSortOpen] = useState(false);
  const mobileSortRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileSortRef.current && !mobileSortRef.current.contains(e.target as Node)) {
        setMobileSortOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Use same horizontal padding as GridListRow so column content aligns with headers site-wide
  const rowPaddingX = compact ? 'px-3' : 'px-4';
  const headerTypography = 'text-xs font-semibold text-primary-fg uppercase tracking-wide';
  const headerBarSurface = 'bg-primary-subtle-bg border border-primary-subtle-border rounded-lg';

  const desktopGridOnlyClasses = cn(
    'hidden lg:grid gap-2 py-2 mb-2',
    headerBarSurface,
    headerTypography,
    !rightSlotWidth && rowPaddingX,
    rightSlotWidth && 'px-3 min-w-0',
    className,
  );

  const headerContent = (
    <>
      {displayColumns.map((column, index) => {
        const isThumbnailSpacer = column.key === THUMBNAIL_HEADER_COLUMN_KEY;
        const isSortable = !isThumbnailSpacer && column.sortable !== false && onSort;
        const isActive = sortState?.col === column.key;
        // First data column (name) is left-aligned; thumb spacer + other cols default to center
        const firstDataColumnIndex = displayColumns.findIndex(
          (c) => c.key !== THUMBNAIL_HEADER_COLUMN_KEY,
        );
        const align =
          typeof column.align !== 'undefined'
            ? column.align
            : index === firstDataColumnIndex || column.key === 'name'
              ? 'left'
              : 'center';

        if (!isSortable) {
          return (
            <span
              key={column.key}
              className={cn('block w-full', column.className, alignStyles[align])}
              aria-hidden={isThumbnailSpacer || undefined}
            >
              {column.label ? column.label.toUpperCase() : null}
            </span>
          );
        }

        return (
          <button
            key={column.key}
            onClick={() => handleColumnClick(column)}
            className={cn(
              'inline-flex w-full items-center gap-1 transition-colors hover:text-primary-fg-hover',
              column.className,
              justifyStyles[align],
              alignStyles[align],
              isActive && 'text-primary-fg',
            )}
          >
            {column.label.toUpperCase()}
            {isActive &&
              (sortState.dir === 1 ? (
                <ChevronUp className="h-3 w-3 shrink-0 text-primary-link-fg" />
              ) : (
                <ChevronDown className="h-3 w-3 shrink-0 text-primary-link-fg" />
              ))}
          </button>
        );
      })}

      {/* Selection column - no text, just space for the toggle buttons */}
      {selectionColumnInGrid && <span className="text-center" />}
    </>
  );

  if (rightSlotWidth) {
    return (
      <>
        {/* Desktop: full-width header bar including qty chrome spacer (TASK-702) */}
        <div
          className={cn(
            'mb-2 hidden w-full items-stretch overflow-hidden lg:flex',
            headerBarSurface,
            headerTypography,
            className,
          )}
        >
          <div
            className={cn('grid min-w-0 flex-1 gap-2 py-2', 'min-w-0 px-3')}
            style={{ gridTemplateColumns: gridTemplate }}
          >
            {headerContent}
          </div>
          <div
            className="flex-shrink-0 self-stretch"
            style={{ width: rightSlotWidth }}
            aria-hidden
          />
        </div>
        {hasSortable && (
          <MobileSortMenu
            sortableColumns={sortableColumns}
            sortState={sortState}
            currentLabel={currentLabel}
            currentDir={currentDir}
            open={mobileSortOpen}
            onOpenChange={setMobileSortOpen}
            menuRef={mobileSortRef}
            onColumnClick={handleColumnClick}
          />
        )}
      </>
    );
  }

  if (useRowChrome && rowChrome) {
    const rightSlotSortKey = rowChrome.rightSlotSortKey;
    const rightSlotLabel = rowChrome.rightSlotLabel;
    const rightSlotIsSortable = !!(rightSlotLabel && rightSlotSortKey && onSort);
    const rightSlotActive = rightSlotIsSortable && sortState?.col === rightSlotSortKey;

    return (
      <>
        <div
          className={cn(
            'mb-2 hidden w-full items-stretch overflow-hidden lg:flex',
            headerBarSurface,
            headerTypography,
            className,
          )}
        >
          {rowChrome.leftSlot && (
            <div
              className="flex-shrink-0 self-stretch"
              style={{ width: GRID_LIST_ROW_LEFT_SLOT_WIDTH }}
              aria-hidden
            />
          )}
          <div
            className={cn('grid min-w-0 flex-1 gap-2 py-2', rowPaddingX)}
            style={{ gridTemplateColumns: finalGridTemplate }}
          >
            {headerContent}
          </div>
          {rowChrome.rightSlot && (
            <div
              className="flex flex-shrink-0 items-center justify-center self-stretch px-0.5"
              style={{ width: GRID_LIST_ROW_RIGHT_SLOT_FLEX_WIDTH }}
              aria-hidden={!rightSlotLabel || undefined}
            >
              {rightSlotIsSortable ? (
                <button
                  type="button"
                  onClick={() => onSort!(rightSlotSortKey!)}
                  className={cn(
                    'inline-flex w-full items-center justify-center gap-1 transition-colors hover:text-primary-fg-hover',
                    rightSlotActive && 'text-primary-fg',
                  )}
                >
                  {rightSlotLabel!.toUpperCase()}
                  {rightSlotActive &&
                    (sortState!.dir === 1 ? (
                      <ChevronUp className="h-3 w-3 shrink-0 text-primary-link-fg" />
                    ) : (
                      <ChevronDown className="h-3 w-3 shrink-0 text-primary-link-fg" />
                    ))}
                </button>
              ) : rightSlotLabel ? (
                <span className="text-center">{rightSlotLabel.toUpperCase()}</span>
              ) : null}
            </div>
          )}
          {rowChrome.edit && (
            <div
              className="flex-shrink-0 self-stretch"
              style={{ width: GRID_LIST_ROW_ICON_COLUMN_WIDTH }}
              aria-hidden
            />
          )}
          {rowChrome.delete && (
            <div
              className="flex-shrink-0 self-stretch"
              style={{ width: GRID_LIST_ROW_ICON_COLUMN_WIDTH }}
              aria-hidden
            />
          )}
          {rowChrome.externalSelection && (
            <div
              className="flex-shrink-0 self-stretch"
              style={{ width: GRID_LIST_ROW_SELECTION_COLUMN_WIDTH }}
              aria-hidden
            />
          )}
        </div>
        {hasSortable && (
          <MobileSortMenu
            sortableColumns={sortableColumns}
            sortState={sortState}
            currentLabel={currentLabel}
            currentDir={currentDir}
            open={mobileSortOpen}
            onOpenChange={setMobileSortOpen}
            menuRef={mobileSortRef}
            onColumnClick={handleColumnClick}
          />
        )}
      </>
    );
  }

  return (
    <>
      {/* Desktop: grid header */}
      <div className={desktopGridOnlyClasses} style={{ gridTemplateColumns: finalGridTemplate }}>
        {headerContent}
      </div>
      {hasSortable && (
        <MobileSortMenu
          sortableColumns={sortableColumns}
          sortState={sortState}
          currentLabel={currentLabel}
          currentDir={currentDir}
          open={mobileSortOpen}
          onOpenChange={setMobileSortOpen}
          menuRef={mobileSortRef}
          onColumnClick={handleColumnClick}
        />
      )}
    </>
  );
}
