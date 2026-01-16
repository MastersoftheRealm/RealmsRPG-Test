import { getWithRetry, createChip, applySort, cmToFtIn, kgToLb } from './core.js';
import { sanitizeId } from '../shared/string-utils.js';
import { findByIdOrName } from '../shared/id-constants.js';

let allSpecies = [];
let filteredSpecies = [];
let speciesSortState = { col: 'name', dir: 1 };
let selectedTypes = [];
let selectedSizes = [];
let allTraits = {};
let traitsLoaded = false;
let speciesLoaded = false;

const elements = {
  list: document.getElementById('speciesList'),
  search: document.getElementById('speciesSearch'),
  typeSelect: document.getElementById('speciesTypeSelect'),
  typeChips: document.getElementById('speciesTypeChips'),
  sizeSelect: document.getElementById('speciesSizeSelect'),
  sizeChips: document.getElementById('speciesSizeChips'),
};

export function initSpecies() {
  loadTraits().then(() => loadSpecies());
  setupEventListeners();
}

function loadTraits() {
  if (traitsLoaded) return Promise.resolve();
  console.log('Loading traits...');
  return getWithRetry('traits')
    .then(snap => {
      const data = snap.val();
      if (data) {
        allTraits = data;
        console.log(`✓ Loaded ${Object.keys(allTraits).length} traits`);
      }
      traitsLoaded = true;
    })
    .catch(err => {
      console.error('Error loading traits:', err);
    });
}

function loadSpecies() {
  if (speciesLoaded) return;
  console.log('Loading species...');
  getWithRetry('species')
    .then(snap => {
      const data = snap.val();
      if (!data) {
        elements.list.innerHTML = '<div class="no-results">No species found in database.</div>';
        return;
      }
      allSpecies = Object.values(data).map(s => {
        let adulthood_lifespan = Array.isArray(s.adulthood_lifespan) ? s.adulthood_lifespan.map(n => parseInt(String(n).trim())) : (typeof s.adulthood_lifespan === 'string' ? s.adulthood_lifespan.split(',').map(n => parseInt(n.trim())) : [0, 0]);
        let adulthood = adulthood_lifespan[0] || 0;
        let max_age = adulthood_lifespan[1] || 0;
        let skills = typeof s.skills === 'string' ? s.skills.split(',').map(sk => sk.trim()) : (Array.isArray(s.skills) ? s.skills : []);
        let languages = typeof s.languages === 'string' ? s.languages.split(',').map(l => l.trim()) : (Array.isArray(s.languages) ? s.languages : []);
        let species_traits = typeof s.species_traits === 'string' ? s.species_traits.split(',').map(name => name.trim()) : (Array.isArray(s.species_traits) ? s.species_traits : []);
        let ancestry_traits = typeof s.ancestry_traits === 'string' ? s.ancestry_traits.split(',').map(name => name.trim()) : (Array.isArray(s.ancestry_traits) ? s.ancestry_traits : []);
        let flaws = typeof s.flaws === 'string' ? s.flaws.split(',').map(name => name.trim()) : (Array.isArray(s.flaws) ? s.flaws : []);
        let characteristics = typeof s.characteristics === 'string' ? s.characteristics.split(',').map(name => name.trim()) : (Array.isArray(s.characteristics) ? s.characteristics : []);
        species_traits = species_traits.map(name => ({ name, desc: allTraits[sanitizeId(name)]?.description || 'No description' }));
        ancestry_traits = ancestry_traits.map(name => ({ name, desc: allTraits[sanitizeId(name)]?.description || 'No description' }));
        flaws = flaws.map(name => ({ name, desc: allTraits[sanitizeId(name)]?.description || 'No description' }));
        characteristics = characteristics.map(name => ({ name, desc: allTraits[sanitizeId(name)]?.description || 'No description' }));
        return {
          ...s,
          ave_height: s.ave_hgt_cm,
          ave_weight: s.ave_wgt_kg,
          adulthood,
          max_age,
          skills,
          languages,
          species_traits,
          ancestry_traits,
          flaws,
          characteristics,
          sizes: typeof s.sizes === 'string' ? s.sizes.split(',').map(sz => sz.trim()) : (Array.isArray(s.sizes) ? s.sizes : []),
          type: s.type || '',
        };
      });
      console.log(`✓ Loaded ${allSpecies.length} species successfully`);
      speciesLoaded = true;
      populateFilters();
      applyFilters();
    })
    .catch(err => {
      console.error('Error loading species:', err);
      let errorMsg = 'Error loading species. ';
      if (err.code === 'PERMISSION_DENIED') {
        errorMsg += 'Permission denied - check Firebase Realtime Database Rules.';
      }
      elements.list.innerHTML = `<div class="no-results">${errorMsg}</div>`;
    });
}

function populateFilters() {
  const types = new Set();
  const sizes = new Set();

  allSpecies.forEach(s => {
    if (s.type) types.add(s.type);
    s.sizes.forEach(sz => sizes.add(sz));
  });

  const addOpts = (sel, vals) => {
    sel.innerHTML = '<option value="">Choose...</option>' + Array.from(vals).sort().map(v => `<option value="${v}">${v}</option>`).join('');
  };

  addOpts(elements.typeSelect, types);
  addOpts(elements.sizeSelect, sizes);
}

export function applyFilters() {
  const searchTerm = elements.search.value.toLowerCase();

  filteredSpecies = allSpecies.filter(s => {
    if (searchTerm && !s.name.toLowerCase().includes(searchTerm) && !(s.description && s.description.toLowerCase().includes(searchTerm))) return false;
    if (selectedTypes.length && !selectedTypes.includes(s.type)) return false;
    if (selectedSizes.length && !s.sizes.some(sz => selectedSizes.includes(sz))) return false;
    return true;
  });

  applySort(filteredSpecies, speciesSortState, speciesSortState.col);
  renderSpecies();
}

function renderSpecies() {
  if (!filteredSpecies.length) {
    elements.list.innerHTML = '<div class="no-results">No species match your filters.</div>';
    return;
  }

  elements.list.innerHTML = filteredSpecies.map(s => `
    <div class="species-card" data-name="${s.name}">
      <div class="species-header" onclick="toggleSpeciesExpand(this)">
        <div class="col">${s.name}</div>
        <div class="col">${s.type || ''}</div>
        <div class="col">${s.sizes.join(', ')}</div>
        <div class="col">${s.description ? s.description.substring(0, 100) + '...' : ''}</div>
        <span class="expand-icon">▼</span>
      </div>
      <div class="species-body">
        ${s.description ? `<div class="species-description" style="font-style:normal;color:#000;">${s.description}</div>` : ''}
        <div class="trait-section">
          <h3>Species Traits</h3>
          <div class="trait-grid">
            ${s.species_traits.map(t => `<div class="trait-item"><h4>${t.name}</h4><p style="color:#000;">${t.desc}</p></div>`).join('')}
          </div>
        </div>
        <div class="trait-section">
          <h3>Ancestry Traits</h3>
          <div class="trait-grid">
            ${s.ancestry_traits.map(t => `<div class="trait-item"><h4>${t.name}</h4><p style="color:#000;">${t.desc}</p></div>`).join('')}
          </div>
        </div>
        <div class="trait-section">
          <h3>Flaws</h3>
          <div class="trait-grid">
            ${s.flaws.map(t => `<div class="trait-item"><h4>${t.name}</h4><p style="color:#000;">${t.desc}</p></div>`).join('')}
          </div>
        </div>
        <div class="trait-section">
          <h3>Characteristics</h3>
          <div class="trait-grid">
            ${s.characteristics.map(t => `<div class="trait-item"><h4>${t.name}</h4><p style="color:#000;">${t.desc}</p></div>`).join('')}
          </div>
        </div>
        <div class="trait-section">
          <h3>Skills</h3>
          <div class="trait-grid">
            ${s.skills.length ? s.skills.map(skillName => {
              // Find the skill object from allSkills (loaded by skills.js)
              let skillObj = findByIdOrName(window.allSkills || [], { name: skillName });
              let desc = skillObj && skillObj.description ? skillObj.description : 'No description';
              return `<div class="trait-item"><h4>${skillName}</h4><p style="color:#000;">${desc}</p></div>`;
            }).join('') : '<div class="trait-item"><h4>No skills listed</h4></div>'}
          </div>
        </div>
        <div class="species-details">
          <div><strong>Average Weight:</strong> ${s.ave_weight || 'N/A'} kg</div>
          <div><strong>Average Height:</strong> ${s.ave_height || 'N/A'} cm</div>
          <div><strong>Lifespan:</strong> ${s.max_age || 'N/A'} years</div>
          <div><strong>Adulthood:</strong> ${s.adulthood || 'N/A'} years</div>
          <div><strong>Languages:</strong> ${s.languages.join(', ') || 'None'}</div>
        </div>
      </div>
    </div>
  `).join('');
}

function setupEventListeners() {
  elements.search.addEventListener('input', applyFilters);

  elements.typeSelect.addEventListener('change', () => {
    const val = elements.typeSelect.value;
    if (val && !selectedTypes.includes(val)) {
      selectedTypes.push(val);
      createChip(val, elements.typeChips, () => {
        selectedTypes = selectedTypes.filter(t => t !== val);
        applyFilters();
      });
      elements.typeSelect.value = '';
      applyFilters();
    }
  });

  elements.sizeSelect.addEventListener('change', () => {
    const val = elements.sizeSelect.value;
    if (val && !selectedSizes.includes(val)) {
      selectedSizes.push(val);
      createChip(val, elements.sizeChips, () => {
        selectedSizes = selectedSizes.filter(sz => sz !== val);
        applyFilters();
      });
      elements.sizeSelect.value = '';
      applyFilters();
    }
  });

  document.querySelectorAll('.species-headers .sort').forEach(sortBtn => {
    sortBtn.addEventListener('click', (e) => {
      const col = e.target.closest('.col').dataset.col;
      const dir = e.target.dataset.dir === 'asc' ? 1 : -1;
      speciesSortState = { col, dir };
      applyFilters();
    });
  });
}

window.toggleSpeciesExpand = function(header) {
  header.parentElement.classList.toggle('expanded');
};
