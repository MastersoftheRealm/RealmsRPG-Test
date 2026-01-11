import { getWithRetry, applySort } from './core.js';

let allProperties = [];
let filteredProperties = [];
let propertySortState = { col: 'name', dir: 1 };
let propertiesLoaded = false;

const elements = {
  list: document.getElementById('propertyList'),
  search: document.getElementById('propertySearch'),
  typeSelect: document.getElementById('propertyTypeSelect'),
};

export function initProperties() {
  loadProperties();
  setupEventListeners();
}

function loadProperties() {
  if (propertiesLoaded) return;
  console.log('Loading properties...');
  getWithRetry('properties')
    .then(snap => {
      const data = snap.val();
      if (!data) {
        elements.list.innerHTML = '<div class="no-results">No properties found in database.</div>';
        return;
      }
      allProperties = Object.values(data).map(p => ({
        ...p,
        base_ip: parseInt(p.base_ip) || 0,
        base_tp: parseInt(p.base_tp) || 0,
        base_c: parseInt(p.base_c) || 0,
        opt_1_ip: parseInt(p.opt_1_ip) || 0,
        opt_1_tp: parseInt(p.opt_1_tp) || 0,
        opt_1_c: parseInt(p.opt_1_c) || 0,
      }));
      console.log(`✓ Loaded ${allProperties.length} properties successfully`);
      propertiesLoaded = true;
      populateFilters();
      applyFilters();
    })
    .catch(err => {
      console.error('Error loading properties:', err);
      let errorMsg = 'Error loading properties. ';
      if (err.code === 'PERMISSION_DENIED') {
        errorMsg += 'Permission denied - check Firebase Realtime Database Rules.';
      }
      elements.list.innerHTML = `<div class="no-results">${errorMsg}</div>`;
    });
}

function populateFilters() {
  const types = new Set();

  allProperties.forEach(p => {
    if (p.type) types.add(p.type);
  });

  const addOpts = (sel, vals) => {
    sel.innerHTML = '<option value="">Choose...</option>' + Array.from(vals).sort().map(v => `<option value="${v}">${v}</option>`).join('');
  };

  addOpts(elements.typeSelect, types);
}

export function applyFilters() {
  const searchTerm = elements.search.value.toLowerCase();
  const selectedType = elements.typeSelect.value;

  filteredProperties = allProperties.filter(p => {
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm) && !(p.description && p.description.toLowerCase().includes(searchTerm))) return false;
    if (selectedType && p.type !== selectedType) return false;
    return true;
  });

  applySort(filteredProperties, propertySortState, propertySortState.col);
  renderProperties();
}

function renderProperties() {
  if (!filteredProperties.length) {
    elements.list.innerHTML = '<div class="no-results">No properties match your filters.</div>';
    return;
  }

  elements.list.innerHTML = filteredProperties.map(p => `
    <div class="property-card" data-name="${p.name}">
      <div class="property-header" onclick="togglePropertyExpand(this)">
        <div class="col">${p.name}</div>
        <div class="col">${p.type || ''}</div>
        <div class="col">${p.base_tp || ''}</div>
        <span class="expand-icon">▼</span>
      </div>
      <div class="property-body">
        ${p.description ? `<div class="property-description" style="color:#000;">${p.description}</div>` : ''}
        <div class="property-details">
          <div><strong>Base IP:</strong> ${p.base_ip || 'N/A'}</div>
          <div><strong>Base Currency:</strong> ${p.base_c || 'N/A'}</div>
          ${p.opt_1_ip ? `<div><strong>Optional IP:</strong> ${p.opt_1_ip}</div>` : ''}
          ${p.opt_1_c ? `<div><strong>Optional Currency:</strong> ${p.opt_1_c}</div>` : ''}
        </div>
        ${p.opt_1_desc ? `<div class="option"><strong>Optional:</strong> ${p.opt_1_desc} (IP: ${p.opt_1_ip}, TP: ${p.opt_1_tp}, Currency: ${p.opt_1_c})</div>` : ''}
      </div>
    </div>
  `).join('');
}

function setupEventListeners() {
  elements.search.addEventListener('input', applyFilters);
  elements.typeSelect.addEventListener('change', applyFilters);

  document.querySelectorAll('.property-headers .sort').forEach(sortBtn => {
    sortBtn.addEventListener('click', (e) => {
      const col = e.target.closest('.col').dataset.col;
      const dir = e.target.dataset.dir === 'asc' ? 1 : -1;
      propertySortState = { col, dir };
      applyFilters();
    });
  });
}

window.togglePropertyExpand = function(header) {
  header.parentElement.classList.toggle('expanded');
};
