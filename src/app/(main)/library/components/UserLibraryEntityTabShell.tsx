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
import type { LibraryEntityTabBasicLabels, LibraryEntityTabLabels } from './library-entity-tab.types';

type UserLibraryEntityTabShellBaseProps = {
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
  listClassName?: string;
  /** Optional content after the list (e.g. RollLog). */
  afterList?: ReactNode;
};

type UserLibraryEntityTabShellSyncProps = UserLibraryEntityTabShellBaseProps & {
  /** Full sync/duplicate chrome (default). */
  enableSync?: true;
  labels: LibraryEntityTabLabels;
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
};

type UserLibraryEntityTabShellBasicProps = UserLibraryEntityTabShellBaseProps & {
  /**
   * List chrome only (Enhanced tab): search / sort / empty / error / rows.
   * Omits sync-all toolbar **and** duplicate confirm modals (no patch-sync entity).
   */
  enableSync: false;
  labels: LibraryEntityTabBasicLabels;
};

export type UserLibraryEntityTabShellProps =
  | UserLibraryEntityTabShellSyncProps
  | UserLibraryEntityTabShellBasicProps;

function isSyncMode(
  props: UserLibraryEntityTabShellProps
): props is UserLibraryEntityTabShellSyncProps {
  return props.enableSync !== false;
}

/**
 * Shared My Library toolbar + list chrome (ADR-0001).
 * Default = sync + duplicate; `enableSync={false}` = list chrome only (no sync-all, no duplicate).
 */
export function UserLibraryEntityTabShell(props: UserLibraryEntityTabShellProps) {
  const {
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
    listClassName = 'flex flex-col gap-1 mt-2',
    afterList,
  } = props;
  const syncEnabled = isSyncMode(props);

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
      <div
        className={
          syncEnabled
            ? 'mb-4 flex flex-wrap items-center justify-between gap-2'
            : 'mb-4'
        }
      >
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={labels.searchPlaceholder}
        />
        {syncEnabled ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={props.onOpenSyncAllConfirm}
            disabled={props.driftedCount === 0 || props.syncingAll}
          >
            <RefreshCw className={`w-4 h-4 ${props.syncingAll ? 'animate-spin' : ''}`} />
            Sync with current patch
            {props.driftedCount > 0 ? ` (${props.driftedCount})` : ''}
          </Button>
        ) : null}
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

      {syncEnabled ? (
        <>
          <ConfirmActionModal
            isOpen={!!props.duplicateConfirm}
            onClose={props.onCloseDuplicate}
            onConfirm={props.onConfirmDuplicate}
            title={props.labels.duplicateTitle}
            description={
              props.duplicateConfirm
                ? `Create a copy of "${props.duplicateConfirm.name}" in your library?`
                : ''
            }
            confirmLabel="Duplicate"
            loadingLabel="Duplicating..."
            isLoading={props.duplicatePending}
          />

          <ConfirmActionModal
            isOpen={props.showSyncAllConfirm}
            onClose={props.onCloseSyncAllConfirm}
            onConfirm={props.onConfirmSyncAll}
            title="Sync with current patch?"
            description={`Sync ${props.driftedCount} ${
              props.driftedCount === 1
                ? props.labels.entitySingular
                : props.labels.entityPlural
            } to current patch rules. ${props.labels.syncAllRemovedRefsHint}`}
            confirmLabel="Sync all"
            loadingLabel="Syncing..."
            isLoading={props.syncingAll}
          />
        </>
      ) : null}
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
