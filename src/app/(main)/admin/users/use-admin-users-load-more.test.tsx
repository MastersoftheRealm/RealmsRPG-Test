/** @vitest-environment happy-dom */
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { useAdminUsersLoadMore } from './use-admin-users-load-more';

type Row = { id: string; label: string };

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function useHarness(
  searchApplied: string,
  listEpoch: number,
  fetchPage: (offset: number, q: string) => Promise<{ users: Row[]; hasMore: boolean }>,
  initialUsers: Row[] = [{ id: 'seed', label: 'seed' }],
) {
  const [users, setUsers] = useState<Row[]>(initialUsers);
  const [hasMore, setHasMore] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { loadingMore, loadMoreUsers } = useAdminUsersLoadMore({
    searchApplied,
    listEpoch,
    users,
    setUsers,
    setHasMore,
    setMessage,
    fetchPage,
  });
  return { users, setUsers, hasMore, setHasMore, message, loadingMore, loadMoreUsers };
}

describe('useAdminUsersLoadMore', () => {
  it('drops a stale load-more success after search changes while the request is in flight', async () => {
    const pending = deferred<{ users: Row[]; hasMore: boolean }>();
    const fetchPage = vi.fn(async (offset: number, q: string) => {
      if (offset === 1 && q === '') return pending.promise;
      return { users: [{ id: 'new-search', label: 'found' }], hasMore: false };
    });

    const { result, rerender } = renderHook(({ q, epoch }) => useHarness(q, epoch, fetchPage), {
      initialProps: { q: '', epoch: 0 },
    });

    let loadPromise: Promise<void> | undefined;
    await act(async () => {
      loadPromise = result.current.loadMoreUsers();
    });

    await act(async () => {
      rerender({ q: 'alice', epoch: 1 });
      result.current.setUsers([{ id: 'new-search', label: 'found' }]);
      result.current.setHasMore(false);
    });

    await act(async () => {
      pending.resolve({
        users: [{ id: 'stale-page', label: 'stale' }],
        hasMore: true,
      });
      await loadPromise;
    });

    await waitFor(() => expect(result.current.loadingMore).toBe(false));
    expect(result.current.users.map((u) => u.id)).toEqual(['new-search']);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.message).toBeNull();
  });

  it('allows a new search continuation while an older load-more is still pending', async () => {
    const pendingOld = deferred<{ users: Row[]; hasMore: boolean }>();
    const fetchPage = vi.fn(async (offset: number, q: string) => {
      if (offset === 1 && q === '') return pendingOld.promise;
      if (offset === 1 && q === 'alice') {
        return { users: [{ id: 'alice-2', label: 'page2' }], hasMore: false };
      }
      return { users: [], hasMore: false };
    });

    const { result, rerender } = renderHook(
      ({ q, epoch }) => useHarness(q, epoch, fetchPage, [{ id: 'a', label: 'a' }]),
      { initialProps: { q: '', epoch: 0 } },
    );

    let oldLoad: Promise<void> | undefined;
    await act(async () => {
      oldLoad = result.current.loadMoreUsers();
    });
    expect(result.current.loadingMore).toBe(true);

    await act(async () => {
      rerender({ q: 'alice', epoch: 1 });
      result.current.setUsers([{ id: 'alice-1', label: 'found' }]);
      result.current.setHasMore(true);
    });

    expect(result.current.loadingMore).toBe(false);

    await act(async () => {
      await result.current.loadMoreUsers();
    });
    await waitFor(() => expect(result.current.loadingMore).toBe(false));

    expect(result.current.users.map((u) => u.id)).toEqual(['alice-1', 'alice-2']);

    await act(async () => {
      pendingOld.resolve({ users: [{ id: 'stale', label: 'stale' }], hasMore: true });
      await oldLoad;
    });

    expect(result.current.users.map((u) => u.id)).toEqual(['alice-1', 'alice-2']);
    expect(result.current.hasMore).toBe(false);
  });

  it('ignores a stale load-more error after search changes', async () => {
    const pending = deferred<{ users: Row[]; hasMore: boolean }>();
    const fetchPage = vi.fn(async (offset: number, q: string) => {
      if (offset === 1 && q === '') return pending.promise;
      return { users: [], hasMore: false };
    });

    const { result, rerender } = renderHook(({ q, epoch }) => useHarness(q, epoch, fetchPage), {
      initialProps: { q: '', epoch: 0 },
    });

    let loadPromise: Promise<void> | undefined;
    await act(async () => {
      loadPromise = result.current.loadMoreUsers();
    });

    await act(async () => {
      rerender({ q: 'bob', epoch: 1 });
      result.current.setUsers([]);
    });

    await act(async () => {
      pending.reject(new Error('network down'));
      await loadPromise;
    });

    await waitFor(() => expect(result.current.loadingMore).toBe(false));
    expect(result.current.message).toBeNull();
  });
});
