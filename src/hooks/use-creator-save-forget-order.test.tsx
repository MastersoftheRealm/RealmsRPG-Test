/** @vitest-environment happy-dom */
import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCreatorSave } from './use-creator-save';

const libraryMocks = vi.hoisted(() => ({
  saveToLibrary: vi.fn(
    async (_type: string, _data: unknown, options?: { existingId?: string }) =>
      options?.existingId ?? 'new-id',
  ),
  findLibraryItemsByName: vi.fn(async () => [] as Array<{ id: string }>),
}));

vi.mock('@/components/ui', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/hooks/use-admin', () => ({
  useAdmin: () => ({ isAdmin: false }),
}));

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({ user: { uid: 'user-1' } }),
}));

vi.mock('@/services/library-service', () => ({
  saveToLibrary: libraryMocks.saveToLibrary,
  saveToOfficialLibrary: vi.fn(),
  findLibraryItemsByName: libraryMocks.findLibraryItemsByName,
  findOfficialLibraryItemByName: vi.fn(),
}));

describe('useCreatorSave forget loaded row', () => {
  const committedOrder: string[] = [];

  beforeEach(() => {
    libraryMocks.saveToLibrary.mockClear();
    libraryMocks.findLibraryItemsByName.mockClear();
    committedOrder.length = 0;
  });

  it('runs onSaveSuccess before onSaveCommitted so edit clears after the row is forgotten', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () =>
        useCreatorSave({
          type: 'creatures',
          getPayload: () => ({
            name: 'Goblin',
            data: { description: 'scrapper', powers: [{ id: 'p1' }] },
          }),
          editingId: 'creature-1',
          requirePublishConfirm: false,
          onSaveSuccess: () => committedOrder.push('success'),
          onSaveCommitted: () => committedOrder.push('committed'),
        }),
      { wrapper },
    );

    await act(async () => {
      await result.current.handleSave();
    });

    await waitFor(() => {
      expect(committedOrder).toEqual(['success', 'committed']);
    });
    expect(libraryMocks.saveToLibrary).toHaveBeenCalledWith(
      'creatures',
      expect.objectContaining({ description: 'scrapper' }),
      { existingId: 'creature-1' },
    );

    libraryMocks.findLibraryItemsByName.mockResolvedValueOnce([]);
    await act(async () => {
      await result.current.handleSave();
    });

    await waitFor(() => {
      expect(libraryMocks.saveToLibrary).toHaveBeenCalledTimes(2);
    });
    expect(libraryMocks.saveToLibrary).toHaveBeenLastCalledWith(
      'creatures',
      expect.objectContaining({ description: 'scrapper' }),
      undefined,
    );
  });
});
