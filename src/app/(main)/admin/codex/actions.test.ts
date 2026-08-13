/**
 * Codex server action safety rails.
 * Each case here is a way an authorized admin could destroy official content by accident:
 * an unvalidated table name on a service-role client, a changelog failure inverting a
 * successful create, a reused id, a delete that orphans references, a stale form overwriting
 * a newer save, and an archetype save wiping its progression levels.
 */

import { describe, expect, it, beforeEach, vi } from 'vitest';
import { FakeSupabase } from '@/lib/codex/fake-supabase';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/supabase/session', () => ({
  getSession: vi.fn(async () => ({ user: { uid: 'admin-1' } })),
}));
vi.mock('@/lib/admin', () => ({ isAdmin: vi.fn(async () => true) }));
vi.mock('@/lib/codex-changelog', () => ({ recordCodexChange: vi.fn(async () => undefined) }));
vi.mock('@/lib/supabase/server', () => ({ createServiceRoleClient: vi.fn(() => currentDb) }));

import { createCodexDoc, deleteCodexDoc, saveArchetypeWithPath, updateCodexDoc } from './actions';
import { recordCodexChange } from '@/lib/codex-changelog';

let currentDb: FakeSupabase;

function seed(options: { failInsertOnce?: Set<string> } = {}): FakeSupabase {
  currentDb = new FakeSupabase(
    {
      codex_feats: [
        { id: '1', name: 'Flawless Fighter', mart_prof_req: 3 },
        { id: '2', name: 'Second Wind', skill_req: '10' },
      ],
      codex_skills: [
        { id: '10', name: 'Athletics', updated_at: '2026-08-13T10:00:00Z' },
        { id: '11', name: 'Unused Skill' },
      ],
      codex_species: [],
      codex_traits: [],
      codex_archetypes: [{ id: '5', name: 'Blade', level1_feats: '1' }],
      codex_archetype_levels: [
        { id: 100, archetype_id: '5', level: 2, feats: '1' },
        { id: 101, archetype_id: '5', level: 3, feats: '2' },
      ],
      codex_retired_ids: [],
      user_profiles: [{ id: 'victim', role: 'admin' }],
    },
    options
  );
  return currentDb;
}

beforeEach(() => {
  vi.mocked(recordCodexChange).mockReset();
  vi.mocked(recordCodexChange).mockResolvedValue(undefined);
  seed();
});

describe('collection allowlist', () => {
  it('refuses a table outside the codex allowlist on the service-role client', async () => {
    const result = await deleteCodexDoc('user_profiles' as never, 'victim');

    expect(result).toEqual({ success: false, error: 'Unknown collection' });
    expect(currentDb.tables.user_profiles).toHaveLength(1);
  });

  it('refuses an unknown collection on update', async () => {
    const result = await updateCodexDoc('role_policies' as never, 'admin', { name: 'x' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unknown collection');
  });
});

describe('changelog failures', () => {
  it('keeps a successful create successful when the audit write throws', async () => {
    vi.mocked(recordCodexChange).mockRejectedValue(new Error('changelog table missing'));

    const result = await createCodexDoc('codex_feats', undefined, { name: 'New Feat' });

    expect(result.success).toBe(true);
    expect(currentDb.tables.codex_feats.some((row) => row.name === 'New Feat')).toBe(true);
  });
});

describe('id retirement', () => {
  it('records the deleted id and never hands it out again', async () => {
    const deleted = await deleteCodexDoc('codex_feats', '1', { acknowledgeReferences: true });
    expect(deleted.success).toBe(true);
    expect(currentDb.tables.codex_retired_ids).toEqual([
      { id: '1', entity_type: 'codex_feats' },
    ]);

    const created = await createCodexDoc('codex_feats', undefined, { name: 'Replacement' });

    expect(created.success).toBe(true);
    expect(created.id).toBe('3');
  });

  it('rejects a client-proposed id that belongs to a deleted entity', async () => {
    await deleteCodexDoc('codex_feats', '1', { acknowledgeReferences: true });

    const created = await createCodexDoc('codex_feats', '1', { name: 'Recycler' });

    expect(created.id).not.toBe('1');
  });
});

describe('referential integrity on delete', () => {
  it('refuses to delete an entity other rows still point at', async () => {
    const result = await deleteCodexDoc('codex_feats', '1');

    expect(result.success).toBe(false);
    expect(result.references).toEqual(
      expect.arrayContaining([
        'Archetype "Blade" (level1_feats)',
        'Archetype 5 level 2 (feats)',
      ])
    );
    expect(currentDb.tables.codex_feats).toHaveLength(2);
  });

  it('deletes once the admin acknowledges the references', async () => {
    const result = await deleteCodexDoc('codex_feats', '1', { acknowledgeReferences: true });

    expect(result.success).toBe(true);
    expect(currentDb.tables.codex_feats).toHaveLength(1);
  });

  it('allows deleting an unreferenced entity without a prompt', async () => {
    const result = await deleteCodexDoc('codex_skills', '11');

    expect(result.success).toBe(true);
    expect(currentDb.tables.codex_skills.map((row) => row.id)).toEqual(['10']);
  });

  it('reports the feat that requires a skill before the skill is deleted', async () => {
    const result = await deleteCodexDoc('codex_skills', '10');

    expect(result.references).toEqual(['Feat "Second Wind" (skill_req)']);
  });
});

describe('optimistic locking', () => {
  it('rejects a save built from a stale copy of the row', async () => {
    const result = await updateCodexDoc(
      'codex_skills',
      '10',
      { name: 'Renamed' },
      { expectedUpdatedAt: '2026-08-13T09:00:00Z' }
    );

    expect(result.conflict).toBe(true);
    expect(currentDb.tables.codex_skills[0].name).toBe('Athletics');
  });

  it('accepts a save that carries the current version', async () => {
    const result = await updateCodexDoc(
      'codex_skills',
      '10',
      { name: 'Renamed' },
      { expectedUpdatedAt: '2026-08-13T10:00:00Z' }
    );

    expect(result.success).toBe(true);
    expect(currentDb.tables.codex_skills[0].name).toBe('Renamed');
  });
});

describe('archetype progression replace', () => {
  const baseArchetype = {
    id: '5',
    name: 'Blade',
    type: 'martial' as const,
  };

  it('refuses a save that would delete every existing level', async () => {
    const result = await saveArchetypeWithPath({ ...baseArchetype, levels: [] });

    expect(result.success).toBe(false);
    expect(result.error).toContain('delete all 2 progression level(s)');
    expect(currentDb.tables.codex_archetype_levels).toHaveLength(2);
  });

  it('refuses duplicate levels instead of failing the unique constraint mid-write', async () => {
    const result = await saveArchetypeWithPath({
      ...baseArchetype,
      levels: [{ level: 2 }, { level: 2 }],
    });

    expect(result.success).toBe(false);
    expect(currentDb.tables.codex_archetype_levels).toHaveLength(2);
  });

  it('restores the previous levels when the replacement insert fails', async () => {
    seed({ failInsertOnce: new Set(['codex_archetype_levels']) });

    const result = await saveArchetypeWithPath({
      ...baseArchetype,
      levels: [{ level: 4, feats: '9' }],
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('restored');
    expect(currentDb.tables.codex_archetype_levels.map((row) => row.level)).toEqual([2, 3]);
  });

  it('replaces the levels on a normal save', async () => {
    const result = await saveArchetypeWithPath({
      ...baseArchetype,
      levels: [{ level: 2, feats: '1' }, { level: 5, feats: '2' }],
    });

    expect(result.success).toBe(true);
    expect(currentDb.tables.codex_archetype_levels.map((row) => row.level)).toEqual([2, 5]);
  });
});
