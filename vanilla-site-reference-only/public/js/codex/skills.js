import { getWithRetry, createChip, applySort } from './core.js';

let allSkills = [];
let filteredSkills = [];
let skillSortState = { col: 'name', dir: 1 };
let selectedSkillAbilities = [];
let selectedBaseSkill = '';
let showSubSkills = true;
let subSkillsOnly = false;
let skillsLoaded = false;

const elements = {
  list: document.getElementById('skillList'),
  search: document.getElementById('skillSearch'),
  abilitySelect: document.getElementById('skillAbilitySelect'),
  abilityChips: document.getElementById('skillAbilityChips'),
  baseSkillSelect: document.getElementById('baseSkillSelect'),
};

export function initSkills() {
  loadSkills();
  setupEventListeners();
}

function loadSkills() {
  if (skillsLoaded) return;
  console.log('Loading skills...');
  getWithRetry('skills')
    .then(snap => {
      const data = snap.val();
      if (!data) {
        elements.list.innerHTML = '<div class="no-results">No skills found in database.</div>';
        return;
      }
      allSkills = Object.values(data).map(s => ({
        ...s,
        ability: typeof s.ability === 'string' ? s.ability.split(',').map(a => a.trim()).filter(a => a) : (Array.isArray(s.ability) ? s.ability : []),
      }));
      window.allSkills = allSkills;
      console.log(`✓ Loaded ${allSkills.length} skills successfully`);
      skillsLoaded = true;
      populateFilters();
      applyFilters();
    })
    .catch(err => {
      console.error('Error loading skills:', err);
      let errorMsg = 'Error loading skills. ';
      if (err.code === 'PERMISSION_DENIED') {
        errorMsg += 'Permission denied - check Firebase Realtime Database Rules.';
      }
      elements.list.innerHTML = `<div class="no-results">${errorMsg}</div>`;
    });
}

function populateFilters() {
  const abilities = new Set();
  const baseSkills = new Set();

  allSkills.forEach(s => {
    s.ability.forEach(a => abilities.add(a));
    if (s.base_skill) baseSkills.add(s.base_skill);
  });

  const addOpts = (sel, vals) => {
    sel.innerHTML = '<option value="">Choose...</option>' + Array.from(vals).sort().map(v => `<option value="${v}">${v}</option>`).join('');
  };

  addOpts(elements.abilitySelect, abilities);
  elements.baseSkillSelect.innerHTML = '<option value="">Any</option>' + Array.from(baseSkills).sort().map(v => `<option value="${v}">${v}</option>`).join('');
}

export function applyFilters() {
  const searchTerm = elements.search.value.toLowerCase();

  filteredSkills = allSkills.filter(s => {
    if (searchTerm && !s.name.toLowerCase().includes(searchTerm) && !(s.description && s.description.toLowerCase().includes(searchTerm)) && !(s.success_desc && s.success_desc.toLowerCase().includes(searchTerm)) && !(s.failure_desc && s.failure_desc.toLowerCase().includes(searchTerm))) return false;
    if (selectedSkillAbilities.length && !selectedSkillAbilities.some(a => s.ability.includes(a))) return false;
    if (selectedBaseSkill && s.base_skill !== selectedBaseSkill) return false;
    if (!showSubSkills && s.base_skill) return false;
    if (subSkillsOnly && !s.base_skill) return false;
    return true;
  });

  applySort(filteredSkills, skillSortState, skillSortState.col);
  renderSkills();
}

function renderSkills() {
  if (!filteredSkills.length) {
    elements.list.innerHTML = '<div class="no-results">No skills match your filters.</div>';
    return;
  }

  elements.list.innerHTML = filteredSkills.map(s => `
    <div class="skill-card" data-name="${s.name}">
      <div class="skill-header" onclick="toggleSkillExpand(this)">
        <div class="col">${s.name}</div>
        <div class="col">${s.ability.join(', ')}</div>
        <div class="col">${s.base_skill || ''}</div>
        <span class="expand-icon">▼</span>
      </div>
      <div class="skill-body">
        ${s.description ? `<div class="skill-description" style="color:#000;">${s.description}</div>` : ''}
        ${s.success_desc ? `<div class="skill-success" style="color:#000;"><strong>Success:</strong> ${s.success_desc}</div>` : ''}
        ${s.failure_desc ? `<div class="skill-failure" style="color:#000;"><strong>Failure:</strong> ${s.failure_desc}</div>` : ''}
        ${s.ds_calc ? `<div class="ds-calc-chip" onclick="toggleDsCalc(this)">Difficulty Score Calculation ▼</div><div class="ds-calc-content">${s.ds_calc}</div>` : ''}
      </div>
    </div>
  `).join('');
}

function setupEventListeners() {
  elements.search.addEventListener('input', applyFilters);

  elements.abilitySelect.addEventListener('change', () => {
    const val = elements.abilitySelect.value;
    if (val && !selectedSkillAbilities.includes(val)) {
      selectedSkillAbilities.push(val);
      createChip(val, elements.abilityChips, () => {
        selectedSkillAbilities = selectedSkillAbilities.filter(a => a !== val);
        applyFilters();
      });
      elements.abilitySelect.value = '';
      applyFilters();
    }
  });

  elements.baseSkillSelect.addEventListener('change', () => {
    selectedBaseSkill = elements.baseSkillSelect.value || '';
    applyFilters();
  });

  document.getElementById('showSubSkills').addEventListener('change', (e) => {
    showSubSkills = e.target.checked;
    if (!showSubSkills && subSkillsOnly) {
      subSkillsOnly = false;
      document.getElementById('subSkillsOnly').checked = false;
    }
    applyFilters();
  });

  document.getElementById('subSkillsOnly').addEventListener('change', (e) => {
    subSkillsOnly = e.target.checked;
    if (subSkillsOnly && !showSubSkills) {
      showSubSkills = true;
      document.getElementById('showSubSkills').checked = true;
    }
    applyFilters();
  });

  document.querySelectorAll('.skill-headers .sort').forEach(sortBtn => {
    sortBtn.addEventListener('click', (e) => {
      const col = e.target.closest('.col').dataset.col;
      const dir = e.target.dataset.dir === 'asc' ? 1 : -1;
      skillSortState = { col, dir };
      applyFilters();
    });
  });
}

window.toggleSkillExpand = function(header) {
  header.parentElement.classList.toggle('expanded');
};

window.toggleDsCalc = function(chip) {
  chip.nextElementSibling.classList.toggle('expanded');
  chip.textContent = chip.nextElementSibling.classList.contains('expanded') ? 'Difficulty Score Calculation ▲' : 'Difficulty Score Calculation ▼';
};
