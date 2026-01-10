/**
 * Item Calculation Utilities
 * ===========================
 * Ported from public/js/calculators/item-calc.js
 * Provides cost calculation and display helpers for items.
 */

import { PROPERTY_IDS, GENERAL_PROPERTY_IDS, GENERAL_PROPERTY_NAMES, findByIdOrName } from '@/lib/id-constants';
import type { ItemProperty } from '@/hooks/use-rtdb';

// Re-export for convenience
export { PROPERTY_IDS, GENERAL_PROPERTY_IDS, GENERAL_PROPERTY_NAMES };
export type { ItemProperty };

// =============================================================================
// Types
// =============================================================================

export interface ItemPropertyPayload {
  id?: number;
  name?: string;
  op_1_lvl?: number;
  property?: ItemProperty;
}

export interface ItemCostResult {
  totalIP: number;
  totalTP: number;
  totalCurrency: number;
}

export interface RarityResult {
  currencyCost: number;
  rarity: string;
}

export interface ProficiencyInfo {
  id: number | string;
  name: string;
  level: number;
  baseTP: number;
  optionTP: number;
  totalTP: number;
  description: string;
}

export interface ItemDamage {
  amount: number | string;
  size: number | string;
  type: string;
}

export interface ItemDocument {
  name?: string;
  description?: string;
  armamentType?: 'Weapon' | 'Armor' | 'Shield' | 'Accessory';
  properties?: ItemPropertyPayload[];
  damage?: ItemDamage[];
}

export interface ItemDisplayData {
  name: string;
  armamentType: string;
  description: string;
  rarity: string;
  currencyCost: number;
  goldCost: number; // Legacy alias
  totalIP: number;
  totalTP: number;
  totalCurrency: number;
  range: string;
  damage: string;
  damageReduction: number;
  proficiencies: ProficiencyInfo[];
}

// =============================================================================
// Constants
// =============================================================================

const RARITY_BRACKETS = [
  { name: 'Common', low: 25, ipLow: 0, ipHigh: 4 },
  { name: 'Uncommon', low: 100, ipLow: 4.01, ipHigh: 6 },
  { name: 'Rare', low: 500, ipLow: 6.01, ipHigh: 8 },
  { name: 'Epic', low: 2500, ipLow: 8.01, ipHigh: 11 },
  { name: 'Legendary', low: 10000, ipLow: 11.01, ipHigh: 14 },
  { name: 'Mythic', low: 50000, ipLow: 14.01, ipHigh: 16 },
  { name: 'Ascended', low: 100000, ipLow: 16.01, ipHigh: Infinity },
] as const;

// =============================================================================
// Helpers
// =============================================================================

/**
 * Check if a property is a general/built-in property.
 */
export function isGeneralProperty(prop: ItemPropertyPayload | ItemProperty): boolean {
  if (!prop) return false;
  if ('id' in prop && prop.id !== undefined && GENERAL_PROPERTY_IDS.has(prop.id as number)) {
    return true;
  }
  if ('name' in prop && prop.name && GENERAL_PROPERTY_NAMES.has(prop.name)) {
    return true;
  }
  return false;
}

/**
 * Compute number of damage dice splits needed.
 */
export function computeSplits(diceAmt: number, dieSize: number): number {
  const valid = [4, 6, 8, 10, 12];
  if (!valid.includes(dieSize) || diceAmt <= 1) return 0;
  const total = diceAmt * dieSize;
  const minDiceUsingD12 = Math.ceil(total / 12);
  return Math.max(0, diceAmt - minDiceUsingD12);
}

// =============================================================================
// Core Calculations
// =============================================================================

/**
 * Calculate currency cost and rarity from IP and currency totals.
 */
export function calculateCurrencyCostAndRarity(
  totalCurrency: number,
  totalIP: number
): RarityResult {
  const ip = Math.max(0, totalIP);
  const c = Math.max(0, totalCurrency);
  let rarity = 'Common';
  let currencyCost = 0;

  for (const br of RARITY_BRACKETS) {
    if (ip >= br.ipLow && ip <= br.ipHigh) {
      rarity = br.name;
      currencyCost = br.low * (1 + 0.125 * c);
      break;
    }
  }

  const bracket = RARITY_BRACKETS.find((b) => b.name === rarity);
  if (bracket) currencyCost = Math.max(currencyCost, bracket.low);

  return { currencyCost: Math.floor(currencyCost), rarity };
}

// Legacy alias
export const calculateGoldCostAndRarity = calculateCurrencyCostAndRarity;

/**
 * Calculate total IP, TP, and Currency from properties.
 */
export function calculateItemCosts(
  properties: ItemPropertyPayload[],
  propertiesData: ItemProperty[]
): ItemCostResult {
  let totalIP = 0;
  let totalTP = 0;
  let totalCurrency = 0;

  (properties || []).forEach((ref) => {
    const data = findByIdOrName(propertiesData, ref);
    if (!data) return;

    const lvl = ref.op_1_lvl || 0;

    // Access properties with optional chaining for safety
    const baseIP = (data as unknown as { base_ip?: number }).base_ip || 0;
    const op1IP = (data as unknown as { op_1_ip?: number }).op_1_ip || 0;
    const baseTP = (data as unknown as { base_tp?: number }).base_tp || 0;
    const op1TP = (data as unknown as { op_1_tp?: number }).op_1_tp || 0;
    const baseC = (data as unknown as { base_c?: number }).base_c || 0;
    const op1C = (data as unknown as { op_1_c?: number }).op_1_c || 0;

    totalIP += baseIP + op1IP * lvl;
    totalTP += baseTP + op1TP * lvl;
    totalCurrency += baseC + op1C * lvl;
  });

  return { totalIP, totalTP, totalCurrency };
}

/**
 * Format damage array as a string.
 */
export function formatDamage(damageArr?: ItemDamage[]): string {
  if (!Array.isArray(damageArr)) return '';
  return damageArr
    .filter((d) => d && d.amount && d.size && d.type && d.type !== 'none')
    .map((d) => `${d.amount}d${d.size} ${d.type}`)
    .join(', ');
}

/**
 * Format range from properties.
 */
export function formatRange(properties: ItemPropertyPayload[]): string {
  const prop = (properties || []).find((p) => {
    if (p.id === PROPERTY_IDS.RANGE) return true;
    return p.name === 'Range';
  });
  if (!prop) return 'Melee';
  const lvl = prop.op_1_lvl || 0;
  return `${8 + lvl * 8} Spaces`;
}

/**
 * Derive Damage Reduction from properties.
 */
export function deriveDamageReductionFromProperties(properties: ItemPropertyPayload[]): number {
  const drProp = (properties || []).find((p) => {
    if (p.id === PROPERTY_IDS.DAMAGE_REDUCTION) return true;
    return p.name === 'Damage Reduction';
  });
  if (!drProp) return 0;
  return 1 + (drProp.op_1_lvl || 0);
}

/**
 * Extract proficiencies (TP sources) from properties.
 */
export function extractProficiencies(
  properties: ItemPropertyPayload[],
  propertiesData: ItemProperty[]
): ProficiencyInfo[] {
  const profs: ProficiencyInfo[] = [];

  (properties || []).forEach((ref) => {
    const data = findByIdOrName(propertiesData, ref);
    if (!data) return;

    const lvl = ref.op_1_lvl || 0;
    const baseTP = (data as unknown as { base_tp?: number }).base_tp || 0;
    const op1TP = (data as unknown as { op_1_tp?: number }).op_1_tp || 0;
    const optTP = lvl > 0 ? op1TP * lvl : 0;
    const totalTP = baseTP + optTP;

    if (totalTP > 0) {
      profs.push({
        id: data.id || 0,
        name: data.name || '',
        level: lvl,
        baseTP,
        optionTP: optTP,
        totalTP,
        description: data.description || '',
      });
    }
  });

  return profs;
}

/**
 * Build full display data from a saved item document.
 */
export function deriveItemDisplay(
  item: ItemDocument,
  propertiesData: ItemProperty[]
): ItemDisplayData {
  const properties = item.properties || [];
  const costs = calculateItemCosts(properties, propertiesData);
  const { currencyCost, rarity } = calculateCurrencyCostAndRarity(
    costs.totalCurrency,
    costs.totalIP
  );
  const damageStr = formatDamage(item.damage);
  const rangeStr = formatRange(properties);
  const dr = deriveDamageReductionFromProperties(properties);
  const profs = extractProficiencies(properties, propertiesData);

  return {
    name: item.name || '',
    armamentType: item.armamentType || 'Weapon',
    description: item.description || '',
    rarity,
    currencyCost,
    goldCost: currencyCost, // Legacy alias
    totalIP: costs.totalIP,
    totalTP: costs.totalTP,
    totalCurrency: costs.totalCurrency,
    range: rangeStr,
    damage: damageStr,
    damageReduction: dr,
    proficiencies: profs,
  };
}

/**
 * Format a proficiency chip for display.
 */
export function formatProficiencyChip(p: ProficiencyInfo): string {
  let txt = p.name;
  if (p.level > 0) txt += ` (Level ${p.level})`;
  if (p.totalTP > 0) {
    txt += ` | TP: ${p.baseTP}`;
    if (p.optionTP > 0) txt += ` + ${p.optionTP}`;
  }
  return txt;
}
