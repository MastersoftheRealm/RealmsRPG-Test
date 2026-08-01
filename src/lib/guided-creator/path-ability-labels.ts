/**
 * Resolve path ability chips + draft pow/mart for guided creator.
 *
 * DESIGN_INTENT (UI vs GAME_RULES):
 * - Game terms: **Archetype Ability** (Power / Martial Archetype Ability on hybrids).
 * - Guided UX may say **Primary Ability** / **Secondary Ability** so new users see the
 *   path’s governing ability vs an optional secondary recommended ability.
 * - Primary/Secondary are not rules terms and are NOT power-vs-martial. A Power path and
 *   a Martial path can share the same Archetype Ability (e.g. Strength).
 * - Powered-Martial has **two** Archetype Abilities (both primary): Power + Martial.
 *   Do not label the Martial side as Secondary. Formulas using one Archetype Ability
 *   score take the higher of the two.
 */

import { formatAbilityLabel } from '@/lib/constants/ability-effect-blurbs';
import {
  formatPathPrimaryAbilityLabel,
  formatPathSecondaryAbilityLabel,
} from '@/lib/constants/copy/path-ability-copy';
import type { AbilityName, Archetype } from '@/types';

export type PathAbilityChipRole = 'primary' | 'secondary';

export interface PathAbilityChipLabel {
  key: string;
  label: string;
  role: PathAbilityChipRole;
}

export interface PathAbilityLabels {
  /** Archetype abilities shown as Primary Ability chips (1, or 2 for powered-martial). */
  primaryAbilities: AbilityName[];
  /** Optional secondary recommended ability (UI); never a second hybrid archetype ability. */
  secondaryAbility: AbilityName | null;
  /** Draft `pow_abil` (null on martial-only). */
  powAbil: AbilityName | null;
  /** Draft `mart_abil` (null on power-only; martial side on powered-martial). */
  martAbil: AbilityName | null;
}

function asAbility(value: unknown): AbilityName | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  return value.trim().toLowerCase() as AbilityName;
}

function uniqAbilities(values: Array<AbilityName | null>): AbilityName[] {
  const out: AbilityName[] = [];
  for (const value of values) {
    if (value && !out.includes(value)) out.push(value);
  }
  return out;
}

/**
 * Resolve archetype abilities + optional secondary recommended ability for a path.
 */
export function resolvePathAbilityLabels(path: Archetype): PathAbilityLabels {
  const pathType = (path.type || 'power') as Archetype['type'];
  const secondaryField = asAbility(path.secondary_ability);

  if (pathType === 'powered-martial') {
    const powAbil =
      asAbility(path.pow_abil) ?? asAbility(path.archetype_ability) ?? null;
    // Martial archetype ability; secondary_ability is a common admin/data fallback for that side.
    const martAbil = asAbility(path.mart_abil) ?? secondaryField;
    const primaryAbilities = uniqAbilities([powAbil, martAbil]);
    // Secondary chip only when the field is a third, distinct recommended ability.
    const secondaryAbility =
      secondaryField && secondaryField !== powAbil && secondaryField !== martAbil
        ? secondaryField
        : null;
    return { primaryAbilities, secondaryAbility, powAbil, martAbil };
  }

  if (pathType === 'martial') {
    const martAbil =
      asAbility(path.mart_abil) ??
      asAbility(path.archetype_ability) ??
      secondaryField;
    const secondaryAbility =
      secondaryField && secondaryField !== martAbil ? secondaryField : null;
    return {
      primaryAbilities: martAbil ? [martAbil] : [],
      secondaryAbility,
      powAbil: null,
      martAbil,
    };
  }

  const powAbil =
    asAbility(path.archetype_ability) ?? asAbility(path.pow_abil) ?? null;
  const secondaryAbility =
    secondaryField && secondaryField !== powAbil ? secondaryField : null;
  return {
    primaryAbilities: powAbil ? [powAbil] : [],
    secondaryAbility,
    powAbil,
    martAbil: null,
  };
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
