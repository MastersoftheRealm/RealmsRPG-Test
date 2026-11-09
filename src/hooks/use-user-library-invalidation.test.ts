import { describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import {
  invalidateUserLibraryAfterMutation,
  userLibraryAfterMutationKeys,
} from './use-user-library';

describe('invalidateUserLibraryAfterMutation (MISC1-011)', () => {
  it('uses the same query keys as delete and duplicate', () => {
    expect(userLibraryAfterMutationKeys('powers', 'user-1')).toEqual([
      ['user-powers', 'user-1'],
      ['user-library-counts', 'user-1'],
    ]);
  });

  it('marks the user list stale after rename save invalidation', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const userId = 'user-1';
    const listKey = ['user-powers', userId] as const;
    const countsKey = ['user-library-counts', userId] as const;
    queryClient.setQueryData(listKey, [{ id: 'pow-1', name: 'Arc Spark' }]);
    queryClient.setQueryData(countsKey, {
      powers: 1,
      techniques: 0,
      items: 0,
      creatures: 0,
      species: 0,
      empoweredTechniques: 0,
      enhanced: 0,
    });

    const refetchList = vi.fn().mockResolvedValue(undefined);
    queryClient.getQueryCache().find({ queryKey: listKey })!.fetch = refetchList;

    await invalidateUserLibraryAfterMutation(queryClient, 'powers', userId);

    expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(countsKey)?.isInvalidated).toBe(true);
    expect(refetchList).toHaveBeenCalled();
  });

  it('leaves the cached list untouched when only an unrelated user scope is invalidated', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const listKey = ['user-powers', 'user-a'] as const;
    queryClient.setQueryData(listKey, [{ id: 'pow-1', name: 'Before rename' }]);

    await invalidateUserLibraryAfterMutation(queryClient, 'powers', 'user-b');

    expect(queryClient.getQueryState(listKey)?.isInvalidated).not.toBe(true);
    expect(queryClient.getQueryData(listKey)).toEqual([{ id: 'pow-1', name: 'Before rename' }]);
  });
});
