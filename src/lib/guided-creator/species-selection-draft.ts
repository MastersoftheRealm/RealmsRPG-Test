/**
 * Guided species / mixed-species draft patches (Species step + Ancestry change-parents).
 */

import type { GuidedDraft } from '@/stores/guided-creator-store';

type GuidedSpeciesPick = { id: string; name: string };

function mixedSpeciesDraftId(speciesAId: string, speciesBId: string): string {
  return `mixed:${speciesAId}+${speciesBId}`;
}

function clearAncestryDependentDraftFields(): Partial<GuidedDraft> {
  return {
    selectedSize: null,
    selectedSpeciesTraitChoices: {},
    selectedAncestryTraitIds: [],
    selectedCharacteristicId: null,
    selectedFlawId: null,
    selectedSpeciesSkillIds: [],
    selectedSpeciesTraits: [],
    selectedFlawSpeciesId: null,
  };
}

export function buildGuidedSingleSpeciesDraftPatch(
  current: Pick<GuidedDraft, 'speciesId' | 'speciesMixed'>,
  species: GuidedSpeciesPick,
  sizeOptions: string[]
): Partial<GuidedDraft> {
  const nextId = String(species.id);
  const changed = current.speciesId !== nextId || current.speciesMixed;
  return {
    speciesId: nextId,
    speciesName: species.name,
    speciesMixed: false,
    mixedSpeciesIds: null,
    mixedSpeciesNames: null,
    ...(changed ? clearAncestryDependentDraftFields() : {}),
    ...(changed && sizeOptions.length === 1 ? { selectedSize: sizeOptions[0] } : {}),
  };
}

export function buildGuidedMixedSpeciesDraftPatch(
  current: Pick<GuidedDraft, 'speciesId' | 'speciesMixed' | 'mixedSpeciesIds'>,
  speciesA: GuidedSpeciesPick,
  speciesB: GuidedSpeciesPick
): Partial<GuidedDraft> {
  const idA = String(speciesA.id);
  const idB = String(speciesB.id);
  const nextId = mixedSpeciesDraftId(idA, idB);
  const changed =
    current.speciesId !== nextId ||
    !current.speciesMixed ||
    current.mixedSpeciesIds?.[0] !== idA ||
    current.mixedSpeciesIds?.[1] !== idB;
  return {
    speciesId: nextId,
    speciesName: `${speciesA.name} / ${speciesB.name}`,
    speciesMixed: true,
    mixedSpeciesIds: [idA, idB],
    mixedSpeciesNames: [speciesA.name, speciesB.name],
    ...(changed ? clearAncestryDependentDraftFields() : {}),
  };
}
