import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockSelect, mockFromPublicTable, mockCreatePublicClient } = vi.hoisted(() => {
  const mockSelect = vi.fn();
  const mockFromPublicTable = vi.fn(() => ({ select: mockSelect }));
  const mockCreatePublicClient = vi.fn(() => ({ from: vi.fn() }));
  return { mockSelect, mockFromPublicTable, mockCreatePublicClient };
});

vi.mock('@/lib/supabase/database', () => ({
  fromPublicTable: mockFromPublicTable,
}));

vi.mock('@/lib/supabase/public-client', () => ({
  createPublicClient: () => mockCreatePublicClient(),
}));

import {
  codexDetailSupabaseSelectCount,
  loadAllCodexDetailParams,
  loadCodexDetailEntry,
  resetCodexDetailSupabaseSelectCountForTests,
} from './detail-server';

describe('codex detail-server', () => {
  beforeEach(() => {
    resetCodexDetailSupabaseSelectCountForTests();
    mockSelect.mockReset();
    mockFromPublicTable.mockClear();
    mockCreatePublicClient.mockClear();
    mockSelect.mockImplementation(() => Promise.resolve({ data: [], error: null }));
  });

  it('loads each collection once per process when resolving many entries', async () => {
    mockSelect.mockImplementation(() =>
      Promise.resolve({
        data: [
          { id: '1', name: 'Tough', description: 'A' },
          { id: '2', name: 'Alert', description: 'B' },
        ],
        error: null,
      }),
    );

    await loadAllCodexDetailParams();
    const selectsAfterParams = codexDetailSupabaseSelectCount;

    const slug1 = 'tough--1';
    const slug2 = 'alert--2';
    await loadCodexDetailEntry('feats', slug1);
    await loadCodexDetailEntry('feats', slug2);
    await loadCodexDetailEntry('feats', slug1);

    expect(codexDetailSupabaseSelectCount).toBe(selectsAfterParams);
    expect(codexDetailSupabaseSelectCount).toBe(9);

    const entry1 = await loadCodexDetailEntry('feats', slug1);
    expect(entry1?.name).toBe('Tough');
  });

  it('issues one select per detail collection during loadAllCodexDetailParams', async () => {
    await loadAllCodexDetailParams();

    expect(codexDetailSupabaseSelectCount).toBe(9);
    expect(mockFromPublicTable).toHaveBeenCalledTimes(9);
  });
});
