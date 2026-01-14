/**
 * ID Constants for RealmsRPG Database Entities
 * =============================================
 * Centralized mapping of database entity IDs.
 * Use these instead of hardcoded names for lookups.
 */

// =============================================================================
// PART IDS (Power & Technique Parts)
// =============================================================================

export const PART_IDS = {
  // Damage Types
  TRUE_DAMAGE: 1,
  ADDITIONAL_DAMAGE: 6,
  SPLIT_DAMAGE_DICE: 5,

  // Action Modifiers (Technique)
  REACTION: 2,
  LONG_ACTION: 3,
  QUICK_OR_FREE_ACTION: 4,

  // Action Modifiers (Power)
  POWER_REACTION: 82,
  POWER_LONG_ACTION: 81,
  POWER_QUICK_OR_FREE_ACTION: 83,

  // Weapon/Attack Parts
  ADD_WEAPON_ATTACK: 7,
  RECKLESS: 8,
  PASS_THROUGH: 9,
  SPIN: 10,
  STUN: 11,
  WIND_UP: 12,
  KNOCKBACK: 13,
  SLOW: 14,
  DAZE: 15,
  WIDE_SWING: 16,
  ENEMY_STRENGTH_REDUCTION: 17,
  REACH: 18,
  EXPOSE: 19,
  ENEMY_ATTACK_REDUCTION: 20,
  BLEED: 21,

  // Area of Effect Parts
  LINE_OF_EFFECT: 88,
  CONE_OF_EFFECT: 89,
  CYLINDER_OF_EFFECT: 231,
  SPHERE_OF_EFFECT: 232,
  TRAIL_OF_EFFECT: 233,
  PIERCE_TARGETS_ON_PATH: 234,
  ADD_MULTIPLE_TARGETS: 235,
  EXPANDING_AREA_OF_EFFECT: 236,
  TARGET_ONE_IN_AREA: 237,
  EXCLUDE_AREA: 238,

  // Power Range
  POWER_RANGE: 292,

  // Power Damage Types
  MAGIC_DAMAGE: 294,
  LIGHT_DAMAGE: 295,
  PHYSICAL_DAMAGE: 296,
  ELEMENTAL_DAMAGE: 297,
  POISON_OR_NECROTIC_DAMAGE: 298,
  SONIC_DAMAGE: 299,
  SPIRITUAL_DAMAGE: 300,
  PSYCHIC_DAMAGE: 301,

  // Duration Parts
  DURATION_ROUND: 377,
  DURATION_MINUTE: 378,
  DURATION_HOUR: 376,
  DURATION_DAYS: 375,
  DURATION_PERMANENT: 306,
  
  // Duration Modifiers
  DURATION_ENDS_ON_ACTIVATION: 302,
  DURATION_NO_HARM: 303,
  DURATION_FOCUS: 304,
  DURATION_SUSTAIN: 305,
} as const;

// =============================================================================
// PROPERTY IDS (Item Properties)
// =============================================================================

export const PROPERTY_IDS = {
  // General / Base Properties
  DAMAGE_REDUCTION: 1,
  ARMOR_STRENGTH_REQUIREMENT: 2,
  ARMOR_AGILITY_REQUIREMENT: 3,
  ARMOR_VITALITY_REQUIREMENT: 4,
  AGILITY_REDUCTION: 5,
  WEAPON_STRENGTH_REQUIREMENT: 6,
  WEAPON_AGILITY_REQUIREMENT: 7,
  WEAPON_VITALITY_REQUIREMENT: 8,
  WEAPON_ACUITY_REQUIREMENT: 9,
  WEAPON_INTELLIGENCE_REQUIREMENT: 10,
  WEAPON_CHARISMA_REQUIREMENT: 11,
  SPLIT_DAMAGE_DICE: 12,
  RANGE: 13,
  TWO_HANDED: 14,
  SHIELD_BASE: 15,
  ARMOR_BASE: 16,
  WEAPON_DAMAGE: 17,

  // Combat Properties
  DAMAGE_TYPE_RESISTANCE: 18,
  BLUDGEONING_VULNERABILITY: 19,
  PIERCING_VULNERABILITY: 20,
  SLASHING_VULNERABILITY: 21,
  CRITICAL_RANGE_PLUS_1: 22,
  CRITICAL_RANGE: 23,
  CRITICAL_MULTIPLIER: 24,
  THROWN: 25,
  FINESSE: 26,
  DAMAGED: 27,
  GRAZE: 28,
  LOADING: 29,
  KNOCKBACK: 30,
  WOUNDING: 31,
  SLOW: 32,
  TOPPLE: 33,
  EXPOSE: 34,
  CHARGING: 35,
  HIDDEN: 36,
  AMMUNITION: 37,
  BLEED: 38,
  SHIELD_AMOUNT: 39,
  SHIELD_DAMAGE: 40,
  REACH: 41,
  MOUNTED: 42,
  VERSATILE: 43,
  CLEAVE: 44,
  INTERCHANGEABLE: 45,
  BLOCK: 46,
  QUICK: 47,
  PULL: 48,
} as const;

// =============================================================================
// CREATURE FEAT IDS
// =============================================================================

export const CREATURE_FEAT_IDS = {
  UNCANNY_DODGE: 1,
  RESISTANCE: 2,
  IMMUNITY: 3,
  WEAKNESS: 4,
  PACK_TACTICS: 5,
  FLYING: 6,
  FLYING_II: 7,
  BURROW: 8,
  BURROW_II: 9,
  DARKVISION: 10,
  DARKVISION_II: 11,
  DARKVISION_III: 12,
  BLINDSENSE: 13,
  BLINDSENSE_II: 14,
  BLINDSENSE_III: 15,
  BLINDSENSE_IV: 16,
  AMPHIBIOUS: 17,
  BOUNDING: 18,
  JUMP: 19,
  JUMP_II: 20,
  JUMP_III: 21,
  SLOW_WALKER: 22,
  REGIONAL_REVIVAL: 23,
  ALL_SURFACE_CLIMBER: 24,
  SUN_SICKNESS: 25,
  SUN_SICKNESS_II: 26,
  TELEPATHY: 27,
  TELEPATHY_II: 28,
  COMPRESSION: 29,
  WATERBREATHING: 30,
  UNFLANKABLE: 31,
  MIMIC: 32,
  WATER_MOVEMENT: 33,
  CONDITION_IMMUNITY: 34,
  UNRESTRAINED_MOVEMENT: 35,
  SPEEDY: 36,
  SPEEDY_II: 37,
  SPEEDY_III: 38,
  SLOW: 39,
  SLOW_II: 40,
  SLOW_III: 41,
  RESOURCES: 42,
  RESOURCES_II: 43,
  HOVER: 44,
  TELEPATHICALLY_INTUNE: 45,
} as const;

// Mechanical creature feats that are auto-added based on UI selections
// These should be hidden from manual feat selection
export const MECHANICAL_CREATURE_FEAT_IDS: Set<number> = new Set([
  CREATURE_FEAT_IDS.RESISTANCE,
  CREATURE_FEAT_IDS.IMMUNITY,
  CREATURE_FEAT_IDS.WEAKNESS,
  CREATURE_FEAT_IDS.CONDITION_IMMUNITY,
  // Senses - auto-added based on senses selection
  CREATURE_FEAT_IDS.DARKVISION,
  CREATURE_FEAT_IDS.DARKVISION_II,
  CREATURE_FEAT_IDS.DARKVISION_III,
  CREATURE_FEAT_IDS.BLINDSENSE,
  CREATURE_FEAT_IDS.BLINDSENSE_II,
  CREATURE_FEAT_IDS.BLINDSENSE_III,
  CREATURE_FEAT_IDS.BLINDSENSE_IV,
  // Movement - auto-added based on movement selection
  CREATURE_FEAT_IDS.FLYING,
  CREATURE_FEAT_IDS.FLYING_II,
  CREATURE_FEAT_IDS.BURROW,
  CREATURE_FEAT_IDS.BURROW_II,
  CREATURE_FEAT_IDS.AMPHIBIOUS,
  CREATURE_FEAT_IDS.WATERBREATHING,
  CREATURE_FEAT_IDS.WATER_MOVEMENT,
  CREATURE_FEAT_IDS.ALL_SURFACE_CLIMBER,
  CREATURE_FEAT_IDS.BOUNDING,
  CREATURE_FEAT_IDS.JUMP,
  CREATURE_FEAT_IDS.JUMP_II,
  CREATURE_FEAT_IDS.JUMP_III,
  CREATURE_FEAT_IDS.SLOW_WALKER,
  CREATURE_FEAT_IDS.COMPRESSION,
  CREATURE_FEAT_IDS.UNRESTRAINED_MOVEMENT,
  CREATURE_FEAT_IDS.SPEEDY,
  CREATURE_FEAT_IDS.SPEEDY_II,
  CREATURE_FEAT_IDS.SPEEDY_III,
  CREATURE_FEAT_IDS.SLOW,
  CREATURE_FEAT_IDS.SLOW_II,
  CREATURE_FEAT_IDS.SLOW_III,
  CREATURE_FEAT_IDS.HOVER,
  CREATURE_FEAT_IDS.TELEPATHY,
  CREATURE_FEAT_IDS.TELEPATHY_II,
  CREATURE_FEAT_IDS.TELEPATHICALLY_INTUNE,
]);

// General property IDs excluded from selectable property iterations
export const GENERAL_PROPERTY_IDS: Set<number> = new Set([
  PROPERTY_IDS.SHIELD_BASE,
  PROPERTY_IDS.ARMOR_BASE,
  PROPERTY_IDS.RANGE,
  PROPERTY_IDS.TWO_HANDED,
  PROPERTY_IDS.SPLIT_DAMAGE_DICE,
  PROPERTY_IDS.DAMAGE_REDUCTION,
  PROPERTY_IDS.WEAPON_DAMAGE,
  PROPERTY_IDS.AGILITY_REDUCTION,
  PROPERTY_IDS.WEAPON_STRENGTH_REQUIREMENT,
  PROPERTY_IDS.WEAPON_AGILITY_REQUIREMENT,
  PROPERTY_IDS.WEAPON_VITALITY_REQUIREMENT,
  PROPERTY_IDS.WEAPON_ACUITY_REQUIREMENT,
  PROPERTY_IDS.WEAPON_INTELLIGENCE_REQUIREMENT,
  PROPERTY_IDS.WEAPON_CHARISMA_REQUIREMENT,
  PROPERTY_IDS.ARMOR_STRENGTH_REQUIREMENT,
  PROPERTY_IDS.ARMOR_AGILITY_REQUIREMENT,
  PROPERTY_IDS.ARMOR_VITALITY_REQUIREMENT,
]);

// General property names for backwards compatibility
export const GENERAL_PROPERTY_NAMES = new Set([
  'Shield Base', 'Armor Base', 'Range', 'Two-Handed',
  'Split Damage Dice', 'Damage Reduction', 'Weapon Damage',
  'Agility Reduction',
  'Weapon Strength Requirement', 'Weapon Agility Requirement', 'Weapon Vitality Requirement',
  'Weapon Acuity Requirement', 'Weapon Intelligence Requirement', 'Weapon Charisma Requirement',
  'Armor Strength Requirement', 'Armor Agility Requirement', 'Armor Vitality Requirement',
]);

// =============================================================================
// Database Lookup Utilities
// =============================================================================

export interface HasIdAndName {
  id?: string | number;
  name?: string;
}

/**
 * Find an entity in a database by ID or name.
 * Tries ID first, then falls back to name for backwards compatibility.
 */
export function findByIdOrName<T extends HasIdAndName>(
  db: T[],
  ref: { id?: number | string; name?: string }
): T | undefined {
  if (!Array.isArray(db) || !ref) return undefined;

  // First try by ID
  if (ref.id !== undefined && ref.id !== null) {
    const byId = db.find((item) => {
      const itemId = typeof item.id === 'string' ? parseInt(item.id, 10) : item.id;
      const refId = typeof ref.id === 'string' ? parseInt(ref.id, 10) : ref.id;
      return itemId === refId;
    });
    if (byId) return byId;
  }

  // Fallback to name for backwards compatibility
  if (ref.name) {
    return db.find((item) => item.name === ref.name);
  }

  return undefined;
}

/**
 * Find an entity by ID or name string value.
 * Handles both numeric IDs and string names.
 */
export function findByIdOrNameValue<T extends HasIdAndName>(
  db: T[],
  idOrName: number | string
): T | undefined {
  if (!Array.isArray(db) || idOrName === undefined || idOrName === null) {
    return undefined;
  }

  // If it's a number, treat as ID
  if (typeof idOrName === 'number') {
    return db.find((item) => {
      const itemId = typeof item.id === 'string' ? parseInt(item.id, 10) : item.id;
      return itemId === idOrName;
    });
  }

  // If it's a string that looks like a number, try as ID first
  if (typeof idOrName === 'string') {
    const numId = parseInt(idOrName, 10);
    if (!isNaN(numId)) {
      const byId = db.find((item) => {
        const itemId = typeof item.id === 'string' ? parseInt(item.id, 10) : item.id;
        return itemId === numId;
      });
      if (byId) return byId;
    }
    // Fallback to name match
    return db.find((item) => item.name === idOrName);
  }

  return undefined;
}

/**
 * Normalize a reference to always have an ID.
 * For backwards compatibility with old saves that only have names.
 */
export function normalizeRef<T extends HasIdAndName>(
  db: T[],
  ref: HasIdAndName
): HasIdAndName {
  if (!ref) return ref;

  const found = findByIdOrName(db, ref);
  if (found && found.id !== undefined && found.name) {
    return { ...ref, id: found.id, name: found.name };
  }

  return ref;
}

/**
 * Convert a parts/properties array to use IDs instead of names.
 */
export function normalizeRefsArray<T extends HasIdAndName>(
  items: HasIdAndName[],
  db: T[]
): HasIdAndName[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) => normalizeRef(db, item));
}
