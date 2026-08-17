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
  calculateSkillPointsForEntity,
} from '@/lib/game/formulas';
import { calculateCreatureSpeed, calculateEvasion } from '@/lib/game/calculations';
import { DEFENSE_INCREASE_COST } from '@/lib/game/skill-allocation';
import { calculateCreatureMaxHealth, calculateCreatureMaxEnergy } from '@/lib/game/encounter-utils';
import { CREATURE_FEAT_IDS } from '@/lib/id-constants';
import { CREATURE_MECHANICAL_FEAT_POINTS } from '@/lib/game/creator-constants';
import {
  collectCreatureInventoryItems,
  creatureInventoryQuantityMultiplier,
} from '@/lib/game/creature-inventory';
import type { CoreRulesMap } from '@/types/core-rules';
import { SENSE_TO_FEAT_ID, MOVEMENT_TO_FEAT_ID } from './creature-creator-constants';
import type { CreatureState } from './creature-creator-types';

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
  const inventory = collectCreatureInventoryItems(creature);
  const trainingSpent =
    creature.powers.reduce(
      (sum, power) =>
        sum + (typeof power.tp === 'number' && Number.isFinite(power.tp) ? power.tp : 0),
      0,
    ) +
    creature.techniques.reduce(
      (sum, technique) =>
        sum +
        (typeof technique.tp === 'number' && Number.isFinite(technique.tp) ? technique.tp : 0),
      0,
    ) +
    inventory.reduce((sum, armament) => {
      const tp = typeof armament.tp === 'number' && Number.isFinite(armament.tp) ? armament.tp : 0;
      return sum + tp * creatureInventoryQuantityMultiplier(armament.quantity);
    }, 0);
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

  const speed = calculateCreatureSpeed(abilities.agility, rules);
  const evasion = calculateEvasion(abilities.agility, undefined, rules);

  const abilitySpent = Object.values(abilities).reduce((sum, val) => sum + val, 0);
  const heSpent = creature.hitPoints + creature.energyPoints;
  const skillSpent = creature.skills.reduce((sum, s) => {
    const isSubSkill =
      s.isSubSkill === true ||
      (s.baseSkillId != null && s.baseSkillId !== '') ||
      subSkillNames.has(String(s.name ?? '').toLowerCase());
    if (isSubSkill) {
      return sum + Math.max(1, s.value);
    }
    return sum + s.value + (s.proficient ? 1 : 0);
  }, 0);
  const defenseSpent = Object.values(creature.defenses).reduce(
    (sum, val) => sum + val * DEFENSE_INCREASE_COST,
    0,
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
    abilitySpent,
    abilityRemaining: abilityPoints - abilitySpent,
    heRemaining: hePool - heSpent,
    skillRemaining: skillPoints - skillSpent - defenseSpent,
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
