/**
 * Codex server action safety rails.
 * Each case here is a way an authorized admin could destroy official content by accident:
 * an unvalidated table name on a service-role client, a changelog failure inverting a
 * successful create, a reused id, a delete that orphans references, a stale form overwriting
 * a newer save, and an archetype save wiping its progression levels.
 */

import { describe, expect, it, beforeEach, vi } from 'vitest';
import { FakeSupabase } from '@/lib/codex/fake-supabase';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));
vi.mock('@/lib/supabase/session', () => ({
  requireLiveUser: vi.fn(async () => ({ uid: 'admin-1' })),
}));
vi.mock('@/lib/admin', () => ({ isAdmin: vi.fn(async () => true) }));
vi.mock('@/lib/codex-changelog', () => ({ recordCodexChange: vi.fn(async () => undefined) }));
vi.mock('@/lib/supabase/server', () => ({ createServiceRoleClient: vi.fn(() => currentDb) }));

import { createCodexDoc, deleteCodexDoc, saveArchetypeWithPath, updateCodexDoc } from './actions';
import {
  CORE_RULES_NUMBER_SERVER_NEGATIVE,
  CORE_RULES_NUMBER_TOO_LARGE,
} from '../core-rules/core-rules-number';
import { recordCodexChange } from '@/lib/codex-changelog';
import { defined } from '@/lib/utils';
import {
  parseArchetypePathData,
  parseLevel1LoadoutsField,
  parseRecommendedAbilities,
} from '@/lib/game/archetype-path';

let currentDb: FakeSupabase;

function seed(options: { failInsertOnce?: Set<string> | undefined } = {}): FakeSupabase {
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
      core_rules: [
        {
          id: 'PROGRESSION_PLAYER',
          data: { baseHealth: 12, startingCurrency: 200 },
          updated_at: '2026-08-13T10:00:00Z',
        },
        {
          id: 'COMBAT',
          data: { multipleActionPenalty: -5 },
          updated_at: '2026-08-13T10:00:00Z',
        },
      ],
    },
    options,
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
    expect(defined(currentDb.tables.codex_feats).some((row) => row.name === 'New Feat')).toBe(true);
  });
});

describe('id retirement', () => {
  it('records the deleted id and never hands it out again', async () => {
    const deleted = await deleteCodexDoc('codex_feats', '1', { acknowledgeReferences: true });
    expect(deleted.success).toBe(true);
    expect(currentDb.tables.codex_retired_ids).toEqual([{ id: '1', entity_type: 'codex_feats' }]);

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
      expect.arrayContaining(['Archetype "Blade" (level1_feats)', 'Archetype 5 level 2 (feats)']),
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
    expect(defined(currentDb.tables.codex_skills).map((row) => row.id)).toEqual(['10']);
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
      { expectedUpdatedAt: '2026-08-13T09:00:00Z' },
    );

    expect(result.conflict).toBe(true);
    expect(defined(defined(currentDb.tables.codex_skills)[0]).name).toBe('Athletics');
  });

  it('accepts a save that carries the current version', async () => {
    const result = await updateCodexDoc(
      'codex_skills',
      '10',
      { name: 'Renamed' },
      { expectedUpdatedAt: '2026-08-13T10:00:00Z' },
    );

    expect(result.success).toBe(true);
    expect(defined(defined(currentDb.tables.codex_skills)[0]).name).toBe('Renamed');
  });

  it('returns the new updated_at and accepts a second save using it', async () => {
    const first = await updateCodexDoc(
      'codex_skills',
      '10',
      { name: 'First save' },
      { expectedUpdatedAt: '2026-08-13T10:00:00Z' },
    );
    expect(first.success).toBe(true);
    expect(first.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    const second = await updateCodexDoc(
      'codex_skills',
      '10',
      { name: 'Second save' },
      { expectedUpdatedAt: first.updatedAt },
    );
    expect(second.success).toBe(true);
    expect(defined(defined(currentDb.tables.codex_skills)[0]).name).toBe('Second save');
  });
});

describe('archetype JSON columns', () => {
  it('writes valid JSON and rejects JSON that will not parse without changing the row', async () => {
    const saved = await updateCodexDoc('codex_archetypes', '5', {
      name: 'Blade',
      level1_guidance_groups: [{ id: 'g', title: 'Goal' }],
      level1_recommended_abilities: { strength: 3 },
      level1_loadouts: {
        armorStep: 'optional',
        sharedEquipment: [{ id: '3', quantity: 4 }],
      },
    });

    expect(saved.success).toBe(true);
    const written = defined(defined(currentDb.tables.codex_archetypes)[0]);
    expect(written.level1_loadouts).toEqual({
      armorStep: 'optional',
      sharedEquipment: [{ id: '3', quantity: 4 }],
    });
    expect(written.level1_guidance_groups).toEqual([{ id: 'g', title: 'Goal' }]);
    expect(written.level1_recommended_abilities).toEqual({ strength: 3 });

    const before = structuredClone(currentDb.tables.codex_archetypes);
    const rejected = await updateCodexDoc('codex_archetypes', '5', {
      name: 'Blade',
      level1_guidance_groups: '[{"id":"g","title":"T","feats":["1"]}',
      level1_loadouts: '{"armorStep":"optional"',
      level1_recommended_abilities: '{strength:3}',
    });

    expect(rejected.success).toBe(false);
    expect(rejected.error).toMatch(/level1_guidance_groups is not valid JSON/);
    expect(rejected.error).toMatch(/nothing was written/);
    expect(currentDb.tables.codex_archetypes).toEqual(before);
  });

  it('rejects coercible nested JSON and quoted empty scalars without mutating the row', async () => {
    const before = structuredClone(currentDb.tables.codex_archetypes);

    const nestedAbility = await updateCodexDoc('codex_archetypes', '5', {
      name: 'Blade',
      level1_recommended_abilities: { strength: [] },
    });
    expect(nestedAbility.success).toBe(false);
    expect(nestedAbility.error).toMatch(/finite number/i);
    expect(currentDb.tables.codex_archetypes).toEqual(before);

    const quotedEmpty = await updateCodexDoc('codex_archetypes', '5', {
      name: 'Blade',
      level1_loadouts: '""',
    });
    expect(quotedEmpty.success).toBe(false);
    expect(quotedEmpty.error).toMatch(/JSON object or array/i);
    expect(currentDb.tables.codex_archetypes).toEqual(before);
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
    expect(defined(currentDb.tables.codex_archetype_levels).map((row) => row.level)).toEqual([
      2, 3,
    ]);
  });

  it('replaces the levels on a normal save', async () => {
    const result = await saveArchetypeWithPath({
      ...baseArchetype,
      levels: [
        { level: 2, feats: '1' },
        { level: 5, feats: '2' },
      ],
    });

    expect(result.success).toBe(true);
    expect(defined(currentDb.tables.codex_archetype_levels).map((row) => row.level)).toEqual([
      2, 5,
    ]);
  });

  it('rejects malformed JSON and invalid ids without mutating the row or levels', async () => {
    const beforeArchetype = structuredClone(currentDb.tables.codex_archetypes);
    const beforeLevels = structuredClone(currentDb.tables.codex_archetype_levels);

    const jsonRejected = await saveArchetypeWithPath({
      ...baseArchetype,
      level1_recommended_abilities: { strength: [] },
      levels: [{ level: 2, feats: '1' }],
    });
    expect(jsonRejected.success).toBe(false);
    expect(jsonRejected.error).toMatch(/finite number/i);
    expect(currentDb.tables.codex_archetypes).toEqual(beforeArchetype);
    expect(currentDb.tables.codex_archetype_levels).toEqual(beforeLevels);

    const idRejected = await saveArchetypeWithPath({
      ...baseArchetype,
      id: '5-evil',
      levels: [{ level: 2, feats: '1' }],
    });
    expect(idRejected.success).toBe(false);
    expect(idRejected.error).toMatch(/numeric codex id/i);
    expect(currentDb.tables.codex_archetypes).toEqual(beforeArchetype);
    expect(currentDb.tables.codex_archetype_levels).toEqual(beforeLevels);
  });

  it('rejects level-1 progression rows instead of filtering them out', async () => {
    const beforeLevels = structuredClone(currentDb.tables.codex_archetype_levels);

    const result = await saveArchetypeWithPath({
      ...baseArchetype,
      levels: [{ level: 1, feats: '1' }],
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/level 1 is stored on the archetype row/i);
    expect(currentDb.tables.codex_archetype_levels).toEqual(beforeLevels);
  });
});

describe('saveArchetypeWithPath JSON column persistence', () => {
  const baseArchetype = {
    id: '5',
    name: 'Blade',
    type: 'martial' as const,
    levels: [{ level: 2, feats: '1' }],
  };

  const guidance = [{ id: 'g1', title: 'Starter', feats: ['1'] }];
  const abilities = { strength: 3, agility: 1 };
  const loadouts = { armorStep: 'optional', sharedEquipment: [{ id: '3', quantity: 2 }] };

  function assertDomainReadersMatchStored(row: Record<string, unknown>) {
    expect(typeof row.level1_guidance_groups).not.toBe('string');
    expect(typeof row.level1_recommended_abilities).not.toBe('string');
    expect(typeof row.level1_loadouts).not.toBe('string');

    const pathData = parseArchetypePathData({
      level1: {
        guidance_groups: row.level1_guidance_groups,
        recommended_abilities: row.level1_recommended_abilities,
        loadouts: row.level1_loadouts,
      },
    });
    expect(pathData?.level1?.guidance_groups?.[0]?.id).toBe('g1');
    expect(parseRecommendedAbilities(row.level1_recommended_abilities)).toEqual({
      strength: 3,
      agility: 1,
    });
    expect(parseLevel1LoadoutsField(row.level1_loadouts)).toEqual({
      armorStep: 'optional',
      sharedEquipment: [{ id: '3', quantity: 2 }],
    });
  }

  it.each([
    [
      'native objects',
      {
        level1_guidance_groups: guidance,
        level1_recommended_abilities: abilities,
        level1_loadouts: loadouts,
      },
    ],
    [
      'JSON strings',
      {
        level1_guidance_groups: JSON.stringify(guidance),
        level1_recommended_abilities: JSON.stringify(abilities),
        level1_loadouts: JSON.stringify(loadouts),
      },
    ],
  ] as const)('stores %s as parsed JSONB for domain readers', async (_label, jsonFields) => {
    const result = await saveArchetypeWithPath({ ...baseArchetype, ...jsonFields });
    expect(result.success).toBe(true);
    const row = defined(defined(currentDb.tables.codex_archetypes).find((r) => r.id === '5'));
    expect(row.level1_guidance_groups).toEqual(guidance);
    expect(row.level1_recommended_abilities).toEqual(abilities);
    expect(row.level1_loadouts).toEqual(loadouts);
    assertDomainReadersMatchStored(row);
  });

  it.each([
    [
      'empty strings',
      { level1_guidance_groups: '', level1_recommended_abilities: '  ', level1_loadouts: '' },
    ],
    [
      'null',
      { level1_guidance_groups: null, level1_recommended_abilities: null, level1_loadouts: null },
    ],
  ] as const)('clears %s JSONB cells to null', async (_label, jsonFields) => {
    const seeded = defined(defined(currentDb.tables.codex_archetypes)[0]);
    currentDb.tables.codex_archetypes = [
      {
        ...seeded,
        level1_guidance_groups: guidance,
        level1_recommended_abilities: abilities,
        level1_loadouts: loadouts,
      },
    ];

    const result = await saveArchetypeWithPath({ ...baseArchetype, ...jsonFields });
    expect(result.success).toBe(true);
    const row = defined(defined(currentDb.tables.codex_archetypes).find((r) => r.id === '5'));
    expect(row.level1_guidance_groups).toBeNull();
    expect(row.level1_recommended_abilities).toBeNull();
    expect(row.level1_loadouts).toBeNull();
    expect(parseRecommendedAbilities(row.level1_recommended_abilities)).toBeUndefined();
    expect(parseLevel1LoadoutsField(row.level1_loadouts)).toEqual({});
    expect(
      parseArchetypePathData({ level1: { guidance_groups: row.level1_guidance_groups } })?.level1
        ?.guidance_groups,
    ).toBeUndefined();
  });

  it('round-trips a fully populated path save through the action', async () => {
    const result = await saveArchetypeWithPath({
      id: '5',
      name: 'Blade Path',
      type: 'powered-martial',
      description: 'A test path',
      sources: ['Core', 'Playtest'],
      archetype_ability: 'strength',
      secondary_ability: 'agility',
      power_prof_start: 2,
      martial_prof_start: 1,
      power_prof_level5: 3,
      martial_prof_level5: 4,
      level1_feats: '1,2',
      level1_skills: '10',
      level1_powers: 'pwr',
      level1_innate_powers: 'inn',
      level1_techniques: 'tec',
      level1_armaments: '3:1',
      level1_equipment: '4',
      level1_recommend_unarmed_prowess: true,
      level1_remove_feats: '9',
      level1_remove_powers: '8',
      level1_remove_techniques: '7',
      level1_remove_armaments: '6',
      level1_notes: 'Level one notes',
      level1_guidance_groups: guidance,
      level1_recommended_abilities: abilities,
      level1_loadouts: loadouts,
      levels: [
        { level: 2, feats: '1', skills: '10', notes: 'L2' },
        { level: 4, powers: 'p1', techniques: 't1' },
      ],
    });

    expect(result.success).toBe(true);
    const row = defined(defined(currentDb.tables.codex_archetypes).find((r) => r.id === '5'));
    expect(row.name).toBe('Blade Path');
    expect(row.type).toBe('powered-martial');
    expect(row.level1_notes).toBe('Level one notes');
    assertDomainReadersMatchStored(row);
    expect(defined(currentDb.tables.codex_archetype_levels).map((l) => l.level)).toEqual([2, 4]);
  });
});

describe('core rules numbers (86e3jtuge)', () => {
  it('refuses a negative or unsafe progression save and leaves the row unchanged', async () => {
    const before = structuredClone(currentDb.tables.core_rules);

    const negative = await updateCodexDoc('core_rules', 'PROGRESSION_PLAYER', {
      baseHealth: -4,
      startingCurrency: 200,
    });
    const huge = await updateCodexDoc('core_rules', 'PROGRESSION_PLAYER', {
      baseHealth: Number.MAX_SAFE_INTEGER + 2,
    });

    expect(negative).toEqual({ success: false, error: CORE_RULES_NUMBER_SERVER_NEGATIVE });
    expect(huge).toEqual({ success: false, error: CORE_RULES_NUMBER_TOO_LARGE });
    expect(currentDb.tables.core_rules).toEqual(before);
  });

  it('still saves combat penalties and a non-negative base health', async () => {
    const penalty = await updateCodexDoc('core_rules', 'COMBAT', { multipleActionPenalty: -5 });
    const health = await updateCodexDoc('core_rules', 'PROGRESSION_PLAYER', {
      baseHealth: 14,
      startingCurrency: 200,
    });

    expect(penalty.success).toBe(true);
    expect(health.success).toBe(true);
    expect(defined(currentDb.tables.core_rules).find((row) => row.id === 'COMBAT')?.data).toEqual({
      multipleActionPenalty: -5,
    });
    expect(
      defined(currentDb.tables.core_rules).find((row) => row.id === 'PROGRESSION_PLAYER')?.data,
    ).toEqual({ baseHealth: 14, startingCurrency: 200 });
  });

  it('refuses to create a core rules document with an unsafe number', async () => {
    const result = await createCodexDoc('core_rules', 'PROGRESSION_CREATURE', {
      currencyGrowthRate: Number.POSITIVE_INFINITY,
    });

    expect(result).toEqual({ success: false, error: CORE_RULES_NUMBER_TOO_LARGE });
    expect(defined(currentDb.tables.core_rules).map((row) => row.id)).not.toContain(
      'PROGRESSION_CREATURE',
    );
  });
});
