/**
 * RealmsRPG ID Constants
 * ======================
 * Central mapping of database entity IDs.
 * These constants should be used instead of hardcoded names when looking up
 * parts, properties, feats, skills, traits, species, and items from the database.
 * 
 * The database has been migrated from using sanitized names as IDs to using
 * numerical IDs. This file provides the mapping for backwards compatibility
 * and consistent lookups.
 */

// =============================================================================
// PARTS (Power & Technique Parts)
// =============================================================================

export const PART_IDS = {
    // Damage Types
    TRUE_DAMAGE: 1,
    ADDITIONAL_DAMAGE: 6,
    SPLIT_DAMAGE_DICE: 5,
    
    // Action Modifiers
    REACTION: 2,
    LONG_ACTION: 3,
    QUICK_OR_FREE_ACTION: 4,
    
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
    SITUATIONAL_EXPLOIT: 22,
    UPWARD_THRUST: 23,
    STRENGTH_KNOCK_PRONE: 24,
    PIN: 25,
    GRAPPLE_TECHNIQUE: 26,
    CRUSH: 27,
    BODY_BLOCK: 28,
    RESTRAIN: 29,
    TAKEDOWN: 30,
    THROW_CREATURE: 31,
    THROW_WEAPON: 32,
    LEAP: 33,
    REDUCE_MULTIPLE_ACTION_PENALTY: 34,
    DEMOLITION: 35,
    SLAM: 36,
    HEAD_BUTT: 37,
    WEAKEN_TECHNIQUE: 38,
    MAKE_VULNERABLE: 39,
    BRACE: 40,
    PARRY: 41,
    UNARMED_HITS: 42,
    AGILE_KNOCK_PRONE: 43,
    CHARGE: 44,
    QUICK_STRIKE_SHOT: 45,
    DISARM: 46,
    BREAK_SIGHT: 47,
    DISENGAGE: 48,
    CATCH_RANGED_ATTACK: 49,
    CATCH_MELEE_ATTACK: 50,
    HIDE: 51,
    EVADE: 52,
    MANEUVER: 53,
    SIDE_STEP: 54,
    SWITCH: 55,
    FOCUS_HIT: 56,
    RUSH: 57,
    VITAL_POINT: 58,
    FEINT: 59,
    GOAD: 60,
    MENACE: 61,
    RALLY: 62,
    DEFEND: 63,
    RESILIENCE: 64,
    CLASH: 65,
    INFILTRATE: 66,
    HIDDEN_ATTACK: 67,
    PENETRATION: 68,
    PINNING_WEAPON: 69,
    COMMAND: 70,
    BUCK_SHOT: 71,
    SPREAD_SHOT: 72,
    LONG_SHOT: 73,
    VOLLEY: 74,
    PIERCING: 75,
    CURVED_SHOT: 76,
    FIRST_BLOOD: 77,
    SPLITTING_SHOT: 78,
    
    // Power-specific Parts
    ATTACK_POTENCY_INCREASE: 79,
    PERSONAL_POWER_LINGER: 80,
    POWER_LONG_ACTION: 81,
    POWER_REACTION: 82,
    POWER_QUICK_OR_FREE_ACTION: 83,
    RITE: 84,
    LONG_RITE: 85,
    TRIGGER_ON_CONDITION: 86,
    DELAYED_EFFECT: 87,
    
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
    
    // Detection Parts
    DETECT_CREATURE_TYPE: 90,
    DETECT_POWER: 91,
    DETECT_DAMAGE: 92,
    IDENTIFY: 93,
    OMEN: 94,
    DETECT_TRAPS: 95,
    LOCATE_ANIMALS: 96,
    LOCATE_PLANTS: 97,
    LOCATE_OBJECT: 98,
    LOCATE_CREATURE: 99,
    LOCATE_CREATURE_ON_OVERCOME: 100,
    DETECT_INVISIBILITY: 101,
    SEE_THROUGH_ILLUSION: 102,
    SENSOR: 103,
    SCRY: 104,
    FIND_PATH: 105,
    
    // Creation/Summoning Parts
    ENRICH_PLANTLIFE: 106,
    LIQUID_WALK: 107,
    CREATE: 108,
    SPEAK_WITH_THE_DEAD: 109,
    HEALTH_SUMMON: 110,
    POWER_SUMMON: 111,
    NEUTRAL_SUMMON: 112,
    RAISE_UNDEAD: 113,
    WEAPON_SUMMON: 114,
    SUMMON_OR_BEAST_SENSES: 115,
    RESURRECTION: 116,
    TRUE_RESURRECTION: 117,
    WARD_FROM_DEATH: 118,
    IRREDUCIBLE_MAX_HEALTH: 119,
    STASIS: 120,
    FEIGN_DEATH: 121,
    SUPPRESS_HEALING: 122,
    PERMANENT_DAMAGE: 123,
    
    // Buff/Enhancement Parts
    SPEED_INCREASE: 124,
    ADAPTING: 125,
    ABILITY_INCREASE: 126,
    JUMP: 127,
    SKILL_SHARPEN: 128,
    DEBUFFING: 129,
    LEAVE_NO_TRACKS: 130,
    RESTORE: 131,
    GREATER_RESTORE: 132,
    ABILITY_RESTORE: 133,
    ENHANCEMENT: 134,
    DEAFEN: 135,
    BANE: 136,
    WEAKENED_STRIKES: 137,
    BATTLE_DISABLE: 138,
    SHIELD: 139,
    WEAKEN: 140,
    EXPOSE_VITALS: 141,
    WEAPON_DAMAGE_BOOST: 142,
    PURIFY: 143,
    DARKVISION: 144,
    ENLARGE: 145,
    SHRINK: 146,
    GAS_FORM: 147,
    GUIDED: 148,
    INVISIBLE_POWER: 149,
    SUBTLE_POWER_USE: 150,
    CAUSE_TO_LOSE_FOCUS: 151,
    DOUSING: 152,
    FLAMMABLE: 153,
    RELOCATE_POWER: 154,
    
    // Interaction Parts
    INTERACTION: 155,
    ABILITY_ROLL: 156,
    EVADE_ACTION: 157,
    BRACE_ACTION: 158,
    FOCUS_ACTION: 159,
    SEARCH_DETECT_ACTION: 160,
    STEALTH_HIDE_ACTION: 161,
    COMBINATION_ATTACK: 162,
    HELP_REACTION: 163,
    DEFEND_ACTION: 164,
    
    // Illusion Parts
    OUTER_ILLUSION: 165,
    MASSIVE_OUTER_ILLUSION: 166,
    INNER_ILLUSION: 167,
    INVISIBILITY: 168,
    COMBAT_INVISIBILITY: 169,
    DISGUISE: 170,
    BLIND: 171,
    SILENCE: 172,
    SCRY_TIME: 173,
    READ_MIND: 174,
    DARKNESS: 175,
    FOG: 176,
    MODIFY_MEMORIES: 177,
    ILLUSIONED_POWER: 178,
    PROGRAMMED_ILLUSION: 179,
    DREAM: 180,
    
    // Mind/Control Parts
    ENTHRALL: 181,
    COMPELLED_DUEL: 182,
    DISAGREEABLE: 183,
    DISORIENT: 184,
    NONDETECTION: 185,
    BODY_SWAP: 186,
    TAKE_OVER: 187,
    COMPELLING_SIGHT: 188,
    SUGGEST: 189,
    COMPELLED_MOVEMENT: 190,
    MIND_BREAK: 191,
    SHIFT_FOCUS: 192,
    CURSE: 193,
    COMMUNICATE: 194,
    DE_MOTIVATE: 195,
    ESCALATE: 196,
    VERTIGO: 197,
    AGGRAVATE: 198,
    FRIENDS: 199,
    INDIFFERENCE: 200,
    CHARM: 201,
    
    // Immunity Parts
    IMMUNE_TO_TAKE_OVER: 202,
    IMMUNE_TO_FRIGHTENED: 203,
    IMMUNE_TO_CHARMED: 204,
    FRIGHTEN: 205,
    MARK_CREATURE: 206,
    COMMAND_MOVEMENT: 207,
    
    // Defense Parts
    WALL: 208,
    BLOCK: 209,
    POWER_ARMOR: 210,
    REFLECT: 211,
    DEFLECT: 212,
    COUNTER: 213,
    ABSORB: 214,
    NEGATE: 215,
    DISPEL: 216,
    PERMANENT_DISPEL: 217,
    BLESSED: 218,
    RESISTANCE: 219,
    MINOR_RESISTANCE: 220,
    EVASION_BUFF: 221,
    WARD: 222,
    SANCTUARY: 223,
    CONDITION_RESISTANCE: 224,
    CONDITION_IMMUNITY: 225,
    CONNECTED_CREATURES: 226,
    IMPASSIBLE_AURA: 227,
    POWER_RESISTANCE: 228,
    POWER_DAMAGE_RESISTANCE: 229,
    FALL_RESISTANCE: 230,
    
    // True Damage Types
    TRUE_MAGIC_DAMAGE: 239,
    TRUE_LIGHT_DAMAGE: 240,
    TRUE_PHYSICAL_DAMAGE: 241,
    TRUE_ELEMENTAL_DAMAGE: 242,
    TRUE_POISON_OR_NECROTIC_DAMAGE: 243,
    TRUE_SONIC_DAMAGE: 244,
    TRUE_SPIRITUAL_DAMAGE: 245,
    TRUE_PSYCHIC_DAMAGE: 246,
    
    // Misc Power Parts
    CONTROLLED_DAMAGE: 247,
    LONG_LINGER_DAMAGE: 248,
    SIPHON: 249,
    DAMAGE_SIPHON: 250,
    POWER_INFUSED_STRIKE: 251,
    MEND: 252,
    
    // Minor Manipulation Parts
    MINORLY_MANIPULATE_AIR: 253,
    MINORLY_MANIPULATE_EARTH: 254,
    MINORLY_MANIPULATE_WATER: 255,
    MINORLY_MANIPULATE_FIRE: 256,
    MINORLY_MANIPULATE_ELEMENTS: 257,
    TREMORS: 258,
    INVISIBLE_FORCE: 259,
    DETACHED_SOUND: 260,
    BOOMING_VOICE: 261,
    ALTERED_EYES: 262,
    FLAVOR: 263,
    FIRE_MANIPULATION: 264,
    PLANT_MANIPULATION: 265,
    CHILL_OR_WARM: 266,
    MARK: 267,
    CLEAN_OR_SOIL: 268,
    SENSORY_EFFECT: 269,
    TINY_CREATION: 270,
    WEATHER_SENSE: 271,
    UNDERSTAND_LANGUAGE: 272,
    TONGUES: 273,
    LIGHT: 274,
    THOUGHT: 275,
    DISTANT_MESSAGE: 276,
    BREATHE: 277,
    PING: 278,
    AUDIO: 279,
    CREATE_FOOD: 280,
    CREATE_WATER: 281,
    DESTROY_WATER: 282,
    CREATE_OBJECT: 283,
    CONTACT_DIVINE: 284,
    COMMUNE_WITH_DIVINE: 285,
    COMMUNE_WITH_NATURE: 286,
    CONTACT_OTHER_REALM: 287,
    LEGEND_KNOWLEDGE: 288,
    TRUE_TELEPATHY: 289,
    FORESIGHT: 290,
    NOISY: 291,
    DISINTEGRATE: 292,
    PASSAGE: 293,
    
    // Standard Damage Types
    MAGIC_DAMAGE: 294,
    LIGHT_DAMAGE: 295,
    PHYSICAL_DAMAGE: 296,
    ELEMENTAL_DAMAGE: 297,
    POISON_OR_NECROTIC_DAMAGE: 298,
    SONIC_DAMAGE: 299,
    SPIRITUAL_DAMAGE: 300,
    PSYCHIC_DAMAGE: 301,
    
    // Duration Parts
    DURATION_ENDS_ON_ACTIVATION: 302,
    NO_HARM_OR_ADAPTATION_FOR_DURATION: 303,
    FOCUS_FOR_DURATION: 304,
    SUSTAIN_FOR_DURATION: 305,
    DURATION_PERMANENT: 306,
    DURATION_DAYS: 375,
    DURATION_HOUR: 376,
    DURATION_MINUTE: 377,
    DURATION_ROUND: 378,
    
    // Healing Parts
    HEAL: 307,
    TRUE_HEAL: 308,
    OVERHEAL: 309,
    TRUE_OVERHEAL: 310,
    MAJOR_HEAL: 311,
    MASSIVE_HEAL: 312,
    HEALING_BOOST: 313,
    DEATH_DEFYING: 314,
    TERMINAL_RECOVERY: 315,
    STABILIZE: 316,
    REGENERATE: 317,
    REVIVE: 318,
    RESTORE_TO_LIFE: 319,
    FORM_LIFE: 320,
    
    // Movement/Control Parts
    BECOME_WIND: 321,
    MANIPULATE_EARTH: 322,
    KNOCK_PRONE: 323,
    CONTROLLING_SUMMON: 324,
    ESCAPE: 325,
    CREATE_DIFFICULT_TERRAIN: 326,
    IMMUNE_TO_DIFFICULT_TERRAIN: 327,
    SCALED_SLOWING: 328,
    SLOW_POWER: 329,
    UNLOCK: 330,
    LOCK: 331,
    TELEPORT: 332,
    MULTI_TELEPORT: 333,
    ADVANCED_TELEPORT: 334,
    LONG_DISTANCE_TELEPORT: 335,
    SWAP: 336,
    KNOCKBACK_POWER: 337,
    PROPEL: 338,
    DAZE_POWER: 339,
    RESTRAINED: 340,
    STUN_POWER: 341,
    GRAPPLE: 342,
    CONTROL: 343,
    SUSPEND: 344,
    CIRCLE: 345,
    FORBIDDANCE: 346,
    FLY: 347,
    CLIMBING: 348,
    VANISH_FROM_REALM: 349,
    MERGE_WITH_MATERIAL: 350,
    REMOVE_ACTION_POINTS: 351,
    FLOOD: 352,
    PART_LIQUID: 353,
    REDIRECT_LIQUID: 354,
    CONTROL_WEATHER: 355,
    MINI_DEMIREALM: 356,
    DEMI_REALM: 357,
    REALMSHIFT: 358,
    NEGATE_GRAVITY: 359,
    INVERT_OR_REDIRECT_GRAVITY: 360,
    INCREASE_GRAVITY: 361,
    GRAVITY_CENTER: 362,
    FREEZE_TIME: 363,
    REWIND_TIME: 364,
    TERRAFORM: 365,
    GROWTH: 366,
    EMPOWERED_PLANT: 367,
    LONG_LINGER_ON_SURFACE: 368,
    ADD_WEAPON_TO_POWER: 369,
    DESTRUCTION: 370,
    RANDOMIZE: 371,
    HALF_DAMAGE_ON_FAIL: 372,
    CHOOSE_AFFECTED_TARGETS: 373,
    ACTIVATE_ON_WEAPON_HIT: 374,
    
    // Mechanic Modifier Parts
    USE_POWER_AGAIN_ON_OVERCOME: 379,
    STILL_AFFECTS_ON_OVERCOME: 380,
    DIFFERENT_EFFECTS_EACH_ROUND: 381,
    DECREASE_MULTIPLE_ACTION_PENALTY: 382,
    POWER_RANGE: 383,
    REQUIRES_MATERIALS: 384,
    ENDS_ON_EFFECT_DAMAGE_THRESHOLD: 385,
    DEADLY_CONTINGENCY: 386,
    IMMUNE_TO_EFFECT_ON_OVERCOME: 387,
    REVERSE_EFFECTS: 388,
    STIPULATION: 389,
    NOT_ACTIVATED_UNTIL_TARGET_MOVES: 390,
    ONE_ROUND_ADAPTATION: 391,
    TARGETS_ADDITIONAL_DEFENSE: 392,
    PROXIMITY_REQUIREMENT: 393,
    MERGED_POTENCY: 394,
    TRANSFERRED_EFFECT: 395,
    TARGETS_POSSESSION: 396,
    REQUIRES_SKILL_ROLL: 397,
    WISH: 398,
    DISPEL_IMMUNE: 399,
    PASSWORD: 400,
    CHOICE: 401,
    SPLIT_POWER_PARTS_INTO_GROUPS: 402,
    NO_SIGHTLINE_REQUIRED: 403,
    MULTIPLE_OVERCOMES_REQUIRED: 404,
    SWIM: 405,
    POLYMORPH: 406,
    SHAPE_SHIFT: 407,
    MATERIAL_SHAPE: 408,
    TIMELESS: 409,
    SUSTAIN_BODY: 410,
    SPECIFIED_EXCEPTIONS: 411,
    SPECIALIZED: 412,
    ALTERNATE_TARGETED_DEFENSE: 413
};

// Reverse lookup: Get part name by ID
export const PART_NAMES = Object.fromEntries(
    Object.entries(PART_IDS).map(([name, id]) => [id, name])
);

// =============================================================================
// PROPERTIES (Item Properties)
// =============================================================================

export const PROPERTY_IDS = {
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
    PULL: 48
};

// Reverse lookup: Get property name by ID
export const PROPERTY_NAMES = Object.fromEntries(
    Object.entries(PROPERTY_IDS).map(([name, id]) => [id, name])
);

// =============================================================================
// SKILLS
// =============================================================================

export const SKILL_IDS = {
    ACROBATICS: 1,
    BEASTCRAFT: 2,
    ACT: 3,
    ALCHEMY: 4,
    ANALYZE: 5,
    APPRAISE: 6,
    ARCANA: 7,
    ARTISTRY: 8,
    ATHLETICS: 9,
    BOTANY: 10,
    CHARM: 11,
    COOK: 12,
    CRAFT: 13,
    DECEIVE: 14,
    DEDUCE: 15,
    CALLIGRAPHY: 16,
    GLASSBLOWING: 17,
    HAGGLE: 18,
    HARVEST: 19,
    HIDE: 20,
    HISTORY: 21,
    INSIGHT: 22,
    ENTERTAIN: 23,
    INTIMIDATE: 24,
    INVESTIGATE: 25,
    JEWELCRAFT: 26,
    LEATHERWORK: 27,
    LOCKPICK: 28,
    LORE: 29,
    MEDICINE: 30,
    MOTIVATE: 31,
    NATURE: 32,
    NAVIGATE: 33,
    PERCEIVE: 34,
    PERFORM: 35,
    PERSUADE: 36,
    PICKPOCKET: 37,
    SUPPLICATE: 38,
    SEARCH: 39,
    SLEIGHT_OF_HAND: 40,
    SMITH: 41,
    STEALTH: 42,
    TAILOR: 43,
    TINKER: 44,
    TAME: 45,
    TAUNT: 46,
    TRACK: 47,
    TRIAGE: 48,
    VEHICLE: 49,
    WOODWORKING: 50
};

// Reverse lookup: Get skill name by ID
export const SKILL_NAMES = Object.fromEntries(
    Object.entries(SKILL_IDS).map(([name, id]) => [id, name])
);

// =============================================================================
// SPECIES
// =============================================================================

export const SPECIES_IDS = {
    DARKIN: 1,
    FUNGAIA: 2,
    HALFLING: 3,
    HUMAN: 4,
    ELF: 5,
    ORC: 6,
    DWARF: 7,
    MOUSEKIN: 8,
    GNOLL: 9,
    BATFOLK: 10,
    POPPET: 11,
    DRAGONBORN: 12,
    DEMIBOURN: 13,
    TABAXI: 14,
    WRAITH: 15,
    LIZARDFOLK: 16,
    STALRISAR: 17,
    PONY: 18
};

// Reverse lookup: Get species name by ID
export const SPECIES_NAMES = Object.fromEntries(
    Object.entries(SPECIES_IDS).map(([name, id]) => [id, name])
);

// =============================================================================
// ITEMS
// =============================================================================

export const ITEM_IDS = {
    RATIONS: 1,
    BAG: 2,
    BANDAGE: 3,
    TORCH: 4,
    HEALTH_POTION: 5,
    ENERGY_POTION: 6,
    BED_ROLL: 7,
    FLINT_AND_STEEL_FIRE_STARTER: 8,
    ROPE: 9,
    GRAPPLE_ROPE: 10
};

// Reverse lookup: Get item name by ID
export const ITEM_NAMES = Object.fromEntries(
    Object.entries(ITEM_IDS).map(([name, id]) => [id, name])
);

// =============================================================================
// CREATURE FEATS
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
    HARD_TO_STAND_UP: 46,
    UNDETECTABLE: 47,
    MUTE: 48,
    FIRST_STRIKE: 49,
    QUICK_HIDE: 50,
    TURNS_TO_DUST: 51,
    BEAST_OF_BURDEN: 52,
    CLAWS_AND_FANGS: 53,
    REGENERATIVE: 54,
    REGENERATIVE_II: 55,
    REGENERATIVE_III: 56,
    REGENERATIVE_IV: 57,
    ELEMENTAL_AFFINITY: 58,
    ELEMENTAL_AFFINITY_II: 59,
    ELEMENTAL_AFFINITY_III: 60,
    INSTINCT: 61,
    INSTINCT_II: 62,
    JAWS: 63,
    LYCANTHROPE: 64,
    LYCANTHROPE_II: 65,
    LYCANTHROPE_III: 66,
    FEAR_RESPONSE: 67,
    MINDLESS_RAGE: 68,
    CHAMPION: 69,
    CHAMPION_II: 70,
    CHAMPION_III: 71,
    CHAMPION_IV: 72,
    CHAMPION_V: 73,
    CHAMPION_VI: 74,
    CANT_SPEAK: 75,
    RETURNING_WEAPONS: 76,
    POWER_RESISTANT: 77,
    POWER_RESISTANT_II: 78,
    POWER_RESISTANT_III: 79,
    GRAPPLE_ATTACKS: 80,
    NO_VISION: 81,
    TELEPORT: 82,
    TELEPORT_II: 83,
    TELEPORT_III: 84,
    LARGE_ATTACKER: 85,
    CHARGER: 86,
    BLOOD_RAGE: 87,
    BLOOD_RAGE_II: 88,
    BLOOD_RAGE_III: 89,
    BLOOD_RAGE_IV: 90,
    LEAPER: 91,
    CONSTRICTOR: 92,
    CONSTRICTOR_II: 93,
    CONSTRICTOR_III: 94,
    CONSTRICTOR_IV: 95,
    TIGHT_GRAPPLE: 96,
    TIGHT_GRAPPLE_II: 97
};

// Reverse lookup: Get creature feat name by ID
export const CREATURE_FEAT_NAMES = Object.fromEntries(
    Object.entries(CREATURE_FEAT_IDS).map(([name, id]) => [id, name])
);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Find an entity by ID in a database array.
 * @param {Array} db - The database array to search
 * @param {number} id - The ID to find
 * @returns {Object|undefined} The found entity or undefined
 */
export function findById(db, id) {
    if (!Array.isArray(db) || id === undefined || id === null) return undefined;
    return db.find(item => item.id === id);
}

/**
 * Find an entity by ID or name (for backwards compatibility).
 * Prefers ID lookup, falls back to name if ID not found.
 * @param {Array} db - The database array to search
 * @param {Object} ref - Object with either id or name property
 * @returns {Object|undefined} The found entity or undefined
 */
export function findByIdOrName(db, ref) {
    if (!Array.isArray(db) || !ref) return undefined;
    
    // First try by ID
    if (ref.id !== undefined && ref.id !== null) {
        const byId = db.find(item => item.id === ref.id);
        if (byId) return byId;
    }
    
    // Fallback to name for backwards compatibility
    if (ref.name) {
        return db.find(item => item.name === ref.name);
    }
    
    return undefined;
}

/**
 * Find an entity by ID or name string (for backwards compatibility).
 * @param {Array} db - The database array to search
 * @param {number|string} idOrName - Either a numeric ID or a string name
 * @returns {Object|undefined} The found entity or undefined
 */
export function findByIdOrNameValue(db, idOrName) {
    if (!Array.isArray(db) || idOrName === undefined || idOrName === null) return undefined;
    
    // If it's a number, treat as ID
    if (typeof idOrName === 'number') {
        return db.find(item => item.id === idOrName);
    }
    
    // If it's a string that looks like a number, try as ID first
    if (typeof idOrName === 'string') {
        const numId = parseInt(idOrName, 10);
        if (!isNaN(numId)) {
            const byId = db.find(item => item.id === numId);
            if (byId) return byId;
        }
        // Fallback to name match
        return db.find(item => item.name === idOrName);
    }
    
    return undefined;
}

/**
 * Normalize a saved reference to always have an id.
 * For backwards compatibility with old saves that only have names.
 * @param {Array} db - The database array to search
 * @param {Object} ref - Object with either id or name property
 * @returns {Object} Object with id property (and name for debugging)
 */
export function normalizeRef(db, ref) {
    if (!ref) return ref;
    
    const found = findByIdOrName(db, ref);
    if (found) {
        return { ...ref, id: found.id, name: found.name };
    }
    
    // Return original if not found (shouldn't happen with valid data)
    return ref;
}

/**
 * Convert a parts/properties array to use IDs instead of names.
 * Maintains backwards compatibility by keeping both id and name.
 * @param {Array} items - Array of items with name or id properties
 * @param {Array} db - The database array to lookup IDs
 * @returns {Array} Array with normalized items containing both id and name
 */
export function normalizeRefsArray(items, db) {
    if (!Array.isArray(items)) return items;
    return items.map(item => normalizeRef(db, item));
}
