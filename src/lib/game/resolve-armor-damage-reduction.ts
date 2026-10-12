/**
 * Canonical armor Damage Reduction resolution (TASK-644).
 * Scalar fields take precedence over the Damage Reduction property (1 + op_1_lvl).
 */

import {
  deriveDamageReductionFromProperties,
  type ItemPropertyPayload,
} from '@/lib/calculators/item-calc';

export type ArmorDrSource = {
  damageReduction?: number | null | undefined;
  armorValue?: number | null | undefined;
  armor?: number | null | undefined;
  armor_value?: number | null | undefined;
  properties?:
    | ItemPropertyPayload[]
    | Array<
        | string
        | {
            id?: number | string | undefined;
            name?: string | undefined;
            op_1_lvl?: number | undefined;
          }
      >
    | undefined;
};

function propertiesForDr(props: ArmorDrSource['properties']): ItemPropertyPayload[] {
  if (!Array.isArray(props)) return [];
  const payloads: ItemPropertyPayload[] = [];
  for (const p of props) {
    if (typeof p === 'string') continue;
    payloads.push({
      id: typeof p.id === 'number' ? p.id : undefined,
      name: p.name,
      op_1_lvl: p.op_1_lvl,
    });
  }
  return payloads;
}

/** Resolve Damage Reduction for armor (sheet, library, enrichment, guided catalog). */
export function resolveArmorDamageReduction(source: ArmorDrSource): number {
  const direct = source.damageReduction ?? source.armorValue ?? source.armor ?? source.armor_value;
  if (typeof direct === 'number' && !Number.isNaN(direct)) {
    return direct;
  }
  return deriveDamageReductionFromProperties(propertiesForDr(source.properties));
}

/**
 * Armor DR for one reduction this turn (Core Rulebook / GAME_RULES).
 * `priorReductionsThisTurn` is how many times this armor already reduced damage
 * since the turn began. The first reduction is the full base. Each later
 * reduction is half the previous amount, rounded up. Half of 1 stays 1.
 * Rulebook example, base 5: 5, then 3, then 2, then 1.
 */
export function armorDamageReductionForHit(
  baseDamageReduction: number,
  priorReductionsThisTurn: number,
): number {
  if (!Number.isFinite(baseDamageReduction) || baseDamageReduction <= 0) return 0;
  const steps = Number.isFinite(priorReductionsThisTurn)
    ? Math.max(0, Math.floor(priorReductionsThisTurn))
    : 0;
  let dr = baseDamageReduction;
  for (let i = 0; i < steps; i++) {
    dr = Math.ceil(dr / 2);
  }
  return dr;
}

/**
 * Health lost after armor DR. A positive instance is at least 1.
 * Zero or less is not a hit and stays 0.
 */
export function damageAfterArmorReduction(incomingDamage: number, effectiveDr: number): number {
  if (!Number.isFinite(incomingDamage) || incomingDamage <= 0) return 0;
  const dr = Number.isFinite(effectiveDr) ? Math.max(0, effectiveDr) : 0;
  return Math.max(1, incomingDamage - dr);
}
