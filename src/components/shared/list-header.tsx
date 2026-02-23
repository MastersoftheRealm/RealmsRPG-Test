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

import { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export function ListHeader({
  columns,
  gridColumns,
  sortState,
  onSort,
  hasSelectionColumn = false,
  rightSlotWidth,
  compact = false,
  className,
}: ListHeaderProps) {
  // Build grid template from columns if not provided
  const gridTemplate = gridColumns || columns.map(c => c.width || '1fr').join(' ');
  
  // Add selection column space if needed (only when not using rightSlotWidth)
  const finalGridTemplate = !rightSlotWidth && hasSelectionColumn
    ? `${gridTemplate} 2.5rem`
    : gridTemplate;

  const handleColumnClick = (column: ListColumn) => {
    if (column.sortable !== false && onSort) {
      onSort(column.key);
    }
  };

  const sortableColumns = columns.filter((c) => c.sortable !== false && onSort);
  const hasSortable = sortableColumns.length > 0;
  const currentCol = sortState && hasSortable ? sortableColumns.find((c) => c.key === sortState.col) : sortableColumns[0];
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
  const baseHeaderClasses = cn(
    'hidden lg:grid gap-2 py-2 bg-primary-50 dark:bg-surface-alt dark:border dark:border-border rounded-lg mb-2',
    'text-xs font-semibold text-primary-700 dark:text-text-secondary uppercase tracking-wide',
    !rightSlotWidth && rowPaddingX,
    rightSlotWidth && 'px-3 min-w-0',
    className
  );

  const headerContent = (
    <>
      {columns.map((column) => {
        const isSortable = column.sortable !== false && onSort;
        const isActive = sortState?.col === column.key;
        
        if (!isSortable) {
          return (
            <span
              key={column.key}
              className={cn(
                alignStyles[column.align || 'left'],
                column.className
              )}
            >
              {column.label.toUpperCase()}
            </span>
          );
        }

        return (
          <button
            key={column.key}
            onClick={() => handleColumnClick(column)}
            className={cn(
              'flex items-center gap-1 transition-colors hover:text-primary-800 dark:hover:text-text-primary',
              alignStyles[column.align || 'left'],
              isActive && 'text-primary-800 dark:text-text-primary',
              column.className
            )}
          >
            {column.label.toUpperCase()}
            {isActive && (
              sortState.dir === 1 
                ? <ChevronUp className="w-3 h-3" /> 
                : <ChevronDown className="w-3 h-3" />
            )}
          </button>
        );
      })}
      
      {/* Selection column - no text, just space for the toggle buttons */}
      {!rightSlotWidth && hasSelectionColumn && (
        <span className="text-center" />
      )}
    </>
  );

  if (rightSlotWidth) {
    return (
      <>
        {/* Desktop: grid header */}
        <div className="hidden lg:flex items-center w-full">
          <div
            className={cn(baseHeaderClasses, 'flex-1 min-w-0')}
            style={{ gridTemplateColumns: gridTemplate }}
          >
            {headerContent}
          </div>
          <div className="flex-shrink-0" style={{ width: rightSlotWidth }} aria-hidden />
        </div>
        {/* Mobile: sort-by dropdown (same sort logic) */}
        {hasSortable && (
          <div ref={mobileSortRef} className="lg:hidden mb-2">
            <button
              type="button"
              onClick={() => setMobileSortOpen((o) => !o)}
              className={cn(
                'flex items-center justify-between w-full gap-2 py-2.5 px-3 rounded-lg border text-left text-sm font-medium',
                'bg-primary-50 dark:bg-surface-alt border-primary-200 dark:border-border',
                'text-primary-700 dark:text-text-secondary',
                'hover:bg-primary-100 dark:hover:bg-surface transition-colors'
              )}
              aria-expanded={mobileSortOpen}
              aria-haspopup="listbox"
              aria-label={`Sort by. Current: ${currentLabel} ${currentDir}. Choose sort order.`}
            >
              <span className="flex items-center gap-1.5">
                <span className="text-primary-600 dark:text-text-secondary">Sort by</span>
                <span>{currentLabel}</span>
                <span className="text-primary-600 dark:text-text-secondary text-xs">({currentDir})</span>
              </span>
              <ChevronsUpDown className={cn('w-4 h-4 shrink-0 transition-transform', mobileSortOpen && 'rotate-180')} />
            </button>
            {mobileSortOpen && (
              <div
                className="mt-1 rounded-lg border border-border-light bg-surface shadow-lg overflow-hidden"
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
                        handleColumnClick(column);
                        setMobileSortOpen(false);
                      }}
                      className={cn(
                        'w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-left min-h-[44px]',
                        'hover:bg-surface-alt transition-colors',
                        isActive && 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium'
                      )}
                    >
                      <span>{column.label}</span>
                      {isActive && (
                        sortState.dir === 1
                          ? <ChevronUp className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                          : <ChevronDown className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {/* Desktop: grid header */}
      <div
        className={cn(baseHeaderClasses, 'lg:grid')}
        style={{ gridTemplateColumns: finalGridTemplate }}
      >
        {headerContent}
      </div>
      {/* Mobile: sort-by dropdown (same sort logic) */}
      {hasSortable && (
        <div ref={mobileSortRef} className="lg:hidden mb-2">
          <button
            type="button"
            onClick={() => setMobileSortOpen((o) => !o)}
            className={cn(
              'flex items-center justify-between w-full gap-2 py-2.5 px-3 rounded-lg border text-left text-sm font-medium',
              'bg-primary-50 dark:bg-surface-alt border-primary-200 dark:border-border',
              'text-primary-700 dark:text-text-secondary',
              'hover:bg-primary-100 dark:hover:bg-surface transition-colors'
            )}
            aria-expanded={mobileSortOpen}
            aria-haspopup="listbox"
            aria-label={`Sort by. Current: ${currentLabel} ${currentDir}. Choose sort order.`}
          >
            <span className="flex items-center gap-1.5">
              <span className="text-primary-600 dark:text-text-secondary">Sort by</span>
              <span>{currentLabel}</span>
              <span className="text-primary-600 dark:text-text-secondary text-xs">({currentDir})</span>
            </span>
            <ChevronsUpDown className={cn('w-4 h-4 shrink-0 transition-transform', mobileSortOpen && 'rotate-180')} />
          </button>
          {mobileSortOpen && (
            <div
              className="mt-1 rounded-lg border border-border-light bg-surface shadow-lg overflow-hidden"
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
                      handleColumnClick(column);
                      setMobileSortOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-left min-h-[44px]',
                      'hover:bg-surface-alt transition-colors',
                      isActive && 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium'
                    )}
                  >
                    <span>{column.label}</span>
                    {isActive && (
                      sortState.dir === 1
                        ? <ChevronUp className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                        : <ChevronDown className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default ListHeader;
