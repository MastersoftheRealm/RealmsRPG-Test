/**
 * Training Point helpers for guided Loadout (L1 + L2) and powers/techniques budgets.
 */

import type { CodexEquipmentItem } from '@/types/codex';
import type { LibraryItem } from '@/types/library';
import type { PathItemRecommendation } from '@/types/archetype';
import type { AbilityName } from '@/types';
import {
  calculateItemCosts,
  type ItemPropertyPayload,
  type ItemPropertyTpRow,
} from '@/lib/calculators/item-calc';
import { getTrainingPointLimit } from '@/lib/proficiencies';
import type { CoreRulesMap } from '@/types/core-rules';
import {
  buildEquipmentLookup,
  inventoryTypeForResolvedItem,
  resolveEquipmentRef,
  type LoadoutItemCategory,
} from '@/lib/guided-creator/resolve-loadout-items';
import { isItemSelectedInDraft } from '@/lib/guided-creator/loadout-pool';
import { normalizeId } from '@/lib/utils';

export { isItemSelectedInDraft };

function coercePropertyId(raw: unknown): number | undefined {
  if (typeof raw === 'number' && !Number.isNaN(raw)) return raw;
  if (typeof raw === 'string') {
    const n = parseInt(raw, 10);
    return Number.isNaN(n) ? undefined : n;
  }
  return undefined;
}

function normalizeProperties(
  raw: unknown,
  itemProperties: ItemPropertyTpRow[]
): ItemPropertyPayload[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => {
    if (typeof entry === 'string') {
      const db = itemProperties.find((p) => p.name?.toLowerCase() === entry.toLowerCase());
      const id = db?.id != null ? coercePropertyId(db.id) : undefined;
      return id != null ? { id, name: entry, op_1_lvl: 0 } : { name: entry, op_1_lvl: 0 };
    }
    if (entry && typeof entry === 'object') {
      const obj = entry as ItemPropertyPayload;
      return {
        id: coercePropertyId(obj.id),
        name: obj.name,
        op_1_lvl: obj.op_1_lvl ?? 0,
      };
    }
    return { name: String(entry), op_1_lvl: 0 };
  });
}

function findLibraryRow(
  id: string,
  officialItems: LibraryItem[],
  codexEquipment: CodexEquipmentItem[]
): LibraryItem | CodexEquipmentItem | undefined {
  const key = normalizeId(id);
  return (
    officialItems.find((i) => normalizeId(i.id) === key) ??
    codexEquipment.find((i) => normalizeId(i.id) === key)
  );
}

export function resolveItemTrainingPoints(
  itemId: string,
  officialItems: LibraryItem[],
  codexEquipment: CodexEquipmentItem[],
  itemProperties: ItemPropertyTpRow[]
): number | null {
  const row = findLibraryRow(itemId, officialItems, codexEquipment);
  if (!row) return null;
  const props = normalizeProperties(
    'properties' in row ? row.properties : [],
    itemProperties
  );
  return Math.round(calculateItemCosts(props, itemProperties).totalTP);
}

export function computeSelectedLoadoutTp(
  selections: PathItemRecommendation[],
  officialItems: LibraryItem[],
  codexEquipment: CodexEquipmentItem[],
  itemProperties: ItemPropertyTpRow[]
): number {
  return selections.reduce((sum, ref) => {
    const tp = resolveItemTrainingPoints(ref.id, officialItems, codexEquipment, itemProperties);
    return sum + (tp ?? 0) * Math.max(1, ref.quantity);
  }, 0);
}

export function flattenGuidedDraftSelections(draft: {
  armaments: PathItemRecommendation[];
  equipment: PathItemRecommendation[];
}): PathItemRecommendation[] {
  return [...draft.armaments, ...draft.equipment];
}

export function computeGuidedLoadoutTpSummary(
  draft: {
    armaments: PathItemRecommendation[];
    equipment: PathItemRecommendation[];
    abilities: Record<AbilityName, number>;
    mart_abil: AbilityName | null;
    pow_abil: AbilityName | null;
  },
  officialItems: LibraryItem[],
  codexEquipment: CodexEquipmentItem[],
  itemProperties: ItemPropertyTpRow[],
  rules?: Partial<CoreRulesMap>
): { spent: number; limit: number; remaining: number } {
  const selections = flattenGuidedDraftSelections(draft);
  const spent = computeSelectedLoadoutTp(
    selections,
    officialItems,
    codexEquipment,
    itemProperties
  );

  const getAbility = (key: AbilityName | null | undefined): number =>
    key ? Number(draft.abilities[key] ?? 0) || 0 : 0;
  const highestAbility = Math.max(...Object.values(draft.abilities), 0);
  const archetypeAbility = Math.max(
    getAbility(draft.pow_abil),
    getAbility(draft.mart_abil),
    highestAbility
  );
  const limit = getTrainingPointLimit(1, archetypeAbility, rules);
  return { spent, limit, remaining: limit - spent };
}

export function wouldExceedLoadoutTp(
  draft: {
    armaments: PathItemRecommendation[];
    equipment: PathItemRecommendation[];
    abilities: Record<AbilityName, number>;
    mart_abil: AbilityName | null;
    pow_abil: AbilityName | null;
  },
  ref: PathItemRecommendation,
  officialItems: LibraryItem[],
  codexEquipment: CodexEquipmentItem[],
  itemProperties: ItemPropertyTpRow[],
  rules?: Partial<CoreRulesMap>
): boolean {
  if (isItemSelectedInDraft(draft, ref.id)) return false;
  const summary = computeGuidedLoadoutTpSummary(
    draft,
    officialItems,
    codexEquipment,
    itemProperties,
    rules
  );
  const addTp =
    (resolveItemTrainingPoints(ref.id, officialItems, codexEquipment, itemProperties) ?? 0) *
    Math.max(1, ref.quantity);
  return summary.spent + addTp > summary.limit;
}

export function resolvePoolItemCategory(
  ref: PathItemRecommendation,
  officialItems: LibraryItem[],
  codexEquipment: CodexEquipmentItem[]
): LoadoutItemCategory {
  const lookup = buildEquipmentLookup(officialItems, codexEquipment);
  return inventoryTypeForResolvedItem(resolveEquipmentRef(ref, lookup));
}

/** Build admin/codex TP resolver from library rows. */
export function createItemTpResolver(
  officialItems: LibraryItem[],
  codexEquipment: CodexEquipmentItem[],
  itemProperties: ItemPropertyTpRow[]
): (itemId: string) => number | null {
  return (itemId) => resolveItemTrainingPoints(itemId, officialItems, codexEquipment, itemProperties);
}

export function trainingPointLimitFromRecommendedAbilities(
  recommended: Record<string, number> | undefined,
  rules?: Partial<CoreRulesMap>
): number {
  if (!recommended || Object.keys(recommended).length === 0) {
    return getTrainingPointLimit(1, 2, rules);
  }
  const highest = Math.max(...Object.values(recommended).map((v) => Number(v) || 0), 0);
  return getTrainingPointLimit(1, highest, rules);
}

/**
 * Combine equipment loadout spend with powers/techniques spend against the same TP limit.
 * `combatTpSpent` is the sum of selected power/technique Training Points (part totals),
 * including innate powers (they spend TP like regular Powers).
 */
export function combineGuidedTpBudgets(
  loadout: { spent: number; limit: number; remaining: number },
  combatTpSpent: number
): { spent: number; limit: number; remaining: number } {
  const combat = Math.max(0, Math.floor(Number(combatTpSpent) || 0));
  const spent = loadout.spent + combat;
  return { spent, limit: loadout.limit, remaining: loadout.limit - spent };
}

/** True when adding `addTp` would exceed the shared Training Points budget. */
export function wouldExceedSharedTp(
  spent: number,
  limit: number,
  addTp: number,
  opts?: { alreadySelected?: boolean }
): boolean {
  if (opts?.alreadySelected) return false;
  const add = Math.max(0, Math.floor(Number(addTp) || 0));
  return spent + add > limit;
}
