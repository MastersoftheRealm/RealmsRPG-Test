import { allSkills, allSpecies } from './firebase.js';
import { saveCharacter } from './storage.js';
import { findByIdOrName } from '/js/shared/id-constants.js';

// Helper to find species by ID or name
function findSpecies(char) {
  if (!char) return null;
  return findByIdOrName(allSpecies, { id: char.speciesId, name: char.speciesName });
}

// Helper to find skill by ID or name
function findSkill(ref) {
  return findByIdOrName(allSkills, ref);
}

export let selectedSkills = [];
export let selectedSkillAbilities = {};
export let selectedSkillVals = {}; // legacy holder (will be synced from window.character.skillVals)
export let defenseVals = {
  might: 0,
  fortitude: 0,
  reflex: 0,
  discernment: 0,
  mentalFortitude: 0,
  resolve: 0
};

let skillsInitialized = false;

export function populateSkills() {
  const list = document.getElementById('skills-list');
  if (!list) return;
  
  list.innerHTML = '';
  const searchTerm = document.getElementById('skills-search')?.value.toLowerCase() || '';
  const char = window.character || {};
  
  const species = findSpecies(char);
  const speciesSkills = species ? species.skills : [];

  const canSelectMore = getRemainingSkillPoints() > 0;

  let filteredSkills = allSkills.filter(skill => {
    if (searchTerm && !skill.name.toLowerCase().includes(searchTerm) && !(skill.description && skill.description.toLowerCase().includes(searchTerm))) return false;
    if (skill.base_skill && !selectedSkills.includes(skill.base_skill)) return false;
    return true;
  });

  filteredSkills.forEach(skill => {
    const item = document.createElement('div');
    item.className = 'feat-item';
    if (selectedSkills.includes(skill.name)) {
      item.classList.add('selected-feat');
    }
    const selected = selectedSkills.includes(skill.name);
    const isSpeciesSkill = speciesSkills.includes(skill.name);
    const abilitiesText = skill.ability.length ? ` (${skill.ability.join(', ')})` : '';
    
    const shouldDisable = isSpeciesSkill || (!selected && !canSelectMore);
    
    item.innerHTML = `
      <div class="feat-header">
        <h4>${skill.name}<span style="font-weight: normal; font-size: 14px; color: #888;">${abilitiesText}</span>${isSpeciesSkill ? '<span style="font-size: 12px; color: #0a4a7a; margin-left: 8px;">(Species)</span>' : ''}</h4>
        <span class="feat-arrow">▼</span>
      </div>
      <div class="feat-body">
        <p>${skill.description || 'No description'}</p>
        <button class="feat-select-btn ${selected ? 'selected' : ''}" data-name="${skill.name}" data-type="skill" ${shouldDisable ? 'disabled' : ''}>${selected ? 'Deselect' : 'Select'}</button>
      </div>
    `;
    list.appendChild(item);

    const header = item.querySelector('.feat-header');
    header.addEventListener('click', () => {
      const body = header.nextElementSibling;
      const arrow = header.querySelector('.feat-arrow');
      body.classList.toggle('open');
      arrow.classList.toggle('open');
    });

    const btn = item.querySelector('.feat-select-btn');
    btn.addEventListener('click', () => {
      const name = btn.dataset.name;
      if (selectedSkills.includes(name)) {
        if (speciesSkills.includes(name)) return;
        selectedSkills = selectedSkills.filter(n => n !== name);
        const subSkills = allSkills.filter(s => s.base_skill === name).map(s => s.name);
        selectedSkills = selectedSkills.filter(n => !subSkills.includes(n));

        if (!window.character) window.character = {};
        window.character.skillVals = window.character.skillVals || {};
        delete window.character.skillVals[name];
        subSkills.forEach(sk => delete window.character.skillVals[sk]);

        btn.textContent = 'Select';
        btn.classList.remove('selected');
        item.classList.remove('selected-feat');
      } else {
        if (getRemainingSkillPoints() <= 0) return;
        
        selectedSkills.push(name);
        btn.textContent = 'Deselect';
        btn.classList.add('selected');
        item.classList.add('selected-feat');
      }
      updateSkillPoints();
      if (!window.character) window.character = {};
      window.character.skills = selectedSkills;
      saveCharacter();
      
      populateSkills();
      updateSkillsBonusDisplay(); // <-- ensure bonus display updates after skill selection
    });
  });
}

function getSkillValsTotal() {
  // FIX: always derive from canonical window.character.skillVals
  const vals = (window.character && window.character.skillVals) || {};
  return selectedSkills.reduce((sum, s) => sum + Math.max(0, parseInt(vals[s]) || 0), 0);
}

export function getRemainingSkillPoints() {
  // Calculate defense vals cost (2 points each)
  const defenseSpent = Object.values(defenseVals).reduce((sum, val) => sum + (val * 2), 0);
  return 5 - selectedSkills.length - getSkillValsTotal() - defenseSpent;
}

function getAbilityForDefense(defenseName) {
  const abilityMap = {
    might: 'strength',
    fortitude: 'vitality',
    reflex: 'agility',
    discernment: 'acuity',
    mentalFortitude: 'intelligence',
    resolve: 'charisma'
  };
  const abilityName = abilityMap[defenseName];
  return window.character?.abilities?.[abilityName] || 0;
}

// NEW: Check if defense can be increased (ability must be 0 or less)
function canIncreaseDefense(defenseName) {
  const abilityValue = getAbilityForDefense(defenseName);
  return abilityValue < 1;
}

// NEW: Reset def_vals for defenses whose abilities are 1+
function resetDefensesWithPositiveAbilities() {
  const defenses = ['might', 'fortitude', 'reflex', 'discernment', 'mentalFortitude', 'resolve'];
  let changed = false;
  defenses.forEach(def => {
    if (!canIncreaseDefense(def) && defenseVals[def] > 0) {
      defenseVals[def] = 0;
      changed = true;
    }
  });
  if (changed) {
    updateDefensesDisplay();
    updateSkillPoints();
    saveCharacter();
  }
}

function getDefenseBonus(defenseName) {
  const abilityValue = getAbilityForDefense(defenseName);
  const defVal = defenseVals[defenseName] || 0;
  return abilityValue + defVal;
}

function updateDefensesDisplay() {
  const defenses = ['might', 'fortitude', 'reflex', 'discernment', 'mentalFortitude', 'resolve'];
  defenses.forEach(def => {
    const bonus = getDefenseBonus(def);
    const valueEl = document.querySelector(`.defense-value[data-defense="${def}"]`);
    if (valueEl) {
      valueEl.textContent = bonus > 0 ? `+${bonus}` : bonus;
    }
  });
}

function updateSkillPoints() {
  // FIX: recompute spent using window.character.skillVals instead of stale selectedSkillVals
  const charVals = (window.character && window.character.skillVals) || {};
  // sync legacy mirror so restore logic still works
  selectedSkillVals = { ...charVals };

  let spent = selectedSkills.length;
  selectedSkills.forEach(skill => {
    spent += Math.max(0, parseInt(charVals[skill]) || 0);
  });
  Object.values(defenseVals).forEach(val => {
    spent += (parseInt(val) || 0) * 2;
  });

  let remaining = 5 - spent;
  const el = document.getElementById('skill-points');
  if (el) el.textContent = remaining;

  // Removed: Auto-removal logic when remaining < 0

  if (!window.character) window.character = {};
  window.character.defenseVals = { ...defenseVals };
  // persist updated points & values
  import('./storage.js').then(m => m.saveCharacter?.());
  // emit event for other tabs if needed
  window.dispatchEvent(new CustomEvent('skill-points-changed', { detail: { remaining } }));
}

export function updateSkillsBonusDisplay() {
  const bonusList = document.getElementById('skills-bonus-list');
  if (!bonusList) return;
  
  const char = window.character || {};
  if (!window.character) window.character = {};
  window.character.skillAbilities = window.character.skillAbilities || {};
  window.character.skillVals = window.character.skillVals || {};

  const fmt = (n) => (n >= 0 ? `+${n}` : `${n}`);

  const species = findSpecies(char);
  const speciesSkills = species ? species.skills : [];
  
  if (selectedSkills.length === 0) {
    bonusList.innerHTML = '<p class="no-skills-message">No skills selected yet</p>';
    return;
  }

  const abilityVals = (char.abilities) ? char.abilities : {
    strength: 0, vitality: 0, agility: 0,
    acuity: 0, intelligence: 0, charisma: 0
  };

  const sortedSkills = [...selectedSkills].sort();

  bonusList.innerHTML = sortedSkills.map(skillName => {
    const isSpeciesSkill = speciesSkills.includes(skillName);
    const skillObj = findSkill({ name: skillName });
    const abilList = (skillObj && Array.isArray(skillObj.ability)) ? skillObj.ability : [];
    let chosenAbility;

    const skill_val = Math.max(0, parseInt(window.character.skillVals[skillName]) || 0);
    const hasValue = skill_val > 0;
    
    const isSubSkill = skillObj && skillObj.base_skill;
    const subSkillBonus = isSubSkill ? 1 : 0;

    // Remove button (disabled for species skills)
    const removeBtn = isSpeciesSkill 
      ? '' 
      : `<button type="button" class="skill-remove-btn" data-skill="${skillName}" aria-label="Remove skill" title="Remove skill">✕</button>`;

    if (abilList.length === 1) {
      chosenAbility = abilList[0];
      window.character.skillAbilities[skillName] = chosenAbility;
      const abilKey = chosenAbility.toLowerCase();
      const rawVal = abilityVals[abilKey] ?? 0;
      const totalVal = rawVal + skill_val + subSkillBonus;
      const displayVal = fmt(totalVal);
      return `
        <div class="skill-bonus-item ${isSpeciesSkill ? 'species-skill' : ''}">
          <span class="skill-bonus-name">${skillName}${isSpeciesSkill ? ' <span style="font-size:11px;color:#0a4a7a;">(Species)</span>' : ''}</span>
          <span class="skill-fixed-ability">${chosenAbility}</span>
          <div class="skill-val-controls" title="Adjust skill value">
            <button type="button" class="skill-val-btn dec" data-skill="${skillName}" aria-label="Decrease">-</button>
            <button type="button" class="skill-val-btn inc ${hasValue ? 'active' : ''}" data-skill="${skillName}" aria-label="Increase">+</button>
          </div>
          <span class="skill-bonus-value">${displayVal}</span>
          ${removeBtn}
        </div>
      `;
    }

    if (abilList.length > 1) {
      chosenAbility = window.character.skillAbilities[skillName] || abilList[0];
      if (!window.character.skillAbilities[skillName]) {
        window.character.skillAbilities[skillName] = chosenAbility;
      }
      const abilKey = chosenAbility.toLowerCase();
      const rawVal = abilityVals[abilKey] ?? 0;
      const totalVal = rawVal + skill_val + subSkillBonus;
      const displayVal = fmt(totalVal);
      const selectHtml = `<select class="skill-ability-select" data-skill="${skillName}">
        ${abilList.map(a => `<option value="${a}" ${a === chosenAbility ? 'selected' : ''}>${a}</option>`).join('')}
      </select>`;
      return `
        <div class="skill-bonus-item ${isSpeciesSkill ? 'species-skill' : ''}">
          <span class="skill-bonus-name">${skillName}${isSpeciesSkill ? ' <span style="font-size:11px;color:#0a4a7a;">(Species)</span>' : ''}</span>
          ${selectHtml}
          <div class="skill-val-controls" title="Adjust skill value">
            <button type="button" class="skill-val-btn dec" data-skill="${skillName}" aria-label="Decrease">-</button>
            <button type="button" class="skill-val-btn inc ${hasValue ? 'active' : ''}" data-skill="${skillName}" aria-label="Increase">+</button>
          </div>
          <span class="skill-bonus-value">${displayVal}</span>
          ${removeBtn}
        </div>
      `;
    }

    const totalVal = 0 + skill_val + subSkillBonus;
    const displayVal = fmt(totalVal);
    return `
      <div class="skill-bonus-item ${isSpeciesSkill ? 'species-skill' : ''}">
        <span class="skill-bonus-name">${skillName}${isSpeciesSkill ? ' <span style="font-size:11px;color:#0a4a7a;">(Species)</span>' : ''}</span>
        <span class="skill-fixed-ability">—</span>
        <div class="skill-val-controls" title="Adjust skill value">
          <button type="button" class="skill-val-btn dec" data-skill="${skillName}" aria-label="Decrease">-</button>
          <button type="button" class="skill-val-btn inc ${hasValue ? 'active' : ''}" data-skill="${skillName}" aria-label="Increase">+</button>
        </div>
        <span class="skill-bonus-value">${displayVal}</span>
        ${removeBtn}
      </div>
    `;
  }).join('');

  saveCharacter();
  // After rendering, ensure points display reflects any changes
  updateSkillPoints();
}

document.addEventListener('change', (e) => {
  if (e.target.matches('.skill-ability-select')) {
    const skill = e.target.dataset.skill;
    const val = e.target.value;
    if (!window.character) window.character = {};
    window.character.skillAbilities = window.character.skillAbilities || {};
    window.character.skillAbilities[skill] = val;
    saveCharacter();
    updateSkillsBonusDisplay();
  }
});

document.addEventListener('click', (e) => {
  const btn = e.target.closest('.skill-val-btn');
  if (!btn) return;
  const skill = btn.dataset.skill;
  if (!skill) return;

  if (!window.character) window.character = {};
  window.character.skillVals = window.character.skillVals || {};
  const current = Math.max(0, parseInt(window.character.skillVals[skill]) || 0);

  if (btn.classList.contains('inc')) {
    if (getRemainingSkillPoints() <= 0) return;
    if (current >= 3) return; // clamp
    window.character.skillVals[skill] = current + 1;
  } else {
    if (current <= 0) return;
    window.character.skillVals[skill] = current - 1;
  }

  updateSkillPoints();            // FIX: recalc immediately
  updateSkillsBonusDisplay();     // refresh bonuses
  populateSkills();               // refresh selectable list
});

// NEW: Handle skill removal
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.skill-remove-btn');
  if (!btn) return;
  const skillName = btn.dataset.skill;
  if (!skillName) return;

  const char = window.character || {};
  const species = findSpecies(char);
  const speciesSkills = species ? species.skills : [];
  
  // Don't allow removing species skills
  if (speciesSkills.includes(skillName)) return;

  // Remove from selectedSkills
  selectedSkills = selectedSkills.filter(n => n !== skillName);
  
  // Remove any sub-skills
  const subSkills = allSkills.filter(s => s.base_skill === skillName).map(s => s.name);
  selectedSkills = selectedSkills.filter(n => !subSkills.includes(n));

  // Remove skill vals
  if (!window.character) window.character = {};
  window.character.skillVals = window.character.skillVals || {};
  delete window.character.skillVals[skillName];
  subSkills.forEach(sk => delete window.character.skillVals[sk]);

  // Update character
  window.character.skills = selectedSkills;
  
  saveCharacter();
  updateSkillPoints();           // FIX: recalc after removal
  updateSkillsBonusDisplay();
  populateSkills();
});

// NEW: Toggle visibility of skills tab content based on species selection
function updateSkillsVisibility() {
  const warning = document.getElementById('skills-warning');
  const main = document.getElementById('skills-main');
  if (!warning || !main) return;
  const hasSpecies = !!(window.character && window.character.speciesName);
  warning.style.display = hasSpecies ? 'none' : 'block';
  main.style.display = hasSpecies ? '' : 'none';
}

function initSkills() {
  // NEW: Update visibility on tab entry
  updateSkillsVisibility();
  
  // NEW: Don't initialize skills if no species selected
  if (!window.character?.speciesName) {
    return;
  }
  
  if (!skillsInitialized) {
    const skillsHeader = document.querySelector('#content-skills .section-header');
    if (skillsHeader) {
      const newSkillsHeader = skillsHeader.cloneNode(true);
      skillsHeader.parentNode.replaceChild(newSkillsHeader, skillsHeader);
      
      newSkillsHeader.addEventListener('click', () => {
        const body = document.getElementById('skills-body');
        const arrow = newSkillsHeader.querySelector('.toggle-arrow');
        if (body && arrow) {
          body.classList.toggle('open');
          arrow.classList.toggle('open');
        }
      });
    }

    const searchInput = document.getElementById('skills-search');
    if (searchInput) {
      const newSearchInput = searchInput.cloneNode(true);
      searchInput.parentNode.replaceChild(newSearchInput, searchInput);
      newSearchInput.addEventListener('keyup', populateSkills);
    }

    const codexBtn = document.getElementById('open-codex-skills');
    if (codexBtn) {
      const newCodexBtn = codexBtn.cloneNode(true);
      codexBtn.parentNode.replaceChild(newCodexBtn, codexBtn);
      newCodexBtn.addEventListener('click', () => {
        window.open('/codex.html', '_blank');
      });
    }

    const continueBtn = document.getElementById('skills-continue');
    if (continueBtn) {
      const newContinueBtn = continueBtn.cloneNode(true);
      continueBtn.parentNode.replaceChild(newContinueBtn, continueBtn);
      newContinueBtn.addEventListener('click', () => {
        document.querySelector('.tab[data-tab="feats"]')?.click();
      });
    }

    document.querySelectorAll('.defense-control').forEach(control => {
      const defenseName = control.dataset.defense;
      const incBtn = control.querySelector('.inc');
      const decBtn = control.querySelector('.dec');
      
      incBtn.addEventListener('click', () => {
        // NEW: Check if ability is 1 or higher
        if (!canIncreaseDefense(defenseName)) {
          alert('Cannot increase this defense - the associated ability is already 1 or higher.');
          return;
        }
        
        const currentPoints = parseInt(document.getElementById('skill-points')?.textContent) || 0;
        if (currentPoints >= 2) {
          defenseVals[defenseName] = (defenseVals[defenseName] || 0) + 1;
          updateDefensesDisplay();
          updateSkillPoints();
          saveCharacter();
        }
      });
      
      decBtn.addEventListener('click', () => {
        if (defenseVals[defenseName] > 0) {
          defenseVals[defenseName]--;
          updateDefensesDisplay();
          updateSkillPoints();
          saveCharacter();
        }
      });
    });
    
    skillsInitialized = true;
  }

  const body = document.getElementById('skills-body');
  const arrow = document.querySelector('#content-skills .toggle-arrow');
  if (body) body.classList.add('open');
  if (arrow) arrow.classList.add('open');

  const char = window.character || {};
  const species = findSpecies(char);
  const speciesSkills = species ? species.skills : [];
  const skillsText = speciesSkills.length ? speciesSkills.join(', ') : 'None';
  const descEl = document.getElementById('skills-description');
  if (descEl) {
    descEl.innerHTML = `Now you can choose your skills. Picking a new skill grants you proficiency, while allocating more points to a skill you have increases its bonus!<br><strong>Species Skills: ${skillsText}</strong>`;
  }

  const skillsToAdd = speciesSkills.filter(skill => !selectedSkills.includes(skill));
  selectedSkills = [...selectedSkills, ...skillsToAdd];
  updateSkillPoints();

  populateSkills();
  updateSkillsBonusDisplay();
  updateDefensesDisplay();
}

document.querySelector('.tab[data-tab="skills"]')?.addEventListener('click', async () => {
  const { loadSkills } = await import('./firebase.js');
  await loadSkills();
  initSkills();
});

// NEW: Wire "Go to Species" button
document.getElementById('go-to-species-from-skills')?.addEventListener('click', () => {
  document.querySelector('.tab[data-tab="species"]')?.click();
});

export function restoreSkills() {
  if (window.character?.skills) {
    selectedSkills = window.character.skills;
  }
  if (window.character?.skillAbilities) {
    selectedSkillAbilities = window.character.skillAbilities;
  }
  if (window.character?.skillVals) {
    // sync both canonical and legacy mirrors
    selectedSkillVals = { ...window.character.skillVals };
  }
  if (window.character?.defenseVals) {
    defenseVals = { ...window.character.defenseVals };
  }
  updateSkillsVisibility();
  initSkills();
  updateSkillPoints();            // FIX: ensure display matches restored state
  updateSkillsBonusDisplay();
}

// NEW: Listen for ability changes and reset defenses
document.addEventListener('abilities-changed', () => {
  resetDefensesWithPositiveAbilities();
  updateDefensesDisplay();
  updateSkillsBonusDisplay();     // FIX: ability changes affect skill bonuses
});
