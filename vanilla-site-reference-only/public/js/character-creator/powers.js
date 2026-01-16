import { saveCharacter } from './storage.js';
import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';
import { getDatabase, ref, get } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js';
import { getDefaultTrainingPoints } from './utils.js';
import { calculateTechniqueCosts, deriveTechniqueDisplay } from '../calculators/technique-calc.js';
import { calculatePowerCosts, derivePowerDisplay } from '../calculators/power-calc.js';
import { waitForAuth } from '../shared/firebase-init.js';
import { findByIdOrName } from '/js/shared/id-constants.js';

export let selectedPowersTechniques = [];
let powersInitialized = false;
let powerPartsCache = null;
let techniquePartsCache = null;
export let powersLibrary = [];
export let techniquesLibrary = [];

// waitForAuth imported from shared/firebase-init.js

// Load power parts from Realtime Database
async function loadPowerParts(database) {
  if (powerPartsCache) return powerPartsCache;
  
  try {
    const partsRef = ref(database, 'parts');
    const snapshot = await get(partsRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      powerPartsCache = Object.entries(data)
        .filter(([id, part]) => part.type && part.type.toLowerCase() === 'power')
        .map(([id, part]) => ({
          id: id,
          name: part.name || '',
          description: part.description || '',
          base_en: parseFloat(part.base_en) || 0,
          base_tp: parseFloat(part.base_tp) || 0,
          op_1_en: parseFloat(part.op_1_en) || 0,
          op_1_tp: parseFloat(part.op_1_tp) || 0,
          op_2_en: parseFloat(part.op_2_en) || 0,
          op_2_tp: parseFloat(part.op_2_tp) || 0,
          op_3_en: parseFloat(part.op_3_en) || 0,
          op_3_tp: parseFloat(part.op_3_tp) || 0,
          mechanic: part.mechanic === 'true' || part.mechanic === true,
          percentage: part.percentage === 'true' || part.percentage === true,
          duration: part.duration === 'true' || part.duration === true
        }));
      return powerPartsCache;
    }
  } catch (error) {
    console.error('Error loading power parts:', error);
  }
  return [];
}

// Load technique parts from Realtime Database
async function loadTechniqueParts(database) {
  if (techniquePartsCache) return techniquePartsCache;
  
  try {
    const partsRef = ref(database, 'parts');
    const snapshot = await get(partsRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      techniquePartsCache = Object.entries(data)
        .filter(([id, part]) => part.type && part.type.toLowerCase() === 'technique')
        .map(([id, part]) => ({
          id: id,
          name: part.name || '',
          description: part.description || '',
          base_en: parseFloat(part.base_en) || 0,
          base_tp: parseFloat(part.base_tp) || 0,
          op_1_en: parseFloat(part.op_1_en) || 0,
          op_1_tp: parseFloat(part.op_1_tp) || 0,
          op_2_en: parseFloat(part.op_2_en) || 0,
          op_2_tp: parseFloat(part.op_2_tp) || 0,
          op_3_en: parseFloat(part.op_3_en) || 0,
          op_3_tp: parseFloat(part.op_3_tp) || 0,
          mechanic: part.mechanic === 'true' || part.mechanic === true,
          percentage: part.percentage === 'true' || part.percentage === true
        }));
      return techniquePartsCache;
    }
  } catch (error) {
    console.error('Error loading technique parts:', error);
  }
  return [];
}

// Fetch powers from user's library
async function fetchPowersFromLibrary() {
  const user = await waitForAuth();
  if (!user) {
    console.log('No user authenticated, skipping power fetch');
    return [];
  }

  try {
    const database = getDatabase();
    const powerPartsDb = await loadPowerParts(database);
    if (!powerPartsDb || powerPartsDb.length === 0) return [];

    const db = getFirestore();
    const powersRef = collection(db, 'users', user.uid, 'library');
    const snapshot = await getDocs(powersRef);
    
    const powers = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const display = derivePowerDisplay(data, powerPartsDb);
      
      powers.push({
        id: docSnap.id,
        name: display.name,
        description: display.description,
        parts: data.parts || [],
        totalEnergy: display.energy, // Already rounded up by derivePowerDisplay
        totalTP: display.tp,
        display // keep full display for chips
      });
    });
    
    return powers;
  } catch (error) {
    console.error('Error fetching powers:', error);
    return [];
  }
}

// Fetch techniques from user's library
async function fetchTechniquesFromLibrary() {
  const user = await waitForAuth();
  if (!user) return [];
  try {
    const database = getDatabase();
    const techniquePartsDb = await loadTechniqueParts(database);
    if (!techniquePartsDb.length) return [];
    const db = getFirestore();
    const techniquesRef = collection(db, 'users', user.uid, 'techniqueLibrary');
    const snapshot = await getDocs(techniquesRef);
    const techniques = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const parts = Array.isArray(data.parts) ? data.parts.map(p => ({
        name: p.name,
        op_1_lvl: p.op_1_lvl || 0,
        op_2_lvl: p.op_2_lvl || 0,
        op_3_lvl: p.op_3_lvl || 0
      })) : [];
      const display = deriveTechniqueDisplay({ ...data, parts }, techniquePartsDb);
      techniques.push({
        id: docSnap.id,
        name: display.name,
        description: display.description,
        parts, // standardized
        weapon: data.weapon,
        damage: data.damage,
        totalEnergy: display.energy, // Already rounded up by deriveTechniqueDisplay
        totalTP: display.tp,
        display
      });
    });
    return techniques;
  } catch (e) {
    console.error('Error fetching techniques:', e);
    return [];
  }
}

function getInnateEnergyMax() {
  const char = window.character || {};
  const archetype = char.archetype || {};
  
  if (archetype.type === 'martial') return 0;
  if (archetype.type === 'powered-martial') return 6;
  if (archetype.type === 'power') return 8;
  return 0;
}

function populatePowers() {
  const list = document.getElementById('powers-list');
  if (!list) return;
  
  list.innerHTML = '';
  const searchInput = document.getElementById('powers-search');
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

  let powers = powersLibrary.filter(power => {
    if (searchTerm && !power.name.toLowerCase().includes(searchTerm) && !(power.description && power.description.toLowerCase().includes(searchTerm))) return false;
    return true;
  });

  powers.forEach(power => {
    const selected = selectedPowersTechniques.includes(power.id);
    const partChipsHTML = power.display ? power.display.partChipsHTML : '';
    
    const row = document.createElement('tr');
    if (selected) row.classList.add('selected-equipment');
    row.dataset.itemId = power.id;
    
    row.innerHTML = `
      <td><span class="expand-icon-equipment">▶</span>${power.name}</td>
      <td>${power.totalEnergy}</td>
      <td>${power.totalTP}</td>
      <td><button class="equipment-add-btn ${selected ? 'selected' : ''}" data-id="${power.id}">${selected ? '✓' : '+'}</button></td>
    `;
    
    const detailsRow = document.createElement('tr');
    detailsRow.className = 'equipment-details-row';
    detailsRow.innerHTML = `
      <td colspan="4" class="equipment-details-cell">
        ${power.description ? `<div class="equipment-description">${power.description}</div>` : ''}
        ${partChipsHTML ? `
          <h4 style="margin:0 0 8px 0;color:var(--primary);">Parts & Proficiencies</h4>
          <div class="equipment-properties-list">${partChipsHTML}</div>` : ''
        }
      </td>
    `;
    
    row.addEventListener('click', (e) => {
      if (e.target.classList.contains('equipment-add-btn')) return;
      row.classList.toggle('expanded-equipment');
      detailsRow.classList.toggle('show');
    });
    
    const btn = row.querySelector('.equipment-add-btn');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePowerTechnique(power.id);
    });
    
    list.appendChild(row);
    list.appendChild(detailsRow);
  });
}

function populateTechniques() {
  const list = document.getElementById('techniques-list');
  if (!list) return;
  
  list.innerHTML = '';
  const searchInput = document.getElementById('techniques-search');
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

  let techniques = techniquesLibrary.filter(tech => {
    if (searchTerm && !tech.name.toLowerCase().includes(searchTerm) && !(tech.description && tech.description.toLowerCase().includes(searchTerm))) return false;
    return true;
  });

  techniques.forEach(tech => {
    const selected = selectedPowersTechniques.includes(tech.id);
    
    const row = document.createElement('tr');
    if (selected) row.classList.add('selected-equipment');
    row.dataset.itemId = tech.id;
    
    const damageStr = tech.display ? tech.display.damageStr : '';
    const partChipsHTML = tech.display ? tech.display.partChipsHTML : '';
    row.innerHTML = `
      <td><span class="expand-icon-equipment">▶</span>${tech.name}</td>
      <td>${tech.totalEnergy}</td>
      <td>${tech.totalTP}</td>
      <td>${tech.weapon?.name || 'Unarmed'}</td>
      <td>${damageStr}</td>
      <td><button class="equipment-add-btn ${selected ? 'selected' : ''}" data-id="${tech.id}">${selected ? '✓' : '+'}</button></td>
    `;

    const detailsRow = document.createElement('tr');
    detailsRow.className = 'equipment-details-row';
    detailsRow.innerHTML = `
      <td colspan="6" class="equipment-details-cell">
        ${tech.description ? `<div class="equipment-description">${tech.description}</div>` : ''}
        ${partChipsHTML ? `
          <h4 style="margin:0 0 8px 0;color:var(--primary);">Parts & Proficiencies</h4>
          <div class="equipment-properties-list">${partChipsHTML}</div>` : ''
        }
      </td>
    `;
    
    row.addEventListener('click', (e) => {
      if (e.target.classList.contains('equipment-add-btn')) return;
      row.classList.toggle('expanded-equipment');
      detailsRow.classList.toggle('show');
    });
    
    const btn = row.querySelector('.equipment-add-btn');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePowerTechnique(tech.id);
    });
    
    list.appendChild(row);
    list.appendChild(detailsRow);
  });
}

function togglePowerTechnique(itemId) {
  if (selectedPowersTechniques.includes(itemId)) {
    selectedPowersTechniques = selectedPowersTechniques.filter(id => id !== itemId);
  } else {
    selectedPowersTechniques.push(itemId);
  }
  
  updatePowersDisplay();
  if (!window.character) window.character = {};
  window.character.powersTechniques = selectedPowersTechniques;
  saveCharacter();
  
  populatePowers();
  populateTechniques();
  updateTrainingPointsDisplay(); // <-- Ensure TP updates immediately
}

// Extract and merge proficiencies from selected powers/techniques
function extractPowersProficiencies() {
  const proficiencies = new Map();
  selectedPowersTechniques.forEach(id => {
    const power = powersLibrary.find(p => p.id === id);
    const tech = techniquesLibrary.find(t => t.id === id);
    const item = power || tech;
    if (!item || !item.parts) return;
    const partsDb = power ? powerPartsCache : techniquePartsCache;

    item.parts.forEach(partData => {
      const partDef = findByIdOrName(partsDb, partData);
      if (!partDef) return;
      const lvl1 = partData.op_1_lvl || 0;
      const lvl2 = partData.op_2_lvl || 0;
      const lvl3 = partData.op_3_lvl || 0;
      const rawTP =
        (partDef.base_tp || 0) +
        (partDef.op_1_tp || 0) * lvl1 +
        (partDef.op_2_tp || 0) * lvl2 +
        (partDef.op_3_tp || 0) * lvl3;
      const finalTP = Math.floor(rawTP);
      if (finalTP <= 0) return;

      const key = partDef.name;
      if (proficiencies.has(key)) {
        const ex = proficiencies.get(key);
        ex.op1Lvl = Math.max(ex.op1Lvl, lvl1);
        ex.op2Lvl = Math.max(ex.op2Lvl, lvl2);
        ex.op3Lvl = Math.max(ex.op3Lvl, lvl3);
      } else {
        proficiencies.set(key, {
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
  return proficiencies;
}

// Total TP from proficiencies
export function getTotalPowersTP() {
  const profs = extractPowersProficiencies();
  let total = 0;
  profs.forEach(p => {
    const rawTP =
      (p.baseTP || 0) +
      (p.op1TP || 0) * p.op1Lvl +
      (p.op2TP || 0) * p.op2Lvl +
      (p.op3TP || 0) * p.op3Lvl;
    total += Math.floor(rawTP);
  });
  return total;
}

// Update proficiencies display
function updatePowersProficienciesDisplay() {
  const profList = document.getElementById('powers-proficiencies-list');
  if (!profList) return;

  const profs = extractPowersProficiencies();
  if (profs.size === 0) {
    profList.innerHTML = '<p class="no-skills-message">No proficiencies from selected powers/techniques</p>';
    const header = document.querySelector('#content-powers .section-header[data-section="powers-proficiencies"] h3');
    if (header) header.innerHTML = 'Proficiencies <span style="margin-left:auto;font-weight:normal;color:#666;">Total TP Cost: 0</span>';
    return;
  }

  let totalTP = 0;
  const chips = Array.from(profs.values()).map(p => {
    const rawTP =
      (p.baseTP || 0) +
      (p.op1TP || 0) * p.op1Lvl +
      (p.op2TP || 0) * p.op2Lvl +
      (p.op3TP || 0) * p.op3Lvl;
    const finalTP = Math.floor(rawTP);
    totalTP += finalTP;

    let text = p.name;
    if (p.op1Lvl > 0) text += ` (Opt1 ${p.op1Lvl})`;
    if (p.op2Lvl > 0) text += ` (Opt2 ${p.op2Lvl})`;
    if (p.op3Lvl > 0) text += ` (Opt3 ${p.op3Lvl})`;
    text += ` | TP: ${finalTP}`;
    return `<div class="equipment-property-chip proficiency-chip" title="${p.description}">${text}</div>`;
  }).join('');

  profList.innerHTML = chips;
  const header = document.querySelector('#content-powers .section-header[data-section="powers-proficiencies"] h3');
  if (header) header.innerHTML = `Proficiencies <span style="margin-left:auto;font-weight:normal;color:#666;">Total TP Cost: ${totalTP}</span>`;
  if (window.updateTrainingPointsDisplay) window.updateTrainingPointsDisplay();
}

function getSpentEnergy() {
  return selectedPowersTechniques.reduce((sum, id) => {
    const power = powersLibrary.find(p => p.id === id);
    const tech = techniquesLibrary.find(t => t.id === id);
    const item = power || tech;
    return sum + (item ? (item.totalEnergy || 0) : 0);
  }, 0);
}

function updatePowersDisplay() {
  const innateMax = getInnateEnergyMax();
  
  const maxEl = document.getElementById('innate-energy-max');
  if (maxEl) maxEl.textContent = innateMax;
  
  updatePowersTechniquesBonusDisplay();
  updatePowersProficienciesDisplay();
}

function updatePowersTechniquesBonusDisplay() {
  const bonusList = document.getElementById('powers-techniques-bonus-list');
  if (!bonusList) return;
  
  if (selectedPowersTechniques.length === 0) {
    bonusList.innerHTML = '<p class="no-skills-message">No powers or techniques selected yet</p>';
    updateTrainingPointsDisplay(); // Ensure TP updates when all removed
    return;
  }

  bonusList.innerHTML = selectedPowersTechniques.map(id => {
    const power = powersLibrary.find(p => p.id === id);
    const tech = techniquesLibrary.find(t => t.id === id);
    const item = power || tech;
    if (!item) return '';
    const energyInt = item.totalEnergy; // Already a whole number, no need for Math.ceil
    const type = power ? 'Power' : 'Technique';
    return `
      <div class="skill-bonus-item">
        <span class="skill-bonus-name">${item.name}</span>
        <span class="skill-fixed-ability">Energy: ${energyInt} | Type: ${type}</span>
        <button class="equipment-remove-btn" data-id="${id}" title="Remove ${type.toLowerCase()}">×</button>
      </div>
    `;
  }).filter(Boolean).join('');

  bonusList.querySelectorAll('.equipment-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemId = btn.dataset.id;
      selectedPowersTechniques = selectedPowersTechniques.filter(id => id !== itemId);
      updatePowersDisplay();
      if (!window.character) window.character = {};
      window.character.powersTechniques = selectedPowersTechniques;
      saveCharacter();
      populatePowers();
      populateTechniques();
      updateTrainingPointsDisplay(); // <-- Ensure TP updates immediately
    });
  });
}

// Update training points display
function updateTrainingPointsDisplay() {
  const powersTP = getTotalPowersTP();
  
  // Import equipment TP if available
  import('./equipment.js').then(mod => {
    const equipmentTP = mod.getTotalEquipmentTP ? mod.getTotalEquipmentTP() : 0;
    const totalSpent = equipmentTP + powersTP;
    const remaining = getDefaultTrainingPoints() - totalSpent;
    const trainingPointsEl = document.getElementById('training-points');
    if (trainingPointsEl) trainingPointsEl.textContent = remaining;
    const powersTrainingPointsEl = document.getElementById('powers-training-points');
    if (powersTrainingPointsEl) powersTrainingPointsEl.textContent = remaining;
  }).catch(() => {
    // Equipment module not loaded yet
    const remaining = getDefaultTrainingPoints() - powersTP;
    const powersTrainingPointsEl = document.getElementById('powers-training-points');
    if (powersTrainingPointsEl) powersTrainingPointsEl.textContent = remaining;
  });
}

async function initPowersUI() {
  if (!powersInitialized) {
    // Powers header
    const powersHeader = document.querySelector('#content-powers .section-header[data-section="powers"]');
    if (powersHeader) {
      const newPowersHeader = powersHeader.cloneNode(true);
      powersHeader.parentNode.replaceChild(newPowersHeader, powersHeader);
      
      newPowersHeader.addEventListener('click', () => {
        const body = document.getElementById('powers-body');
        const arrow = newPowersHeader.querySelector('.toggle-arrow');
        if (body && arrow) {
          body.classList.toggle('open');
          arrow.classList.toggle('open');
        }
      });
    }

    // Techniques header
    const techniquesHeader = document.querySelector('#content-powers .section-header[data-section="techniques"]');
    if (techniquesHeader) {
      const newTechniquesHeader = techniquesHeader.cloneNode(true);
      techniquesHeader.parentNode.replaceChild(newTechniquesHeader, techniquesHeader);
      
      newTechniquesHeader.addEventListener('click', () => {
        const body = document.getElementById('techniques-body');
        const arrow = newTechniquesHeader.querySelector('.toggle-arrow');
        if (body && arrow) {
          body.classList.toggle('open');
          arrow.classList.toggle('open');
        }
      });
    }

    // Powers Proficiencies header
    const powersProfHeader = document.querySelector('#content-powers .section-header[data-section="powers-proficiencies"]');
    if (powersProfHeader) {
      const newPowersProfHeader = powersProfHeader.cloneNode(true);
      powersProfHeader.parentNode.replaceChild(newPowersProfHeader, powersProfHeader);
      
      newPowersProfHeader.addEventListener('click', () => {
        const body = document.getElementById('powers-proficiencies-body');
        const arrow = newPowersProfHeader.querySelector('.toggle-arrow');
        if (body && arrow) {
          body.classList.toggle('open');
          arrow.classList.toggle('open');
        }
      });
    }

    // Search inputs
    const powersSearchInput = document.getElementById('powers-search');
    if (powersSearchInput) {
      const newPowersSearchInput = powersSearchInput.cloneNode(true);
      powersSearchInput.parentNode.replaceChild(newPowersSearchInput, powersSearchInput);
      newPowersSearchInput.addEventListener('keyup', populatePowers);
    }

    const techniquesSearchInput = document.getElementById('techniques-search');
    if (techniquesSearchInput) {
      const newTechniquesSearchInput = techniquesSearchInput.cloneNode(true);
      techniquesSearchInput.parentNode.replaceChild(newTechniquesSearchInput, techniquesSearchInput);
      newTechniquesSearchInput.addEventListener('keyup', populateTechniques);
    }

    powersInitialized = true;
  }

  console.log('Waiting for authentication...');
  await waitForAuth();
  
  console.log('Loading powers and techniques from library...');
  powersLibrary = await fetchPowersFromLibrary();
  techniquesLibrary = await fetchTechniquesFromLibrary();

  // Open sections by default
  const powersBody = document.getElementById('powers-body');
  const powersArrow = document.querySelector('#content-powers .section-header[data-section="powers"] .toggle-arrow');
  if (powersBody) powersBody.classList.add('open');
  if (powersArrow) powersArrow.classList.add('open');

  const techniquesBody = document.getElementById('techniques-body');
  const techniquesArrow = document.querySelector('#content-powers .section-header[data-section="techniques"] .toggle-arrow');
  if (techniquesBody) techniquesBody.classList.add('open');
  if (techniquesArrow) techniquesArrow.classList.add('open');

  // Open proficiencies section by default
  const powersProfBody = document.getElementById('powers-proficiencies-body');
  const powersProfArrow = document.querySelector('#content-powers .section-header[data-section="powers-proficiencies"] .toggle-arrow');
  if (powersProfBody) powersProfBody.classList.add('open');
  if (powersProfArrow) powersProfArrow.classList.add('open');

  console.log(`Populating UI with ${powersLibrary.length} powers, ${techniquesLibrary.length} techniques`);
  populatePowers();
  populateTechniques();
  updatePowersTechniquesBonusDisplay();
  updatePowersProficienciesDisplay();
  updatePowersDisplay();
  updateTrainingPointsDisplay(); // NEW
}

document.querySelector('.tab[data-tab="powers"]')?.addEventListener('click', async () => {
  await initPowersUI();
});

export function restorePowersTechniques() {
  if (window.character?.powersTechniques) {
    selectedPowersTechniques = window.character.powersTechniques;
  }
  initPowersUI();
}
