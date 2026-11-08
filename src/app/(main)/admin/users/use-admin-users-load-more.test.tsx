/** @vitest-environment happy-dom */
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { flushSync } from 'react-dom';
import { useState } from 'react';
import type { AdminUsersDirectorySlice } from './admin-users-directory-state';
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
  fetchPage: (offset: number, q: string) => Promise<{ users: Row[]; hasMore: boolean }>,
  initial: AdminUsersDirectorySlice<Row>,
) {
  const [directory, setDirectory] = useState(initial);
  const { loadingMore, loadMoreUsers } = useAdminUsersLoadMore({
    directory,
    setDirectory,
    fetchPage,
  });
  return { directory, setDirectory, loadingMore, loadMoreUsers };
}

describe('useAdminUsersLoadMore', () => {
  it('drops a stale load-more success after search changes while the request is in flight', async () => {
    const pending = deferred<{ users: Row[]; hasMore: boolean }>();
    const fetchPage = vi.fn(async (offset: number, q: string) => {
      if (offset === 1 && q === '') return pending.promise;
      return { users: [{ id: 'new-search', label: 'found' }], hasMore: false };
    });

    const { result, rerender } = renderHook(({ initial }) => useHarness(fetchPage, initial), {
      initialProps: {
        initial: {
          owner: { generation: 0, q: '' },
          users: [{ id: 'seed', label: 'seed' }],
          hasMore: true,
          continuationError: null,
        },
      },
    });

    let loadPromise: Promise<void> | undefined;
    await act(async () => {
      loadPromise = result.current.loadMoreUsers();
    });

    const afterSearch = {
      owner: { generation: 1, q: 'alice' },
      users: [{ id: 'new-search', label: 'found' }],
      hasMore: false,
      continuationError: null,
    };
    await act(async () => {
      rerender({ initial: afterSearch });
      result.current.setDirectory(afterSearch);
    });

    await act(async () => {
      pending.resolve({
        users: [{ id: 'stale-page', label: 'stale' }],
        hasMore: true,
      });
      await loadPromise;
    });

    await waitFor(() => expect(result.current.loadingMore).toBe(false));
    expect(result.current.directory.users.map((u) => u.id)).toEqual(['new-search']);
    expect(result.current.directory.hasMore).toBe(false);
    expect(result.current.directory.continuationError).toBeNull();
  });

  it('rejects stale continuation when generation changes but list length stays equal', async () => {
    const pending = deferred<{ users: Row[]; hasMore: boolean }>();
    const fetchPage = vi.fn(async () => pending.promise);

    const { result, rerender } = renderHook(({ initial }) => useHarness(fetchPage, initial), {
      initialProps: {
        initial: {
          owner: { generation: 2, q: 'x' },
          users: [{ id: 'only', label: 'one' }],
          hasMore: true,
          continuationError: null,
        },
      },
    });

    let loadPromise: Promise<void> | undefined;
    await act(async () => {
      loadPromise = result.current.loadMoreUsers();
    });

    const cached = {
      owner: { generation: 3, q: 'x' },
      users: [{ id: 'cached', label: 'cached' }],
      hasMore: false,
      continuationError: null,
    };
    await act(async () => {
      rerender({ initial: cached });
      result.current.setDirectory(cached);
    });

    await act(async () => {
      pending.resolve({ users: [{ id: 'stale', label: 'stale' }], hasMore: true });
      await loadPromise;
    });

    expect(result.current.directory.users.map((u) => u.id)).toEqual(['cached']);
    expect(result.current.directory.hasMore).toBe(false);
  });

  it('does not show busy for the new owner when only the previous owner had a pending continuation', async () => {
    const pendingOld = deferred<{ users: Row[]; hasMore: boolean }>();
    const fetchPage = vi.fn(async (offset: number, q: string) => {
      if (offset === 1 && q === '') return pendingOld.promise;
      return { users: [], hasMore: false };
    });

    const { result } = renderHook(() =>
      useHarness(fetchPage, {
        owner: { generation: 0, q: '' },
        users: [{ id: 'a', label: 'a' }],
        hasMore: true,
        continuationError: null,
      }),
    );

    await act(async () => {
      void result.current.loadMoreUsers();
    });
    expect(result.current.loadingMore).toBe(true);

    await act(async () => {
      flushSync(() => {
        result.current.setDirectory({
          owner: { generation: 1, q: 'alice' },
          users: [{ id: 'alice-1', label: 'found' }],
          hasMore: true,
          continuationError: null,
        });
      });
    });
    expect(result.current.loadingMore).toBe(false);

    await act(async () => {
      pendingOld.resolve({ users: [{ id: 'stale', label: 'stale' }], hasMore: true });
    });
    expect(result.current.directory.users.map((u) => u.id)).toEqual(['alice-1']);
  });
});
