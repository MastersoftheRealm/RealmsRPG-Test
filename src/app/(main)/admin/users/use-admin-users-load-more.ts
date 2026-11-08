'use client';

import { useCallback, useState } from 'react';
import {
  adminUsersOwnerKey,
  nextContinuationBusyMap,
  tryApplyContinuationResult,
  type AdminUsersDirectorySlice,
} from './admin-users-directory-state';
import type { AdminUsersListFetchContext } from './admin-users-directory-state';

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
  const [continuationBusyByKey, setContinuationBusyByKey] = useState<Record<string, boolean>>({});

  const activeBusyKey = adminUsersOwnerKey(directory.owner);
  const loadingMore = Boolean(continuationBusyByKey[activeBusyKey]);

  const setBusyForRequest = useCallback((key: string, busy: boolean) => {
    setContinuationBusyByKey((prev) => nextContinuationBusyMap(prev, key, busy));
  }, []);

  const loadMoreUsers = useCallback(async () => {
    let request: AdminUsersListFetchContext | undefined;
    let busyKey: string | undefined;

    setDirectory((prev) => {
      busyKey = adminUsersOwnerKey(prev.owner);
      request = {
        generation: prev.owner.generation,
        q: prev.owner.q,
        offset: prev.users.length,
      };
      return { ...prev, continuationError: null };
    });

    if (!request || !busyKey) return;

    setBusyForRequest(busyKey, true);
    try {
      const page = await fetchPage(request.offset, request.q);
      setDirectory((prev) =>
        tryApplyContinuationResult(prev, request!, {
          ok: true,
          users: page.users ?? [],
          hasMore: Boolean(page.hasMore),
        }),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load more users';
      setDirectory((prev) =>
        tryApplyContinuationResult(prev, request!, { ok: false, error: message }),
      );
    } finally {
      setBusyForRequest(busyKey, false);
    }
  }, [fetchPage, setBusyForRequest, setDirectory]);

  return { loadingMore, loadMoreUsers };
}
