/**
 * Shared armament library filter state + apply logic (TASK-680).
 * UI: `ArmamentFilters` in `@/components/shared/filters`.
 */

import {
  deriveAbilityRequirementFromProperties,
  meetsAbilityRequirement,
  type AbilityRequirement,
  type WeaponPropertyRef,
} from '@/lib/game/weapon-attack-ability';
import type { ArmamentCharacterContext } from '@/lib/library/armament-character-context';

export interface ArmamentFilterState {
  /**
   * When a character is selected: keep only rows whose currency ≤ character currency.
   */
  affordableCurrencyOnly: boolean;
}

export const EMPTY_ARMAMENT_FILTERS: ArmamentFilterState = {
  affordableCurrencyOnly: false,
};

export interface ArmamentFilterableRow {
  currency?: number | null;
  tp?: number | null;
  /** Parsed ability requirement (preferred when building rows). */
  abilityReq?: AbilityRequirement | null;
  /** Raw properties when abilityReq not precomputed. */
  properties?: WeaponPropertyRef[];
}

/**
 * Resolve ability requirement from row fields (precomputed or from properties).
 */
function resolveRowAbilityRequirement(row: ArmamentFilterableRow): AbilityRequirement | null {
  if (row.abilityReq?.name && row.abilityReq.level != null) return row.abilityReq;
  return deriveAbilityRequirementFromProperties(row.properties) ?? null;
}

/**
 * Apply character-scoped armament filters (ability req, armament TP max, optional currency).
 */
export function applyArmamentFilters<T extends ArmamentFilterableRow>(
  rows: T[],
  filters: ArmamentFilterState,
  characterContext: ArmamentCharacterContext | null
): T[] {
  if (!characterContext) return rows;

  return rows.filter((row) => {
    const req = resolveRowAbilityRequirement(row);
    if (!meetsAbilityRequirement(req, characterContext.abilities)) return false;

    const tp = row.tp != null ? Number(row.tp) : 0;
    if (tp > characterContext.armamentMax) return false;

    if (filters.affordableCurrencyOnly) {
      const currency = row.currency != null ? Number(row.currency) : 0;
      if (currency > characterContext.currency) return false;
    }

    return true;
  });
}

export function countActiveArmamentFilters(
  filters: ArmamentFilterState,
  hasCharacter: boolean
): number {
  let n = 0;
  if (hasCharacter) n += 1;
  if (filters.affordableCurrencyOnly) n += 1;
  return n;
}
