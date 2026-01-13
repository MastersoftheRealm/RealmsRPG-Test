import { archetypeFeats, characterFeats } from './firebase.js';
import { saveCharacter } from './storage.js';

export let selectedArchetypeFeats = [];
export let selectedCharacterFeats = [];
let featsInitialized = false;

function populateFeatsSection(sectionId, feats, isArchetype) {
  const list = document.getElementById(`${sectionId}-feats-list`);
  if (!list) return;
  
  list.innerHTML = '';
  const searchInput = document.getElementById(`${sectionId}-search`);
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  const char = window.character || {};
  const abilities = char.abilities || {};

  let filteredFeats = feats.filter(feat => {
    if ((isArchetype ? selectedArchetypeFeats : selectedCharacterFeats).includes(feat.name)) return true;
    if (!searchTerm) return false;
    
    if (feat.lvl_req > 1) return false;
    if (feat.ability_req && Array.isArray(feat.ability_req) && feat.abil_req_val && Array.isArray(feat.abil_req_val)) {
      for (let i = 0; i < feat.ability_req.length; i++) {
        const reqAbil = feat.ability_req[i].toLowerCase();
        const reqVal = feat.abil_req_val[i] || 0;
        if ((abilities[reqAbil] || 0) < reqVal) return false;
      }
    }
    if (!feat.name.toLowerCase().includes(searchTerm) && !(feat.description && feat.description.toLowerCase().includes(searchTerm))) return false;
    return true;
  });

  const selectedFeats = filteredFeats.filter(feat => (isArchetype ? selectedArchetypeFeats : selectedCharacterFeats).includes(feat.name));
  const nonSelectedFeats = filteredFeats.filter(feat => !(isArchetype ? selectedArchetypeFeats : selectedCharacterFeats).includes(feat.name));

  [...nonSelectedFeats, ...selectedFeats].forEach(feat => {
    const item = document.createElement('div');
    item.className = 'feat-item';
    if ((isArchetype ? selectedArchetypeFeats : selectedCharacterFeats).includes(feat.name)) {
      item.classList.add('selected-feat');
    }
    const selected = (isArchetype ? selectedArchetypeFeats : selectedCharacterFeats).includes(feat.name);
    item.innerHTML = `
      <div class="feat-header">
        <h4>${feat.name}</h4>
        <span class="feat-arrow">▼</span>
      </div>
      <div class="feat-body">
        <p>${feat.description || 'No description'}</p>
        <button class="feat-select-btn ${selected ? 'selected' : ''}" data-name="${feat.name}" data-type="${isArchetype ? 'archetype' : 'character'}">${selected ? 'Deselect' : 'Select'}</button>
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
      const type = btn.dataset.type;
      if (type === 'archetype') {
        const char = window.character || {};
        const archetype = char.archetype || {};
        let limit = 0;
        if (archetype.type === 'martial') limit = 3;
        else if (archetype.type === 'powered-martial') limit = 2;
        else if (archetype.type === 'power') limit = 1;
        if (selectedArchetypeFeats.includes(name)) {
          selectedArchetypeFeats = selectedArchetypeFeats.filter(n => n !== name);
          btn.textContent = 'Select';
          btn.classList.remove('selected');
          item.classList.remove('selected-feat');
        } else if (selectedArchetypeFeats.length < limit) {
          selectedArchetypeFeats.push(name);
          btn.textContent = 'Deselect';
          btn.classList.add('selected');
          item.classList.add('selected-feat');
        }
      } else {
        if (selectedCharacterFeats.includes(name)) {
          selectedCharacterFeats = selectedCharacterFeats.filter(n => n !== name);
          btn.textContent = 'Select';
          btn.classList.remove('selected');
          item.classList.remove('selected-feat');
        } else if (selectedCharacterFeats.length < 1) {
          selectedCharacterFeats.push(name);
          btn.textContent = 'Deselect';
          btn.classList.add('selected');
          item.classList.add('selected-feat');
        }
      }
      if (!window.character) window.character = {};
      window.character.feats = {
        archetype: selectedArchetypeFeats,
        character: selectedCharacterFeats
      };
      saveCharacter();
    });
  });
}

function initFeats() {
  if (!featsInitialized) {
    document.querySelectorAll('#content-feats .section-header').forEach(header => {
      const newHeader = header.cloneNode(true);
      header.parentNode.replaceChild(newHeader, header);
      
      newHeader.addEventListener('click', () => {
        const body = newHeader.nextElementSibling;
        const arrow = newHeader.querySelector('.toggle-arrow');
        if (body && arrow) {
          body.classList.toggle('open');
          arrow.classList.toggle('open');
        }
      });
    });

    document.querySelectorAll('#content-feats .search-input').forEach(input => {
      const newInput = input.cloneNode(true);
      input.parentNode.replaceChild(newInput, input);
      
      newInput.addEventListener('keyup', () => {
        const sectionId = newInput.id.replace('-search', '');
        populateFeatsSection(sectionId, sectionId === 'archetype' ? archetypeFeats : characterFeats, sectionId === 'archetype');
      });
    });

    const continueBtn = document.getElementById('feats-continue');
    if (continueBtn) {
      const newContinueBtn = continueBtn.cloneNode(true);
      continueBtn.parentNode.replaceChild(newContinueBtn, continueBtn);
      newContinueBtn.addEventListener('click', () => {
        document.querySelector('.tab[data-tab="equipment"]')?.click();
      });
    }

    const codexBtn = document.getElementById('open-codex');
    if (codexBtn) {
      const newCodexBtn = codexBtn.cloneNode(true);
      codexBtn.parentNode.replaceChild(newCodexBtn, codexBtn);
      newCodexBtn.addEventListener('click', () => {
        window.open('/codex.html', '_blank');
      });
    }

    featsInitialized = true;
  }

  const char = window.character || {};
  const archetype = char.archetype || {};
  let archetypeName = 'Unknown';
  let featCount = 0;
  if (archetype.type === 'martial') {
    archetypeName = 'Martial';
    featCount = 3;
  } else if (archetype.type === 'powered-martial') {
    archetypeName = 'Powered-Martial';
    featCount = 2;
  } else if (archetype.type === 'power') {
    archetypeName = 'Power';
    featCount = 1;
  }
  let featText = featCount === 1 ? 'archetype feat' : 'archetype feats';
  const descEl = document.getElementById('feats-description');
  if (descEl) {
    descEl.innerHTML = `As a <strong>${archetypeName} archetype</strong>, you get to choose <strong>${featCount} ${featText}</strong>, and <strong>one character feat</strong>! Open a new tab to the codex and search through feats that might fit your character idea, abilities, and archetype! Once you find the ones you like, search for their names here and add them to your character.`;
  }

  populateFeatsSection('archetype', archetypeFeats, true);
  populateFeatsSection('character', characterFeats, false);
  
  document.querySelectorAll('#content-feats .section-body').forEach(body => {
    body.classList.add('open');
  });
  document.querySelectorAll('#content-feats .toggle-arrow').forEach(arrow => {
    arrow.classList.add('open');
  });
}

document.querySelector('.tab[data-tab="feats"]')?.addEventListener('click', async () => {
  const { loadFeats } = await import('./firebase.js');
  await loadFeats();
  initFeats();
});

export function restoreFeats() {
  if (window.character?.feats) {
    selectedArchetypeFeats = window.character.feats.archetype || [];
    selectedCharacterFeats = window.character.feats.character || [];
  }
  initFeats();
}
