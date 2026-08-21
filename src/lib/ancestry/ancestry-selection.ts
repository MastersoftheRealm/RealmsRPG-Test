/**
 * Shared ancestry selection helpers for Advanced creator + sheet Edit Species.
 * Pure functions only — no React.
 */

import { getChoiceOptionIds } from '@/lib/choice-trait';
import { speciesSkillToSummaryChipItem } from '@/lib/chip/species-skill-chips';
import { resolveTraitIds, type Species, type Skill, type Trait } from '@/hooks';
import type { CharacterAncestry } from '@/types';

export type AncestryTraitBuckets = {
  speciesTraits: Trait[];
  ancestryTraits: Trait[];
  flaws: Trait[];
  characteristics: Trait[];
};

export type NamedIdOption = { id: string; name: string; description?: string | undefined };

const EMPTY_BUCKETS: AncestryTraitBuckets = {
  speciesTraits: [],
  ancestryTraits: [],
  flaws: [],
  characteristics: [],
};

/**
 * Trait buckets for single species or mixed (deduped ancestry/flaw/characteristic lists).
 * Mixed leaves `speciesTraits` empty — callers use per-parent species trait lists.
 */
export function resolveAncestryTraitBuckets(args: {
  selectedSpecies: Species | null;
  speciesA: Species | null;
  speciesB: Species | null;
  allTraits: Trait[] | null | undefined;
}): AncestryTraitBuckets {
  const { selectedSpecies, speciesA, speciesB, allTraits } = args;
  if (!allTraits) return EMPTY_BUCKETS;
  const resolve = (ids: (string | number)[]) => resolveTraitIds(ids, allTraits);

  if (selectedSpecies) {
    return {
      speciesTraits: resolve(selectedSpecies.species_traits || []),
      ancestryTraits: resolve(selectedSpecies.ancestry_traits || []),
      flaws: resolve(selectedSpecies.flaws || []),
      characteristics: resolve(selectedSpecies.characteristics || []),
    };
  }

  if (speciesA && speciesB) {
    const uniqueAncestryIds = Array.from(
      new Set(
        [...(speciesA.ancestry_traits || []), ...(speciesB.ancestry_traits || [])].map(String),
      ),
    );
    const uniqueFlawIds = Array.from(
      new Set([...(speciesA.flaws || []), ...(speciesB.flaws || [])].map(String)),
    );
    const uniqueCharIds = Array.from(
      new Set(
        [...(speciesA.characteristics || []), ...(speciesB.characteristics || [])].map(String),
      ),
    );
    return {
      speciesTraits: [],
      ancestryTraits: resolve(uniqueAncestryIds),
      flaws: resolve(uniqueFlawIds),
      characteristics: resolve(uniqueCharIds),
    };
  }

  return EMPTY_BUCKETS;
}

/** Combined unique sizes from two species (max 4), matching Advanced ancestry-step. */
export function combineSpeciesSizes(
  speciesA: Pick<Species, 'size' | 'sizes'> | null | undefined,
  speciesB: Pick<Species, 'size' | 'sizes'> | null | undefined,
): string[] {
  if (!speciesA && !speciesB) return [];
  const set = new Set<string>();
  (speciesA?.sizes || []).forEach((s) => {
    const t = String(s).trim();
    if (t) set.add(t);
  });
  (speciesB?.sizes || []).forEach((s) => {
    const t = String(s).trim();
    if (t) set.add(t);
  });
  if (speciesA?.size?.trim()) set.add(speciesA.size.trim());
  if (speciesB?.size?.trim()) set.add(speciesB.size.trim());
  return Array.from(set).slice(0, 4);
}

/** Unique skill options from both mixed parents (id + display name). */
export function buildMixedSpeciesSkillOptions(
  speciesA: Pick<Species, 'skills'> | null | undefined,
  speciesB: Pick<Species, 'skills'> | null | undefined,
  allSkills: Skill[] | null | undefined,
): NamedIdOption[] {
  if (!speciesA || !speciesB || !allSkills) return [];
  const merged = [...(speciesA.skills || []), ...(speciesB.skills || [])];
  const seen = new Set<string>();
  const options: NamedIdOption[] = [];
  merged.forEach((id) => {
    const sid = String(id);
    if (seen.has(sid)) return;
    seen.add(sid);
    const chip = speciesSkillToSummaryChipItem(sid, allSkills);
    const description = chip.description?.trim();
    options.push({
      id: sid,
      name: chip.label,
      description: description || undefined,
    });
  });
  return options;
}

export function averageMixedPhysical(
  speciesA: Species | null | undefined,
  speciesB: Species | null | undefined,
): CharacterAncestry['mixedPhysical'] | null {
  if (!speciesA || !speciesB) return null;
  const aveHeight =
    (Number(speciesA.ave_height) || 0) + (Number(speciesB.ave_height) || 0) !== 0
      ? Math.round(((Number(speciesA.ave_height) || 0) + (Number(speciesB.ave_height) || 0)) / 2)
      : undefined;
  const aveWeight =
    (Number(speciesA.ave_weight) || 0) + (Number(speciesB.ave_weight) || 0) !== 0
      ? Math.round(((Number(speciesA.ave_weight) || 0) + (Number(speciesB.ave_weight) || 0)) / 2)
      : undefined;
  const lifA = speciesA.adulthood_lifespan;
  const lifB = speciesB.adulthood_lifespan;
  const adulthood =
    lifA?.[0] != null && lifB?.[0] != null
      ? Math.round((Number(lifA[0]) + Number(lifB[0])) / 2)
      : undefined;
  const maxAge =
    lifA?.[1] != null && lifB?.[1] != null
      ? Math.round((Number(lifA[1]) + Number(lifB[1])) / 2)
      : undefined;
  return { aveHeight, aveWeight, adulthood, maxAge };
}

export function buildSingleSpeciesAncestryDraft(
  species: Pick<Species, 'id' | 'name'>,
): CharacterAncestry {
  return {
    id: species.id,
    name: species.name ?? String(species.id),
    mixed: false,
    selectedTraits: [],
    selectedFlaw: undefined,
    selectedCharacteristic: undefined,
    speciesIds: undefined,
    speciesNames: undefined,
    selectedSize: undefined,
    selectedSpeciesTraits: undefined,
    selectedFlawSpeciesId: undefined,
    mixedPhysical: undefined,
    selectedSpeciesSkillIds: undefined,
    selectedSpeciesTraitChoices: undefined,
  };
}

export function buildMixedSpeciesAncestryDraft(
  a: { id: string; name: string },
  b: { id: string; name: string },
): CharacterAncestry {
  return {
    id: `mixed:${a.id}+${b.id}`,
    name: `${a.name} / ${b.name}`,
    mixed: true,
    speciesIds: [a.id, b.id],
    speciesNames: [a.name, b.name],
    selectedTraits: [],
    selectedFlaw: undefined,
    selectedCharacteristic: undefined,
    selectedSize: undefined,
    selectedSpeciesTraits: undefined,
    selectedFlawSpeciesId: undefined,
    mixedPhysical: undefined,
    selectedSpeciesSkillIds: undefined,
    selectedSpeciesTraitChoices: undefined,
  };
}

/** Whether every choice-type species trait has a valid option pick. */
export function areSpeciesTraitChoicesComplete(
  parents: Array<{ id: string | number; option_trait_ids?: string[] | undefined }>,
  choicesMap: Record<string, string> | undefined,
): boolean {
  if (parents.length === 0) return true;
  return parents.every((t) => {
    const pid = String(t.id);
    const picked = choicesMap?.[pid];
    return Boolean(picked && getChoiceOptionIds(t).includes(String(picked)));
  });
}

export function hasRequiredMixedSpeciesSkills(optionCount: number, selectedCount: number): boolean {
  if (optionCount <= 2) return selectedCount === optionCount;
  return selectedCount === 2;
}

export function canContinueAncestrySingle(args: {
  selectedTraitIds: readonly string[];
  ancestryTraitCount: number;
  speciesChoiceParents: Array<{ id: string | number; option_trait_ids?: string[] | undefined }>;
  speciesTraitChoices: Record<string, string> | undefined;
}): boolean {
  const { selectedTraitIds, ancestryTraitCount, speciesChoiceParents, speciesTraitChoices } = args;
  const picksOk = areSpeciesTraitChoicesComplete(speciesChoiceParents, speciesTraitChoices);
  return (selectedTraitIds.length >= 1 || ancestryTraitCount === 0) && picksOk;
}

export function canContinueAncestryMixed(args: {
  selectedSpeciesTraits: CharacterAncestry['selectedSpeciesTraits'];
  selectedTraitIds: readonly string[];
  ancestryTraitCount: number;
  selectedSize: string | undefined;
  mixedSkillOptionCount: number;
  selectedSpeciesSkillIds: readonly string[];
}): boolean {
  const {
    selectedSpeciesTraits,
    selectedTraitIds,
    ancestryTraitCount,
    selectedSize,
    mixedSkillOptionCount,
    selectedSpeciesSkillIds,
  } = args;
  return (
    Boolean(selectedSpeciesTraits?.[0]) &&
    Boolean(selectedSpeciesTraits?.[1]) &&
    (selectedTraitIds.length >= 1 || ancestryTraitCount === 0) &&
    Boolean(selectedSize) &&
    hasRequiredMixedSpeciesSkills(mixedSkillOptionCount, selectedSpeciesSkillIds.length)
  );
}

/** Cap-aware toggle for multi-select ancestry trait lists (FIFO when at max). */
export function toggleCappedTraitSelection(
  current: readonly string[],
  traitId: string,
  max: number,
): string[] {
  const isSelected = current.includes(traitId);
  if (isSelected) return current.filter((id) => id !== traitId);
  if (current.length >= max) return [...current.slice(1), traitId];
  return [...current, traitId];
}

/** Toggle a single optional pick (flaw / characteristic). */
export function toggleOptionalSingleSelection(
  current: string | null | undefined,
  id: string,
): string | null {
  return current === id ? null : id;
}

/** After flaw change, trim ancestry traits to the new max. */
export function trimTraitsForFlawMax(
  selectedTraitIds: readonly string[],
  nextFlaw: string | null,
): string[] {
  const newMax = nextFlaw ? 2 : 1;
  return selectedTraitIds.length > newMax
    ? selectedTraitIds.slice(0, newMax)
    : [...selectedTraitIds];
}

/** Toggle one of up to two mixed species skill ids. */
export function toggleMixedSpeciesSkillSelection(
  current: readonly string[],
  skillId: string,
  max = 2,
): string[] {
  const idx = current.indexOf(skillId);
  if (idx >= 0) return current.filter((_, i) => i !== idx);
  if (current.length < max) return [...current, skillId];
  return [...current];
}
