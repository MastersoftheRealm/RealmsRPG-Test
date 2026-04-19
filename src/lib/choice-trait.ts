import type { ChipData } from '@/components/shared/grid-list-row';

/** Minimal trait shape for resolving choice-trait option IDs from codex data. */
export type ChoiceTraitOptionSource = {
  id: string | number;
  name: string;
  description?: string;
};

export function getChoiceOptionIds(trait: { option_trait_ids?: string[] }): string[] {
  return Array.isArray(trait.option_trait_ids) ? trait.option_trait_ids : [];
}

export function traitsByIdMap<T extends ChoiceTraitOptionSource>(traits: T[] | null | undefined): Map<string, T> {
  const map = new Map<string, T>();
  (traits || []).forEach((t) => {
    map.set(String(t.id), t);
  });
  return map;
}

export function resolveChoiceOptionTraits<T extends ChoiceTraitOptionSource>(
  optionIds: string[] | undefined,
  allTraits: T[] | null | undefined,
): T[] {
  if (!optionIds?.length || !allTraits?.length) return [];
  return optionIds
    .map((oid) => allTraits.find((x) => String(x.id) === String(oid)))
    .filter((t): t is T => Boolean(t));
}

/** First option ID from the parent’s option list that appears in `selectedIds`. */
export function firstSelectedChoiceOptionId(optionIds: string[], selectedIds: string[]): string | undefined {
  const set = new Set(selectedIds.map(String));
  return optionIds.find((id) => set.has(String(id)));
}

export function choiceTraitOptionIdsToChipData(
  optionIds: string[] | undefined,
  traitById: Map<string, ChoiceTraitOptionSource>,
): ChipData[] {
  if (!Array.isArray(optionIds) || optionIds.length === 0) return [];
  return optionIds.map((optionId) => {
    const optionTrait = traitById.get(String(optionId));
    return {
      name: optionTrait?.name || String(optionId),
      description: optionTrait?.description || undefined,
    };
  });
}

/** Trait rows that include `option_trait_ids` (from codex). */
export type TraitWithChoiceOptions = { id: string | number; option_trait_ids?: string[] };

function traitByIdMapForChoiceOptions(traits: TraitWithChoiceOptions[] | null | undefined): Map<string, TraitWithChoiceOptions> {
  const map = new Map<string, TraitWithChoiceOptions>();
  (traits || []).forEach((t) => {
    map.set(String(t.id), t);
  });
  return map;
}

/**
 * For each species trait ID from the species definition: if that trait is a choice trait and
 * `choices[parentId]` is a valid option, use the option ID on the character; otherwise keep the
 * species-list ID (legacy or pending pick).
 */
export function applySpeciesTraitChoiceSelections(
  speciesTraitIds: (string | number)[] | undefined,
  choices: Record<string, string> | undefined,
  allTraits: TraitWithChoiceOptions[] | null | undefined,
): string[] {
  if (!speciesTraitIds?.length) return [];
  const byId = traitByIdMapForChoiceOptions(allTraits ?? []);
  return speciesTraitIds.map((id) => {
    const sid = String(id);
    const trait = byId.get(sid);
    const optionIds = getChoiceOptionIds(trait || {});
    if (optionIds.length === 0) return sid;
    const picked = choices?.[sid];
    if (picked && optionIds.includes(String(picked))) return String(picked);
    return sid;
  });
}
