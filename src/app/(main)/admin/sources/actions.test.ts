/**
 * Admin Sources membership writes — payload shape, auth, and optimistic lock.
 */

import { revalidatePath, updateTag } from 'next/cache';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CODEX_API_CACHE_TAG, codexApiTableCacheTag } from '@/lib/codex/cache-tags';
import { FakeSupabase } from '@/lib/codex/fake-supabase';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));
vi.mock('@/lib/supabase/session', () => ({
  getSession: vi.fn(async () => ({ user: { uid: 'admin-1' } })),
  requireLiveUser: vi.fn(async () => ({ uid: 'admin-1' })),
}));
vi.mock('@/lib/admin', () => ({ isAdmin: vi.fn(async () => true) }));
vi.mock('@/lib/codex-changelog', () => ({ recordCodexChange: vi.fn(async () => undefined) }));
vi.mock('@/lib/supabase/server', () => ({ createServiceRoleClient: vi.fn(() => currentDb) }));

import { CODEX_SOURCE_TABLES } from '@/lib/codex/source-catalog';
import {
  addAdminCodexSourceMembership,
  batchAddAdminCodexSourceMembership,
  removeAdminCodexSourceMembership,
  renameAdminCodexSource,
} from './actions';
import {
  ADMIN_SOURCES_ADD_FAILED,
  ADMIN_SOURCES_NAME_REQUIRED,
  ADMIN_SOURCES_NOT_FOUND,
  ADMIN_SOURCES_RENAME_FAILED,
} from './admin-sources-copy';
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

describe('renameAdminCodexSource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects a non-admin before calling the rename function', async () => {
    const { isAdmin } = await import('@/lib/admin');
    vi.mocked(isAdmin).mockResolvedValueOnce(false);

    const result = await renameAdminCodexSource('Homebrew', 'Official');

    expect(result).toEqual({
      success: false,
      updatedCount: 0,
      error: 'Admin access required',
    });
    expect(currentDb.rpcCalls).toEqual([]);
    expect(currentDb.updateCalls).toEqual([]);
    expect(defined(defined(currentDb.tables.codex_feats)[0]).sources).toEqual(['Core']);
  });

  it('calls rename_codex_source once and does not update tables itself', async () => {
    currentDb.rpcResult = {
      data: { total: 4, codex_feats: 4 },
      error: null,
    };

    const result = await renameAdminCodexSource('  Homebrew  ', '  Official  Pack ');

    expect(result).toEqual({ success: true, updatedCount: 4 });
    expect(currentDb.rpcCalls).toEqual([
      {
        name: 'rename_codex_source',
        args: { from_name: 'Homebrew', to_name: 'Official Pack', actor: 'admin-1' },
      },
    ]);
    expect(currentDb.updateCalls).toEqual([]);
    expect(defined(defined(currentDb.tables.codex_feats)[0]).sources).toEqual(['Core']);
    expect(
      vi.mocked(updateTag).mock.calls.filter((call) => call[0] === CODEX_API_CACHE_TAG),
    ).toHaveLength(1);
    expect(updateTag).toHaveBeenCalledTimes(1 + CODEX_SOURCE_TABLES.length);
    for (const table of CODEX_SOURCE_TABLES) {
      expect(updateTag).toHaveBeenCalledWith(codexApiTableCacheTag(table));
    }
    expect(revalidatePath).toHaveBeenCalledWith('/codex');
    expect(revalidatePath).toHaveBeenCalledWith('/admin/codex');
    expect(revalidatePath).toHaveBeenCalledWith('/admin/sources');
  });

  it('returns the existing name errors before the function is called', async () => {
    const cases: Array<[string, string, RegExp | string]> = [
      ['', 'Official', ADMIN_SOURCES_NAME_REQUIRED],
      ['   ', 'Official', ADMIN_SOURCES_NAME_REQUIRED],
      ['Homebrew', '', ADMIN_SOURCES_NAME_REQUIRED],
      ['All', 'Official', /reserved/],
      ['Homebrew', '<b>', /HTML/],
      ['Homebrew', 'bad\u0001name', /control characters/],
      ['Homebrew', 'x'.repeat(101), /100/],
    ];

    for (const [fromName, toName, error] of cases) {
      currentDb.rpcCalls.length = 0;
      const result = await renameAdminCodexSource(fromName, toName);
      expect(result.success).toBe(false);
      expect(result.updatedCount).toBe(0);
      if (error instanceof RegExp) expect(result.error).toMatch(error);
      else expect(result.error).toBe(error);
      expect(currentDb.rpcCalls).toEqual([]);
      expect(currentDb.updateCalls).toEqual([]);
      expect(defined(defined(currentDb.tables.codex_feats)[0]).sources).toEqual(['Core']);
    }
    expect(updateTag).not.toHaveBeenCalled();
  });

  it('does not bust caches when the function returns an error', async () => {
    currentDb.rpcResult = { data: null, error: { message: 'function missing' } };

    const result = await renameAdminCodexSource('Homebrew', 'Official');

    expect(result).toEqual({
      success: false,
      updatedCount: 0,
      error: ADMIN_SOURCES_RENAME_FAILED,
    });
    expect(currentDb.rpcCalls).toHaveLength(1);
    expect(currentDb.updateCalls).toEqual([]);
    expect(updateTag).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(defined(defined(currentDb.tables.codex_feats)[0]).sources).toEqual(['Core']);
  });
});
