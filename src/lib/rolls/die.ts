/**
 * Shared die helpers for RollProvider / RollLog (single rollDie + image map).
 */

export type DieType = 'd2' | 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

export const DIE_MAX: Record<DieType, number> = {
  d2: 2,
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
  d20: 20,
  d100: 100,
};

/** Dice image paths (matching vanilla site assets). */
export const DIE_IMAGES: Record<DieType, string> = {
  // No D2 asset on site; smallest die image is used in the roll log chip row.
  d2: '/images/D4.png',
  d4: '/images/D4.png',
  d6: '/images/D6.png',
  d8: '/images/D8.png',
  d10: '/images/D10.png',
  d12: '/images/D12.png',
  d20: '/images/D20_1.png',
  d100: '/images/D20_1.png',
};

/** Dice shown in the Roll Log manual pool builder (not every rollable damage die). */
export const ROLL_LOG_BUILDER_DICE = [
  'd4',
  'd6',
  'd8',
  'd10',
  'd12',
  'd20',
] as const satisfies readonly DieType[];

export type RollLogBuilderDieType = (typeof ROLL_LOG_BUILDER_DICE)[number];

export function rollDie(type: DieType): number {
  const max = DIE_MAX[type];
  return Math.floor(Math.random() * max) + 1;
}

/**
 * Nat 20 is +2 and nat 1 is −2 only on a single d20.
 * A group that includes a d20 (another die, or a second d20) does not get that adjustment.
 */
export function d20CritAdjustment(dice: ReadonlyArray<{ type: DieType; value: number }>): {
  isCrit: boolean;
  isCritFail: boolean;
  adjustment: number;
} {
  if (dice.length !== 1 || dice[0]?.type !== 'd20') {
    return { isCrit: false, isCritFail: false, adjustment: 0 };
  }
  if (dice[0].value === 20) return { isCrit: true, isCritFail: false, adjustment: 2 };
  if (dice[0].value === 1) return { isCrit: false, isCritFail: true, adjustment: -2 };
  return { isCrit: false, isCritFail: false, adjustment: 0 };
}

export function generateRollId(prefix = 'roll'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
