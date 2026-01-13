/**
 * RealmsRPG Shared Game Formulas
 * ===============================
 * Centralized game calculation formulas for both characters and creatures.
 * This module provides the single source of truth for all progression calculations.
 */

/**
 * Game constants used across the application.
 * Use the entity-specific constants for characters vs creatures where they differ.
 */
export const GAME_CONSTANTS = {
    // Shared constants (same for characters and creatures)
    SHARED: {
        BASE_ABILITY_POINTS: 7,
        ABILITY_POINTS_PER_3_LEVELS: 1,
        BASE_SKILL_POINTS: 2,
        SKILL_POINTS_PER_LEVEL: 3,
        BASE_PROFICIENCY: 2,
        PROFICIENCY_PER_5_LEVELS: 1,
        HIT_ENERGY_PER_LEVEL: 12
    },
    
    // Player character specific constants
    PLAYER: {
        BASE_HIT_ENERGY: 18,
        BASE_TRAINING_POINTS: 22,
        TP_PER_LEVEL_MULTIPLIER: 2 // base + ability
    },
    
    // Creature/NPC specific constants
    CREATURE: {
        BASE_HIT_ENERGY: 26,
        BASE_TRAINING_POINTS: 9,
        TP_PER_LEVEL: 1,
        BASE_FEAT_POINTS: 4,
        FEAT_POINTS_PER_LEVEL: 1,
        BASE_CURRENCY: 200,
        CURRENCY_GROWTH: 1.45
    },
    
    // Archetype configurations
    ARCHETYPE: {
        power: {
            featLimit: 1,
            armamentMax: 4,
            innateEnergy: 8,
            proficiency: { martial: 0, power: 2 },
            trainingPointBonus: 0
        },
        'powered-martial': {
            featLimit: 2,
            armamentMax: 8,
            innateEnergy: 6,
            proficiency: { martial: 1, power: 1 },
            trainingPointBonus: 0
        },
        martial: {
            featLimit: 3,
            armamentMax: 16,
            innateEnergy: 0,
            proficiency: { martial: 2, power: 0 },
            trainingPointBonus: 0
        }
    },
    
    // Ability score limits
    ABILITY: {
        MIN: -2,
        MAX_STARTING: 3,
        MAX_ABSOLUTE: 6,
        COST_INCREASE_THRESHOLD: 4 // Costs 2 points above this value
    },
    
    // Skill limits
    SKILL: {
        MAX_PER_SKILL: 3,
        DEFENSE_MAX: 3
    }
};

/**
 * Calculate ability points based on level.
 * Formula: 7 at level 1, +1 every 3 levels starting at level 3
 * 
 * @param {number} level - Character/creature level
 * @param {boolean} [allowSubLevel=false] - Allow fractional levels (for creatures)
 * @returns {number} Total ability points
 */
export function calculateAbilityPoints(level, allowSubLevel = false) {
    level = parseFloat(level) || 1;
    
    if (allowSubLevel && level < 1) {
        return Math.ceil(GAME_CONSTANTS.SHARED.BASE_ABILITY_POINTS * level);
    }
    
    if (level < 1) return 0;
    if (level < 3) return GAME_CONSTANTS.SHARED.BASE_ABILITY_POINTS;
    
    const bonusPoints = Math.floor((level - 1) / 3) * GAME_CONSTANTS.SHARED.ABILITY_POINTS_PER_3_LEVELS;
    return GAME_CONSTANTS.SHARED.BASE_ABILITY_POINTS + bonusPoints;
}

/**
 * Calculate skill points based on level.
 * Formula: 2 + level * 3
 * 
 * @param {number} level - Character/creature level
 * @param {boolean} [allowSubLevel=false] - Allow fractional levels (for creatures)
 * @returns {number} Total skill points
 */
export function calculateSkillPoints(level, allowSubLevel = false) {
    level = parseFloat(level) || 1;
    
    if (allowSubLevel && level < 1) {
        return Math.ceil(5 * level);
    }
    
    return GAME_CONSTANTS.SHARED.BASE_SKILL_POINTS + 
           (GAME_CONSTANTS.SHARED.SKILL_POINTS_PER_LEVEL * Math.floor(level));
}

/**
 * Calculate health-energy pool based on level.
 * Note: Players and creatures have different base values.
 * 
 * @param {number} level - Character/creature level
 * @param {'PLAYER'|'CREATURE'} [entityType='PLAYER'] - Type of entity
 * @param {boolean} [allowSubLevel=false] - Allow fractional levels
 * @returns {number} Total health-energy pool
 */
export function calculateHealthEnergyPool(level, entityType = 'PLAYER', allowSubLevel = false) {
    level = parseFloat(level) || 1;
    
    const config = entityType === 'CREATURE' ? GAME_CONSTANTS.CREATURE : GAME_CONSTANTS.PLAYER;
    
    if (allowSubLevel && level < 1) {
        return Math.ceil(config.BASE_HIT_ENERGY * level);
    }
    
    return config.BASE_HIT_ENERGY + (GAME_CONSTANTS.SHARED.HIT_ENERGY_PER_LEVEL * (level - 1));
}

/**
 * Calculate proficiency points based on level.
 * Formula: 2 + 1 every 5 levels starting at level 5
 * 
 * @param {number} level - Character/creature level
 * @param {boolean} [allowSubLevel=false] - Allow fractional levels
 * @returns {number} Total proficiency points
 */
export function calculateProficiency(level, allowSubLevel = false) {
    level = parseFloat(level) || 1;
    
    if (allowSubLevel && level < 1) {
        return Math.ceil(GAME_CONSTANTS.SHARED.BASE_PROFICIENCY * level);
    }
    
    if (level < 1) return 0;
    if (level < 5) return GAME_CONSTANTS.SHARED.BASE_PROFICIENCY;
    
    const bonusPoints = Math.floor(level / 5) * GAME_CONSTANTS.SHARED.PROFICIENCY_PER_5_LEVELS;
    return GAME_CONSTANTS.SHARED.BASE_PROFICIENCY + bonusPoints;
}

/**
 * Calculate training points for a player character.
 * Formula: 22 + ability + ((2 + ability) * (level - 1))
 * 
 * @param {number} level - Character level
 * @param {number} highestArchetypeAbility - The higher of the two archetype ability scores
 * @returns {number} Total training points
 */
export function calculateTrainingPoints(level, highestArchetypeAbility = 0) {
    const ability = highestArchetypeAbility || 0;
    const base = GAME_CONSTANTS.PLAYER.BASE_TRAINING_POINTS;
    const perLevel = GAME_CONSTANTS.PLAYER.TP_PER_LEVEL_MULTIPLIER + ability;
    
    return base + ability + (perLevel * (level - 1));
}

/**
 * Calculate training points for a creature.
 * Formula: 9 + ability + (level - 1) * (1 + ability)
 * 
 * @param {number} level - Creature level
 * @param {number} highestNonVitality - Highest ability score (excluding vitality)
 * @returns {number} Total training points
 */
export function calculateCreatureTrainingPoints(level, highestNonVitality = 0) {
    level = parseFloat(level) || 1;
    const ability = highestNonVitality || 0;
    
    if (level < 1) {
        return Math.ceil(22 * level) + ability;
    }
    
    const base = GAME_CONSTANTS.CREATURE.BASE_TRAINING_POINTS;
    const perLevel = GAME_CONSTANTS.CREATURE.TP_PER_LEVEL + ability;
    
    if (level <= 1) return base + ability;
    return base + ability + ((level - 1) * perLevel);
}

/**
 * Calculate creature currency based on level.
 * Formula: 200 * 1.45^(level-1)
 * 
 * @param {number} level - Creature level
 * @returns {number} Available currency
 */
export function calculateCreatureCurrency(level) {
    level = parseFloat(level) || 1;
    return Math.round(
        GAME_CONSTANTS.CREATURE.BASE_CURRENCY * 
        Math.pow(GAME_CONSTANTS.CREATURE.CURRENCY_GROWTH, level - 1)
    );
}

/**
 * Calculate maximum archetype feats allowed based on level.
 * 
 * @param {number} level - Character level
 * @returns {number} Maximum archetype feats
 */
export function calculateMaxArchetypeFeats(level) {
    return Math.max(0, Math.floor(level));
}

/**
 * Calculate maximum character feats allowed based on level.
 * 
 * @param {number} level - Character level
 * @returns {number} Maximum character feats
 */
export function calculateMaxCharacterFeats(level) {
    return Math.max(0, Math.floor(level));
}

/**
 * Get the cost to increase an ability score.
 * Costs 2 points when going above the threshold (usually 4).
 * 
 * @param {number} currentValue - Current ability score
 * @returns {number} Point cost to increase
 */
export function getAbilityIncreaseCost(currentValue) {
    if (currentValue >= GAME_CONSTANTS.ABILITY.COST_INCREASE_THRESHOLD) {
        return 2;
    }
    return 1;
}

/**
 * Check if an ability increase is valid.
 * 
 * @param {number} currentValue - Current ability score
 * @param {number} availablePoints - Available ability points
 * @param {boolean} [isCreation=true] - Whether this is during character creation
 * @returns {boolean} Whether the increase is valid
 */
export function canIncreaseAbility(currentValue, availablePoints, isCreation = true) {
    const max = isCreation ? GAME_CONSTANTS.ABILITY.MAX_STARTING : GAME_CONSTANTS.ABILITY.MAX_ABSOLUTE;
    if (currentValue >= max) return false;
    
    const cost = getAbilityIncreaseCost(currentValue);
    return availablePoints >= cost;
}

/**
 * Check if an ability decrease is valid.
 * 
 * @param {number} currentValue - Current ability score
 * @returns {boolean} Whether the decrease is valid
 */
export function canDecreaseAbility(currentValue) {
    return currentValue > GAME_CONSTANTS.ABILITY.MIN;
}

/**
 * Get archetype configuration.
 * 
 * @param {string} archetypeType - The archetype type (power, powered-martial, martial)
 * @returns {Object} Archetype configuration
 */
export function getArchetypeConfig(archetypeType) {
    return GAME_CONSTANTS.ARCHETYPE[archetypeType] || GAME_CONSTANTS.ARCHETYPE.power;
}

/**
 * Get the maximum armament value for an archetype.
 * 
 * @param {string|Object} archetype - Archetype type string or object with type property
 * @returns {number} Maximum armament value
 */
export function getArmamentMax(archetype) {
    const type = typeof archetype === 'string' ? archetype : archetype?.type;
    return getArchetypeConfig(type).armamentMax;
}

/**
 * Get the archetype feat limit.
 * 
 * @param {string|Object} archetype - Archetype type string or object with type property
 * @returns {number} Archetype feat limit at level 1
 */
export function getArchetypeFeatLimit(archetype) {
    const type = typeof archetype === 'string' ? archetype : archetype?.type;
    return getArchetypeConfig(type).featLimit;
}

/**
 * Get the maximum innate energy for an archetype.
 * 
 * @param {string|Object} archetype - Archetype type string or object with type property
 * @returns {number} Maximum innate energy
 */
export function getInnateEnergyMax(archetype) {
    const type = typeof archetype === 'string' ? archetype : archetype?.type;
    return getArchetypeConfig(type).innateEnergy;
}

/**
 * Get all level progression data for a player character.
 * 
 * @param {number} level - Character level
 * @param {number} [highestArchetypeAbility=0] - Highest archetype ability score
 * @returns {Object} All progression values
 */
export function getPlayerProgression(level, highestArchetypeAbility = 0) {
    return {
        level,
        abilityPoints: calculateAbilityPoints(level),
        skillPoints: calculateSkillPoints(level),
        healthEnergyPool: calculateHealthEnergyPool(level, 'PLAYER'),
        trainingPoints: calculateTrainingPoints(level, highestArchetypeAbility),
        proficiency: calculateProficiency(level),
        maxArchetypeFeats: calculateMaxArchetypeFeats(level),
        maxCharacterFeats: calculateMaxCharacterFeats(level)
    };
}

/**
 * Get all level progression data for a creature.
 * 
 * @param {number} level - Creature level
 * @param {number} [highestNonVitality=0] - Highest non-vitality ability score
 * @returns {Object} All progression values
 */
export function getCreatureProgression(level, highestNonVitality = 0) {
    return {
        level,
        abilityPoints: calculateAbilityPoints(level, true),
        skillPoints: calculateSkillPoints(level, true),
        healthEnergyPool: calculateHealthEnergyPool(level, 'CREATURE', true),
        trainingPoints: calculateCreatureTrainingPoints(level, highestNonVitality),
        proficiency: calculateProficiency(level, true),
        currency: calculateCreatureCurrency(level)
    };
}

/**
 * Calculate the difference in resources between two levels.
 * Useful for level-up displays.
 * 
 * @param {number} fromLevel - Starting level
 * @param {number} toLevel - Target level
 * @param {number} [highestAbility=0] - Highest relevant ability score
 * @param {'PLAYER'|'CREATURE'} [entityType='PLAYER'] - Entity type
 * @returns {Object} Difference in each resource
 */
export function getLevelDifference(fromLevel, toLevel, highestAbility = 0, entityType = 'PLAYER') {
    const isCreature = entityType === 'CREATURE';
    const allowSubLevel = isCreature;
    
    const from = {
        abilityPoints: calculateAbilityPoints(fromLevel, allowSubLevel),
        skillPoints: calculateSkillPoints(fromLevel, allowSubLevel),
        healthEnergyPool: calculateHealthEnergyPool(fromLevel, entityType, allowSubLevel),
        trainingPoints: isCreature 
            ? calculateCreatureTrainingPoints(fromLevel, highestAbility)
            : calculateTrainingPoints(fromLevel, highestAbility),
        proficiency: calculateProficiency(fromLevel, allowSubLevel)
    };
    
    const to = {
        abilityPoints: calculateAbilityPoints(toLevel, allowSubLevel),
        skillPoints: calculateSkillPoints(toLevel, allowSubLevel),
        healthEnergyPool: calculateHealthEnergyPool(toLevel, entityType, allowSubLevel),
        trainingPoints: isCreature 
            ? calculateCreatureTrainingPoints(toLevel, highestAbility)
            : calculateTrainingPoints(toLevel, highestAbility),
        proficiency: calculateProficiency(toLevel, allowSubLevel)
    };
    
    return {
        abilityPoints: to.abilityPoints - from.abilityPoints,
        skillPoints: to.skillPoints - from.skillPoints,
        healthEnergyPool: to.healthEnergyPool - from.healthEnergyPool,
        trainingPoints: to.trainingPoints - from.trainingPoints,
        proficiency: to.proficiency - from.proficiency
    };
}
