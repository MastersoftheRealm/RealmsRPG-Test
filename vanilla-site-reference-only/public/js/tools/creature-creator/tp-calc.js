import { calculateItemCosts } from '/js/calculators/item-calc.js';
import { calculatePowerCosts } from '/js/calculators/power-calc.js';
import { calculateTechniqueCosts } from '/js/calculators/technique-calc.js';
import { findByIdOrName } from '/js/shared/id-constants.js';

/**
 * Calculate total TP spent on armaments, powers, and techniques for a creature.
 * Replicates character creator logic: parses parts/properties, ignores duplicates except for damage types.
 * @param {Object} creatureData - Creature data with armaments, powersTechniques, etc.
 * @param {Array} itemPropertiesDb - Item properties database.
 * @param {Array} powerPartsDb - Power parts database.
 * @param {Array} techniquePartsDb - Technique parts database.
 * @returns {number} Total TP spent.
 */
export function calculateCreatureTPSpent(creatureData, itemPropertiesDb, powerPartsDb, techniquePartsDb) {
  let totalTP = 0;
  const proficiencies = new Map(); // To track and merge proficiencies, ignoring duplicates except damage

  // --- Logging accumulators ---
  let armamentLogs = [];
  let powerLogs = [];
  let techniqueLogs = [];
  let mergedLogs = [];

  // 1. Calculate TP from armaments (using item properties)
  if (creatureData.armaments && Array.isArray(creatureData.armaments)) {
    creatureData.armaments.forEach(armament => {
      const costs = calculateItemCosts(armament.properties || [], itemPropertiesDb);
      totalTP += costs.totalTP;

      // Extract and merge proficiencies (replica of character creator equipment logic)
      (armament.properties || []).forEach(propRef => {
        const propData = itemPropertiesDb.find(prop => prop.id === propRef.id || prop.name === propRef.name);
        if (!propData) return;
        const baseTP = Math.floor(propData.base_tp || 0);
        const optionLevel = propRef.op_1_lvl || 0;
        const optionTP = optionLevel > 0 ? Math.floor((propData.op_1_tp || 0) * optionLevel) : 0;
        const finalTP = baseTP + optionTP;
        if (finalTP <= 0) return;

        let key = propData.name;
        let damageType = null;

        // Special handling for Weapon Damage: don't ignore if damage types differ
        if (propData.name === 'Weapon Damage' && armament.damage && Array.isArray(armament.damage)) {
          const damageTypes = armament.damage
            .filter(d => d && d.type && d.type !== 'none')
            .map(d => d.type)
            .join(', ');
          if (damageTypes) {
            damageType = damageTypes;
            key = `${propData.name}|${damageTypes}`;
          }
        }

        armamentLogs.push({
          name: propData.name,
          baseTP,
          optionTP,
          optionLevel,
          finalTP,
          damageType,
          armamentName: armament.name || ''
        });

        if (proficiencies.has(key)) {
          const existing = proficiencies.get(key);
          existing.optionLevel = Math.max(existing.optionLevel, optionLevel);
        } else {
          proficiencies.set(key, {
            name: propData.name,
            baseTP,
            optionTP: propData.op_1_tp || 0,
            optionLevel,
            damageType
          });
        }
      });
    });
  }

  // 2. Calculate TP from powers (using power parts)
  if (creatureData.powersTechniques && Array.isArray(creatureData.powersTechniques)) {
    creatureData.powersTechniques.forEach(item => {
      if (item.type === 'power') {
        const costs = calculatePowerCosts(item.parts || [], powerPartsDb);
        totalTP += costs.totalTP;

        // Extract and merge proficiencies (replica of character creator powers logic)
        (item.parts || []).forEach(partData => {
          const partDef = findByIdOrName(powerPartsDb, partData);
          if (!partDef) return;
          const l1 = partData.op_1_lvl || 0;
          const l2 = partData.op_2_lvl || 0;
          const l3 = partData.op_3_lvl || 0;
          const rawTP = (partDef.base_tp || 0) + (partDef.op_1_tp || 0) * l1 + (partDef.op_2_tp || 0) * l2 + (partDef.op_3_tp || 0) * l3;
          const finalTP = Math.floor(rawTP);
          if (finalTP <= 0) return;

          let key = partDef.name;
          let damageType = null;

          // Special handling for damage-adding parts: don't ignore if damage differs (e.g., different power damage)
          if (partDef.name.includes('Damage') && item.damage && Array.isArray(item.damage)) {
            const damageTypes = item.damage
              .filter(d => d && d.type && d.type !== 'none')
              .map(d => d.type)
              .join(', ');
            if (damageTypes) {
              damageType = damageTypes;
              key = `${partDef.name}|${damageTypes}`;
            }
          }

          powerLogs.push({
            name: partDef.name,
            baseTP: partDef.base_tp || 0,
            op1TP: partDef.op_1_tp || 0,
            op2TP: partDef.op_2_tp || 0,
            op3TP: partDef.op_3_tp || 0,
            l1, l2, l3,
            finalTP,
            damageType,
            powerName: item.name || ''
          });

          if (proficiencies.has(key)) {
            const existing = proficiencies.get(key);
            existing.l1 = Math.max(existing.l1, l1);
            existing.l2 = Math.max(existing.l2, l2);
            existing.l3 = Math.max(existing.l3, l3);
          } else {
            proficiencies.set(key, {
              name: partDef.name,
              baseTP: partDef.base_tp || 0,
              op1TP: partDef.op_1_tp || 0,
              op2TP: partDef.op_2_tp || 0,
              op3TP: partDef.op_3_tp || 0,
              l1, l2, l3,
              damageType
            });
          }
        });
      }
    });
  }

  // 3. Calculate TP from techniques (using technique parts)
  if (creatureData.powersTechniques && Array.isArray(creatureData.powersTechniques)) {
    creatureData.powersTechniques.forEach(item => {
      if (item.type === 'technique') {
        const costs = calculateTechniqueCosts(item.parts || [], techniquePartsDb);
        totalTP += costs.totalTP;

        // Extract and merge proficiencies (replica of character creator techniques logic)
        (item.parts || []).forEach(partData => {
          const partDef = findByIdOrName(techniquePartsDb, partData);
          if (!partDef) return;
          const l1 = partData.op_1_lvl || 0;
          const l2 = partData.op_2_lvl || 0;
          const l3 = partData.op_3_lvl || 0;
          let opt1TPRaw = (partDef.op_1_tp || 0) * l1;
          if (partDef.name === 'Additional Damage') opt1TPRaw = Math.floor(opt1TPRaw);
          const rawTP = (partDef.base_tp || 0) + opt1TPRaw + (partDef.op_2_tp || 0) * l2 + (partDef.op_3_tp || 0) * l3;
          const finalTP = Math.floor(rawTP);
          if (finalTP <= 0) return;

          let key = partDef.name;
          let damageType = null;

          // Special handling for damage-adding parts: don't ignore if damage differs
          if (partDef.name.includes('Damage') && item.damage && Array.isArray(item.damage)) {
            const damageTypes = item.damage
              .filter(d => d && d.type && d.type !== 'none')
              .map(d => d.type)
              .join(', ');
            if (damageTypes) {
              damageType = damageTypes;
              key = `${partDef.name}|${damageTypes}`;
            }
          }

          techniqueLogs.push({
            name: partDef.name,
            baseTP: partDef.base_tp || 0,
            op1TP: partDef.op_1_tp || 0,
            op2TP: partDef.op_2_tp || 0,
            op3TP: partDef.op_3_tp || 0,
            l1, l2, l3,
            finalTP,
            damageType,
            techniqueName: item.name || ''
          });

          if (proficiencies.has(key)) {
            const existing = proficiencies.get(key);
            existing.l1 = Math.max(existing.l1, l1);
            existing.l2 = Math.max(existing.l2, l2);
            existing.l3 = Math.max(existing.l3, l3);
          } else {
            proficiencies.set(key, {
              name: partDef.name,
              baseTP: partDef.base_tp || 0,
              op1TP: partDef.op_1_tp || 0,
              op2TP: partDef.op_2_tp || 0,
              op3TP: partDef.op_3_tp || 0,
              l1, l2, l3,
              damageType
            });
          }
        });
      }
    });
  }

  // Add TP from merged proficiencies (to account for any additional costs from merged levels)
  proficiencies.forEach(prof => {
    if (prof.op1TP !== undefined) { // From powers/techniques
      const rawTP = (prof.baseTP || 0) + (prof.op1TP || 0) * prof.l1 + (prof.op2TP || 0) * prof.l2 + (prof.op3TP || 0) * prof.l3;
      const finalTP = Math.floor(rawTP);
      mergedLogs.push({
        name: prof.name,
        baseTP: prof.baseTP,
        op1TP: prof.op1TP,
        op2TP: prof.op2TP,
        op3TP: prof.op3TP,
        l1: prof.l1,
        l2: prof.l2,
        l3: prof.l3,
        finalTP,
        damageType: prof.damageType
      });
      totalTP += finalTP;
    } else { // From armaments
      const optionTP = prof.optionLevel > 0 ? Math.floor(prof.optionTP * prof.optionLevel) : 0;
      const finalTP = prof.baseTP + optionTP;
      mergedLogs.push({
        name: prof.name,
        baseTP: prof.baseTP,
        optionTP: prof.optionTP,
        optionLevel: prof.optionLevel,
        finalTP,
        damageType: prof.damageType
      });
      totalTP += finalTP;
    }
  });

  // --- Adjust totalTP to only count unique part/property TP contributions ---
  // 1. Calculate the sum of all individual (non-unique) TP contributions
  let allIndividualTP = 0;
  armamentLogs.forEach(log => { allIndividualTP += log.finalTP; });
  powerLogs.forEach(log => { allIndividualTP += log.finalTP; });
  techniqueLogs.forEach(log => { allIndividualTP += log.finalTP; });

  // 2. Calculate the sum of all unique part/property TP contributions
  const uniqueTP = mergedLogs.reduce((sum, l) => sum + (l.finalTP || 0), 0);

  // 3. Adjust: Remove all individual TP, add back only unique TP
  const adjustedTP = uniqueTP;

  return adjustedTP;
}

/**
 * Adjust creature's total TP by subtracting spent TP.
 * Assumes creature has a base TP (e.g., from level or archetype).
 * @param {Object} creatureData - Creature data.
 * @param {number} baseTP - Creature's base TP.
 * @param {Array} itemPropertiesDb - Item properties database.
 * @param {Array} powerPartsDb - Power parts database.
 * @param {Array} techniquePartsDb - Technique parts database.
 * @returns {number} Adjusted total TP.
 */
export function getAdjustedCreatureTP(creatureData, baseTP, itemPropertiesDb, powerPartsDb, techniquePartsDb) {
  const spentTP = calculateCreatureTPSpent(creatureData, itemPropertiesDb, powerPartsDb, techniquePartsDb);
  return Math.max(0, baseTP - spentTP); // Prevent negative TP
}
