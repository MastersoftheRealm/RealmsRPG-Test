/**
 * Guided equipment — starting currency and spend math.
 *
 * Display Currency is `resolveItemMarketPricing().currencyCost` — never the
 * raw property C sum (`costs.totalCurrency`). Same protocol as OfficialItemList / Library GLR.
 */

import {
  resolveItemMarketPricing,
  type ItemPropertyPayload,
  type ItemPropertyTpRow,
} from '@/lib/calculators/item-calc';
import { CHARACTER_STARTING_CURRENCY } from '@/lib/game/constants';
import { codexEquipmentDisplayCurrency } from '@/lib/codex/equipment-list';
import { normalizeArmamentKind } from '@/lib/library/official-item-list';
import type { WeaponPropertyRef } from '@/lib/game/weapon-attack-ability';

/** Max unit cost for Equipment items in guided Layer 2 shop. */
export const GUIDED_GEAR_L2_MAX_UNIT_COST = 50;

const CURRENCY_GROWTH = 1.45;

export interface CurrencyLineItem {
  cost?: number | undefined;
  quantity?: number | undefined;
  /** Display Currency (market cost), not property C sum. */
  gold_cost?: number | undefined;
  /** Display Currency when set (codex / derived rows). */
  currency?: number | undefined;
  /** Item-calc totals: totalCurrency = property C sum; totalIP needed to derive market cost. */
  costs?:
    | {
        totalCurrency?: number | undefined;
        totalIP?: number | undefined;
        totalTP?: number | undefined;
      }
    | undefined;
  properties?: ItemPropertyPayload[] | undefined;
}

/** Pre-derived catalog row cost fields (avoids WeaponPropertyRef vs ItemPropertyPayload clash). */
export type CatalogRowCostFields = Pick<
  CurrencyLineItem,
  'gold_cost' | 'currency' | 'cost' | 'costs'
> & {
  type?: string | undefined;
  properties?: readonly WeaponPropertyRef[] | undefined;
};

export type RefCostLookupItem = { id?: string | number | undefined } & CatalogRowCostFields;

export function resolveCatalogRowUnitCost(
  row: CatalogRowCostFields | null | undefined,
  itemProperties: ItemPropertyTpRow[] = [],
): number {
  if (!row) return 0;
  if (normalizeArmamentKind(row.type) && itemProperties.length > 0) {
    return codexEquipmentDisplayCurrency(row, itemProperties);
  }
  return resolveItemUnitCost(
    { ...row, properties: row.properties as ItemPropertyPayload[] | undefined },
    itemProperties,
  );
}

/** Starting currency by level (matches equipment-step). */
export function computeStartingCurrency(level = 1): number {
  if (level <= 1) return CHARACTER_STARTING_CURRENCY;
  return Math.ceil(CHARACTER_STARTING_CURRENCY * Math.pow(CURRENCY_GROWTH, level - 1));
}

/**
 * Market Currency cost for spend / GLR columns / chips.
 * Prefer already-derived display fields; otherwise convert property C+IP like Library GLR.
 */
export function resolveItemUnitCost(
  item: CurrencyLineItem & { type?: string | undefined },
  itemProperties: ItemPropertyTpRow[] = [],
): number {
  if (normalizeArmamentKind(item.type) && itemProperties.length > 0) {
    const calculated = codexEquipmentDisplayCurrency(item, itemProperties);
    if (calculated > 0) return calculated;
  }
  const explicit = item.gold_cost ?? item.currency ?? item.cost;
  if (explicit != null && Number.isFinite(Number(explicit))) {
    return Number(explicit) || 0;
  }

  return resolveItemMarketPricing(item.properties, itemProperties, item.costs).currencyCost;
}

export function computeSpentCurrency(
  items: CurrencyLineItem[],
  itemProperties: ItemPropertyTpRow[] = [],
): number {
  return items.reduce(
    (sum, item) =>
      sum + resolveItemUnitCost(item, itemProperties) * Math.max(1, item.quantity ?? 1),
    0,
  );
}

export function computeRemainingCurrency(starting: number, spent: number): number {
  return starting - spent;
}

/** Resolve unit cost for a path item ref from official + codex libraries. */
export function resolveRefUnitCost(
  ref: { id: string },
  officialItems: RefCostLookupItem[],
  codexEquipment: RefCostLookupItem[],
  itemProperties: ItemPropertyTpRow[] = [],
): number {
  const key = String(ref.id).trim().toLowerCase();
  const official = officialItems.find((i) => String(i.id).trim().toLowerCase() === key);
  if (official)
    return resolveItemUnitCost(
      { ...official, properties: official.properties as ItemPropertyPayload[] | undefined },
      itemProperties,
    );
  const codex = codexEquipment.find((i) => String(i.id).trim().toLowerCase() === key);
  if (codex) return resolveCatalogRowUnitCost(codex, itemProperties);
  return 0;
}

/** Whether adding qty units of an item would exceed remaining currency. */
export function wouldExceedCurrency(
  remaining: number,
  unitCost: number,
  quantity: number,
): boolean {
  return unitCost * quantity > remaining;
}
