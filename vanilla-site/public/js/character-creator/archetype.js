import { saveCharacter } from './storage.js';

let selectedArchetype = null;
let selectedAbility = null;

const buttons = document.querySelectorAll('.archetype-btn');
const dropdowns = {
  power: document.getElementById('dropdown-power'),
  'powered-martial': document.getElementById('dropdown-powered-martial'),
  martial: document.getElementById('dropdown-martial')
};

buttons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const id = btn.id;

    if (selectedArchetype) {
      selectedArchetype.classList.remove('selected');
      dropdowns[selectedArchetype.id].style.display = 'none';
    }

    btn.classList.add('selected');
    selectedArchetype = btn;
    selectedAbility = null;

    const dropdown = dropdowns[id];
    const rect = btn.getBoundingClientRect();
    dropdown.style.display = id === 'powered-martial' ? 'flex' : 'block';
    dropdown.style.top = `${rect.bottom + window.scrollY + 12}px`;

    if (id === 'powered-martial') {
      const dropdownWidth = 340;
      const buttonCenter = rect.left + rect.width / 2;
      dropdown.style.left = `${buttonCenter - dropdownWidth / 2}px`;
      dropdown.style.width = `${dropdownWidth}px`;
    } else {
      dropdown.style.left = `${rect.left}px`;
      dropdown.style.width = `${rect.width}px`;
    }

    const confirmBtn = dropdown.querySelector('.dropdown-confirm button');
    confirmBtn.disabled = true;
  });
});

document.querySelectorAll('.dropdown ul').forEach(ul => {
  ul.addEventListener('click', (e) => {
    if (e.target.tagName === 'LI') {
      ul.querySelectorAll('li').forEach(li => li.classList.remove('selected'));
      e.target.classList.add('selected');
      
      const ability = e.target.textContent.trim();
      const dropdownId = ul.closest('.dropdown').id.replace('dropdown-', '');
      
      if (dropdownId === 'powered-martial') {
        const column = e.target.closest('.column');
        const type = column.querySelector('h3').textContent.toLowerCase().replace(' ', '');
        selectedAbility = selectedAbility || {};
        selectedAbility[type] = ability;
      } else {
        selectedAbility = ability;
      }

      const dropdown = ul.closest('.dropdown');
      const confirmBtn = dropdown.querySelector('.dropdown-confirm button');
      
      if (dropdownId === 'powered-martial') {
        confirmBtn.disabled = !selectedAbility || !selectedAbility.power || !selectedAbility.martial;
      } else {
        confirmBtn.disabled = !selectedAbility;
      }
    }
  });
});

document.getElementById('confirm-power').addEventListener('click', () => confirmArchetype());
document.getElementById('confirm-martial').addEventListener('click', () => confirmArchetype());
document.getElementById('confirm-powered-martial').addEventListener('click', () => confirmArchetype());

function confirmArchetype() {
  if (!selectedArchetype || !selectedAbility) return;

  window.character = window.character || {};
  window.character.archetype = { 
    type: selectedArchetype.id, 
    abilities: selectedAbility  // This will be a string for power/martial, or {power: 'X', martial: 'Y'} for powered-martial
  };
  saveCharacter();

  document.querySelectorAll('.archetype-btn').forEach(btn => btn.style.display = 'none');
  document.querySelectorAll('.dropdown').forEach(d => d.style.display = 'none');

  const lockedDiv = document.getElementById('archetype-locked');
  lockedDiv.style.display = 'block';
  document.getElementById('locked-archetype').textContent = selectedArchetype.textContent;
  const abilityText = typeof selectedAbility === 'string' ? selectedAbility : Object.values(selectedAbility).join(' / ');
  document.getElementById('locked-ability').textContent = abilityText;
}

document.getElementById('change-archetype').addEventListener('click', () => {
  selectedArchetype = null;
  selectedAbility = null;
  document.getElementById('archetype-locked').style.display = 'none';
  document.querySelectorAll('.archetype-btn').forEach(btn => {
    btn.style.display = '';
    btn.classList.remove('selected');
  });
});

document.addEventListener('click', (e) => {
  if (selectedArchetype && !e.target.closest('.archetype-btn') && !e.target.closest('.dropdown')) {
    selectedArchetype.classList.remove('selected');
    dropdowns[selectedArchetype.id].style.display = 'none';
    selectedArchetype = null;
    selectedAbility = null;
  }
});

document.querySelectorAll('.dropdown').forEach(d => {
  d.addEventListener('click', (e) => e.stopPropagation());
});

export function restoreArchetype() {
  const char = window.character;
  if (!char?.archetype) return;
  
  const archetypeBtn = document.getElementById(char.archetype.type);
  if (archetypeBtn) {
    selectedArchetype = archetypeBtn;
    selectedAbility = char.archetype.abilities;
    archetypeBtn.classList.add('selected');
    
    document.querySelectorAll('.archetype-btn').forEach(btn => btn.style.display = 'none');
    document.querySelectorAll('.dropdown').forEach(d => d.style.display = 'none');
    const lockedDiv = document.getElementById('archetype-locked');
    lockedDiv.style.display = 'block';
    document.getElementById('locked-archetype').textContent = archetypeBtn.textContent;
    const abilityText = typeof selectedAbility === 'string' ? selectedAbility : Object.values(selectedAbility).join(' / ');
    document.getElementById('locked-ability').textContent = abilityText;
  }
}
