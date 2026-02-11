/**
 * useGameRules Hook
 * ==================
 * Loads core game rules from the database (via /api/codex coreRules)
 * with fallback to hardcoded constants when DB is unavailable.
 * 
 * Usage:
 *   const { rules, isLoading } = useGameRules();
 *   const baseHealth = rules.PROGRESSION_PLAYER.baseHealth; // 8
 *   const conditions = rules.CONDITIONS.standard; // ConditionDef[]
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import type { CoreRulesMap } from '@/types/core-rules';

// Import current hardcoded values as fallback defaults
import {
  SHARED_CONSTANTS,
  PLAYER_CONSTANTS,
  CREATURE_CONSTANTS,
  ABILITY_LIMITS,
  ARCHETYPE_CONFIGS,
  COMBAT_DEFAULTS,
} from '@/lib/game/constants';
import {
  CONDITIONS,
  CREATURE_SIZES,
  ARMOR_EXCEPTION_TYPES,
  ALL_DAMAGE_TYPES,
  LEVELS_BY_RARITY,
} from '@/lib/game/creator-constants';
import {
  SKILL_VALUE_CAP,
  BASE_SKILL_PAST_CAP_COST,
  SUB_SKILL_PAST_CAP_COST,
  DEFENSE_INCREASE_COST,
  SPECIES_SKILL_COUNT,
} from '@/lib/game/skill-allocation';

// =============================================================================
// Hardcoded fallback (used when DB is empty or unavailable)
// =============================================================================

const FALLBACK_RULES: CoreRulesMap = {
  PROGRESSION_PLAYER: {
    baseAbilityPoints: SHARED_CONSTANTS.BASE_ABILITY_POINTS,
    abilityPointsEveryNLevels: 3,
    abilityPointsPerIncrease: SHARED_CONSTANTS.ABILITY_POINTS_PER_3_LEVELS,
    skillPointsPerLevel: SHARED_CONSTANTS.SKILL_POINTS_PER_LEVEL,
    baseHitEnergyPool: PLAYER_CONSTANTS.BASE_HIT_ENERGY,
    hitEnergyPerLevel: SHARED_CONSTANTS.HIT_ENERGY_PER_LEVEL,
    baseProficiency: SHARED_CONSTANTS.BASE_PROFICIENCY,
    proficiencyEveryNLevels: 5,
    proficiencyPerIncrease: SHARED_CONSTANTS.PROFICIENCY_PER_5_LEVELS,
    baseTrainingPoints: PLAYER_CONSTANTS.BASE_TRAINING_POINTS,
    tpPerLevelMultiplier: PLAYER_CONSTANTS.TP_PER_LEVEL_MULTIPLIER,
    baseHealth: 8,
    xpToLevelFormula: 'level * 4',
    startingCurrency: 200,
    characterFeatsPerLevel: 1,
  },
  PROGRESSION_CREATURE: {
    baseAbilityPoints: SHARED_CONSTANTS.BASE_ABILITY_POINTS,
    abilityPointsEveryNLevels: 3,
    skillPointsAtLevel1: CREATURE_CONSTANTS.BASE_SKILL_POINTS,
    skillPointsPerLevel: CREATURE_CONSTANTS.SKILL_POINTS_PER_LEVEL,
    baseHitEnergyPool: CREATURE_CONSTANTS.BASE_HIT_ENERGY,
    hitEnergyPerLevel: SHARED_CONSTANTS.HIT_ENERGY_PER_LEVEL,
    baseProficiency: SHARED_CONSTANTS.BASE_PROFICIENCY,
    proficiencyEveryNLevels: 5,
    baseTrainingPoints: CREATURE_CONSTANTS.BASE_TRAINING_POINTS,
    tpPerLevelMultiplier: CREATURE_CONSTANTS.TP_PER_LEVEL,
    baseFeatPoints: CREATURE_CONSTANTS.BASE_FEAT_POINTS,
    featPointsPerLevel: CREATURE_CONSTANTS.FEAT_POINTS_PER_LEVEL,
    baseCurrency: CREATURE_CONSTANTS.BASE_CURRENCY,
    currencyGrowthRate: CREATURE_CONSTANTS.CURRENCY_GROWTH,
  },
  ABILITY_RULES: {
    min: ABILITY_LIMITS.MIN,
    maxStarting: ABILITY_LIMITS.MAX_STARTING,
    maxAbsoluteCharacter: ABILITY_LIMITS.MAX_ABSOLUTE,
    maxAbsoluteCreature: ABILITY_LIMITS.MAX_ABSOLUTE_CREATURE,
    costIncreaseThreshold: ABILITY_LIMITS.COST_INCREASE_THRESHOLD,
    normalCost: 1,
    increasedCost: 2,
    maxTotalNegative: -3,
    standardArrays: {
      basic: [3, 2, 2, 1, 0, -1],
      skewed: [3, 3, 2, 2, -1, -2],
      even: [2, 2, 1, 1, 1, 0],
    },
    abilities: ['strength', 'vitality', 'agility', 'acuity', 'intelligence', 'charisma'],
    defenses: ['might', 'fortitude', 'reflexes', 'discernment', 'mentalFortitude', 'resolve'],
    abilityDefenseMap: {
      strength: 'might',
      vitality: 'fortitude',
      agility: 'reflexes',
      acuity: 'discernment',
      intelligence: 'mentalFortitude',
      charisma: 'resolve',
    },
  },
  ARCHETYPES: {
    types: ['power', 'powered-martial', 'martial'],
    configs: {
      power: { ...ARCHETYPE_CONFIGS.power },
      'powered-martial': { ...ARCHETYPE_CONFIGS['powered-martial'] },
      martial: { ...ARCHETYPE_CONFIGS.martial },
    },
    martialBonusFeatsBase: 2,
    martialBonusFeatsInterval: 3,
    martialBonusFeatsStartLevel: 4,
    poweredMartialMilestoneInterval: 3,
    poweredMartialMilestoneStartLevel: 4,
    proficiencyIncreaseInterval: 5,
    powerProgression: [],
    martialProgression: [],
  },
  ARMAMENT_PROFICIENCY: {
    table: [
      { martialProf: 0, armamentMax: 3 },
      { martialProf: 1, armamentMax: 8 },
      { martialProf: 2, armamentMax: 12 },
      { martialProf: 3, armamentMax: 15 },
      { martialProf: 4, armamentMax: 18 },
      { martialProf: 5, armamentMax: 21 },
      { martialProf: 6, armamentMax: 24 },
    ],
  },
  COMBAT: {
    baseSpeed: COMBAT_DEFAULTS.BASE_SPEED,
    baseEvasion: COMBAT_DEFAULTS.BASE_EVASION,
    baseDefense: COMBAT_DEFAULTS.BASE_DEFENSE,
    apPerRound: 4,
    actionCosts: { basic: 2, quick: 1, free: 0, movement: 1, interaction: 1, abilityRoll: 1, skillEncounterAction: 2, evade: 1, brace: 1, focus: 1, search: 1, overcome: 1 },
    multipleActionPenalty: -5,
    criticalHitThreshold: 10,
    natural20Bonus: 2,
    natural1Penalty: -2,
    rangedMeleePenalty: -5,
    longRangePenalty: -5,
  },
  SKILLS_AND_DEFENSES: {
    maxSkillValue: SKILL_VALUE_CAP,
    baseSkillPastCapCost: BASE_SKILL_PAST_CAP_COST,
    subSkillPastCapCost: SUB_SKILL_PAST_CAP_COST,
    defenseIncreaseCost: DEFENSE_INCREASE_COST,
    speciesSkillCount: SPECIES_SKILL_COUNT,
    gainProficiencyCost: 1,
    unproficientRules: { positive: 'half ability (round up)', negative: 'double the negative' },
  },
  CONDITIONS: {
    standard: CONDITIONS.filter(c => !['Bleed', 'Exhausted', 'Exposed', 'Frightened', 'Staggered', 'Resilient', 'Slowed', 'Stunned', 'Susceptible', 'Weakened'].includes(c)).map(name => ({ name, leveled: false, description: '' })),
    leveled: ['Bleed', 'Exhausted', 'Exposed', 'Frightened', 'Staggered', 'Resilient', 'Slowed', 'Stunned', 'Susceptible', 'Weakened'].map(name => ({ name, leveled: true, description: '' })),
    stackingRules: "Conditions don't stack. Stronger replaces weaker.",
  },
  SIZES: {
    categories: CREATURE_SIZES.map(s => ({
      value: s.value,
      label: s.label,
      height: s.height,
      spaces: s.spaces,
      baseCarry: s.baseCarry,
      perStrCarry: s.perStrCarry,
      minCarry: s.minCarry,
    })),
    halfCapacitySpeedPenalty: 'Movement speed halved',
  },
  RARITIES: {
    tiers: LEVELS_BY_RARITY.map(r => ({
      name: r.rarity,
      currencyMin: 0,
      currencyMax: null,
      levelMin: r.minLevel,
      levelMax: r.maxLevel === Infinity ? null : r.maxLevel,
    })),
  },
  DAMAGE_TYPES: {
    all: ALL_DAMAGE_TYPES.filter(t => t !== 'none') as unknown as string[],
    armorExceptions: [...ARMOR_EXCEPTION_TYPES],
    note: 'No physical vs magic split. All damage types are equal categories.',
  },
  RECOVERY: {
    partial: { duration: '2, 4, or 6 hours', effect: 'Each 2 hours: regain 1/4 of both max Energy and Health, OR 1/2 of one.', interruptionGrace: '10 minutes' },
    full: { duration: '8-10 hours', effect: 'Fully restore Energy and Health, remove most temporary effects.' },
    requirements: 'Adequate nutrition/hydration, temperate conditions, bedding. Must doff armor.',
    withoutFullRecovery: 'Max HP and EN reduce by 1/4 each 24 hours without full recovery (accumulates, min 1).',
    featUses: { partial: 'Resets "Partial" recovery feats only', full: 'Resets all feat uses' },
  },
  EXPERIENCE: {
    xpToLevelUp: 'level * 4',
    levelTable: Array.from({ length: 20 }, (_, i) => ({ level: i + 1, xpThreshold: (i + 1) * 4 })),
    combatXp: 'Sum of defeated enemy levels * 2',
    skillEncounterXp: 'Party avg level * # Characters (adjusted by DS)',
    skillEncounterDS: '10 + half party level',
    skillEncounterSuccesses: 'Number of participating characters + 1',
    divideXp: 'Split evenly among participating Characters',
  },
};

// =============================================================================
// Fetch + merge logic
// =============================================================================

async function fetchCoreRules(): Promise<CoreRulesMap> {
  try {
    const res = await fetch('/api/codex');
    if (!res.ok) throw new Error('Failed to fetch codex');
    const data = await res.json();
    const dbRules = data.coreRules || {};
    
    // Merge DB rules over fallback — any category present in DB replaces the fallback
    const merged: Record<string, unknown> = { ...FALLBACK_RULES };
    for (const key of Object.keys(FALLBACK_RULES)) {
      if (dbRules[key]) {
        merged[key] = dbRules[key];
      }
    }
    return merged as unknown as CoreRulesMap;
  } catch {
    // DB unavailable — use hardcoded fallback
    return FALLBACK_RULES;
  }
}

// =============================================================================
// Hook
// =============================================================================

export function useGameRules() {
  const query = useQuery<CoreRulesMap>({
    queryKey: ['core-rules'],
    queryFn: fetchCoreRules,
    staleTime: 10 * 60 * 1000,   // 10 min — rules change infrequently
    gcTime: 60 * 60 * 1000,      // 1 hour cache
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    rules: query.data ?? FALLBACK_RULES,
    isLoading: query.isLoading,
    error: query.error,
  };
}

/**
 * Get game rules synchronously (fallback only, for server-side or non-React contexts).
 * Always returns the hardcoded fallback. Use useGameRules() in React components
 * to get DB-backed rules.
 */
export function getGameRulesFallback(): CoreRulesMap {
  return FALLBACK_RULES;
}
