/**
 * Item Advanced Calculations — display-only IP / Currency breakdown.
 * Math comes from `calculateItemCosts` / `analyzeItemMarketCurrency`.
 * This file only formats groups and user-facing copy (Rounded Down, omitted empties).
 */

import { PROPERTY_IDS } from '@/lib/id-constants';
import { formatCost } from '@/lib/game/creator-constants';
import {
  analyzeItemMarketCurrency,
  resolveItemPropertyCodexRow,
  type ItemCalcSectionId,
  type ItemMarketPricing,
  type ItemPropertyPayload,
  type ItemPropertyTpRow,
} from './item-calc';

export type { ItemCalcSectionId };

export const ITEM_CALC_SECTION_IDS: ItemCalcSectionId[] = [
  'handedness',
  'range',
  'abilityUtilized',
  'damage',
  'armor',
  'shield',
  'abilityReq',
  'base',
  'properties',
];

export const ITEM_CALC_SECTION_TITLES: Record<ItemCalcSectionId, string> = {
  handedness: 'Handedness',
  range: 'Range',
  abilityUtilized: 'Ability Utilized',
  damage: 'Damage',
  armor: 'Armor',
  shield: 'Shield',
  abilityReq: 'Ability Requirement',
  base: 'Base',
  properties: 'Properties',
};

const ITEM_CALC_SECTION_BY_ID: Record<number, ItemCalcSectionId> = {
  [PROPERTY_IDS.TWO_HANDED]: 'handedness',
  [PROPERTY_IDS.RANGE]: 'range',
  [PROPERTY_IDS.THROWN]: 'range',
  [PROPERTY_IDS.REACH]: 'range',
  [PROPERTY_IDS.FINESSE]: 'abilityUtilized',
  [PROPERTY_IDS.HEAVY]: 'abilityUtilized',
  [PROPERTY_IDS.WEAPON_DAMAGE]: 'damage',
  [PROPERTY_IDS.SPLIT_DAMAGE_DICE]: 'damage',
  [PROPERTY_IDS.DAMAGE_REDUCTION]: 'armor',
  [PROPERTY_IDS.AGILITY_REDUCTION]: 'armor',
  [PROPERTY_IDS.CRITICAL_RANGE_PLUS_1]: 'armor',
  [PROPERTY_IDS.SHIELD_AMOUNT]: 'shield',
  [PROPERTY_IDS.SHIELD_DAMAGE]: 'shield',
  [PROPERTY_IDS.ARMOR_BASE]: 'base',
  [PROPERTY_IDS.SHIELD_BASE]: 'base',
  [PROPERTY_IDS.ARMOR_STRENGTH_REQUIREMENT]: 'abilityReq',
  [PROPERTY_IDS.ARMOR_AGILITY_REQUIREMENT]: 'abilityReq',
  [PROPERTY_IDS.ARMOR_VITALITY_REQUIREMENT]: 'abilityReq',
  [PROPERTY_IDS.WEAPON_STRENGTH_REQUIREMENT]: 'abilityReq',
  [PROPERTY_IDS.WEAPON_AGILITY_REQUIREMENT]: 'abilityReq',
  [PROPERTY_IDS.WEAPON_VITALITY_REQUIREMENT]: 'abilityReq',
  [PROPERTY_IDS.WEAPON_ACUITY_REQUIREMENT]: 'abilityReq',
  [PROPERTY_IDS.WEAPON_INTELLIGENCE_REQUIREMENT]: 'abilityReq',
  [PROPERTY_IDS.WEAPON_CHARISMA_REQUIREMENT]: 'abilityReq',
};

export interface ItemCostLine {
  name: string;
  section: ItemCalcSectionId;
  ip: number;
  currency: number;
  optionLevel: number;
}

export interface ItemAdvancedCalcRow {
  label: string;
  value: string;
  note?: string | undefined;
}

export interface ItemAdvancedCalcGroup {
  title: string;
  rows: ItemAdvancedCalcRow[];
}

const NEAR_ZERO = 1e-9;

function nearlyEqual(a: number, b: number, epsilon = NEAR_ZERO): boolean {
  return Math.abs(a - b) < epsilon;
}

function resolveItemCalcSection(
  pl: ItemPropertyPayload,
  id: number | undefined,
): ItemCalcSectionId {
  if (pl.calcSection) return pl.calcSection;
  if (id != null && ITEM_CALC_SECTION_BY_ID[id]) return ITEM_CALC_SECTION_BY_ID[id]!;
  return 'properties';
}

function formatIpCurrencyValue(ip: number, currency: number): string {
  const bits: string[] = [];
  if (!nearlyEqual(ip, 0)) bits.push(`${formatCost(ip)} IP`);
  if (!nearlyEqual(currency, 0)) bits.push(`${formatCost(currency)} C`);
  return bits.length > 0 ? bits.join(' · ') : '0';
}

export function analyzeItemCosts(
  properties: ItemPropertyPayload[] = [],
  propertiesData: readonly ItemPropertyTpRow[] = [],
): { lines: ItemCostLine[]; totalIP: number; totalCurrency: number } {
  const lines: ItemCostLine[] = [];
  let totalIP = 0;
  let totalCurrency = 0;

  for (const pl of properties) {
    const data = resolveItemPropertyCodexRow(pl, propertiesData);
    if (!data) continue;
    const id = data.id != null ? Number(data.id) : pl.id != null ? Number(pl.id) : undefined;
    const lvl = pl.op_1_lvl || 0;
    const ip = (data.base_ip || 0) + (data.op_1_ip || 0) * lvl;
    const currency = (data.base_c || 0) + (data.op_1_c || 0) * lvl;
    totalIP += ip;
    totalCurrency += currency;
    lines.push({
      name: data.name || pl.name || 'Property',
      section: resolveItemCalcSection(pl, id),
      ip,
      currency,
      optionLevel: lvl,
    });
  }

  return { lines, totalIP, totalCurrency };
}

function lineHasDisplayableCost(line: ItemCostLine): boolean {
  return !nearlyEqual(line.ip, 0) || !nearlyEqual(line.currency, 0);
}

function lineLabel(line: ItemCostLine): string {
  if (line.optionLevel > 0) return `${line.name} (Lvl ${line.optionLevel})`;
  return line.name;
}

export function buildItemAdvancedCalculationGroups(
  properties: ItemPropertyPayload[],
  propertiesData: readonly ItemPropertyTpRow[],
  pricing: Pick<ItemMarketPricing, 'totalIP' | 'totalCurrency' | 'currencyCost' | 'rarity'>,
): ItemAdvancedCalcGroup[] {
  const analysis = analyzeItemCosts(properties, propertiesData);
  const groups: ItemAdvancedCalcGroup[] = [];

  for (const sectionId of ITEM_CALC_SECTION_IDS) {
    const sectionLines = analysis.lines.filter(
      (line) => line.section === sectionId && lineHasDisplayableCost(line),
    );
    if (sectionLines.length === 0) continue;

    const rows: ItemAdvancedCalcRow[] = sectionLines.map((line) => ({
      label: lineLabel(line),
      value: formatIpCurrencyValue(line.ip, line.currency),
    }));

    if (sectionLines.length > 1) {
      const ipSum = sectionLines.reduce((sum, line) => sum + line.ip, 0);
      const cSum = sectionLines.reduce((sum, line) => sum + line.currency, 0);
      if (!nearlyEqual(ipSum, 0) || !nearlyEqual(cSum, 0)) {
        rows.push({
          label: 'Section total',
          value: formatIpCurrencyValue(ipSum, cSum),
        });
      }
    }

    groups.push({
      title: ITEM_CALC_SECTION_TITLES[sectionId],
      rows,
    });
  }

  const { currencyRaw } = analyzeItemMarketCurrency(pricing.totalCurrency, pricing.totalIP);
  const finalCurrency = pricing.currencyCost;
  const totalsRows: ItemAdvancedCalcRow[] = [];

  if (!nearlyEqual(pricing.totalIP, 0)) {
    totalsRows.push({ label: 'Item Points (IP)', value: formatCost(pricing.totalIP) });
  }
  if (!nearlyEqual(pricing.totalCurrency, 0)) {
    totalsRows.push({ label: 'Currency sum (C)', value: formatCost(pricing.totalCurrency) });
  }
  totalsRows.push({ label: 'Rarity', value: pricing.rarity });

  if (!nearlyEqual(currencyRaw, finalCurrency)) {
    totalsRows.push({ label: 'Currency (raw)', value: formatCost(currencyRaw) });
    totalsRows.push({ label: 'Rounded Down', value: finalCurrency.toLocaleString() });
  }

  totalsRows.push({
    label: 'Currency Cost',
    value: finalCurrency.toLocaleString(),
  });

  groups.push({ title: 'Combined Pricing', rows: totalsRows });
  return groups;
}
