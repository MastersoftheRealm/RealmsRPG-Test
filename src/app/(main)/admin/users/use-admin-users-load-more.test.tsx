/** @vitest-environment happy-dom */
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { useAdminUsersLoadMore } from './use-admin-users-load-more';

type Row = { id: string; label: string };

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function useHarness(
  searchApplied: string,
  fetchPage: (offset: number, q: string) => Promise<{ users: Row[]; hasMore: boolean }>,
) {
  const [users, setUsers] = useState<Row[]>([{ id: 'seed', label: 'seed' }]);
  const [hasMore, setHasMore] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { loadingMore, loadMoreUsers } = useAdminUsersLoadMore({
    searchApplied,
    users,
    setUsers,
    setHasMore,
    setMessage,
    fetchPage,
  });
  return { users, setUsers, hasMore, setHasMore, message, loadingMore, loadMoreUsers };
}

describe('useAdminUsersLoadMore', () => {
  it('drops a stale load-more result after search changes while the request is in flight', async () => {
    const pending = deferred<{ users: Row[]; hasMore: boolean }>();
    const fetchPage = vi.fn(async (offset: number, q: string) => {
      if (offset === 1 && q === '') return pending.promise;
      return { users: [{ id: 'new-search', label: 'found' }], hasMore: false };
    });

    const { result, rerender } = renderHook(({ q }) => useHarness(q, fetchPage), {
      initialProps: { q: '' },
    });

    let loadPromise: Promise<void> | undefined;
    await act(async () => {
      loadPromise = result.current.loadMoreUsers();
    });

    await act(async () => {
      rerender({ q: 'alice' });
      result.current.setUsers([{ id: 'new-search', label: 'found' }]);
    });

    await act(async () => {
      pending.resolve({
        users: [{ id: 'stale-page', label: 'stale' }],
        hasMore: false,
      });
      await loadPromise;
    });

    await waitFor(() => expect(result.current.loadingMore).toBe(false));
    expect(result.current.users.map((u) => u.id)).toEqual(['new-search']);
    expect(result.current.message).toBeNull();
  });
});
