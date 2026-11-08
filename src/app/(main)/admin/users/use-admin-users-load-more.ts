'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  shouldCommitAdminUsersFetch,
  type AdminUsersListFetchContext,
} from './admin-users-list-paging';

export type AdminUsersLoadMoreRow = { id: string };

export type AdminUsersLoadMorePage<T extends AdminUsersLoadMoreRow> = {
  users: T[];
  hasMore?: boolean;
};

type UseAdminUsersLoadMoreParams<T extends AdminUsersLoadMoreRow> = {
  searchApplied: string;
  /** Bumps when debounced search is applied so continuation busy state is per query. */
  listEpoch: number;
  users: T[];
  setUsers: React.Dispatch<React.SetStateAction<T[]>>;
  setHasMore: React.Dispatch<React.SetStateAction<boolean>>;
  setMessage: React.Dispatch<
    React.SetStateAction<{ type: 'success' | 'error'; text: string } | null>
  >;
  fetchPage: (offset: number, q: string) => Promise<AdminUsersLoadMorePage<T>>;
};

function continuationKey(epoch: number, q: string): string {
  return `${epoch}\u0000${q}`;
}

export function useAdminUsersLoadMore<T extends AdminUsersLoadMoreRow>({
  searchApplied,
  listEpoch,
  users,
  setUsers,
  setHasMore,
  setMessage,
  fetchPage,
}: UseAdminUsersLoadMoreParams<T>) {
  const listGenerationRef = useRef(listEpoch);
  const searchAppliedRef = useRef(searchApplied);
  const usersLengthRef = useRef(users.length);
  const [continuationBusyByKey, setContinuationBusyByKey] = useState<Record<string, boolean>>({});

  useEffect(() => {
    usersLengthRef.current = users.length;
  }, [users.length]);

  useEffect(() => {
    searchAppliedRef.current = searchApplied;
  }, [searchApplied]);

  useEffect(() => {
    listGenerationRef.current = listEpoch;
  }, [listEpoch]);

  const activeBusyKey = continuationKey(listEpoch, searchApplied);
  const loadingMore = Boolean(continuationBusyByKey[activeBusyKey]);

  const setBusyForRequest = useCallback((key: string, busy: boolean) => {
    setContinuationBusyByKey((prev) => {
      if (busy) {
        if (prev[key]) return prev;
        return { ...prev, [key]: true };
      }
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const loadMoreUsers = useCallback(async () => {
    const generation = listEpoch;
    const q = searchApplied;
    const offset = users.length;
    const request: AdminUsersListFetchContext = { generation, q, offset };
    const key = continuationKey(listEpoch, q);

    setBusyForRequest(key, true);
    setMessage(null);
    try {
      const page = await fetchPage(offset, q);
      const active = {
        generation: listGenerationRef.current,
        q: searchAppliedRef.current,
        usersLength: usersLengthRef.current,
      };
      if (!shouldCommitAdminUsersFetch(request, active)) return;
      if (usersLengthRef.current !== offset) return;

      setUsers((prev) => {
        if (prev.length !== offset) return prev;
        return [...prev, ...(page.users ?? [])];
      });
      setHasMore(Boolean(page.hasMore));
    } catch (err) {
      if (
        !shouldCommitAdminUsersFetch(request, {
          generation: listGenerationRef.current,
          q: searchAppliedRef.current,
          usersLength: usersLengthRef.current,
        })
      ) {
        return;
      }
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to load more users',
      });
    } finally {
      setBusyForRequest(key, false);
    }
  }, [
    fetchPage,
    listEpoch,
    searchApplied,
    setBusyForRequest,
    setHasMore,
    setMessage,
    setUsers,
    users.length,
  ]);

  return { loadingMore, loadMoreUsers };
}
