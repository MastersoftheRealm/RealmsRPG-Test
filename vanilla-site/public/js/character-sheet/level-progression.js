/**
 * Character Level Progression Data & Logic
 * 
 * This module defines all the progression formulas and constraints for character leveling.
 * Use these functions to determine what resources a character should have at any given level.
 * 
 * Base formulas are imported from shared/game-formulas.js for consistency with creature creator.
 */

// Import and re-export base formulas from shared module
import {
    GAME_CONSTANTS,
    calculateAbilityPoints as sharedCalculateAbilityPoints,
    calculateSkillPoints as sharedCalculateSkillPoints,
    calculateHealthEnergyPool,
    calculateProficiency,
    calculateTrainingPoints as sharedCalculateTrainingPoints
} from '../shared/game-formulas.js';

// Re-export GAME_CONSTANTS for use in other modules
export { GAME_CONSTANTS };

/**
 * Calculate Health-Energy points based on level
 * Formula: 18 + 12 * (level - 1)
 * Level 1 = 18, Level 2 = 30, Level 3 = 42, etc.
 * @param {number} level - Character level
 * @returns {number} Total health-energy points
 */
export function calculateHealthEnergyPoints(level) {
    return calculateHealthEnergyPool(level, 'PLAYER');
}

/**
 * Calculate ability points based on level
 * Formula: 7 at level 1, +1 every 3 levels starting at level 3
 * @param {number} level - Character level
 * @returns {number} Total ability points
 */
export function calculateAbilityPoints(level) {
    return sharedCalculateAbilityPoints(level);
}

/**
 * Calculate skill points based on level
 * Formula: 2 + level * 3
 * @param {number} level - Character level
 * @returns {number} Total skill points
 */
export function calculateSkillPoints(level) {
    return sharedCalculateSkillPoints(level);
}

/**
 * Calculate training points based on level and highest archetype ability
 * Formula: 22 + highest archetype ability + ((2 + highest archetype ability) * (level - 1))
 * @param {number} level - Character level
 * @param {number} highestArchetypeAbility - The higher of the two archetype ability scores
 * @returns {number} Total training points
 */
export function calculateTrainingPoints(level, highestArchetypeAbility) {
    return sharedCalculateTrainingPoints(level, highestArchetypeAbility);
}

/**
 * Calculate proficiency points based on level
 * Formula: 2 + 1 every 5 levels starting at level 5
 * These can be allocated to power or martial proficiency
 * @param {number} level - Character level
 * @returns {number} Total proficiency points
 */
export function calculateProficiencyPoints(level) {
    return calculateProficiency(level);
}

/**
 * Calculate maximum archetype feats allowed based on level
 * Formula: equals level
 * @param {number} level - Character level
 * @returns {number} Maximum archetype feats
 */
export function calculateMaxArchetypeFeats(level) {
    return level;
}

/**
 * Calculate maximum character feats allowed based on level
 * Formula: equals level
 * @param {number} level - Character level
 * @returns {number} Maximum character feats
 */
export function calculateMaxCharacterFeats(level) {
    return level;
}

/**
 * Get all progression data for a given level
 * @param {number} level - Character level
 * @param {number} highestArchetypeAbility - The higher of the two archetype ability scores
 * @param {number} martialProf - Martial proficiency level
 * @param {number} powerProf - Power proficiency level
 * @param {object} archetypeChoices - Object storing choices made at milestone levels
 * @returns {object} Object containing all calculated progression values
 */
export function getLevelProgression(level, highestArchetypeAbility = 0, martialProf = 0, powerProf = 0, archetypeChoices = {}) {
    const archetypeProgression = calculateArchetypeProgression(level, martialProf, powerProf, archetypeChoices);
    
    return {
        level,
        healthEnergyPoints: calculateHealthEnergyPoints(level),
        abilityPoints: calculateAbilityPoints(level),
        skillPoints: calculateSkillPoints(level),
        trainingPoints: calculateTrainingPoints(level, highestArchetypeAbility),
        proficiencyPoints: calculateProficiencyPoints(level),
        maxArchetypeFeats: calculateMaxArchetypeFeats(level) + archetypeProgression.bonusArchetypeFeats,
        maxCharacterFeats: calculateMaxCharacterFeats(level),
        ...archetypeProgression
    };
}

/**
 * Get the difference in progression between two levels
 * Useful for showing what a character gains when leveling up
 * @param {number} currentLevel - Current level
 * @param {number} newLevel - New level
 * @param {number} highestArchetypeAbility - The higher of the two archetype ability scores
 * @param {number} martialProf - Martial proficiency level
 * @param {number} powerProf - Power proficiency level
 * @param {object} archetypeChoices - Object storing choices made at milestone levels
 * @returns {object} Object containing the deltas for each progression value
 */
export function getLevelUpDelta(currentLevel, newLevel, highestArchetypeAbility = 0, martialProf = 0, powerProf = 0, archetypeChoices = {}) {
    const current = getLevelProgression(currentLevel, highestArchetypeAbility, martialProf, powerProf, archetypeChoices);
    const next = getLevelProgression(newLevel, highestArchetypeAbility, martialProf, powerProf, archetypeChoices);
    
    return {
        healthEnergyPoints: next.healthEnergyPoints - current.healthEnergyPoints,
        abilityPoints: next.abilityPoints - current.abilityPoints,
        skillPoints: next.skillPoints - current.skillPoints,
        trainingPoints: next.trainingPoints - current.trainingPoints,
        proficiencyPoints: next.proficiencyPoints - current.proficiencyPoints,
        maxArchetypeFeats: next.maxArchetypeFeats - current.maxArchetypeFeats,
        maxCharacterFeats: next.maxCharacterFeats - current.maxCharacterFeats,
        innateThreshold: next.innateThreshold - current.innateThreshold,
        innatePools: next.innatePools - current.innatePools,
        innateEnergy: next.innateEnergy - current.innateEnergy,
        armamentProficiency: next.armamentProficiency - current.armamentProficiency
    };
}

/**
 * Check if a level is a milestone level (where bonuses are gained)
 * @param {number} level - Level to check
 * @returns {object} Object indicating which milestones are reached
 */
export function getLevelMilestones(level) {
    return {
        isAbilityPointLevel: level >= 3 && ((level - 1) % 3 === 0),
        isProficiencyPointLevel: level >= 5 && (level % 5 === 0),
        levelUpGains: {
            abilityPoints: level >= 3 && ((level - 1) % 3 === 0) ? 1 : 0,
            proficiencyPoints: level >= 5 && (level % 5 === 0) ? 1 : 0,
            healthEnergyPoints: 12,
            skillPoints: 3,
            archetypeFeat: 1,
            characterFeat: 1
        }
    };
}

// =====================================================
// ABILITY SCORE CONSTRAINTS & COSTS
// =====================================================

/**
 * Ability score constraints based on character level
 */
export const ABILITY_CONSTRAINTS = {
    MIN_ABILITY: -2,           // No ability can go below -2
    MAX_NEGATIVE_SUM: -3,      // Sum of negative abilities cannot be less than -3
    LEVEL_1_MAX: 3,            // At level 1, no ability can exceed 3
    getMaxAbility: (level) => {
        // Maximum ability score increases with level
        // Level 1: max 3, then increases
        if (level <= 1) return 3;
        if (level <= 3) return 4;
        if (level <= 6) return 5;
        if (level <= 9) return 6;
        if (level <= 12) return 7;
        if (level <= 15) return 8;
        return 9; // Level 16+
    }
};

/**
 * Calculate the cost to increase an ability score by 1 point
 * - Normal cost is 1 point per increase
 * - Going from 4 to 5 costs 2 points
 * - Going from 5 to 6 and beyond costs 2 points each
 * @param {number} currentValue - Current ability score
 * @returns {number} Cost in ability points to increase by 1
 */
export function getAbilityIncreaseCost(currentValue) {
    if (currentValue >= 4) {
        return 2; // Costs 2 points to go from 4->5, 5->6, etc.
    }
    return 1; // Normal cost
}

/**
 * Calculate the refund when decreasing an ability score by 1 point
 * @param {number} currentValue - Current ability score
 * @returns {number} Points refunded when decreasing by 1
 */
export function getAbilityDecreaseRefund(currentValue) {
    if (currentValue > 5) {
        return 2; // Refund 2 points when going from 6->5, 7->6, etc.
    }
    if (currentValue === 5) {
        return 2; // Refund 2 points when going from 5->4
    }
    return 1; // Normal refund
}

/**
 * Calculate total ability points spent based on ability values
 * The sum of all ability scores equals the points spent.
 * Negative abilities reduce the total spent (giving you more points to allocate elsewhere).
 * High ability scores (4+) cost extra points to reach.
 * @param {object} abilities - Object mapping ability names to values
 * @param {object} baseAbilities - Base/ancestry abilities (default 0 for each)
 * @returns {number} Total ability points spent
 */
export function calculateAbilityPointsSpent(abilities, baseAbilities = {}) {
    let totalSpent = 0;
    
    for (const [abilityName, value] of Object.entries(abilities || {})) {
        const baseValue = baseAbilities[abilityName] || 0;
        
        if (value > baseValue) {
            // Calculate cost from base to current value (with scaling for high values)
            for (let i = baseValue; i < value; i++) {
                totalSpent += getAbilityIncreaseCost(i);
            }
        } else if (value < baseValue) {
            // Decreasing below base gives points back
            for (let i = baseValue; i > value; i--) {
                totalSpent -= getAbilityDecreaseRefund(i);
            }
        }
    }
    
    return totalSpent;
}

/**
 * Validate if an ability can be increased
 * @param {object} abilities - Current abilities object
 * @param {string} abilityName - Name of ability to increase
 * @param {number} level - Character level
 * @param {number} availablePoints - Available ability points
 * @param {object} baseAbilities - Base/ancestry abilities
 * @returns {object} { canIncrease: boolean, cost: number, reason: string }
 */
export function canIncreaseAbility(abilities, abilityName, level, availablePoints, baseAbilities = {}) {
    const currentValue = abilities[abilityName] || 0;
    const maxAbility = ABILITY_CONSTRAINTS.getMaxAbility(level);
    const cost = getAbilityIncreaseCost(currentValue);
    
    if (currentValue >= maxAbility) {
        return {
            canIncrease: false,
            cost,
            reason: `Maximum ability score at level ${level} is ${maxAbility}`
        };
    }
    
    if (cost > availablePoints) {
        return {
            canIncrease: false,
            cost,
            reason: `Need ${cost} point(s) but only have ${availablePoints}`
        };
    }
    
    return {
        canIncrease: true,
        cost,
        reason: null
    };
}

/**
 * Validate if an ability can be decreased
 * @param {object} abilities - Current abilities object
 * @param {string} abilityName - Name of ability to decrease
 * @param {object} baseAbilities - Base/ancestry abilities
 * @returns {object} { canDecrease: boolean, refund: number, reason: string }
 */
export function canDecreaseAbility(abilities, abilityName, baseAbilities = {}) {
    const currentValue = abilities[abilityName] || 0;
    const baseValue = baseAbilities[abilityName] || 0;
    const refund = getAbilityDecreaseRefund(currentValue);
    const newValue = currentValue - 1;
    
    // Cannot go below minimum (-2)
    if (newValue < ABILITY_CONSTRAINTS.MIN_ABILITY) {
        return {
            canDecrease: false,
            refund: 0,
            reason: `Cannot reduce below ${ABILITY_CONSTRAINTS.MIN_ABILITY}`
        };
    }
    
    // Check negative sum constraint (only applies when new value would be negative)
    if (newValue < 0) {
        // Calculate current sum of all negative abilities
        const currentNegSum = Object.values(abilities)
            .filter(v => v < 0)
            .reduce((sum, v) => sum + v, 0);
        
        // Calculate what the new sum would be after this decrease
        let newNegSum;
        if (currentValue < 0) {
            // Already negative, will become more negative
            newNegSum = currentNegSum - 1;
        } else {
            // Going from 0 to -1, add -1 to the sum
            newNegSum = currentNegSum + newValue;
        }
        
        if (newNegSum < ABILITY_CONSTRAINTS.MAX_NEGATIVE_SUM) {
            return {
                canDecrease: false,
                refund: 0,
                reason: `Sum of negative abilities cannot be less than ${ABILITY_CONSTRAINTS.MAX_NEGATIVE_SUM}`
            };
        }
    }
    
    // Cannot go below base ability (but base is usually 0, so this rarely applies)
    // Only enforced if base is positive (racial bonus)
    if (baseValue > 0 && newValue < baseValue) {
        return {
            canDecrease: false,
            refund: 0,
            reason: `Cannot reduce below base value of ${baseValue}`
        };
    }
    
    return {
        canDecrease: true,
        refund,
        reason: null
    };
}

/**
 * Get the sum of all negative ability values
 * @param {object} abilities - Abilities object
 * @returns {number} Sum of negative values (will be 0 or negative)
 */
export function getNegativeAbilitySum(abilities) {
    return Object.values(abilities || {})
        .filter(v => v < 0)
        .reduce((sum, v) => sum + v, 0);
}

// =====================================================
// ARCHETYPE PROGRESSION SYSTEM
// =====================================================

/**
 * Determine character archetype based on proficiencies
 * @param {number} martialProf - Martial proficiency level
 * @param {number} powerProf - Power proficiency level
 * @returns {string} Archetype type: 'power', 'martial', or 'mixed'
 */
export function getArchetypeType(martialProf, powerProf) {
    if (martialProf === 0 && powerProf > 0) return 'power';
    if (powerProf === 0 && martialProf > 0) return 'martial';
    if (martialProf > 0 && powerProf > 0) return 'mixed';
    return 'none'; // Both are 0
}

/**
 * Get milestone levels where archetype choices can be made (every 3 levels starting at 4)
 * @param {number} maxLevel - Maximum level to calculate up to
 * @returns {number[]} Array of milestone levels
 */
export function getArchetypeMilestoneLevels(maxLevel) {
    const milestones = [];
    for (let level = 4; level <= maxLevel; level += 3) {
        milestones.push(level);
    }
    return milestones;
}

/**
 * Calculate armament proficiency based on martial proficiency
 * @param {number} martialProf - Martial proficiency level
 * @returns {number} Armament proficiency value
 */
export function calculateArmamentProficiency(martialProf) {
    if (martialProf === 0) return 3;
    if (martialProf === 1) return 8;
    if (martialProf === 2) return 12;
    return 12 + (3 * (martialProf - 2)); // 15, 18, 21, etc.
}

/**
 * Calculate base innate threshold for pure power archetype
 * @param {number} level - Character level
 * @returns {number} Base innate threshold
 */
export function calculateBaseInnateThreshold(level) {
    if (level < 4) return 8;
    const bonuses = Math.floor((level - 1) / 3); // Level 4, 7, 10, etc.
    return 8 + bonuses;
}

/**
 * Calculate base innate pools for pure power archetype
 * @param {number} level - Character level
 * @returns {number} Base innate pools
 */
export function calculateBaseInnatePools(level) {
    if (level < 4) return 2;
    const bonuses = Math.floor((level - 1) / 3); // Level 4, 7, 10, etc.
    return 2 + bonuses;
}

/**
 * Calculate bonus archetype feats for pure martial archetype
 * @param {number} level - Character level
 * @returns {number} Bonus archetype feats
 */
export function calculateBonusArchetypeFeats(level) {
    if (level < 4) return 2;
    const bonuses = Math.floor((level - 1) / 3); // Level 4, 7, 10, etc.
    return 2 + bonuses;
}

/**
 * Calculate archetype progression based on proficiencies and choices
 * @param {number} level - Character level
 * @param {number} martialProf - Martial proficiency level
 * @param {number} powerProf - Power proficiency level
 * @param {object} archetypeChoices - Choices made at milestone levels
 * @returns {object} Complete archetype progression data
 */
export function calculateArchetypeProgression(level, martialProf, powerProf, archetypeChoices = {}) {
    const archetype = getArchetypeType(martialProf, powerProf);
    const armamentProficiency = calculateArmamentProficiency(martialProf);
    
    let innateThreshold = 0;
    let innatePools = 0;
    let innateEnergy = 0;
    let bonusArchetypeFeats = 0;
    
    switch (archetype) {
        case 'power':
            // Pure Power Archetype
            innateThreshold = calculateBaseInnateThreshold(level);
            innatePools = calculateBaseInnatePools(level);
            innateEnergy = innateThreshold * innatePools;
            break;
            
        case 'martial':
            // Pure Martial Archetype
            bonusArchetypeFeats = calculateBonusArchetypeFeats(level);
            break;
            
        case 'mixed':
            // Mixed Archetype - Base values + choices
            innateThreshold = 6;
            innatePools = 1;
            bonusArchetypeFeats = 1;
            
            // Apply choices made at milestone levels
            const milestones = getArchetypeMilestoneLevels(level);
            for (const milestoneLevel of milestones) {
                const choice = archetypeChoices[milestoneLevel];
                if (choice === 'innate') {
                    innateThreshold += 1;
                    innatePools += 1;
                } else if (choice === 'feat') {
                    bonusArchetypeFeats += 1;
                }
                // If no choice is made, no bonus is applied
            }
            
            innateEnergy = innateThreshold * innatePools;
            break;
            
        default:
            // No archetype (both proficiencies are 0)
            break;
    }
    
    return {
        archetype,
        armamentProficiency,
        innateThreshold,
        innatePools,
        innateEnergy,
        bonusArchetypeFeats,
        availableMilestones: archetype === 'mixed' ? getArchetypeMilestoneLevels(level) : []
    };
}

/**
 * Validate an archetype choice for a given milestone level
 * @param {number} milestoneLevel - The level where the choice is being made
 * @param {string} choice - The choice: 'innate' or 'feat'
 * @param {number} martialProf - Martial proficiency level
 * @param {number} powerProf - Power proficiency level
 * @returns {object} Validation result
 */
export function validateArchetypeChoice(milestoneLevel, choice, martialProf, powerProf) {
    const archetype = getArchetypeType(martialProf, powerProf);
    
    if (archetype !== 'mixed') {
        return {
            isValid: false,
            reason: `Archetype choices are only available for mixed archetypes (both martial and power proficiency > 0)`
        };
    }
    
    if (!getArchetypeMilestoneLevels(milestoneLevel).includes(milestoneLevel)) {
        return {
            isValid: false,
            reason: `Level ${milestoneLevel} is not a valid milestone level for archetype choices`
        };
    }
    
    if (!['innate', 'feat'].includes(choice)) {
        return {
            isValid: false,
            reason: `Invalid choice "${choice}". Must be "innate" or "feat"`
        };
    }
    
    return {
        isValid: true,
        reason: null
    };
}

/**
 * Apply an archetype choice and return updated choices object
 * @param {object} currentChoices - Current archetype choices
 * @param {number} milestoneLevel - Level where choice is being made
 * @param {string} choice - The choice: 'innate' or 'feat'
 * @param {number} martialProf - Martial proficiency level
 * @param {number} powerProf - Power proficiency level
 * @returns {object} Updated choices object or error
 */
export function applyArchetypeChoice(currentChoices, milestoneLevel, choice, martialProf, powerProf) {
    const validation = validateArchetypeChoice(milestoneLevel, choice, martialProf, powerProf);
    
    if (!validation.isValid) {
        return {
            success: false,
            error: validation.reason,
            choices: currentChoices
        };
    }
    
    const newChoices = { ...currentChoices };
    newChoices[milestoneLevel] = choice;
    
    return {
        success: true,
        error: null,
        choices: newChoices
    };
}

/**
 * Clear choices that are no longer valid due to proficiency changes
 * @param {object} currentChoices - Current archetype choices
 * @param {number} level - Current character level
 * @param {number} martialProf - Current martial proficiency
 * @param {number} powerProf - Current power proficiency
 * @returns {object} Cleaned choices object
 */
export function cleanInvalidArchetypeChoices(currentChoices, level, martialProf, powerProf) {
    const archetype = getArchetypeType(martialProf, powerProf);
    
    // If not mixed archetype, clear all choices
    if (archetype !== 'mixed') {
        return {};
    }
    
    // Remove choices for levels above current level
    const validMilestones = getArchetypeMilestoneLevels(level);
    const cleanedChoices = {};
    
    for (const [milestoneLevel, choice] of Object.entries(currentChoices)) {
        const levelNum = parseInt(milestoneLevel);
        if (validMilestones.includes(levelNum)) {
            cleanedChoices[levelNum] = choice;
        }
    }
    
    return cleanedChoices;
}

/**
 * Get summary of what each choice provides at a milestone level
 * @param {number} milestoneLevel - The milestone level
 * @returns {object} Summary of choice benefits
 */
export function getArchetypeChoiceBenefits(milestoneLevel) {
    return {
        innate: {
            label: 'Innate Power',
            description: '+1 Innate Threshold, +1 Innate Pool',
            benefits: ['Innate Threshold +1', 'Innate Pools +1']
        },
        feat: {
            label: 'Combat Expertise', 
            description: '+1 Bonus Archetype Feat',
            benefits: ['Archetype Feats +1']
        }
    };
}
