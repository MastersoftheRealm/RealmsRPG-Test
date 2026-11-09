/** @vitest-environment happy-dom */
import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LibraryTabCounts } from '@/lib/library/library-tab-counts';
import type { LibraryItemType } from '@/types/library';
import * as userLibraryHooks from './use-user-library';
import {
  useDeletePower,
  useDuplicatePower,
  userLibraryAfterMutationKeys,
} from './use-user-library';
import { useCreatorSave } from './use-creator-save';
import { useAddOfficialToLibrary } from './use-official-library';

const libraryMocks = vi.hoisted(() => {
  const uid = 'user-1';
  const saveToLibrary = vi.fn(
    async (_type: string, _data: unknown, options?: { existingId?: string }) =>
      options?.existingId ?? 'pow-1',
  );
  const findLibraryItemsByName = vi.fn(async () => [] as Array<{ id: string }>);
  const addOfficialItemToLibrary = vi.fn(async () => undefined);
  const apiFetch = vi.fn(async (_url: string, init?: { method?: string }) => {
    if (init?.method === 'DELETE') return;
    if (init?.method === 'POST') return { id: 'pow-copy' };
    return [];
  });
  return { uid, saveToLibrary, findLibraryItemsByName, addOfficialItemToLibrary, apiFetch };
});
const { uid, saveToLibrary, findLibraryItemsByName, addOfficialItemToLibrary, apiFetch } =
  libraryMocks;

vi.mock('@/components/ui', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/hooks/use-admin', () => ({
  useAdmin: () => ({ isAdmin: false }),
}));

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({ user: { uid: libraryMocks.uid } }),
}));

vi.mock('@/services/library-service', () => ({
  saveToLibrary: libraryMocks.saveToLibrary,
  saveToOfficialLibrary: vi.fn(),
  findLibraryItemsByName: libraryMocks.findLibraryItemsByName,
  findOfficialLibraryItemByName: vi.fn(),
  addOfficialItemToLibrary: libraryMocks.addOfficialItemToLibrary,
}));

vi.mock('@/lib/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api-client')>();
  return {
    ...actual,
    apiFetch: libraryMocks.apiFetch,
  };
});

const OLD_LIST = [{ id: 'pow-1', name: 'Arc Spark' }];
const RENAMED_LIST = [{ id: 'pow-1', name: 'Renamed Spark' }];
const OLD_COUNTS: LibraryTabCounts = {
  powers: 1,
  techniques: 0,
  empoweredTechniques: 0,
  weapons: 0,
  armor: 0,
  shields: 0,
  creatures: 0,
  enhanced: 0,
};
const NEW_COUNTS: LibraryTabCounts = { ...OLD_COUNTS, powers: 1 };

function listKey(userId: string) {
  return ['user-powers', userId] as const;
}

function countsKey(userId: string) {
  return ['user-library-counts', userId] as const;
}

async function seedUserLibraryQueries(
  queryClient: QueryClient,
  userId: string,
  list: typeof OLD_LIST,
  counts: LibraryTabCounts,
) {
  const listQueryKey = listKey(userId);
  const countsQueryKey = countsKey(userId);
  await queryClient.fetchQuery({
    queryKey: listQueryKey,
    queryFn: async () => list,
  });
  await queryClient.fetchQuery({
    queryKey: countsQueryKey,
    queryFn: async () => counts,
  });
  queryClient.setQueryData(listQueryKey, OLD_LIST);
  queryClient.setQueryData(countsQueryKey, OLD_COUNTS);
}

function expectInvalidatedThroughHelper(
  helperSpy: ReturnType<typeof vi.spyOn>,
  invalidateQueriesSpy: ReturnType<typeof vi.spyOn>,
  queryClient: QueryClient,
  type: LibraryItemType,
  userId: string,
) {
  expect(helperSpy).toHaveBeenCalledWith(queryClient, type, userId);
  for (const queryKey of userLibraryAfterMutationKeys(type, userId)) {
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey, refetchType: 'all' });
  }
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('My Library cache after mutations (MISC1-011)', () => {
  let queryClient: QueryClient;
  let helperSpy: ReturnType<typeof vi.spyOn>;
  let invalidateQueriesSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    saveToLibrary.mockClear();
    findLibraryItemsByName.mockClear();
    addOfficialItemToLibrary.mockClear();
    apiFetch.mockClear();
    helperSpy = vi.spyOn(userLibraryHooks, 'invalidateUserLibraryAfterMutation');
    invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
    await seedUserLibraryQueries(queryClient, uid, RENAMED_LIST, NEW_COUNTS);
  });

  it('useCreatorSave private update (rename) refetches the list name', async () => {
    const { result } = renderHook(
      () =>
        useCreatorSave({
          type: 'powers',
          getPayload: () => ({ name: 'Renamed Spark', data: { description: 'spark' } }),
          editingId: 'pow-1',
          requirePublishConfirm: false,
        }),
      { wrapper: createWrapper(queryClient) },
    );

    await act(async () => {
      await result.current.handleSave();
    });

    await waitFor(() => {
      expect(queryClient.getQueryData(listKey(uid))).toEqual(RENAMED_LIST);
    });
    expectInvalidatedThroughHelper(helperSpy, invalidateQueriesSpy, queryClient, 'powers', uid);
    expect(queryClient.getQueryData(countsKey(uid))).toEqual(NEW_COUNTS);
    expect(saveToLibrary).toHaveBeenCalledWith(
      'powers',
      expect.objectContaining({ description: 'spark' }),
      { existingId: 'pow-1' },
    );
  });

  it('useAddOfficialToLibrary refetches the list name', async () => {
    const { result } = renderHook(() => useAddOfficialToLibrary('powers'), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: 'official-bolt',
        name: 'Bolt',
        description: '',
      } as Parameters<typeof result.current.mutateAsync>[0]);
    });

    await waitFor(() => {
      expect(queryClient.getQueryData(listKey(uid))).toEqual(RENAMED_LIST);
    });
    expectInvalidatedThroughHelper(helperSpy, invalidateQueriesSpy, queryClient, 'powers', uid);
    expect(queryClient.getQueryData(countsKey(uid))).toEqual(NEW_COUNTS);
  });

  it('useDeletePower refetches the list', async () => {
    const afterDelete: typeof OLD_LIST = [];
    await seedUserLibraryQueries(queryClient, uid, afterDelete, { ...OLD_COUNTS, powers: 0 });

    const { result } = renderHook(() => useDeletePower(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync('pow-1');
    });

    await waitFor(() => {
      expect(queryClient.getQueryData(listKey(uid))).toEqual([]);
    });
    expectInvalidatedThroughHelper(helperSpy, invalidateQueriesSpy, queryClient, 'powers', uid);
    expect(queryClient.getQueryData(countsKey(uid))).toEqual({ ...OLD_COUNTS, powers: 0 });
  });

  it('useDuplicatePower refetches the list', async () => {
    const afterDuplicate = [
      { id: 'pow-1', name: 'Arc Spark' },
      { id: 'pow-copy', name: 'Arc Spark copy' },
    ];
    await seedUserLibraryQueries(queryClient, uid, afterDuplicate, { ...OLD_COUNTS, powers: 2 });

    const { result } = renderHook(() => useDuplicatePower(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync('pow-1');
    });

    await waitFor(() => {
      expect(queryClient.getQueryData(listKey(uid))).toEqual(afterDuplicate);
    });
    expectInvalidatedThroughHelper(helperSpy, invalidateQueriesSpy, queryClient, 'powers', uid);
    expect(queryClient.getQueryData(countsKey(uid))).toEqual({ ...OLD_COUNTS, powers: 2 });
  });
});
