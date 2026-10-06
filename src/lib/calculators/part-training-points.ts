/**
 * Shared part TP calculation for powers and techniques.
 * Used by library PartData mapping and calculator chip formatters (SA-4-17).
 */

import { PART_IDS } from '@/lib/id-constants';

export type PartTpVariant = 'power' | 'technique';

export interface CodexPartTpDef {
  id: string | number;
  name: string;
  base_tp?: number | undefined;
  op_1_tp?: number | undefined;
  op_2_tp?: number | undefined;
  op_3_tp?: number | undefined;
}

type PartTpLevels = {
  op_1_lvl?: number | undefined;
  op_2_lvl?: number | undefined;
  op_3_lvl?: number | undefined;
};

/**
 * Unrounded base and each option product.
 * Technique Additional Damage floors its option-1 product first. That floored
 * term stays inside the sum that `computePartTrainingPoints` rounds up once.
 */
function partTrainingPointTerms(
  def: Pick<CodexPartTpDef, 'id' | 'name' | 'base_tp' | 'op_1_tp' | 'op_2_tp' | 'op_3_tp'>,
  levels: PartTpLevels,
  variant: PartTpVariant,
): { base: number; opt1: number; opt2: number; opt3: number } {
  const l1 = levels.op_1_lvl ?? 0;
  const l2 = levels.op_2_lvl ?? 0;
  const l3 = levels.op_3_lvl ?? 0;

  let opt1 = (def.op_1_tp || 0) * l1;
  if (variant === 'technique') {
    const defId = typeof def.id === 'string' ? parseInt(def.id, 10) : def.id;
    if (defId === PART_IDS.ADDITIONAL_DAMAGE || def.name === 'Additional Damage') {
      opt1 = Math.floor(opt1);
    }
  }

  return {
    base: def.base_tp || 0,
    opt1,
    opt2: (def.op_2_tp || 0) * l2,
    opt3: (def.op_3_tp || 0) * l3,
  };
}

/**
 * Unrounded base + option sum for `tpRaw`. Technique Additional Damage still
 * floors its option-1 product inside that sum. Published TP uses
 * `computePartTrainingPoints`, which rounds that sum up once.
 */
export function computePartTrainingPointsRaw(
  def: Pick<CodexPartTpDef, 'id' | 'name' | 'base_tp' | 'op_1_tp' | 'op_2_tp' | 'op_3_tp'>,
  levels: PartTpLevels,
  variant: PartTpVariant = 'power',
): number {
  const terms = partTrainingPointTerms(def, levels, variant);
  return terms.base + terms.opt1 + terms.opt2 + terms.opt3;
}

/**
 * Shared TP calculation used by library PartData and calculator chip formatters.
 * One instance is one round-up of the raw sum (GAME_RULES "Rounding"). Range 3
 * is the base step only and costs 1 TP. Callers add these integers. Energy
 * still ceils once at the end of the power.
 */
export function computePartTrainingPoints(
  def: Pick<CodexPartTpDef, 'id' | 'name' | 'base_tp' | 'op_1_tp' | 'op_2_tp' | 'op_3_tp'>,
  levels: PartTpLevels,
  variant: PartTpVariant = 'power',
): number {
  const terms = partTrainingPointTerms(def, levels, variant);
  return Math.ceil(terms.base + terms.opt1 + terms.opt2 + terms.opt3);
}
