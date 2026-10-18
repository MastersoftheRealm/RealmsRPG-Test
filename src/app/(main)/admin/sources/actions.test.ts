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

import { CODEX_SOURCE_TABLES } from '@/lib/codex/source-catalog';
import {
  addAdminCodexSourceMembership,
  batchAddAdminCodexSourceMembership,
  removeAdminCodexSourceMembership,
} from './actions';
import { ADMIN_SOURCES_ADD_FAILED, ADMIN_SOURCES_NOT_FOUND } from './admin-sources-copy';
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
      },
      'Homebrew',
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('Admin access required');
    expect(defined(defined(currentDb.tables.codex_feats)[0]).sources).toEqual(['Core']);
  });

  it('updates only the sources column with optimistic locking', async () => {
    const result = await addAdminCodexSourceMembership(
      {
        table: 'codex_feats',
        id: '1',
        expectedUpdatedAt: '2026-10-17T12:00:00Z',
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
        },
        {
          table: 'codex_feats',
          id: '2',
          expectedUpdatedAt: '2026-10-16T12:00:00Z',
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

  it('removes a case-insensitive match and stores Core when that was the only pack', async () => {
    const row = defined(defined(currentDb.tables.codex_feats)[0]);
    row.sources = ['Homebrew'];

    const removed = await removeAdminCodexSourceMembership(
      {
        table: 'codex_feats',
        id: '1',
        expectedUpdatedAt: '2026-10-17T12:00:00Z',
      },
      'homebrew',
    );

    expect(removed.success).toBe(true);
    expect(defined(defined(currentDb.tables.codex_feats)[0]).sources).toEqual(['Core']);
  });

  it('keeps other packs stored on the row when adding a name', async () => {
    const row = defined(defined(currentDb.tables.codex_feats)[0]);
    row.sources = ['Core', 'Keep'];

    const result = await addAdminCodexSourceMembership(
      {
        table: 'codex_feats',
        id: '1',
        expectedUpdatedAt: '2026-10-17T12:00:00Z',
      },
      'homebrew',
    );

    expect(result.success).toBe(true);
    expect(defined(defined(currentDb.tables.codex_feats)[0]).sources).toEqual([
      'Core',
      'homebrew',
      'Keep',
    ]);
  });

  it('dedupes an add against the stored spelling', async () => {
    const row = defined(defined(currentDb.tables.codex_feats)[0]);
    row.sources = ['Core', 'Homebrew'];

    const result = await addAdminCodexSourceMembership(
      {
        table: 'codex_feats',
        id: '1',
        expectedUpdatedAt: '2026-10-17T12:00:00Z',
      },
      'homebrew',
    );

    expect(result.success).toBe(true);
    expect(defined(defined(currentDb.tables.codex_feats)[0]).sources).toEqual(['Core', 'Homebrew']);
  });

  it('rejects a reserved or over-long name before writing', async () => {
    const reserved = await addAdminCodexSourceMembership(
      {
        table: 'codex_feats',
        id: '1',
        expectedUpdatedAt: '2026-10-17T12:00:00Z',
      },
      'All',
    );
    expect(reserved.success).toBe(false);
    expect(reserved.error).toMatch(/reserved/);
    expect(defined(defined(currentDb.tables.codex_feats)[0]).sources).toEqual(['Core']);

    const tooLong = await addAdminCodexSourceMembership(
      {
        table: 'codex_feats',
        id: '1',
        expectedUpdatedAt: '2026-10-17T12:00:00Z',
      },
      'x'.repeat(101),
    );
    expect(tooLong.success).toBe(false);
    expect(tooLong.error).toMatch(/100/);
    const after = defined(defined(currentDb.tables.codex_feats)[0]);
    expect(after.sources).toEqual(['Core']);
    expect(after.updated_at).toBe('2026-10-17T12:00:00Z');
  });

  it('writes only the sources column on every codex table', async () => {
    for (const table of CODEX_SOURCE_TABLES) {
      currentDb.tables[table] = [
        {
          id: '9',
          name: 'Example',
          description: 'keep',
          source: 'Legacy',
          sources: ['Core', 'Keep'],
          updated_at: '2026-10-17T12:00:00Z',
        },
      ];
    }

    for (const table of CODEX_SOURCE_TABLES) {
      const result = await addAdminCodexSourceMembership(
        {
          table,
          id: '9',
          expectedUpdatedAt: '2026-10-17T12:00:00Z',
        },
        'Extra',
      );
      expect(result.success).toBe(true);
      const row = defined(defined(currentDb.tables[table])[0]);
      expect(row.sources).toEqual(['Core', 'Extra', 'Keep']);
      expect(row.source).toBe('Legacy');
      expect(row.description).toBe('keep');
      expect(row.name).toBe('Example');
      expect(Object.keys(row).sort()).toEqual(
        ['description', 'id', 'name', 'source', 'sources', 'updated_at'].sort(),
      );
    }
  });

  it('stops a batch when a later row is missing and leaves the failed row unwritten', async () => {
    const result = await batchAddAdminCodexSourceMembership(
      [
        {
          table: 'codex_feats',
          id: '1',
          expectedUpdatedAt: '2026-10-17T12:00:00Z',
        },
        {
          table: 'codex_feats',
          id: 'missing',
          expectedUpdatedAt: '2026-10-17T12:00:00Z',
        },
      ],
      'Homebrew',
    );

    expect(result.success).toBe(false);
    expect(result.updatedCount).toBe(1);
    expect(result.error).toBe(ADMIN_SOURCES_NOT_FOUND);
    expect(defined(defined(currentDb.tables.codex_feats)[0]).sources).toEqual(['Core', 'Homebrew']);
  });

  it('does not query an unknown collection', async () => {
    const result = await addAdminCodexSourceMembership(
      {
        table: 'core_rules' as 'codex_feats',
        id: '1',
        expectedUpdatedAt: '2026-10-17T12:00:00Z',
      },
      'Homebrew',
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unknown collection');
    expect(defined(defined(currentDb.tables.codex_feats)[0]).sources).toEqual(['Core']);
  });

  it('returns the add failure copy when the read fails', async () => {
    currentDb.tables.codex_feats = undefined as unknown as Record<string, unknown>[];

    const result = await addAdminCodexSourceMembership(
      {
        table: 'codex_feats',
        id: '1',
        expectedUpdatedAt: '2026-10-17T12:00:00Z',
      },
      'Homebrew',
    );

    expect(result.success).toBe(false);
    expect(result.updatedCount).toBe(0);
    expect(result.error).toBe(ADMIN_SOURCES_ADD_FAILED);
  });
});
