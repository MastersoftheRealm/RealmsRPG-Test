'use client';

/**
 * ListHeader - Unified Sortable Column Headers
 * =============================================
 * Consistent column header row for all list views.
 * Matches Codex/Library patterns with ascending/descending sort functionality.
 * 
 * Features:
 * - Grid-based layout matching GridListRow columns
 * - Sortable columns with click-to-toggle
 * - Visual indicator for active sort column and direction
 * - Responsive - hides on mobile
 * - Clean, minimal design with subtle background
 */

import { ChevronUp, ChevronDown } from 'lucide-react';
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
  className,
}: ListHeaderProps) {
  // Build grid template from columns if not provided
  const gridTemplate = gridColumns || columns.map(c => c.width || '1fr').join(' ');
  
  // Add selection column space if needed
  const finalGridTemplate = hasSelectionColumn
    ? `${gridTemplate} 2.5rem`
    : gridTemplate;

  const handleColumnClick = (column: ListColumn) => {
    if (column.sortable !== false && onSort) {
      onSort(column.key);
    }
  };

  return (
    <div
      className={cn(
        'hidden lg:grid gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/30 rounded-lg mb-2 mx-1',
        'text-xs font-semibold text-primary-700 dark:text-primary-300 uppercase tracking-wide',
        className
      )}
      style={{ gridTemplateColumns: finalGridTemplate }}
    >
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
              'flex items-center gap-1 transition-colors hover:text-primary-800 dark:hover:text-primary-200',
              alignStyles[column.align || 'left'],
              isActive && 'text-primary-800 dark:text-primary-200',
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
      {hasSelectionColumn && (
        <span className="text-center" />
      )}
    </div>
  );
}

export default ListHeader;
