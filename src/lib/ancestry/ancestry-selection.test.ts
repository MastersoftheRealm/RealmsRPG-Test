import { describe, expect, it } from 'vitest';
import type { Species, Trait } from '@/hooks';
import {
  areSpeciesTraitChoicesComplete,
  buildMixedSpeciesAncestryDraft,
  buildMixedSpeciesSkillOptions,
  buildSingleSpeciesAncestryDraft,
  canContinueAncestryMixed,
  canContinueAncestrySingle,
  combineSpeciesSizes,
  hasRequiredMixedSpeciesSkills,
  resolveAncestryTraitBuckets,
  toggleCappedTraitSelection,
  toggleMixedSpeciesSkillSelection,
  toggleOptionalSingleSelection,
  trimTraitsForFlawMax,
} from './ancestry-selection';

const traits = [
  { id: 'st1', name: 'Species Trait 1', description: '', option_trait_ids: ['opt1', 'opt2'] },
  { id: 'opt1', name: 'Option 1', description: '' },
  { id: 'opt2', name: 'Option 2', description: '' },
  { id: 'a1', name: 'Ancestry 1', description: '' },
  { id: 'a2', name: 'Ancestry 2', description: '' },
  { id: 'f1', name: 'Flaw 1', description: '' },
  { id: 'c1', name: 'Char 1', description: '' },
] as Trait[];

const speciesA = {
  id: 'sa',
  name: 'Alpha',
  description: '',
  type: 'humanoid',
  species_traits: ['st1'],
  ancestry_traits: ['a1', 'a2'],
  flaws: ['f1'],
  characteristics: ['c1'],
  sizes: ['small', 'medium'],
  size: 'medium',
  speed: 30,
  skills: ['sk1', 'sk2'],
  languages: [],
} as unknown as Species;

const speciesB = {
  id: 'sb',
  name: 'Beta',
  description: '',
  type: 'humanoid',
  species_traits: [],
  ancestry_traits: ['a2', 'a1'],
  flaws: ['f1'],
  characteristics: ['c1'],
  sizes: [],
  size: 'large',
  speed: 30,
  skills: ['sk2', 'sk3'],
  languages: [],
} as unknown as Species;

describe('resolveAncestryTraitBuckets', () => {
  it('resolves single-species buckets', () => {
    const buckets = resolveAncestryTraitBuckets({
      selectedSpecies: speciesA,
      speciesA: null,
      speciesB: null,
      allTraits: traits,
    });
    expect(buckets.speciesTraits.map((t) => t.id)).toEqual(['st1']);
    expect(buckets.ancestryTraits.map((t) => t.id)).toEqual(['a1', 'a2']);
  });

  it('dedupes mixed ancestry/flaw/characteristic ids', () => {
    const buckets = resolveAncestryTraitBuckets({
      selectedSpecies: null,
      speciesA,
      speciesB,
      allTraits: traits,
    });
    expect(buckets.speciesTraits).toEqual([]);
    expect(buckets.ancestryTraits.map((t) => t.id)).toEqual(['a1', 'a2']);
    expect(buckets.flaws.map((t) => t.id)).toEqual(['f1']);
  });
});

describe('combineSpeciesSizes / skill options', () => {
  it('combines unique sizes (max 4)', () => {
    expect(combineSpeciesSizes(speciesA, speciesB)).toEqual(['small', 'medium', 'large']);
  });

  it('builds unique mixed skill options', () => {
    const skills = [
      { id: 'sk1', name: 'Stealth', description: '', ability: 'agility' },
      { id: 'sk2', name: 'Athletics', description: '', ability: 'strength' },
      { id: 'sk3', name: 'Arcana', description: '', ability: 'intelligence' },
    ];
    expect(buildMixedSpeciesSkillOptions(speciesA, speciesB, skills as never)).toEqual([
      { id: 'sk1', name: 'Stealth', description: undefined },
      { id: 'sk2', name: 'Athletics', description: undefined },
      { id: 'sk3', name: 'Arcana', description: undefined },
    ]);
  });

  it('includes codex skill descriptions on mixed skill options', () => {
    const skills = [
      { id: 'sk1', name: 'Stealth', description: 'Move unseen.', ability: 'agility' },
      { id: 'sk2', name: 'Athletics', description: '', ability: 'strength' },
      { id: 'sk3', name: 'Arcana', description: '', ability: 'intelligence' },
    ];
    const options = buildMixedSpeciesSkillOptions(speciesA, speciesB, skills as never);
    expect(options[0]).toEqual({ id: 'sk1', name: 'Stealth', description: 'Move unseen.' });
  });
});

describe('draft builders', () => {
  it('builds single and mixed drafts', () => {
    expect(buildSingleSpeciesAncestryDraft(speciesA)).toMatchObject({
      id: 'sa',
      name: 'Alpha',
      mixed: false,
      selectedTraits: [],
    });
    expect(
      buildMixedSpeciesAncestryDraft({ id: 'sa', name: 'Alpha' }, { id: 'sb', name: 'Beta' }),
    ).toMatchObject({
      id: 'mixed:sa+sb',
      name: 'Alpha / Beta',
      mixed: true,
      speciesIds: ['sa', 'sb'],
    });
  });
});

describe('gates and toggles', () => {
  it('requires choice-trait option picks for single continue', () => {
    expect(
      canContinueAncestrySingle({
        selectedTraitIds: ['a1'],
        ancestryTraitCount: 2,
        speciesChoiceParents: [traits[0]],
        speciesTraitChoices: {},
      }),
    ).toBe(false);
    expect(areSpeciesTraitChoicesComplete([traits[0]], { st1: 'opt1' })).toBe(true);
    expect(
      canContinueAncestrySingle({
        selectedTraitIds: ['a1'],
        ancestryTraitCount: 2,
        speciesChoiceParents: [traits[0]],
        speciesTraitChoices: { st1: 'opt1' },
      }),
    ).toBe(true);
  });

  it('gates mixed ancestry continue', () => {
    expect(
      canContinueAncestryMixed({
        selectedSpeciesTraits: ['st1', 'x'],
        selectedTraitIds: ['a1'],
        ancestryTraitCount: 2,
        selectedSize: 'medium',
        mixedSkillOptionCount: 3,
        selectedSpeciesSkillIds: ['sk1', 'sk2'],
      }),
    ).toBe(true);
    expect(hasRequiredMixedSpeciesSkills(1, 1)).toBe(true);
    expect(hasRequiredMixedSpeciesSkills(3, 1)).toBe(false);
  });

  it('toggles capped / optional / mixed skills', () => {
    expect(toggleCappedTraitSelection(['a1'], 'a2', 1)).toEqual(['a2']);
    expect(toggleOptionalSingleSelection('f1', 'f1')).toBeNull();
    expect(trimTraitsForFlawMax(['a1', 'a2'], null)).toEqual(['a1']);
    expect(toggleMixedSpeciesSkillSelection(['sk1'], 'sk2')).toEqual(['sk1', 'sk2']);
    expect(toggleMixedSpeciesSkillSelection(['sk1', 'sk2'], 'sk1')).toEqual(['sk2']);
  });
});
