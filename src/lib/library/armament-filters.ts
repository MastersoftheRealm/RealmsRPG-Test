/**
 * Shared armament / mixed-equipment filter state + apply logic (TASK-680 / TASK-723).
 * UI: `ArmamentFilters` in `@/components/shared/filters`.
 */

import {
  deriveAbilityRequirementFromProperties,
  meetsAbilityRequirement,
  type AbilityRequirement,
  type WeaponPropertyRef,
} from '@/lib/game/weapon-attack-ability';
import {
  maxRarityForCharacterLevel,
  rarityAtOrBelowMax,
} from '@/lib/game/creator-constants';
import type { ArmamentCharacterContext } from '@/lib/library/armament-character-context';

export interface ArmamentFilterState {
  /**
   * When a character is selected: keep only rows whose currency ≤ character currency.
   */
  affordableCurrencyOnly: boolean;
  /** Inclusive minimum currency (optional; not character-scoped). */
  minCurrency: number | null;
  /** Inclusive maximum currency (optional; not character-scoped). */
  maxCurrency: number | null;
  /**
   * When a character is selected: keep rarities at or below GAME_RULES
   * Levels-by-Rarity for that level (off by default).
   */
  rarityAccessibleOnly: boolean;
}

export const EMPTY_ARMAMENT_FILTERS: ArmamentFilterState = {
  affordableCurrencyOnly: false,
  minCurrency: null,
  maxCurrency: null,
  rarityAccessibleOnly: false,
};

/** `armament` applies ability + TP caps; `equipment` skips those (mixed Codex list). */
export type ArmamentFilterProfile = 'armament' | 'equipment';

export interface ArmamentFilterableRow {
  currency?: number | null;
  tp?: number | null;
  rarity?: string | null;
  /** Parsed ability requirement (preferred when building rows). */
  abilityReq?: AbilityRequirement | null;
  /** Raw properties when abilityReq not precomputed. */
  properties?: WeaponPropertyRef[];
}

function rowCurrency(row: ArmamentFilterableRow): number {
  return row.currency != null ? Number(row.currency) : 0;
}

function matchesCurrencyRange(row: ArmamentFilterableRow, filters: ArmamentFilterState): boolean {
  const currency = rowCurrency(row);
  if (filters.minCurrency != null && currency < filters.minCurrency) return false;
  if (filters.maxCurrency != null && currency > filters.maxCurrency) return false;
  return true;
}

/**
 * Resolve ability requirement from row fields (precomputed or from properties).
 */
function resolveRowAbilityRequirement(row: ArmamentFilterableRow): AbilityRequirement | null {
  if (row.abilityReq?.name && row.abilityReq.level != null) return row.abilityReq;
  return deriveAbilityRequirementFromProperties(row.properties) ?? null;
}

/**
 * Apply currency range always; character-scoped ability/TP/affordability/rarity
 * when context is set. `equipment` profile skips ability + armament TP gates.
 */
export function applyArmamentFilters<T extends ArmamentFilterableRow>(
  rows: T[],
  filters: ArmamentFilterState,
  characterContext: ArmamentCharacterContext | null,
  profile: ArmamentFilterProfile = 'armament'
): T[] {
  return rows.filter((row) => {
    if (!matchesCurrencyRange(row, filters)) return false;
    if (!characterContext) return true;

    if (profile === 'armament') {
      const req = resolveRowAbilityRequirement(row);
      if (!meetsAbilityRequirement(req, characterContext.abilities)) return false;

      const tp = row.tp != null ? Number(row.tp) : 0;
      if (tp > characterContext.armamentMax) return false;
    }

    if (filters.affordableCurrencyOnly && rowCurrency(row) > characterContext.currency) {
      return false;
    }

    if (filters.rarityAccessibleOnly) {
      const maxRarity = maxRarityForCharacterLevel(characterContext.level);
      if (!rarityAtOrBelowMax(row.rarity, maxRarity)) return false;
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
  if (filters.rarityAccessibleOnly) n += 1;
  if (filters.minCurrency != null) n += 1;
  if (filters.maxCurrency != null) n += 1;
  return n;
}
