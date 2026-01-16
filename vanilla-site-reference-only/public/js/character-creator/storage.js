export function saveCharacter() {
  if (window.character) {
    localStorage.setItem('characterCreator_draft', JSON.stringify(window.character));
    console.log('Character saved:', window.character);
  }
}

export function loadCharacter() {
  const saved = localStorage.getItem('characterCreator_draft');
  if (saved) {
    try {
      window.character = JSON.parse(saved);
      console.log('Character loaded:', window.character);
      return true;
    } catch (e) {
      console.error('Error loading saved character:', e);
    }
  }
  return false;
}

export function clearCharacter() {
  localStorage.removeItem('characterCreator_draft');
  window.character = {};
  location.reload();
}

export function restoreCharacterState() {
  if (!window.character) return;
  
  import('./archetype.js').then(mod => mod.restoreArchetype?.());
  import('./ancestry.js').then(mod => mod.restoreAncestry?.());
  import('./abilities.js').then(mod => mod.restoreAbilities?.());
  import('./skills.js').then(mod => mod.restoreSkills?.());
  import('./feats.js').then(mod => mod.restoreFeats?.());
  import('./equipment.js').then(mod => mod.restoreEquipment?.());
  import('./powers.js').then(mod => mod.restorePowersTechniques?.()); // NEW
  console.log('Character state restored');
}
