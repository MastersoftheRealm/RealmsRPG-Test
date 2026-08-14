/**
 * Item Calculation Utilities
 * ===========================
 * Ported from public/js/calculators/item-calc.js
 * Provides cost calculation and display helpers for items.
 */

import {
  PROPERTY_IDS,
  GENERAL_PROPERTY_IDS,
  GENERAL_PROPERTY_NAMES,
  findByIdOrName,
  type HasIdAndName,
} from '@/lib/id-constants';
import { ITEM_PROPERTY_CONSTANTS } from '@/lib/game/constants';
import { compactResolvedWeaponRange, formatDamageDisplay, normalizeRangeDisplay } from '@/lib/utils/string';
import type { ItemProperty } from '@/hooks/codex-types';

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

/** Codex / hook row shape for property TP lookup (IDs may be string or number from API). */
export type ItemPropertyTpRow = HasIdAndName & {
  description?: string;
  base_tp?: number;
  tp_cost?: number;
  op_1_tp?: number;
  base_ip?: number;
  op_1_ip?: number;
  base_c?: number;
  op_1_c?: number;
  mechanic?: boolean;
};

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

/** IP band picks rarity; `low` is the pricing floor; `currencyMax` is the GAME_RULES band ceiling. */
const RARITY_BRACKETS = [
  { name: 'Common', low: 25, currencyMax: 99, ipLow: 0, ipHigh: 4 },
  { name: 'Uncommon', low: 100, currencyMax: 499, ipLow: 4.01, ipHigh: 6 },
  { name: 'Rare', low: 500, currencyMax: 1499, ipLow: 6.01, ipHigh: 8 },
  { name: 'Epic', low: 2500, currencyMax: 9999, ipLow: 8.01, ipHigh: 11 },
  { name: 'Legendary', low: 10000, currencyMax: 49999, ipLow: 11.01, ipHigh: 14 },
  { name: 'Mythic', low: 50000, currencyMax: 99999, ipLow: 14.01, ipHigh: 16 },
  { name: 'Ascended', low: 100000, currencyMax: Infinity, ipLow: 16.01, ipHigh: Infinity },
] as const;

/** Property IDs that are driven by dedicated UI (damage, range, DR, etc.) and must not appear in the add-property list on load to avoid duplicating cost/display. */
const MECHANIC_PROPERTY_IDS = new Set<number>([
  PROPERTY_IDS.DAMAGE_REDUCTION,
  PROPERTY_IDS.AGILITY_REDUCTION,
  PROPERTY_IDS.SPLIT_DAMAGE_DICE,
  PROPERTY_IDS.RANGE,
  PROPERTY_IDS.TWO_HANDED,
  PROPERTY_IDS.SHIELD_BASE,
  PROPERTY_IDS.ARMOR_BASE,
  PROPERTY_IDS.WEAPON_DAMAGE,
  PROPERTY_IDS.CRITICAL_RANGE_PLUS_1,
  PROPERTY_IDS.SHIELD_AMOUNT,
  PROPERTY_IDS.SHIELD_DAMAGE,
  // Ability requirements (restored from item.abilityRequirement, not property list)
  PROPERTY_IDS.ARMOR_STRENGTH_REQUIREMENT,
  PROPERTY_IDS.ARMOR_AGILITY_REQUIREMENT,
  PROPERTY_IDS.ARMOR_VITALITY_REQUIREMENT,
  PROPERTY_IDS.WEAPON_STRENGTH_REQUIREMENT,
  PROPERTY_IDS.WEAPON_AGILITY_REQUIREMENT,
  PROPERTY_IDS.WEAPON_VITALITY_REQUIREMENT,
  PROPERTY_IDS.WEAPON_ACUITY_REQUIREMENT,
  PROPERTY_IDS.WEAPON_INTELLIGENCE_REQUIREMENT,
  PROPERTY_IDS.WEAPON_CHARISMA_REQUIREMENT,
]);

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
 * Check if a property is mechanic-only (handled by dedicated UI, not the "add property" list).
 * Use when loading saved items: only non-mechanic properties should go into the selectable list
 * to avoid duplicating them (they already appear in damage, DR, range, etc.).
 * Considers both the codex mechanic flag and a known set of mechanic property IDs (so loading
 * still works even if the codex has mechanic: false for e.g. Weapon Damage or Range).
 */
export function isMechanicProperty(prop: ItemPropertyPayload | ItemProperty | { mechanic?: boolean; id?: number | string }): boolean {
  if (!prop || typeof prop !== 'object') return false;
  if ((prop as ItemProperty).mechanic === true) return true;
  const id = (prop as ItemPropertyPayload).id ?? (prop as ItemProperty).id;
  if (id !== undefined && id !== null) {
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (!Number.isNaN(numId) && MECHANIC_PROPERTY_IDS.has(numId)) return true;
  }
  return false;
}

/**
 * Filter saved item properties to only those that belong in the user-selectable list.
 * Excludes mechanic properties so they are not duplicated on load (mechanic state is
 * restored from dedicated fields: damage, damageReduction, rangeLevel, etc.).
 * Reuse this pattern in creators: when loading, restore "list" items from saved data
 * only for non-mechanic entries; mechanic entries are restored from their dedicated UI state.
 */
export function filterSavedItemPropertiesForList(
  savedProperties: Array<{ id?: number | string; name?: string; op_1_lvl?: number }>,
  propertiesDb: ItemProperty[]
): Array<{ property: ItemProperty; op_1_lvl: number }> {
  const result: Array<{ property: ItemProperty; op_1_lvl: number }> = [];
  for (const saved of savedProperties || []) {
    const match = findByIdOrName(propertiesDb, { id: saved.id, name: saved.name });
    if (match && !isMechanicProperty(match)) {
      result.push({
        property: match,
        op_1_lvl: saved.op_1_lvl ?? 0,
      });
    }
  }
  return result;
}

export { computeSplits } from './dice-splits';

// =============================================================================
// Core Calculations
// =============================================================================

/**
 * Calculate currency cost and rarity from IP and currency totals.
 * IP selects the rarity band; currency (`c`) prices inside it; the result is
 * clamped to that band's `currencyMax` so it cannot spill into the next rarity
 * (GAME_RULES "Rarity & Currency").
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
  if (bracket) {
    currencyCost = Math.max(currencyCost, bracket.low);
    if (Number.isFinite(bracket.currencyMax)) {
      currencyCost = Math.min(currencyCost, bracket.currencyMax);
    }
  }

  return { currencyCost: Math.floor(currencyCost), rarity };
}

// Legacy alias
export const calculateGoldCostAndRarity = calculateCurrencyCostAndRarity;

/** Normalize API / UI property refs (string name or object with optional id, name, op_1_lvl) for lookups. */
function normalizeItemPropertyRef(ref: unknown): ItemPropertyPayload {
  if (typeof ref === 'string') return { name: ref };
  if (!ref || typeof ref !== 'object') return {};
  const o = ref as Record<string, unknown>;
  let id: number | undefined;
  const idRaw = o.id;
  if (typeof idRaw === 'number' && !Number.isNaN(idRaw)) id = idRaw;
  else if (typeof idRaw === 'string') {
    const n = parseInt(idRaw, 10);
    if (!Number.isNaN(n)) id = n;
  }
  const opRaw = o.op_1_lvl;
  const op_1_lvl =
    typeof opRaw === 'number' && !Number.isNaN(opRaw)
      ? opRaw
      : typeof opRaw === 'string'
        ? (() => {
            const n = parseInt(opRaw, 10);
            return Number.isNaN(n) ? 0 : n;
          })()
        : 0;
  return {
    id,
    name: typeof o.name === 'string' ? o.name : undefined,
    op_1_lvl,
  };
}

/** Resolve codex row for a saved property reference (id, name, or string name). Case-insensitive name fallback. */
export function resolveItemPropertyCodexRow(
  ref: unknown,
  propertiesData: readonly ItemPropertyTpRow[]
): ItemPropertyTpRow | undefined {
  const payload = normalizeItemPropertyRef(ref);
  const rows = [...propertiesData];
  let data = findByIdOrName(rows, payload);
  if (!data && payload.name) {
    const n = String(payload.name).toLowerCase();
    data = rows.find((p) => String(p.name ?? '').toLowerCase() === n);
  }
  return data;
}

/**
 * Training points for one property line: base TP (+ legacy tp_cost) + option-1 TP × op_1_lvl.
 * Matches `calculateItemCosts` per property (used for chips so TP is visible when base is 0 but options cost TP).
 */
export function trainingPointsForItemPropertyRef(
  ref: unknown,
  propertiesData: readonly ItemPropertyTpRow[]
): number {
  const payload = normalizeItemPropertyRef(ref);
  const data = resolveItemPropertyCodexRow(payload, propertiesData);
  if (!data) return 0;
  const lvl = payload.op_1_lvl || 0;
  const baseTP = data.base_tp || data.tp_cost || 0;
  const op1TP = data.op_1_tp || 0;
  return baseTP + op1TP * lvl;
}

/**
 * Calculate total IP, TP, and Currency from properties.
 */
export function calculateItemCosts(
  properties: ItemPropertyPayload[],
  propertiesData: readonly ItemPropertyTpRow[]
): ItemCostResult {
  let totalIP = 0;
  let totalTP = 0;
  let totalCurrency = 0;

  (properties || []).forEach((ref) => {
    const data = resolveItemPropertyCodexRow(ref, propertiesData);
    if (!data) return;

    const payload = normalizeItemPropertyRef(ref);
    const lvl = payload.op_1_lvl || 0;

    const baseIP = data.base_ip || 0;
    const op1IP = data.op_1_ip || 0;
    const baseC = data.base_c || 0;
    const op1C = data.op_1_c || 0;

    totalIP += baseIP + op1IP * lvl;
    totalTP += trainingPointsForItemPropertyRef(ref, propertiesData);
    totalCurrency += baseC + op1C * lvl;
  });

  return { totalIP, totalTP, totalCurrency };
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
  const n =
    ITEM_PROPERTY_CONSTANTS.RANGE_BASE_SPACES +
    lvl * ITEM_PROPERTY_CONSTANTS.RANGE_SPACES_PER_LEVEL;
  return `${n} ${n === 1 ? 'space' : 'spaces'}`;
}

/**
 * Display SoT for weapon/shield range (TASK-701).
 * Prefer `formatRange(properties)` when properties are present; fall back to stored
 * range only when properties are absent. Never surface raw op_1_lvl integers or `"0"`.
 */
export function resolveWeaponRangeDisplay(
  storedRange: string | number | null | undefined,
  properties?: ItemPropertyPayload[] | null
): string {
  const props = properties ?? [];
  if (props.length > 0) {
    return formatRange(props);
  }

  const normalized = normalizeRangeDisplay(storedRange);
  if (!normalized || normalized === '0' || normalized === '-') {
    return 'Melee';
  }
  if (/^melee$/i.test(normalized)) {
    return 'Melee';
  }
  // Corrupt stored values: bare integers are op_1_lvl, not display spaces.
  if (/^\d+$/.test(normalized)) {
    return 'Melee';
  }
  return normalized;
}

/** Resolved + compact weapon range for dense cells (TASK-701). */
export function formatWeaponRangeDisplayCompact(
  storedRange: string | number | null | undefined,
  properties?: ItemPropertyPayload[] | null
): string {
  return compactResolvedWeaponRange(resolveWeaponRangeDisplay(storedRange, properties));
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

/** Derive Agility Reduction from properties (1 + op_1_lvl; matches item creator storage). */
export function deriveAgilityReductionFromProperties(properties: ItemPropertyPayload[]): number {
  const arProp = (properties || []).find((p) => {
    if (p.id === PROPERTY_IDS.AGILITY_REDUCTION) return true;
    return p.name === 'Agility Reduction';
  });
  if (!arProp) return 0;
  return 1 + (arProp.op_1_lvl || 0);
}

/**
 * Derive Critical Range +1 levels from properties (1 + op_1_lvl per stack).
 */
export function deriveCriticalRangeIncreaseFromProperties(properties: ItemPropertyPayload[]): number {
  const critProp = (properties || []).find((p) => {
    if (p.id === PROPERTY_IDS.CRITICAL_RANGE_PLUS_1) return true;
    return p.name === 'Critical Range +1';
  });
  if (!critProp) return 0;
  return 1 + (critProp.op_1_lvl || 0);
}

/** Dice sizes for shield amount display (level % 3 → d4, d6, d8) */
const SHIELD_DICE_SIZES = [4, 6, 8] as const;

/**
 * Derive shield block amount (e.g. "1d4") from Shield Amount property.
 * Item creator formula: level = ((amount*size) - 4) / 2. Reverse: amount = floor(level/3)+1, size = [4,6,8][level%3].
 */
export function deriveShieldAmountFromProperties(properties: ItemPropertyPayload[]): string {
  const prop = (properties || []).find((p) => {
    if (p.id === PROPERTY_IDS.SHIELD_AMOUNT) return true;
    return p.name === 'Shield Amount';
  });
  if (!prop) return '-';
  const level = Math.max(0, prop.op_1_lvl ?? 0);
  const amount = Math.floor(level / 3) + 1;
  const size = SHIELD_DICE_SIZES[level % 3];
  return `${amount}d${size}`;
}

/**
 * Derive shield damage dice (e.g. "1d4 Bludgeoning") from Shield Damage property, if present.
 */
export function deriveShieldDamageFromProperties(properties: ItemPropertyPayload[]): string | null {
  const prop = (properties || []).find((p) => {
    if (p.id === PROPERTY_IDS.SHIELD_DAMAGE) return true;
    return p.name === 'Shield Damage';
  });
  if (!prop || (prop.op_1_lvl ?? 0) <= 0) return null;
  const level = Math.max(0, prop.op_1_lvl ?? 0);
  const amount = Math.floor(level / 3) + 1;
  const size = SHIELD_DICE_SIZES[level % 3];
  return `${amount}d${size} Bludgeoning`;
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
    const baseTP = data.base_tp || 0;
    const op1TP = data.op_1_tp || 0;
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
  const damageStr = formatDamageDisplay(item.damage);
  const rangeStr = resolveWeaponRangeDisplay(undefined, properties);
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
