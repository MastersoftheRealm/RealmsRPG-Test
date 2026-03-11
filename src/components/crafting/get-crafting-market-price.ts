/**
 * Crafting market price (currency) for items
 * ==========================================
 * Reuses item-calc logic so armaments and equipment show the same currency
 * as Library, add-library-item, and equipment-step.
 */

import type { ItemProperty } from '@/hooks/use-rtdb';
import { deriveItemDisplay, type ItemDocument } from '@/lib/calculators/item-calc';

/** Codex equipment row (from useEquipment) */
export interface CodexEquipmentLike {
  id: string;
  name?: string;
  type?: string;
  currency?: number;
  gold_cost?: number;
  properties?: unknown[];
}

/** User or public library item with optional properties */
export interface LibraryItemLike {
  id: string;
  name?: string;
  description?: string;
  type?: string;
  armamentType?: string;
  properties?: Array<{ id?: number | string; name?: string; op_1_lvl?: number }>;
  damage?: unknown;
}

/**
 * Get market price (currency) for codex equipment. Uses stored currency column.
 */
export function getCodexEquipmentMarketPrice(e: CodexEquipmentLike): number {
  const c = e.currency ?? e.gold_cost ?? 0;
  return Math.max(0, Number(c));
}

/**
 * Get market price for a user or public library item (armament or equipment)
 * using the same calculation as Library and equipment-step.
 */
export function getLibraryItemMarketPrice(
  item: LibraryItemLike,
  propertiesDb: ItemProperty[]
): number {
  const raw = item as unknown as Record<string, unknown>;
  const armamentType = (raw.armamentType as string) || (raw.type as string) || '';
  const normalizedType = armamentType
    ? armamentType.charAt(0).toUpperCase() + armamentType.slice(1).toLowerCase()
    : 'Weapon';
  const doc = {
    name: item.name ?? '',
    description: item.description ?? '',
    armamentType: (normalizedType === 'Weapon' || normalizedType === 'Shield' || normalizedType === 'Armor'
      ? normalizedType
      : 'Weapon') as 'Weapon' | 'Armor' | 'Shield',
    properties: (Array.isArray(item.properties) ? item.properties : []).map((p) => ({
      id: typeof p === 'object' && p && 'id' in p ? p.id : undefined,
      name: typeof p === 'object' && p && 'name' in p ? p.name : undefined,
      op_1_lvl: typeof p === 'object' && p && 'op_1_lvl' in p ? p.op_1_lvl : undefined,
    })),
    damage: item.damage,
  };
  const display = deriveItemDisplay(doc as ItemDocument, propertiesDb);
  return Math.max(0, display.currencyCost);
}

/**
 * Fallback when no propertiesDb: use totalCurrency from calculateItemCosts
 * with empty properties (0). Or for codex-style item with a currency field.
 */
export function getMarketPriceFallback(item: LibraryItemLike & { currency?: number; gold_cost?: number }): number {
  const c = item.currency ?? item.gold_cost ?? 0;
  return Math.max(0, Number(c));
}
