/**
 * Resolve guided creator species context (single or mixed parents).
 */

import type { Species } from '@/hooks';
import type { GuidedDraft } from '@/stores/guided-creator-store';

export interface GuidedSpeciesContext {
  isMixed: boolean;
  species: Species | null;
  speciesA: Species | null;
  speciesB: Species | null;
  displayName: string | null;
  ready: boolean;
}

export function resolveGuidedSpeciesContext(
  draft: Pick<
    GuidedDraft,
    'speciesId' | 'speciesName' | 'speciesMixed' | 'mixedSpeciesIds' | 'mixedSpeciesNames'
  >,
  allSpecies: Species[],
): GuidedSpeciesContext {
  if (draft.speciesMixed && draft.mixedSpeciesIds) {
    const [idA, idB] = draft.mixedSpeciesIds;
    const speciesA = allSpecies.find((s) => String(s.id) === String(idA)) ?? null;
    const speciesB = allSpecies.find((s) => String(s.id) === String(idB)) ?? null;
    return {
      isMixed: true,
      species: null,
      speciesA,
      speciesB,
      displayName: draft.speciesName,
      ready: Boolean(speciesA && speciesB),
    };
  }

  const species = draft.speciesId
    ? (allSpecies.find((s) => String(s.id) === String(draft.speciesId)) ?? null)
    : null;

  return {
    isMixed: false,
    species,
    speciesA: null,
    speciesB: null,
    displayName: species?.name ?? draft.speciesName,
    ready: Boolean(species),
  };
}
