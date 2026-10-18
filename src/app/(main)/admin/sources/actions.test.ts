/**
 * Admin Sources membership writes — payload shape, auth, and optimistic lock.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeSupabase } from '@/lib/codex/fake-supabase';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));
vi.mock('@/lib/supabase/session', () => ({
  getSession: vi.fn(async () => ({ user: { uid: 'admin-1' } })),
}));
vi.mock('@/lib/admin', () => ({ isAdmin: vi.fn(async () => true) }));
vi.mock('@/lib/codex-changelog', () => ({ recordCodexChange: vi.fn(async () => undefined) }));
vi.mock('@/lib/supabase/server', () => ({ createServiceRoleClient: vi.fn(() => currentDb) }));

import {
  addAdminCodexSourceMembership,
  batchAddAdminCodexSourceMembership,
  removeAdminCodexSourceMembership,
} from './actions';
import { defined } from '@/lib/utils';

let currentDb: FakeSupabase;

const CONFLICT_MESSAGE =
  'This entity changed since you opened it. Reload the page and reapply your edit.';

function seed(): void {
  currentDb = new FakeSupabase({
    codex_feats: [
      {
        id: '1',
        name: 'Example',
        sources: ['Core'],
        updated_at: '2026-10-17T12:00:00Z',
      },
    ],
    codex_skills: [],
    codex_species: [],
    codex_traits: [],
    codex_parts: [],
    codex_properties: [],
    codex_equipment: [],
    codex_archetypes: [],
    codex_creature_feats: [],
    codex_retired_ids: [],
  });
}

beforeEach(() => {
  seed();
});

describe('admin sources membership actions', () => {
  it('rejects non-admin callers', async () => {
    const { isAdmin } = await import('@/lib/admin');
    vi.mocked(isAdmin).mockResolvedValueOnce(false);

    const result = await addAdminCodexSourceMembership(
      {
        table: 'codex_feats',
        id: '1',
        expectedUpdatedAt: '2026-10-17T12:00:00Z',
        currentSources: ['Core'],
      },
      'Homebrew',
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('Admin access required');
  });

  it('updates only the sources column with optimistic locking', async () => {
    const result = await addAdminCodexSourceMembership(
      {
        table: 'codex_feats',
        id: '1',
        expectedUpdatedAt: '2026-10-17T12:00:00Z',
        currentSources: ['Core'],
      },
      'Homebrew',
    );

    expect(result).toEqual({ success: true, updatedCount: 1 });
    const row = defined(defined(currentDb.tables.codex_feats)[0]);
    expect(row.sources).toEqual(['Core', 'Homebrew']);
    expect(row.name).toBe('Example');
  });

  it('returns the existing conflict message when the row changed', async () => {
    const result = await addAdminCodexSourceMembership(
      {
        table: 'codex_feats',
        id: '1',
        expectedUpdatedAt: '2026-10-16T12:00:00Z',
        currentSources: ['Core'],
      },
      'Homebrew',
    );

    expect(result.success).toBe(false);
    expect(result.conflict).toBe(true);
    expect(result.error).toBe(CONFLICT_MESSAGE);
    expect(defined(defined(currentDb.tables.codex_feats)[0]).sources).toEqual(['Core']);
  });

  it('stops a batch on the first failure and reports how many succeeded', async () => {
    currentDb = new FakeSupabase({
      codex_feats: [
        {
          id: '1',
          name: 'First',
          sources: ['Core'],
          updated_at: '2026-10-17T12:00:00Z',
        },
        {
          id: '2',
          name: 'Second',
          sources: ['Core'],
          updated_at: '2026-10-17T12:00:00Z',
        },
      ],
      codex_skills: [],
      codex_species: [],
      codex_traits: [],
      codex_parts: [],
      codex_properties: [],
      codex_equipment: [],
      codex_archetypes: [],
      codex_creature_feats: [],
      codex_retired_ids: [],
    });

    const result = await batchAddAdminCodexSourceMembership(
      [
        {
          table: 'codex_feats',
          id: '1',
          expectedUpdatedAt: '2026-10-17T12:00:00Z',
          currentSources: ['Core'],
        },
        {
          table: 'codex_feats',
          id: '2',
          expectedUpdatedAt: '2026-10-16T12:00:00Z',
          currentSources: ['Core'],
        },
      ],
      'Homebrew',
    );

    expect(result.success).toBe(false);
    expect(result.updatedCount).toBe(1);
    expect(result.conflict).toBe(true);
    expect(defined(currentDb.tables.codex_feats)[0]?.sources).toEqual(['Core', 'Homebrew']);
    expect(defined(currentDb.tables.codex_feats)[1]?.sources).toEqual(['Core']);
  });

  it('removes a source and falls back to Core when it was the last pack', async () => {
    const result = await removeAdminCodexSourceMembership(
      {
        table: 'codex_feats',
        id: '1',
        expectedUpdatedAt: '2026-10-17T12:00:00Z',
        currentSources: ['Core', 'Homebrew'],
      },
      'Homebrew',
    );

    expect(result.success).toBe(true);
    expect(defined(defined(currentDb.tables.codex_feats)[0]).sources).toEqual(['Core']);
  });
});
