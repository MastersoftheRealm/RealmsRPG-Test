/**
 * ListSearchToolbar — full-span search row with optional trailing control (ADR-0011).
 *
 * When `filters` is set, composes FilterSection `toolbarStart` so Search +
 * Filters share one row (guided/USM pattern). `trailing` is FilterSection
 * `toolbarEnd` (right of Filters) — it must not steal the Filters slot (TASK-721).
 *
 * Used by CodexBrowseListShell, UserLibraryEntityTabShell, OfficialEntityList,
 * and Legacy feat / equipment catalogs.
 */

'use client';

import type { ReactNode } from 'react';
import { SearchInput } from '@/components/ui/search-input';
import { cn } from '@/lib/utils';
import { FilterSection } from '../filters/filter-section';

export interface ListSearchToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder: string;
  searchAriaLabel?: string | undefined;
  trailing?: ReactNode | undefined;
  /**
   * Filter panel body only (no nested FilterSection). When set, Search + Filters
   * share one compact row.
   */
  filters?: ReactNode | undefined;
  /** Active-filter badge on the collapsed Filters toggle. */
  filterActiveCount?: number | undefined;
  className?: string | undefined;
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
        toolbarStart={searchField}
        toolbarEnd={trailing}
        toolbarStartClassName="min-w-[200px]"
        toolbarClassName="flex-wrap"
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
