/**
 * Character Validation & Constraints
 * 
 * This module handles validation logic for character editing,
 * ensuring characters stay within allowed progression limits.
 */

import {
    calculateAbilityPoints,
    calculateSkillPoints,
    calculateTrainingPoints,
    calculateProficiencyPoints,
    calculateMaxArchetypeFeats,
    calculateMaxCharacterFeats,
    calculateHealthEnergyPoints,
    getLevelProgression,
    ABILITY_CONSTRAINTS,
    getAbilityIncreaseCost,
    getAbilityDecreaseRefund,
    calculateAbilityPointsSpent,
    canIncreaseAbility,
    canDecreaseAbility,
    getNegativeAbilitySum
} from './level-progression.js';
import { getCachedFeats } from '../core/rtdb-cache.js';
import { findByIdOrName } from '/js/shared/id-constants.js';

// Re-export for convenience
export {
    ABILITY_CONSTRAINTS,
    getAbilityIncreaseCost,
    getAbilityDecreaseRefund,
    canIncreaseAbility,
    canDecreaseAbility,
    getNegativeAbilitySum
};

/**
 * Calculate how many ability points have been spent
 * Uses the proper cost calculation (2 points for abilities 4+)
 * @param {object} abilities - Character abilities object
 * @param {object} baseAbilities - Starting/racial abilities (optional)
 * @returns {number} Total points spent
 */
export function calculateSpentAbilityPoints(abilities, baseAbilities = {}) {
    return calculateAbilityPointsSpent(abilities, baseAbilities);
}

/**
 * Calculate how many skill points have been spent
 * @param {object} skills - Character skills object (skill name -> rank)
 * @returns {number} Total points spent
 */
export function calculateSpentSkillPoints(skills) {
    let spent = 0;
    
    for (const rank of Object.values(skills || {})) {
        spent += Math.max(0, rank || 0);
    }
    
    return spent;
}

/**
 * Calculate how many training points have been spent
 * @param {number} martialProficiency - Martial proficiency value
 * @param {number} powerProficiency - Power proficiency value
 * @param {number} proficiencyPoints - Base proficiency points available
 * @returns {number} Total training points spent on proficiencies
 */
export function calculateSpentTrainingPoints(martialProficiency, powerProficiency, proficiencyPoints) {
    // Each proficiency point can be allocated to martial or power
    // Training points spent = total proficiency above the base
    const baseMartial = 0;
    const basePower = 0;
    
    const martialSpent = Math.max(0, (martialProficiency || 0) - baseMartial);
    const powerSpent = Math.max(0, (powerProficiency || 0) - basePower);
    
    return martialSpent + powerSpent;
}

/**
 * Validate if an ability score increase is allowed
 * @param {object} character - Full character data
 * @param {string} abilityName - Name of the ability to increase
 * @param {number} newValue - Proposed new value
 * @returns {object} {valid: boolean, error: string, pointsAvailable: number, pointsSpent: number}
 */
export function validateAbilityIncrease(character, abilityName, newValue) {
    const level = character.level || 1;
    const totalPoints = calculateAbilityPoints(level);
    const baseAbilities = character.baseAbilities || character.ancestryAbilities || {};
    
    // Calculate what would be spent with this new value
    const testAbilities = { ...(character.abilities || {}), [abilityName]: newValue };
    const spentPoints = calculateSpentAbilityPoints(testAbilities, baseAbilities);
    
    if (spentPoints > totalPoints) {
        return {
            valid: false,
            error: `Not enough ability points. You have ${totalPoints - calculateSpentAbilityPoints(character.abilities, baseAbilities)} points remaining.`,
            pointsAvailable: totalPoints,
            pointsSpent: spentPoints
        };
    }
    
    // Check if new value is negative (usually not allowed unless base is negative)
    const baseValue = baseAbilities[abilityName] || 0;
    if (newValue < baseValue) {
        return {
            valid: false,
            error: `Cannot reduce ability below base value of ${baseValue}.`,
            pointsAvailable: totalPoints,
            pointsSpent: spentPoints
        };
    }
    
    return {
        valid: true,
        error: null,
        pointsAvailable: totalPoints,
        pointsSpent: spentPoints
    };
}

/**
 * Validate if a skill rank increase is allowed
 * @param {object} character - Full character data
 * @param {string} skillName - Name of the skill to increase
 * @param {number} newRank - Proposed new rank
 * @returns {object} {valid: boolean, error: string, pointsAvailable: number, pointsSpent: number}
 */
export function validateSkillIncrease(character, skillName, newRank) {
    const level = character.level || 1;
    const totalPoints = calculateSkillPoints(level);
    
    // Calculate what would be spent with this new rank
    const testSkills = { ...(character.skills || {}), [skillName]: newRank };
    const spentPoints = calculateSpentSkillPoints(testSkills);
    
    if (spentPoints > totalPoints) {
        return {
            valid: false,
            error: `Not enough skill points. You have ${totalPoints - calculateSpentSkillPoints(character.skills)} points remaining.`,
            pointsAvailable: totalPoints,
            pointsSpent: spentPoints
        };
    }
    
    // Skills can't go below 0
    if (newRank < 0) {
        return {
            valid: false,
            error: 'Skill rank cannot be negative.',
            pointsAvailable: totalPoints,
            pointsSpent: spentPoints
        };
    }
    
    return {
        valid: true,
        error: null,
        pointsAvailable: totalPoints,
        pointsSpent: spentPoints
    };
}

/**
 * Validate if a proficiency increase is allowed
 * @param {object} character - Full character data
 * @param {string} proficiencyType - 'martial' or 'power'
 * @param {number} newValue - Proposed new proficiency value
 * @returns {object} {valid: boolean, error: string, pointsAvailable: number, pointsSpent: number}
 */
export function validateProficiencyIncrease(character, proficiencyType, newValue) {
    const level = character.level || 1;
    const totalPoints = calculateProficiencyPoints(level);
    
    const martialProf = proficiencyType === 'martial' ? newValue : (character.mart_prof || 0);
    const powerProf = proficiencyType === 'power' ? newValue : (character.pow_prof || 0);
    
    const spentPoints = martialProf + powerProf;
    
    if (spentPoints > totalPoints) {
        return {
            valid: false,
            error: `Not enough proficiency points. You have ${totalPoints} points total.`,
            pointsAvailable: totalPoints,
            pointsSpent: spentPoints
        };
    }
    
    if (newValue < 0) {
        return {
            valid: false,
            error: 'Proficiency cannot be negative.',
            pointsAvailable: totalPoints,
            pointsSpent: spentPoints
        };
    }
    
    return {
        valid: true,
        error: null,
        pointsAvailable: totalPoints,
        pointsSpent: spentPoints
    };
}

/**
 * Validate if adding a feat is allowed
 * @param {object} character - Full character data
 * @param {string} featType - 'archetype' or 'character'
 * @returns {object} {valid: boolean, error: string, maxFeats: number, currentFeats: number}
 */
export function validateFeatAddition(character, featType) {
    const level = character.level || 1;
    const highestArchetypeAbility = getHighestArchetypeAbility(character);
    const progression = getLevelProgression(
        level, 
        highestArchetypeAbility,
        character.mart_prof || 0,
        character.pow_prof || 0,
        character.archetypeChoices || {}
    );
    const featCounts = countFeatsByTypeSync(character, progression);
    
    let maxFeats, currentFeats;
    if (featType === 'archetype') {
        maxFeats = featCounts.archetype.max;
        currentFeats = featCounts.archetype.current;
    } else if (featType === 'character') {
        maxFeats = featCounts.character.max;
        currentFeats = featCounts.character.current;
    } else {
        return {
            valid: false,
            error: 'Invalid feat type.',
            maxFeats: 0,
            currentFeats: 0
        };
    }
    
    if (currentFeats >= maxFeats) {
        return {
            valid: false,
            error: `Maximum ${featType} feats reached (${currentFeats}/${maxFeats}).`,
            maxFeats,
            currentFeats
        };
    }
    
    return {
        valid: true,
        error: null,
        maxFeats,
        currentFeats
    };
}

/**
 * Get comprehensive resource tracking for a character
 * Shows what's available vs. what's been spent
 * @param {object} character - Full character data
 * @returns {object} Resource tracking information
 */
export function getCharacterResourceTracking(character) {
    const level = character.level || 1;
    const highestArchetypeAbility = getHighestArchetypeAbility(character);
    const progression = getLevelProgression(
        level, 
        highestArchetypeAbility,
        character.mart_prof || 0,
        character.pow_prof || 0,
        character.archetypeChoices || {}
    );
    
    const baseAbilities = character.baseAbilities || character.ancestryAbilities || {};
    const abilityPointsSpent = calculateSpentAbilityPoints(character.abilities, baseAbilities);
    const skillPointsSpent = calculateSpentSkillPoints(character.skills);
    const proficiencyPointsSpent = (character.mart_prof || 0) + (character.pow_prof || 0);
    
    // Health-Energy points tracking
    const healthEnergyPoints = calculateHealthEnergyPoints(level);
    const healthAllocated = character.health_energy_points?.health || 0;
    const energyAllocated = character.health_energy_points?.energy || 0;
    const healthEnergySpent = healthAllocated + energyAllocated;
    
    return {
        level,
        healthEnergyPoints: {
            total: healthEnergyPoints,
            spent: healthEnergySpent,
            remaining: healthEnergyPoints - healthEnergySpent,
            health: healthAllocated,
            energy: energyAllocated
        },
        abilityPoints: {
            total: progression.abilityPoints,
            spent: abilityPointsSpent,
            remaining: progression.abilityPoints - abilityPointsSpent,
            negativeSum: getNegativeAbilitySum(character.abilities),
            maxAbility: ABILITY_CONSTRAINTS.getMaxAbility(level)
        },
        skillPoints: {
            total: progression.skillPoints,
            spent: skillPointsSpent,
            remaining: progression.skillPoints - skillPointsSpent
        },
        proficiencyPoints: {
            total: progression.proficiencyPoints,
            spent: proficiencyPointsSpent,
            remaining: progression.proficiencyPoints - proficiencyPointsSpent,
            martial: character.mart_prof || 0,
            power: character.pow_prof || 0
        },
        feats: countFeatsByTypeSync(character, progression)
    };
}

/**
 * Count feats by type (synchronous version - uses enriched data when available)
 * @param {object} character - Full character data
 * @param {object} progression - Level progression data
 * @returns {object} Feat tracking for both types
 */
function countFeatsByTypeSync(character, progression) {
    // Use _displayFeats if available (enriched data), otherwise check raw feats
    const displayFeats = character._displayFeats || [];
    const rawFeats = character.feats || [];
    
    let archetypeCost = 0;
    let characterCost = 0;
    
    if (displayFeats.length > 0) {
        // Count from enriched display feats, using feat_lvl for cost
        displayFeats.forEach(f => {
            const cost = parseInt(f.feat_lvl) || 1; // Use feat_lvl, default to 1
            if (f.char_feat) {
                characterCost += cost;
            } else {
                archetypeCost += cost;
            }
        });
    } else if (rawFeats.length > 0) {
        // Fallback: try to use cached feat data to get proper feat_lvl values
        try {
            const cachedFeats = getCachedFeats();
            
            if (cachedFeats && cachedFeats.length > 0) {
                rawFeats.forEach(featEntry => {
                    const featName = typeof featEntry === 'string' ? featEntry : featEntry?.name;
                    if (!featName) return;
                    
                    const featData = findByIdOrName(cachedFeats, featEntry);
                    const cost = featData ? (parseInt(featData.feat_lvl) || 1) : 1;
                    const isCharFeat = featData ? !!featData.char_feat : false;
                    
                    if (isCharFeat) {
                        characterCost += cost;
                    } else {
                        archetypeCost += cost;
                    }
                });
            } else {
                // Final fallback: all raw feats are archetype feats with cost 1 each
                archetypeCost = rawFeats.length;
            }
        } catch (e) {
            // If we can't access cache, fall back to counting as 1 each
            archetypeCost = rawFeats.length;
        }
    }
    
    return {
        archetype: {
            max: progression.maxArchetypeFeats,
            current: archetypeCost,
            remaining: progression.maxArchetypeFeats - archetypeCost
        },
        character: {
            max: progression.maxCharacterFeats,
            current: characterCost,
            remaining: progression.maxCharacterFeats - characterCost
        }
    };
}

/**
 * Count feats by type (async version - fetches feat data when needed)
 * @param {object} character - Full character data
 * @param {object} progression - Level progression data
 * @returns {object} Feat tracking for both types
 */
async function countFeatsByType(character, progression) {
    // Use _displayFeats if available (enriched data), otherwise check raw feats
    const displayFeats = character._displayFeats || [];
    const rawFeats = character.feats || [];
    
    let archetypeCost = 0;
    let characterCost = 0;
    
    if (displayFeats.length > 0) {
        // Count from enriched display feats, using feat_lvl for cost
        displayFeats.forEach(f => {
            const cost = parseInt(f.feat_lvl) || 1; // Use feat_lvl, default to 1
            if (f.char_feat) {
                characterCost += cost;
            } else {
                archetypeCost += cost;
            }
        });
    } else if (rawFeats.length > 0) {
        // Fallback: fetch feat data to get proper feat_lvl values
        try {
            const { fetchAllFeats } = await import('../core/rtdb-cache.js');
            const allFeats = await fetchAllFeats();
            
            rawFeats.forEach(featEntry => {
                const featName = typeof featEntry === 'string' ? featEntry : featEntry?.name;
                if (!featName) return;
                
                const featData = findByIdOrName(allFeats, featEntry);
                const cost = featData ? (parseInt(featData.feat_lvl) || 1) : 1;
                const isCharFeat = featData ? !!featData.char_feat : false;
                
                if (isCharFeat) {
                    characterCost += cost;
                } else {
                    archetypeCost += cost;
                }
            });
        } catch (e) {
            // If we can't fetch feat data, fall back to counting as 1 each
            console.warn('[validation] Failed to fetch feat data for cost calculation:', e);
            archetypeCost = rawFeats.length;
        }
    }
    
    return {
        archetype: {
            max: progression.maxArchetypeFeats,
            current: archetypeCost,
            remaining: progression.maxArchetypeFeats - archetypeCost
        },
        character: {
            max: progression.maxCharacterFeats,
            current: characterCost,
            remaining: progression.maxCharacterFeats - characterCost
        }
    };
}

/**
 * Helper to get the highest archetype ability score
 * @param {object} character - Full character data
 * @returns {number} Highest archetype ability score
 */
function getHighestArchetypeAbility(character) {
    if (!character || !character.abilities) return 0;
    
    const powAbil = character.pow_abil || (character.archetype?.pow_abil);
    const martAbil = character.mart_abil || (character.archetype?.mart_abil);
    
    let powVal = 0, martVal = 0;
    if (powAbil) powVal = character.abilities[String(powAbil).toLowerCase()] || 0;
    if (martAbil) martVal = character.abilities[String(martAbil).toLowerCase()] || 0;
    
    return Math.max(powVal, martVal);
}

/**
 * Validate an entire character's resource allocation
 * Useful for loading a character and checking if they're valid
 * @param {object} character - Full character data
 * @returns {object} {valid: boolean, errors: string[]}
 */
export function validateCharacter(character) {
    const errors = [];
    const tracking = getCharacterResourceTracking(character);
    
    if (tracking.abilityPoints.remaining < 0) {
        errors.push(`Over-allocated ability points by ${Math.abs(tracking.abilityPoints.remaining)}`);
    }
    
    if (tracking.skillPoints.remaining < 0) {
        errors.push(`Over-allocated skill points by ${Math.abs(tracking.skillPoints.remaining)}`);
    }
    
    if (tracking.proficiencyPoints.remaining < 0) {
        errors.push(`Over-allocated proficiency points by ${Math.abs(tracking.proficiencyPoints.remaining)}`);
    }
    
    if (tracking.feats.archetype.remaining < 0) {
        errors.push(`Too many archetype feats (${tracking.feats.archetype.current}/${tracking.feats.archetype.max})`);
    }
    
    if (tracking.feats.character.remaining < 0) {
        errors.push(`Too many character feats (${tracking.feats.character.current}/${tracking.feats.character.max})`);
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

// =====================================================
// HEALTH-ENERGY POINTS VALIDATION
// =====================================================

/**
 * Validate if health points can be increased
 * @param {object} character - Full character data
 * @param {number} newHealthValue - Proposed new health allocation
 * @returns {object} { valid: boolean, error: string, pointsAvailable: number }
 */
export function validateHealthIncrease(character, newHealthValue) {
    const level = character.level || 1;
    const totalPoints = calculateHealthEnergyPoints(level);
    const currentEnergy = character.health_energy_points?.energy || 0;
    const currentHealth = character.health_energy_points?.health || 0;
    
    if (newHealthValue < 0) {
        return {
            valid: false,
            error: 'Health allocation cannot be negative.',
            pointsAvailable: totalPoints - currentEnergy,
            currentValue: currentHealth
        };
    }
    
    const spentPoints = newHealthValue + currentEnergy;
    
    if (spentPoints > totalPoints) {
        return {
            valid: false,
            error: `Not enough Health-Energy points. You have ${totalPoints - currentEnergy} points available for health.`,
            pointsAvailable: totalPoints - currentEnergy,
            currentValue: currentHealth
        };
    }
    
    return {
        valid: true,
        error: null,
        pointsAvailable: totalPoints - currentEnergy,
        currentValue: currentHealth
    };
}

/**
 * Validate if energy points can be increased
 * @param {object} character - Full character data
 * @param {number} newEnergyValue - Proposed new energy allocation
 * @returns {object} { valid: boolean, error: string, pointsAvailable: number }
 */
export function validateEnergyIncrease(character, newEnergyValue) {
    const level = character.level || 1;
    const totalPoints = calculateHealthEnergyPoints(level);
    const currentHealth = character.health_energy_points?.health || 0;
    const currentEnergy = character.health_energy_points?.energy || 0;
    
    if (newEnergyValue < 0) {
        return {
            valid: false,
            error: 'Energy allocation cannot be negative.',
            pointsAvailable: totalPoints - currentHealth,
            currentValue: currentEnergy
        };
    }
    
    const spentPoints = currentHealth + newEnergyValue;
    
    if (spentPoints > totalPoints) {
        return {
            valid: false,
            error: `Not enough Health-Energy points. You have ${totalPoints - currentHealth} points available for energy.`,
            pointsAvailable: totalPoints - currentHealth,
            currentValue: currentEnergy
        };
    }
    
    return {
        valid: true,
        error: null,
        pointsAvailable: totalPoints - currentHealth,
        currentValue: currentEnergy
    };
}

/**
 * Get the next cost for increasing an ability
 * Wrapper for UI to show cost before clicking
 * @param {object} character - Full character data  
 * @param {string} abilityName - Ability to check
 * @returns {object} { cost: number, canAfford: boolean }
 */
export function getAbilityIncreaseCostInfo(character, abilityName) {
    const level = character.level || 1;
    const totalPoints = calculateAbilityPoints(level);
    const baseAbilities = character.baseAbilities || character.ancestryAbilities || {};
    const spent = calculateSpentAbilityPoints(character.abilities, baseAbilities);
    const remaining = totalPoints - spent;
    
    const currentValue = character.abilities?.[abilityName] || 0;
    const cost = getAbilityIncreaseCost(currentValue);
    
    return {
        cost,
        canAfford: cost <= remaining,
        remaining
    };
}

/**
 * Get the refund for decreasing an ability
 * Wrapper for UI to show refund before clicking
 * @param {object} character - Full character data
 * @param {string} abilityName - Ability to check
 * @returns {object} { refund: number, canDecrease: boolean, reason: string }
 */
export function getAbilityDecreaseInfo(character, abilityName) {
    const baseAbilities = character.baseAbilities || character.ancestryAbilities || {};
    const result = canDecreaseAbility(character.abilities, abilityName, baseAbilities);
    
    return {
        refund: result.refund,
        canDecrease: result.canDecrease,
        reason: result.reason
    };
}
