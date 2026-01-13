/**
 * Global interaction handlers for the character sheet.
 * This file consolidates all window-level functions used across components
 * to prevent duplication and ensure consistent behavior.
 */

import { sanitizeId } from './utils.js';
import { initRollLog, addRoll } from './components/roll-log.js';

// ============================================================================
// RESOURCE MANAGEMENT
// ============================================================================

/**
 * Updates the color styling of health and energy inputs based on their values.
 * Health turns red when <= 0, energy turns red when <= 0.
 */
window.updateResourceColors = function() {
    const h = document.getElementById('currentHealth');
    const e = document.getElementById('currentEnergy');
    if (h) {
        const hv = parseInt(h.value) || 0;
        h.style.color = hv <= 0 ? 'red' : 'black';
    }
    if (e) {
        const ev = parseInt(e.value) || 0;
        e.style.color = ev <= 0 ? 'red' : 'black';
    }
};

/**
 * Adjusts the character's current health by a delta value.
 * Health can go below 0 and exceed maximum.
 * @param {number} delta - Amount to change health by (positive or negative)
 */
window.changeHealth = function(delta) {
    const input = document.getElementById('currentHealth');
    if (!input) return;
    const current = parseInt(input.value) || 0;
    // Health allowed to exceed max and go below 0
    const newValue = current + delta;
    input.value = newValue;
    const charData = window.currentCharacterData?.();
    if (charData) {
        charData.currentHealth = newValue;
        window.scheduleAutoSave?.();
    }
    window.updateResourceColors();
};

/**
 * Adjusts the character's current energy by a delta value.
 * Energy is clamped between 0 and maximum.
 * @param {number} delta - Amount to change energy by (positive or negative)
 */
window.changeEnergy = function(delta) {
    const input = document.getElementById('currentEnergy');
    if (!input) return;
    const current = parseInt(input.value) || 0;
    const max = parseInt(input.dataset.max) || 0; // use data-max
    let newValue = current + delta;
    newValue = Math.max(0, Math.min(max, newValue)); // clamp energy
    input.value = newValue;
    const charData = window.currentCharacterData?.();
    if (charData) {
        charData.currentEnergy = newValue;
        window.scheduleAutoSave?.();
    }
    window.updateResourceColors();
};

// ============================================================================
// DICE ROLLING FUNCTIONS
// ============================================================================

// Initialize roll log when the module loads
if (typeof document !== 'undefined') {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initRollLog);
    } else {
        initRollLog();
    }
}

/**
 * Internal helper to add a d20 roll to the roll log.
 * Automatically applies +2 bonus for natural 20s and -2 penalty for natural 1s.
 * @private
 * @param {string} type - Type of roll (skill, attack, ability, defense)
 * @param {string} title - Title for the roll (e.g., "Strength Check")
 * @param {number} roll - The d20 roll result (1-20)
 * @param {number} bonus - The modifier to add to the roll
 */
function _addD20RollToLog(type, title, roll, bonus) {
    const isCritSuccess = roll === 20;
    const isCritFail = roll === 1;
    
    // Apply natural 20/1 bonuses to the total
    let total = roll + bonus;
    let critMessage = null;
    
    if (isCritSuccess) {
        total += 2; // Natural 20 adds +2 to total
        critMessage = 'Natural 20! +2 to the total!';
    } else if (isCritFail) {
        total -= 2; // Natural 1 subtracts 2 from total
        critMessage = 'Natural 1! -2 from the total!';
    }
    
    addRoll({
        type,
        title,
        dieResult: roll,
        modifier: bonus,
        total,
        isCritSuccess,
        isCritFail,
        critMessage
    });
}

/**
 * Rolls a skill check and adds the result to the roll log.
 * @param {string} skillName - Name of the skill being rolled
 * @param {number} bonus - Modifier to add to the roll
 */
window.rollSkill = function(skillName, bonus) {
    const roll = Math.floor(Math.random() * 20) + 1;
    _addD20RollToLog('skill', skillName, roll, bonus);
};

/**
 * Rolls an attack with a weapon and adds the result to the roll log.
 * @param {string} weaponName - Name of the weapon being used
 * @param {number} attackBonus - Attack bonus to add to the roll
 */
window.rollAttack = function(weaponName, attackBonus) {
    const roll = Math.floor(Math.random() * 20) + 1;
    _addD20RollToLog(
        'attack',
        `${weaponName} Attack`,
        roll,
        attackBonus
    );
};

/**
 * Rolls a generic attack bonus and adds the result to the roll log.
 * @param {string} name - Name of the attack
 * @param {number} bonus - Attack bonus to add to the roll
 */
window.rollAttackBonus = function(name, bonus) {
    const roll = Math.floor(Math.random() * 20) + 1;
    _addD20RollToLog(
        'attack',
        `${name} Attack Roll`,
        roll,
        bonus
    );
};

/**
 * Rolls damage dice and adds the result to the roll log.
 * @param {string} damageStr - Damage string (e.g., "2d6", "1d8+2", "1d6 Slashing")
 * @param {number} bonus - Optional additional damage bonus
 */
window.rollDamage = function(damageStr, bonus = 0) {
    // Parse damage string like "2d6", "1d8+2", "1d6 Slashing", "1d6+3 Slashing"
    // Accepts optional bonus as second argument
    let match = damageStr.match(/(\d+)d(\d+)([+-]\d+)?(?:\s+([a-zA-Z]+))?/);
    if (!match) return;

    const [, numDice, dieSize, modifier, dmgType] = match;
    const num = parseInt(numDice);
    const size = parseInt(dieSize);
    const mod = modifier ? parseInt(modifier) : 0;
    const totalBonus = mod + (typeof bonus === 'number' ? bonus : 0);

    let total = totalBonus;
    let rolls = [];
    let diceDetails = [];
    for (let i = 0; i < num; i++) {
        const roll = Math.floor(Math.random() * size) + 1;
        rolls.push(roll);
        diceDetails.push({ die: `d${size}`, size, result: roll });
        total += roll;
    }

    // Add to roll log instead of popup
    addRoll({
        type: 'damage',
        title: `Damage Roll${dmgType ? ` (${dmgType})` : ''}`,
        diceRolls: rolls,
        diceDetails: diceDetails,
        modifier: totalBonus,
        total,
        damageType: dmgType || null
    });
};

/**
 * Rolls an ability check and adds the result to the roll log.
 * @param {string} abilityName - Name of the ability (e.g., "strength", "agility")
 * @param {number} bonus - Ability modifier to add to the roll
 */
window.rollAbility = function(abilityName, bonus) {
    const roll = Math.floor(Math.random() * 20) + 1;
    const title = abilityName.charAt(0).toUpperCase() + abilityName.slice(1) + ' Check';
    _addD20RollToLog('ability', title, roll, bonus);
};

/**
 * Rolls a defense/saving throw and adds the result to the roll log.
 * @param {string} defenseName - Name of the defense (e.g., "Fortitude", "Reflex")
 * @param {number} bonus - Defense modifier to add to the roll
 */
window.rollDefense = function(defenseName, bonus) {
    const roll = Math.floor(Math.random() * 20) + 1;
    _addD20RollToLog('defense', `${defenseName} Save`, roll, bonus);
};

// ============================================================================
// FEAT AND TRAIT MANAGEMENT
// ============================================================================

/**
 * Adjusts the usage counter for a feat.
 * Converts string-based feats to objects with currentUses tracking.
 * @param {string} featName - Name of the feat
 * @param {number} delta - Amount to change uses by (positive or negative)
 */
window.changeFeatUses = function(featName, delta) {
    const id = sanitizeId(featName);
    const charData = window.currentCharacterData?.();
    if (!charData || !Array.isArray(charData.feats)) return;

    // Find the feat in the array (string or object)
    let featIndex = charData.feats.findIndex(f =>
        (typeof f === 'string' && f === featName) ||
        (typeof f === 'object' && f.name === featName)
    );
    if (featIndex === -1) {
        console.warn('[changeFeatUses] Feat not found:', featName);
        return;
    }

    // Get maxUses from _displayFeats if available, else from feat object
    let maxUses = 0;
    if (Array.isArray(charData._displayFeats)) {
        const found = charData._displayFeats.find(f => f.name === featName);
        if (found && typeof found.uses === 'number') maxUses = found.uses;
    }
    // Fallback: try feat object
    let featObj = charData.feats[featIndex];
    if (!maxUses && typeof featObj === 'object' && typeof featObj.uses === 'number') {
        maxUses = featObj.uses;
    }

    // If feat is a string, convert to object and persist
    if (typeof featObj === 'string') {
        charData.feats[featIndex] = {
            name: featObj,
            currentUses: Math.max(0, Math.min(maxUses, (maxUses || 0) + delta))
        };
        featObj = charData.feats[featIndex];
    } else {
        if (featObj.currentUses === undefined) featObj.currentUses = maxUses || 0;
        featObj.currentUses = Math.max(0, Math.min(maxUses || 0, featObj.currentUses + delta));
    }

    // Update both collapsed and expanded uses spans
    const usesSpan = document.getElementById(`uses-${id}`);
    const expSpan = document.getElementById(`exp-uses-${id}`);
    if (usesSpan) usesSpan.textContent = featObj.currentUses ?? 0;
    if (expSpan) expSpan.textContent = featObj.currentUses ?? 0;

    // Trigger auto-save
    window.scheduleAutoSave?.();
};

/**
 * Adjusts the usage counter for a trait.
 * Converts string-based traits to objects with currentUses tracking.
 * @param {string} traitName - Name of the trait
 * @param {number} delta - Amount to change uses by (positive or negative)
 * @param {object} charData - Character data object
 * @param {number} maxUses - Maximum uses for the trait
 */
window.changeTraitUses = function(traitName, delta, charData, maxUses) {
    if (!charData || !Array.isArray(charData.traits)) return;
    
    // Find the trait in the array
    let trait = charData.traits.find(t =>
        (typeof t === 'string' && t === traitName) ||
        (typeof t === 'object' && t.name === traitName)
    );
    if (!trait) return;
    
    // If trait is a string, convert to object
    if (typeof trait === 'string') {
        const idx = charData.traits.indexOf(trait);
        charData.traits[idx] = {
            name: trait,
            currentUses: Math.max(0, Math.min(maxUses, (maxUses || 0) + delta))
        };
        trait = charData.traits[idx];
    } else {
        if (trait.currentUses === undefined) trait.currentUses = maxUses || 0;
        trait.currentUses = Math.max(0, Math.min(maxUses, trait.currentUses + delta));
    }
    
    // Update display
    const usesSpan = document.getElementById(`uses-${sanitizeId(traitName)}`);
    if (usesSpan) usesSpan.textContent = trait.currentUses ?? 0;
    
    // Trigger auto-save
    window.scheduleAutoSave?.();
};

/**
 * Toggles a feat's active state.
 * @param {string} featName - Name of the feat to toggle
 */
window.toggleFeat = function(featName) {
    const toggle = event.target;
    toggle.classList.toggle('active');
    
    const charData = window.currentCharacterData();
    if (charData && charData.feats) {
        const feat = charData.feats.find(f => f.name === featName);
        if (feat) {
            feat.active = toggle.classList.contains('active');
            window.scheduleAutoSave();
        }
    }
};

// ============================================================================
// POWER AND TECHNIQUE USAGE
// ============================================================================

/**
 * Deducts energy when using a technique.
 * @param {string} name - Name of the technique
 * @param {number} energy - Energy cost of the technique
 */
window.useTechnique = function(name, energy) {
    const energyInput = document.getElementById('currentEnergy');
    if (!energyInput) return;
    
    const current = parseInt(energyInput.value) || 0;
    if (current < energy) {
        alert(`Not enough energy! Need ${energy}, have ${current}`);
        return;
    }
    
    energyInput.value = current - energy;
    const charData = window.currentCharacterData();
    if (charData) {
        charData.currentEnergy = current - energy;
        window.scheduleAutoSave();
    }
    window.updateResourceColors?.();
};

/**
 * Deducts energy when using a power.
 * Delegates to useTechnique as the logic is identical.
 * @param {string} name - Name of the power
 * @param {number} energy - Energy cost of the power
 */
window.usePower = function(name, energy) {
    window.useTechnique(name, energy); // Same logic
};

// ============================================================================
// NOTES AND PERSISTENCE
// ============================================================================

/**
 * Saves character notes to character data.
 * Provides visual feedback on successful save.
 */
window.saveNotes = function() {
    const notesTextarea = document.getElementById('character-notes');
    if (!notesTextarea) return;
    
    const charData = window.currentCharacterData();
    if (charData) {
        charData.notes = notesTextarea.value;
        window.scheduleAutoSave();
        
        // Show feedback
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '✓ Saved';
        btn.disabled = true;
        setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
        }, 2000);
    }
};

// ============================================================================
// UI STYLES
// ============================================================================

// Add CSS for roll popup
const style = document.createElement('style');
style.textContent = `
.roll-popup {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.3s;
}

.roll-popup.show {
    opacity: 1;
}

.roll-content {
    background: white;
    padding: 32px;
    border-radius: 16px;
    max-width: 400px;
    text-align: center;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}

.roll-content h3 {
    margin: 0 0 20px 0;
    color: var(--primary-dark);
    font-size: 24px;
}

.roll-details {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin: 24px 0;
    font-size: 32px;
    font-weight: 700;
    flex-wrap: wrap;
}

.die-result {
    color: var(--primary-blue);
}

.die-result.crit-success {
    color: var(--success-green);
    animation: pulse 0.5s ease-in-out;
}

.die-result.crit-fail {
    color: var(--danger-red);
    animation: shake 0.5s ease-in-out;
}

.total-result {
    color: var(--primary-dark);
}

.crit-message {
    font-size: 18px;
    font-weight: 700;
    color: var(--success-green);
    margin: 16px 0;
}

.crit-message.fail {
    color: var(--danger-red);
}

.damage-rolls {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    margin: 20px 0;
}

.die-roll {
    font-size: 24px;
    font-weight: 600;
    color: var(--primary-blue);
}

.modifier.bonus-result {
    font-size: 28px;
    font-weight: 700;
    color: var(--primary-dark);
    /* No background, no border, just value */
    background: none !important;
    border: none !important;
    padding: 0 !important;
    margin: 0 4px;
    display: inline-block;
    vertical-align: middle;
}

.roll-content button {
    background: linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-dark) 100%);
    color: white;
    border: none;
    padding: 12px 32px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    margin-top: 16px;
}

@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.2); }
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
}
`;
document.head.appendChild(style);
