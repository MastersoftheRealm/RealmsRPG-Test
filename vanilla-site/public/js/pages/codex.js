import { initFirebase, toggleExpand } from '../codex/core.js';
import { initFeats } from '../codex/feats.js';
import { initSkills } from '../codex/skills.js';
import { initSpecies } from '../codex/species.js';
import { initParts } from '../codex/parts.js';
import { initProperties } from '../codex/properties.js';
import { initEquipment } from '../codex/equipment.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (window.codexInitialized) return;
  window.codexInitialized = true;

  await initFirebase();

  // Attach shared functions to window for HTML onclick handlers
  window.toggleExpand = toggleExpand;

  // Initialize all modules
  initFeats();
  initSkills();
  initSpecies();
  initParts();
  initProperties();
  initEquipment();

  // Tab switching logic (shared across modules)
  window.openTab = function(event, tabName) {
    const tabContents = document.querySelectorAll(".tab-content");
    tabContents.forEach(content => content.classList.remove("active-tab"));

    const tabButtons = document.querySelectorAll(".tab-button");
    tabButtons.forEach(button => button.classList.remove("active"));

    document.getElementById(tabName).classList.add("active-tab");
    event.currentTarget.classList.add("active");
  };
});