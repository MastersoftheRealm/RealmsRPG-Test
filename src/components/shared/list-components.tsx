'use client';

/**
 * List Components
 * ================
 * Shared components for displaying sorted, searchable lists
 * Used by both Codex and Library pages
 * 
 * NOTE: SearchInput is re-exported from ui/search-input.tsx for backward compatibility
 */

import { useState } from 'react';
import { ChevronDown, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

// Re-export SearchInput from UI for backward compatibility
// Use the fully-featured version from ui/search-input
export { SearchInput } from '@/components/ui/search-input';

// Create a type alias for backward compatibility
export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// =============================================================================
// Sort Header
// =============================================================================

// SortState re-exported from list-header.tsx (canonical location)
import type { SortState } from './list-header';
export type { SortState } from './list-header';

export interface SortHeaderProps {
  label: string;
  col: string;
  sortState: SortState;
  onSort: (col: string) => void;
  className?: string;
}

export function SortHeader({ 
  label, 
  col, 
  sortState, 
  onSort,
  className,
}: SortHeaderProps) {
  const isActive = sortState.col === col;
  
  return (
    <button
      onClick={() => onSort(col)}
      className={cn(
        'flex items-center gap-1 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary hover:text-text-primary transition-colors',
        isActive && 'text-primary-600',
        className
      )}
    >
      {label}
      {isActive && (
        <ChevronDown className={cn('w-3 h-3 transition-transform', sortState.dir === 1 && 'rotate-180')} />
      )}
    </button>
  );
}

// =============================================================================
// Filter Section
// =============================================================================

export interface FilterSectionProps {
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

export function FilterSection({
  children,
  defaultExpanded = true,
  className,
}: FilterSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={cn('mb-6', className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary mb-4 transition-colors"
      >
        <Filter className="w-4 h-4" />
        {isExpanded ? <span>Hide Filters</span> : <span>Show Filters</span>}
        <ChevronDown className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')} />
      </button>

      {isExpanded && (
        <div className="p-4 bg-surface-secondary rounded-lg border border-border-light">
          {children}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Column Headers (for table-like lists)
// =============================================================================

export interface ColumnHeaderProps {
  columns: { key: string; label: string; width?: string }[];
  sortState: SortState;
  onSort: (col: string) => void;
  className?: string;
  /** Grid template columns CSS override */
  gridColumns?: string;
}

export function ColumnHeaders({ 
  columns, 
  sortState, 
  onSort,
  className,
  gridColumns,
}: ColumnHeaderProps) {
  return (
    <div 
      className={cn(
        'hidden lg:grid gap-2 px-4 py-3 bg-primary-50 border-b border-border-light rounded-t-lg font-medium text-sm text-text-secondary',
        className
      )}
      style={{ 
        gridTemplateColumns: gridColumns || columns.map(c => c.width || '1fr').join(' ') 
      }}
    >
      {columns.map(col => (
        <SortHeader
          key={col.key}
          label={col.label.toUpperCase()}
          col={col.key}
          sortState={sortState}
          onSort={onSort}
        />
      ))}
    </div>
  );
}

// =============================================================================
// Empty State - Re-export from ui/ for backward compatibility
// =============================================================================

// Re-export unified EmptyState from ui/ 
// The ui/empty-state has more features (action buttons, sizes)
export { EmptyState } from '@/components/ui/empty-state';
export type { EmptyStateProps } from '@/components/ui/empty-state';

// =============================================================================
// Loading State - Re-export from ui/ for backward compatibility
// =============================================================================
export { LoadingState } from '@/components/ui/spinner';

// =============================================================================
// Error State
// =============================================================================

export interface ErrorDisplayProps {
  message: string;
  subMessage?: string;
}

export function ErrorDisplay({ message, subMessage }: ErrorDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 mb-4 text-danger">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <p className="text-danger font-medium">{message}</p>
      {subMessage && (
        <p className="text-text-muted text-sm mt-1">{subMessage}</p>
      )}
    </div>
  );
}
