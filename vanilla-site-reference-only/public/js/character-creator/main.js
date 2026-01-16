import { initializeFirebase, loadTraits, loadSpecies, loadFeats, loadSkills, loadEquipment, allSpecies } from './firebase.js';
import { loadCharacter, clearCharacter, restoreCharacterState } from './storage.js';
import { populateAncestryGrid } from './ancestry.js';
import './tabs.js';
import './archetype.js';
import './ancestry.js';
import './abilities.js';
import './skills.js';
import './feats.js';
import './equipment.js';
import './powers.js';
import { getArchetypeAbilityScore, getBaseHealth, getBaseEnergy, getDefaultTrainingPoints } from './utils.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js';
import { findByIdOrName } from '/js/shared/id-constants.js';

// Helper to find species by ID or name
function findSpecies(char) {
  if (!char) return null;
  return findByIdOrName(allSpecies, { id: char.speciesId, name: char.speciesName });
}

// Global character object
window.character = {};

// Load header/footer
async function loadHeaderFooter() {
  const header = document.getElementById('header');
  const footer = document.getElementById('footer');
  if (header) header.innerHTML = await fetch('/partials/header.html').then(r => r.text());
  if (footer) footer.innerHTML = await fetch('/partials/footer.html').then(r => r.text());
}
loadHeaderFooter();

// Clear progress button
document.getElementById('clear-progress-btn')?.addEventListener('click', () => {
  if (confirm('Are you sure you want to clear all progress? This cannot be undone.')) {
    clearCharacter();
  }
});

// Initialize and load data
(async () => {
  console.log('Initializing character creator...');
  
  // Initialize Firebase first
  window.db = await initializeFirebase();
  console.log('Firebase initialized');
  
  // Load all database content in parallel
  console.log('Loading database content...');
  await Promise.all([
    loadTraits(),
    loadSpecies(),
    loadFeats(),
    loadSkills(),
    loadEquipment() // Load general equipment from database
  ]);
  console.log('All database content loaded');

  // Populate ancestry grid (requires species and traits)
  populateAncestryGrid();

  // Restore saved character if exists
  const hasData = loadCharacter();
  if (hasData && window.character) {
    console.log('Restoring saved character state');
    restoreCharacterState();
  }
  
  console.log('Character creator ready');
})();

function getArchetypeAbility() {
    const char = window.character || {};
    const archetype = char.archetype || {};
    if (archetype.type === 'power') return archetype.ability;
    if (archetype.type === 'martial') return archetype.ability;
    if (archetype.type === 'powered-martial') return [archetype.powerAbility, archetype.martialAbility];
    return null;
}

function getAbilityScore(name) {
    return (window.character?.abilities?.[name?.toLowerCase()] ?? 0);
}

function updateFinalizeTab() {
    // Fill fields from character if available
    document.getElementById('finalize-name').value = window.character?.name || '';
    document.getElementById('finalize-height').value = window.character?.height || '';
    document.getElementById('finalize-weight').value = window.character?.weight || '';
    document.getElementById('finalize-appearance').value = window.character?.appearance || '';
    
    // Replace archetype description retrieval to also accept legacy stored key
    const legacyArchetypeDesc = window.character?.['archetype-desc'];
    const archetypeDescValue = window.character?.archetypeDesc ?? legacyArchetypeDesc ?? '';
    document.getElementById('finalize-archetype-desc').value = archetypeDescValue;
    
    document.getElementById('finalize-notes').value = window.character?.notes || '';

    // Health/Energy allocation
    const baseHealth = getBaseHealth();
    const baseEnergy = getBaseEnergy();
    let health = window.character?.finalizeHealth ?? baseHealth;
    let energy = window.character?.finalizeEnergy ?? baseEnergy;
    let hepRemaining = 18 - ((health - baseHealth) + (energy - baseEnergy));
    if (hepRemaining < 0) {
        health = baseHealth;
        energy = baseEnergy;
        hepRemaining = 18;
    }
    document.getElementById('finalize-health').value = health;
    document.getElementById('finalize-energy').value = energy;
    document.getElementById('finalize-hep-remaining').textContent = hepRemaining;
    document.getElementById('finalize-health-base').textContent = `(Base: ${baseHealth})`;
    document.getElementById('finalize-energy-base').textContent = `(Base: ${baseEnergy})`;

    // NEW: Deduplicate any accidentally duplicated Size dropdowns (keep the first)
    const sizeDupes = document.querySelectorAll('select#finalize-size');
    if (sizeDupes.length > 1) {
        sizeDupes.forEach((sel, idx) => {
            if (idx > 0) {
                const prevLabel = sel.previousElementSibling;
                if (prevLabel && prevLabel.tagName === 'LABEL' && prevLabel.getAttribute('for') === 'finalize-size') {
                    prevLabel.remove();
                }
                sel.remove();
            }
        });
    }

    // NEW: Populate Size dropdown from species
    const sizeSelect = document.getElementById('finalize-size');
    if (sizeSelect) {
        sizeSelect.innerHTML = '';
        const char = window.character;
        if (!char?.speciesId && !char?.speciesName) {
            sizeSelect.disabled = true;
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = 'Select species first';
            opt.disabled = true;
            opt.selected = true;
            sizeSelect.appendChild(opt);
        } else {
            sizeSelect.disabled = false;
            const species = findSpecies(char);
            const sizes = species?.sizes || [];
            const savedSize = window.character?.size || '';

            if (sizes.length > 1) {
                const ph = document.createElement('option');
                ph.value = '';
                ph.textContent = 'Choose a size';
                ph.disabled = true;
                ph.selected = !savedSize;
                sizeSelect.appendChild(ph);
            }
            sizes.forEach(sz => {
                const opt = document.createElement('option');
                opt.value = sz;
                opt.textContent = sz;
                if (savedSize === sz) opt.selected = true;
                sizeSelect.appendChild(opt);
            });

            // Auto-select if exactly one size and none saved yet
            if (!savedSize && sizes.length === 1) {
                sizeSelect.value = sizes[0];
                window.character.size = sizes[0];
            }
        }
    }
}

function setupFinalizeTabEvents() {
    // Save fields to character object
    ['finalize-name','finalize-height','finalize-weight','finalize-appearance','finalize-archetype-desc','finalize-notes','finalize-size'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', e => {
            let key = id.replace('finalize-','');
            if (key === 'archetype-desc') key = 'archetypeDesc'; // FIX: proper camelCase storage
            window.character[key] = e.target.value;
        });
        el.addEventListener('change', e => {
            let key = id.replace('finalize-','');
            if (key === 'archetype-desc') key = 'archetypeDesc'; // FIX: proper camelCase storage
            window.character[key] = e.target.value;
        });
    });

    // Health/Energy allocation
    function updateAllocation(deltaHealth, deltaEnergy) {
        const baseHealth = getBaseHealth();
        const baseEnergy = getBaseEnergy();
        let health = parseInt(document.getElementById('finalize-health').value) || baseHealth;
        let energy = parseInt(document.getElementById('finalize-energy').value) || baseEnergy;
        health += deltaHealth;
        energy += deltaEnergy;
        // Clamp to base values
        health = Math.max(baseHealth, health);
        energy = Math.max(baseEnergy, energy);
        // Clamp to max allocation
        let hepUsed = (health - baseHealth) + (energy - baseEnergy);
        if (hepUsed > 18) {
            // Don't allow over-allocation
            if (deltaHealth > 0) health -= deltaHealth;
            if (deltaEnergy > 0) energy -= deltaEnergy;
            hepUsed = (health - baseHealth) + (energy - baseEnergy);
        }
        document.getElementById('finalize-health').value = health;
        document.getElementById('finalize-energy').value = energy;
        document.getElementById('finalize-hep-remaining').textContent = 18 - hepUsed;
        window.character.finalizeHealth = health;
        window.character.finalizeEnergy = energy;
    }
    document.getElementById('finalize-inc-health').addEventListener('click', () => updateAllocation(1,0));
    document.getElementById('finalize-dec-health').addEventListener('click', () => updateAllocation(-1,0));
    document.getElementById('finalize-inc-energy').addEventListener('click', () => updateAllocation(0,1));
    document.getElementById('finalize-dec-energy').addEventListener('click', () => updateAllocation(0,-1));
}

// NEW: Validation function
function validateCharacter() {
    const char = window.character || {};
    const issues = [];
    
    // NEW: Finalize details – Name and Weight
    const name = (char.name || '').trim();
    if (!name) {
        issues.push("📝 Your hero needs a name! Give them something legendary.");
    }
    const weightNum = Number(char.weight);
    if (!Number.isFinite(weightNum) || weightNum <= 0) {
        issues.push("⚖️ You still need to enter a valid weight! Make sure it's a positive number.");
    }

    // 1. Check archetype selection
    if (!char.archetype || !char.archetype.type) {
        issues.push("🎭 You haven't selected an archetype yet! Head back to the Archetype tab to choose your path.");
    } else if (!char.archetype.abilities) {
        issues.push("✨ Your archetype needs an ability assignment! Pick which ability drives your character.");
    } else {
        // Check archetype feats
        const archetypeType = char.archetype.type;
        const archetypeFeats = char.feats?.archetype || [];
        let expectedCount = 0;
        if (archetypeType === 'power') expectedCount = 1;
        else if (archetypeType === 'powered-martial') expectedCount = 2;
        else if (archetypeType === 'martial') expectedCount = 3;
        
        if (archetypeFeats.length < expectedCount) {
            const diff = expectedCount - archetypeFeats.length;
            const plural = diff === 1 ? 'feat' : 'feats';
            issues.push(`💪 You still need to select ${diff} more archetype ${plural}! Visit the Feats tab to complete your selection.`);
        }
    }
    
    // 2. Check species and ancestry traits
    if (!char.speciesId && !char.speciesName) {
        issues.push("🌟 You need to choose your species! Head to the Species tab to pick your ancestry.");
    } else {
        // Require Size if species provides sizes
        const species = findSpecies(char);
        const sizes = species?.sizes || [];
        if (sizes.length > 0) {
            if (!char.size || !sizes.includes(char.size)) {
                issues.push("📏 You still need to select a size!");
            }
        }

        const hasFlaw = !!char.flawTrait;
        const ancestryCount = char.ancestryTraits?.length || 0;
        const expectedAncestry = hasFlaw ? 2 : 1;
        
        if (ancestryCount < expectedAncestry) {
            const diff = expectedAncestry - ancestryCount;
            const plural = diff === 1 ? 'trait' : 'traits';
            issues.push(`🧬 You need to select ${diff} more ancestry ${plural}! ${hasFlaw ? 'Since you picked a flaw, you get to choose 2!' : 'Choose one that fits your character.'}`);
        }
        
        if (!char.characteristicTrait) {
            issues.push("🎨 Don't forget to pick a characteristic! This helps define who your character is.");
        }
    }
    
    // 3. Check character feat
    const characterFeats = char.feats?.character || [];
    if (characterFeats.length < 1) {
        issues.push("🌠 You need to select 1 character feat! These are the unique touches that make your character special.");
    }
    
    // 4. Check ability points
    const abilityValues = char.abilityValues || [0, 0, 0, 0, 0, 0];
    const abilitySum = abilityValues.reduce((a, b) => a + b, 0);
    const abilityPoints = 7 - abilitySum;
    if (abilityPoints > 0) {
        issues.push(`⚡ You still have ${abilityPoints} ability point${abilityPoints === 1 ? '' : 's'} to spend! Make your character stronger by allocating them.`);
    }
    
    // 5. Check skill points
    import('./skills.js').then(mod => {
        const remainingSkillPoints = mod.getRemainingSkillPoints();
        
        if (remainingSkillPoints > 0) {
            issues.push(`📚 You have ${remainingSkillPoints} skill point${remainingSkillPoints === 1 ? '' : 's'} left to spend! Boost your skills to become more proficient.`);
        }
        
        // 6. Check health-energy points
        const baseHealth = getBaseHealth();
        const baseEnergy = getBaseEnergy();
        const health = char.finalizeHealth ?? baseHealth;
        const energy = char.finalizeEnergy ?? baseEnergy;
        const hepUsed = (health - baseHealth) + (energy - baseEnergy);
        const hepRemaining = 18 - hepUsed;
        
        if (hepRemaining > 0) {
            issues.push(`❤️ You have ${hepRemaining} Health-Energy point${hepRemaining === 1 ? '' : 's'} to allocate! Decide whether to boost your health or energy.`);
        }
        
        // NEW: 7. Check currency (cannot be negative)
        import('./equipment.js').then(async eqMod => {
            const baseCurrency = 200;
            const equipmentArr = char.equipment || [];
            const equipmentQuantities = char.equipmentQuantities || {};
            let spentCurrency = 0;
            
            const weaponLibrary = eqMod.weaponLibrary || [];
            const armorLibrary = eqMod.armorLibrary || [];
            const generalEquipment = eqMod.generalEquipment || [];
            
            equipmentArr.forEach(id => {
                const weapon = weaponLibrary.find(w => w.id === id);
                const armor = armorLibrary.find(a => a.id === id);
                const general = generalEquipment.find(g => g.id === id);
                const item = weapon || armor || general;
                const qty = equipmentQuantities[id] || 1;
                const value = item ? (item.currencyCost ?? item.goldCost ?? item.currency ?? 0) : 0;
                spentCurrency += Math.ceil(value) * qty;
            });
            
            const remainingCurrency = baseCurrency - spentCurrency;
            if (remainingCurrency < 0) {
                issues.push(`💰 You've overspent your currency by ${Math.abs(remainingCurrency)}! Remove some equipment from the Equipment tab to balance your budget.`);
            }
            
            // NEW: 8. Check training points (cannot be negative)
            const baseTP = getDefaultTrainingPoints();
            const equipmentTP = eqMod.getTotalEquipmentTP ? eqMod.getTotalEquipmentTP() : 0;
            
            import('./powers.js').then(powMod => {
                const powersTP = powMod.getTotalPowersTP ? powMod.getTotalPowersTP() : 0;
                const totalSpent = equipmentTP + powersTP;
                const remainingTP = baseTP - totalSpent;
                
                if (remainingTP < 0) {
                    issues.push(`🎯 You've overspent your training points by ${Math.abs(remainingTP)}! Remove some armaments, powers, or techniques from the Equipment and Powers & Techniques tabs.`);
                }
                
                // Display results
                displayValidationResults(issues);
            }).catch(() => {
                // Powers module not loaded, check with equipment TP only
                const remainingTP = baseTP - equipmentTP;
                if (remainingTP < 0) {
                    issues.push(`🎯 You've overspent your training points by ${Math.abs(remainingTP)}! Remove some armaments from the Equipment tab.`);
                }
                displayValidationResults(issues);
            });
        }).catch(() => {
            // Equipment module not loaded, display what we have so far
            displayValidationResults(issues);
        });
    });
}

// NEW: Display validation results in modal
function displayValidationResults(issues) {
    const modal = document.getElementById('validation-modal');
    const titleEl = document.getElementById('validation-title');
    const resultsEl = document.getElementById('validation-results');
    
    if (issues.length === 0) {
        titleEl.textContent = '🎉 Character Complete!';
        titleEl.style.color = '#28a745';
        resultsEl.innerHTML = `
            <p style="font-size: 1.1em; color: #28a745; text-align: center; margin: 20px 0;">
                <strong>Congratulations!</strong> Your character is ready for adventure! 🎊
            </p>
            <p style="text-align: center; color: #666;">
                All requirements have been met. Your hero is prepared to face whatever challenges await!
            </p>
        `;
        // NEW: Save character to Firestore
        saveCharacterToFirestore();
    } else {
        titleEl.textContent = '📋 Almost There!';
        titleEl.style.color = '#ff9800';
        resultsEl.innerHTML = `
            <p style="margin-bottom: 16px; color: #666;">
                Just a few more things to complete before your character is ready:
            </p>
            <ul style="list-style: none; padding: 0; margin: 0;">
                ${issues.map(issue => `
                    <li style="padding: 12px; margin: 8px 0; background: #fff3cd; border-left: 4px solid #ff9800; border-radius: 4px;">
                        ${issue}
                    </li>
                `).join('')}
            </ul>
        `;
    }
    
    modal.style.display = 'block';
}

// NEW: Save character to Firestore using HTTP endpoint
async function saveCharacterToFirestore() {
    const char = window.character || {};
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
        alert('You must be logged in to save your character.');
        return;
    }

    // Ensure a fresh token
    try { await user.getIdToken(true); } catch (_) {}

    // Martial/Power proficiency logic
    let mart_prof = 0, pow_prof = 0, pow_abil = null, mart_abil = null;
    if (char.archetype?.type === 'martial') {
        mart_prof = 2; pow_prof = 0; mart_abil = char.archetype.abilities;
    } else if (char.archetype?.type === 'powered-martial') {
        mart_prof = 1; pow_prof = 1;
        pow_abil = char.archetype.abilities?.power;
        mart_abil = char.archetype.abilities?.martial;
    } else if (char.archetype?.type === 'power') {
        mart_prof = 0; pow_prof = 2; pow_abil = char.archetype.abilities;
    }

    // Traits: ancestryTraits, flawTrait, characteristicTrait
    const traits = [
        ...(char.ancestryTraits || []),
        ...(char.flawTrait ? [char.flawTrait] : []),
        ...(char.characteristicTrait ? [char.characteristicTrait] : [])
    ];

    // Skills: name, skill_val, ability, prof: true
    const skillsArr = (char.skills || []).map(skillName => ({
        name: skillName,
        skill_val: (char.skillVals?.[skillName] ?? 0),
        ability: char.skillAbilities?.[skillName] ?? null,
        prof: true
    }));

    // Feats: both archetype and character
    const featsArr = [
        ...(char.feats?.archetype || []),
        ...(char.feats?.character || [])
    ];

    // Equipment, weapons, armor with quantities
    const equipmentArr = char.equipment || [];
    let weaponsArr = [];
    let armorArr = [];
    let generalEquipmentArr = [];
    let weaponLibrary = [];
    let armorLibrary = [];
    let generalEquipment = [];
    
    // NEW: Equipment quantities mapping
    const equipmentQuantities = char.equipmentQuantities || {};
    
    try {
        const eqMod = await import('./equipment.js');
        weaponLibrary = eqMod.weaponLibrary || [];
        armorLibrary = eqMod.armorLibrary || [];
        generalEquipment = eqMod.generalEquipment || [];
    } catch (e) {
        weaponLibrary = [];
        armorLibrary = [];
        generalEquipment = [];
    }
    equipmentArr.forEach(id => {
        const weapon = weaponLibrary.find(w => w.id === id);
        const armor = armorLibrary.find(a => a.id === id);
        if (weapon) {
            weaponsArr.push({
                name: weapon.name,
                quantity: equipmentQuantities[id] || 1
            });
        } else if (armor) {
            armorArr.push({
                name: armor.name,
                quantity: equipmentQuantities[id] || 1
            });
        } else {
            const general = generalEquipment.find(g => g.id === id);
            if (general) {
                generalEquipmentArr.push({
                    name: general.name,
                    quantity: equipmentQuantities[id] || 1
                });
            }
        }
    });

    // Powers & Techniques
    let selectedPowersTechniques = [];
    let powersLibrary = [];
    let techniquesLibrary = [];
    try {
        const powMod = await import('./powers.js');
        selectedPowersTechniques = powMod.selectedPowersTechniques || [];
        powersLibrary = powMod.powersLibrary || [];
        techniquesLibrary = powMod.techniquesLibrary || [];
    } catch (e) {
        selectedPowersTechniques = [];
        powersLibrary = [];
        techniquesLibrary = [];
    }
    const powersArr = [];
    const techniquesArr = [];
    (selectedPowersTechniques || []).forEach(id => {
        const power = powersLibrary.find(p => p.id === id);
        const tech = techniquesLibrary.find(t => t.id === id);
        if (power) powersArr.push(power.name);
        if (tech) techniquesArr.push(tech.name);
    });

    // Health/Energy allocation
    const baseHealth = getBaseHealth();
    const baseEnergy = getBaseEnergy();
    const health = char.finalizeHealth ?? baseHealth;
    const energy = char.finalizeEnergy ?? baseEnergy;
    const health_energy_points = {
        health: health - baseHealth,
        energy: energy - baseEnergy
    };
    
    // NEW: Current health and energy (full values, not allocation)
    const currentHealth = health;
    const currentEnergy = energy;

    // Abilities grouped together
    const abilities = {
        strength: char.abilities?.strength ?? 0,
        vitality: char.abilities?.vitality ?? 0,
        agility: char.abilities?.agility ?? 0,
        acuity: char.abilities?.acuity ?? 0,
        intelligence: char.abilities?.intelligence ?? 0,
        charisma: char.abilities?.charisma ?? 0
    };

    // Defense values grouped together
    const defenseVals = {
        might: char.defenseVals?.might ?? 0,
        fortitude: char.defenseVals?.fortitude ?? 0,
        reflex: char.defenseVals?.reflex ?? 0,
        discernment: char.defenseVals?.discernment ?? 0,
        mentalFortitude: char.defenseVals?.mentalFortitude ?? 0,
        resolve: char.defenseVals?.resolve ?? 0
    };
    
    // NEW: Calculate remaining currency
    const baseCurrency = 200;
    let spentCurrency = 0;
    try {
        const eqMod = await import('./equipment.js');
        equipmentArr.forEach(id => {
            const weapon = weaponLibrary.find(w => w.id === id);
            const armor = armorLibrary.find(a => a.id === id);
            const general = generalEquipment.find(g => g.id === id);
            const item = weapon || armor || general;
            const qty = equipmentQuantities[id] || 1;
            const value = item ? (item.currencyCost ?? item.goldCost ?? item.currency ?? 0) : 0;
            spentCurrency += Math.ceil(value) * qty;
        });
    } catch (e) {
        spentCurrency = 0;
    }
    const remainingCurrency = baseCurrency - spentCurrency;

    // Final object
    const characterData = {
        name: char.name || '',
        species: char.speciesName || '',
        traits,
        size: char.size || '',
        mart_prof,
        pow_prof,
        abilities,
        defenseVals,
        skills: skillsArr,
        feats: featsArr,
        equipment: generalEquipmentArr,
        weapons: weaponsArr,
        armor: armorArr,
        powers: powersArr,
        techniques: techniquesArr,
        health_energy_points,
        currentHealth,           // NEW: Full health value
        currentEnergy,           // NEW: Full energy value
        currency: remainingCurrency, // NEW: Remaining currency
        appearance: char.appearance || '',
        archetypeDesc: char.archetypeDesc || '',
        notes: char.notes || '',
        weight: char.weight || '',
        height: char.height || ''
    };

    // Add optional fields only if they have a value
    if (pow_abil) characterData.pow_abil = pow_abil;
    if (mart_abil) characterData.mart_abil = mart_abil;

    try {
        const idToken = await user.getIdToken();
        const url = 'https://us-central1-realmsrpg-b3366.cloudfunctions.net/saveCharacterToLibraryHttp';
        const resp = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify(characterData)
        });
        if (!resp.ok) {
            const text = await resp.text().catch(() => '');
            throw new Error(`HTTP ${resp.status}: ${text}`);
        }
        const data = await resp.json();
        console.log('Character saved successfully:', data);
        alert(data?.message || 'Character saved to your library!');
        window.location.href = '/pages/characters.html';
    } catch (err) {
        console.error('Error saving character:', err);
        alert('Error saving character to library: ' + err.message);
    }
}

// NEW: Setup validation modal events
function setupValidationModal() {
    const modal = document.getElementById('validation-modal');
    const closeBtn = document.getElementById('close-validation-modal');
    const okBtn = document.getElementById('validation-ok-btn');
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    okBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Setup events after DOM loaded
window.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('content-finalize')) {
        setupFinalizeTabEvents();
        updateFinalizeTab();
    }
    
    // NEW: Setup validation
    setupValidationModal();
    
    const completeBtn = document.getElementById('complete-character-btn');
    if (completeBtn) {
        completeBtn.addEventListener('click', validateCharacter);
    }
});

// Patch training points display everywhere to use getDefaultTrainingPoints()
function updateTrainingPointsDisplay() {
    // Used by equipment/powers tabs
    import('./equipment.js').then(mod => {
        const equipmentTP = mod.getTotalEquipmentTP ? mod.getTotalEquipmentTP() : 0;
        import('./powers.js').then(mod2 => {
            const powersTP = mod2.getTotalPowersTP ? mod2.getTotalPowersTP() : 0;
            const totalSpent = equipmentTP + powersTP;
            const remaining = getDefaultTrainingPoints() - totalSpent;
            const trainingPointsEl = document.getElementById('training-points');
            if (trainingPointsEl) trainingPointsEl.textContent = remaining;
            const powersTrainingPointsEl = document.getElementById('powers-training-points');
            if (powersTrainingPointsEl) powersTrainingPointsEl.textContent = remaining;
        });
    });
}

// Make updateTrainingPointsDisplay and updateFinalizeTab globally available for other modules
window.updateTrainingPointsDisplay = updateTrainingPointsDisplay;
window.updateFinalizeTab = updateFinalizeTab;
