/**
 * Assemble character-sheet trait rows without duplicating species traits that
 * were incorrectly persisted into `ancestry.selectedTraits` (guided creator bug).
 *
 * DESIGN_INTENT: Species traits come from the species definition (codex).
 * `ancestry.selectedTraits` is ancestry picks only. Display must tolerate legacy
 * saves that stuffed species trait ids into selectedTraits.
 */

import { normalizeId } from '@/lib/utils/normalize-id';

export type SheetTraitCategory = 'ancestry' | 'flaw' | 'characteristic' | 'species';

export interface SheetTraitRow {
  name: string;
  category: SheetTraitCategory;
}

export interface VanillaTraitFields {
  ancestryTraits?: string[] | undefined;
  flawTrait?: string | null | undefined;
  characteristicTrait?: string | null | undefined;
  speciesTraits?: string[] | undefined;
}

export interface CollectSheetTraitsInput {
  speciesTraitsFromCodex?: string[] | undefined;
  ancestry?:
    | {
        selectedTraits?: string[] | undefined;
        selectedFlaw?: string | null | undefined;
        selectedCharacteristic?: string | null | undefined;
      }
    | undefined;
  vanillaTraits?: VanillaTraitFields | undefined;
  /** Legacy top-level character.traits (names). */
  legacyTraits?: Array<string | { name?: string | undefined }> | undefined;
}

function traitKey(name: string): string {
  return normalizeId(name);
}

/**
 * Build unique trait rows for the Feats/Traits tab.
 */
export function collectSheetTraits(input: CollectSheetTraitsInput): SheetTraitRow[] {
  const result: SheetTraitRow[] = [];
  const seen = new Set<string>();

  const push = (name: string | null | undefined, category: SheetTraitCategory) => {
    const trimmed = String(name ?? '').trim();
    if (!trimmed) return;
    const key = traitKey(trimmed);
    if (!key || seen.has(key)) return;
    seen.add(key);
    result.push({ name: trimmed, category });
  };

  const speciesFromCodex = input.speciesTraitsFromCodex ?? [];
  if (speciesFromCodex.length > 0) {
    speciesFromCodex.forEach((name) => push(name, 'species'));
  } else {
    (input.vanillaTraits?.speciesTraits ?? []).forEach((name) => push(name, 'species'));
  }

  const speciesKeys = new Set(
    (speciesFromCodex.length > 0
      ? speciesFromCodex
      : (input.vanillaTraits?.speciesTraits ?? [])
    ).map((n) => traitKey(String(n))),
  );

  const ancestry = input.ancestry;
  (ancestry?.selectedTraits ?? []).forEach((name) => {
    const key = traitKey(String(name));
    // Skip species traits that were incorrectly stored in selectedTraits.
    if (speciesKeys.has(key)) return;
    push(name, 'ancestry');
  });

  if (ancestry?.selectedFlaw) push(ancestry.selectedFlaw, 'flaw');
  if (ancestry?.selectedCharacteristic) {
    push(ancestry.selectedCharacteristic, 'characteristic');
  }

  const hasNewFormat =
    (ancestry?.selectedTraits?.length ?? 0) > 0 ||
    !!ancestry?.selectedFlaw ||
    !!ancestry?.selectedCharacteristic;

  if (!hasNewFormat && input.vanillaTraits) {
    if (input.vanillaTraits.flawTrait) push(input.vanillaTraits.flawTrait, 'flaw');
    if (input.vanillaTraits.characteristicTrait) {
      push(input.vanillaTraits.characteristicTrait, 'characteristic');
    }
    (input.vanillaTraits.ancestryTraits ?? []).forEach((name) => push(name, 'ancestry'));
  }

  (input.legacyTraits ?? []).forEach((trait) => {
    const name = typeof trait === 'string' ? trait : trait?.name;
    push(name, 'species');
  });

  return result;
}
