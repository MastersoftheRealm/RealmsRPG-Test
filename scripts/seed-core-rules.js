#!/usr/bin/env node
/**
 * Seed Core Rules into Supabase
 * ==============================
 * Populates the core_rules table with all configurable game rules.
 * Each row is a category (e.g., PROGRESSION_PLAYER, CONDITIONS, SIZES).
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env
 * Run: node scripts/seed-core-rules.js
 * Export JSON (backup): node scripts/seed-core-rules.js --export-json
 *
 * This script is idempotent — it upserts all rows safely.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

  // ─── CONDITIONS ──────────────────────────────────────────────────────────
  CONDITIONS: {
    blinded: { name: 'Blinded', description: 'Cannot see; auto-fail sight-based; attacks have disadvantage.' },
    charmed: { name: 'Charmed', description: 'Cannot attack charmer; charmer has advantage on social checks.' },
    deafened: { name: 'Deafened', description: 'Cannot hear; auto-fail hearing.' },
    frightened: { name: 'Frightened', description: 'Disadvantage while source of fear in line of sight.' },
    grappled: { name: 'Grappled', description: 'Speed 0; ends if grappler incapacitated or moved.' },
    incapacitated: { name: 'Incapacitated', description: 'Cannot take actions or reactions.' },
    invisible: { name: 'Invisible', description: 'Cannot be seen without aid; attacks have advantage.' },
    paralyzed: { name: 'Paralyzed', description: 'Incapacitated; auto-fail STR/DEX; attacks from 5 ft have advantage and crit.' },
    petrified: { name: 'Petrified', description: 'Turned to stone; incapacitated; weight and age suspended.' },
    poisoned: { name: 'Poisoned', description: 'Disadvantage on attacks and ability checks.' },
    prone: { name: 'Prone', description: 'Only crawl or stand; melee advantage / ranged disadvantage.' },
    restrained: { name: 'Restrained', description: 'Speed 0; disadvantage on attacks and DEX saves; attacks have advantage.' },
    stunned: { name: 'Stunned', description: 'Incapacitated; auto-fail STR/DEX; cannot move; attacks have advantage.' },
    unconscious: { name: 'Unconscious', description: 'Incapacitated; prone; drop held; auto-fail STR/DEX; attacks from 5 ft crit.' },
  },

  // ─── SIZES ────────────────────────────────────────────────────────────────
  SIZES: {
    tiny: { name: 'Tiny', space: 2.5 },
    small: { name: 'Small', space: 2.5 },
    medium: { name: 'Medium', space: 5 },
    large: { name: 'Large', space: 10 },
    huge: { name: 'Huge', space: 15 },
    gargantuan: { name: 'Gargantuan', space: 20 },
  },

  // ─── CRAFTING (crafting.txt) ───────────────────────────────────────────────
  CRAFTING: {
    craftingCostMultiplier: 0.75,
    consumableTimeMultiplier: 0.25,
    craftingDayHours: 8,
    enhancedSellPriceMultiplier: 1.25,
    upgradeMaterialCostMultiplier: 0.75,
    npcUpgradeCostMultiplier: 1,
    npcServiceFeeWithMaterials: 0.25,
    bulkCraftCount: 4,
    bulkCraftMaterialCount: 3,
    finerToolsBonus: { Common: 0, Uncommon: 1, Rare: 2, Epic: 3, Legendary: 4, Mythic: 5, Ascended: 6 },
    generalTable: [
      { currencyMin: 0, currencyMax: 99, rarity: 'Common', difficultyScore: 14, successes: 1, timeValue: 8, timeUnit: 'hours' },
      { currencyMin: 100, currencyMax: 499, rarity: 'Uncommon', difficultyScore: 16, successes: 1, timeValue: 5, timeUnit: 'days' },
      { currencyMin: 500, currencyMax: 1499, rarity: 'Rare', difficultyScore: 18, successes: 2, timeValue: 10, timeUnit: 'days' },
      { currencyMin: 1500, currencyMax: 2499, rarity: 'Epic', difficultyScore: 20, successes: 4, timeValue: 20, timeUnit: 'days' },
      { currencyMin: 2500, currencyMax: 4999, rarity: 'Epic', difficultyScore: 22, successes: 5, timeValue: 25, timeUnit: 'days' },
      { currencyMin: 5000, currencyMax: 9999, rarity: 'Epic', difficultyScore: 24, successes: 6, timeValue: 30, timeUnit: 'days' },
      { currencyMin: 10000, currencyMax: 19999, rarity: 'Legendary', difficultyScore: 26, successes: 7, timeValue: 35, timeUnit: 'days' },
      { currencyMin: 20000, currencyMax: 34999, rarity: 'Legendary', difficultyScore: 28, successes: 8, timeValue: 40, timeUnit: 'days' },
      { currencyMin: 35000, currencyMax: 49999, rarity: 'Legendary', difficultyScore: 30, successes: 9, timeValue: 45, timeUnit: 'days' },
      { currencyMin: 50000, currencyMax: 64999, rarity: 'Mythic', difficultyScore: 32, successes: 10, timeValue: 50, timeUnit: 'days' },
      { currencyMin: 65000, currencyMax: 79999, rarity: 'Mythic', difficultyScore: 34, successes: 11, timeValue: 55, timeUnit: 'days' },
      { currencyMin: 80000, currencyMax: 99999, rarity: 'Mythic', difficultyScore: 36, successes: 12, timeValue: 60, timeUnit: 'days' },
      { currencyMin: 100000, currencyMax: null, rarity: 'Ascended', difficultyScore: 38, successes: 14, timeValue: 70, timeUnit: 'days' },
    ],
    successesTable: [
      { delta: 0, failureEffect: '—', successEffect: 'Create fully functional item worth market price with no complications.', successItemWorthPercent: 100, materialsRetainedPercent: 0, choiceExtraItemOrEnhance: false },
      { delta: 1, failureEffect: 'The item is worth 75% of the market price.', successEffect: 'The item is worth 125% of the market price.', failureItemWorthPercent: 75, successItemWorthPercent: 125, materialsRetainedPercent: 0, choiceExtraItemOrEnhance: false },
      { delta: 2, failureEffect: 'The item is worth 50% of the market price.', successEffect: 'You retain 25% of the crafting materials and the item is worth 125% of the market price.', failureItemWorthPercent: 50, successItemWorthPercent: 125, materialsRetainedPercent: 25, choiceExtraItemOrEnhance: false },
      { delta: 3, failureEffect: 'The item is worth 25% of the market price.', successEffect: 'You retain 50% of the crafting materials and the item is worth 125% of the market price.', failureItemWorthPercent: 25, successItemWorthPercent: 125, materialsRetainedPercent: 50, choiceExtraItemOrEnhance: false },
      { delta: 4, failureEffect: 'The item is worthless and doesn\'t function as intended.', successEffect: 'You retain 50% of the crafting materials and the item is worth 150% of the market price.', failureItemWorthPercent: 0, successItemWorthPercent: 150, materialsRetainedPercent: 50, choiceExtraItemOrEnhance: false },
      { delta: 5, failureEffect: '—', successEffect: 'You retain 75% of the crafting materials and the item is worth 150% of the market price.', successItemWorthPercent: 150, materialsRetainedPercent: 75, choiceExtraItemOrEnhance: false },
      { delta: 6, failureEffect: '—', successEffect: 'You retain 75% of the crafting materials and the item is worth 175% of the market price.', successItemWorthPercent: 175, materialsRetainedPercent: 75, choiceExtraItemOrEnhance: false },
      { delta: 7, failureEffect: '—', successEffect: 'You retain 75% of the materials and can choose: craft an additional identical item (both at 100%) or enhance the original to 200% value.', successItemWorthPercent: 200, materialsRetainedPercent: 75, choiceExtraItemOrEnhance: true },
      { delta: 8, failureEffect: '—', successEffect: 'As delta 7, plus one additional item at 100% per success above 7.', successItemWorthPercent: 200, materialsRetainedPercent: 75, extraItemCount: 1, choiceExtraItemOrEnhance: true },
    ],
    enhancedTable: [
      { rarity: 'Common', currencyPerEnergy: 10, energyMin: 0, energyMax: 10, difficultyScore: 14, successes: 1, timeValue: 8, timeUnit: 'hours' },
      { rarity: 'Uncommon', currencyPerEnergy: 25, energyMin: 11, energyMax: 20, difficultyScore: 16, successes: 1, timeValue: 5, timeUnit: 'days' },
      { rarity: 'Rare', currencyPerEnergy: 50, energyMin: 21, energyMax: 30, difficultyScore: 18, successes: 2, timeValue: 10, timeUnit: 'days' },
      { rarity: 'Epic', currencyPerEnergy: 71, energyMin: 31, energyMax: 35, difficultyScore: 20, successes: 4, timeValue: 20, timeUnit: 'days' },
      { rarity: 'Epic', currencyPerEnergy: 125, energyMin: 36, energyMax: 40, difficultyScore: 22, successes: 5, timeValue: 25, timeUnit: 'days' },
      { rarity: 'Epic', currencyPerEnergy: 222, energyMin: 41, energyMax: 45, difficultyScore: 24, successes: 6, timeValue: 30, timeUnit: 'days' },
      { rarity: 'Legendary', currencyPerEnergy: 363, energyMin: 46, energyMax: 55, difficultyScore: 26, successes: 7, timeValue: 35, timeUnit: 'days' },
      { rarity: 'Legendary', currencyPerEnergy: 583, energyMin: 56, energyMax: 60, difficultyScore: 28, successes: 8, timeValue: 40, timeUnit: 'days' },
      { rarity: 'Legendary', currencyPerEnergy: 692, energyMin: 61, energyMax: 65, difficultyScore: 30, successes: 9, timeValue: 45, timeUnit: 'days' },
      { rarity: 'Mythic', currencyPerEnergy: 866, energyMin: 66, energyMax: 75, difficultyScore: 32, successes: 10, timeValue: 50, timeUnit: 'days' },
      { rarity: 'Mythic', currencyPerEnergy: 1000, energyMin: 76, energyMax: 80, difficultyScore: 34, successes: 11, timeValue: 55, timeUnit: 'days' },
      { rarity: 'Mythic', currencyPerEnergy: 1176, energyMin: 81, energyMax: 85, difficultyScore: 36, successes: 12, timeValue: 60, timeUnit: 'days' },
      { rarity: 'Ascended', currencyPerEnergy: 1300, energyMin: 86, energyMax: null, difficultyScore: 38, successes: 14, timeValue: 70, timeUnit: 'days' },
    ],
    multipleUseTable: [
      { partialRecovery: 'permanent', fullRecovery: 1, adjustedEnergyPercent: 100 },
      { partialRecovery: 'permanent', fullRecovery: 2, adjustedEnergyPercent: 125 },
      { partialRecovery: 1, fullRecovery: 3, adjustedEnergyPercent: 150 },
      { partialRecovery: 2, fullRecovery: 4, adjustedEnergyPercent: 175 },
      { partialRecovery: 3, fullRecovery: 6, adjustedEnergyPercent: 200 },
      { partialRecovery: 4, fullRecovery: 8, adjustedEnergyPercent: 225 },
      { partialRecovery: 5, fullRecovery: 10, adjustedEnergyPercent: 250 },
      { partialRecovery: 'permanent', fullRecovery: 'permanent', adjustedEnergyPercent: 300 },
    ],
    consumableEnhancedTable: [
      { rarity: 'Common', costPerEnergy: 5, energyMin: 0, energyMax: 10, difficultyScore: 14, successes: 1, timeValue: 2, timeUnit: 'hours' },
      { rarity: 'Common', costPerEnergy: 5, energyMin: 11, energyMax: 20, difficultyScore: 15, successes: 1, timeValue: 4, timeUnit: 'hours' },
      { rarity: 'Uncommon', costPerEnergy: 12, energyMin: 21, energyMax: 40, difficultyScore: 16, successes: 1, timeValue: 1, timeUnit: 'days' },
      { rarity: 'Rare', costPerEnergy: 24, energyMin: 41, energyMax: 60, difficultyScore: 18, successes: 1, timeValue: 2, timeUnit: 'days' },
      { rarity: 'Epic', costPerEnergy: 34, energyMin: 61, energyMax: 70, difficultyScore: 20, successes: 1, timeValue: 5, timeUnit: 'days' },
      { rarity: 'Epic', costPerEnergy: 62, energyMin: 71, energyMax: 80, difficultyScore: 22, successes: 2, timeValue: 10, timeUnit: 'days' },
      { rarity: 'Epic', costPerEnergy: 110, energyMin: 81, energyMax: 90, difficultyScore: 24, successes: 3, timeValue: 15, timeUnit: 'days' },
      { rarity: 'Legendary', costPerEnergy: 180, energyMin: 91, energyMax: 110, difficultyScore: 26, successes: 4, timeValue: 20, timeUnit: 'days' },
      { rarity: 'Legendary', costPerEnergy: 290, energyMin: 111, energyMax: 120, difficultyScore: 28, successes: 5, timeValue: 25, timeUnit: 'days' },
      { rarity: 'Legendary', costPerEnergy: 384, energyMin: 121, energyMax: 130, difficultyScore: 30, successes: 6, timeValue: 30, timeUnit: 'days' },
      { rarity: 'Mythic', costPerEnergy: 432, energyMin: 131, energyMax: 150, difficultyScore: 32, successes: 7, timeValue: 35, timeUnit: 'days' },
      { rarity: 'Mythic', costPerEnergy: 500, energyMin: 151, energyMax: 160, difficultyScore: 34, successes: 8, timeValue: 40, timeUnit: 'days' },
      { rarity: 'Mythic', costPerEnergy: 588, energyMin: 161, energyMax: 170, difficultyScore: 36, successes: 9, timeValue: 45, timeUnit: 'days' },
      { rarity: 'Ascended', costPerEnergy: 650, energyMin: 171, energyMax: null, difficultyScore: 38, successes: 10, timeValue: 50, timeUnit: 'days' },
    ],
    optionalReduceTimeByDifficulty: {
      dsIncreasePerStep: 2,
      daysReductionPerStep: 5,
      successesReductionPerStep: 1,
      maxSteps: 5,
      halfTimeWhenUnder5Days: true,
    },
    optionalReduceTimeByCost: {
      costIncreasePercentPerStep: 50,
      daysReductionPerStep: 5,
      successesReductionPerStep: 1,
      maxSteps: 5,
      halfTimeWhenUnder5Days: true,
    },
    optionalReduceDifficultyByTime: {
      additionalDaysCommon: 1,
      additionalDaysOther: 5,
      dsReduction: 1,
      successesIncrease: 1,
    },
    optionalReduceDifficultyByCost: {
      costIncreasePercent: 25,
      dsReduction: 2,
      maxSteps: 4,
    },
  },

  // ─── ADDITIONAL (extend as needed) ─────────────────────────────────────────
};

// =============================================================================
// SEED FUNCTION
// =============================================================================

async function seedCoreRules() {
  console.log('Seeding core_rules table...\n');

  let upserted = 0;
  let errors = 0;

  for (const [id, data] of Object.entries(CORE_RULES)) {
    const row = {
      id,
      data,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('core_rules').upsert(row, { onConflict: 'id' });
    if (error) {
      console.error(`  ✗ ${id}: ${error.message}`);
      errors++;
    } else {
      console.log(`  ✓ ${id}`);
      upserted++;
    }
  }

  console.log(`\nDone. ${upserted} categories upserted, ${errors} errors.`);
}

// --export-json: write one JSON file per category to data/core-rules/ (backup / re-seed source)
if (process.argv.includes('--export-json')) {
  const dir = path.join(__dirname, '..', 'data', 'core-rules');
  fs.mkdirSync(dir, { recursive: true });
  for (const [id, data] of Object.entries(CORE_RULES)) {
    fs.writeFileSync(path.join(dir, id + '.json'), JSON.stringify(data, null, 2), 'utf8');
    console.log('  ' + id + '.json');
  }
  console.log('Exported ' + Object.keys(CORE_RULES).length + ' categories to data/core-rules/');
  process.exit(0);
}

seedCoreRules().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
