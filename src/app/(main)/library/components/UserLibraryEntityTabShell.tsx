'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Plus, RefreshCw } from 'lucide-react';
import {
  ConfirmActionModal,
  ErrorDisplay,
  ListEmptyState,
  ListHeader,
  LoadingState,
  SearchInput,
  type ListColumn,
  type SortState,
} from '@/components/shared';
import { Button, IconButton } from '@/components/ui';
import type { LibraryEntityTabLabels } from './library-entity-tab.types';

export interface UserLibraryEntityTabShellProps {
  labels: LibraryEntityTabLabels;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  totalCount: number;
  emptyIcon: ReactNode;
  search: string;
  onSearchChange: (value: string) => void;
  sortState: SortState;
  onSort: (key: string) => void;
  headerColumns: ListColumn[];
  gridColumns: string;
  filteredCount: number;
  children: ReactNode;
  driftedCount: number;
  syncingAll: boolean;
  showSyncAllConfirm: boolean;
  onOpenSyncAllConfirm: () => void;
  onCloseSyncAllConfirm: () => void;
  onConfirmSyncAll: () => void;
  duplicateConfirm: { id: string; name: string } | null;
  onCloseDuplicate: () => void;
  onConfirmDuplicate: () => void;
  duplicatePending: boolean;
  listClassName?: string;
  /** Optional content after the list (e.g. RollLog). */
  afterList?: ReactNode;
}

/** Shared My Library toolbar + list chrome + sync/duplicate modals (ADR-0001). */
export function UserLibraryEntityTabShell({
  labels,
  isLoading,
  error,
  onRetry,
  totalCount,
  emptyIcon,
  search,
  onSearchChange,
  sortState,
  onSort,
  headerColumns,
  gridColumns,
  filteredCount,
  children,
  driftedCount,
  syncingAll,
  showSyncAllConfirm,
  onOpenSyncAllConfirm,
  onCloseSyncAllConfirm,
  onConfirmSyncAll,
  duplicateConfirm,
  onCloseDuplicate,
  onConfirmDuplicate,
  duplicatePending,
  listClassName = 'flex flex-col gap-1 mt-2',
  afterList,
}: UserLibraryEntityTabShellProps) {
  if (error) {
    return (
      <ErrorDisplay
        message={labels.loadErrorMessage}
        subMessage="Please try again later"
        onRetry={onRetry}
      />
    );
  }

  if (!isLoading && totalCount === 0) {
    return (
      <ListEmptyState
        icon={emptyIcon}
        title={labels.emptyTitle}
        message={labels.emptyMessage}
        action={
          <Button asChild>
            <Link href={labels.createHref}>
              <Plus className="w-4 h-4" />
              {labels.createLabel}
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={labels.searchPlaceholder}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenSyncAllConfirm}
          disabled={driftedCount === 0 || syncingAll}
        >
          <RefreshCw className={`w-4 h-4 ${syncingAll ? 'animate-spin' : ''}`} />
          Sync with current patch
          {driftedCount > 0 ? ` (${driftedCount})` : ''}
        </Button>
      </div>

      <ListHeader
        columns={headerColumns}
        gridColumns={gridColumns}
        sortState={sortState}
        onSort={onSort}
      />

      <div className={listClassName}>
        {isLoading ? (
          <LoadingState />
        ) : filteredCount === 0 ? (
          <ListEmptyState title={labels.searchEmptyTitle} size="sm" />
        ) : (
          children
        )}
      </div>

      {afterList}

      <ConfirmActionModal
        isOpen={!!duplicateConfirm}
        onClose={onCloseDuplicate}
        onConfirm={onConfirmDuplicate}
        title={labels.duplicateTitle}
        description={
          duplicateConfirm
            ? `Create a copy of "${duplicateConfirm.name}" in your library?`
            : ''
        }
        confirmLabel="Duplicate"
        loadingLabel="Duplicating..."
        isLoading={duplicatePending}
      />

      <ConfirmActionModal
        isOpen={showSyncAllConfirm}
        onClose={onCloseSyncAllConfirm}
        onConfirm={onConfirmSyncAll}
        title="Sync with current patch?"
        description={`Sync ${driftedCount} ${
          driftedCount === 1 ? labels.entitySingular : labels.entityPlural
        } to current patch rules. ${labels.syncAllRemovedRefsHint}`}
        confirmLabel="Sync all"
        loadingLabel="Syncing..."
        isLoading={syncingAll}
      />
    </div>
  );
}

/** Per-row sync IconButton shared by GridListRow / CreatureStatBlock. */
export function LibrarySyncRowAction({
  syncing,
  onSync,
}: {
  syncing: boolean;
  onSync: () => void;
}) {
  return (
    <IconButton
      variant="ghost"
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        onSync();
      }}
      label="Sync with current patch"
      className="text-warning-fg hover:opacity-80"
    >
      <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
    </IconButton>
  );
}
