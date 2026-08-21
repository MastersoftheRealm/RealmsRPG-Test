import { describe, expect, it } from 'vitest';
import {
  buildGuidedMixedSpeciesDraftPatch,
  buildGuidedSingleSpeciesDraftPatch,
} from './species-selection-draft';

describe('buildGuidedSingleSpeciesDraftPatch', () => {
  it('same species re-select retains ancestry picks', () => {
    const patch = buildGuidedSingleSpeciesDraftPatch(
      { speciesId: 'human', speciesMixed: false },
      { id: 'human', name: 'Human' },
      ['medium', 'small'],
    );

    expect(patch).toEqual({
      speciesId: 'human',
      speciesName: 'Human',
      speciesMixed: false,
      mixedSpeciesIds: null,
      mixedSpeciesNames: null,
    });
    expect(patch).not.toHaveProperty('selectedSize');
    expect(patch).not.toHaveProperty('selectedFlawId');
  });

  it('species change clears ancestry and auto-picks a single size', () => {
    const patch = buildGuidedSingleSpeciesDraftPatch(
      { speciesId: 'human', speciesMixed: false },
      { id: 'elf', name: 'Elf' },
      ['medium'],
    );

    expect(patch.speciesId).toBe('elf');
    expect(patch.selectedSize).toBe('medium');
    expect(patch.selectedFlawId).toBeNull();
    expect(patch.selectedAncestryTraitIds).toEqual([]);
    expect(patch.selectedSpeciesTraitChoices).toEqual({});
  });

  it('leaving mixed for a single species clears ancestry', () => {
    const patch = buildGuidedSingleSpeciesDraftPatch(
      { speciesId: 'mixed:a+b', speciesMixed: true },
      { id: 'human', name: 'Human' },
      ['small', 'medium'],
    );

    expect(patch.speciesMixed).toBe(false);
    expect(patch.selectedSize).toBeNull();
    expect(patch.selectedSpeciesSkillIds).toEqual([]);
  });
});

describe('buildGuidedMixedSpeciesDraftPatch', () => {
  it('same pair re-confirm retains ancestry picks', () => {
    const patch = buildGuidedMixedSpeciesDraftPatch(
      {
        speciesId: 'mixed:a+b',
        speciesMixed: true,
        mixedSpeciesIds: ['a', 'b'],
      },
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    );

    expect(patch).toEqual({
      speciesId: 'mixed:a+b',
      speciesName: 'A / B',
      speciesMixed: true,
      mixedSpeciesIds: ['a', 'b'],
      mixedSpeciesNames: ['A', 'B'],
    });
    expect(patch).not.toHaveProperty('selectedFlawId');
  });

  it('changing a parent clears ancestry picks', () => {
    const patch = buildGuidedMixedSpeciesDraftPatch(
      {
        speciesId: 'mixed:a+b',
        speciesMixed: true,
        mixedSpeciesIds: ['a', 'b'],
      },
      { id: 'a', name: 'A' },
      { id: 'c', name: 'C' },
    );

    expect(patch.speciesId).toBe('mixed:a+c');
    expect(patch.mixedSpeciesIds).toEqual(['a', 'c']);
    expect(patch.selectedSize).toBeNull();
    expect(patch.selectedSpeciesTraits).toEqual([]);
    expect(patch.selectedFlawSpeciesId).toBeNull();
  });
});
