import { describe, expect, it } from 'vitest';
import {
  buildGuidedFeatsL2FilterOptions,
  buildGuidedFeatsL2Items,
  FEATS_L2_HEADER_COLUMNS,
  selectedIdsFromFeatL2Items,
} from './feats-l2';
import type { Feat } from '@/hooks';
import type { CharacterForFeatRequirement } from '@/lib/game/feat-requirements';

function feat(partial: Partial<Feat> & { id: string; name: string }): Feat {
  return {
    description: '',
    category: 'General',
    char_feat: false,
    ...partial,
  } as Feat;
}

const character: CharacterForFeatRequirement = {
  level: 1,
  abilities: {
    strength: 2,
    vitality: 2,
    agility: 2,
    acuity: 2,
    intelligence: 2,
    charisma: 2,
  },
  skills: [],
  feats: [],
  archetypeFeats: [],
};

describe('buildGuidedFeatsL2FilterOptions', () => {
  it('splits archetype vs character categories', () => {
    const feats = [
      feat({ id: '1', name: 'Strike', category: 'Combat', char_feat: false }),
      feat({ id: '2', name: 'Charm', category: 'Social', char_feat: true }),
    ];
    expect(buildGuidedFeatsL2FilterOptions(feats, 'archetype')).toEqual({
      categories: ['Combat'],
    });
    expect(buildGuidedFeatsL2FilterOptions(feats, 'character')).toEqual({
      categories: ['Social'],
    });
  });
});

describe('buildGuidedFeatsL2Items', () => {
  it('pins recommended feats first and hides unmet-requirement feats', () => {
    const feats = [
      feat({ id: 'a', name: 'Alpha', char_feat: false }),
      feat({ id: 'b', name: 'Bravo', char_feat: false, lvl_req: 5 }),
      feat({ id: 'c', name: 'Charlie', char_feat: false }),
    ];
    const items = buildGuidedFeatsL2Items({
      featType: 'archetype',
      feats,
      recommendedIds: ['c'],
      requirementCharacter: character,
      codexSkills: [],
    });
    expect(items.map((i) => i.id)).toEqual(['c', 'a']);
    expect(items[0]?.badges?.[0]?.label).toBe('Recommended');
    expect(items.find((i) => i.id === 'b')).toBeUndefined();
  });

  it('keeps selected unmet feats visible so they can be deselected', () => {
    const feats = [
      feat({ id: 'a', name: 'Alpha', char_feat: false }),
      feat({ id: 'b', name: 'Bravo', char_feat: false, lvl_req: 5 }),
    ];
    const items = buildGuidedFeatsL2Items({
      featType: 'archetype',
      feats,
      recommendedIds: [],
      selectedIds: ['b'],
      requirementCharacter: character,
      codexSkills: [],
    });
    expect(items.map((i) => i.id).sort()).toEqual(['a', 'b']);
    expect(items.find((i) => i.id === 'b')?.disabled).toBe(true);
  });

  it('keeps selected feats in items when category filter would hide them', () => {
    const feats = [
      feat({ id: 'a', name: 'Alpha', category: 'Combat', char_feat: false }),
      feat({ id: 'b', name: 'Bravo', category: 'Social', char_feat: false }),
    ];
    const items = buildGuidedFeatsL2Items({
      featType: 'archetype',
      feats,
      recommendedIds: [],
      selectedIds: ['a'],
      requirementCharacter: character,
      codexSkills: [],
      categories: ['Social'],
    });
    expect(items.map((i) => i.id).sort()).toEqual(['a', 'b']);
  });

  it('uses Codex-backed creator columns without req level (TASK-758)', () => {
    const feats = [
      feat({
        id: 'a',
        name: 'Alpha',
        char_feat: false,
        lvl_req: 1,
        category: 'Combat',
        ability: ['Strength'],
        uses_per_rec: 1,
        rec_period: 'Rest',
      }),
    ];
    const items = buildGuidedFeatsL2Items({
      featType: 'archetype',
      feats,
      recommendedIds: [],
      requirementCharacter: character,
      codexSkills: [],
    });
    expect(items).toHaveLength(1);
    expect(FEATS_L2_HEADER_COLUMNS.map((column) => column.key)).toEqual([
      'name',
      'category',
      'ability',
      'uses_per_rec',
      'rec_period',
    ]);
    expect(items[0]?.columns?.map((c) => c.key)).toEqual([
      'category',
      'ability',
      'uses_per_rec',
      'rec_period',
    ]);
    expect(items[0]?.columns?.some((c) => c.key === 'lvl_req')).toBe(false);
  });

  it('filters by stateFeatMode', () => {
    const feats = [
      feat({ id: 'a', name: 'Alpha', char_feat: false, state_feat: true }),
      feat({ id: 'b', name: 'Bravo', char_feat: false, state_feat: false }),
    ];
    const onlyState = buildGuidedFeatsL2Items({
      featType: 'archetype',
      feats,
      recommendedIds: [],
      requirementCharacter: character,
      codexSkills: [],
      stateFeatMode: 'only',
    });
    expect(onlyState.map((i) => i.id)).toEqual(['a']);

    const hideState = buildGuidedFeatsL2Items({
      featType: 'archetype',
      feats,
      recommendedIds: [],
      requirementCharacter: character,
      codexSkills: [],
      stateFeatMode: 'hide',
    });
    expect(hideState.map((i) => i.id)).toEqual(['b']);
  });

  it('path-filters to the selected-path union and shows path chips instead of Recommended', () => {
    const feats = [
      feat({ id: 'a', name: 'Alpha', char_feat: false }),
      feat({ id: 'b', name: 'Bravo', char_feat: false }),
      feat({ id: 'c', name: 'Charlie', char_feat: false }),
    ];
    const pathIndex = {
      options: [{ id: 'p-monk', name: 'Monk', type: 'martial' as const }],
      entityIdsByPathId: new Map([['p-monk', new Set(['a'])]]),
    };
    const items = buildGuidedFeatsL2Items({
      featType: 'archetype',
      feats,
      recommendedIds: ['c'],
      requirementCharacter: character,
      codexSkills: [],
      pathIndex,
      selectedPathIds: ['p-monk'],
    });
    expect(items.map((i) => i.id)).toEqual(['a']);
    expect(items[0]?.badges?.map((b) => b.label)).toEqual(['Monk']);
    expect(items[0]?.showBadgesInName).toBe(true);
  });

  it('keeps legal family ranks when only one rank is path-recommended', () => {
    const feats = [
      feat({ id: 'a', name: 'Strike', char_feat: false, feat_lvl: 1 }),
      feat({
        id: 'a2',
        name: 'Strike',
        char_feat: false,
        feat_lvl: 2,
        base_feat_id: 'a',
      }),
      feat({ id: 'b', name: 'Other', char_feat: false }),
    ];
    const pathIndex = {
      options: [{ id: 'p-monk', name: 'Monk', type: 'martial' as const }],
      entityIdsByPathId: new Map([['p-monk', new Set(['a'])]]),
    };
    const items = buildGuidedFeatsL2Items({
      featType: 'archetype',
      feats,
      recommendedIds: [],
      requirementCharacter: character,
      codexSkills: [],
      pathIndex,
      selectedPathIds: ['p-monk'],
    });
    expect(items.map((i) => i.id)).toEqual(['a']);
    const featLevels = items[0]?.detailSections?.find((section) => section.label === 'Feat Levels');
    expect(featLevels?.chips).toHaveLength(1);
  });

  it('clears the path filter back to the full eligible catalog', () => {
    const feats = [
      feat({ id: 'a', name: 'Alpha', char_feat: false }),
      feat({ id: 'b', name: 'Bravo', char_feat: false }),
    ];
    const pathIndex = {
      options: [{ id: 'p-monk', name: 'Monk', type: 'martial' as const }],
      entityIdsByPathId: new Map([['p-monk', new Set(['a'])]]),
    };
    const filtered = buildGuidedFeatsL2Items({
      featType: 'archetype',
      feats,
      recommendedIds: [],
      requirementCharacter: character,
      codexSkills: [],
      pathIndex,
      selectedPathIds: ['p-monk'],
    });
    const cleared = buildGuidedFeatsL2Items({
      featType: 'archetype',
      feats,
      recommendedIds: [],
      requirementCharacter: character,
      codexSkills: [],
      pathIndex,
      selectedPathIds: [],
    });
    expect(filtered.map((i) => i.id)).toEqual(['a']);
    expect(cleared.map((i) => i.id).sort()).toEqual(['a', 'b']);
  });
});

describe('selectedIdsFromFeatL2Items', () => {
  it('maps selectable rows to ids', () => {
    expect(
      selectedIdsFromFeatL2Items([
        { id: '1', name: 'A' },
        { id: '2', name: 'B' },
      ]),
    ).toEqual(['1', '2']);
  });
});
