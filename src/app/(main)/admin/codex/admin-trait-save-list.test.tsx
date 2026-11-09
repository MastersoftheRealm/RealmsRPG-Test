/** @vitest-environment happy-dom */
import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { adminCodexCollectionQueryKey } from '@/hooks/use-codex';
import { traitFormToAdminListPatch } from './admin-trait-form';
import { useAdminCodexEntity } from './use-admin-codex-entity';

const { mockUpdateCodexDoc } = vi.hoisted(() => ({
  mockUpdateCodexDoc: vi.fn(),
}));

vi.mock('./actions', () => ({
  createCodexDoc: vi.fn(),
  updateCodexDoc: mockUpdateCodexDoc,
}));

vi.mock('./use-admin-codex-delete', () => ({
  useAdminCodexDelete: () => ({
    askDelete: vi.fn(),
    state: {},
  }),
  AdminCodexDeleteModals: () => null,
}));

vi.mock('@/components/ui', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

describe('admin trait save list refresh', () => {
  beforeEach(() => {
    mockUpdateCodexDoc.mockReset();
  });

  it('reapplies the saved trait onto the admin list after refreshCodex returns stale CDN data', async () => {
    mockUpdateCodexDoc.mockResolvedValue({
      success: true,
      updatedAt: '2026-11-09T16:00:00Z',
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const adminTraitsKey = adminCodexCollectionQueryKey('traits');
    queryClient.setQueryData(adminTraitsKey, [
      {
        id: '3',
        name: 'Adorable',
        description: 'dont',
        updated_at: '2026-10-26T12:00:00Z',
      },
    ]);

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const refetchSpy = vi.spyOn(queryClient, 'refetchQueries').mockImplementation(async () => {
      queryClient.setQueryData(adminTraitsKey, [
        {
          id: '3',
          name: 'Adorable',
          description: 'dont',
          updated_at: '2026-10-26T12:00:00Z',
        },
      ]);
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () =>
        useAdminCodexEntity<{ id: string; name: string; updated_at?: string | undefined }>({
          collection: 'codex_traits',
          entityLabel: 'trait',
        }),
      { wrapper },
    );

    act(() => {
      result.current.openEdit(
        { id: '3', name: 'Adorable', updated_at: '2026-10-26T12:00:00Z' },
        () => undefined,
      );
    });

    const form = {
      name: 'Adorable',
      description: "don't",
      uses_per_rec: '',
      rec_period: '',
      flaw: false,
      characteristic: false,
      option_trait_ids: [],
      sources: ['core'],
    };

    await act(async () => {
      const ok = await result.current.save({
        payload: {
          name: 'Adorable',
          description: "don't",
          sources: ['core'],
        },
        expectedUpdatedAt: '2026-10-26T12:00:00Z',
        savedListPatch: traitFormToAdminListPatch('3', form),
      });
      expect(ok).toBe(true);
    });

    expect(mockUpdateCodexDoc).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalled();
    expect(refetchSpy).toHaveBeenCalled();

    expect(queryClient.getQueryData(adminTraitsKey)).toEqual([
      {
        id: '3',
        name: 'Adorable',
        description: "don't",
        uses_per_rec: undefined,
        rec_period: undefined,
        flaw: false,
        characteristic: false,
        option_trait_ids: [],
        sources: ['core'],
        updated_at: '2026-11-09T16:00:00Z',
      },
    ]);
  });
});
