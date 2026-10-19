import { calculateAbilityScoreCost } from '@/lib/game/formulas';
import type { Abilities } from '@/types';

/** Sidebar-friendly ability points line (avoids "11/7" when negative abilities refund points). */
export function formatCreatureAbilityPointsValue(
  abilityPointsBudget: number,
  abilities: Abilities,
): string {
  let positiveSpent = 0;
  let refundFromNegatives = 0;
  for (const value of Object.values(abilities)) {
    const cost = calculateAbilityScoreCost(value ?? 0);
    if (cost < 0) refundFromNegatives += -cost;
    else positiveSpent += cost;
  }
  if (refundFromNegatives > 0) {
    return `${positiveSpent}/${abilityPointsBudget} (+${refundFromNegatives} from negatives)`;
  }
  const remaining = abilityPointsBudget - positiveSpent;
  return `${remaining}/${abilityPointsBudget}`;
}
