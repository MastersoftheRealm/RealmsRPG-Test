import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useGameRules } from './use-game-rules';
import { adminCodexCollectionQueryKey, codexKeys } from './use-codex';

const { mockFetchCodexCollection } = vi.hoisted(() => ({
  mockFetchCodexCollection: vi.fn(async () => ({
    coreRules: { PROGRESSION_PLAYER: { baseHealth: 12 } },
  })),
}));

vi.mock('@/lib/api-client', () => ({
  fetchCodexCollection: mockFetchCodexCollection,
}));

describe('useGameRules admin reads (CDN bypass)', () => {
  beforeEach(() => {
    mockFetchCodexCollection.mockClear();
  });

  it('uses the admin query key and includeUnlisted for the Core Rules editor', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    function AdminCoreRulesProbe() {
      useGameRules({ admin: true });
      return null;
    }

    renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <AdminCoreRulesProbe />
      </QueryClientProvider>,
    );

    const adminKey = adminCodexCollectionQueryKey('coreRules');
    const publicKey = codexKeys.collection('coreRules');
    expect(adminKey).toEqual(['codex', 'coreRules', 'all']);
    expect(publicKey).toEqual(['codex', 'coreRules']);

    const cached = queryClient.getQueryCache().find({ queryKey: adminKey });
    expect(cached, 'admin editor must not register the public CDN query key').toBeDefined();
    expect(queryClient.getQueryCache().find({ queryKey: publicKey })).toBeUndefined();

    await cached?.fetch();
    expect(mockFetchCodexCollection).toHaveBeenCalledWith('coreRules', { includeUnlisted: true });
  });
});
