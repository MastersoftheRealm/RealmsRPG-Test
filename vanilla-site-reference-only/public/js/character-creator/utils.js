// Shared utility functions for the character creator
// NOTE: Many of these are now re-exported from the shared modules for consistency

// Import from shared modules
import { sanitizeId as sharedSanitizeId } from '../shared/string-utils.js';
import { formatBonus as sharedFormatBonus } from '../shared/number-utils.js';
import { toStrArray as sharedToStrArray, toNumArray as sharedToNumArray } from '../shared/array-utils.js';
import { debounce as sharedDebounce } from '../shared/dom-utils.js';

// Re-export from shared modules for backwards compatibility
export const sanitizeId = sharedSanitizeId;
export const formatBonus = sharedFormatBonus;
export const toStrArray = sharedToStrArray;
export const toNumArray = sharedToNumArray;
export const debounce = sharedDebounce;

/**
 * Convert centimeters to feet and inches
 */
export function cmToFtIn(cm) {
  if (!cm) return 'N/A';
  const inches = cm / 2.54;
  const ft = Math.floor(inches / 12);
  const inc = Math.round(inches % 12);
  return `${ft}'${inc}"`;
}

/**
 * Convert kilograms to pounds
 */
export function kgToLb(kg) {
  if (!kg) return 'N/A';
  return Math.round(kg * 2.20462);
}

/**
 * Deep clone an object
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if user meets feat requirements
 */
export function meetsRequirements(feat, character) {
  if (!character) return false;
  
  const abilities = character.abilities || {};
  
  // Level requirement
  if (feat.lvl_req && feat.lvl_req > 1) return false;
  
  // Ability requirements
  if (feat.ability_req && Array.isArray(feat.ability_req) && feat.abil_req_val && Array.isArray(feat.abil_req_val)) {
    for (let i = 0; i < feat.ability_req.length; i++) {
      const reqAbil = feat.ability_req[i].toLowerCase();
      const reqVal = feat.abil_req_val[i] || 0;
      if ((abilities[reqAbil] || 0) < reqVal) return false;
    }
  }
  
  return true;
}

/**
 * Get archetype feat limit
 */
export function getArchetypeFeatLimit(archetype) {
  if (!archetype) return 0;
  if (archetype.type === 'martial') return 3;
  if (archetype.type === 'powered-martial') return 2;
  if (archetype.type === 'power') return 1;
  return 0;
}

/**
 * Calculate training points based on archetype and abilities
 */
export function calculateTrainingPoints(character) {
  const abilities = character.abilities || {
    strength: 0, vitality: 0, agility: 0,
    acuity: 0, intelligence: 0, charisma: 0
  };
  
  let trainingPoints = 22;
  
  if (character.archetype) {
    const archetypeAbilities = character.archetype.abilities;
    if (typeof archetypeAbilities === 'string') {
      const abilityKey = archetypeAbilities.toLowerCase();
      trainingPoints += abilities[abilityKey] || 0;
    } else if (typeof archetypeAbilities === 'object') {
      const powerAbil = archetypeAbilities.power ? archetypeAbilities.power.toLowerCase() : '';
      const martialAbil = archetypeAbilities.martial ? archetypeAbilities.martial.toLowerCase() : '';
      const powerVal = abilities[powerAbil] || 0;
      const martialVal = abilities[martialAbil] || 0;
      trainingPoints += Math.max(powerVal, martialVal);
    }
  }
  
  return trainingPoints;
}

/**
 * Get armament proficiency max based on archetype
 */
export function getArmamentMax(archetype) {
  if (!archetype) return 4;
  if (archetype.type === 'powered-martial') return 8;
  if (archetype.type === 'martial') return 16;
  return 4;
}

/**
 * Get archetype ability score
 */
export function getArchetypeAbilityScore() {
    const char = window.character || {};
    const archetype = char.archetype || {};
    const abilities = char.abilities || {};
    
    if (archetype.type === 'powered-martial') {
        // For powered-martial, abilities is an object like {power: 'Strength', martial: 'Agility'}
        const powerAbilityName = archetype.abilities?.power;
        const martialAbilityName = archetype.abilities?.martial;
        const pow = abilities[powerAbilityName?.toLowerCase()] ?? 0;
        const mar = abilities[martialAbilityName?.toLowerCase()] ?? 0;
        return Math.max(pow, mar);
    }
    if (archetype.type === 'martial' || archetype.type === 'power') {
        // For martial/power, abilities is a string like 'Acuity'
        const abilityName = archetype.abilities;
        return abilities[abilityName?.toLowerCase()] ?? 0;
    }
    return 0;
}

/**
 * Get base health
 */
export function getBaseHealth() {
    const archetype = window.character?.archetype || {};
    const abilities = window.character?.abilities || {};
    
    // Generally 8 + vitality, but if vitality is an archetype ability, use 8 + strength
    let healthAbility = 'vitality';
    
    if (archetype.type === 'powered-martial') {
        const powerAbilityName = archetype.abilities?.power?.toLowerCase();
        const martialAbilityName = archetype.abilities?.martial?.toLowerCase();
        if (powerAbilityName === 'vitality' || martialAbilityName === 'vitality') {
            healthAbility = 'strength';
        }
    } else if (archetype.type === 'power' || archetype.type === 'martial') {
        if (archetype.abilities?.toLowerCase() === 'vitality') {
            healthAbility = 'strength';
        }
    }
    
    return 8 + (abilities[healthAbility] ?? 0);
}

/**
 * Get base energy
 */
export function getBaseEnergy() {
    // Energy defaults to 0 + archetype ability score
    return getArchetypeAbilityScore();
}

/**
 * Get default training points
 */
export function getDefaultTrainingPoints() {
    // 22 + archetype ability score
    return 22 + getArchetypeAbilityScore();
}
