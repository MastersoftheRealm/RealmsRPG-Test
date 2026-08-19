/**
 * CodexBrowseListShell — shared list chrome for Admin Codex + Codex browse.
 *
 * Owns SectionHeader (optional) → Search + Filters (same row) → ListHeader →
 * loading / empty / row children. Entity-specific rows and modals stay in each tab.
 *
 * Not for Official* library grids (`OfficialEntityList`) or Admin Archetypes
 * path rows (ADR-0005).
 */

'use client';

import { Children, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { SectionHeader } from '../chrome/section-header';
import { LoadingState, EmptyState } from '@/components/ui';
import { ListSearchToolbar } from './list-search-toolbar';
import {
  ListHeader,
  type ListColumn,
  type ListHeaderRowChrome,
  type SortState,
} from './list-header';
import type { EmptyStateProps } from '@/components/ui/empty-state';

export interface CodexBrowseListShellProps {
  /** When set, renders SectionHeader (admin tabs). Omit for Codex browse. */
  sectionTitle?: string | undefined;
  onAdd?: (() => void) | undefined;
  addLabel?: string | undefined;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  searchAriaLabel?: string | undefined;
  /** Optional control after Filters (e.g. admin Create). Does not replace the Filters slot. */
  searchTrailing?: ReactNode | undefined;
  /** Filter panel body only — ListSearchToolbar wraps FilterSection compact (TASK-721). */
  filters?: ReactNode | undefined;
  /** Active-filter badge on the collapsed Filters toggle. */
  filterActiveCount?: number | undefined;
  headerColumns: ListColumn[];
  gridColumns: string;
  sortState: SortState;
  onSort: (columnKey: string) => void;
  hasThumbnailColumn?: boolean | undefined;
  /** Reserve header space for GridListRow rightSlot / edit / delete chrome. */
  rowChrome?: ListHeaderRowChrome | undefined;
  isLoading?: boolean | undefined;
  loadingMessage?: string | undefined;
  isEmpty?: boolean | undefined;
  emptyTitle?: string | undefined;
  emptyMessage?: string | undefined;
  emptyIcon?: ReactNode | undefined;
  emptyAction?: EmptyStateProps['action'] | undefined;
  emptySize?: EmptyStateProps['size'] | undefined;
  children: ReactNode;
  className?: string | undefined;
}

/** Below this row count the list mounts every child, exactly as before. */
const VIRTUALIZE_ROW_THRESHOLD = 40;

/** Collapsed GridListRow height; `measureElement` corrects each row after mount. */
const ESTIMATED_ROW_HEIGHT = 56;

function listDocumentOffset(element: HTMLElement): number {
  return element.getBoundingClientRect().top + window.scrollY;
}

function VirtualizedRows({
  rows,
  layoutRootRef,
}: {
  rows: ReactNode[];
  layoutRootRef: RefObject<HTMLElement | null>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  useLayoutEffect(() => {
    const list = containerRef.current;
    if (!list) return;

    const update = () => setScrollMargin(listDocumentOffset(list));
    update();

    // Filters live in this shell above the rows. Observing the shell (not just the
    // list) is what catches expand/collapse — the list moves, it does not resize.
    const observer = new ResizeObserver(update);
    observer.observe(list);
    const layoutRoot = layoutRootRef.current;
    if (layoutRoot && layoutRoot !== list) observer.observe(layoutRoot);

    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [layoutRootRef, rows.length]);

  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 8,
    scrollMargin,
  });

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: virtualizer.getTotalSize() }}
    >
      {virtualizer.getVirtualItems().map((item) => (
        <div
          key={item.key}
          data-index={item.index}
          ref={virtualizer.measureElement}
          className="absolute top-0 left-0 w-full pb-1"
          style={{ transform: `translateY(${item.start - scrollMargin}px)` }}
        >
          {rows[item.index]}
        </div>
      ))}
    </div>
  );
}

function CodexBrowseRows({
  children,
  layoutRootRef,
}: {
  children: ReactNode;
  layoutRootRef: RefObject<HTMLElement | null>;
}) {
  const rows = Children.toArray(children);
  if (rows.length <= VIRTUALIZE_ROW_THRESHOLD) return <>{children}</>;
  return <VirtualizedRows rows={rows} layoutRootRef={layoutRootRef} />;
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
  filterActiveCount,
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
  const layoutRootRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={layoutRootRef} className={className}>
      {sectionTitle != null ? (
        <SectionHeader title={sectionTitle} onAdd={onAdd} addLabel={addLabel} size="md" />
      ) : null}

      <ListSearchToolbar
        search={search}
        onSearchChange={onSearchChange}
        placeholder={searchPlaceholder}
        searchAriaLabel={searchAriaLabel}
        trailing={searchTrailing}
        filters={filters}
        filterActiveCount={filterActiveCount}
        className={sectionTitle != null ? 'mt-2' : undefined}
      />

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
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            message={emptyMessage}
            action={emptyAction}
            size={emptySize}
          />
        ) : (
          <CodexBrowseRows layoutRootRef={layoutRootRef}>{children}</CodexBrowseRows>
        )}
      </div>
    </div>
  );
}
