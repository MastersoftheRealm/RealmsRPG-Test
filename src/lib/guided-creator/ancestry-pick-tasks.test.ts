/**
 * Ancestry PickTask order + flaw-gated bonus trait (DEV-V-013-T061 / TASK-591).
 */

import { describe, expect, it } from 'vitest';
import type { Trait } from '@/hooks';
import {
  buildAncestryPickTasks,
  buildMixedAncestryPickTasks,
  type AncestryPickSpeciesInput,
} from './ancestry-pick-tasks';

function trait(
  partial: Pick<Trait, 'id' | 'name'> & Partial<Trait>
): Trait {
  return {
    description: '',
    ...partial,
  };
}

const traits: Trait[] = [
  trait({ id: 'st-parent', name: 'Heritage Choice', option_trait_ids: ['st-a', 'st-b'] }),
  trait({ id: 'st-a', name: 'Heritage A' }),
  trait({ id: 'st-b', name: 'Heritage B' }),
  trait({ id: 'char-1', name: 'Characteristic One' }),
  trait({ id: 'anc-1', name: 'Ancestry One' }),
  trait({ id: 'anc-2', name: 'Ancestry Two' }),
  trait({ id: 'flaw-1', name: 'Flaw One', flaw: true }),
];

const species: AncestryPickSpeciesInput = {
  species_traits: ['st-parent'],
  characteristics: ['char-1'],
  ancestry_traits: ['anc-1', 'anc-2'],
  flaws: ['flaw-1'],
};

describe('buildAncestryPickTasks', () => {
  it('orders characteristic before ancestry trait before optional flaw (no bonus without flaw)', () => {
    const tasks = buildAncestryPickTasks({
      species,
      allTraits: traits,
      selectedFlawId: null,
      selectedAncestryTraitIds: [],
    });

    expect(tasks.map((t) => t.phase)).toEqual([
      'species-trait-option',
      'characteristic',
      'ancestry-trait-1',
      'flaw',
    ]);
    expect(tasks.some((t) => t.phase === 'ancestry-trait-2')).toBe(false);
    // Characteristic is never immediately followed by flaw.
    const charIdx = tasks.findIndex((t) => t.phase === 'characteristic');
    expect(tasks[charIdx + 1]?.phase).toBe('ancestry-trait-1');
    expect(tasks[charIdx + 2]?.phase).toBe('flaw');
  });

  it('adds ancestry-trait-2 after flaw when a flaw id is selected', () => {
    const tasks = buildAncestryPickTasks({
      species,
      allTraits: traits,
      selectedFlawId: 'flaw-1',
      selectedAncestryTraitIds: ['anc-1'],
    });

    expect(tasks.map((t) => t.phase)).toEqual([
      'species-trait-option',
      'characteristic',
      'ancestry-trait-1',
      'flaw',
      'ancestry-trait-2',
    ]);

    const bonus = tasks.find((t) => t.phase === 'ancestry-trait-2');
    expect(bonus?.options.map((o) => o.id)).toEqual(['anc-2']);
  });

  it('does not add ancestry-trait-2 when flaw was explicitly skipped', () => {
    const tasks = buildAncestryPickTasks({
      species,
      allTraits: traits,
      selectedFlawId: '',
      selectedAncestryTraitIds: ['anc-1'],
    });

    expect(tasks.map((t) => t.phase)).toEqual([
      'species-trait-option',
      'characteristic',
      'ancestry-trait-1',
      'flaw',
    ]);
  });

  it('omits species-trait-option when species has no choice traits', () => {
    const tasks = buildAncestryPickTasks({
      species: {
        species_traits: [],
        characteristics: ['char-1'],
        ancestry_traits: ['anc-1'],
        flaws: ['flaw-1'],
      },
      allTraits: traits,
      selectedFlawId: null,
      selectedAncestryTraitIds: [],
    });

    expect(tasks.map((t) => t.phase)).toEqual([
      'characteristic',
      'ancestry-trait-1',
      'flaw',
    ]);
  });

  it('returns empty when trait catalog is empty', () => {
    expect(
      buildAncestryPickTasks({
        species,
        allTraits: [],
        selectedFlawId: null,
        selectedAncestryTraitIds: [],
      })
    ).toEqual([]);
  });
});

describe('buildMixedAncestryPickTasks', () => {
  const speciesA = {
    id: 'a',
    name: 'Alpha',
    species_traits: ['st-a1'],
    characteristics: ['char-1'],
    ancestry_traits: ['anc-1'],
    flaws: ['flaw-a'],
    skills: ['sk1', 'sk2'],
  };
  const speciesB = {
    id: 'b',
    name: 'Beta',
    species_traits: ['st-b1'],
    characteristics: ['char-1'],
    ancestry_traits: ['anc-2'],
    flaws: ['flaw-b'],
    skills: ['sk3', 'sk4'],
  };
  const mixedTraits: Trait[] = [
    trait({ id: 'st-a1', name: 'Trait A' }),
    trait({ id: 'st-b1', name: 'Trait B' }),
    trait({ id: 'char-1', name: 'Char' }),
    trait({ id: 'anc-1', name: 'Anc 1' }),
    trait({ id: 'anc-2', name: 'Anc 2' }),
    trait({ id: 'flaw-a', name: 'Flaw A', flaw: true }),
    trait({ id: 'flaw-b', name: 'Flaw B', flaw: true }),
  ];

  it('includes mixed trait picks and skill choice when parents have 4 skills', () => {
    const tasks = buildMixedAncestryPickTasks({
      speciesA: speciesA as never,
      speciesB: speciesB as never,
      allTraits: mixedTraits,
      allSkills: [
        { id: 'sk1', name: 'Skill 1' },
        { id: 'sk2', name: 'Skill 2' },
        { id: 'sk3', name: 'Skill 3' },
        { id: 'sk4', name: 'Skill 4' },
      ] as never,
      selectedFlawId: null,
      selectedAncestryTraitIds: [],
      selectedFlawSpeciesId: null,
    });

    expect(tasks.map((t) => t.phase)).toEqual([
      'mixed-species-trait-a',
      'mixed-species-trait-b',
      'mixed-species-skills',
      'characteristic',
      'ancestry-trait-1',
      'flaw',
    ]);
  });
});
