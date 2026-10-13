/**
 * Shared part TP calculation for powers and techniques.
 * Used by library PartData mapping and calculator chip formatters (SA-4-17).
 */

import { optionLevelForWholeTrainingPoints, roundUpTrainingPoints } from '@/lib/proficiencies';

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

/** Option levels after the whole-number Training Point bump. Level 0 stays unused. */
export function publishedTrainingPointLevels(
  def: Pick<CodexPartTpDef, 'op_1_tp' | 'op_2_tp' | 'op_3_tp'>,
  levels: PartTpLevels,
): { op1: number; op2: number; op3: number } {
  return {
    op1: optionLevelForWholeTrainingPoints(def.op_1_tp || 0, levels.op_1_lvl ?? 0),
    op2: optionLevelForWholeTrainingPoints(def.op_2_tp || 0, levels.op_2_lvl ?? 0),
    op3: optionLevelForWholeTrainingPoints(def.op_3_tp || 0, levels.op_3_lvl ?? 0),
  };
}

/**
 * Published Training Points for one part. Each option is raised to the lowest
 * level whose TP is a whole number, the base is included once, and a fractional
 * base rounds the total up. Callers that repeat the part across powers must use
 * `buildRequiredProficiencies` so the base is not paid again.
 */
export function computePartTrainingPoints(
  def: Pick<CodexPartTpDef, 'id' | 'name' | 'base_tp' | 'op_1_tp' | 'op_2_tp' | 'op_3_tp'>,
  levels: PartTpLevels,
  variant: PartTpVariant = 'power',
): number {
  // Powers and techniques share this round-up. Callers still pass which one asked.
  void variant;
  const published = publishedTrainingPointLevels(def, levels);
  return roundUpTrainingPoints(
    (def.base_tp || 0) +
      (def.op_1_tp || 0) * published.op1 +
      (def.op_2_tp || 0) * published.op2 +
      (def.op_3_tp || 0) * published.op3,
  );
}
