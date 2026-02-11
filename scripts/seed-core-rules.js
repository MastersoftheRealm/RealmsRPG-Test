#!/usr/bin/env node
/**
 * Seed Core Rules into Supabase
 * ==============================
 * Populates the core_rules table with all configurable game rules.
 * Each row is a category (e.g., PROGRESSION_PLAYER, CONDITIONS, SIZES).
 * 
 * Run: node scripts/seed-core-rules.js
 * 
 * This script is idempotent — it upserts all rows safely.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// =============================================================================
// CORE RULES DATA — sourced from constants.ts, creator-constants.ts, formulas.ts,
// GAME_RULES.md, and core_rulebook_extracted.txt
// =============================================================================

const CORE_RULES = {
  // ─── PLAYER PROGRESSION ──────────────────────────────────────────────────
  PROGRESSION_PLAYER: {
    baseAbilityPoints: 7,
    abilityPointsEveryNLevels: 3,       // +1 at levels 3, 6, 9, 12...
    abilityPointsPerIncrease: 1,
    skillPointsPerLevel: 3,             // 3 at L1, 6 at L2, etc.
    baseHitEnergyPool: 18,              // Points to divide between HP and EN at L1
    hitEnergyPerLevel: 12,              // Additional pool points per level
    baseProficiency: 2,
    proficiencyEveryNLevels: 5,         // +1 at levels 5, 10, 15...
    proficiencyPerIncrease: 1,
    baseTrainingPoints: 22,
    tpPerLevelMultiplier: 2,            // TP formula: 22 + ability + (2 + ability) * (level - 1)
    baseHealth: 8,                      // Health floor: 8 + healthAbility
    xpToLevelFormula: 'level * 4',
    startingCurrency: 200,
    characterFeatsPerLevel: 1,          // Always 1 per level
  },

  // ─── CREATURE PROGRESSION ────────────────────────────────────────────────
  PROGRESSION_CREATURE: {
    baseAbilityPoints: 7,
    abilityPointsEveryNLevels: 3,
    skillPointsAtLevel1: 5,
    skillPointsPerLevel: 3,             // 5 at L1, 8 at L2, 11 at L3
    baseHitEnergyPool: 26,
    hitEnergyPerLevel: 12,
    baseProficiency: 2,
    proficiencyEveryNLevels: 5,
    baseTrainingPoints: 22,             // Same as characters
    tpPerLevelMultiplier: 2,            // Same as characters
    baseFeatPoints: 4,
    featPointsPerLevel: 1,
    baseCurrency: 200,
    currencyGrowthRate: 1.45,
  },

  // ─── ABILITY RULES ───────────────────────────────────────────────────────
  ABILITY_RULES: {
    min: -2,
    maxStarting: 3,
    maxAbsoluteCharacter: 10,           // Hard cap for player characters
    maxAbsoluteCreature: 20,            // Hard cap for creatures
    costIncreaseThreshold: 4,           // Cost doubles at 4+ (4→5 costs 2)
    normalCost: 1,
    increasedCost: 2,
    maxTotalNegative: -3,               // Custom allocation: total negatives ≤ -3
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

  // ─── ARCHETYPES ──────────────────────────────────────────────────────────
  ARCHETYPES: {
    types: ['power', 'powered-martial', 'martial'],
    configs: {
      power: {
        featLimit: 0,
        armamentMax: 3,
        innateEnergy: 16,
        innateThreshold: 8,
        innatePools: 2,
        proficiency: { martial: 0, power: 2 },
        trainingPointBonus: 0,
      },
      'powered-martial': {
        featLimit: 1,
        armamentMax: 8,
        innateEnergy: 6,
        innateThreshold: 6,
        innatePools: 1,
        proficiency: { martial: 1, power: 1 },
        trainingPointBonus: 0,
      },
      martial: {
        featLimit: 2,
        armamentMax: 12,
        innateEnergy: 0,
        innateThreshold: 0,
        innatePools: 0,
        proficiency: { martial: 2, power: 0 },
        trainingPointBonus: 0,
      },
    },
    // Martial bonus feats: +2 at L1, +1 every 3 levels from L4
    martialBonusFeatsBase: 2,
    martialBonusFeatsInterval: 3,
    martialBonusFeatsStartLevel: 4,
    // P-M milestone: every 3 levels from L4, choose innate or feat
    poweredMartialMilestoneInterval: 3,
    poweredMartialMilestoneStartLevel: 4,
    // Proficiency increase: every 5 levels
    proficiencyIncreaseInterval: 5,
    // Full progression tables
    powerProgression: [
      { level: 1, innateThreshold: 8, innateEnergy: 16, innatePools: 2, powerProf: 2 },
      { level: 2, innateThreshold: 8, innateEnergy: 16, innatePools: 2, powerProf: 2 },
      { level: 3, innateThreshold: 8, innateEnergy: 16, innatePools: 2, powerProf: 2 },
      { level: 4, innateThreshold: 9, innateEnergy: 27, innatePools: 3, powerProf: 2 },
      { level: 5, innateThreshold: 9, innateEnergy: 27, innatePools: 3, powerProf: 3 },
      { level: 6, innateThreshold: 9, innateEnergy: 27, innatePools: 3, powerProf: 3 },
      { level: 7, innateThreshold: 10, innateEnergy: 40, innatePools: 4, powerProf: 3 },
      { level: 8, innateThreshold: 10, innateEnergy: 40, innatePools: 4, powerProf: 3 },
      { level: 9, innateThreshold: 10, innateEnergy: 40, innatePools: 4, powerProf: 3 },
      { level: 10, innateThreshold: 11, innateEnergy: 55, innatePools: 5, powerProf: 4 },
      { level: 11, innateThreshold: 11, innateEnergy: 55, innatePools: 5, powerProf: 4 },
      { level: 12, innateThreshold: 11, innateEnergy: 55, innatePools: 5, powerProf: 4 },
      { level: 13, innateThreshold: 12, innateEnergy: 72, innatePools: 6, powerProf: 4 },
      { level: 14, innateThreshold: 12, innateEnergy: 72, innatePools: 6, powerProf: 4 },
      { level: 15, innateThreshold: 12, innateEnergy: 72, innatePools: 6, powerProf: 5 },
      { level: 16, innateThreshold: 13, innateEnergy: 91, innatePools: 7, powerProf: 5 },
      { level: 17, innateThreshold: 13, innateEnergy: 91, innatePools: 7, powerProf: 5 },
      { level: 18, innateThreshold: 13, innateEnergy: 91, innatePools: 7, powerProf: 5 },
      { level: 19, innateThreshold: 14, innateEnergy: 112, innatePools: 8, powerProf: 5 },
      { level: 20, innateThreshold: 14, innateEnergy: 112, innatePools: 8, powerProf: 6 },
    ],
    martialProgression: [
      { level: 1, bonusFeats: 2, totalFeats: 3, armamentProf: 12, martialProf: 2 },
      { level: 2, bonusFeats: 0, totalFeats: 4, armamentProf: 12, martialProf: 2 },
      { level: 3, bonusFeats: 0, totalFeats: 5, armamentProf: 12, martialProf: 2 },
      { level: 4, bonusFeats: 1, totalFeats: 7, armamentProf: 12, martialProf: 2 },
      { level: 5, bonusFeats: 0, totalFeats: 8, armamentProf: 15, martialProf: 3 },
      { level: 6, bonusFeats: 0, totalFeats: 9, armamentProf: 15, martialProf: 3 },
      { level: 7, bonusFeats: 1, totalFeats: 11, armamentProf: 15, martialProf: 3 },
      { level: 8, bonusFeats: 0, totalFeats: 12, armamentProf: 15, martialProf: 3 },
      { level: 9, bonusFeats: 0, totalFeats: 13, armamentProf: 15, martialProf: 3 },
      { level: 10, bonusFeats: 1, totalFeats: 15, armamentProf: 18, martialProf: 4 },
      { level: 11, bonusFeats: 0, totalFeats: 16, armamentProf: 18, martialProf: 4 },
      { level: 12, bonusFeats: 0, totalFeats: 17, armamentProf: 18, martialProf: 4 },
      { level: 13, bonusFeats: 1, totalFeats: 19, armamentProf: 18, martialProf: 4 },
      { level: 14, bonusFeats: 0, totalFeats: 20, armamentProf: 18, martialProf: 4 },
      { level: 15, bonusFeats: 0, totalFeats: 21, armamentProf: 21, martialProf: 5 },
      { level: 16, bonusFeats: 1, totalFeats: 23, armamentProf: 21, martialProf: 5 },
      { level: 17, bonusFeats: 0, totalFeats: 24, armamentProf: 21, martialProf: 5 },
      { level: 18, bonusFeats: 0, totalFeats: 25, armamentProf: 21, martialProf: 5 },
      { level: 19, bonusFeats: 1, totalFeats: 27, armamentProf: 21, martialProf: 5 },
      { level: 20, bonusFeats: 0, totalFeats: 28, armamentProf: 24, martialProf: 6 },
    ],
  },

  // ─── ARMAMENT PROFICIENCY TABLE ──────────────────────────────────────────
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

  // ─── COMBAT ──────────────────────────────────────────────────────────────
  COMBAT: {
    baseSpeed: 6,
    baseEvasion: 10,
    baseDefense: 10,
    apPerRound: 4,
    actionCosts: {
      basic: 2,
      quick: 1,
      free: 0,
      movement: 1,
      interaction: 1,
      abilityRoll: 1,
      skillEncounterAction: 2,
      evade: 1,
      brace: 1,
      focus: 1,
      search: 1,
      overcome: 1,
    },
    multipleActionPenalty: -5,
    criticalHitThreshold: 10,
    natural20Bonus: 2,
    natural1Penalty: -2,
    rangedMeleePenalty: -5,
    longRangePenalty: -5,
  },

  // ─── SKILLS AND DEFENSES ─────────────────────────────────────────────────
  SKILLS_AND_DEFENSES: {
    maxSkillValue: 3,
    baseSkillPastCapCost: 3,
    subSkillPastCapCost: 2,
    defenseIncreaseCost: 2,
    speciesSkillCount: 2,
    gainProficiencyCost: 1,
    unproficientRules: {
      positive: 'half ability (round up)',
      negative: 'double the negative',
    },
  },

  // ─── CONDITIONS ──────────────────────────────────────────────────────────
  CONDITIONS: {
    standard: [
      { name: 'Blinded', leveled: false, description: 'All targets are considered Completely Obscured to a blinded creature that relies on basic vision. Acuity Skill rolls that rely on sight automatically fail.' },
      { name: 'Charmed', leveled: false, description: "Charmed creatures can't attack or perform harmful Actions against the creature that charmed them. All Charisma rolls and potencies against this target from the charmer gain +2." },
      { name: 'Restrained', leveled: false, description: 'Restrained creatures cannot take Actions or Reactions that require the use of their arms.' },
      { name: 'Dazed', leveled: false, description: 'You cannot take Reactions.' },
      { name: 'Deafened', leveled: false, description: 'You cannot hear anything in the world around you. You have resistance to Sonic damage. Acuity Skill rolls that rely on hearing automatically fail.' },
      { name: 'Dying', leveled: false, description: 'HP at 0 or negative. Prone, 1 AP/turn. Take 1d4 irreducible damage at start of turn, doubling each turn (1d4, 1d8, 2d8, 4d8...). AP reduced to 1 on entry.' },
      { name: 'Faint', leveled: false, description: 'You have -1 to Evasion, Might, Reflex, and on all D20 rolls requiring balance or poise. Outside forces gain +1 to D20 rolls and potency to make you prone, knock you back, or grapple you.' },
      { name: 'Grappled', leveled: false, description: 'Grappled targets have -2 to Attack rolls, are +2 to hit, cannot move away from the grappler, and cannot take Movement Actions.' },
      { name: 'Hidden', leveled: false, description: 'While hidden, you have a +2 bonus on Attack rolls made against creatures unaware of your location in addition to any bonus granted by Obscurity.' },
      { name: 'Immobile', leveled: false, description: 'Immobile creatures cannot take Movement Actions, and their Speed is considered 0. Speed cannot be increased until removed.' },
      { name: 'Invisible', leveled: false, description: 'You are considered Completely Obscured to all creatures relying on basic vision.' },
      { name: 'Prone', leveled: false, description: 'Speed reduced by half. +2 to be hit from creatures within melee range. Increase Obscurity by 2 against creatures not above you or in your melee range.' },
      { name: 'Terminal', leveled: false, description: 'Your current Health is at or below one quarter of your maximum Health. Appears gravely injured and close to defeat.' },
    ],
    leveled: [
      { name: 'Bleed', leveled: true, description: 'Lose 1 Health at the beginning of your turn for each level of Bleed. Any healing received reduces the Bleed condition by the amount healed, but reduces the amount restored to Health by an equal amount.' },
      { name: 'Exhausted', leveled: true, description: 'For each level: reduce all Bonuses and Evasion by that level. For every 2 levels (starting at 2), Speed reduced by 1. Affects all Scores calculated from Bonuses. Each full recovery reduces by 1. Death at level 11+.' },
      { name: 'Exposed', leveled: true, description: 'Decrease all Defenses and Evasion by an amount equal to the level of Exposed.' },
      { name: 'Frightened', leveled: true, description: 'Penalty to all Scores and D20 rolls against the source of fear equal to the level. Penalty to all Scores and D20 rolls while seeing fear source equal to half the level.' },
      { name: 'Staggered', leveled: true, description: 'Decrease Evasion by an amount equal to your Staggered level.' },
      { name: 'Resilient', leveled: true, description: 'Reduce damage taken by an amount equal to your Resilient level.' },
      { name: 'Slowed', leveled: true, description: 'Decrease all Speed types by an amount equal to your Slowed level.' },
      { name: 'Stunned', leveled: true, description: 'Lose AP equal to level (removes immediately and reduces AP gained at end of turn). Always receives at least 1 AP at end of turn.' },
      { name: 'Susceptible', leveled: true, description: 'Increase all damage taken by an amount equal to your Susceptible level.' },
      { name: 'Weakened', leveled: true, description: 'Decrease all D20 rolls by an amount equal to your Weakened level.' },
    ],
    stackingRules: 'Conditions don\'t stack. Stronger replaces weaker. Durations don\'t stack.',
  },

  // ─── SIZES ───────────────────────────────────────────────────────────────
  SIZES: {
    categories: [
      { value: 'miniscule', label: 'Miniscule', height: 'Under 1 ft', spaces: 0.125, baseCarry: 10, perStrCarry: 5, minCarry: 5 },
      { value: 'tiny', label: 'Tiny', height: '1-2 ft', spaces: 0.25, baseCarry: 25, perStrCarry: 10, minCarry: 10 },
      { value: 'small', label: 'Small', height: '2-4 ft', spaces: 1, baseCarry: 50, perStrCarry: 25, minCarry: 25 },
      { value: 'medium', label: 'Medium', height: '5-7 ft', spaces: 1, baseCarry: 100, perStrCarry: 50, minCarry: 50 },
      { value: 'large', label: 'Large', height: '7-10 ft', spaces: 2, baseCarry: 200, perStrCarry: 100, minCarry: 100 },
      { value: 'huge', label: 'Huge', height: '10-15 ft', spaces: 4, baseCarry: 400, perStrCarry: 200, minCarry: 200 },
      { value: 'humongous', label: 'Humongous', height: '15-25 ft', spaces: 9, baseCarry: 800, perStrCarry: 400, minCarry: 400 },
      { value: 'gargantuan', label: 'Gargantuan', height: '25+ ft', spaces: 16, baseCarry: 1600, perStrCarry: 800, minCarry: 800 },
    ],
    halfCapacitySpeedPenalty: 'Movement speed halved',
  },

  // ─── RARITIES ────────────────────────────────────────────────────────────
  RARITIES: {
    tiers: [
      { name: 'Common', currencyMin: 0, currencyMax: 99, levelMin: 1, levelMax: 4 },
      { name: 'Uncommon', currencyMin: 100, currencyMax: 499, levelMin: 5, levelMax: 9 },
      { name: 'Rare', currencyMin: 500, currencyMax: 1499, levelMin: 10, levelMax: 14 },
      { name: 'Epic', currencyMin: 1500, currencyMax: 9999, levelMin: 15, levelMax: 19 },
      { name: 'Legendary', currencyMin: 10000, currencyMax: 49999, levelMin: 20, levelMax: 24 },
      { name: 'Mythic', currencyMin: 50000, currencyMax: 99999, levelMin: 25, levelMax: 29 },
      { name: 'Ascended', currencyMin: 100000, currencyMax: null, levelMin: 30, levelMax: null },
    ],
  },

  // ─── DAMAGE TYPES ────────────────────────────────────────────────────────
  DAMAGE_TYPES: {
    all: ['magic', 'fire', 'ice', 'lightning', 'spiritual', 'sonic', 'poison', 'necrotic', 'acid', 'psychic', 'light', 'bludgeoning', 'piercing', 'slashing'],
    armorExceptions: ['psychic', 'spiritual', 'sonic'],
    note: 'No physical vs magic split. All damage types are equal categories. Only distinction is armor exceptions.',
  },

  // ─── RECOVERY ────────────────────────────────────────────────────────────
  RECOVERY: {
    partial: {
      duration: '2, 4, or 6 hours',
      effect: 'Each 2 hours: regain 1/4 of both max Energy and Health, OR 1/2 of one.',
      interruptionGrace: '10 minutes to resume without losing block',
    },
    full: {
      duration: '8-10 hours',
      effect: 'Fully restore Energy and Health, remove most temporary effects.',
    },
    requirements: 'Adequate nutrition/hydration, temperate conditions, bedding if needed. Must doff armor.',
    withoutFullRecovery: 'Max HP and EN reduce by 1/4 each 24 hours without full recovery (accumulates, min 1).',
    featUses: {
      partial: 'Resets "Partial" recovery feats only',
      full: 'Resets all feat uses',
    },
  },

  // ─── EXPERIENCE ──────────────────────────────────────────────────────────
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
// SEED FUNCTION
// =============================================================================

async function seedCoreRules() {
  console.log('Seeding core_rules table...\n');

  let upserted = 0;
  let errors = 0;

  for (const [id, data] of Object.entries(CORE_RULES)) {
    try {
      await prisma.coreRules.upsert({
        where: { id },
        create: { id, data, updatedAt: new Date() },
        update: { data, updatedAt: new Date() },
      });
      console.log(`  ✓ ${id}`);
      upserted++;
    } catch (err) {
      console.error(`  ✗ ${id}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\nDone. ${upserted} categories upserted, ${errors} errors.`);
}

seedCoreRules()
  .catch((e) => { console.error('Fatal error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
