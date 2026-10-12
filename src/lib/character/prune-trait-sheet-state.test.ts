import { describe, expect, it } from 'vitest';
import type { CharacterAncestry } from '@/types';
import type { Species, Trait } from '@/hooks/codex-types';
import { pruneTraitSheetStateAfterAncestryChange } from './prune-trait-sheet-state';

const traitsDb: Trait[] = [
  { id: 'trait-lucky', name: 'Lucky', uses_per_rec: 3 },
  { id: 'trait-mycelial', name: 'Mycelial Control', uses_per_rec: 3 },
  { id: 'trait-brave', name: 'Brave', uses_per_rec: 0 },
];

const halfling: Species = {
  id: 'species-halfling',
  name: 'Halfling',
  species_traits: ['trait-lucky'],
  ancestry_traits: [],
  flaws: [],
};

const human: Species = {
  id: 'species-human',
  name: 'Human',
  species_traits: ['trait-brave'],
  ancestry_traits: [],
  flaws: [],
};

describe('pruneTraitSheetStateAfterAncestryChange (86e3jv9qf)', () => {
  it('removes traitUses for traits that are no longer on the character after a species switch', () => {
    const newAncestry: CharacterAncestry = {
      id: 'species-human',
      name: 'Human',
      selectedTraits: [],
    };

    const pruned = pruneTraitSheetStateAfterAncestryChange(
      {
        species: 'Halfling',
        ancestryTraits: [],
        traitUses: { Lucky: 0, 'Mycelial Control': 3 },
        traitCustomizations: {
          'trait-lucky': { customName: 'Extra lucky' },
          'trait-mycelial': { note: 'fungal' },
        },
      },
      newAncestry,
      [halfling, human],
      traitsDb,
    );

    expect(pruned.traitUses).toBeUndefined();
    expect(pruned.traitCustomizations).toBeUndefined();
  });

  it('keeps traitUses when the trait remains after switching back', () => {
    const halflingAncestry: CharacterAncestry = {
      id: 'species-halfling',
      name: 'Halfling',
      selectedTraits: [],
    };

    const pruned = pruneTraitSheetStateAfterAncestryChange(
      {
        species: 'Human',
        traitUses: { Lucky: 0 },
      },
      halflingAncestry,
      [halfling, human],
      traitsDb,
    );

    expect(pruned.traitUses).toEqual({ Lucky: 0 });
  });
});
