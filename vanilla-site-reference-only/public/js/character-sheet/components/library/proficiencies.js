import { getDatabase, ref, get } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js';
import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js';
import { getArchetypeAbilityScore } from '../../calculations.js';
import { waitForAuth } from '../../../core/firebase-init.js';
import { findByIdOrName } from '/js/shared/id-constants.js';

let powerPartsCache = null;
let techniquePartsCache = null;

// Load power parts (cached)
async function loadPowerParts() {
  if (powerPartsCache) return powerPartsCache;
  try {
    const database = getDatabase();
    const partsRef = ref(database, 'parts');
    const snapshot = await get(partsRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      powerPartsCache = Object.entries(data)
        .filter(([id, part]) => part.type && part.type.toLowerCase() === 'power')
        .map(([id, part]) => ({
          id,
          name: part.name || '',
          description: part.description || '',
          base_tp: parseFloat(part.base_tp) || 0,
          op_1_tp: parseFloat(part.op_1_tp) || 0,
          op_2_tp: parseFloat(part.op_2_tp) || 0,
          op_3_tp: parseFloat(part.op_3_tp) || 0
        }));
    }
  } catch (error) {
    console.error('Error loading power parts:', error);
  }
  return powerPartsCache || [];
}

// Load technique parts (cached)
async function loadTechniqueParts() {
  if (techniquePartsCache) return techniquePartsCache;
  try {
    const database = getDatabase();
    const partsRef = ref(database, 'parts');
    const snapshot = await get(partsRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      techniquePartsCache = Object.entries(data)
        .filter(([id, part]) => part.type && part.type.toLowerCase() === 'technique')
        .map(([id, part]) => ({
          id,
          name: part.name || '',
          description: part.description || '',
          base_tp: parseFloat(part.base_tp) || 0,
          op_1_tp: parseFloat(part.op_1_tp) || 0,
          op_2_tp: parseFloat(part.op_2_tp) || 0,
          op_3_tp: parseFloat(part.op_3_tp) || 0
        }));
    }
  } catch (error) {
    console.error('Error loading technique parts:', error);
  }
  return techniquePartsCache || [];
}

// Extract proficiencies from powers
async function extractPowerProficiencies(powers) {
  const profs = new Map();
  const partsDb = await loadPowerParts();
  powers.forEach(power => {
    if (!power.parts) return;
    power.parts.forEach(partData => {
      const partDef = findByIdOrName(partsDb, partData);
      if (!partDef) return;
      const lvl1 = partData.op_1_lvl || 0;
      const lvl2 = partData.op_2_lvl || 0;
      const lvl3 = partData.op_3_lvl || 0;
      const rawTP = (partDef.base_tp || 0) + (partDef.op_1_tp || 0) * lvl1 + (partDef.op_2_tp || 0) * lvl2 + (partDef.op_3_tp || 0) * lvl3;
      const finalTP = Math.floor(rawTP);
      if (finalTP <= 0) return;
      const key = partDef.name;
      if (profs.has(key)) {
        const ex = profs.get(key);
        ex.op1Lvl = Math.max(ex.op1Lvl, lvl1);
        ex.op2Lvl = Math.max(ex.op2Lvl, lvl2);
        ex.op3Lvl = Math.max(ex.op3Lvl, lvl3);
      } else {
        profs.set(key, {
          name: partDef.name,
          description: partDef.description || '',
          baseTP: partDef.base_tp || 0,
          op1Lvl: lvl1,
          op1TP: partDef.op_1_tp || 0,
          op2Lvl: lvl2,
          op2TP: partDef.op_2_tp || 0,
          op3Lvl: lvl3,
          op3TP: partDef.op_3_tp || 0
        });
      }
    });
  });
  return profs;
}

// Extract proficiencies from techniques
async function extractTechniqueProficiencies(techniques) {
  const profs = new Map();
  const partsDb = await loadTechniqueParts();
  techniques.forEach(tech => {
    if (!tech.parts) return;
    tech.parts.forEach(partData => {
      const partDef = findByIdOrName(partsDb, partData);
      if (!partDef) return;
      const lvl1 = partData.op_1_lvl || 0;
      const lvl2 = partData.op_2_lvl || 0;
      const lvl3 = partData.op_3_lvl || 0;
      const rawTP = (partDef.base_tp || 0) + (partDef.op_1_tp || 0) * lvl1 + (partDef.op_2_tp || 0) * lvl2 + (partDef.op_3_tp || 0) * lvl3;
      const finalTP = Math.floor(rawTP);
      if (finalTP <= 0) return;
      const key = partDef.name;
      if (profs.has(key)) {
        const ex = profs.get(key);
        ex.op1Lvl = Math.max(ex.op1Lvl, lvl1);
        ex.op2Lvl = Math.max(ex.op2Lvl, lvl2);
        ex.op3Lvl = Math.max(ex.op3Lvl, lvl3);
      } else {
        profs.set(key, {
          name: partDef.name,
          description: partDef.description || '',
          baseTP: partDef.base_tp || 0,
          op1Lvl: lvl1,
          op1TP: partDef.op_1_tp || 0,
          op2Lvl: lvl2,
          op2TP: partDef.op_2_tp || 0,
          op3Lvl: lvl3,
          op3TP: partDef.op_3_tp || 0
        });
      }
    });
  });
  return profs;
}

// Extract proficiencies from weapons/armor (using item_calc logic)
async function extractEquipmentProficiencies(weapons, armor) {
  const profs = new Map();
  // Load item properties (assuming cached or load here; for simplicity, assume available)
  // In character sheet, properties might be loaded elsewhere; for now, inline or assume.
  // Since character sheet doesn't load properties cache, we need to load it.
  // Add loadItemProperties here similar to library.js
  let itemPropertiesCache = null;
  async function loadItemProperties() {
    if (itemPropertiesCache) return itemPropertiesCache;
    try {
      const database = getDatabase();
      const propertiesRef = ref(database, 'properties');
      const snapshot = await get(propertiesRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        itemPropertiesCache = Object.entries(data).map(([id, prop]) => ({
          id,
          name: prop.name || '',
          description: prop.description || '',
          base_tp: parseFloat(prop.base_tp) || 0,
          op_1_tp: parseFloat(prop.op_1_tp) || 0
        }));
      }
    } catch (error) {
      console.error('Error loading item properties:', error);
    }
    return itemPropertiesCache || [];
  }

  // For weapons and armor, extract from properties
  const items = [...weapons, ...armor];
  const catalog = await loadItemProperties();
  items.forEach(item => {
    if (!item.properties) return;
    item.properties.forEach(propRef => {
      // Assume properties are loaded; in practice, load them.
      // For now, assume propRef has name, and we find it.
      // Since character sheet data has properties as names or objects, adapt.
      const propData = findByIdOrName(catalog, propRef);
      if (!propData) return;
      const baseTP = Math.floor(propData.base_tp || 0);
      const optionLevel = (typeof propRef === 'object' ? propRef.op_1_lvl : 0) || 0;
      const optionTP = optionLevel > 0 ? Math.floor((propData.op_1_tp || 0) * optionLevel) : 0;
      const totalTP = baseTP + optionTP;
      if (totalTP <= 0) return;

      let key = propData.name;
      let damageType = null;
      if (propData.name === 'Weapon Damage' && item.damage && Array.isArray(item.damage)) {
        const damageTypes = item.damage.filter(d => d && d.type && d.type !== 'none').map(d => d.type).join(', ');
        if (damageTypes) {
          damageType = damageTypes;
          key = `${propData.name}|${damageTypes}`;
        }
      }

      if (profs.has(key)) {
        const existing = profs.get(key);
        existing.op1Lvl = Math.max(existing.op1Lvl, optionLevel);
      } else {
        profs.set(key, {
          name: propData.name,
          description: propData.description || '',
          baseTP,
          op1Lvl: optionLevel,
          op1TP: propData.op_1_tp || 0,
          damageType
        });
      }
    });
  });
  return profs;
}

// waitForAuth imported from shared/firebase-init.js

// Add function to fetch full powers from user's library
async function fetchFullPowers(powerNames) {
  const user = await waitForAuth();
  if (!user) return [];
  const db = getFirestore();
  const powersRef = collection(db, 'users', user.uid, 'library');
  const snapshot = await getDocs(powersRef);
  const powers = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    if (powerNames.includes(data.name)) {
      powers.push(data);
    }
  });
  return powers;
}

// Add function to fetch full techniques from user's library
async function fetchFullTechniques(techniqueNames) {
  const user = await waitForAuth();
  if (!user) return [];
  const db = getFirestore();
  const techniquesRef = collection(db, 'users', user.uid, 'techniqueLibrary');
  const snapshot = await getDocs(techniquesRef);
  const techniques = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    if (techniqueNames.includes(data.name)) {
      techniques.push(data);
    }
  });
  return techniques;
}

// Add function to fetch full weapons/armor from user's library
async function fetchFullEquipment(equipmentNames, type) {
  const user = await waitForAuth();
  if (!user) return [];
  const db = getFirestore();
  const itemsRef = collection(db, 'users', user.uid, 'itemLibrary');
  const snapshot = await getDocs(itemsRef);
  const items = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.armamentType === type && equipmentNames.includes(data.name)) {
      items.push(data);
    }
  });
  return items;
}

export async function createProficienciesContent(charData) {
  const content = document.createElement('div');
  content.id = 'proficiencies-content';
  content.className = 'tab-content';

  // Fetch full data from user's library
  const powerNames = (charData.powers || []).map(p => typeof p === 'string' ? p : p.name);
  const techniqueNames = (charData.techniques || []).map(t => typeof t === 'string' ? t : t.name);
  const weaponNames = (charData.weapons || []).map(w => typeof w === 'string' ? w : w.name);
  const armorNames = (charData.armor || []).map(a => typeof a === 'string' ? a : a.name);

  const fullPowers = await fetchFullPowers(powerNames);
  const fullTechniques = await fetchFullTechniques(techniqueNames);
  const fullWeapons = await fetchFullEquipment(weaponNames, 'Weapon');
  const fullArmor = await fetchFullEquipment(armorNames, 'Armor');

  // Load all proficiencies using full data
  const powerProfs = await extractPowerProficiencies(fullPowers);
  const techniqueProfs = await extractTechniqueProficiencies(fullTechniques);
  const weaponProfs = await extractEquipmentProficiencies(fullWeapons, []);
  const armorProfs = await extractEquipmentProficiencies([], fullArmor);

  // --- Calculate total TP spent across all sections ---
  let allTP = 0;
  [powerProfs, techniqueProfs, weaponProfs, armorProfs].forEach(profs => {
    Array.from(profs.values()).forEach(prof => {
      const rawTP = (prof.baseTP || 0) +
        (prof.op1TP || 0) * (prof.op1Lvl || 0) +
        (prof.op2TP || 0) * (prof.op2Lvl || 0) +
        (prof.op3TP || 0) * (prof.op3Lvl || 0);
      allTP += Math.floor(rawTP);
    });
  });

  // --- Calculate Training Points ---
  // 22 + (archetype Ability * level) + (2 * (level -1)) - sum of all proficiencies
  const baseTP = 22;
  const level = Number(charData.level || charData.lvl || 1);
  const arch_abil = getArchetypeAbilityScore(charData);
  const trainingPoints = baseTP + (arch_abil * level) + (2 * (level - 1)) - allTP;

  // --- Training Points Box ---
  const tpBox = document.createElement('div');
  tpBox.style.cssText = `
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0 auto 24px auto;
    max-width: 320px;
    background: var(--bg-medium);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    padding: 16px 0 12px 0;
    font-size: 1.2em;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: var(--primary-blue);
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  `;
  tpBox.innerHTML = `Training Points: <span style="margin-left:10px;color:var(--primary-dark);font-size:1.3em;">${trainingPoints}</span>`;
  content.appendChild(tpBox);

  // Now, build sections
  const sections = [
    { title: 'Power Proficiencies', profs: powerProfs },
    { title: 'Technique Proficiencies', profs: techniqueProfs },
    { title: 'Weapon Proficiencies', profs: weaponProfs },
    { title: 'Armor Proficiencies', profs: armorProfs }
  ];

  sections.forEach(section => {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'proficiencies-section';

    // Calculate total TP for this section
    let totalTP = 0;
    Array.from(section.profs.values()).forEach(prof => {
      const rawTP = (prof.baseTP || 0) +
        (prof.op1TP || 0) * (prof.op1Lvl || 0) +
        (prof.op2TP || 0) * (prof.op2Lvl || 0) +
        (prof.op3TP || 0) * (prof.op3Lvl || 0);
      totalTP += Math.floor(rawTP);
    });

    // Add styled header row like inventory/other tabs, with total TP
    const header = document.createElement('div');
    header.className = 'library-table-header';
    header.style.gridTemplateColumns = '1fr 1fr';
    header.innerHTML = `
      <div>${section.title}</div>
      <div style="text-align:right;">
        TP${totalTP > 0 ? ` <span style="font-weight:normal;color:var(--primary-blue);margin-left:6px;">${totalTP}</span>` : ''}
      </div>
    `;
    sectionDiv.appendChild(header);

    if (section.profs.size === 0) {
      const emptyRow = document.createElement('div');
      emptyRow.style.cssText = 'padding:20px;text-align:center;color:var(--text-secondary);';
      emptyRow.textContent = 'No proficiencies';
      sectionDiv.appendChild(emptyRow);
    } else {
      // Flex container for chips
      const chipWrap = document.createElement('div');
      chipWrap.className = 'proficiency-chip-wrap';
      chipWrap.style.display = 'flex';
      chipWrap.style.flexWrap = 'wrap';
      chipWrap.style.gap = '8px';
      chipWrap.style.margin = '10px 0 18px 0';

      Array.from(section.profs.values()).forEach(prof => {
        const rawTP = (prof.baseTP || 0) +
          (prof.op1TP || 0) * (prof.op1Lvl || 0) +
          (prof.op2TP || 0) * (prof.op2Lvl || 0) +
          (prof.op3TP || 0) * (prof.op3Lvl || 0);
        const finalTP = Math.floor(rawTP);
        let text = prof.name;
        if (prof.damageType) text += ` (${prof.damageType})`;
        if (prof.op1Lvl > 0) text += ` (Level ${prof.op1Lvl})`;
        if (prof.op2Lvl > 0) text += ` (Opt2 ${prof.op2Lvl})`;
        if (prof.op3Lvl > 0) text += ` (Opt3 ${prof.op3Lvl})`;
        text += ` | TP: ${finalTP}`;
        const chip = document.createElement('div');
        chip.className = 'part-chip proficiency-chip';
        chip.title = prof.description;
        chip.textContent = text;
        chipWrap.appendChild(chip);
      });
      sectionDiv.appendChild(chipWrap);
    }
    content.appendChild(sectionDiv);
  });

  return content;
}
