#!/usr/bin/env node
/**
 * Migrate Characters to Lean Schema
 * ==================================
 * Reads all characters from the database and converts old format fields
 * to the lean format (IDs + minimal user data only).
 *
 * Run with --dry-run to preview changes without writing:
 *   node scripts/migrate-characters-lean.js --dry-run
 *
 * Run to apply changes:
 *   node scripts/migrate-characters-lean.js
 *
 * This script is idempotent — safe to run multiple times.
 * Already-lean characters pass through unchanged.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes('--dry-run');

// ---------------------------------------------------------------------------
// Field strippers — convert rich objects to lean format
// ---------------------------------------------------------------------------

/** Strip archetype to { id, type } */
function stripArchetype(arch) {
  if (!arch || typeof arch !== 'object') return arch;
  const lean = {};
  if (arch.id) lean.id = arch.id;
  if (arch.type) lean.type = arch.type;
  // If no id or type found, preserve the object as-is (unknown old format)
  return Object.keys(lean).length > 0 ? lean : undefined;
}

/** Strip ancestry to { id, name, selectedTraits, selectedFlaw, selectedCharacteristic } */
function stripAncestry(anc) {
  if (!anc || typeof anc !== 'object') return anc;
  const lean = {};
  if (anc.id) lean.id = anc.id;
  if (anc.name) lean.name = anc.name;
  if (anc.selectedTraits) lean.selectedTraits = anc.selectedTraits;
  if (anc.selectedFlaw !== undefined) lean.selectedFlaw = anc.selectedFlaw;
  if (anc.selectedCharacteristic !== undefined) lean.selectedCharacteristic = anc.selectedCharacteristic;
  return Object.keys(lean).length > 0 ? lean : anc;
}

/** Strip feat to { id, name, currentUses } */
function stripFeat(f) {
  if (typeof f === 'string') return { name: f };
  if (!f || typeof f !== 'object') return f;
  const lean = {};
  if (f.id) lean.id = f.id;
  if (f.name) lean.name = f.name;
  if (typeof f.currentUses === 'number') lean.currentUses = f.currentUses;
  return Object.keys(lean).length > 0 ? lean : null;
}

/** Strip power to { id, name, innate } */
function stripPower(p) {
  if (typeof p === 'string') return { name: p, innate: false };
  if (!p || typeof p !== 'object') return p;
  const lean = {};
  if (p.id) lean.id = p.id;
  if (p.name) lean.name = p.name;
  lean.innate = !!p.innate;
  return lean;
}

/** Strip technique to { id, name } */
function stripTechnique(t) {
  if (typeof t === 'string') return { name: t };
  if (!t || typeof t !== 'object') return t;
  const lean = {};
  if (t.id) lean.id = t.id;
  if (t.name) lean.name = t.name;
  return Object.keys(lean).length > 0 ? lean : null;
}

/** Strip equipment item to { id, name, equipped?, quantity? } */
function stripEquipItem(item) {
  if (typeof item === 'string') return { name: item };
  if (!item || typeof item !== 'object') return item;
  const lean = {};
  if (item.id) lean.id = item.id;
  if (item.name) lean.name = item.name;
  if (item.equipped) lean.equipped = true;
  if (item.quantity && item.quantity !== 1) lean.quantity = item.quantity;
  return Object.keys(lean).length > 0 ? lean : null;
}

/** Strip skill to { id, name, skill_val, prof, selectedBaseSkillId? } */
function stripSkill(s) {
  if (typeof s === 'string') return { name: s, skill_val: 0, prof: false };
  if (!s || typeof s !== 'object') return s;
  const lean = {};
  if (s.id) lean.id = s.id;
  if (s.name) lean.name = s.name;
  lean.skill_val = s.skill_val ?? 0;
  lean.prof = !!s.prof;
  if (s.selectedBaseSkillId) lean.selectedBaseSkillId = s.selectedBaseSkillId;
  return lean;
}

// ---------------------------------------------------------------------------
// Main migration function
// ---------------------------------------------------------------------------

function migrateCharacterData(data) {
  if (!data || typeof data !== 'object') return { data, changes: [] };

  const d = { ...data };
  const changes = [];

  // --- Health/Energy migration ---
  if (d.health && typeof d.health === 'object' && d.health.current !== undefined) {
    if (d.currentHealth === undefined) {
      d.currentHealth = d.health.current;
      changes.push('health.current → currentHealth');
    }
    delete d.health;
    changes.push('removed health ResourcePool');
  }

  if (d.energy && typeof d.energy === 'object' && d.energy.current !== undefined) {
    if (d.currentEnergy === undefined) {
      d.currentEnergy = d.energy.current;
      changes.push('energy.current → currentEnergy');
    }
    delete d.energy;
    changes.push('removed energy ResourcePool');
  }

  if (d.health_energy_points) {
    if (d.healthPoints === undefined && d.health_energy_points.health !== undefined) {
      d.healthPoints = d.health_energy_points.health;
      changes.push('health_energy_points.health → healthPoints');
    }
    if (d.energyPoints === undefined && d.health_energy_points.energy !== undefined) {
      d.energyPoints = d.health_energy_points.energy;
      changes.push('health_energy_points.energy → energyPoints');
    }
    delete d.health_energy_points;
    changes.push('removed health_energy_points');
  }

  // --- Species → Ancestry migration ---
  if (d.species && !d.ancestry) {
    d.ancestry = { name: d.species };
    changes.push(`species "${d.species}" → ancestry.name`);
  }
  if (d.species) {
    delete d.species;
    changes.push('removed species field');
  }

  // --- Archetype ---
  if (d.archetype && typeof d.archetype === 'object') {
    const hasExtraFields = d.archetype.name || d.archetype.description || d.archetype.pow_abil || 
                           d.archetype.mart_abil || d.archetype.ability;
    if (hasExtraFields) {
      const lean = stripArchetype(d.archetype);
      if (lean) {
        d.archetype = lean;
        changes.push('stripped archetype to { id, type }');
      } else {
        // No id or type found — remove the useless archetype
        delete d.archetype;
        changes.push('removed archetype (no id or type)');
      }
    }
  }

  // --- Ancestry ---
  if (d.ancestry && typeof d.ancestry === 'object') {
    const hasExtraFields = d.ancestry.size || d.ancestry.speed || d.ancestry.description ||
                           d.ancestry.traits || d.ancestry.flaws || d.ancestry.characteristics;
    if (hasExtraFields) {
      d.ancestry = stripAncestry(d.ancestry);
      changes.push('stripped ancestry to lean fields');
    }
  }

  // --- Feats ---
  if (Array.isArray(d.feats)) {
    const before = JSON.stringify(d.feats);
    d.feats = d.feats.map(stripFeat).filter(Boolean);
    if (JSON.stringify(d.feats) !== before) changes.push('stripped feats to { id, name, currentUses }');
  }
  if (Array.isArray(d.archetypeFeats)) {
    const before = JSON.stringify(d.archetypeFeats);
    d.archetypeFeats = d.archetypeFeats.map(stripFeat).filter(Boolean);
    if (JSON.stringify(d.archetypeFeats) !== before) changes.push('stripped archetypeFeats');
  }

  // --- Powers ---
  if (Array.isArray(d.powers)) {
    const before = JSON.stringify(d.powers);
    d.powers = d.powers.map(stripPower).filter(Boolean);
    if (JSON.stringify(d.powers) !== before) changes.push('stripped powers to { id, name, innate }');
  }

  // --- Techniques ---
  if (Array.isArray(d.techniques)) {
    const before = JSON.stringify(d.techniques);
    d.techniques = d.techniques.map(stripTechnique).filter(Boolean);
    if (JSON.stringify(d.techniques) !== before) changes.push('stripped techniques to { id, name }');
  }

  // --- Equipment ---
  if (d.equipment && typeof d.equipment === 'object') {
    const equip = d.equipment;
    let equipChanged = false;
    for (const key of ['weapons', 'armor', 'items']) {
      if (Array.isArray(equip[key])) {
        const before = JSON.stringify(equip[key]);
        equip[key] = equip[key].map(stripEquipItem).filter(Boolean);
        if (JSON.stringify(equip[key]) !== before) equipChanged = true;
      }
    }
    // Remove redundant inventory array
    if (equip.inventory) {
      delete equip.inventory;
      equipChanged = true;
    }
    if (equipChanged) changes.push('stripped equipment items to lean format');
  }

  // --- Skills ---
  // Handle Record<skillId, number> format → convert to lean array
  if (d.skills && typeof d.skills === 'object' && !Array.isArray(d.skills)) {
    d.skills = Object.entries(d.skills)
      .filter(([, val]) => typeof val === 'number' && val > 0)
      .map(([id, val]) => ({ id, skill_val: val, prof: true }));
    changes.push('converted skills from Record to lean array');
  }
  if (Array.isArray(d.skills)) {
    const before = JSON.stringify(d.skills);
    d.skills = d.skills.map(stripSkill).filter(Boolean);
    if (JSON.stringify(d.skills) !== before) changes.push('stripped skills to lean format');
  }

  // --- Migrate deprecated proficiency fields before removal ---
  if (d.martialProficiency !== undefined && d.mart_prof === undefined) {
    d.mart_prof = d.martialProficiency;
    changes.push('martialProficiency → mart_prof');
  }
  if (d.powerProficiency !== undefined && d.pow_prof === undefined) {
    d.pow_prof = d.powerProficiency;
    changes.push('powerProficiency → pow_prof');
  }
  if (d.defenseSkills !== undefined && d.defenseVals === undefined) {
    d.defenseVals = d.defenseSkills;
    changes.push('defenseSkills → defenseVals');
  }

  // --- Remove legacy display-only and deprecated fields ---
  const legacyFields = [
    'allTraits', '_displayFeats', 'speciesTraits', 'defenses', 'defenseBonuses',
    'archetypeName', 'archetypeAbility', 'ancestryTraits', 'flawTrait', 
    'characteristicTrait', 'health_energy_points',
    // Deprecated proficiency aliases (canonical: mart_prof / pow_prof)
    'martialProficiency', 'powerProficiency',
    // Deprecated defense field (canonical: defenseVals)
    'defenseSkills',
  ];
  for (const field of legacyFields) {
    if (d[field] !== undefined) {
      delete d[field];
      changes.push(`removed legacy field: ${field}`);
    }
  }

  // --- Remove derived combat stats that are calculated on load ---
  const derivedFields = ['speed', 'evasion', 'armor'];
  for (const field of derivedFields) {
    if (d[field] !== undefined) {
      delete d[field];
      changes.push(`removed derived field: ${field}`);
    }
  }

  return { data: d, changes };
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\n🔄 Character Lean Migration ${DRY_RUN ? '(DRY RUN)' : ''}`);
  console.log('='.repeat(60));

  const characters = await prisma.character.findMany({
    select: { id: true, userId: true, data: true },
  });

  console.log(`\nFound ${characters.length} characters to check.\n`);

  let migratedCount = 0;
  let skippedCount = 0;
  const errors = [];

  for (const char of characters) {
    try {
      const { data: leanData, changes } = migrateCharacterData(char.data);

      if (changes.length === 0) {
        skippedCount++;
        continue;
      }

      const charName = (char.data && typeof char.data === 'object' ? char.data.name : null) || char.id;
      console.log(`📝 ${charName} (${char.id}):`);
      for (const change of changes) {
        console.log(`   - ${change}`);
      }

      if (!DRY_RUN) {
        await prisma.character.update({
          where: { id: char.id },
          data: { data: leanData },
        });
        console.log(`   ✅ Updated`);
      } else {
        console.log(`   (dry run — would update)`);
      }

      migratedCount++;
    } catch (err) {
      errors.push({ id: char.id, error: err.message });
      console.error(`   ❌ Error: ${err.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Summary:`);
  console.log(`  Total characters: ${characters.length}`);
  console.log(`  Migrated: ${migratedCount}`);
  console.log(`  Skipped (already lean): ${skippedCount}`);
  console.log(`  Errors: ${errors.length}`);
  if (errors.length > 0) {
    console.log('\nErrors:');
    for (const e of errors) {
      console.log(`  ${e.id}: ${e.error}`);
    }
  }
  console.log(`\n${DRY_RUN ? '⚠️  DRY RUN — no changes written. Run without --dry-run to apply.' : '✅ Migration complete.'}\n`);
}

main()
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
