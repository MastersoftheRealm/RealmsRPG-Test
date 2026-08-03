/**
 * Technique Calculation Utilities
 * ================================
 * Ported from public/js/calculators/technique-calc.js
 * Provides cost calculation and display helpers for techniques.
 */

import { PART_IDS, findByIdOrName } from '@/lib/id-constants';
import { computePartTrainingPoints } from '@/lib/calculators/part-training-points';
import { dedupeSavedParts } from '@/lib/game/dedupe-saved-parts';
import type { TechniquePart } from '@/hooks/codex-types';
import { formatActionTypeForDisplay } from '@/lib/utils/action-type';
import { attackModeColumnLabel, deriveTechniqueAttackMode, type AttackMode } from '@/lib/attack-mode';
import { deriveActionType, actionTypeFromSelection } from './action-type';

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
  /** Max option level when > 0; omit at 0. */
  optionLevel?: number;
}

export interface TechniqueDocument {
  name?: string;
  description?: string;
  parts?: TechniquePartPayload[];
  damage?: { amount?: number | string; size?: number | string; type?: string };
  /** Attack mode (none | unarmed | weapon). Preferred over legacy `weapon`. */
  attackMode?: AttackMode;
  /** @deprecated Legacy weapon reference; kept for reading older library rows. */
  weapon?: { id?: string | number; name?: string };
  /** @deprecated Legacy columnar label; kept for reading older library rows. */
  weaponName?: string;
  /** Saved action type (basic, full, bonus, etc.) — used to avoid recalculation */
  actionType?: string;
  /** Whether the technique can be used as a reaction */
  isReaction?: boolean;
}

export interface MechanicContext {
  actionTypeSelection?: string;
  reaction?: boolean;
  attackMode?: AttackMode;
  diceAmt?: number;
  dieSize?: number;
  partsDb?: TechniquePart[];
}

// =============================================================================
// Damage Helpers
// =============================================================================

export { computeSplits } from './dice-splits';

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
  const ids = {
    reaction: PART_IDS.REACTION,
    quickOrFree: PART_IDS.QUICK_OR_FREE_ACTION,
    longAction: PART_IDS.LONG_ACTION,
  };

  const resolved = partsPayload.map((p) => {
    // Prefer id, fall back to name lookup against the codex.
    let partId = p.id;
    if (partId === undefined && p.name) {
      const def = findByIdOrName(partsDb, { name: p.name });
      partId = def?.id !== undefined ? Number(def.id) : undefined;
    }
    // Legacy name-based fallback when the resolved id is not an action part.
    if (
      partId !== ids.reaction &&
      partId !== ids.quickOrFree &&
      partId !== ids.longAction &&
      p.name
    ) {
      if (p.name === 'Reaction') partId = ids.reaction;
      else if (p.name === 'Quick or Free Action') partId = ids.quickOrFree;
      else if (p.name === 'Long Action') partId = ids.longAction;
    }
    return { partId, level: p.op_1_lvl || 0 };
  });

  return deriveActionType(resolved, ids);
}

/**
 * Helper when UI stores a selector value like: quick|free|long3|long4|basic
 */
export const computeActionTypeFromSelection = actionTypeFromSelection;

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

  const uniqueParts = dedupeSavedParts(partsPayload);
  uniqueParts.forEach((pl) => {
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

  const finalTP = computePartTrainingPoints(def, pl, 'technique');
  const optionLevel = Math.max(l1, l2, l3);
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
    optionLevel: optionLevel > 0 ? optionLevel : undefined,
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
  const partsPayload: TechniquePartPayload[] = dedupeSavedParts(
    Array.isArray(techniqueDoc.parts)
      ? techniqueDoc.parts.map((p) => ({
          id: p.id,
          name: p.name,
          op_1_lvl: p.op_1_lvl || 0,
          op_2_lvl: p.op_2_lvl || 0,
          op_3_lvl: p.op_3_lvl || 0,
        }))
      : []
  );

  const calc = calculateTechniqueCosts(partsPayload, partsDb);
  // Use saved actionType/isReaction if available; fall back to derivation from parts
  const derivedAction = computeActionType(partsPayload, partsDb);
  const savedAction = techniqueDoc.actionType
    ? computeActionTypeFromSelection(techniqueDoc.actionType, !!techniqueDoc.isReaction)
    : null;
  const actionType = formatActionTypeForDisplay(savedAction || derivedAction);
  const damageStr = formatTechniqueDamage(techniqueDoc.damage);
  const attackMode = deriveTechniqueAttackMode({
    attackMode: techniqueDoc.attackMode,
    parts: partsPayload,
    weapon: techniqueDoc.weapon,
  });
  const weaponName = attackModeColumnLabel(attackMode);

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
