import { getDB, getWithRetry, createChip, applySort } from './core.js';
import { toStrArray, toNumArray } from '../shared/array-utils.js';

let allFeats = [];
let filteredFeats = [];
let sortState = { col: 'name', dir: 1 };
let selectedAbilReqs = [];
let selectedCategories = [];
let selectedAbilities = [];
let selectedTags = [];
let tagMode = 'all';
let showArchetype = true;
let showCharacter = true;
let stateFeatMode = 'show'; // 'show', 'only', 'hide'
let featsLoaded = false;

const elements = {
  list: document.getElementById('featList'),
  search: document.getElementById('search'),
  reqLevel: document.getElementById('reqLevel'),
  abilReqSelect: document.getElementById('abilReqSelect'),
  abilReqValue: document.getElementById('abilReqValue'),
  addAbilReq: document.getElementById('addAbilReq'),
  abilReqChips: document.getElementById('abilReqChips'),
  categorySelect: document.getElementById('categorySelect'),
  categoryChips: document.getElementById('categoryChips'),
  abilitySelect: document.getElementById('abilitySelect'),
  abilityChips: document.getElementById('abilityChips'),
  tagSelect: document.getElementById('tagSelect'),
  tagChips: document.getElementById('tagChips'),
};

export function initFeats() {
  loadFeats();
  setupEventListeners();
}

function loadFeats() {
  if (featsLoaded) return;
  console.log('Loading feats...');
  getWithRetry('feats')
    .then(snap => {
      const data = snap.val();
      if (!data) {
        elements.list.innerHTML = '<div class="no-results">No feats found in database.</div>';
        return;
      }
      allFeats = Object.values(data).map(f => ({
        ...f,
        ability_req: toStrArray(f.ability_req),
        abil_req_val: toNumArray(f.abil_req_val),
        tags: toStrArray(f.tags),
        skill_req: toStrArray(f.skill_req),
        skill_req_val: toNumArray(f.skill_req_val),
        lvl_req: parseInt(f.lvl_req) || 0,
        uses_per_rec: parseInt(f.uses_per_rec) || 0,
        mart_abil_req: f.mart_abil_req || '',
        char_feat: f.char_feat || false,
        state_feat: f.state_feat || false,
      }));
      console.log(`✓ Loaded ${allFeats.length} feats successfully`);
      featsLoaded = true;
      populateFilters();
      applyFilters();
    })
    .catch(err => {
      console.error('Error loading feats:', err);
      let errorMsg = 'Error loading feats: ';
      if (err.code === 'PERMISSION_DENIED') {
        errorMsg += 'Permission denied. Check Firebase Database Rules.';
      } else if (err.message && err.message.includes('AppCheck')) {
        errorMsg += 'AppCheck error. Check AppCheck configuration.';
      } else {
        errorMsg += err.message || err.code || 'Unknown error';
      }
      elements.list.innerHTML = `<div class="no-results">${errorMsg}<br><br>Check browser console for details.</div>`;
    });
}

function populateFilters() {
  const levels = new Set();
  const abilitiesForReq = new Set();
  const categories = new Set();
  const abilities = new Set();
  const tags = new Set();

  allFeats.forEach(f => {
    if (f.lvl_req) levels.add(f.lvl_req);
    f.ability_req.forEach(a => abilitiesForReq.add(a));
    if (f.category) categories.add(f.category);
    if (f.ability) abilities.add(f.ability);
    f.tags.forEach(t => tags.add(t));
  });

  const addOpts = (sel, vals) => {
    sel.innerHTML = '<option value="">Choose...</option>' + Array.from(vals).sort((a, b) => {
      if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
      if (typeof a === 'number' && typeof b === 'number') return a - b;
      return String(a).localeCompare(String(b));
    }).map(v => `<option value="${v}">${v}</option>`).join('');
  };

  elements.reqLevel.innerHTML = '<option value="">No limit</option>' + Array.from(levels).sort((a, b) => a - b).map(v => `<option value="${v}">Up to ${v}</option>`).join('');
  addOpts(elements.abilReqSelect, abilitiesForReq);
  addOpts(elements.categorySelect, categories);
  addOpts(elements.abilitySelect, abilities);
  addOpts(elements.tagSelect, tags);
}

export function applyFilters() {
  const searchTerm = elements.search.value.toLowerCase();
  const maxLevel = elements.reqLevel.value ? parseInt(elements.reqLevel.value) : Infinity;

  filteredFeats = allFeats.filter(f => {
    if (searchTerm && !f.name.toLowerCase().includes(searchTerm) && !f.tags.some(t => t.toLowerCase().includes(searchTerm)) && !(f.description && f.description.toLowerCase().includes(searchTerm))) return false;
    if (f.lvl_req > maxLevel) return false;

    // Check feat type (Archetype or Character)
    let typeMatch = false;
    if (showArchetype && !f.char_feat) typeMatch = true;
    if (showCharacter && f.char_feat) typeMatch = true;
    if (!typeMatch) return false;

    // Check state feat mode
    if (stateFeatMode === 'only' && !f.state_feat) return false;
    if (stateFeatMode === 'hide' && f.state_feat) return false;

    for (const req of selectedAbilReqs) {
      const index = f.ability_req.indexOf(req.abil);
      if (index !== -1) {
        let v = NaN;
        if (Array.isArray(f.abil_req_val)) v = Number(f.abil_req_val[index]);
        else if (typeof f.abil_req_val === 'number') v = Number(f.abil_req_val);
        else if (typeof f.abil_req_val === 'string') v = Number(f.abil_req_val);
        if (Number.isFinite(v) && v > req.val) return false;
      }
    }
    if (selectedCategories.length && !selectedCategories.includes(f.category)) return false;
    if (selectedAbilities.length && !selectedAbilities.includes(f.ability)) return false;
    if (selectedTags.length) {
      if (tagMode === 'all') {
        if (!selectedTags.every(t => f.tags.includes(t))) return false;
      } else {
        if (!selectedTags.some(t => f.tags.includes(t))) return false;
      }
    }
    return true;
  });

  applySort(filteredFeats, sortState, sortState.col);
  renderFeats();
}

function renderFeats() {
  if (!filteredFeats.length) {
    elements.list.innerHTML = '<div class="no-results">No feats match your filters.</div>';
    return;
  }

  elements.list.innerHTML = filteredFeats.map(f => `
    <div class="feat-card" data-name="${f.name}">
      <div class="feat-header" onclick="toggleExpand(this)">
        <div class="col">${f.name}</div>
        <div class="col">${f.lvl_req || ''}</div>
        <div class="col">${f.category || ''}</div>
        <div class="col">${f.ability || ''}</div>
        <div class="col">${f.rec_period || ''}</div>
        <div class="col">${f.uses_per_rec || ''}</div>
        <span class="expand-icon">▼</span>
      </div>
      <div class="feat-body">
        ${f.description ? `<div class="feat-description" style="color:#000;">${f.description}</div>` : ''}
        ${f.char_feat ? '<div class="feat-type-chip">Character Feat</div>' : ''}
        ${f.state_feat ? '<div class="feat-type-chip state-feat">State Feat</div>' : ''}
        <div class="requirements">
          ${f.req_desc ? `<div class="req-field"><label>Requirement Description:</label><span>${f.req_desc}</span></div>` : ''}
          ${f.ability_req.length ? `<div class="req-field"><label>Ability Requirements:</label><span>${
            f.ability_req.map((a, i) => {
              let v = NaN;
              if (Array.isArray(f.abil_req_val)) v = Number(f.abil_req_val[i]);
              else if (typeof f.abil_req_val === 'number') v = Number(f.abil_req_val);
              else if (typeof f.abil_req_val === 'string') v = Number(f.abil_req_val);
              return `${a}${Number.isFinite(v) ? ` ${v}` : ''}`;
            }).join(', ')
          }</span></div>` : ''}
          ${f.skill_req.length ? `<div class="req-field"><label>Skill Requirements:</label><span>${
            f.skill_req.map((s, i) => {
              const v = Number(f.skill_req_val?.[i]);
              return `${s}${Number.isFinite(v) ? ` ${v}` : ''}`;
            }).join(', ')
          }</span></div>` : ''}
          ${f.feat_cat_req ? `<div class="req-field"><label>Feat Category Requirement:</label><span>${f.feat_cat_req}</span></div>` : ''}
          ${f.pow_abil_req ? `<div class="req-field"><label>Power Ability Requirement:</label><span>${f.pow_abil_req}</span></div>` : ''}
          ${f.mart_abil_req ? `<div class="req-field"><label>Martial Ability Requirement:</label><span>${f.mart_abil_req}</span></div>` : ''}
          ${f.mart_prof_req ? `<div class="req-field"><label>Martial Proficiency Requirement:</label><span>${f.mart_prof_req}</span></div>` : ''}
          ${f.pow_prof_req ? `<div class="req-field"><label>Power Proficiency Requirement:</label><span>${f.pow_prof_req}</span></div>` : ''}
          ${f.speed_req ? `<div class="req-field"><label>Speed Requirement:</label><span>${f.speed_req}</span></div>` : ''}
          ${f.feat_lvl && f.feat_lvl > 1 ? `<div class="req-field"><label>Feat Level:</label><span>${f.feat_lvl}</span></div>` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

function setupEventListeners() {
  elements.search.addEventListener('input', applyFilters);
  elements.reqLevel.addEventListener('change', applyFilters);

  elements.addAbilReq.addEventListener('click', () => {
    const abil = elements.abilReqSelect.value;
    const val = parseInt(elements.abilReqValue.value);
    if (abil && !isNaN(val)) {
      selectedAbilReqs.push({ abil, val });
      createChip(`${abil} ≤ ${val}`, elements.abilReqChips, () => {
        selectedAbilReqs = selectedAbilReqs.filter(r => r.abil !== abil || r.val !== val);
        applyFilters();
      });
      elements.abilReqSelect.value = '';
      elements.abilReqValue.value = '';
      applyFilters();
    }
  });

  elements.categorySelect.addEventListener('change', () => {
    const val = elements.categorySelect.value;
    if (val && !selectedCategories.includes(val)) {
      selectedCategories.push(val);
      createChip(val, elements.categoryChips, () => {
        selectedCategories = selectedCategories.filter(c => c !== val);
        applyFilters();
      });
      elements.categorySelect.value = '';
      applyFilters();
    }
  });

  elements.abilitySelect.addEventListener('change', () => {
    const val = elements.abilitySelect.value;
    if (val && !selectedAbilities.includes(val)) {
      selectedAbilities.push(val);
      createChip(val, elements.abilityChips, () => {
        selectedAbilities = selectedAbilities.filter(a => a !== val);
        applyFilters();
      });
      elements.abilitySelect.value = '';
      applyFilters();
    }
  });

  elements.tagSelect.addEventListener('change', () => {
    const val = elements.tagSelect.value;
    if (val && !selectedTags.includes(val)) {
      selectedTags.push(val);
      createChip(val, elements.tagChips, () => {
        selectedTags = selectedTags.filter(t => t !== val);
        applyFilters();
      });
      elements.tagSelect.value = '';
      applyFilters();
    }
  });

  document.getElementById('tagModeSwitch').addEventListener('change', (e) => {
    tagMode = e.target.checked ? 'any' : 'all';
    applyFilters();
  });

  document.getElementById('showArchetype').addEventListener('change', (e) => {
    showArchetype = e.target.checked;
    applyFilters();
  });
  document.getElementById('showCharacter').addEventListener('change', (e) => {
    showCharacter = e.target.checked;
    applyFilters();
  });
  document.getElementById('stateFeatSelect').addEventListener('change', (e) => {
    stateFeatMode = e.target.value;
    applyFilters();
  });

  document.querySelectorAll('.feat-headers .sort').forEach(sortBtn => {
    sortBtn.addEventListener('click', (e) => {
      const col = e.target.closest('.col').dataset.col;
      const dir = e.target.dataset.dir === 'asc' ? 1 : -1;
      sortState = { col, dir };
      applyFilters();
    });
  });
}
