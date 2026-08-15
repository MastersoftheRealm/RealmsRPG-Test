import { describe, expect, it } from 'vitest';
import {
  parseOptionalJsonField,
  parseIdQuantityStrings,
  serializeIdQuantityStrings,
  parseRecommendedAbilities,
  parseArchetypePathData,
  filterFeatGuidanceGroups,
  resolvePathGuidanceAudience,
  unionFeatIdsFromGuidanceGroups,
} from '@/lib/game/archetype-path';

describe('parseOptionalJsonField', () => {
  it('treats empty / whitespace as null (ok)', () => {
    expect(parseOptionalJsonField('', 'Recommended abilities')).toEqual({ ok: true, value: null });
    expect(parseOptionalJsonField('   ', 'Recommended abilities')).toEqual({
      ok: true,
      value: null,
    });
  });

  it('parses valid JSON object', () => {
    expect(parseOptionalJsonField('{"strength": 3}', 'Recommended abilities')).toEqual({
      ok: true,
      value: { strength: 3 },
    });
  });

  it('returns labeled error for invalid JSON', () => {
    const result = parseOptionalJsonField('{ not json', 'Advanced Path JSON');
    expect(result).toEqual({ ok: false, error: 'Advanced Path JSON must be valid JSON.' });
  });
});

describe('parseIdQuantityStrings', () => {
  it('parses bare ids with default quantity 1', () => {
    expect(parseIdQuantityStrings(['sword', 'shield'])).toEqual([
      { id: 'sword', quantity: 1 },
      { id: 'shield', quantity: 1 },
    ]);
  });

  it('parses id:qty and clamps invalid/low quantities to 1', () => {
    expect(parseIdQuantityStrings(['torch:5', 'ration:0', 'rope:abc'])).toEqual([
      { id: 'torch', quantity: 5 },
      { id: 'ration', quantity: 1 },
      { id: 'rope', quantity: 1 },
    ]);
  });

  it('drops empty ids and trims whitespace', () => {
    expect(parseIdQuantityStrings([' axe : 2 ', '', ':3'])).toEqual([{ id: 'axe', quantity: 2 }]);
  });

  it('splits on the first colon (not lastIndexOf)', () => {
    expect(parseIdQuantityStrings(['ns:item:5', 'plain:2'])).toEqual([
      { id: 'ns', quantity: 1 },
      { id: 'plain', quantity: 2 },
    ]);
  });
});

describe('serializeIdQuantityStrings', () => {
  it('omits :qty when quantity is 1 and keeps it otherwise', () => {
    expect(
      serializeIdQuantityStrings([
        { id: 'sword', quantity: 1 },
        { id: 'torch', quantity: 5 },
      ]),
    ).toEqual(['sword', 'torch:5']);
  });

  it('round-trips through parseIdQuantityStrings', () => {
    const entries = [
      { id: 'sword', quantity: 1 },
      { id: 'torch', quantity: 3 },
    ];
    expect(parseIdQuantityStrings(serializeIdQuantityStrings(entries))).toEqual(entries);
  });
});

describe('parseRecommendedAbilities', () => {
  it('keeps only known ability keys with finite values', () => {
    expect(
      parseRecommendedAbilities({ strength: 3, vitality: '2', bogus: 9, charisma: NaN }),
    ).toEqual({ strength: 3, vitality: 2 });
  });

  it('returns undefined for empty / non-object input', () => {
    expect(parseRecommendedAbilities({})).toBeUndefined();
    expect(parseRecommendedAbilities(null)).toBeUndefined();
    expect(parseRecommendedAbilities('nope')).toBeUndefined();
  });
});

describe('PathGuidanceGroup audience (TASK-514)', () => {
  it('parses explicit audience and backfills from title for feat groups', () => {
    const parsed = parseArchetypePathData({
      level1: {
        guidance_groups: [
          { id: 'c1', title: 'Character vibe', feats: ['10'] },
          { id: 'a1', title: 'Devastating strikes', audience: 'archetype', feats: ['20', '21'] },
          { id: 'kit', title: 'Weapon picks', armaments: ['w1'] },
        ],
      },
    });
    const groups = parsed?.level1?.guidance_groups ?? [];
    expect(resolvePathGuidanceAudience(groups[0]!)).toBe('character');
    expect(groups[0]?.audience).toBe('character');
    expect(groups[1]?.audience).toBe('archetype');
    expect(groups[2]?.audience).toBeUndefined();
    expect(filterFeatGuidanceGroups(groups, 'character').map((g) => g.id)).toEqual(['c1']);
    expect(filterFeatGuidanceGroups(groups, 'archetype').map((g) => g.id)).toEqual(['a1']);
    expect(unionFeatIdsFromGuidanceGroups(groups)).toEqual(['10', '20', '21']);
  });

  it('does not keep recommended_species on parsed level1', () => {
    const parsed = parseArchetypePathData({
      level1: {
        feats: ['1'],
        recommended_species: ['4', '6'],
      },
    });
    expect(parsed?.level1?.feats).toEqual(['1']);
    expect(
      (parsed?.level1 as { recommended_species?: string[] } | undefined)?.recommended_species,
    ).toBeUndefined();
  });
});
