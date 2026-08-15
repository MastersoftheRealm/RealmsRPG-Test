/**
 * Guided-creator UI labels for path ability chips.
 * Domain resolution lives in `lib/game/path-ability-labels.ts`.
 */

import { formatAbilityLabel } from '@/lib/constants/ability-effect-blurbs';
import {
  formatPathPrimaryAbilityLabel,
  formatPathSecondaryAbilityLabel,
} from '@/lib/constants/copy/path-ability-copy';
import { resolvePathAbilityLabels, type PathAbilityChipRole } from '@/lib/game/path-ability-labels';
import type { Archetype } from '@/types';

export interface PathAbilityChipLabel {
  key: string;
  label: string;
  role: PathAbilityChipRole;
}

/** Labeled path ability chips for Guided + Advanced path cards and detail overviews. */
export function buildPathAbilityChipLabels(path: Archetype): PathAbilityChipLabel[] {
  const { primaryAbilities, secondaryAbility } = resolvePathAbilityLabels(path);
  const chips: PathAbilityChipLabel[] = [];

  for (const ability of primaryAbilities) {
    chips.push({
      key: `primary-${ability}`,
      label: formatPathPrimaryAbilityLabel(formatAbilityLabel(ability)),
      role: 'primary',
    });
  }

  if (secondaryAbility) {
    chips.push({
      key: `secondary-${secondaryAbility}`,
      label: formatPathSecondaryAbilityLabel(formatAbilityLabel(secondaryAbility)),
      role: 'secondary',
    });
  }

  return chips;
}
