import { describe, expect, it } from 'vitest';
import {
  buildGuidedFeatsL2FilterOptions,
  buildGuidedFeatsL2Items,
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
  it('splits archetype vs character categories and abilities', () => {
    const feats = [
      feat({ id: '1', name: 'Strike', category: 'Combat', ability: 'strength', char_feat: false }),
      feat({ id: '2', name: 'Charm', category: 'Social', ability: 'fellowship', char_feat: true }),
    ];
    expect(buildGuidedFeatsL2FilterOptions(feats, 'archetype')).toEqual({
      categories: ['Combat'],
      abilities: ['strength'],
    });
    expect(buildGuidedFeatsL2FilterOptions(feats, 'character')).toEqual({
      categories: ['Social'],
      abilities: ['fellowship'],
    });
  });
});

describe('buildGuidedFeatsL2Items', () => {
  it('pins recommended feats and excludes blocked when showBlocked is false', () => {
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
      showBlocked: false,
    });
    expect(items.map((i) => i.id)).toEqual(['c', 'a']);
    expect(items[0]?.badges?.[0]?.label).toBe('Recommended');
  });

  it('includes blocked feats when showBlocked is true', () => {
    const feats = [
      feat({ id: 'a', name: 'Alpha', char_feat: false }),
      feat({ id: 'b', name: 'Bravo', char_feat: false, lvl_req: 5 }),
    ];
    const items = buildGuidedFeatsL2Items({
      featType: 'archetype',
      feats,
      recommendedIds: [],
      requirementCharacter: character,
      codexSkills: [],
      showBlocked: true,
    });
    expect(items.map((i) => i.id).sort()).toEqual(['a', 'b']);
    expect(items.find((i) => i.id === 'b')?.disabled).toBe(true);
  });
});

describe('selectedIdsFromFeatL2Items', () => {
  it('maps selectable rows to ids', () => {
    expect(
      selectedIdsFromFeatL2Items([
        { id: '1', name: 'A' },
        { id: '2', name: 'B' },
      ])
    ).toEqual(['1', '2']);
  });
});
