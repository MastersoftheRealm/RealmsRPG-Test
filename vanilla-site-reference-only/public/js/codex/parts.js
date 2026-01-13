import { getWithRetry, applySort } from './core.js';

let allParts = [];
let filteredParts = [];
let partSortState = { col: 'name', dir: 1 };
let partsLoaded = false;

const elements = {
  list: document.getElementById('partList'),
  search: document.getElementById('partSearch'),
  categorySelect: document.getElementById('partCategorySelect'),
  typeSelect: document.getElementById('partTypeSelect'),
};

export function initParts() {
  loadParts();
  setupEventListeners();
}

function loadParts() {
  if (partsLoaded) return;
  console.log('Loading parts...');
  getWithRetry('parts')
    .then(snap => {
      const data = snap.val();
      if (!data) {
        elements.list.innerHTML = '<div class="no-results">No parts found in database.</div>';
        return;
      }
      allParts = Object.values(data).map(p => ({
        ...p,
        base_en: parseInt(p.base_en) || 0,
        base_tp: parseInt(p.base_tp) || 0,
        op_1_en: parseInt(p.op_1_en) || 0,
        op_1_tp: parseInt(p.op_1_tp) || 0,
        op_2_en: parseInt(p.op_2_en) || 0,
        op_2_tp: parseInt(p.op_2_tp) || 0,
        op_3_en: parseInt(p.op_3_en) || 0,
        op_3_tp: parseInt(p.op_3_tp) || 0,
        mechanic: p.mechanic || false,
        percentage: p.percentage || false,
      }));
      console.log(`✓ Loaded ${allParts.length} parts successfully`);
      partsLoaded = true;
      populateFilters();
      applyFilters();
    })
    .catch(err => {
      console.error('Error loading parts:', err);
      let errorMsg = 'Error loading parts. ';
      if (err.code === 'PERMISSION_DENIED') {
        errorMsg += 'Permission denied - check Firebase Realtime Database Rules.';
      }
      elements.list.innerHTML = `<div class="no-results">${errorMsg}</div>`;
    });
}

function populateFilters() {
  const categories = new Set();
  const types = new Set();

  allParts.forEach(p => {
    if (p.category) categories.add(p.category);
    if (p.type) types.add(p.type);
  });

  const addOpts = (sel, vals) => {
    sel.innerHTML = '<option value="">Choose...</option>' + Array.from(vals).sort().map(v => `<option value="${v}">${v}</option>`).join('');
  };

  addOpts(elements.categorySelect, categories);
  addOpts(elements.typeSelect, types);
}

export function applyFilters() {
  const searchTerm = elements.search.value.toLowerCase();
  const selectedCategory = elements.categorySelect.value;
  const selectedType = elements.typeSelect.value;

  filteredParts = allParts.filter(p => {
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm) && !(p.description && p.description.toLowerCase().includes(searchTerm))) return false;
    if (selectedCategory && p.category !== selectedCategory) return false;
    if (selectedType && p.type !== selectedType) return false;
    return true;
  });

  applySort(filteredParts, partSortState, partSortState.col);
  renderParts();
}

function renderParts() {
  if (!filteredParts.length) {
    elements.list.innerHTML = '<div class="no-results">No parts match your filters.</div>';
    return;
  }

  elements.list.innerHTML = filteredParts.map(p => `
    <div class="part-card" data-name="${p.name}">
      <div class="part-header" onclick="togglePartExpand(this)">
        <div class="col">${p.name}</div>
        <div class="col">${p.category || ''}</div>
        <div class="col">${p.type || ''}</div>
        <div class="col">${p.base_en || ''}</div>
        <div class="col">${p.base_tp || ''}</div>
        <span class="expand-icon">▼</span>
      </div>
      <div class="part-body">
        ${p.description ? `<div class="part-description" style="color:#000;">${p.description}</div>` : ''}
        <div class="part-options">
          ${p.op_1_desc ? `<div class="option"><strong>Option 1:</strong> ${p.op_1_desc} (EN: ${p.op_1_en}, TP: ${p.op_1_tp})</div>` : ''}
          ${p.op_2_desc ? `<div class="option"><strong>Option 2:</strong> ${p.op_2_desc} (EN: ${p.op_2_en}, TP: ${p.op_2_tp})</div>` : ''}
          ${p.op_3_desc ? `<div class="option"><strong>Option 3:</strong> ${p.op_3_desc} (EN: ${p.op_3_en}, TP: ${p.op_3_tp})</div>` : ''}
        </div>
        <div class="part-flags">
          ${p.mechanic ? '<span class="flag">Mechanic</span>' : ''}
          ${p.percentage ? '<span class="flag">Percentage</span>' : ''}
        </div>
      </div>
    </div>
  `).join('');
}

function setupEventListeners() {
  elements.search.addEventListener('input', applyFilters);
  elements.categorySelect.addEventListener('change', applyFilters);
  elements.typeSelect.addEventListener('change', applyFilters);

  document.querySelectorAll('.part-headers .sort').forEach(sortBtn => {
    sortBtn.addEventListener('click', (e) => {
      const col = e.target.closest('.col').dataset.col;
      const dir = e.target.dataset.dir === 'asc' ? 1 : -1;
      partSortState = { col, dir };
      applyFilters();
    });
  });
}

window.togglePartExpand = function(header) {
  header.parentElement.classList.toggle('expanded');
};
