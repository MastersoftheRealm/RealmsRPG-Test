/**
 * Guided Ancestry PickTask list builder (characteristic → ancestry trait → optional flaw).
 * Pure helper for ancestry-step + vitest (DEV-V-013-T061).
 */

import { getChoiceOptionIds, resolveChoiceOptionTraits } from '@/lib/choice-trait';
import {
  buildMixedSpeciesSkillOptions,
  hasRequiredMixedSpeciesSkills,
} from '@/lib/ancestry/ancestry-selection';
import { resolveTraitIds, type Species, type Trait, type Skill } from '@/hooks';

export type AncestryPickPhase =
  | 'species-trait-option'
  | 'mixed-species-trait-a'
  | 'mixed-species-trait-b'
  | 'mixed-species-skills'
  | 'characteristic'
  | 'ancestry-trait-1'
  | 'flaw'
  | 'ancestry-trait-2';

export interface AncestryPickTask {
  phase: AncestryPickPhase;
  title: string;
  description: string;
  options: Trait[];
  parentTraitId?: string | undefined;
  optional?: boolean | undefined;
  /** Mixed flaw pick: codex species id that owns this flaw option. */
  flawSpeciesId?: string | undefined;
  /** Mixed species-skills pick (not traits). */
  skillOptions?: { id: string; name: string; description?: string | undefined }[] | undefined;
}

export type AncestryPickSpeciesInput = Pick<
  Species,
  'species_traits' | 'characteristics' | 'ancestry_traits' | 'flaws'
>;

export interface BuildAncestryPickTasksInput {
  species: AncestryPickSpeciesInput;
  allTraits: Trait[];
  /** Truthy id grants bonus ancestry-trait-2; null/'' omit it. */
  selectedFlawId: string | null;
  selectedAncestryTraitIds: readonly string[];
}

/** Ordered pick tasks after species overview (species-trait options first when present). */
export function buildAncestryPickTasks({
  species,
  allTraits,
  selectedFlawId,
  selectedAncestryTraitIds,
}: BuildAncestryPickTasksInput): AncestryPickTask[] {
  if (!allTraits.length) return [];

  const list: AncestryPickTask[] = [];
  const speciesTraits = resolveTraitIds(species.species_traits || [], allTraits);

  speciesTraits.forEach((trait) => {
    const optionIds = getChoiceOptionIds(trait);
    if (optionIds.length > 0) {
      const options = resolveChoiceOptionTraits(optionIds, allTraits);
      if (options.length > 0) {
        list.push({
          phase: 'species-trait-option',
          title: `Choose your ${trait.name}`,
          description: trait.description || 'Pick the option that fits your character.',
          options,
          parentTraitId: String(trait.id),
        });
      }
    }
  });

  list.push({
    phase: 'characteristic',
    title: 'Pick a characteristic',
    description: 'A personal detail that adds flavor to who you are.',
    options: resolveTraitIds(species.characteristics || [], allTraits),
  });

  list.push({
    phase: 'ancestry-trait-1',
    title: 'Pick an ancestry trait',
    description: 'This trait makes your character distinct within their species.',
    options: resolveTraitIds(species.ancestry_traits || [], allTraits),
  });

  list.push({
    phase: 'flaw',
    title: 'Take a flaw? (optional)',
    description: 'Flaws add depth, and grant an extra ancestry trait.',
    options: resolveTraitIds(species.flaws || [], allTraits),
    optional: true,
  });

  if (selectedFlawId) {
    const firstAncestryId = selectedAncestryTraitIds[0];
    list.push({
      phase: 'ancestry-trait-2',
      title: 'Pick your bonus ancestry trait',
      description: 'Your flaw grants one additional ancestry trait.',
      options: resolveTraitIds(species.ancestry_traits || [], allTraits).filter(
        (t) => !firstAncestryId || String(t.id) !== firstAncestryId,
      ),
    });
  }

  return list;
}

export interface BuildMixedAncestryPickTasksInput {
  speciesA: Species;
  speciesB: Species;
  allTraits: Trait[];
  allSkills: Skill[];
  selectedFlawId: string | null;
  selectedAncestryTraitIds: readonly string[];
  selectedFlawSpeciesId: string | null;
}

/** Ordered pick tasks for mixed species (after mixed overview). */
export function buildMixedAncestryPickTasks({
  speciesA,
  speciesB,
  allTraits,
  allSkills,
  selectedFlawId,
  selectedAncestryTraitIds,
  selectedFlawSpeciesId,
}: BuildMixedAncestryPickTasksInput): AncestryPickTask[] {
  if (!allTraits.length) return [];

  const list: AncestryPickTask[] = [];
  const traitsA = resolveTraitIds(speciesA.species_traits || [], allTraits);
  const traitsB = resolveTraitIds(speciesB.species_traits || [], allTraits);

  if (traitsA.length > 0) {
    list.push({
      phase: 'mixed-species-trait-a',
      title: `Pick a species trait from ${speciesA.name}`,
      description: 'Choose one species trait from your first parent species.',
      options: traitsA,
    });
  }

  if (traitsB.length > 0) {
    list.push({
      phase: 'mixed-species-trait-b',
      title: `Pick a species trait from ${speciesB.name}`,
      description: 'Choose one species trait from your second parent species.',
      options: traitsB,
    });
  }

  const skillOptions = buildMixedSpeciesSkillOptions(speciesA, speciesB, allSkills);
  if (skillOptions.length > 2) {
    list.push({
      phase: 'mixed-species-skills',
      title: 'Choose your species skills',
      description: 'Pick exactly two skills from your combined species options.',
      options: [],
      skillOptions,
    });
  }

  const uniqueCharIds = Array.from(
    new Set([...(speciesA.characteristics || []), ...(speciesB.characteristics || [])].map(String)),
  );
  list.push({
    phase: 'characteristic',
    title: 'Pick a characteristic',
    description: 'A personal detail that adds flavor to who you are.',
    options: resolveTraitIds(uniqueCharIds, allTraits),
  });

  const uniqueAncestryIds = Array.from(
    new Set([...(speciesA.ancestry_traits || []), ...(speciesB.ancestry_traits || [])].map(String)),
  );
  list.push({
    phase: 'ancestry-trait-1',
    title: 'Pick an ancestry trait',
    description: 'This trait makes your character distinct within their heritage.',
    options: resolveTraitIds(uniqueAncestryIds, allTraits),
  });

  const flawsA = resolveTraitIds(speciesA.flaws || [], allTraits);
  const flawsB = resolveTraitIds(speciesB.flaws || [], allTraits);
  const flawOptions: Trait[] = [];
  flawsA.forEach((f) => {
    flawOptions.push({ ...f, description: f.description || `From ${speciesA.name}` });
  });
  flawsB.forEach((f) => {
    flawOptions.push({ ...f, description: f.description || `From ${speciesB.name}` });
  });

  list.push({
    phase: 'flaw',
    title: 'Take a flaw? (optional)',
    description: 'Flaws add depth, and grant an extra ancestry trait from that species.',
    options: flawOptions,
    optional: true,
  });

  if (selectedFlawId && selectedFlawSpeciesId) {
    const flawSpecies = String(speciesA.id) === String(selectedFlawSpeciesId) ? speciesA : speciesB;
    const firstAncestryId = selectedAncestryTraitIds[0];
    list.push({
      phase: 'ancestry-trait-2',
      title: 'Pick your bonus ancestry trait',
      description: `Your flaw grants one additional ancestry trait from ${flawSpecies.name}.`,
      options: resolveTraitIds(flawSpecies.ancestry_traits || [], allTraits).filter(
        (t) => !firstAncestryId || String(t.id) !== firstAncestryId,
      ),
    });
  }

  return list;
}

export function resolveFlawSpeciesIdForMixedPick(
  flawId: string,
  speciesA: Species,
  speciesB: Species,
): string | null {
  const id = String(flawId);
  if ((speciesA.flaws || []).map(String).includes(id)) return String(speciesA.id);
  if ((speciesB.flaws || []).map(String).includes(id)) return String(speciesB.id);
  return null;
}

export { hasRequiredMixedSpeciesSkills };
