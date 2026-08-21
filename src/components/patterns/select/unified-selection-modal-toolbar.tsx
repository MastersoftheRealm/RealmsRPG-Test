'use client';

import type { ReactNode } from 'react';
import { SearchInput } from '@/components/ui/search-input';
import { FilterSection } from '../filters/filter-section';

export interface UnifiedSelectionModalToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  hasOptions: boolean;
  optionsLabel: string;
  optionsExpanded: boolean;
  onOptionsExpandedChange: (expanded: boolean) => void;
  optionsActiveCount: number;
  optionsSummary?: ReactNode | undefined;
  scopeExtra?: ReactNode | undefined;
  headerExtra?: ReactNode | undefined;
  showFilters: boolean;
  filterContent?: ReactNode | undefined;
}

export function UnifiedSelectionModalToolbar({
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  hasOptions,
  optionsLabel,
  optionsExpanded,
  onOptionsExpandedChange,
  optionsActiveCount,
  optionsSummary,
  scopeExtra,
  headerExtra,
  showFilters,
  filterContent,
}: UnifiedSelectionModalToolbarProps) {
  const searchField = (
    <SearchInput
      value={searchQuery}
      onChange={onSearchChange}
      placeholder={searchPlaceholder}
      aria-label={searchPlaceholder}
    />
  );

  return (
    <div className="shrink-0">
      {hasOptions ? (
        <FilterSection
          label={optionsLabel}
          expanded={optionsExpanded}
          onExpandedChange={onOptionsExpandedChange}
          activeCount={optionsActiveCount}
          summary={optionsSummary}
          toolbarStart={searchField}
          belowToolbar={scopeExtra}
        >
          {headerExtra}
          {showFilters && filterContent ? filterContent : null}
        </FilterSection>
      ) : (
        <div className="space-y-2">
          {searchField}
          {scopeExtra ? <div className="shrink-0">{scopeExtra}</div> : null}
        </div>
      )}
    </div>
  );
}
