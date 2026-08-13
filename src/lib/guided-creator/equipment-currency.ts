/**
 * Guided equipment — starting currency and spend math (shared with equipment-step).
 *
 * Display Currency is the market cost from calculateCurrencyCostAndRarity — never the
 * raw property C sum (`costs.totalCurrency`). Same protocol as OfficialItemList / Library GLR.
 */

import {
  calculateCurrencyCostAndRarity,
  calculateItemCosts,
  type ItemPropertyPayload,
  type ItemPropertyTpRow,
} from '@/lib/calculators/item-calc';
import { CHARACTER_STARTING_CURRENCY } from '@/stores/character-creator-store';

/** Max unit cost for gear items in guided Layer 2 shop. */
export const GUIDED_GEAR_L2_MAX_UNIT_COST = 50;

const CURRENCY_GROWTH = 1.45;

export interface CurrencyLineItem {
  cost?: number;
  quantity?: number;
  /** Display Currency (market cost), not property C sum. */
  gold_cost?: number;
  /** Display Currency when set (codex / derived rows). */
  currency?: number;
  /** Item-calc totals: totalCurrency = property C sum; totalIP needed to derive market cost. */
  costs?: { totalCurrency?: number; totalIP?: number; totalTP?: number };
  properties?: ItemPropertyPayload[];
}

/** Pre-derived catalog row cost fields (avoids WeaponPropertyRef vs ItemPropertyPayload clash). */
export type CatalogRowCostFields = Pick<
  CurrencyLineItem,
  'gold_cost' | 'currency' | 'cost' | 'costs'
>;

export type RefCostLookupItem = { id?: string | number } & CatalogRowCostFields;

export function resolveCatalogRowUnitCost(
  row: CatalogRowCostFields | null | undefined
): number {
  if (!row) return 0;
  return resolveItemUnitCost(row);
}

/** Starting currency by level (matches equipment-step). */
export function computeStartingCurrency(level = 1): number {
  if (level <= 1) return CHARACTER_STARTING_CURRENCY;
  return Math.round(CHARACTER_STARTING_CURRENCY * Math.pow(CURRENCY_GROWTH, level - 1));
}

/**
 * Market Currency cost for spend / GLR columns / chips.
 * Prefer already-derived display fields; otherwise convert property C+IP like Library GLR.
 */
export function resolveItemUnitCost(
  item: CurrencyLineItem,
  itemProperties: ItemPropertyTpRow[] = []
): number {
  const explicit = item.gold_cost ?? item.currency ?? item.cost;
  if (explicit != null && Number.isFinite(Number(explicit))) {
    return Number(explicit) || 0;
  }

  if (itemProperties.length > 0 && Array.isArray(item.properties) && item.properties.length > 0) {
    const costs = calculateItemCosts(item.properties, itemProperties);
    return calculateCurrencyCostAndRarity(costs.totalCurrency, costs.totalIP).currencyCost;
  }

  if (item.costs?.totalCurrency != null) {
    return calculateCurrencyCostAndRarity(
      Number(item.costs.totalCurrency) || 0,
      Number(item.costs.totalIP) || 0
    ).currencyCost;
  }

  return 0;
}

export function computeSpentCurrency(
  items: CurrencyLineItem[],
  itemProperties: ItemPropertyTpRow[] = []
): number {
  return items.reduce(
    (sum, item) =>
      sum + resolveItemUnitCost(item, itemProperties) * Math.max(1, item.quantity ?? 1),
    0
  );
}

export function computeRemainingCurrency(starting: number, spent: number): number {
  return starting - spent;
}

/**
 * Persistable remainder — never write a debt onto the character.
 * Display / rail keep the signed value from `computeRemainingCurrency`.
 */
export function clampSavedCurrency(remaining: number): number {
  return Math.max(0, remaining);
}

/** Resolve unit cost for a path item ref from official + codex libraries. */
export function resolveRefUnitCost(
  ref: { id: string },
  officialItems: Array<RefCostLookupItem & Pick<CurrencyLineItem, 'properties'>>,
  codexEquipment: RefCostLookupItem[],
  itemProperties: ItemPropertyTpRow[] = []
): number {
  const key = String(ref.id).trim().toLowerCase();
  const official = officialItems.find(
    (i) => String(i.id).trim().toLowerCase() === key
  );
  if (official) return resolveItemUnitCost(official, itemProperties);
  const codex = codexEquipment.find((i) => String(i.id).trim().toLowerCase() === key);
  if (codex) return resolveCatalogRowUnitCost(codex);
  return 0;
}

/** Whether adding qty units of an item would exceed remaining currency. */
export function wouldExceedCurrency(
  remaining: number,
  unitCost: number,
  quantity: number
): boolean {
  return unitCost * quantity > remaining;
}
