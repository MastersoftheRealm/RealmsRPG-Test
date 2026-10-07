/**
 * Shared part TP calculation for powers and techniques.
 * Used by library PartData mapping and calculator chip formatters (SA-4-17).
 */

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
 * Unrounded base and each option product. Every option, including technique
 * Additional Damage option 1, stays in the sum that rounds up once.
 */
function partTrainingPointTerms(
  def: Pick<CodexPartTpDef, 'base_tp' | 'op_1_tp' | 'op_2_tp' | 'op_3_tp'>,
  levels: PartTpLevels,
): { base: number; opt1: number; opt2: number; opt3: number } {
  const l1 = levels.op_1_lvl ?? 0;
  const l2 = levels.op_2_lvl ?? 0;
  const l3 = levels.op_3_lvl ?? 0;

  return {
    base: def.base_tp || 0,
    opt1: (def.op_1_tp || 0) * l1,
    opt2: (def.op_2_tp || 0) * l2,
    opt3: (def.op_3_tp || 0) * l3,
  };
}

/**
 * Unrounded base + option sum for `tpRaw`. Published TP uses
 * `computePartTrainingPoints`, which rounds that sum up once.
 */
export function computePartTrainingPointsRaw(
  def: Pick<CodexPartTpDef, 'id' | 'name' | 'base_tp' | 'op_1_tp' | 'op_2_tp' | 'op_3_tp'>,
  levels: PartTpLevels,
  variant: PartTpVariant = 'power',
): number {
  // Powers and techniques share this round-up. Callers still pass which one asked.
  void variant;
  const terms = partTrainingPointTerms(def, levels);
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
  // Powers and techniques share this round-up. Callers still pass which one asked.
  void variant;
  const terms = partTrainingPointTerms(def, levels);
  return Math.ceil(terms.base + terms.opt1 + terms.opt2 + terms.opt3);
}
