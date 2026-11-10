'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  adminUsersDirectoryReducer,
  adminUsersOwnerKey,
  type AdminUsersDirectorySlice,
  type AdminUsersListFetchContext,
} from './admin-users-directory-state';

export type AdminUsersLoadMoreRow = { id: string };

export type AdminUsersLoadMorePage<T extends AdminUsersLoadMoreRow> = {
  users: T[];
  hasMore?: boolean;
};

type UseAdminUsersLoadMoreParams<T extends AdminUsersLoadMoreRow> = {
  directory: AdminUsersDirectorySlice<T>;
  setDirectory: React.Dispatch<React.SetStateAction<AdminUsersDirectorySlice<T>>>;
  fetchPage: (offset: number, q: string) => Promise<AdminUsersLoadMorePage<T>>;
};

export function useAdminUsersLoadMore<T extends AdminUsersLoadMoreRow>({
  directory,
  setDirectory,
  fetchPage,
}: UseAdminUsersLoadMoreParams<T>) {
  const directoryRef = useRef(directory);
  const continuationAbortRef = useRef<AbortController | null>(null);
  const ownerKey = adminUsersOwnerKey(directory.owner);

  useEffect(() => {
    directoryRef.current = directory;
  });

  useEffect(() => {
    continuationAbortRef.current?.abort();
    continuationAbortRef.current = null;
  }, [ownerKey]);

  useEffect(() => {
    return () => continuationAbortRef.current?.abort();
  }, []);

  const loadingMore = directory.continuationBusy;

  const loadMoreUsers = useCallback(async () => {
    const slice = directoryRef.current;
    if (!slice.hasMore || slice.continuationBusy) return;

    const request: AdminUsersListFetchContext = {
      generation: slice.owner.generation,
      q: slice.owner.q,
      offset: slice.users.length,
    };

    continuationAbortRef.current?.abort();
    const controller = new AbortController();
    continuationAbortRef.current = controller;

    setDirectory((prev) => adminUsersDirectoryReducer(prev, { type: 'continuation_begin' }));

    try {
      const page = await fetchPage(request.offset, request.q);
      if (controller.signal.aborted) return;

      setDirectory((prev) =>
        adminUsersDirectoryReducer(prev, {
          type: 'continuation_success',
          request,
          users: page.users ?? [],
          hasMore: Boolean(page.hasMore),
        }),
      );
    } catch (err) {
      if (controller.signal.aborted) return;
      const message = err instanceof Error ? err.message : 'Failed to load more users';
      setDirectory((prev) =>
        adminUsersDirectoryReducer(prev, {
          type: 'continuation_failure',
          request,
          error: message,
        }),
      );
    } finally {
      if (controller.signal.aborted) return;
      setDirectory((prev) =>
        adminUsersDirectoryReducer(prev, { type: 'continuation_settle', request }),
      );
    }
  }, [fetchPage, setDirectory]);

  return { loadingMore, loadMoreUsers };
}
