import { describe, expect, it } from 'vitest';
import type { CharacterAncestry } from '@/types';
import type { Species, Trait } from '@/hooks/codex-types';
import { mapCodexSpecies, mapCodexTrait } from '@/lib/codex/row-map';
import {
  pruneTraitSheetStateAfterAncestryChange,
  type PruneTraitSheetStateCharacterInput,
} from './prune-trait-sheet-state';

const traitsDb: Trait[] = [
  mapCodexTrait({ id: 'trait-lucky', name: 'Lucky', uses_per_rec: 3 }),
  mapCodexTrait({ id: 'trait-mycelial', name: 'Mycelial Control', uses_per_rec: 3 }),
  mapCodexTrait({ id: 'trait-brave', name: 'Brave', uses_per_rec: 0 }),
];

const halfling: Species = mapCodexSpecies({
  id: 'species-halfling',
  name: 'Halfling',
  species_traits: 'trait-lucky',
  ancestry_traits: '',
  flaws: '',
});

const human: Species = mapCodexSpecies({
  id: 'species-human',
  name: 'Human',
  species_traits: 'trait-brave',
  ancestry_traits: '',
  flaws: '',
});

describe('pruneTraitSheetStateAfterAncestryChange (86e3jv9qf)', () => {
  it('removes traitUses for traits that are no longer on the character after a species switch', () => {
    const newAncestry: CharacterAncestry = {
      id: 'species-human',
      name: 'Human',
      selectedTraits: [],
    };

    const character: PruneTraitSheetStateCharacterInput = {
      species: 'Halfling',
      ancestryTraits: [],
      traitUses: { Lucky: 0, 'Mycelial Control': 3 },
      traitCustomizations: {
        'trait-lucky': { customName: 'Extra lucky' },
        'trait-mycelial': { note: 'fungal' },
      },
    };

    const pruned = pruneTraitSheetStateAfterAncestryChange(
      character,
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

    const character: PruneTraitSheetStateCharacterInput = {
      species: 'Human',
      traitUses: { Lucky: 0 },
    };

    const pruned = pruneTraitSheetStateAfterAncestryChange(
      character,
      halflingAncestry,
      [halfling, human],
      traitsDb,
    );

    expect(pruned.traitUses).toEqual({ Lucky: 0 });
  });

  it('keeps uses stored under the custom name of a trait that remains', () => {
    const halflingAncestry: CharacterAncestry = {
      id: 'species-halfling',
      name: 'Halfling',
      selectedTraits: [],
    };

    const character: PruneTraitSheetStateCharacterInput = {
      species: 'Halfling',
      traitUses: { Lucky: 1, 'Extra lucky': 0, 'Spore mind': 3 },
      traitCustomizations: {
        'trait-lucky': { customName: 'Extra lucky' },
        'trait-mycelial': { customName: 'Spore mind', note: 'fungal' },
      },
    };

    const pruned = pruneTraitSheetStateAfterAncestryChange(
      character,
      halflingAncestry,
      [halfling, human],
      traitsDb,
    );

    expect(pruned.traitUses).toEqual({ Lucky: 1, 'Extra lucky': 0 });
    expect(pruned.traitCustomizations).toEqual({
      'trait-lucky': { customName: 'Extra lucky' },
    });
  });
});
