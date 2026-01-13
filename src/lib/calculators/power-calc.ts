/**
 * Power Calculation Utilities
 * ============================
 * Ported from public/js/calculators/power-calc.js
 * Provides cost calculation and display helpers for powers.
 */

import type { PowerPart } from '@/hooks/use-rtdb';
import { PART_IDS, findByIdOrName } from '@/lib/id-constants';

// Re-export for backwards compatibility
export { PART_IDS, findByIdOrName };

// =============================================================================
// Types
// =============================================================================

export interface PowerPartPayload {
  id?: number;
  name?: string;
  part?: PowerPart;
  op_1_lvl?: number;
  op_2_lvl?: number;
  op_3_lvl?: number;
  opt1Level?: number; // Legacy format
  opt2Level?: number;
  opt3Level?: number;
  applyDuration?: boolean;
}

export interface PowerCostResult {
  totalEnergy: number;
  totalTP: number;
  tpSources: string[];
  energyRaw: number;
}

export interface PowerDisplayData {
  name: string;
  description: string;
  actionType: string;
  range: string;
  area: string;
  duration: string;
  energy: number;
  tp: number;
  tpSources: string[];
  partChips: PartChipData[];
}

export interface PartChipData {
  text: string;
  description: string;
  finalTP: number;
  hasTP: boolean;
}

/**
 * Get option level from payload, supporting both formats
 */
function getOptionLevel(pl: PowerPartPayload, option: 1 | 2 | 3): number {
  const isUiShape = pl.part !== undefined;
  if (option === 1) return isUiShape ? (pl.op_1_lvl ?? pl.opt1Level ?? 0) : (pl.op_1_lvl ?? 0);
  if (option === 2) return isUiShape ? (pl.op_2_lvl ?? pl.opt2Level ?? 0) : (pl.op_2_lvl ?? 0);
  return isUiShape ? (pl.op_3_lvl ?? pl.opt3Level ?? 0) : (pl.op_3_lvl ?? 0);
}

// =============================================================================
// Core Cost Calculator
// =============================================================================

/**
 * Calculate total energy, TP and list TP sources for a power.
 * Uses the unified equation:
 * (flat_normal * perc_all) + ((dur_all + 1) * flat_duration * perc_dur) - (flat_duration * perc_dur)
 */
export function calculatePowerCosts(
  partsPayload: PowerPartPayload[] = [],
  partsDb: PowerPart[] = []
): PowerCostResult {
  let flat_normal = 0;
  let flat_duration = 0;
  let perc_all = 1;
  let perc_dur = 1;
  let dur_all = 1;
  let hasDurationParts = false;
  let totalTP = 0;
  const tpSources: string[] = [];

  partsPayload.forEach((pl) => {
    // Normalize to support both saved-format and UI-format
    const isUiShape = pl.part !== undefined;

    // Get part definition - prefer ID lookup, fallback to name
    let def: PowerPart | undefined;
    if (isUiShape) {
      def = pl.part;
    } else {
      def = findByIdOrName(partsDb, pl);
    }
    if (!def) return;

    const l1 = getOptionLevel(pl, 1);
    const l2 = getOptionLevel(pl, 2);
    const l3 = getOptionLevel(pl, 3);
    const applyToDuration = pl.applyDuration || false;

    // Energy contribution (effective energy)
    const energyContribution =
      (def.base_en || 0) +
      (def.op_1_en || 0) * l1 +
      (def.op_2_en || 0) * l2 +
      (def.op_3_en || 0) * l3;

    // Categorize based on part flags
    const isDuration = def.duration;
    const isPercentage = def.percentage;

    if (isDuration) {
      dur_all *= energyContribution;
      hasDurationParts = true;
    } else if (isPercentage) {
      perc_all *= energyContribution;
      if (applyToDuration) perc_dur *= energyContribution;
    } else {
      flat_normal += energyContribution;
      if (applyToDuration) flat_duration += energyContribution;
    }

    // TP calculation (floor entire sum)
    const rawTP =
      (def.base_tp || 0) +
      (def.op_1_tp || 0) * l1 +
      (def.op_2_tp || 0) * l2 +
      (def.op_3_tp || 0) * l3;

    const partTP = Math.floor(rawTP);
    if (partTP > 0) {
      let src = `${partTP} TP: ${def.name}`;
      if (l1 > 0) src += ` (Opt1 ${l1})`;
      if (l2 > 0) src += ` (Opt2 ${l2})`;
      if (l3 > 0) src += ` (Opt3 ${l3})`;
      tpSources.push(src);
    }
    totalTP += partTP;
  });

  // If no duration parts exist, dur_all should be 0 (not 1)
  if (!hasDurationParts) dur_all = 0;

  // Unified power energy equation
  const totalEnergyRaw =
    flat_normal * perc_all +
    (dur_all + 1) * flat_duration * perc_dur -
    flat_duration * perc_dur;
  const totalEnergy = Math.ceil(totalEnergyRaw);

  return { totalEnergy, totalTP, tpSources, energyRaw: totalEnergyRaw };
}

// =============================================================================
// Action Type
// =============================================================================

/**
 * Compute action type from parts payload
 */
export function computeActionType(
  partsPayload: PowerPartPayload[] = [],
  partsDb: PowerPart[] = []
): string {
  let actionType = 'Basic';
  let isReaction = false;

  partsPayload.forEach((p) => {
    // Get part ID
    let partId: number | undefined;
    if (p.part?.id !== undefined) {
      partId = Number(p.part.id);
    } else if (p.id !== undefined) {
      partId = p.id;
    } else if (p.part?.name || p.name) {
      const name = p.part?.name || p.name;
      const def = findByIdOrName(partsDb, { name: name! });
      partId = def ? Number(def.id) : undefined;
    }

    const l1 = getOptionLevel(p, 1);

    if (partId === PART_IDS.POWER_REACTION) isReaction = true;
    else if (partId === PART_IDS.POWER_QUICK_OR_FREE_ACTION) {
      if (l1 === 0) actionType = 'Quick';
      else if (l1 === 1) actionType = 'Free';
    } else if (partId === PART_IDS.POWER_LONG_ACTION) {
      if (l1 === 0) actionType = 'Long (3)';
      else if (l1 === 1) actionType = 'Long (4)';
    }
  });

  return isReaction ? `${actionType} Reaction` : `${actionType} Action`;
}

/**
 * Helper when UI stores selector value
 */
export function computeActionTypeFromSelection(
  selection: string,
  reactionFlag: boolean
): string {
  let base = 'Basic';
  if (selection === 'quick') base = 'Quick';
  else if (selection === 'free') base = 'Free';
  else if (selection === 'long3') base = 'Long (3)';
  else if (selection === 'long4') base = 'Long (4)';
  return reactionFlag ? `${base} Reaction` : `${base} Action`;
}

// =============================================================================
// Mechanic Part Assembly
// =============================================================================

export interface PowerMechanicContext {
  actionTypeSelection?: string;
  reaction?: boolean;
  damageType?: string;
  diceAmt?: number;
  dieSize?: number;
  partsDb?: PowerPart[];
}

/**
 * Map damage type string to RTDB part ID
 */
function getDamagePartId(damageType: string): number | null {
  switch (damageType) {
    case 'magic':
      return PART_IDS.MAGIC_DAMAGE;
    case 'light':
    case 'radiant':
      return PART_IDS.LIGHT_DAMAGE;
    case 'fire':
    case 'cold':
    case 'lightning':
    case 'ice':
    case 'acid':
      return PART_IDS.ELEMENTAL_DAMAGE;
    case 'poison':
    case 'necrotic':
      return PART_IDS.POISON_OR_NECROTIC_DAMAGE;
    case 'sonic':
      return PART_IDS.SONIC_DAMAGE;
    case 'spiritual':
      return PART_IDS.SPIRITUAL_DAMAGE;
    case 'psychic':
      return PART_IDS.PSYCHIC_DAMAGE;
    case 'physical':
    case 'bludgeoning':
    case 'piercing':
    case 'slashing':
      return PART_IDS.PHYSICAL_DAMAGE;
    default:
      return null;
  }
}

/**
 * Map damage type to part name
 */
function getDamagePartName(damageType: string): string {
  switch (damageType) {
    case 'magic':
      return 'Magic Damage';
    case 'light':
    case 'radiant':
      return 'Light Damage';
    case 'fire':
    case 'cold':
    case 'lightning':
    case 'ice':
    case 'acid':
      return 'Elemental Damage';
    case 'poison':
    case 'necrotic':
      return 'Poison or Necrotic Damage';
    case 'sonic':
      return 'Sonic Damage';
    case 'spiritual':
      return 'Spiritual Damage';
    case 'psychic':
      return 'Psychic Damage';
    case 'physical':
    case 'bludgeoning':
    case 'piercing':
    case 'slashing':
      return 'Physical Damage';
    default:
      return '';
  }
}

/**
 * Build mechanic part payloads based on current UI selections.
 * Converts action type and damage selections into RTDB parts for cost calculation.
 */
export function buildPowerMechanicPartPayload(
  ctx: PowerMechanicContext
): Array<{ id: number; name: string; op_1_lvl: number; op_2_lvl: number; op_3_lvl: number; applyDuration: boolean }> {
  const {
    actionTypeSelection = 'basic',
    reaction = false,
    damageType = 'none',
    diceAmt = 0,
    dieSize = 0,
    partsDb = [],
  } = ctx || {};

  const payload: Array<{ id: number; name: string; op_1_lvl: number; op_2_lvl: number; op_3_lvl: number; applyDuration: boolean }> = [];

  function pushIf(partId: number, partName: string, op1 = 0, applyDuration = false): void {
    // Try by ID first, then by name for backwards compatibility
    let def = findByIdOrName(partsDb, { id: partId });
    if (!def) def = findByIdOrName(partsDb, { name: partName });
    // Only include mechanic parts
    if (def && def.mechanic) {
      payload.push({
        id: Number(def.id),
        name: def.name || partName,
        op_1_lvl: op1,
        op_2_lvl: 0,
        op_3_lvl: 0,
        applyDuration,
      });
    }
  }

  // Action / Reaction
  if (reaction) pushIf(PART_IDS.POWER_REACTION, 'Power Reaction', 0);
  if (actionTypeSelection === 'quick') pushIf(PART_IDS.POWER_QUICK_OR_FREE_ACTION, 'Power Quick or Free Action', 0);
  else if (actionTypeSelection === 'free') pushIf(PART_IDS.POWER_QUICK_OR_FREE_ACTION, 'Power Quick or Free Action', 1);
  else if (actionTypeSelection === 'long3') pushIf(PART_IDS.POWER_LONG_ACTION, 'Power Long Action', 0);
  else if (actionTypeSelection === 'long4') pushIf(PART_IDS.POWER_LONG_ACTION, 'Power Long Action', 1);

  // Damage
  if (damageType !== 'none' && diceAmt > 0 && dieSize >= 4) {
    const partId = getDamagePartId(damageType);
    const partName = getDamagePartName(damageType);
    if (partId && partName) {
      // Power damage formula: opt1Level = floor((totalDamage - 4) / 2)
      const totalDamage = diceAmt * dieSize;
      const opt1Level = Math.max(0, Math.floor((totalDamage - 4) / 2));
      pushIf(partId, partName, opt1Level);
    }
  }

  return payload;
}

// =============================================================================
// Range / Area / Duration Derivation
// =============================================================================

/**
 * Derive range string from parts
 */
export function deriveRange(
  partsPayload: PowerPartPayload[] = [],
  partsDb: PowerPart[] = []
): string {
  const pr = partsPayload.find((p) => {
    const partId = p.part?.id ?? p.id;
    if (Number(partId) === PART_IDS.POWER_RANGE) return true;
    const name = p.part?.name || p.name;
    return name === 'Power Range';
  });
  if (!pr) return '1 space';
  const lvl = getOptionLevel(pr, 1);
  const spaces = 3 + 3 * lvl;
  return `${spaces} ${spaces > 1 ? 'spaces' : 'space'}`;
}

/**
 * Derive area string from parts
 */
export function deriveArea(
  partsPayload: PowerPartPayload[] = [],
  _partsDb: PowerPart[] = []
): string {
  const areaPartIds = [
    PART_IDS.SPHERE_OF_EFFECT,
    PART_IDS.CYLINDER_OF_EFFECT,
    PART_IDS.CONE_OF_EFFECT,
    PART_IDS.LINE_OF_EFFECT,
    PART_IDS.TRAIL_OF_EFFECT,
  ];
  const areaNames = ['Sphere', 'Cylinder', 'Cone', 'Line', 'Trail'];

  for (let i = 0; i < areaPartIds.length; i++) {
    const found = partsPayload.find((p) => {
      const partId = p.part?.id ?? p.id;
      if (Number(partId) === areaPartIds[i]) return true;
      const name = p.part?.name || p.name;
      return name === `${areaNames[i]} of Effect`;
    });
    if (found) return areaNames[i];
  }
  return '1 target';
}

/**
 * Derive duration string from parts
 */
export function deriveDuration(
  partsPayload: PowerPartPayload[] = [],
  _partsDb: PowerPart[] = []
): string {
  const findPartById = (partId: number, fallbackName: string) =>
    partsPayload.find((p) => {
      const id = p.part?.id ?? p.id;
      if (Number(id) === partId) return true;
      const name = p.part?.name || p.name;
      return name === fallbackName;
    });
  const getLvl = (p: PowerPartPayload | undefined) =>
    p ? getOptionLevel(p, 1) : 0;

  const permanentPart = findPartById(PART_IDS.DURATION_PERMANENT, 'Duration (Permanent)');
  if (permanentPart) return 'Permanent';

  const roundPart = findPartById(PART_IDS.DURATION_ROUND, 'Duration (Round)');
  if (roundPart) {
    const lvl = getLvl(roundPart);
    const rounds = 2 + lvl;
    return `${rounds} ${rounds > 1 ? 'rounds' : 'round'}`;
  }

  const minutePart = findPartById(PART_IDS.DURATION_MINUTE, 'Duration (Minute)');
  if (minutePart) {
    const lvl = getLvl(minutePart);
    const minutes = [1, 10, 30][lvl] || 1;
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }

  const hourPart = findPartById(PART_IDS.DURATION_HOUR, 'Duration (Hour)');
  if (hourPart) {
    const lvl = getLvl(hourPart);
    const hours = [1, 6, 12][lvl] || 1;
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }

  const dayPart = findPartById(PART_IDS.DURATION_DAYS, 'Duration (Days)');
  if (dayPart) {
    const lvl = getLvl(dayPart);
    const days = [1, 10, 20, 30][lvl] || 1;
    return `${days} day${days > 1 ? 's' : ''}`;
  }

  return '1 round';
}

// =============================================================================
// Chip Formatting
// =============================================================================

/**
 * Format a single power part as a chip
 */
export function formatPowerPartChip(
  def: PowerPart,
  pl: PowerPartPayload
): PartChipData {
  const l1 = pl.op_1_lvl || 0;
  const l2 = pl.op_2_lvl || 0;
  const l3 = pl.op_3_lvl || 0;

  const rawTP =
    (def.base_tp || 0) +
    (def.op_1_tp || 0) * l1 +
    (def.op_2_tp || 0) * l2 +
    (def.op_3_tp || 0) * l3;

  const finalTP = Math.floor(rawTP);
  let text = def.name;
  if (l1 > 0) text += ` (Opt1 ${l1})`;
  if (l2 > 0) text += ` (Opt2 ${l2})`;
  if (l3 > 0) text += ` (Opt3 ${l3})`;
  if (finalTP > 0) text += ` | TP: ${finalTP}`;

  return {
    text,
    description: def.description || '',
    finalTP,
    hasTP: finalTP > 0,
  };
}

// =============================================================================
// High-level Display Builder
// =============================================================================

export interface PowerDocument {
  name?: string;
  description?: string;
  parts?: Array<{
    id?: number;
    name?: string;
    op_1_lvl?: number;
    op_2_lvl?: number;
    op_3_lvl?: number;
    applyDuration?: boolean;
  }>;
  damage?: Array<{
    amount?: number | string;
    size?: number | string;
    type?: string;
    applyDuration?: boolean;
  }>;
}

/**
 * Build complete display data from a saved power document
 */
export function derivePowerDisplay(
  powerDoc: PowerDocument,
  partsDb: PowerPart[]
): PowerDisplayData {
  const partsPayload: PowerPartPayload[] = Array.isArray(powerDoc.parts)
    ? powerDoc.parts.map((p) => ({
        id: p.id,
        name: p.name,
        op_1_lvl: p.op_1_lvl || 0,
        op_2_lvl: p.op_2_lvl || 0,
        op_3_lvl: p.op_3_lvl || 0,
        applyDuration: p.applyDuration || false,
      }))
    : [];

  const calc = calculatePowerCosts(partsPayload, partsDb);
  const actionType = computeActionType(partsPayload, partsDb);
  const rangeStr = deriveRange(partsPayload, partsDb);
  const areaStr = deriveArea(partsPayload, partsDb);
  const durationStr = deriveDuration(partsPayload, partsDb);

  // Build part chips
  const partChips: PartChipData[] = partsPayload
    .map((pl) => {
      const def = findByIdOrName(partsDb, pl);
      if (!def) return null;
      return formatPowerPartChip(def, pl);
    })
    .filter((chip): chip is PartChipData => chip !== null);

  return {
    name: powerDoc.name || '',
    description: powerDoc.description || '',
    actionType,
    range: rangeStr,
    area: areaStr,
    duration: durationStr,
    energy: calc.totalEnergy,
    tp: calc.totalTP,
    tpSources: calc.tpSources,
    partChips,
  };
}

// =============================================================================
// Damage Formatting
// =============================================================================

/**
 * Format power damage as [amount]d[size] [type]
 */
export function formatPowerDamage(
  damageArr?: Array<{ amount?: number | string; size?: number | string; type?: string }>
): string {
  if (!Array.isArray(damageArr)) return '';
  const dmg = damageArr.find(
    (d) => d && d.amount && d.size && d.type && d.type !== 'none'
  );
  if (dmg) return `${dmg.amount}d${dmg.size} ${dmg.type}`;
  return '';
}
