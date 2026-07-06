/**
 * Guided equipment — starting currency and spend math (shared with equipment-step).
 */

import { CHARACTER_STARTING_CURRENCY } from '@/stores/character-creator-store';

/** Max unit cost for gear items in guided Layer 2 shop. */
export const GUIDED_GEAR_L2_MAX_UNIT_COST = 50;

const CURRENCY_GROWTH = 1.45;

export interface CurrencyLineItem {
  cost?: number;
  quantity?: number;
  gold_cost?: number;
  currency?: number;
}

/** Starting currency by level (matches equipment-step). */
export function computeStartingCurrency(level = 1): number {
  if (level <= 1) return CHARACTER_STARTING_CURRENCY;
  return Math.round(CHARACTER_STARTING_CURRENCY * Math.pow(CURRENCY_GROWTH, level - 1));
}

export function resolveItemUnitCost(item: CurrencyLineItem): number {
  return Number(item.gold_cost ?? item.currency ?? item.cost ?? 0) || 0;
}

export function computeSpentCurrency(items: CurrencyLineItem[]): number {
  return items.reduce(
    (sum, item) => sum + resolveItemUnitCost(item) * Math.max(1, item.quantity ?? 1),
    0
  );
}

export function computeRemainingCurrency(starting: number, spent: number): number {
  return starting - spent;
}

/** Whether adding qty units of an item would exceed remaining currency. */
export function wouldExceedCurrency(
  remaining: number,
  unitCost: number,
  quantity: number
): boolean {
  return unitCost * quantity > remaining;
}
