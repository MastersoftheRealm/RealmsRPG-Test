import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { QueryClient } from '@tanstack/react-query';
import { newAdminPendingFeatLevelId } from './admin-pending-feat-level-id';

vi.mock('./actions', () => ({
  createCodexDoc: vi.fn(),
  updateCodexDoc: vi.fn(),
}));

vi.mock('@/hooks/use-codex', () => ({
  patchAdminCodexCollectionRow: vi.fn(),
}));

import { createCodexDoc, updateCodexDoc } from './actions';
import { persistCodexFamilyLevelEdits } from './admin-codex-level-save';

const queryClient = {} as QueryClient;

describe('persistCodexFamilyLevelEdits', () => {
  beforeEach(() => {
    vi.mocked(createCodexDoc).mockReset();
    vi.mocked(updateCodexDoc).mockReset();
  });

  it('creates pending levels before updating existing rows', async () => {
    const pending = newAdminPendingFeatLevelId();
    vi.mocked(createCodexDoc).mockResolvedValue({
      success: true,
      id: '99',
    });
    vi.mocked(updateCodexDoc).mockResolvedValue({
      success: true,
      updatedAt: '2026-01-01T00:00:01Z',
    });

    const calls: string[] = [];
    vi.mocked(createCodexDoc).mockImplementation(async () => {
      calls.push('create');
      return { success: true, id: '99' };
    });
    vi.mocked(updateCodexDoc).mockImplementation(async () => {
      calls.push('update');
      return { success: true, updatedAt: '2026-01-01T00:00:01Z' };
    });

    const err = await persistCodexFamilyLevelEdits({
      collection: 'codex_feats',
      editsById: {
        '1': { name: 'Base', feat_lvl: 1 },
        [pending]: { name: 'Tier II', feat_lvl: 2 },
      },
      updatedAtForId: () => undefined,
      toPayload: (form) => form as Record<string, unknown>,
      invalidMessage: (_id, form) => (form?.name?.trim() ? null : 'name required'),
      queryClient,
    });

    expect(err).toBeNull();
    expect(calls).toEqual(['create', 'update']);
    expect(createCodexDoc).toHaveBeenCalledOnce();
    expect(updateCodexDoc).toHaveBeenCalledOnce();
  });
});
