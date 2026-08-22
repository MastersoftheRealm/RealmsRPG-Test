/**
 * Crafting market price (currency) for items
 * ==========================================
 * Reuses item-calc logic so armaments and equipment show the same currency
 * as Library, add-library-item, and equipment-step.
 */

import type { ItemProperty } from '@/hooks/codex-types';
import { resolveItemMarketPricing, type ItemStoredCostSums } from '@/lib/calculators/item-calc';
import { equipmentCurrency } from '@/lib/codex/equipment-list';

/** Codex equipment row (from useEquipment) */
export interface CodexEquipmentLike {
  id: string;
  name?: string | undefined;
  type?: string | undefined;
  currency?: number | undefined;
  gold_cost?: number | undefined;
  properties?: unknown[] | undefined;
}

/** User or public library item with optional properties */
export interface LibraryItemLike {
  id: string;
  name?: string | undefined;
  description?: string | undefined;
  type?: string | undefined;
  armamentType?: string | undefined;
  properties?:
    | Array<{
        id?: number | string | undefined;
        name?: string | undefined;
        op_1_lvl?: number | undefined;
      }>
    | undefined;
  damage?: unknown | undefined;
}

/**
 * Get market price (currency) for codex equipment. Uses stored currency column.
 */
export function getCodexEquipmentMarketPrice(e: CodexEquipmentLike): number {
  return Math.max(0, equipmentCurrency(e));
}

/**
 * Get market price for a user or public library item (armament or equipment)
 * using the same calculation as Library and equipment-step.
 */
export function getLibraryItemMarketPrice(
  item: LibraryItemLike,
  propertiesDb: ItemProperty[],
): number {
  const stored = item as LibraryItemLike & { costs?: ItemStoredCostSums | undefined };
  return Math.max(
    0,
    resolveItemMarketPricing(item.properties, propertiesDb, stored.costs).currencyCost,
  );
}
