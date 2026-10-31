import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import {
  ADMIN_CODEX_QUERY_OPTIONS,
  adminCodexCollectionQueryKey,
  codexKeys,
  patchAdminCodexCollectionRow,
} from './use-codex';

vi.mock('@/lib/api-client', () => ({
  fetchCodexCollection: vi.fn(async () => ({ creatureFeats: [] })),
  fetchCodex: vi.fn(async () => ({})),
}));

import { fetchCodexCollection } from '@/lib/api-client';

const mockFetchCodexCollection = vi.mocked(fetchCodexCollection);

describe('admin codex reads (CDN bypass)', () => {
  beforeEach(() => {
    mockFetchCodexCollection.mockClear();
  });

  it('uses an admin-scoped query key for includeUnlisted reads', () => {
    expect(ADMIN_CODEX_QUERY_OPTIONS).toEqual({ includeUnlisted: true });
    expect(adminCodexCollectionQueryKey('creatureFeats')).toEqual([
      'codex',
      'creatureFeats',
      'all',
    ]);
    expect(codexKeys.collection('feats')).toEqual(['codex', 'feats']);
  });

  it('requests includeUnlisted=1 for admin collection fetches', async () => {
    await fetchCodexCollection('creatureFeats', ADMIN_CODEX_QUERY_OPTIONS);
    expect(mockFetchCodexCollection).toHaveBeenCalledWith('creatureFeats', {
      includeUnlisted: true,
    });
  });
});

describe('patchAdminCodexCollectionRow', () => {
  it('updates updated_at on the admin cache slice without touching public keys', () => {
    const queryClient = new QueryClient();
    const adminKey = adminCodexCollectionQueryKey('creatureFeats');
    const publicKey = codexKeys.collection('creatureFeats');
    queryClient.setQueryData(adminKey, [
      { id: '148', name: 'Old', updated_at: '2026-10-31T10:00:00Z' },
    ]);
    queryClient.setQueryData(publicKey, [
      { id: '148', name: 'Old', updated_at: '2026-10-31T10:00:00Z' },
    ]);

    patchAdminCodexCollectionRow(queryClient, 'codex_creature_feats', '148', {
      updated_at: '2026-10-31T10:05:00Z',
    });

    expect(queryClient.getQueryData(adminKey)).toEqual([
      { id: '148', name: 'Old', updated_at: '2026-10-31T10:05:00Z' },
    ]);
    expect(queryClient.getQueryData(publicKey)).toEqual([
      { id: '148', name: 'Old', updated_at: '2026-10-31T10:00:00Z' },
    ]);
  });
});
