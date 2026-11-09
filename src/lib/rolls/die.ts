/**
 * Shared die helpers for RollProvider / RollLog (single rollDie + image map).
 */

export type DieType = 'd2' | 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

export type StoredRollKind = 'attack' | 'damage' | 'skill' | 'ability' | 'defense' | 'custom';

/**
 * How nat 20 / nat 1 affect total and crit flags. Passed explicitly for custom rolls
 * (never inferred from display title).
 */
export type RollOutcomeKind =
  /** Sheet d20 checks: ±2 and crit message. */
  | 'd20-check'
  /** Roll-log manual dice pool: same ±2 rules as d20-check. */
  | 'dice-pool'
  /** Damage and multi-die pools: sum only. */
  | 'damage-sum'
  /** Programmatic custom dice (e.g. Randomize on sheet): crit highlight, no ±2. */
  | 'labeled-dice';

export const ROLL_OUTCOME_KINDS = [
  'd20-check',
  'dice-pool',
  'damage-sum',
  'labeled-dice',
] as const satisfies readonly RollOutcomeKind[];

/** Title used by the roll-log manual dice pool (`roll-log.tsx` executeRoll). */
export const ROLL_LOG_CUSTOM_POOL_TITLE = 'Custom Roll';

/** `RollEntry.outcomeKind` for roll-log manual pool rolls. */
export const ROLL_LOG_CUSTOM_POOL_OUTCOME_KIND: RollOutcomeKind = 'dice-pool';

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

/** Per die type in the roll-log manual pool (`roll-log.tsx` addDie). */
export const ROLL_LOG_BUILDER_DICE_PER_TYPE_MAX = 20;

export const ROLL_LOG_BUILDER_DICE_POOL_MAX =
  ROLL_LOG_BUILDER_DICE.length * ROLL_LOG_BUILDER_DICE_PER_TYPE_MAX;

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

export function defaultRollOutcomeKind(type: StoredRollKind): RollOutcomeKind | undefined {
  switch (type) {
    case 'attack':
    case 'skill':
    case 'ability':
    case 'defense':
      return 'd20-check';
    case 'damage':
      return 'damage-sum';
    case 'custom':
      return 'damage-sum';
    default:
      return undefined;
  }
}

export function resolveRollOutcomeKind(
  type: StoredRollKind,
  explicit?: RollOutcomeKind | undefined,
): RollOutcomeKind {
  return explicit ?? defaultRollOutcomeKind(type) ?? 'damage-sum';
}

export function normalizeCampaignRollDice(
  dice: ReadonlyArray<{ type: DieType; value: number }>,
): Array<{ type: DieType; value: number; isMax: boolean; isMin: boolean }> {
  return dice.map((die) => ({
    type: die.type,
    value: die.value,
    isMax: die.value === DIE_MAX[die.type],
    isMin: die.value === 1,
  }));
}

/** Stored roll total and crit flags from dice results already rolled on the client. */
export function computeRollOutcome(
  dice: ReadonlyArray<{ type: DieType; value: number }>,
  modifier: number,
  kind: RollOutcomeKind,
): {
  total: number;
  isCrit: boolean;
  isCritFail: boolean;
  critMessage: string | null;
} {
  const diceSum = dice.reduce((sum, die) => sum + die.value, 0);

  if (kind === 'd20-check' || kind === 'dice-pool') {
    const crit = d20CritAdjustment(dice);
    const critMessage = crit.isCrit
      ? 'Natural 20! +2 to the total!'
      : crit.isCritFail
        ? 'Natural 1! -2 from the total!'
        : null;
    return {
      total: diceSum + modifier + crit.adjustment,
      isCrit: crit.isCrit,
      isCritFail: crit.isCritFail,
      critMessage,
    };
  }

  if (kind === 'labeled-dice') {
    const crit = d20CritAdjustment(dice);
    return {
      total: diceSum + modifier,
      isCrit: crit.isCrit,
      isCritFail: crit.isCritFail,
      critMessage: null,
    };
  }

  return {
    total: diceSum + modifier,
    isCrit: false,
    isCritFail: false,
    critMessage: null,
  };
}

export function generateRollId(prefix = 'roll'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
