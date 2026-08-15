import { describe, expect, it } from 'vitest';
import type { Feat } from '@/hooks';
import { buildFeatDetailSections, featPathChipNames, filterFeats, type FeatListFilters } from './feat-list';
import { parseArchetypePathData } from '@/lib/game/archetype-path';
import { buildPathRecommendationIndex, pathRecommendedEntityIds } from '@/lib/game/path-recommendation-index';

function minimalFeat(overrides: Partial<Feat> = {}): Feat {
  return {
    id: '1',
    name: 'Test Feat',
    description: '',
    category: 'Utility',
    ability_req: [],
    abil_req_val: [],
    tags: [],
    skill_req: [],
    skill_req_val: [],
    lvl_req: 0,
    uses_per_rec: 0,
    char_feat: false,
    state_feat: false,
    ...overrides,
  };
}

describe('buildFeatDetailSections', () => {
  const skillIdToName = new Map<string, string>([['34', 'Perceive']]);

  it('places Tags last and always labels the section (no hideLabelIfSingle)', () => {
    const feat = minimalFeat({
      char_feat: true,
      tags: ['Craft'],
      ability_req: ['Strength'],
      abil_req_val: [3],
      skill_req: ['34'],
      skill_req_val: [0],
    });

    const familyLevels: Feat[] = [
      minimalFeat({ id: '1', feat_lvl: 1 }),
      minimalFeat({ id: '2', feat_lvl: 2, base_feat_id: '1', lvl_req: 4 }),
    ];

    const sections = buildFeatDetailSections(feat, skillIdToName, familyLevels);
    const labels = sections.map((s) => s.label);

    expect(labels).toEqual([
      'Type',
      'Ability Requirements',
      'Skill Requirements',
      'Feat Levels',
      'Tags',
    ]);

    const tagsSection = sections.find((s) => s.label === 'Tags');
    expect(tagsSection?.chips.map((c) => c.name)).toEqual(['Craft']);
    expect(tagsSection?.hideLabelIfSingle).toBeUndefined();
  });

  it('omits Tags when feat has no tags', () => {
    const sections = buildFeatDetailSections(minimalFeat(), skillIdToName, []);
    expect(sections.some((s) => s.label === 'Tags')).toBe(false);
  });
});

describe('filterFeats — Archetype Path filter (TASK-751)', () => {
  const feats: Feat[] = [
    minimalFeat({ id: '10', name: 'Flurry', category: 'Combat' }),
    minimalFeat({ id: '11', name: 'Iron Body', category: 'Utility', lvl_req: 5 }),
    minimalFeat({ id: '12', name: 'Reckless Swing', category: 'Combat' }),
    minimalFeat({ id: '13', name: 'Flurry', category: 'Combat', feat_lvl: 2, base_feat_id: '10' }),
  ];

  const baseFilters: FeatListFilters = {
    search: '',
    maxLevel: null,
    abilityRequirements: [],
    categories: [],
    abilities: [],
    tags: [],
    tagMode: 'all',
    featTypeMode: 'all',
    stateFeatMode: 'all',
  };

  const index = buildPathRecommendationIndex({
    paths: [
      {
        id: 'p-monk',
        name: 'Monk',
        type: 'martial',
        path_data: parseArchetypePathData({
          level1: { feats: ['10'] },
          levels: [{ level: 5, feats: ['11'] }],
        }),
      },
      {
        id: 'p-berserker',
        name: 'Berserker',
        type: 'martial',
        path_data: parseArchetypePathData({ level1: { feats: ['12'] } }),
      },
    ],
    entities: feats,
    kind: 'feats',
  });

  const idsFor = (pathIds: string[]) => pathRecommendedEntityIds(index, pathIds);

  it('keeps only feats the selected paths recommend, plus their family ranks', () => {
    const monkOnly = filterFeats(feats, baseFilters, { pathRecommendedIds: idsFor(['p-monk']) });
    // 13 is Flurry level 2 — same family as the recommended 10, so the family stays whole.
    expect(monkOnly.map((f) => f.id).sort()).toEqual(['10', '11', '13']);
  });

  it('unions multiple paths', () => {
    const both = filterFeats(feats, baseFilters, {
      pathRecommendedIds: idsFor(['p-monk', 'p-berserker']),
    });
    expect(both.map((f) => f.id).sort()).toEqual(['10', '11', '12', '13']);
  });

  it('leaves the list untouched with no path filter', () => {
    expect(filterFeats(feats, baseFilters, { pathRecommendedIds: null })).toHaveLength(4);
    expect(filterFeats(feats, baseFilters)).toHaveLength(4);
  });

  it('composes with the required-level filter (path level does not override lvl_req)', () => {
    const capped = filterFeats(feats, { ...baseFilters, maxLevel: 1 }, {
      pathRecommendedIds: idsFor(['p-monk']),
    });
    expect(capped.map((f) => f.id).sort()).toEqual(['10', '13']);
  });

  it('composes with the category filter', () => {
    const combatOnly = filterFeats(feats, { ...baseFilters, categories: ['Utility'] }, {
      pathRecommendedIds: idsFor(['p-monk']),
    });
    expect(combatOnly.map((f) => f.id)).toEqual(['11']);
  });

  it('chips a feat with the selected paths that recommend it (family base included)', () => {
    const flurryLevel2 = feats.find((f) => f.id === '13')!;
    expect(featPathChipNames(index, flurryLevel2, ['p-monk', 'p-berserker'])).toEqual(['Monk']);
    expect(featPathChipNames(index, feats[2]!, ['p-monk', 'p-berserker'])).toEqual(['Berserker']);
    expect(featPathChipNames(index, feats[0]!, [])).toEqual([]);
  });
});
