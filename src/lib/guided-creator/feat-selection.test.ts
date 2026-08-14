import { describe, expect, it } from 'vitest';
import { applyCappedIdSelection, selectableCuratedFeatIds } from './feat-selection';

describe('applyCappedIdSelection', () => {
  it('adds under capacity', () => {
    expect(applyCappedIdSelection(['a'], 'b', 3)).toEqual(['a', 'b']);
  });

  it('toggles off when already selected', () => {
    expect(applyCappedIdSelection(['a', 'b'], 'a', 3)).toEqual(['b']);
  });

  it('swaps last pick at capacity', () => {
    expect(applyCappedIdSelection(['a', 'b', 'c'], 'd', 3)).toEqual(['a', 'b', 'd']);
  });

  it('replaces when max is 1', () => {
    expect(applyCappedIdSelection(['a'], 'b', 1)).toEqual(['b']);
  });
});

describe('selectableCuratedFeatIds', () => {
  const feats = [
    { id: '1', name: 'Open To All' },
    { id: '2', name: 'Needs Strength 3', ability_req: ['strength'], abil_req_val: [3] },
    { id: '3', name: 'Needs Level 4', lvl_req: 4 },
  ];

  const requirementCharacter = {
    level: 1,
    abilities: { strength: 1, vitality: 0, agility: 0, acuity: 0, intelligence: 0, charisma: 0 },
  };

  function selectable(ids: string[], selectedIds: string[] = []) {
    return selectableCuratedFeatIds({
      ids,
      feats,
      selectedIds,
      requirementCharacter,
      codexSkills: [],
    });
  }

  it('drops curated feats whose requirements the build does not meet', () => {
    expect(selectable(['1', '2', '3'])).toEqual(['1']);
  });

  it('keeps an already-selected feat visible so it stays deselectable', () => {
    expect(selectable(['1', '2'], ['2'])).toEqual(['1', '2']);
  });

  it('passes through ids with no codex match', () => {
    expect(selectable(['1', '999'])).toEqual(['1', '999']);
  });

  it('accepts numeric ids from path guidance groups', () => {
    expect(
      selectableCuratedFeatIds({
        ids: [1, 2],
        feats,
        selectedIds: [],
        requirementCharacter,
        codexSkills: [],
      })
    ).toEqual(['1']);
  });
});
