/**
 * One-click suggested ability arrays for path-guided character creation.
 */

import type { Abilities, AbilityName } from '@/types';
import { DEFAULT_ABILITIES } from '@/types';
import { calculateAbilityPoints, calculateAbilityScoreCost } from '@/lib/game/formulas';

const ALL_ABILITIES: AbilityName[] = [
  'strength',
  'vitality',
  'agility',
  'acuity',
  'intelligence',
  'charisma',
];

/**
 * Builds a suggested point-buy array prioritizing path primary (+2) and secondary (+1).
 * Spends any remainder on primary, then secondary.
 */
export function buildSuggestedAbilityArray(
  level: number,
  primary?: AbilityName,
  secondary?: AbilityName
): Abilities {
  const totalPoints = calculateAbilityPoints(level);
  const next: Abilities = { ...DEFAULT_ABILITIES };

  const spend = (ability: AbilityName, target: number) => {
    while (next[ability] < target) {
      const cost = calculateAbilityScoreCost(next[ability] + 1);
      const spent = Object.values(next).reduce((s, v) => s + calculateAbilityScoreCost(v || 0), 0);
      if (spent + cost > totalPoints) break;
      if (next[ability] >= 3) break;
      next[ability] += 1;
    }
  };

  if (primary) spend(primary, 2);
  if (secondary && secondary !== primary) spend(secondary, 1);

  let spent = Object.values(next).reduce((s, v) => s + calculateAbilityScoreCost(v || 0), 0);
  while (spent < totalPoints) {
    let progressed = false;
    for (const ability of [primary, secondary, ...ALL_ABILITIES].filter(Boolean) as AbilityName[]) {
      if (next[ability] >= 3) continue;
      const cost = calculateAbilityScoreCost(next[ability] + 1);
      if (spent + cost > totalPoints) continue;
      next[ability] += 1;
      spent += cost;
      progressed = true;
      break;
    }
    if (!progressed) break;
  }

  return next;
}
