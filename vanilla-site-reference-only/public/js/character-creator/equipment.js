import { saveCharacter } from './storage.js';
import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';
import { getDatabase, ref, get } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js';
import { getDefaultTrainingPoints } from './utils.js';
import {
  calculateItemCosts,
  calculateCurrencyCostAndRarity,
  formatDamage,
  formatRange,
  extractProficiencies,
  formatProficiencyChip,
  deriveItemDisplay
} from '../calculators/item-calc.js';
import { waitForAuth } from '../shared/firebase-init.js';
import { PROPERTY_IDS, findByIdOrName } from '/js/shared/id-constants.js';

export let selectedEquipment = [];
export let selectedEquipmentQuantities = {}; // { id: quantity }
let equipmentInitialized = false;
let itemPropertiesCache = null;
// NEW: export these libraries for other modules
export let weaponLibrary = [];
export let armorLibrary = [];
export let generalEquipment = [];

// waitForAuth imported from shared/firebase-init.js

async function loadItemProperties(database) {
  if (itemPropertiesCache) return itemPropertiesCache;
  
  try {
    const propertiesRef = ref(database, 'properties');
    const snapshot = await get(propertiesRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      itemPropertiesCache = Object.entries(data).map(([id, prop]) => ({
        id: id,
        name: prop.name || '',
        description: prop.description || '',
        base_ip: parseFloat(prop.base_ip) || 0,
        base_tp: parseFloat(prop.base_tp) || 0,
        base_c: parseFloat(prop.base_c) || 0,
        op_1_desc: prop.op_1_desc || '',
        op_1_ip: parseFloat(prop.op_1_ip) || 0,
        op_1_tp: parseFloat(prop.op_1_tp) || 0,
        op_1_c: parseFloat(prop.op_1_c) || 0,
        type: prop.type ? prop.type.charAt(0).toUpperCase() + prop.type.slice(1) : 'Weapon'
      }));
      return itemPropertiesCache;
    }
  } catch (error) {
    console.error('Error loading properties:', error);
  }
  return [];
}

function getArmamentMax() {
  const char = window.character || {};
  const archetype = char.archetype || {};
  let max = 4;
  
  if (archetype.type === 'powered-martial') {
    max = 8;
  } else if (archetype.type === 'martial') {
    max = 16;
  }
  
  return max;
}

function getEquipmentQuantity(id) {
  return selectedEquipmentQuantities[id] || 1;
}

function setEquipmentQuantity(id, qty) {
  selectedEquipmentQuantities[id] = Math.max(1, qty);
}

function populateWeapons() {
  const list = document.getElementById('weapons-list');
  if (!list) return;
  list.innerHTML = '';

  const searchInput = document.getElementById('weapons-search');
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  const availableCurrency = 200 - getSpentCurrency();
  const armamentMax = getArmamentMax();

  let weapons = weaponLibrary.filter(weapon => {
    if (searchTerm && !weapon.name.toLowerCase().includes(searchTerm) && !(weapon.description && weapon.description.toLowerCase().includes(searchTerm))) return false;
    return true;
  });

  weapons.forEach(weapon => {
    const selected = selectedEquipment.includes(weapon.id);
    const price = Math.ceil(weapon.currencyCost ?? weapon.goldCost ?? 0);
    const canAfford = price * getEquipmentQuantity(weapon.id) <= availableCurrency || selected;
    const exceedsTP = (weapon.totalBP || 0) * getEquipmentQuantity(weapon.id) > armamentMax;
    const canAdd = canAfford && (!exceedsTP || selected);

    // Main row
    const row = document.createElement('tr');
    if (selected) row.classList.add('selected-equipment');
    row.dataset.itemId = weapon.id;

    // Damage
    let damageStr = 'N/A';
    if (weapon.damage && Array.isArray(weapon.damage)) {
      damageStr = weapon.damage
        .filter(d => d && d.amount && d.size && d.type && d.type !== 'none')
        .map(d => `${d.amount}d${d.size} ${d.type}`)
        .join(', ');
    }
    
    // Range
    let rangeStr = weapon.range ? (weapon.range === 0 ? 'Melee' : `${weapon.range} spaces`) : 'Melee';
    
    // Properties & Proficiencies (prefer precomputed proficiencies)
    let propsStr = '';
    if (weapon.itemParts && Array.isArray(weapon.itemParts)) {
      propsStr = weapon.itemParts.map(p => {
        const propData = itemPropertiesCache?.find(prop => prop.id === p.id || prop.name === p.name);
        return propData ? `<span class="equipment-property">${propData.name}</span>` : '';
      }).filter(Boolean).join(' ');
    }
    
    row.innerHTML = `
      <td><span class="expand-icon-equipment">▶</span>${weapon.name}</td>
      <td class="equipment-damage">${damageStr}</td>
      <td class="equipment-range">${rangeStr}</td>
      <td>${propsStr || 'None'}</td>
      <td>${weapon.totalBP || 0}</td>
      <td>${price}</td>
      <td>${weapon.rarity}</td>
      <td>
        <button class="equipment-add-btn ${selected ? 'selected' : ''}" data-id="${weapon.id}" ${!canAdd ? 'disabled' : ''} title="${exceedsTP && !selected ? 'Exceeds Armament Proficiency Max' : ''}">${selected ? '✓' : '+'}</button>
      </td>
    `;

    // Details row with cute quantity controls
    const detailsRow = document.createElement('tr');
    detailsRow.className = 'equipment-details-row';
    detailsRow.innerHTML = `
      <td colspan="8" class="equipment-details-cell">
        ${weapon.description ? `<div class="equipment-description">${weapon.description}</div>` : ''}
        <div style="margin-bottom:12px;">
          <label style="font-weight:500;">Quantity:</label>
          <span class="control" style="display:inline-flex;align-items:center;gap:8px;">
            <button class="qty-dec" data-id="${weapon.id}" style="width:32px;height:32px;border-radius:50%;background:#eee;border:1px solid #ccc;font-size:1.2em;cursor:pointer;">-</button>
            <span class="qty-value" id="weapon-qty-${weapon.id}" style="display:inline-block;width:32px;text-align:center;font-size:1.2em;font-weight:600;background:#f7f7f7;border-radius:8px;">${getEquipmentQuantity(weapon.id)}</span>
            <button class="qty-inc" data-id="${weapon.id}" style="width:32px;height:32px;border-radius:50%;background:#eee;border:1px solid #ccc;font-size:1.2em;cursor:pointer;">+</button>
          </span>
        </div>
        ${weapon.itemParts && weapon.itemParts.length > 0 ? `
          <h4 style="margin: 0 0 8px 0; color: var(--primary);">Properties & Proficiencies</h4>
          <div class="equipment-properties-list">
            ${weapon.proficiencies && weapon.proficiencies.length
              ? weapon.proficiencies.map(p => {
                  const chip = formatProficiencyChip(p);
                  const chipClass = p.totalTP > 0 ? 'equipment-property-chip proficiency-chip' : 'equipment-property-chip';
                  return `<div class="${chipClass}" title="${p.description}">${chip}</div>`;
                }).join('')
              : weapon.itemParts.map(p => {
                  const propData = itemPropertiesCache?.find(prop => prop.id === p.id || prop.name === p.name);
                  if (!propData) return '';
                  const baseTP = Math.round(propData.base_tp || 0);
                  const optionLevel = p.op_1_lvl || 0;
                  const optionTP = optionLevel > 0 ? Math.round((propData.op_1_tp || 0) * optionLevel) : 0;
                  const totalTP = baseTP + optionLevel * (propData.op_1_tp || 0);
                  let text = propData.name;
                  if (optionLevel > 0) text += ` (Level ${optionLevel})`;
                  if (totalTP > 0) {
                    let tpText = ` | TP: ${baseTP}`;
                    if (optionTP > 0) tpText += ` + ${optionTP}`;
                    text += tpText;
                  }
                  const chipClass = totalTP > 0 ? 'equipment-property-chip proficiency-chip' : 'equipment-property-chip';
                  return `<div class="${chipClass}" title="${propData.description}">${text}</div>`;
                }).join('')
            }
          </div>
        ` : ''}
      </td>
    `;
    
    // Toggle expand on row click (but not button)
    row.addEventListener('click', (e) => {
      if (e.target.classList.contains('equipment-add-btn')) return;
      row.classList.toggle('expanded-equipment');
      detailsRow.classList.toggle('show');
    });
    
    // Add button click
    const btn = row.querySelector('.equipment-add-btn');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (canAdd) {
        toggleEquipment(weapon.id, availableCurrency, weapon.currencyCost ?? weapon.goldCost ?? 0, 'weapon');
      }
    });
    
    // Quantity controls
    detailsRow.querySelector('.qty-dec').addEventListener('click', () => {
      setEquipmentQuantity(weapon.id, getEquipmentQuantity(weapon.id) - 1);
      document.getElementById(`weapon-qty-${weapon.id}`).textContent = getEquipmentQuantity(weapon.id);
      updateEquipmentCurrency();
    });
    detailsRow.querySelector('.qty-inc').addEventListener('click', () => {
      setEquipmentQuantity(weapon.id, getEquipmentQuantity(weapon.id) + 1);
      document.getElementById(`weapon-qty-${weapon.id}`).textContent = getEquipmentQuantity(weapon.id);
      updateEquipmentCurrency();
    });

    list.appendChild(row);
    list.appendChild(detailsRow);
  });
}

function populateArmor() {
  const list = document.getElementById('armor-list');
  if (!list) return;
  
  list.innerHTML = '';
  const searchInput = document.getElementById('armor-search');
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  const availableCurrency = 200 - getSpentCurrency();
  const armamentMax = getArmamentMax();

  let armor = armorLibrary.filter(item => {
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm) && !(item.description && item.description.toLowerCase().includes(searchTerm))) return false;
    return true;
  });

  armor.forEach(armorItem => {
    const selected = selectedEquipment.includes(armorItem.id);
    const price = Math.ceil(armorItem.currencyCost ?? armorItem.goldCost ?? 0);
    const canAfford = price <= availableCurrency || selected;
    const exceedsTP = (armorItem.totalBP || 0) > armamentMax;
    const canAdd = canAfford && (!exceedsTP || selected);
    
    // Main row
    const row = document.createElement('tr');
    if (selected) row.classList.add('selected-equipment');
    row.dataset.itemId = armorItem.id;
    
    // Damage Reduction
    let drStr = armorItem.damageReduction || 'N/A';
    
    // Properties
    let propsStr = '';
    if (armorItem.itemParts && Array.isArray(armorItem.itemParts)) {
      propsStr = armorItem.itemParts.map(p => {
        const propData = itemPropertiesCache?.find(prop => prop.id === p.id || prop.name === p.name);
        return propData ? `<span class="equipment-property">${propData.name}</span>` : '';
      }).filter(Boolean).join(' ');
    }
    
    row.innerHTML = `
      <td><span class="expand-icon-equipment">▶</span>${armorItem.name}</td>
      <td>${drStr}</td>
      <td>${propsStr || 'None'}</td>
      <td>${armorItem.totalBP || 0}</td>
      <td>${price}</td>
      <td>${armorItem.rarity}</td>
      <td><button class="equipment-add-btn ${selected ? 'selected' : ''}" data-id="${armorItem.id}" ${!canAdd ? 'disabled' : ''} title="${exceedsTP && !selected ? 'Exceeds Armament Proficiency Max' : ''}">${selected ? '✓' : '+'}</button></td>
    `;
    
    // Details row
    const detailsRow = document.createElement('tr');
    detailsRow.className = 'equipment-details-row';
    detailsRow.innerHTML = `
      <td colspan="7" class="equipment-details-cell">
        ${armorItem.description ? `<div class="equipment-description">${armorItem.description}</div>` : ''}
        ${armorItem.itemParts && armorItem.itemParts.length > 0 ? `
          <h4 style="margin: 0 0 8px 0; color: var(--primary);">Properties & Proficiencies</h4>
          <div class="equipment-properties-list">
            ${armorItem.proficiencies && armorItem.proficiencies.length
              ? armorItem.proficiencies.map(p => {
                  const chip = formatProficiencyChip(p);
                  const chipClass = p.totalTP > 0 ? 'equipment-property-chip proficiency-chip' : 'equipment-property-chip';
                  return `<div class="${chipClass}" title="${p.description}">${chip}</div>`;
                }).join('')
              : armorItem.itemParts.map(p => {
                  const propData = itemPropertiesCache?.find(prop => prop.id === p.id || prop.name === p.name);
                  if (!propData) return '';
                  const baseTP = Math.round(propData.base_tp || 0);
                  const optionLevel = p.op_1_lvl || 0;
                  const optionTP = optionLevel > 0 ? Math.round((propData.op_1_tp || 0) * optionLevel) : 0;
                  const totalTP = baseTP + optionLevel * (propData.op_1_tp || 0);
                  let text = propData.name;
                  if (optionLevel > 0) text += ` (Level ${optionLevel})`;
                  if (totalTP > 0) {
                    let tpText = ` | TP: ${baseTP}`;
                    if (optionTP > 0) tpText += ` + ${optionTP}`;
                    text += tpText;
                  }
                  const chipClass = totalTP > 0 ? 'equipment-property-chip proficiency-chip' : 'equipment-property-chip';
                  return `<div class="${chipClass}" title="${propData.description}">${text}</div>`;
                }).join('')
            }
          </div>
        ` : ''}
      </td>
    `;
    
    // Toggle expand on row click (but not button)
    row.addEventListener('click', (e) => {
      if (e.target.classList.contains('equipment-add-btn')) return;
      row.classList.toggle('expanded-equipment');
      detailsRow.classList.toggle('show');
    });
    
    // Add button click
    const btn = row.querySelector('.equipment-add-btn');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (canAdd) {
        toggleEquipment(armorItem.id, availableCurrency, armorItem.currencyCost ?? armorItem.goldCost ?? 0, 'armor');
      }
    });
    
    list.appendChild(row);
    list.appendChild(detailsRow);
  });
}

function populateGeneralEquipment() {
  const list = document.getElementById('equipment-list');
  if (!list) return;
  
  list.innerHTML = '';
  const searchInput = document.getElementById('equipment-search');
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  const availableCurrency = 200 - getSpentCurrency();

  let equipment = generalEquipment.filter(item => {
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm) && !(item.description && item.description.toLowerCase().includes(searchTerm))) return false;
    return true;
  });

  equipment.forEach(equipItem => {
    const selected = selectedEquipment.includes(equipItem.id);
    const canAfford = (equipItem.currency * getEquipmentQuantity(equipItem.id)) <= availableCurrency || selected;
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'feat-item';
    if (selected) itemDiv.classList.add('selected-feat');
    
    itemDiv.innerHTML = `
      <div class="feat-header">
        <h4>${equipItem.name}</h4>
        <span class="feat-arrow">▼</span>
      </div>
      <div class="feat-body">
        <p>${equipItem.description || 'No description'}</p>
        <div class="equipment-details">
          <div><strong>Category:</strong> ${equipItem.category || 'N/A'}</div>
          <div><strong>Currency:</strong> ${equipItem.currency || 0}</div>
          <div><strong>Rarity:</strong> ${equipItem.rarity || 'Common'}</div>
        </div>
        <div style="margin-bottom:12px;">
          <label style="font-weight:500;">Quantity:</label>
          <span class="control" style="display:inline-flex;align-items:center;gap:8px;">
            <button class="qty-dec" data-id="${equipItem.id}" style="width:32px;height:32px;border-radius:50%;background:#eee;border:1px solid #ccc;font-size:1.2em;cursor:pointer;">-</button>
            <span class="qty-value" id="equip-qty-${equipItem.id}" style="display:inline-block;width:32px;text-align:center;font-size:1.2em;font-weight:600;background:#f7f7f7;border-radius:8px;">${getEquipmentQuantity(equipItem.id)}</span>
            <button class="qty-inc" data-id="${equipItem.id}" style="width:32px;height:32px;border-radius:50%;background:#eee;border:1px solid #ccc;font-size:1.2em;cursor:pointer;">+</button>
          </span>
        </div>
        <button class="feat-select-btn ${selected ? 'selected' : ''} ${!canAfford ? 'disabled' : ''}" 
                data-id="${equipItem.id}" 
                ${!canAfford ? 'disabled' : ''}>
          ${selected ? 'Deselect' : 'Select'}
        </button>
      </div>
    `;
    
    list.appendChild(itemDiv);

    const header = itemDiv.querySelector('.feat-header');
    header.addEventListener('click', () => {
      const body = header.nextElementSibling;
      const arrow = header.querySelector('.feat-arrow');
      body.classList.toggle('open');
      arrow.classList.toggle('open');
    });

    const btn = itemDiv.querySelector('.feat-select-btn');
    btn.addEventListener('click', () => {
      if (!canAfford) return;
      toggleEquipment(equipItem.id, availableCurrency, equipItem.currency, 'general');
    });

    // Quantity controls
    itemDiv.querySelector('.qty-dec').addEventListener('click', () => {
      setEquipmentQuantity(equipItem.id, getEquipmentQuantity(equipItem.id) - 1);
      document.getElementById(`equip-qty-${equipItem.id}`).textContent = getEquipmentQuantity(equipItem.id);
      updateEquipmentCurrency();
    });
    itemDiv.querySelector('.qty-inc').addEventListener('click', () => {
      setEquipmentQuantity(equipItem.id, getEquipmentQuantity(equipItem.id) + 1);
      document.getElementById(`equip-qty-${equipItem.id}`).textContent = getEquipmentQuantity(equipItem.id);
      updateEquipmentCurrency();
    });
  });
}

// Extract and merge proficiencies from selected equipment
function extractEquipmentProficiencies() {
  const proficiencies = new Map();
  selectedEquipment.forEach(id => {
    const weapon = weaponLibrary.find(w => w.id === id);
    const armor = armorLibrary.find(a => a.id === id);
    const item = weapon || armor;
    if (!item || !item.itemParts) return;
    item.itemParts.forEach(propRef => {
      const propData = itemPropertiesCache?.find(prop => prop.id === propRef.id || prop.name === propRef.name);
      if (!propData) return;
      // ROUND DOWN TP
      const baseTP = Math.floor(propData.base_tp || 0);
      const optionLevel = propRef.op_1_lvl || 0;
      const optionTP = optionLevel > 0 ? Math.floor((propData.op_1_tp || 0) * optionLevel) : 0;
      const totalTP = baseTP + optionTP;
      if (totalTP <= 0) return;

      // Special handling for Weapon Damage - count separately per damage type
      let key = propData.id || propData.name;
      let damageType = null;
      
      if (propData.name === 'Weapon Damage' && weapon && weapon.damage && Array.isArray(weapon.damage)) {
        const damageTypes = weapon.damage
          .filter(d => d && d.type && d.type !== 'none')
          .map(d => d.type)
          .join(', ');
        if (damageTypes) {
          damageType = damageTypes;
          key = `${propData.name}|${damageTypes}`;
        }
      }
      
      if (proficiencies.has(key)) {
        // Merge: take the highest option level
        const existing = proficiencies.get(key);
        existing.op1Lvl = Math.max(existing.op1Lvl, optionLevel);
      } else {
        proficiencies.set(key, {
          name: propData.name,
          description: propData.description || '',
          baseTP: baseTP,
          op1Lvl: optionLevel,
          op1TP: propData.op_1_tp || 0,
          damageType: damageType
        });
      }
    });
  });
  return proficiencies;
}

// Calculate total TP from proficiencies
export function getTotalEquipmentTP() {
  const proficiencies = extractEquipmentProficiencies();
  let total = 0;
  proficiencies.forEach(prof => {
    const optionTP = prof.op1Lvl > 0 ? Math.floor(prof.op1TP * prof.op1Lvl) : 0;
    total += prof.baseTP + optionTP;
  });
  return total;
}

// Update proficiencies display
function updateEquipmentProficienciesDisplay() {
  const profList = document.getElementById('equipment-proficiencies-list');
  if (!profList) return;

  const proficiencies = extractEquipmentProficiencies();

  if (proficiencies.size === 0) {
    profList.innerHTML = '<p class="no-skills-message">No proficiencies from selected equipment</p>';
    // Update header to show 0 TP
    const header = document.querySelector('#content-equipment .section-header[data-section="equipment-proficiencies"] h3');
    if (header) header.innerHTML = 'Proficiencies <span style="margin-left: auto; font-weight: normal; color: #666;">Total TP Cost: 0</span>';
    return;
  }

  let totalTP = 0;
  const chips = Array.from(proficiencies.values()).map(prof => {
    const optionTP = prof.op1Lvl > 0 ? Math.floor(prof.op1TP * prof.op1Lvl) : 0;
    totalTP += prof.baseTP + optionTP;
    
    let text = prof.name;
    if (prof.damageType) text += ` (${prof.damageType})`;
    if (prof.op1Lvl > 0) text += ` (Level ${prof.op1Lvl})`;
    let tpText = ` | TP: ${prof.baseTP}`;
    if (optionTP > 0) tpText += ` + ${optionTP}`;
    text += tpText;
    
    return `<div class="equipment-property-chip proficiency-chip" title="${prof.description}">${text}</div>`;
  }).join('');

  profList.innerHTML = chips;
  
  // Update header to show total TP
  const header = document.querySelector('#content-equipment .section-header[data-section="equipment-proficiencies"] h3');
  if (header) header.innerHTML = `Proficiencies <span style="margin-left: auto; font-weight: normal; color: #666;">Total TP Cost: ${totalTP}</span>`;
  
  // Update training points display
  updateTrainingPointsDisplay();
}

function toggleEquipment(itemId, availableCurrency, itemCurrency, itemType) {
  if (selectedEquipment.includes(itemId)) {
    selectedEquipment = selectedEquipment.filter(id => id !== itemId);
    delete selectedEquipmentQuantities[itemId];
  } else {
    if (itemCurrency > availableCurrency) return;
    selectedEquipment.push(itemId);
    if (!selectedEquipmentQuantities[itemId]) selectedEquipmentQuantities[itemId] = 1;
  }

  updateEquipmentCurrency();
  if (!window.character) window.character = {};
  window.character.equipment = selectedEquipment;
  window.character.equipmentQuantities = selectedEquipmentQuantities;
  saveCharacter();

  populateWeapons();
  populateArmor();
  populateGeneralEquipment();
  updateTrainingPointsDisplay();
}

function getSpentCurrency() {
  return selectedEquipment.reduce((sum, id) => {
    const weapon = weaponLibrary.find(w => w.id === id);
    const armor = armorLibrary.find(a => a.id === id);
    const general = generalEquipment.find(g => g.id === id);
    const item = weapon || armor || general;
    const qty = getEquipmentQuantity(id);
    const value = item ? (item.currencyCost ?? item.goldCost ?? item.currency ?? 0) : 0;
    return sum + Math.ceil(value) * qty;
  }, 0);
}

function updateEquipmentCurrency() {
  const spent = getSpentCurrency();
  const remaining = 200 - spent;
  const el = document.getElementById('currency');
  if (el) el.textContent = remaining;
  updateEquipmentBonusDisplay();
  updateArmamentMax();
  updateEquipmentProficienciesDisplay();
}

function updateArmamentMax() {
  const char = window.character || {};
  const archetype = char.archetype || {};
  let max = 4; // Default for no archetype or power archetype
  
  if (archetype.type === 'powered-martial') {
    max = 8;
  } else if (archetype.type === 'martial') {
    max = 16;
  }
  
  const el = document.getElementById('armament-max');
  if (el) el.textContent = max;
}

function updateEquipmentBonusDisplay() {
  const bonusList = document.getElementById('equipment-bonus-list');
  if (!bonusList) return;

  if (selectedEquipment.length === 0) {
    bonusList.innerHTML = '<p class="no-skills-message">No equipment selected yet</p>';
    updateTrainingPointsDisplay();
    return;
  }

  bonusList.innerHTML = selectedEquipment.map(id => {
    const weapon = weaponLibrary.find(w => w.id === id);
    const armor = armorLibrary.find(a => a.id === id);
    const general = generalEquipment.find(g => g.id === id);
    const item = weapon || armor || general;
    if (!item) return '';
    
    const qty = getEquipmentQuantity(id);
    const currency = Math.ceil(item.currencyCost ?? item.goldCost ?? item.currency ?? 0);

    return `
      <div class="skill-bonus-item">
        <span class="skill-bonus-name">${item.name}</span>
        <span class="skill-fixed-ability">Currency: ${currency} &times; 
          <span class="control" style="display:inline-flex;align-items:center;gap:8px;">
            <button class="bonus-qty-dec" data-id="${id}" style="width:28px;height:28px;border-radius:50%;background:#eee;border:1px solid #ccc;font-size:1em;cursor:pointer;">-</button>
            <span class="bonus-qty-value" id="bonus-qty-${id}" style="display:inline-block;width:28px;text-align:center;font-size:1em;font-weight:600;background:#f7f7f7;border-radius:8px;">${qty}</span>
            <button class="bonus-qty-inc" data-id="${id}" style="width:28px;height:28px;border-radius:50%;background:#eee;border:1px solid #ccc;font-size:1em;cursor:pointer;">+</button>
          </span>
        </span>
        <button class="equipment-remove-btn" data-id="${id}" title="Remove equipment">×</button>
      </div>
    `;
  }).filter(Boolean).join('');

  // Add event listeners to remove buttons
  bonusList.querySelectorAll('.equipment-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemId = btn.dataset.id;
      selectedEquipment = selectedEquipment.filter(id => id !== itemId);
      delete selectedEquipmentQuantities[itemId];
      updateEquipmentCurrency();
      if (!window.character) window.character = {};
      window.character.equipment = selectedEquipment;
      window.character.equipmentQuantities = selectedEquipmentQuantities;
      saveCharacter();
      populateWeapons();
      populateArmor();
      populateGeneralEquipment();
      updateTrainingPointsDisplay();
    });
  });

  // Add event listeners to quantity controls
  bonusList.querySelectorAll('.bonus-qty-dec').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemId = btn.dataset.id;
      setEquipmentQuantity(itemId, getEquipmentQuantity(itemId) - 1);
      document.getElementById(`bonus-qty-${itemId}`).textContent = getEquipmentQuantity(itemId);
      updateEquipmentCurrency();
    });
  });
  bonusList.querySelectorAll('.bonus-qty-inc').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemId = btn.dataset.id;
      setEquipmentQuantity(itemId, getEquipmentQuantity(itemId) + 1);
      document.getElementById(`bonus-qty-${itemId}`).textContent = getEquipmentQuantity(itemId);
      updateEquipmentCurrency();
    });
  });
}

// NEW: Fetch weapons (Weapon + Shield) from user library
async function fetchWeaponsFromLibrary() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return [];
  if (!itemPropertiesCache) {
    // Ensure properties loaded (Realtime DB)
    await loadItemProperties(getDatabase());
  }
  const db = getFirestore();
  const snap = await getDocs(collection(db, 'users', user.uid, 'itemLibrary'));
  const list = [];
  snap.forEach(docSnap => {
    const raw = docSnap.data();
    if (!raw.armamentType || (raw.armamentType !== 'Weapon' && raw.armamentType !== 'Shield')) return;
    const display = deriveItemDisplay(raw, itemPropertiesCache);
    // Range spaces numeric (0 = melee)
    const rangeProp = (raw.properties || []).find(p => p.id === PROPERTY_IDS.RANGE || p.name === 'Range');
    const rangeSpaces = rangeProp ? (8 + (rangeProp.op_1_lvl || 0) * 8) : 0;
    list.push({
      id: docSnap.id,
      name: display.name,
      description: display.description,
      armamentType: raw.armamentType,
      itemParts: raw.properties || [],
      damage: raw.damage || [],
      range: rangeSpaces,
      totalBP: display.totalTP,              // TP budget
      currencyCost: display.currencyCost,    // centralized currency
      rarity: display.rarity,
      proficiencies: display.proficiencies   // array of {name, level, ...}
    });
  });
  return list;
}

// NEW: Fetch armor from user library
async function fetchArmorFromLibrary() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return [];
  if (!itemPropertiesCache) {
    await loadItemProperties(getDatabase());
  }
  const db = getFirestore();
  const snap = await getDocs(collection(db, 'users', user.uid, 'itemLibrary'));
  const list = [];
  snap.forEach(docSnap => {
    const raw = docSnap.data();
    if (raw.armamentType !== 'Armor') return;
    const display = deriveItemDisplay(raw, itemPropertiesCache);
    const drProp = (raw.properties || []).find(p => p.id === PROPERTY_IDS.DAMAGE_REDUCTION || p.name === 'Damage Reduction');
    const damageReduction = drProp ? (1 + (drProp.op_1_lvl || 0)) : 0;
    list.push({
      id: docSnap.id,
      name: display.name,
      description: display.description,
      armamentType: 'Armor',
      itemParts: raw.properties || [],
      damageReduction,
      totalBP: display.totalTP,
      currencyCost: display.currencyCost,
      rarity: display.rarity,
      proficiencies: display.proficiencies
    });
  });
  return list;
}

async function initEquipmentUI() {
  if (!equipmentInitialized) {
    // Weapons header
    const weaponsHeader = document.querySelector('#content-equipment .section-header[data-section="weapons"]');
    if (weaponsHeader) {
      const newWeaponsHeader = weaponsHeader.cloneNode(true);
      weaponsHeader.parentNode.replaceChild(newWeaponsHeader, weaponsHeader);
      
      newWeaponsHeader.addEventListener('click', () => {
        const body = document.getElementById('weapons-body');
        const arrow = newWeaponsHeader.querySelector('.toggle-arrow');
        if (body && arrow) {
          body.classList.toggle('open');
          arrow.classList.toggle('open');
        }
      });
    }

    // Armor header
    const armorHeader = document.querySelector('#content-equipment .section-header[data-section="armor"]');
    if (armorHeader) {
      const newArmorHeader = armorHeader.cloneNode(true);
      armorHeader.parentNode.replaceChild(newArmorHeader, armorHeader);
      
      newArmorHeader.addEventListener('click', () => {
        const body = document.getElementById('armor-body');
        const arrow = newArmorHeader.querySelector('.toggle-arrow');
        if (body && arrow) {
          body.classList.toggle('open');
          arrow.classList.toggle('open');
        }
      });
    }

    // General Equipment header
    const equipmentHeader = document.querySelector('#content-equipment .section-header[data-section="equipment"]');
    if (equipmentHeader) {
      const newEquipmentHeader = equipmentHeader.cloneNode(true);
      equipmentHeader.parentNode.replaceChild(newEquipmentHeader, equipmentHeader);
      
      newEquipmentHeader.addEventListener('click', () => {
        const body = document.getElementById('equipment-body');
        const arrow = newEquipmentHeader.querySelector('.toggle-arrow');
        if (body && arrow) {
          body.classList.toggle('open');
          arrow.classList.toggle('open');
        }
      });
    }

    // Equipment Proficiencies header
    const equipProfHeader = document.querySelector('#content-equipment .section-header[data-section="equipment-proficiencies"]');
    if (equipProfHeader) {
      const newEquipProfHeader = equipProfHeader.cloneNode(true);
      equipProfHeader.parentNode.replaceChild(newEquipProfHeader, equipProfHeader);
      
      newEquipProfHeader.addEventListener('click', () => {
        const body = document.getElementById('equipment-proficiencies-body');
        const arrow = newEquipProfHeader.querySelector('.toggle-arrow');
        if (body && arrow) {
          body.classList.toggle('open');
          arrow.classList.toggle('open');
        }
      });
    }

    // Search inputs
    const weaponsSearchInput = document.getElementById('weapons-search');
    if (weaponsSearchInput) {
      const newWeaponsSearchInput = weaponsSearchInput.cloneNode(true);
      weaponsSearchInput.parentNode.replaceChild(newWeaponsSearchInput, weaponsSearchInput);
      newWeaponsSearchInput.addEventListener('keyup', populateWeapons);
    }

    const armorSearchInput = document.getElementById('armor-search');
    if (armorSearchInput) {
      const newArmorSearchInput = armorSearchInput.cloneNode(true);
      armorSearchInput.parentNode.replaceChild(newArmorSearchInput, armorSearchInput);
      newArmorSearchInput.addEventListener('keyup', populateArmor);
    }

    const equipmentSearchInput = document.getElementById('equipment-search');
    if (equipmentSearchInput) {
      const newEquipmentSearchInput = equipmentSearchInput.cloneNode(true);
      equipmentSearchInput.parentNode.replaceChild(newEquipmentSearchInput, equipmentSearchInput);
      newEquipmentSearchInput.addEventListener('keyup', populateGeneralEquipment);
    }

    equipmentInitialized = true;
  }

  // Wait for auth before loading user library
  console.log('Waiting for authentication...');
  await waitForAuth();
  // Ensure properties loaded before building library items
  await loadItemProperties(getDatabase());
  // Load weapons and armor (now centralized)
  weaponLibrary = await fetchWeaponsFromLibrary();
  armorLibrary = await fetchArmorFromLibrary();
  // Load general equipment from Firebase (imported from firebase module)
  console.log('Loading general equipment...');
  const { allEquipment } = await import('./firebase.js');
  generalEquipment = [...allEquipment]; // Copy the array

  // Open all sections by default
  const weaponsBody = document.getElementById('weapons-body');
  const weaponsArrow = document.querySelector('#content-equipment .section-header[data-section="weapons"] .toggle-arrow');
  if (weaponsBody) weaponsBody.classList.add('open');
  if (weaponsArrow) weaponsArrow.classList.add('open');

  const armorBody = document.getElementById('armor-body');
  const armorArrow = document.querySelector('#content-equipment .section-header[data-section="armor"] .toggle-arrow');
  if (armorBody) armorBody.classList.add('open');
  if (armorArrow) armorArrow.classList.add('open');

  const equipmentBody = document.getElementById('equipment-body');
  const equipmentArrow = document.querySelector('#content-equipment .section-header[data-section="equipment"] .toggle-arrow');
  if (equipmentBody) equipmentBody.classList.add('open');
  if (equipmentArrow) equipmentArrow.classList.add('open');

  const equipProfBody = document.getElementById('equipment-proficiencies-body');
  const equipProfArrow = document.querySelector('#content-equipment .section-header[data-section="equipment-proficiencies"] .toggle-arrow');
  if (equipProfBody) equipProfBody.classList.add('open');
  if (equipProfArrow) equipProfArrow.classList.add('open');

  // Populate all lists
  console.log(`Populating UI with ${weaponLibrary.length} weapons, ${armorLibrary.length} armor, ${generalEquipment.length} general equipment`);
  populateWeapons();
  populateArmor();
  populateGeneralEquipment();
  updateEquipmentBonusDisplay();
  updateEquipmentCurrency();
  updateArmamentMax();
  updateEquipmentProficienciesDisplay();
  updateTrainingPointsDisplay(); // NEW
}

document.querySelector('.tab[data-tab="equipment"]')?.addEventListener('click', async () => {
  await initEquipmentUI();
});

export function restoreEquipment() {
  if (window.character?.equipment) {
    selectedEquipment = window.character.equipment;
    selectedEquipmentQuantities = window.character.equipmentQuantities || {};
  }
  initEquipmentUI();
}

// Update training points display
function updateTrainingPointsDisplay() {
  const equipmentTP = getTotalEquipmentTP();
  
  // Import powers TP if available
  import('./powers.js').then(mod => {
    const powersTP = mod.getTotalPowersTP ? mod.getTotalPowersTP() : 0;
    const totalSpent = equipmentTP + powersTP;
    const remaining = getDefaultTrainingPoints() - totalSpent;
    const trainingPointsEl = document.getElementById('training-points');
    if (trainingPointsEl) trainingPointsEl.textContent = remaining;
    const powersTrainingPointsEl = document.getElementById('powers-training-points');
    if (powersTrainingPointsEl) powersTrainingPointsEl.textContent = remaining;
  }).catch(() => {
    // Powers module not loaded yet
    const remaining = getDefaultTrainingPoints() - equipmentTP;
    const trainingPointsEl = document.getElementById('training-points');
    if (trainingPointsEl) trainingPointsEl.textContent = remaining;
  });
}
