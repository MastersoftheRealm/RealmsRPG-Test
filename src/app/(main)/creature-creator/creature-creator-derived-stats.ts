/**
 * Creature Creator — derived point budgets and combat stats (TASK-610)
 */

import {
  calculateCreatureTrainingPoints,
  calculateCreatureCurrency,
  calculateCreatureFeatPoints,
  calculateHealthEnergyPool,
  calculateProficiency,
  calculateAbilityPoints,
  calculateAbilityScoreCost,
  calculateSkillPointsForEntity,
} from '@/lib/game/formulas';
import { calculateCreatureSpeed, calculateEvasion } from '@/lib/game/calculations';
import {
  allocationValueFromPersistedSkill,
  calculateSimpleSkillPointsSpent,
  resolveSkillAllocationRules,
} from '@/lib/game/skill-allocation';
import { calculateCreatureMaxHealth, calculateCreatureMaxEnergy } from '@/lib/game/encounter-utils';
import { CREATURE_FEAT_IDS } from '@/lib/id-constants';
import { CREATURE_MECHANICAL_FEAT_POINTS } from '@/lib/game/creator-constants';
import {
  collectCreatureInventoryItems,
  creatureInventoryQuantityMultiplier,
} from '@/lib/game/creature-inventory';
import { creatureArmorDamageReduction } from '@/lib/game/resolve-armor-damage-reduction';
import type { CoreRulesMap } from '@/types/core-rules';
import { SENSE_TO_FEAT_ID, MOVEMENT_TO_FEAT_ID } from './creature-creator-constants';
import type { CreatureState } from './creature-creator-types';
import {
  computeCreatureTrainingSpent,
  creatureLoadoutForBudget,
  type CreatureProficiencyDbContext,
} from './creature-creator-training-spent';

export type CreatureCreatorDerivedStats = {
  trainingPoints: number;
  currency: number;
  hePool: number;
  proficiency: number;
  abilityPoints: number;
  skillPoints: number;
  featPoints: number;
  featSpent: number;
  featRemaining: number;
  trainingSpent: number;
  trainingRemaining: number;
  currencySpent: number;
  currencyRemaining: number;
  maxHealth: number;
  minEnergy: number;
  maxEnergy: number;
  speed: number;
  evasion: number;
  /** One armor: highest currency cost. Shields and weapons are not included. */
  damageReduction: number;
  abilitySpent: number;
  abilityRemaining: number;
  heRemaining: number;
  skillRemaining: number;
  maxProficiencyPoints: number;
  proficiencySpent: number;
  proficiencyRemaining: number;
  resistanceFeatCost: number;
  immunityFeatCost: number;
  weaknessFeatCost: number;
  conditionImmunityFeatCost: number;
};

export function calculateCreatureCreatorStats(
  creature: CreatureState,
  featPointsMap: Map<string, number>,
  subSkillNames: Set<string>,
  rules: Partial<CoreRulesMap> | undefined,
  proficiencyCtx?: CreatureProficiencyDbContext,
): CreatureCreatorDerivedStats {
  const level = creature.level;
  const abilities = creature.abilities;

  const nonVitalityAbilities = Object.entries(abilities)
    .filter(([key]) => key !== 'vitality')
    .map(([, value]) => value);
  const highestNonVitality = Math.max(...nonVitalityAbilities, 0);

  const trainingPoints = calculateCreatureTrainingPoints(level, highestNonVitality, rules);
  const currency = calculateCreatureCurrency(level, rules);
  const hePool = calculateHealthEnergyPool(level, 'CREATURE', true, rules);
  const proficiency = calculateProficiency(level, true, rules);
  const abilityPoints = calculateAbilityPoints(level, true, rules);
  const skillPoints = calculateSkillPointsForEntity(
    Math.max(1, Math.floor(level)),
    'creature',
    rules,
  );

  const maxProficiencyPoints = proficiency;
  const proficiencySpent = creature.powerProficiency + creature.martialProficiency;
  const proficiencyRemaining = maxProficiencyPoints - proficiencySpent;

  const featPoints = calculateCreatureFeatPoints(level, creature.martialProficiency, rules);

  const resistanceFeatCost =
    featPointsMap.get(String(CREATURE_FEAT_IDS.RESISTANCE)) ??
    CREATURE_MECHANICAL_FEAT_POINTS.RESISTANCE;
  const immunityFeatCost =
    featPointsMap.get(String(CREATURE_FEAT_IDS.IMMUNITY)) ??
    CREATURE_MECHANICAL_FEAT_POINTS.IMMUNITY;
  const weaknessFeatCost =
    featPointsMap.get(String(CREATURE_FEAT_IDS.WEAKNESS)) ??
    CREATURE_MECHANICAL_FEAT_POINTS.WEAKNESS;
  const conditionImmunityFeatCost =
    featPointsMap.get(String(CREATURE_FEAT_IDS.CONDITION_IMMUNITY)) ??
    CREATURE_MECHANICAL_FEAT_POINTS.CONDITION_IMMUNITY;

  const senseFeatPoints = creature.senses.reduce((sum, sense) => {
    const featId = SENSE_TO_FEAT_ID[sense];
    if (featId) {
      const cost = featPointsMap.get(String(featId)) ?? 0;
      return sum + cost;
    }
    return sum;
  }, 0);

  const movementFeatPoints = creature.movementTypes.reduce((sum, movement) => {
    const featId = MOVEMENT_TO_FEAT_ID[movement];
    if (featId) {
      const cost = featPointsMap.get(String(featId)) ?? 0;
      return sum + cost;
    }
    return sum;
  }, 0);

  const mechanicalFeatPoints =
    creature.resistances.length * resistanceFeatCost +
    creature.immunities.length * immunityFeatCost +
    creature.weaknesses.length * weaknessFeatCost +
    creature.conditionImmunities.length * conditionImmunityFeatCost +
    senseFeatPoints +
    movementFeatPoints;

  const manualFeatSpent = creature.feats.reduce((sum, f) => sum + (f.points ?? 1), 0);
  const featSpent = manualFeatSpent + mechanicalFeatPoints;
  const inventory = collectCreatureInventoryItems(creatureLoadoutForBudget(creature));
  const trainingSpent = computeCreatureTrainingSpent(creature, proficiencyCtx);
  const currencySpent = inventory.reduce((sum, armament) => {
    const currency =
      typeof armament.currency === 'number' && Number.isFinite(armament.currency)
        ? armament.currency
        : 0;
    return sum + currency * creatureInventoryQuantityMultiplier(armament.quantity);
  }, 0);

  const maxHealth = calculateCreatureMaxHealth(level, abilities, creature.hitPoints);
  const minEnergy = highestNonVitality * Math.max(1, level);
  const maxEnergy = calculateCreatureMaxEnergy(level, abilities, creature.energyPoints);

  const speed = calculateCreatureSpeed(abilities.agility, rules, creature.movementTypes);
  const evasion = calculateEvasion(abilities.agility, undefined, rules);
  const damageReduction = creatureArmorDamageReduction(creatureLoadoutForBudget(creature).armor);

  const abilitySpent = Object.values(abilities).reduce(
    (sum, val) => sum + calculateAbilityScoreCost(val, rules),
    0,
  );
  const heSpent = creature.hitPoints + creature.energyPoints;
  const skillRules = resolveSkillAllocationRules(rules);
  const skillAllocations: Record<string, number> = {};
  const skillMeta = new Map<string, { isSubSkill: boolean }>();
  const presentSkillIds = new Set(creature.skills.map((s) => String(s.id ?? s.name)));
  for (const s of creature.skills) {
    const skillId = String(s.id ?? s.name);
    const isSubSkill =
      s.isSubSkill === true ||
      (s.baseSkillId != null && s.baseSkillId !== '') ||
      subSkillNames.has(String(s.name ?? '').toLowerCase());
    if (
      isSubSkill &&
      s.baseSkillId != null &&
      s.baseSkillId !== '' &&
      Number(s.baseSkillId) !== 0 &&
      !presentSkillIds.has(String(s.baseSkillId))
    ) {
      continue;
    }
    skillMeta.set(skillId, { isSubSkill });
    skillAllocations[skillId] = allocationValueFromPersistedSkill(
      s.proficient !== false,
      s.value,
      isSubSkill,
    );
  }
  const skillSpent = calculateSimpleSkillPointsSpent(
    skillAllocations,
    new Set<string>(),
    skillMeta,
    creature.defenses,
    skillRules,
  );

  return {
    trainingPoints,
    currency,
    hePool,
    proficiency,
    abilityPoints,
    skillPoints,
    featPoints,
    featSpent,
    featRemaining: featPoints - featSpent,
    trainingSpent,
    trainingRemaining: trainingPoints - trainingSpent,
    currencySpent,
    currencyRemaining: currency - currencySpent,
    maxHealth,
    minEnergy,
    maxEnergy,
    speed,
    evasion,
    damageReduction,
    abilitySpent,
    abilityRemaining: abilityPoints - abilitySpent,
    heRemaining: hePool - heSpent,
    skillRemaining: skillPoints - skillSpent,
    maxProficiencyPoints,
    proficiencySpent,
    proficiencyRemaining,
    resistanceFeatCost,
    immunityFeatCost,
    weaknessFeatCost,
    conditionImmunityFeatCost,
  };
}

export function isCreatureOverBudget(stats: CreatureCreatorDerivedStats): boolean {
  return (
    stats.featRemaining < 0 ||
    stats.trainingRemaining < 0 ||
    stats.currencyRemaining < 0 ||
    stats.abilityRemaining < 0 ||
    stats.heRemaining < 0 ||
    stats.skillRemaining < 0 ||
    stats.proficiencyRemaining < 0
  );
}
