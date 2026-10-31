/**
 * Canonical armor Damage Reduction resolution (TASK-644).
 * Scalar fields take precedence over the Damage Reduction property (1 + op_1_lvl).
 */

import {
  deriveDamageReductionFromProperties,
  type ItemPropertyPayload,
} from '@/lib/calculators/item-calc';
import { ARMOR_EXCEPTION_TYPES } from '@/lib/game/creator-constants';
import { normalizeCreatureInventoryType } from '@/lib/game/creature-inventory';

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

/**
 * One creature armor piece. Natural armor and armament armor are the same
 * record: type armor, built with the same properties. Currency is the stored
 * market cost (`currency`), then `currencyCost`, `gold_cost`, or `cost`.
 */
export type CreatureArmorDrPiece = ArmorDrSource & {
  name?: string | null | undefined;
  type?: string | null | undefined;
  currency?: number | null | undefined;
  currencyCost?: number | null | undefined;
  gold_cost?: number | null | undefined;
  cost?: number | null | undefined;
};

/**
 * Market currency cost of one armor piece. A missing or non-numeric cost is 0.
 * The first stored field in `currency`, `currencyCost`, `gold_cost`, `cost` wins.
 */
export function armorCurrencyCost(source: CreatureArmorDrPiece): number {
  const candidates = [source.currency, source.currencyCost, source.gold_cost, source.cost];
  for (const value of candidates) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return 0;
}

/**
 * Armor list entries count. Weapons, shields, and other equipment do not.
 * A missing type still counts, so a piece already sitting in the armor list
 * is not dropped. Natural armor uses type armor, the same as armament armor.
 */
function countsTowardCreatureArmorDr(piece: CreatureArmorDrPiece): boolean {
  const raw = String(piece.type ?? '').trim();
  if (!raw) return true;
  return normalizeCreatureInventoryType(raw) === 'armor';
}

/**
 * Creature Damage Reduction from armor.
 *
 * A creature applies one armor's Damage Reduction: the armor with the highest
 * currency cost. Armors do not stack. Shields never add static Damage
 * Reduction (they roll a die on the Defend reaction). Weapons and other
 * equipment do not add to this total.
 *
 * Tie: when two or more armors share that highest currency cost, the one
 * earlier in the list is used. List order is the creature's stored armor
 * order. This tie is not written in the Core; it is the deterministic pick
 * until a written rule says otherwise.
 */
export function creatureArmorDamageReduction(armors: readonly CreatureArmorDrPiece[]): number {
  let bestIndex = -1;
  let bestCost = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < armors.length; i++) {
    const piece = armors[i];
    if (!piece || !countsTowardCreatureArmorDr(piece)) continue;
    const cost = armorCurrencyCost(piece);
    if (bestIndex === -1 || cost > bestCost) {
      bestIndex = i;
      bestCost = cost;
    }
  }
  if (bestIndex === -1) return 0;
  return resolveArmorDamageReduction(armors[bestIndex]!);
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

/** Standard armor does not reduce these types. Other Damage Reduction sources are not on this list. */
const STANDARD_ARMOR_DR_EXCEPTIONS = ARMOR_EXCEPTION_TYPES;

/**
 * Standard armor reduces every damage type except Psychic, Spiritual, and Sonic.
 * The check is the damage type name. It does not depend on Evasion, Reflexes, Might,
 * or any other defense the attack targets. A blank type is not one of the three exceptions.
 * Comparison ignores case and surrounding spaces.
 */
export function standardArmorReducesDamageType(
  damageType: string | null | undefined,
  exceptions: readonly string[] = STANDARD_ARMOR_DR_EXCEPTIONS,
): boolean {
  const key = String(damageType ?? '')
    .trim()
    .toLowerCase();
  if (!key) return true;
  return !exceptions.some((exception) => exception.trim().toLowerCase() === key);
}

export type DamageReductionSource = 'armor' | 'other';

/**
 * Damage Reduction for one instance.
 * Armor skips Psychic, Spiritual, and Sonic and does not count that instance
 * toward later halving. Any other source keeps its full amount for every type.
 */
export function effectiveDamageReduction(input: {
  source: DamageReductionSource;
  damageType?: string | null | undefined;
  baseDamageReduction: number;
  priorReductionsThisTurn?: number | undefined;
  armorExceptions?: readonly string[] | undefined;
}): { reduction: number; countsAsArmorReduction: boolean } {
  const base = Number.isFinite(input.baseDamageReduction) ? input.baseDamageReduction : 0;
  if (input.source !== 'armor') {
    return { reduction: Math.max(0, base), countsAsArmorReduction: false };
  }
  if (!standardArmorReducesDamageType(input.damageType, input.armorExceptions)) {
    return { reduction: 0, countsAsArmorReduction: false };
  }
  const reduction = armorDamageReductionForHit(base, input.priorReductionsThisTurn ?? 0);
  return { reduction, countsAsArmorReduction: reduction > 0 };
}
