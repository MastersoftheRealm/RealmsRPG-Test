/**
 * Resolve a character's size category from ancestry + species codex data.
 */

import { combineSpeciesSizes } from '@/lib/ancestry/ancestry-selection';
import { getSpeciesSizeOptions } from '@/lib/ancestry/species-size-options';
import {
  findSizeTableRow,
  reconcileSizeWithAllowedOptions,
  sizeLabelForKey,
} from '@/lib/game/size-table';
import type { Species } from '@/hooks';
import type { CharacterAncestry } from '@/types';

export type SpeciesSizeSource = {
  id?: string | number | undefined;
  name?: string | null | undefined;
  size?: string | null | undefined;
  sizes?: string[] | null | undefined;
};

function findSpeciesByAncestry(
  ancestry: CharacterAncestry | undefined,
  allSpecies: readonly SpeciesSizeSource[],
): SpeciesSizeSource | null {
  if (!ancestry?.id || ancestry.mixed === true) return null;
  const speciesId = ancestry.id;
  const speciesName = ancestry.name;
  const species =
    allSpecies.find((s) => String(s.id) === String(speciesId)) ??
    (speciesName
      ? allSpecies.find(
          (s) => String(s.name ?? '').toLowerCase() === String(speciesName ?? '').toLowerCase(),
        )
      : undefined);
  return species ?? null;
}

function findMixedSpeciesPair(
  ancestry: CharacterAncestry | undefined,
  allSpecies: readonly SpeciesSizeSource[],
): { speciesA: SpeciesSizeSource | null; speciesB: SpeciesSizeSource | null } {
  if (ancestry?.mixed !== true || !ancestry.speciesIds?.length) {
    return { speciesA: null, speciesB: null };
  }
  const speciesA = allSpecies.find((s) => String(s.id) === String(ancestry.speciesIds![0])) ?? null;
  const speciesB = allSpecies.find((s) => String(s.id) === String(ancestry.speciesIds![1])) ?? null;
  return { speciesA, speciesB };
}

export function getCharacterAllowedSizes(
  ancestry: CharacterAncestry | undefined,
  allSpecies: readonly SpeciesSizeSource[],
): string[] {
  if (!ancestry) return [];
  if (ancestry.mixed === true) {
    const { speciesA, speciesB } = findMixedSpeciesPair(ancestry, allSpecies);
    return combineSpeciesSizes(speciesA as Species | null, speciesB as Species | null);
  }
  const species = findSpeciesByAncestry(ancestry, allSpecies);
  if (!species) return [];
  return getSpeciesSizeOptions(species);
}

function readStoredCharacterSize(ancestry: CharacterAncestry | undefined): string | undefined {
  const raw = ancestry?.selectedSize ?? ancestry?.size;
  const trimmed = raw?.trim();
  return trimmed || undefined;
}

export function resolveEffectiveCharacterSize(
  ancestry: CharacterAncestry | undefined,
  allowedSizes: readonly string[],
): string | undefined {
  const stored = readStoredCharacterSize(ancestry);
  return reconcileSizeWithAllowedOptions(stored, allowedSizes);
}

export function characterSizeDisplayLabel(sizeKey: string | undefined): string | undefined {
  if (!sizeKey) return undefined;
  return sizeLabelForKey(sizeKey) ?? sizeKey;
}

export function characterSizeHeightHint(sizeKey: string | undefined): string | undefined {
  const row = findSizeTableRow(sizeKey);
  return row?.height;
}

/** Persist size on ancestry; drops legacy `size` so it cannot override `selectedSize` after clear. */
export function patchAncestrySizeChoice(
  ancestry: CharacterAncestry,
  selectedSize: string | undefined,
): CharacterAncestry {
  const trimmed = selectedSize?.trim();
  const next: CharacterAncestry = { ...ancestry };
  const legacy = next as CharacterAncestry & { size?: string | undefined };
  delete legacy.size;
  if (trimmed) {
    next.selectedSize = trimmed;
  } else {
    delete next.selectedSize;
  }
  return next;
}
