/**
 * Guided Ancestry PickTask list builder (characteristic → ancestry trait → optional flaw).
 * Pure helper for ancestry-step + vitest (DEV-V-013-T061).
 */

import { getChoiceOptionIds, resolveChoiceOptionTraits } from '@/lib/choice-trait';
import { resolveTraitIds, type Species, type Trait } from '@/hooks';

export type AncestryPickPhase =
  | 'species-trait-option'
  | 'characteristic'
  | 'ancestry-trait-1'
  | 'flaw'
  | 'ancestry-trait-2';

export interface AncestryPickTask {
  phase: AncestryPickPhase;
  title: string;
  description: string;
  options: Trait[];
  parentTraitId?: string;
  optional?: boolean;
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
        (t) => !firstAncestryId || String(t.id) !== firstAncestryId
      ),
    });
  }

  return list;
}
