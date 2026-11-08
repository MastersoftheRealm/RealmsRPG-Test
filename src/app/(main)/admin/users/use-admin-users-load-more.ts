'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  shouldCommitAdminUsersFetch,
  type AdminUsersListFetchContext,
} from './admin-users-list-paging';

export type AdminUsersLoadMoreRow = { id: string };

export type AdminUsersLoadMorePage<T extends AdminUsersLoadMoreRow> = {
  users: T[];
  limit?: number;
  hasMore?: boolean;
};

type UseAdminUsersLoadMoreParams<T extends AdminUsersLoadMoreRow> = {
  searchApplied: string;
  users: T[];
  setUsers: React.Dispatch<React.SetStateAction<T[]>>;
  setHasMore: React.Dispatch<React.SetStateAction<boolean>>;
  setMessage: React.Dispatch<
    React.SetStateAction<{ type: 'success' | 'error'; text: string } | null>
  >;
  fetchPage: (offset: number, q: string) => Promise<AdminUsersLoadMorePage<T>>;
};

export function useAdminUsersLoadMore<T extends AdminUsersLoadMoreRow>({
  searchApplied,
  users,
  setUsers,
  setHasMore,
  setMessage,
  fetchPage,
}: UseAdminUsersLoadMoreParams<T>) {
  const listGenerationRef = useRef(0);
  const usersLengthRef = useRef(users.length);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    usersLengthRef.current = users.length;
  }, [users.length]);

  useEffect(() => {
    listGenerationRef.current += 1;
  }, [searchApplied]);

  const loadMoreUsers = useCallback(async () => {
    const request: AdminUsersListFetchContext = {
      generation: listGenerationRef.current,
      q: searchApplied,
      offset: users.length,
    };
    setLoadingMore(true);
    setMessage(null);
    try {
      const page = await fetchPage(request.offset, request.q);
      let committed = false;
      setUsers((prev) => {
        if (
          !shouldCommitAdminUsersFetch(request, {
            generation: listGenerationRef.current,
            q: searchApplied,
            usersLength: prev.length,
          })
        ) {
          return prev;
        }
        committed = true;
        return [...prev, ...(page.users ?? [])];
      });
      if (!committed) return;
      setHasMore(Boolean(page.hasMore));
    } catch (err) {
      if (
        !shouldCommitAdminUsersFetch(request, {
          generation: listGenerationRef.current,
          q: searchApplied,
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
      setLoadingMore(false);
    }
  }, [fetchPage, searchApplied, setHasMore, setMessage, setUsers, users.length]);

  return { loadingMore, loadMoreUsers };
}
