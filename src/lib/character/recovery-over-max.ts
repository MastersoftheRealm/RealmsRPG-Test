/**
 * Recovery does not lower Health or Energy that is already above max
 * (DECISIONS.md sheet/combat; ClickUp 86e3jv000).
 * Partial recovery adds toward max and stops at max.
 * A recovered amount is never negative.
 */

export function recoveryGap(current: number, max: number): number {
  return Math.max(0, max - current);
}

/** Each 2 hours is one quarter of max, rounded up (GAME_RULES.md Recovery). */
export function quarterRestoreAmount(max: number): number {
  return Math.ceil(max / 4);
}

export function partialAmountRestored(
  quarters: number,
  perQuarter: number,
  current: number,
  max: number,
): number {
  const allocated = Math.max(0, quarters) * Math.max(0, perQuarter);
  return Math.min(allocated, recoveryGap(current, max));
}

export function resourceAfterFullRecovery(current: number, max: number): number {
  return current >= max ? current : max;
}

export function resourceAfterPartialRecovery(
  current: number,
  restored: number,
  max: number,
): number {
  const gain = Math.max(0, restored);
  if (current >= max) return current;
  return Math.min(current + gain, max);
}

/** Preview text. Never "+-" or a leading minus. */
export function formatRecoveredAmount(amount: number): string {
  return `+${Math.max(0, amount)}`;
}

/** Partial-recovery duration copy. Spaces stay in the string so JSX cannot drop them. */
export function formatPartialRecoveryDuration(input: {
  hours: number;
  quarters: number;
  hpPerQuarter: number;
  enPerQuarter: number;
}): string {
  const quarterLabel = input.quarters === 1 ? 'quarter' : 'quarters';
  return `Each 2 hours = 2 quarters (¼ HP + ¼ EN, or allocate freely). ${input.hours}h = ${input.quarters} ${quarterLabel} (${input.hpPerQuarter} HP or ${input.enPerQuarter} EN per quarter). Full recovery (8h) restores all.`;
}

export function autoRecoveryQuarters(input: {
  totalQuarters: number;
  currentHealth: number;
  maxHealth: number;
  currentEnergy: number;
  maxEnergy: number;
}): { hp: number; en: number } {
  const { totalQuarters, currentHealth, maxHealth, currentEnergy, maxEnergy } = input;
  const hpGap = recoveryGap(currentHealth, maxHealth);
  const enGap = recoveryGap(currentEnergy, maxEnergy);
  const hpPerQuarter = quarterRestoreAmount(maxHealth);
  const enPerQuarter = quarterRestoreAmount(maxEnergy);

  if (hpGap === 0 && enGap === 0) {
    const halfQuarters = Math.floor(totalQuarters / 2);
    return { hp: halfQuarters, en: totalQuarters - halfQuarters };
  }

  if (hpGap === 0) return { hp: 0, en: totalQuarters };
  if (enGap === 0) return { hp: totalQuarters, en: 0 };

  let bestAllocation = { hp: 0, en: 0 };
  let bestScore = -1;

  for (let hpQ = 0; hpQ <= totalQuarters; hpQ++) {
    const enQ = totalQuarters - hpQ;
    const hpRestored = Math.min(hpQ * hpPerQuarter, hpGap);
    const enRestored = Math.min(enQ * enPerQuarter, enGap);
    const hpRecoveredPercent = maxHealth > 0 ? hpRestored / maxHealth : 0;
    const enRecoveredPercent = maxEnergy > 0 ? enRestored / maxEnergy : 0;
    const totalScore = hpRecoveredPercent + enRecoveredPercent;

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestAllocation = { hp: hpQ, en: enQ };
    } else if (totalScore === bestScore) {
      const currentBalance = Math.abs(bestAllocation.hp - bestAllocation.en);
      const newBalance = Math.abs(hpQ - enQ);
      if (newBalance < currentBalance) {
        bestAllocation = { hp: hpQ, en: enQ };
      }
    }
  }

  return bestAllocation;
}
