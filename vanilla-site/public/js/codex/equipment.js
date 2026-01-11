import { getWithRetry, applySort } from './core.js';

let allEquipment = [];
let filteredEquipment = [];
let equipmentSortState = { col: 'name', dir: 1 };
let equipmentLoaded = false;

const elements = {
  list: document.getElementById('equipmentList'),
  search: document.getElementById('equipmentSearch'),
  categorySelect: document.getElementById('equipmentCategorySelect'),
  raritySelect: document.getElementById('equipmentRaritySelect'),
};

export function initEquipment() {
  loadEquipment();
  setupEventListeners();
}

function loadEquipment() {
  if (equipmentLoaded) return;
  console.log('Loading equipment...');
  getWithRetry('items')
    .then(snap => {
      const data = snap.val();
      if (!data) {
        elements.list.innerHTML = '<div class="no-results">No equipment found in database.</div>';
        return;
      }
      allEquipment = Object.values(data).map(e => ({
        ...e,
        currency: parseInt(e.currency) || 0,
      }));
      console.log(`✓ Loaded ${allEquipment.length} equipment successfully`);
      equipmentLoaded = true;
      populateFilters();
      applyFilters();
    })
    .catch(err => {
      console.error('Error loading equipment:', err);
      let errorMsg = 'Error loading equipment. ';
      if (err.code === 'PERMISSION_DENIED') {
        errorMsg += 'Permission denied - check Firebase Realtime Database Rules.';
      }
      elements.list.innerHTML = `<div class="no-results">${errorMsg}</div>`;
    });
}

function populateFilters() {
  const categories = new Set();
  const rarities = new Set();

  allEquipment.forEach(e => {
    if (e.category) categories.add(e.category);
    if (e.rarity) rarities.add(e.rarity);
  });

  const addOpts = (sel, vals) => {
    sel.innerHTML = '<option value="">Choose...</option>' + Array.from(vals).sort().map(v => `<option value="${v}">${v}</option>`).join('');
  };

  addOpts(elements.categorySelect, categories);
  addOpts(elements.raritySelect, rarities);
}

export function applyFilters() {
  const searchTerm = elements.search.value.toLowerCase();
  const selectedCategory = elements.categorySelect.value;
  const selectedRarity = elements.raritySelect.value;

  filteredEquipment = allEquipment.filter(e => {
    if (searchTerm && !e.name.toLowerCase().includes(searchTerm) && !(e.description && e.description.toLowerCase().includes(searchTerm))) return false;
    if (selectedCategory && e.category !== selectedCategory) return false;
    if (selectedRarity && e.rarity !== selectedRarity) return false;
    return true;
  });

  applySort(filteredEquipment, equipmentSortState, equipmentSortState.col);
  renderEquipment();
}

function renderEquipment() {
  if (!filteredEquipment.length) {
    elements.list.innerHTML = '<div class="no-results">No equipment match your filters.</div>';
    return;
  }

  elements.list.innerHTML = filteredEquipment.map(e => `
    <div class="equipment-card" data-name="${e.name}">
      <div class="equipment-header" onclick="toggleEquipmentExpand(this)">
        <div class="col">${e.name}</div>
        <div class="col">${e.description ? e.description.substring(0, 100) + '...' : ''}</div>
        <div class="col">${e.category || ''}</div>
        <div class="col">${e.currency || ''}</div>
        <div class="col">${e.rarity || ''}</div>
        <span class="expand-icon">▼</span>
      </div>
      <div class="equipment-body">
        ${e.description ? `<div class="equipment-description" style="color:#000;">${e.description}</div>` : ''}
      </div>
    </div>
  `).join('');
}

function setupEventListeners() {
  elements.search.addEventListener('input', applyFilters);
  elements.categorySelect.addEventListener('change', applyFilters);
  elements.raritySelect.addEventListener('change', applyFilters);

  document.querySelectorAll('.equipment-headers .sort').forEach(sortBtn => {
    sortBtn.addEventListener('click', (e) => {
      const col = e.target.closest('.col').dataset.col;
      const dir = e.target.dataset.dir === 'asc' ? 1 : -1;
      equipmentSortState = { col, dir };
      applyFilters();
    });
  });
}

window.toggleEquipmentExpand = function(header) {
  header.parentElement.classList.toggle('expanded');
};
