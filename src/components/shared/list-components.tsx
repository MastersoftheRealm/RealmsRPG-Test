'use client';

/**
 * List Components
 * ================
 * Shared components for displaying sorted, searchable lists
 * Used by both Codex and Library pages
 * 
 * NOTE: SearchInput is re-exported from ui/search-input.tsx for backward compatibility
 */

import { RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
// Filter Section
// =============================================================================

export { FilterSection, type FilterSectionProps } from './filters/filter-section';

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
  /** When provided, shows a retry button that calls this handler. */
  onRetry?: () => void;
  /** Label for the retry button (default: "Try again"). */
  retryLabel?: string;
}

export function ErrorDisplay({ message, subMessage, onRetry, retryLabel = 'Try again' }: ErrorDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 mb-4 text-danger-fg">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <p className="text-danger-fg font-medium">{message}</p>
      {subMessage && (
        <p className="text-text-muted text-sm mt-1">{subMessage}</p>
      )}
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-4">
          <RotateCw className="w-4 h-4" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
