/**
 * Shared part TP calculation for powers and techniques.
 * Used by library PartData mapping and calculator chip formatters (SA-4-17).
 */

import { PART_IDS } from '@/lib/id-constants';

export type PartTpVariant = 'power' | 'technique';

export interface CodexPartTpDef {
  id: string | number;
  name: string;
  base_tp?: number;
  op_1_tp?: number;
  op_2_tp?: number;
  op_3_tp?: number;
}

/**
 * Per-part Training Points before rounding. Single source of truth for the
 * base + option-level sum (and the technique-side Additional Damage opt1 floor)
 * shared by the power, technique and library cost paths. Do not ceil this raw
 * value; `computePartTrainingPoints` floors it (GAME_RULES "Rounding").
 */
export function computePartTrainingPointsRaw(
  def: Pick<CodexPartTpDef, 'id' | 'name' | 'base_tp' | 'op_1_tp' | 'op_2_tp' | 'op_3_tp'>,
  levels: { op_1_lvl?: number; op_2_lvl?: number; op_3_lvl?: number },
  variant: PartTpVariant = 'power'
): number {
  const l1 = levels.op_1_lvl ?? 0;
  const l2 = levels.op_2_lvl ?? 0;
  const l3 = levels.op_3_lvl ?? 0;

  let opt1Contribution = (def.op_1_tp || 0) * l1;
  if (variant === 'technique') {
    const defId = typeof def.id === 'string' ? parseInt(def.id, 10) : def.id;
    if (defId === PART_IDS.ADDITIONAL_DAMAGE || def.name === 'Additional Damage') {
      opt1Contribution = Math.floor(opt1Contribution);
    }
  }

  return (def.base_tp || 0) + opt1Contribution + (def.op_2_tp || 0) * l2 + (def.op_3_tp || 0) * l3;
}

/**
 * Shared TP calculation used by library PartData and calculator chip formatters.
 * Floors **this part** before it is added to a total (GAME_RULES "Rounding" —
 * the only round-down exception). Energy still ceils once at the end.
 */
export function computePartTrainingPoints(
  def: Pick<CodexPartTpDef, 'id' | 'name' | 'base_tp' | 'op_1_tp' | 'op_2_tp' | 'op_3_tp'>,
  levels: { op_1_lvl?: number; op_2_lvl?: number; op_3_lvl?: number },
  variant: PartTpVariant = 'power'
): number {
  return Math.floor(computePartTrainingPointsRaw(def, levels, variant));
}
