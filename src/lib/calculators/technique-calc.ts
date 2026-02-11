/**
 * Technique Calculation Utilities
 * ================================
 * Ported from public/js/calculators/technique-calc.js
 * Provides cost calculation and display helpers for techniques.
 */

import { PART_IDS, findByIdOrName } from '@/lib/id-constants';
import type { TechniquePart } from '@/hooks/use-rtdb';

// Re-export for convenience
export type { TechniquePart };

// =============================================================================
// Types
// =============================================================================

export interface TechniquePartPayload {
  id?: number;
  name?: string;
  part?: TechniquePart;
  op_1_lvl?: number;
  op_2_lvl?: number;
  op_3_lvl?: number;
  applyDuration?: boolean;
}

export interface TechniqueCostResult {
  totalEnergy: number;
  totalTP: number;
  tpSources: string[];
  energyRaw: number;
}

export interface TechniqueDisplayData {
  name: string;
  description: string;
  weaponName: string;
  actionType: string;
  damageStr: string;
  energy: number;
  tp: number;
  tpSources: string[];
  partChips: TechniqueChipData[];
}

export interface TechniqueChipData {
  text: string;
  description: string;
  finalTP: number;
  hasTP: boolean;
}

export interface TechniqueDocument {
  name?: string;
  description?: string;
  parts?: TechniquePartPayload[];
  damage?: { amount?: number | string; size?: number | string; type?: string };
  weapon?: { id?: number; name?: string };
  /** Saved action type (basic, full, bonus, etc.) — used to avoid recalculation */
  actionType?: string;
  /** Whether the technique can be used as a reaction */
  isReaction?: boolean;
}

export interface MechanicContext {
  actionTypeSelection?: string;
  reaction?: boolean;
  weaponTP?: number;
  diceAmt?: number;
  dieSize?: number;
  partsDb?: TechniquePart[];
}

// =============================================================================
// Damage Helpers
// =============================================================================

/**
 * Compute the number of "splits" if using dice smaller than d12.
 */
export function computeSplits(diceAmt: number, dieSize: number): number {
  const valid = [4, 6, 8, 10, 12];
  if (!valid.includes(dieSize) || diceAmt <= 1) return 0;
  const total = diceAmt * dieSize;
  const minDiceUsingD12 = Math.ceil(total / 12);
  return Math.max(0, diceAmt - minDiceUsingD12);
}

/**
 * Compute the option level for Additional Damage based on dice.
 */
export function computeAdditionalDamageLevel(diceAmt: number, dieSize: number): number {
  const total = diceAmt * dieSize;
  if (total <= 0) return 0;
  return Math.max(0, Math.floor((total - 4) / 2));
}

/**
 * Format damage object as a string like "+2d6".
 */
export function formatTechniqueDamage(
  dmgObj?: { amount?: number | string; size?: number | string } | null
): string {
  if (!dmgObj || !dmgObj.amount || !dmgObj.size) return '';
  if (dmgObj.amount === '0' || dmgObj.size === '0') return '';
  return `+${dmgObj.amount}d${dmgObj.size}`;
}

// =============================================================================
// Action Type
// =============================================================================

/**
 * Compute action type from parts payload.
 */
export function computeActionType(
  partsPayload: TechniquePartPayload[] = [],
  partsDb: TechniquePart[] = []
): string {
  let actionType = 'Basic';
  let isReaction = false;

  partsPayload.forEach((p) => {
    // Get part ID - prefer id, fallback to name lookup
    let partId = p.id;
    if (partId === undefined && p.name) {
      const def = findByIdOrName(partsDb, { name: p.name });
      partId = def?.id !== undefined ? Number(def.id) : undefined;
    }

    const l1 = p.op_1_lvl || 0;

    if (partId === PART_IDS.REACTION) {
      isReaction = true;
    } else if (partId === PART_IDS.QUICK_OR_FREE_ACTION) {
      if (l1 === 0) actionType = 'Quick';
      else if (l1 === 1) actionType = 'Free';
    } else if (partId === PART_IDS.LONG_ACTION) {
      if (l1 === 0) actionType = 'Long (3)';
      else if (l1 === 1) actionType = 'Long (4)';
    } else {
      // Legacy name-based fallback
      if (p.name === 'Reaction') isReaction = true;
      else if (p.name === 'Quick or Free Action') {
        if (l1 === 0) actionType = 'Quick';
        else if (l1 === 1) actionType = 'Free';
      } else if (p.name === 'Long Action') {
        if (l1 === 0) actionType = 'Long (3)';
        else if (l1 === 1) actionType = 'Long (4)';
      }
    }
  });

  return isReaction ? `${actionType} Reaction` : `${actionType} Action`;
}

/**
 * Helper when UI stores a selector value like: quick|free|long3|long4|basic
 */
export function computeActionTypeFromSelection(selection: string, reactionFlag: boolean): string {
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

/**
 * Build mechanic part payloads based on current UI selections.
 * Used to auto-generate action/damage parts based on selections.
 */
export function buildMechanicPartPayload(
  ctx: MechanicContext
): Array<{ id: number; name: string; op_1_lvl: number; op_2_lvl: number; op_3_lvl: number }> {
  const {
    actionTypeSelection = 'basic',
    reaction = false,
    weaponTP = 0,
    diceAmt = 0,
    dieSize = 0,
    partsDb = [],
  } = ctx || {};

  const payload: Array<{ id: number; name: string; op_1_lvl: number; op_2_lvl: number; op_3_lvl: number }> = [];

  function pushIf(partId: number, partName: string, op1 = 0): void {
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
      });
    }
  }

  // Action / Reaction
  if (reaction) pushIf(PART_IDS.REACTION, 'Reaction', 0);
  if (actionTypeSelection === 'quick') pushIf(PART_IDS.QUICK_OR_FREE_ACTION, 'Quick or Free Action', 0);
  else if (actionTypeSelection === 'free') pushIf(PART_IDS.QUICK_OR_FREE_ACTION, 'Quick or Free Action', 1);
  else if (actionTypeSelection === 'long3') pushIf(PART_IDS.LONG_ACTION, 'Long Action', 0);
  else if (actionTypeSelection === 'long4') pushIf(PART_IDS.LONG_ACTION, 'Long Action', 1);

  // Additional Damage
  if (diceAmt > 0 && dieSize >= 4) {
    const level = computeAdditionalDamageLevel(diceAmt, dieSize);
    pushIf(PART_IDS.ADDITIONAL_DAMAGE, 'Additional Damage', level);
    // Split Damage Dice
    const splits = computeSplits(diceAmt, dieSize);
    if (splits > 0) pushIf(PART_IDS.SPLIT_DAMAGE_DICE, 'Split Damage Dice', splits - 1);
  }

  // Weapon Attack scaling
  if (weaponTP >= 1) {
    pushIf(PART_IDS.ADD_WEAPON_ATTACK, 'Add Weapon Attack', weaponTP - 1);
  }

  return payload;
}

// =============================================================================
// Core Cost Calculator
// =============================================================================

/**
 * Calculate total energy, TP and list TP sources.
 */
export function calculateTechniqueCosts(
  partsPayload: TechniquePartPayload[] = [],
  partsDb: TechniquePart[] = []
): TechniqueCostResult {
  let sumNonPercentage = 0;
  let productPercentage = 1;
  let totalTP = 0;
  const tpSources: string[] = [];

  partsPayload.forEach((pl) => {
    // Find part by ID or name for backwards compatibility
    const def = findByIdOrName(partsDb, {
      id: pl.id ?? pl.part?.id,
      name: pl.name ?? pl.part?.name,
    });
    if (!def) return;

    const l1 = pl.op_1_lvl || 0;
    const l2 = pl.op_2_lvl || 0;
    const l3 = pl.op_3_lvl || 0;

    // Energy
    const energyContribution =
      (def.base_en || 0) +
      (def.op_1_en || 0) * l1 +
      (def.op_2_en || 0) * l2 +
      (def.op_3_en || 0) * l3;

    if (def.percentage) {
      productPercentage *= energyContribution;
    } else {
      sumNonPercentage += energyContribution;
    }

    // TP (special floor for Additional Damage option1)
    let opt1TPRaw = (def.op_1_tp || 0) * l1;
    const defId = typeof def.id === 'string' ? parseInt(def.id, 10) : def.id;
    if (defId === PART_IDS.ADDITIONAL_DAMAGE || def.name === 'Additional Damage') {
      opt1TPRaw = Math.floor(opt1TPRaw);
    }

    const rawTP =
      (def.base_tp || 0) + opt1TPRaw + (def.op_2_tp || 0) * l2 + (def.op_3_tp || 0) * l3;

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

  const energyRaw = sumNonPercentage * productPercentage;
  const totalEnergy = Math.ceil(energyRaw);
  return { totalEnergy, totalTP, tpSources, energyRaw };
}

// =============================================================================
// Chip Formatting
// =============================================================================

/**
 * Format a part for display as a chip/badge.
 */
export function formatTechniquePartChip(
  def: TechniquePart,
  pl: TechniquePartPayload
): TechniqueChipData {
  const l1 = pl.op_1_lvl || 0;
  const l2 = pl.op_2_lvl || 0;
  const l3 = pl.op_3_lvl || 0;

  let opt1TPRaw = (def.op_1_tp || 0) * l1;
  const defId = typeof def.id === 'string' ? parseInt(def.id, 10) : def.id;
  if (defId === PART_IDS.ADDITIONAL_DAMAGE || def.name === 'Additional Damage') {
    opt1TPRaw = Math.floor(opt1TPRaw);
  }

  const rawTP =
    (def.base_tp || 0) + opt1TPRaw + (def.op_2_tp || 0) * l2 + (def.op_3_tp || 0) * l3;

  const finalTP = Math.floor(rawTP);
  let text = def.name || '';
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

/**
 * Build display data for a technique document.
 */
export function deriveTechniqueDisplay(
  techniqueDoc: TechniqueDocument,
  partsDb: TechniquePart[]
): TechniqueDisplayData {
  const partsPayload: TechniquePartPayload[] = Array.isArray(techniqueDoc.parts)
    ? techniqueDoc.parts.map((p) => ({
        id: p.id,
        name: p.name,
        op_1_lvl: p.op_1_lvl || 0,
        op_2_lvl: p.op_2_lvl || 0,
        op_3_lvl: p.op_3_lvl || 0,
      }))
    : [];

  const calc = calculateTechniqueCosts(partsPayload, partsDb);
  // Use saved actionType/isReaction if available; fall back to derivation from parts
  const derivedAction = computeActionType(partsPayload, partsDb);
  const savedAction = techniqueDoc.actionType
    ? computeActionTypeFromSelection(techniqueDoc.actionType, !!techniqueDoc.isReaction)
    : null;
  const actionType = savedAction || derivedAction;
  const damageStr = formatTechniqueDamage(techniqueDoc.damage);
  const weaponName =
    techniqueDoc.weapon && (techniqueDoc.weapon.name || techniqueDoc.weapon.id)
      ? techniqueDoc.weapon.name || `Weapon #${techniqueDoc.weapon.id}`
      : 'Unarmed';

  const partChips: TechniqueChipData[] = partsPayload
    .map((pl) => {
      const def = findByIdOrName(partsDb, pl);
      if (!def) return null;
      return formatTechniquePartChip(def, pl);
    })
    .filter((chip): chip is TechniqueChipData => chip !== null);

  return {
    name: techniqueDoc.name || '',
    description: techniqueDoc.description || '',
    weaponName,
    actionType,
    damageStr,
    energy: calc.totalEnergy,
    tp: calc.totalTP,
    tpSources: calc.tpSources,
    partChips,
  };
}
