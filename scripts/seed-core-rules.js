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
