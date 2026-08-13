/**
 * ListSearchToolbar — full-span search row with optional trailing control (ADR-0011).
 *
 * When `filters` is set, composes FilterSection compact `toolbarStart` so Search +
 * Filters share one row (guided/USM pattern). `trailing` is FilterSection
 * `toolbarEnd` (right of Filters) — it must not steal the Filters slot (TASK-721).
 *
 * Used by CodexBrowseListShell, UserLibraryEntityTabShell, OfficialEntityList.
 */

'use client';

import type { ReactNode } from 'react';
import { SearchInput } from '@/components/ui/search-input';
import { cn } from '@/lib/utils';
import { FilterSection } from './filters/filter-section';

export interface ListSearchToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder: string;
  searchAriaLabel?: string;
  trailing?: ReactNode;
  /**
   * Filter panel body only (no nested FilterSection). When set, Search + Filters
   * share one compact row.
   */
  filters?: ReactNode;
  /** Active-filter badge on the collapsed Filters toggle. */
  filterActiveCount?: number;
  className?: string;
}

export function ListSearchToolbar({
  search,
  onSearchChange,
  placeholder,
  searchAriaLabel,
  trailing,
  filters,
  filterActiveCount = 0,
  className,
}: ListSearchToolbarProps) {
  const searchField = (
    <SearchInput
      value={search}
      onChange={onSearchChange}
      placeholder={placeholder}
      {...(searchAriaLabel ? { 'aria-label': searchAriaLabel } : {})}
    />
  );

  if (filters) {
    return (
      <FilterSection
        variant="compact"
        toolbarStart={searchField}
        toolbarEnd={trailing}
        toolbarStartClassName="min-w-[200px]"
        toolbarClassName="flex-wrap"
        toggleClassName="max-md:min-h-[44px] max-md:min-w-[44px]"
        activeCount={filterActiveCount}
        className={cn('mb-4', className)}
      >
        {filters}
      </FilterSection>
    );
  }

  return (
    <div className={cn('mb-4 flex flex-wrap items-center gap-3', className)}>
      <div className="min-w-[200px] flex-1">{searchField}</div>
      {trailing}
    </div>
  );
}
