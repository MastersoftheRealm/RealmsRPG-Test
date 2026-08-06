/**
 * CodexBrowseListShell — shared list chrome for Admin Codex + Codex browse.
 *
 * Owns SectionHeader (optional) → Search → filters slot → ListHeader →
 * loading / empty / row children. Entity-specific rows and modals stay in each tab.
 *
 * Not for Official* library grids (`OfficialEntityList`) or Admin Archetypes
 * path rows (ADR-0005).
 */

'use client';

import type { ReactNode } from 'react';
import { SectionHeader } from './section-header';
import { LoadingState, EmptyState as ListEmptyState } from './list-components';
import { ListSearchToolbar } from './list-search-toolbar';
import { ListHeader, type ListColumn, type ListHeaderRowChrome, type SortState } from './list-header';
import type { EmptyStateProps } from '@/components/ui/empty-state';

export interface CodexBrowseListShellProps {
  /** When set, renders SectionHeader (admin tabs). Omit for Codex browse. */
  sectionTitle?: string;
  onAdd?: () => void;
  addLabel?: string;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  searchAriaLabel?: string;
  /** Optional control beside search (e.g. admin Create). */
  searchTrailing?: ReactNode;
  /** Slot between search and ListHeader (FilterSection, banners, etc.). */
  filters?: ReactNode;
  headerColumns: ListColumn[];
  gridColumns: string;
  sortState: SortState;
  onSort: (columnKey: string) => void;
  hasThumbnailColumn?: boolean;
  /** Reserve header space for GridListRow rightSlot / edit / delete chrome. */
  rowChrome?: ListHeaderRowChrome;
  isLoading?: boolean;
  loadingMessage?: string;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  emptyAction?: EmptyStateProps['action'];
  emptySize?: EmptyStateProps['size'];
  children: ReactNode;
  className?: string;
}

export function CodexBrowseListShell({
  sectionTitle,
  onAdd,
  addLabel,
  search,
  onSearchChange,
  searchPlaceholder,
  searchAriaLabel,
  searchTrailing,
  filters,
  headerColumns,
  gridColumns,
  sortState,
  onSort,
  hasThumbnailColumn,
  rowChrome,
  isLoading = false,
  loadingMessage,
  isEmpty = false,
  emptyTitle = 'No results match your filters.',
  emptyMessage,
  emptyIcon,
  emptyAction,
  emptySize = 'sm',
  children,
  className,
}: CodexBrowseListShellProps) {
  return (
    <div className={className}>
      {sectionTitle != null ? (
        <SectionHeader
          title={sectionTitle}
          onAdd={onAdd}
          addLabel={addLabel}
          size="md"
        />
      ) : null}

      <ListSearchToolbar
        search={search}
        onSearchChange={onSearchChange}
        placeholder={searchPlaceholder}
        searchAriaLabel={searchAriaLabel}
        trailing={searchTrailing}
        className={sectionTitle != null ? 'mt-2' : undefined}
      />

      {filters}

      <ListHeader
        columns={headerColumns}
        gridColumns={gridColumns}
        sortState={sortState}
        onSort={onSort}
        hasThumbnailColumn={hasThumbnailColumn}
        rowChrome={rowChrome}
      />

      <div className="mt-2 flex flex-col gap-1">
        {isLoading ? (
          <LoadingState message={loadingMessage} />
        ) : isEmpty ? (
          <ListEmptyState
            icon={emptyIcon}
            title={emptyTitle}
            message={emptyMessage}
            action={emptyAction}
            size={emptySize}
          />
        ) : (
          children
        )}
      </div>
    </div>
  );
}
