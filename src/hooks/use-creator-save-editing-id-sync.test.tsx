/** @vitest-environment happy-dom */
import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CreatorSaveTarget } from '@/lib/library/catalog-listing';
import { useCreatorSave } from './use-creator-save';

const libraryMocks = vi.hoisted(() => ({
  saveToLibrary: vi.fn(
    async (_type: string, _data: unknown, options?: { existingId?: string }) =>
      options?.existingId ?? 'new-id',
  ),
  saveToOfficialLibrary: vi.fn(async () => undefined),
  findLibraryItemsByName: vi.fn(async () => [] as Array<{ id: string }>),
  findOfficialLibraryItemByName: vi.fn(async () => null),
}));

vi.mock('@/components/ui', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/hooks/use-admin', () => ({
  useAdmin: () => ({ isAdmin: true }),
}));

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({ user: { uid: 'user-1' } }),
}));

vi.mock('@/services/library-service', () => ({
  saveToLibrary: libraryMocks.saveToLibrary,
  saveToOfficialLibrary: libraryMocks.saveToOfficialLibrary,
  findLibraryItemsByName: libraryMocks.findLibraryItemsByName,
  findOfficialLibraryItemByName: libraryMocks.findOfficialLibraryItemByName,
}));

type HookProps = {
  editingId: string | null;
  initialSaveTarget: CreatorSaveTarget;
  name: string;
};

const partialPayload = {
  description: 'desc',
  parts: [{ id: 1, name: 'part' }],
};

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useCreatorSave editingId sync', () => {
  beforeEach(() => {
    libraryMocks.saveToLibrary.mockClear();
    libraryMocks.saveToOfficialLibrary.mockClear();
    libraryMocks.findLibraryItemsByName.mockClear();
    libraryMocks.findOfficialLibraryItemByName.mockClear();
  });

  it('stops targeting a row after editingId changes from X to null (private save)', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result, rerender } = renderHook(
      (props: HookProps) =>
        useCreatorSave({
          type: 'creatures',
          editingId: props.editingId,
          initialSaveTarget: props.initialSaveTarget,
          getPayload: () => ({ name: props.name, data: { ...partialPayload, description: 'x' } }),
          requirePublishConfirm: false,
        }),
      {
        wrapper: createWrapper(queryClient),
        initialProps: {
          editingId: 'creature-x',
          initialSaveTarget: 'private',
          name: 'Goblin',
        },
      },
    );

    await act(async () => {
      await result.current.handleSave();
    });
    expect(libraryMocks.saveToLibrary).toHaveBeenLastCalledWith('creatures', expect.anything(), {
      existingId: 'creature-x',
    });

    rerender({
      editingId: null,
      initialSaveTarget: 'private',
      name: 'Fresh goblin',
    });

    libraryMocks.findLibraryItemsByName.mockResolvedValueOnce([]);
    await act(async () => {
      await result.current.handleSave();
    });

    await waitFor(() => {
      expect(libraryMocks.saveToLibrary).toHaveBeenCalledTimes(2);
    });
    expect(libraryMocks.saveToLibrary).toHaveBeenLastCalledWith(
      'creatures',
      expect.objectContaining({ description: 'x' }),
      undefined,
    );
  });

  it('does not reuse official row A after publish when starting a new public item', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result, rerender } = renderHook(
      (props: HookProps) =>
        useCreatorSave({
          type: 'techniques',
          editingId: props.editingId,
          initialSaveTarget: props.initialSaveTarget,
          getPayload: () => ({ name: props.name, data: partialPayload }),
          requirePublishConfirm: false,
          onSaveSuccess: () => {},
        }),
      {
        wrapper: createWrapper(queryClient),
        initialProps: {
          editingId: 'official-a',
          initialSaveTarget: 'public',
          name: 'Technique A',
        },
      },
    );

    await act(async () => {
      await result.current.handleSave();
    });
    expect(libraryMocks.saveToOfficialLibrary).toHaveBeenLastCalledWith(
      'techniques',
      expect.objectContaining({ description: 'desc' }),
      expect.objectContaining({ existingId: 'official-a' }),
    );

    rerender({
      editingId: null,
      initialSaveTarget: 'public',
      name: 'Technique B',
    });

    libraryMocks.findOfficialLibraryItemByName.mockResolvedValueOnce(null);
    await act(async () => {
      await result.current.handleSave();
    });

    await waitFor(() => {
      expect(libraryMocks.saveToOfficialLibrary).toHaveBeenCalledTimes(2);
    });
    const secondCall = libraryMocks.saveToOfficialLibrary.mock.calls[1] as unknown as
      | [string, Record<string, unknown>, { existingId?: string }?]
      | undefined;
    const secondOpts = secondCall?.[2];
    expect(secondOpts?.existingId).toBeUndefined();
  });
});
