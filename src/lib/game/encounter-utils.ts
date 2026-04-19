/**
 * Encounter Utility Functions
 * ============================
 * Helper calculations for encounters — creature HP/EN from library data.
 *
 * Max HP / Max Energy must match `creature-creator/page.tsx` derived stats:
 * - Creatures have no character-style base HP (no +8). Pool comes from core rules
 *   (`calculateHealthEnergyPool` … CREATURE); hitPoints/energyPoints split that pool.
 * - maxHealth = vitalityContribution + hitPoints
 * - vitalityContribution = vitality × max(1, level) if vitality ≥ 0, else vitality once
 * - maxEnergy = highestNonVitality × max(1, level) + energyPoints
 */

/**
 * Compute successes or failures from a skill roll vs Difficulty Score.
 * Per GAME_RULES: Success = roll >= DS (+1 per 5 over); Failure = roll < DS (+1 per 5 under).
 */
export function computeSkillRollResult(roll: number, ds: number): { successes: number; failures: number } {
  if (roll >= ds) {
    const successes = 1 + Math.floor((roll - ds) / 5);
    return { successes, failures: 0 };
  }
  const failures = 1 + Math.floor((ds - roll) / 5);
  return { successes: 0, failures };
}

// =============================================================================
// Creature abilities — align with creature-stat-block / creator
// =============================================================================

const PRIMARY_ABILITIES = ['strength', 'vitality', 'agility', 'acuity', 'intelligence', 'charisma'] as const;
type PrimaryAbility = (typeof PRIMARY_ABILITIES)[number];

/** Read one ability from saved creature JSON (canonical + legacy + common shorthands). */
export function getCreatureAbilityScore(
  abilities: Record<string, number | undefined>,
  key: PrimaryAbility
): number {
  const direct = abilities[key];
  if (typeof direct === 'number' && Number.isFinite(direct)) return direct;

  if (key === 'vitality') {
    const v = abilities.vit;
    if (typeof v === 'number' && Number.isFinite(v)) return v;
  }
  if (key === 'intelligence') {
    const v = abilities.intellect;
    if (typeof v === 'number' && Number.isFinite(v)) return v;
  }
  if (key === 'acuity') {
    const v = abilities.perception;
    if (typeof v === 'number' && Number.isFinite(v)) return v;
  }
  if (key === 'charisma') {
    const v = abilities.willpower;
    if (typeof v === 'number' && Number.isFinite(v)) return v;
  }

  const shorthand: Partial<Record<PrimaryAbility, string>> = {
    strength: 'str',
    agility: 'agi',
    acuity: 'acu',
    intelligence: 'int',
    charisma: 'cha',
  };
  const sh = shorthand[key];
  if (sh) {
    const v = abilities[sh];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
  }

  return 0;
}

export function getCreatureVitality(abilities: Record<string, number | undefined>): number {
  return getCreatureAbilityScore(abilities, 'vitality');
}

/** Highest score among non-vitality primaries (matches creature creator TP baseline). */
export function getCreatureHighestNonVitality(abilities: Record<string, number | undefined>): number {
  let max = 0;
  for (const k of PRIMARY_ABILITIES) {
    if (k === 'vitality') continue;
    max = Math.max(max, getCreatureAbilityScore(abilities, k));
  }
  return max;
}

/**
 * Max Health — same formula as creature creator summary / HealthEnergyAllocator.
 */
export function calculateCreatureMaxHealth(
  level: number,
  abilities: Record<string, number | undefined>,
  hitPoints: number
): number {
  const vitality = getCreatureVitality(abilities);
  const vitalityContribution = vitality >= 0 ? vitality * Math.max(1, level) : vitality;
  return vitalityContribution + (hitPoints || 0);
}

/**
 * Max Energy — same formula as creature creator (minEnergy + pool allocation).
 */
export function calculateCreatureMaxEnergy(
  level: number,
  abilities: Record<string, number | undefined>,
  energyPoints: number
): number {
  const highest = getCreatureHighestNonVitality(abilities);
  return highest * Math.max(1, level) + (energyPoints || 0);
}
