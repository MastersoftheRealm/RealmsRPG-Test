import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SaveArchetypeWithPathInput } from '@/app/(main)/admin/codex/codex-archetype-write';
import { FakeSupabase } from '@/lib/codex/fake-supabase';
import { fetchCachedOfficialColumnarItems } from '@/lib/official-library-get-payload';
import {
  archetypePathDataFromSaveInput,
  buildSaveArchetypePathValidationContext,
  normalizeCodexCommaListColumn,
  normalizeSaveArchetypeWithPathInput,
  saveArchetypeWithPathInputError,
  saveArchetypeWithPathPublishError,
} from '@/lib/codex-archetype-path-save-validation';

vi.mock('@/lib/official-library-get-payload', () => ({
  fetchCachedOfficialColumnarItems: vi.fn(async () => []),
}));

const validBase: SaveArchetypeWithPathInput = {
  id: '5',
  name: 'Blade',
  type: 'martial',
  levels: [{ level: 2, feats: '1' }],
};

describe('saveArchetypeWithPathInputError', () => {
  it('accepts a well-formed workspace payload', () => {
    expect(saveArchetypeWithPathInputError(validBase)).toBeNull();
  });

  it('rejects unsupported top-level fields', () => {
    expect(
      saveArchetypeWithPathInputError({
        ...validBase,
        archetype_id: '9',
      } as SaveArchetypeWithPathInput),
    ).toMatch(/unsupported fields/i);
  });

  it('rejects ids that would be sanitized or non-numeric', () => {
    expect(saveArchetypeWithPathInputError({ ...validBase, id: '5;drop' })).toMatch(
      /numeric codex id/i,
    );
    expect(saveArchetypeWithPathInputError({ ...validBase, id: '05' })).toMatch(
      /canonical numeric/i,
    );
  });

  it('rejects malformed archetype JSON before coercion', () => {
    expect(
      saveArchetypeWithPathInputError({
        ...validBase,
        level1_recommended_abilities: { strength: [] },
      }),
    ).toMatch(/finite number/i);
    expect(
      saveArchetypeWithPathInputError({
        ...validBase,
        level1_loadouts: '""',
      }),
    ).toMatch(/JSON object or array/i);
  });

  it('rejects int4 overflow progression levels', () => {
    expect(
      saveArchetypeWithPathInputError({
        ...validBase,
        levels: [{ level: 2_147_483_648 }],
      }),
    ).toMatch(/database storage/i);
    expect(
      saveArchetypeWithPathInputError({
        ...validBase,
        levels: [{ level: 201 }],
      }),
    ).toBeNull();
  });

  it('rejects progression rows that would be silently dropped', () => {
    expect(
      saveArchetypeWithPathInputError({
        ...validBase,
        levels: [{ level: 1, feats: '1' }],
      }),
    ).toMatch(/level 1 is stored on the archetype row/i);

    expect(
      saveArchetypeWithPathInputError({
        ...validBase,
        levels: [{ level: Number.NaN }],
      }),
    ).toMatch(/integer/i);
  });

  it('rejects nested progression list fields with invalid element types', () => {
    expect(
      saveArchetypeWithPathInputError({
        ...validBase,
        levels: [{ level: 2, feats: { bad: true } as unknown as string }],
      }),
    ).toMatch(/string or array of strings/i);
  });

  it('rejects oversized progression arrays', () => {
    const levels = Array.from({ length: 201 }, (_, i) => ({ level: i + 2 }));
    expect(
      saveArchetypeWithPathInputError({
        ...validBase,
        levels,
      }),
    ).toMatch(/maximum of 200/i);
  });
});

describe('normalizeCodexCommaListColumn', () => {
  it.each([
    ['native array', ['1', '2'], '1, 2'],
    ['comma string', '1,2', '1, 2'],
    ['empty', '', null],
  ] as const)('normalizes %s to canonical TEXT storage', (_label, input, expected) => {
    expect(normalizeCodexCommaListColumn(input)).toBe(expected);
  });
});

describe('buildSaveArchetypePathValidationContext', () => {
  beforeEach(() => {
    vi.mocked(fetchCachedOfficialColumnarItems).mockClear();
    vi.mocked(fetchCachedOfficialColumnarItems).mockResolvedValue([]);
  });

  it('loads listed-only official items and powers (matches admin workspace)', async () => {
    const db = new FakeSupabase({
      codex_equipment: [],
      codex_skills: [],
      codex_parts: [],
      codex_properties: [],
    });
    await buildSaveArchetypePathValidationContext(db as never, validBase);
    expect(fetchCachedOfficialColumnarItems).toHaveBeenCalledWith(db, 'items', false);
    expect(fetchCachedOfficialColumnarItems).toHaveBeenCalledWith(db, 'powers', false);
  });
});

describe('saveArchetypeWithPathPublishError', () => {
  it('rejects innate recommendations on a pure martial path', () => {
    const error = saveArchetypeWithPathPublishError(
      {
        ...validBase,
        type: 'martial',
        level1_innate_powers: '99',
        martial_prof_start: 1,
      },
      {
        archetypeType: 'martial',
        martialProfStart: 1,
        resolveInnatePower: () => ({
          id: '99',
          name: 'Test',
          energy: 1,
          partIds: [],
          partNames: [],
        }),
      },
    );
    expect(error).toMatch(/Innate Energy > 0/i);
  });

  it('rejects unlisted innate ids when resolveInnatePower is listed-only', () => {
    const error = saveArchetypeWithPathPublishError(
      {
        ...validBase,
        type: 'powered-martial',
        power_prof_start: 2,
        martial_prof_start: 1,
        level1_innate_powers: 'unlisted-inn',
      },
      {
        archetypeType: 'powered-martial',
        powerProfStart: 2,
        martialProfStart: 1,
        resolveInnatePower: (id) =>
          id === 'inn'
            ? {
                id: 'inn',
                name: 'Listed only',
                energy: 1,
                partIds: [],
                partNames: [],
                actionType: 'basic',
              }
            : null,
      },
    );
    expect(error).toMatch(/not found in official library/i);
  });

  it('blocks loadout TP over budget like the admin workspace validator', () => {
    const error = saveArchetypeWithPathPublishError(
      {
        ...validBase,
        level1_loadouts: {
          loadouts: [
            {
              id: 'heavy',
              title: 'Heavy kit',
              armaments: [{ id: 'a', quantity: 1 }],
            },
          ],
        },
      },
      {
        resolveItemTrainingPoints: () => 10,
        trainingPointLimit: 5,
      },
    );
    expect(error).toMatch(/Heavy kit/i);
  });
});

describe('archetypePathDataFromSaveInput', () => {
  it('parses advanced JSON override fields from the save payload shape', () => {
    const pathData = archetypePathDataFromSaveInput({
      ...validBase,
      level1_innate_powers: '42',
      level1_guidance_groups: [{ id: 'g1', title: 'Starter', feats: ['1'] }],
    });
    expect(pathData?.level1?.innatePowers).toEqual(['42']);
    expect(pathData?.level1?.guidance_groups?.[0]?.id).toBe('g1');
  });
});

describe('normalizeSaveArchetypeWithPathInput', () => {
  const guidance = [{ id: 'g1', title: 'Starter', feats: ['1'] }];
  const abilities = { strength: 3 };
  const loadouts = { armorStep: 'optional', sharedEquipment: [{ id: '3', quantity: 2 }] };

  it('parses validated JSON strings into objects for persistence', () => {
    const normalized = normalizeSaveArchetypeWithPathInput({
      ...validBase,
      level1_guidance_groups: JSON.stringify(guidance),
      level1_recommended_abilities: JSON.stringify(abilities),
      level1_loadouts: JSON.stringify(loadouts),
    });
    expect(normalized.level1_guidance_groups).toEqual(guidance);
    expect(normalized.level1_recommended_abilities).toEqual(abilities);
    expect(normalized.level1_loadouts).toEqual(loadouts);
  });

  it('maps empty JSON inputs to null', () => {
    const normalized = normalizeSaveArchetypeWithPathInput({
      ...validBase,
      level1_guidance_groups: '',
      level1_recommended_abilities: '   ',
      level1_loadouts: null,
    });
    expect(normalized.level1_guidance_groups).toBeNull();
    expect(normalized.level1_recommended_abilities).toBeNull();
    expect(normalized.level1_loadouts).toBeNull();
  });
});
