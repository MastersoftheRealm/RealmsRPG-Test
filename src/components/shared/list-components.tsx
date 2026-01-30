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
import { ChevronUp, ChevronDown, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';

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

export interface SortState {
  col: string;
  dir: 1 | -1;
}

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
        'flex items-center gap-1 text-left text-sm font-medium text-text-secondary hover:text-text-primary transition-colors',
        isActive && 'text-primary-600',
        className
      )}
    >
      {label}
      {isActive && (
        sortState.dir === 1 ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
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
        {isExpanded ? (
          <>
            <span>Hide Filters</span>
            <ChevronUp className="w-4 h-4" />
          </>
        ) : (
          <>
            <span>Show Filters</span>
            <ChevronDown className="w-4 h-4" />
          </>
        )}
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
// Results Count
// =============================================================================

export interface ResultsCountProps {
  count: number;
  itemLabel?: string;
  isLoading?: boolean;
}

export function ResultsCount({ 
  count, 
  itemLabel = 'item', 
  isLoading = false 
}: ResultsCountProps) {
  if (isLoading) {
    return <div className="text-sm text-text-muted mb-4">Loading...</div>;
  }
  
  return (
    <div className="text-sm text-text-muted mb-4">
      {count} {itemLabel}{count !== 1 ? 's' : ''} found
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
        'hidden lg:grid gap-2 px-4 py-2 bg-surface-alt rounded-t-lg font-medium text-sm text-text-secondary',
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
// List Container
// =============================================================================

export interface ListContainerProps {
  children: React.ReactNode;
  hasHeader?: boolean;
  className?: string;
}

export function ListContainer({ 
  children, 
  hasHeader = true,
  className,
}: ListContainerProps) {
  return (
    <div 
      className={cn(
        'divide-y divide-border-light border border-border-light',
        hasHeader ? 'rounded-b-lg lg:rounded-t-none rounded-lg' : 'rounded-lg',
        className
      )}
    >
      {children}
    </div>
  );
}

// =============================================================================
// Empty State
// =============================================================================

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export function EmptyState({ 
  icon, 
  title, 
  message, 
  action 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && (
        <div className="w-16 h-16 mb-4 rounded-full bg-surface-alt flex items-center justify-center text-text-muted">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-text-primary mb-2">{title}</h3>
      {message && (
        <p className="text-text-muted mb-6 max-w-sm">{message}</p>
      )}
      {action}
    </div>
  );
}

// =============================================================================
// Loading State - Uses unified Spinner from ui
// =============================================================================

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-12', className)}>
      <Spinner size="md" />
    </div>
  );
}

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
