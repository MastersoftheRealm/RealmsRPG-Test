/** @vitest-environment happy-dom */
import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCreatorSave } from './use-creator-save';

const libraryMocks = vi.hoisted(() => ({
  saveToLibrary: vi.fn(async () => 'species-1'),
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

describe('useCreatorSave species hollow guard', () => {
  beforeEach(() => {
    libraryMocks.saveToLibrary.mockClear();
    libraryMocks.findLibraryItemsByName.mockClear();
  });

  it('allows updating an existing species with an empty description', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () =>
        useCreatorSave({
          type: 'species',
          getPayload: () => ({ name: 'Elf', data: { description: '' } }),
          editingId: 'species-1',
          requirePublishConfirm: false,
        }),
      { wrapper },
    );

    await act(async () => {
      await result.current.handleSave();
    });

    await waitFor(() => {
      expect(libraryMocks.saveToLibrary).toHaveBeenCalled();
    });
    expect(result.current.showEmptyOverwriteConfirm).toBe(false);
  });
});
