/**
 * ListSearchToolbar — full-span search row with optional trailing control (ADR-0011).
 *
 * Used by CodexBrowseListShell, UserLibraryEntityTabShell, OfficialEntityList.
 */

'use client';

import type { ReactNode } from 'react';
import { SearchInput } from '@/components/ui/search-input';
import { cn } from '@/lib/utils';

export interface ListSearchToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder: string;
  searchAriaLabel?: string;
  trailing?: ReactNode;
  className?: string;
}

export function ListSearchToolbar({
  search,
  onSearchChange,
  placeholder,
  searchAriaLabel,
  trailing,
  className,
}: ListSearchToolbarProps) {
  return (
    <div className={cn('mb-4 flex flex-wrap items-center gap-3', className)}>
      <div className="min-w-[200px] flex-1">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={placeholder}
          {...(searchAriaLabel ? { 'aria-label': searchAriaLabel } : {})}
        />
      </div>
      {trailing}
    </div>
  );
}
