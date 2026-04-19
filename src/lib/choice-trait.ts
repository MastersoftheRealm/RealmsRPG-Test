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
