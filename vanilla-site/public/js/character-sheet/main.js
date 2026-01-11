import { initializeFirebase, waitForAuth } from './firebase-config.js';
import { getCharacterData, saveCharacterData } from './data.js';
import { calculateDefenses, calculateSpeed, calculateEvasion, calculateMaxHealth, calculateMaxEnergy, calculateBonuses, getSpeedBase, getEvasionBase } from './calculations.js';
import { renderHeader } from './components/header.js';
import { renderAbilities } from './components/abilities.js';
import { renderSkills } from './components/skills.js';
import { renderArchetype } from './components/archetype.js';
import { renderLibrary } from './components/library.js';
import './interactions.js';
import { showEquipmentModal, showFeatModal, showSkillModal, showSubSkillModal } from './components/modal.js';
import { enrichCharacterData, normalizeCharacter } from './utils/data-enrichment.js';
import { getCharacterResourceTracking, validateHealthIncrease, validateEnergyIncrease } from './validation.js';
import { 
    calculateAbilityPoints,
    calculateSkillPoints,
    canIncreaseAbility, 
    canDecreaseAbility, 
    getAbilityIncreaseCost,
    getAbilityDecreaseRefund,
    calculateAbilityPointsSpent,
    ABILITY_CONSTRAINTS,
    calculateArchetypeProgression,
    calculateArmamentProficiency
} from './level-progression.js';

// Import shared utilities
import { sanitizeId } from '../shared/string-utils.js';
import { capitalizeDamageType } from '../shared/string-utils.js';

// Promise-based initialization guard for async data loading
let _userItemLibraryPromise = null;
window.userItemLibrary = []; // Array of all user's items (full objects)

// Safe getter that returns item from library (synchronous)
// Library should be loaded during enrichCharacterData before any rendering
window.getItemFromLibraryByName = function(name) {
    if (!window.userItemLibrary || !Array.isArray(window.userItemLibrary)) {
        console.warn('[Library] userItemLibrary not yet loaded, returning null for:', name);
        return null;
    }
    return window.userItemLibrary.find(item => item.name === name) || null;
};

// Async version that waits for library to be loaded if necessary
window.waitForItemLibrary = async function() {
    if (_userItemLibraryPromise) {
        try {
            await _userItemLibraryPromise;
        } catch (e) {
            console.warn('[Library] Failed to wait for library init:', e);
        }
    }
    return window.userItemLibrary;
};

// Set the promise when library starts loading
window._setUserItemLibraryPromise = function(promise) {
    _userItemLibraryPromise = promise;
};

let currentCharacterId = null;
let currentCharacterData = null;
let autoSaveTimeout = null;

/**
 * Schedules an auto-save operation after a debounce delay.
 * Includes error handling and user notifications.
 */
function scheduleAutoSave() {
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    if (currentCharacterId === 'placeholder') return;
    
    autoSaveTimeout = setTimeout(async () => {
        if (!currentCharacterId || !currentCharacterData) return;
        
        try {
            // Strip temporary/computed fields before saving
            const dataToSave = cleanForSave(currentCharacterData);
            await saveCharacterData(currentCharacterId, dataToSave);
            showNotification('Character auto-saved', 'success');
        } catch (error) {
            console.error('[Auto-save] Failed:', error);
            showNotification('Auto-save failed - changes not saved', 'error');
            // Retry once after 3 seconds
            setTimeout(async () => {
                try {
                    const dataToSave = cleanForSave(currentCharacterData);
                    await saveCharacterData(currentCharacterId, dataToSave);
                    showNotification('Auto-save retry successful', 'success');
                } catch (retryError) {
                    console.error('[Auto-save] Retry failed:', retryError);
                    showNotification('Auto-save retry failed - please save manually', 'error');
                }
            }, 3000);
        }
    }, 2000); // Auto-save 2 seconds after last change
}

/**
 * Removes temporary and computed fields from character data before saving.
 * Only keeps the minimal data needed - everything else is calculated on load.
 * @param {object} data - Character data object
 * @returns {object} Cleaned data safe for persistence
 */
function cleanForSave(data) {
    // Define the fields that should be saved (minimal data)
    const SAVEABLE_FIELDS = [
        // Identity
        'name', 'species', 'gender', 'portrait', 'xp', 'level',
        // Core stats (user-set values only)
        'abilities', 'defenseVals', 'baseAbilities', 'ancestryAbilities',
        'health_energy_points', 'currentHealth', 'currentEnergy', 'innateEnergy',
        // Skills (user selections - single array, base_skill derived from RTDB at render)
        'skills',
        // Archetype/Build
        'archetype', 'archetypeName', 'archetypeAbility',
        // Proficiency data (must be saved!)
        'mart_prof', 'pow_prof', 'mart_abil', 'pow_abil', 'archetypeChoices',
        // References (names only, not full objects)
        'feats', 'techniques', 'powers', 'traits',
        // Inventory (names/equipped status only, not full item data)
        'weapons', 'armor', 'equipment', 'currency',
        // Notes and misc user data
        'notes', 'backstory', 'appearance', 'archetypeDesc', 'allies', 'organizations',
        // Ancestry data
        'ancestry', 'ancestryId', 'ancestryTraits'
    ];
    
    const cleaned = {};
    
    // Only copy saveable fields
    for (const field of SAVEABLE_FIELDS) {
        if (data[field] !== undefined) {
            cleaned[field] = data[field];
        }
    }
    
    // Clean up weapons - only save name and equipped status
    if (Array.isArray(cleaned.weapons)) {
        cleaned.weapons = cleaned.weapons.map(w => {
            if (typeof w === 'string') return w;
            if (w && typeof w === 'object') {
                const cleanWeapon = { name: w.name };
                if (w.equipped) cleanWeapon.equipped = true;
                return cleanWeapon;
            }
            return null;
        }).filter(Boolean);
    }
    
    // Clean up armor - only save name and equipped status
    if (Array.isArray(cleaned.armor)) {
        cleaned.armor = cleaned.armor.map(a => {
            if (typeof a === 'string') return a;
            if (a && typeof a === 'object') {
                const cleanArmor = { name: a.name };
                if (a.equipped) cleanArmor.equipped = true;
                return cleanArmor;
            }
            return null;
        }).filter(Boolean);
    }
    
    // Clean up equipment - only save name and quantity
    if (Array.isArray(cleaned.equipment)) {
        cleaned.equipment = cleaned.equipment.map(e => {
            if (typeof e === 'string') return e;
            if (e && typeof e === 'object') {
                const cleanEquip = { name: e.name };
                if (e.quantity && e.quantity !== 1) cleanEquip.quantity = e.quantity;
                return cleanEquip;
            }
            return null;
        }).filter(Boolean);
    }
    
    // Clean up feats - only save name and currentUses (if tracked)
    if (Array.isArray(cleaned.feats)) {
        cleaned.feats = cleaned.feats.map(f => {
            if (typeof f === 'string') return f;
            if (f && typeof f === 'object') {
                const cleanFeat = { name: f.name };
                if (typeof f.currentUses === 'number') cleanFeat.currentUses = f.currentUses;
                return cleanFeat;
            }
            return null;
        }).filter(Boolean);
    }
    
    // Clean up powers - save as objects with name and innate flag
    if (Array.isArray(cleaned.powers)) {
        cleaned.powers = cleaned.powers.map(p => {
            if (typeof p === 'string') return { name: p, innate: false };
            if (p && typeof p === 'object' && p.name) {
                return { name: p.name, innate: !!p.innate };
            }
            return null;
        }).filter(Boolean);
    }
    
    // Clean up techniques - only save names
    if (Array.isArray(cleaned.techniques)) {
        cleaned.techniques = cleaned.techniques.map(t => {
            if (typeof t === 'string') return t;
            if (t && typeof t === 'object') return t.name;
            return null;
        }).filter(Boolean);
    }
    
    // Clean up traits - only save names
    if (Array.isArray(cleaned.traits)) {
        cleaned.traits = cleaned.traits.map(t => {
            if (typeof t === 'string') return t;
            if (t && typeof t === 'object') return t.name;
            return null;
        }).filter(Boolean);
    }
    
    return cleaned;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Triggers a long rest, restoring health and energy to maximum.
 */
function longRest() {
    if (!currentCharacterData) return;
    
    if (confirm('Take a long rest? This will restore all health and energy to maximum.')) {
        const healthInput = document.getElementById('currentHealth');
        const energyInput = document.getElementById('currentEnergy');
        
        if (!healthInput || !energyInput) {
            console.warn('[Long Rest] Could not find health/energy inputs');
            return;
        }
        
        const maxHealth = parseInt(healthInput.dataset.max) || 0;
        const maxEnergy = parseInt(energyInput.dataset.max) || 0;
        
        healthInput.value = maxHealth;
        currentCharacterData.currentHealth = maxHealth;
        
        energyInput.value = maxEnergy;
        currentCharacterData.currentEnergy = maxEnergy;
        
        window.updateResourceColors?.();
        scheduleAutoSave();
        showNotification('Long rest completed - all resources restored!', 'success');
    }
}

/**
 * Loads and renders a character by ID from Firestore.
 * Handles data enrichment, normalization, and UI rendering.
 * @param {string} id - Character document ID
 * @throws {Error} If character ID is missing or data cannot be loaded
 */
async function loadCharacterById(id) {
    if (!id) {
        throw new Error('No character id provided.');
    }
    await initializeFirebase();
    const user = await waitForAuth();
    if (!user) throw new Error('Not authenticated – please log in to load your character.');
    currentCharacterId = id.trim();
    console.log('[CharacterSheet] Attempting load: uid=', user.uid, ' docId=', currentCharacterId);
    
    let attempt = 0;
    while (attempt < 2) {
        try {
            const rawData = await getCharacterData(currentCharacterId);
            console.log('[CharacterSheet] Loaded character document:', rawData.id);
            
            // Use centralized data enrichment
            const data = await enrichCharacterData(rawData, user.uid);
            
            // DEV SAFEGUARD: Warn if _displayFeats contains traits (should never happen)
            if (Array.isArray(data._displayFeats)) {
                const traitLike = data._displayFeats.find(f => f && (f.flaw || f.characteristic || f.traitType || f.trait_category));
                if (traitLike) {
                    console.warn('[BUG] _displayFeats contains trait-like object:', traitLike);
                }
            }

            return normalizeCharacter(data);
        } catch (e) {
            if (e.message === 'PERMISSION_DENIED') {
                console.warn('[CharacterSheet] Permission denied for path /users/'+user.uid+'/character/'+currentCharacterId);
                if (attempt === 0) {
                    await new Promise(r => setTimeout(r, 400));
                    attempt++;
                    continue;
                }
                throw new Error('Permission denied accessing character. Confirm Firestore rules AND App Check token (page must load ReCaptcha V3).');
            }
            if (e.message === 'Character not found') {
                throw new Error('Character not found. Confirm the id parameter matches the document ID (case-sensitive).');
            }
            throw e;
        }
    }
}

/**
 * Loads all traits from Firebase Realtime Database.
 * Used for enriching feat data with trait information.
 * @returns {Promise<Object>} Object mapping trait IDs to trait data
 */
async function loadTraitsFromDatabase() {
    // Ensure Firebase is initialized and get rtdb
    const { rtdb } = await initializeFirebase();
    const traitsRef = rtdb.ref('traits');
    const snapshot = await traitsRef.once('value');
    const data = snapshot.val();
    if (!data) {
        console.warn('No traits found in database');
        return {};
    }
    return data;
}

// Make functions globally accessible
window.scheduleAutoSave = scheduleAutoSave;
window.currentCharacterData = () => currentCharacterData;
window.updateCharacterData = (updates) => {
    Object.assign(currentCharacterData, updates);
    scheduleAutoSave();
};
// --- PATCH: Expose renderLibrary globally for modal to trigger inventory refresh ---
window.renderLibrary = renderLibrary;

// Make archetype progression functions globally accessible
window.calculateArchetypeProgression = calculateArchetypeProgression;
window.calculateArmamentProficiency = calculateArmamentProficiency;

// =====================================================
// EDIT MODE MANAGEMENT
// =====================================================

/**
 * Gets the current edit mode state
 * @returns {boolean} Current edit mode state
 */
window.getEditMode = () => window.isEditMode || false;

/**
 * Sets the edit mode state and updates the UI accordingly
 * @param {boolean} enabled - Whether edit mode should be enabled
 */
window.setEditMode = async function(enabled) {
    window.isEditMode = enabled;
    document.body.classList.toggle('edit-mode', enabled);
    
    // Update button text and notification dot
    const editBtn = document.getElementById('toggle-edit-mode');
    if (editBtn) {
        editBtn.innerHTML = enabled 
            ? '<span>✔️</span> Done' 
            : '<span>🖉</span> Edit';
        editBtn.classList.toggle('active', enabled);
        
        // Update notification dot based on unapplied points
        updateEditButtonNotification();
    }
    
    // Re-render all editable sections to show/hide edit controls
    if (currentCharacterData) {
        try {
            await window.refreshCharacterSheet();
        } catch (err) {
            console.error('[setEditMode] Error re-rendering:', err);
        }
    }
};

/**
 * Updates the edit button notification dot based on unapplied points
 */
function updateEditButtonNotification() {
    const editBtn = document.getElementById('toggle-edit-mode');
    if (!editBtn || !currentCharacterData) return;
    
    const level = currentCharacterData.level || 1;
    const xp = currentCharacterData.xp || 0;
    const canLevelUp = xp >= (level * 4);
    
    const resources = getCharacterResourceTracking(currentCharacterData);
    
    // Calculate skill points including defense vals
    const skillsSpent = (currentCharacterData.skills || []).reduce((sum, skill) => {
        let cost = skill.skill_val || 0;
        const isSubSkill = skill.baseSkill || false;
        if (skill.prof && !isSubSkill) cost += 1;
        return sum + cost;
    }, 0);
    const defenseSpent = Object.values(currentCharacterData.defenseVals || {}).reduce((sum, val) => sum + (val * 2), 0);
    const totalSkillSpent = skillsSpent + defenseSpent;
    const totalSkillPoints = calculateSkillPoints(level);
    const skillRemaining = totalSkillPoints - totalSkillSpent;
    
    const hasUnapplied = 
        resources.abilityPoints.remaining > 0 ||
        resources.healthEnergyPoints.remaining > 0 ||
        skillRemaining > 0 ||
        resources.feats.archetype.remaining > 0 ||
        resources.feats.character.remaining > 0 ||
        canLevelUp;
    
    // Add or remove notification dot
    let notificationDot = editBtn.querySelector('.notification-dot');
    if (hasUnapplied && !window.isEditMode) {
        if (!notificationDot) {
            notificationDot = document.createElement('span');
            notificationDot.className = 'notification-dot';
            editBtn.appendChild(notificationDot);
        }
    } else if (notificationDot) {
        notificationDot.remove();
    }
}

// Make it available for refresh
window.updateEditButtonNotification = updateEditButtonNotification;

/**
 * Gets resource tracking information for the current character
 * @returns {object} Resource tracking data
 */
window.getResourceTracking = function() {
    if (!currentCharacterData) return null;
    return getCharacterResourceTracking(currentCharacterData);
};

// =====================================================
// ABILITY EDITING FUNCTIONS
// =====================================================

/**
 * Attempts to increase an ability score
 * @param {string} abilityName - Name of the ability to increase
 * @returns {boolean} Whether the increase was successful
 */
window.increaseAbility = function(abilityName) {
    if (!currentCharacterData || !window.isEditMode) return false;
    
    const level = currentCharacterData.level || 1;
    const baseAbilities = currentCharacterData.baseAbilities || currentCharacterData.ancestryAbilities || {};
    const totalPoints = calculateAbilityPoints(level);
    const spentPoints = calculateAbilityPointsSpent(currentCharacterData.abilities, baseAbilities);
    const availablePoints = totalPoints - spentPoints;
    
    // Pass a large available points value to bypass point restriction (allow overspending)
    const result = canIncreaseAbility(
        currentCharacterData.abilities,
        abilityName,
        level,
        999, // Allow overspending
        baseAbilities
    );
    
    // Only block if it's a max ability constraint, not a points constraint
    if (!result.canIncrease && result.reason && result.reason.includes('Maximum ability score')) {
        showNotification(result.reason, 'error');
        return false;
    }
    
    // Apply the increase
    currentCharacterData.abilities[abilityName] = (currentCharacterData.abilities[abilityName] || 0) + 1;
    
    // Trigger re-render and auto-save
    window.refreshCharacterSheet();
    scheduleAutoSave();
    return true;
};

/**
 * Attempts to decrease an ability score
 * @param {string} abilityName - Name of the ability to decrease
 * @returns {boolean} Whether the decrease was successful
 */
window.decreaseAbility = function(abilityName) {
    if (!currentCharacterData || !window.isEditMode) return false;
    
    const baseAbilities = currentCharacterData.baseAbilities || currentCharacterData.ancestryAbilities || {};
    
    const result = canDecreaseAbility(
        currentCharacterData.abilities,
        abilityName,
        baseAbilities
    );
    
    if (!result.canDecrease) {
        showNotification(result.reason, 'error');
        return false;
    }
    
    // Apply the decrease
    currentCharacterData.abilities[abilityName] = (currentCharacterData.abilities[abilityName] || 0) - 1;
    
    // Trigger re-render and auto-save
    window.refreshCharacterSheet();
    scheduleAutoSave();
    return true;
};

/**
 * Attempts to increase a defense value
 * Costs 2 skill points per increase
 * @param {string} defenseKey - Defense key (might, fortitude, reflex, discernment, mentalFortitude, resolve)
 * @returns {boolean} Whether the increase was successful
 */
window.increaseDefense = function(defenseKey) {
    if (!currentCharacterData || !window.isEditMode) return false;
    
    const level = currentCharacterData.level || 1;
    const defenseVals = currentCharacterData.defenseVals || {};
    const abilities = currentCharacterData.abilities || {};
    
    // Map defense keys to ability names
    const defenseToAbility = {
        might: 'strength',
        fortitude: 'vitality',
        reflex: 'agility',
        discernment: 'acuity',
        mentalFortitude: 'intelligence',
        resolve: 'charisma'
    };
    
    const abilityName = defenseToAbility[defenseKey];
    const abilityValue = abilities[abilityName] || 0;
    const currentDefVal = defenseVals[defenseKey] || 0;
    const currentDefenseBonus = abilityValue + currentDefVal;
    const maxDefenseBonus = level + 10;
    
    // Check if defense bonus would exceed level + 10
    if (currentDefenseBonus >= maxDefenseBonus) {
        showNotification(`Defense cannot exceed level + 10 (${maxDefenseBonus})`, 'error');
        return false;
    }
    
    // Allow overspending - just apply the increase
    // The UI will show red styling if overspent
    
    // Apply the increase
    if (!currentCharacterData.defenseVals) currentCharacterData.defenseVals = {};
    currentCharacterData.defenseVals[defenseKey] = currentDefVal + 1;
    
    // Trigger re-render and auto-save
    window.refreshCharacterSheet();
    scheduleAutoSave();
    return true;
};

/**
 * Attempts to decrease a defense value
 * Refunds 2 skill points per decrease
 * @param {string} defenseKey - Defense key
 * @returns {boolean} Whether the decrease was successful
 */
window.decreaseDefense = function(defenseKey) {
    if (!currentCharacterData || !window.isEditMode) return false;
    
    const defenseVals = currentCharacterData.defenseVals || {};
    const currentDefVal = defenseVals[defenseKey] || 0;
    
    if (currentDefVal <= 0) {
        showNotification('Defense value is already 0', 'error');
        return false;
    }
    
    // Apply the decrease
    if (!currentCharacterData.defenseVals) currentCharacterData.defenseVals = {};
    currentCharacterData.defenseVals[defenseKey] = currentDefVal - 1;
    
    // Trigger re-render and auto-save
    window.refreshCharacterSheet();
    scheduleAutoSave();
    return true;
};

/**
 * Gets ability editing info for a specific ability
 * @param {string} abilityName - Name of the ability
 * @returns {object} { currentValue, canIncrease, canDecrease, increaseCost, decreaseRefund }
 */
window.getAbilityEditInfo = function(abilityName) {
    if (!currentCharacterData) return null;
    
    const level = currentCharacterData.level || 1;
    const baseAbilities = currentCharacterData.baseAbilities || currentCharacterData.ancestryAbilities || {};
    const totalPoints = calculateAbilityPoints(level);
    const spentPoints = calculateAbilityPointsSpent(currentCharacterData.abilities, baseAbilities);
    const availablePoints = totalPoints - spentPoints;
    
    const currentValue = currentCharacterData.abilities?.[abilityName] || 0;
    // Pass large available points to bypass point restriction, only enforce max ability limit
    const increaseResult = canIncreaseAbility(currentCharacterData.abilities, abilityName, level, 999, baseAbilities);
    const decreaseResult = canDecreaseAbility(currentCharacterData.abilities, abilityName, baseAbilities);
    
    // Only block if it's a max ability constraint, not a points constraint
    const canIncrease = increaseResult.canIncrease || (!increaseResult.canIncrease && increaseResult.reason && !increaseResult.reason.includes('Maximum ability score'));
    
    return {
        currentValue,
        canIncrease: canIncrease,
        canDecrease: decreaseResult.canDecrease,
        increaseCost: increaseResult.cost,
        decreaseRefund: decreaseResult.refund,
        increaseReason: availablePoints < increaseResult.cost ? `Will overspend by ${increaseResult.cost - availablePoints} points` : increaseResult.reason,
        decreaseReason: decreaseResult.reason
    };
};

// =====================================================
// HEALTH-ENERGY EDITING FUNCTIONS  
// =====================================================

/**
 * Toggles the visibility of the health-energy editor
 */
window.toggleHealthEnergyEditor = function() {
    window.isEditingHealthEnergy = !window.isEditingHealthEnergy;
    window.refreshCharacterSheet();
};

/**
 * Toggles the visibility of the abilities editor controls
 */
window.toggleAbilitiesEditor = function() {
    window.isEditingAbilities = !window.isEditingAbilities;
    window.refreshCharacterSheet();
};

/**
 * Toggles the visibility of the proficiency editor controls
 */
window.toggleProficiencyEditor = function() {
    window.isEditingProficiency = !window.isEditingProficiency;
    window.refreshCharacterSheet();
};

/**
 * Increases martial proficiency by 1
 */
window.increaseMartialProf = function() {
    if (!currentCharacterData || !window.isEditMode) return false;
    
    // Allow overspending - UI will show red if over budget
    currentCharacterData.mart_prof = (currentCharacterData.mart_prof || 0) + 1;
    window.refreshCharacterSheet();
    scheduleAutoSave();
    return true;
};

/**
 * Decreases martial proficiency by 1
 */
window.decreaseMartialProf = function() {
    if (!currentCharacterData || !window.isEditMode) return false;
    
    if ((currentCharacterData.mart_prof || 0) <= 0) {
        showNotification('Martial proficiency cannot go below 0.', 'error');
        return false;
    }
    
    currentCharacterData.mart_prof = (currentCharacterData.mart_prof || 0) - 1;
    window.refreshCharacterSheet();
    scheduleAutoSave();
    return true;
};

/**
 * Increases power proficiency by 1
 */
window.increasePowerProf = function() {
    if (!currentCharacterData || !window.isEditMode) return false;
    
    // Allow overspending - UI will show red if over budget
    currentCharacterData.pow_prof = (currentCharacterData.pow_prof || 0) + 1;
    window.refreshCharacterSheet();
    scheduleAutoSave();
    return true;
};

/**
 * Decreases power proficiency by 1
 */
window.decreasePowerProf = function() {
    if (!currentCharacterData || !window.isEditMode) return false;
    
    if ((currentCharacterData.pow_prof || 0) <= 0) {
        showNotification('Power proficiency cannot go below 0.', 'error');
        return false;
    }
    
    currentCharacterData.pow_prof = (currentCharacterData.pow_prof || 0) - 1;
    window.refreshCharacterSheet();
    scheduleAutoSave();
    return true;
};

/**
 * Attempts to increase health allocation
 * @param {number} amount - Amount to increase (default 1)
 * @returns {boolean} Whether the increase was successful
 */
window.increaseHealthAllocation = function(amount = 1) {
    if (!currentCharacterData || !window.isEditMode) return false;
    
    const currentHealth = currentCharacterData.health_energy_points?.health || 0;
    const newHealth = currentHealth + amount;
    
    // Allow overspending - UI will show red if over budget
    
    // Apply the increase
    if (!currentCharacterData.health_energy_points) {
        currentCharacterData.health_energy_points = { health: 0, energy: 0 };
    }
    currentCharacterData.health_energy_points.health = newHealth;
    
    // Trigger re-render and auto-save
    window.refreshCharacterSheet();
    scheduleAutoSave();
    return true;
};

/**
 * Attempts to decrease health allocation
 * @param {number} amount - Amount to decrease (default 1)
 * @returns {boolean} Whether the decrease was successful
 */
window.decreaseHealthAllocation = function(amount = 1) {
    if (!currentCharacterData || !window.isEditMode) return false;
    
    const currentHealth = currentCharacterData.health_energy_points?.health || 0;
    const newHealth = currentHealth - amount;
    
    if (newHealth < 0) {
        showNotification('Health allocation cannot be negative.', 'error');
        return false;
    }
    
    // Apply the decrease
    if (!currentCharacterData.health_energy_points) {
        currentCharacterData.health_energy_points = { health: 0, energy: 0 };
    }
    currentCharacterData.health_energy_points.health = newHealth;
    
    // Trigger re-render and auto-save
    window.refreshCharacterSheet();
    scheduleAutoSave();
    return true;
};

/**
 * Attempts to increase energy allocation
 * @param {number} amount - Amount to increase (default 1)
 * @returns {boolean} Whether the increase was successful
 */
window.increaseEnergyAllocation = function(amount = 1) {
    if (!currentCharacterData || !window.isEditMode) return false;
    
    const currentEnergy = currentCharacterData.health_energy_points?.energy || 0;
    const newEnergy = currentEnergy + amount;
    
    // Allow overspending - UI will show red if over budget
    
    // Apply the increase
    if (!currentCharacterData.health_energy_points) {
        currentCharacterData.health_energy_points = { health: 0, energy: 0 };
    }
    currentCharacterData.health_energy_points.energy = newEnergy;
    
    // Trigger re-render and auto-save
    window.refreshCharacterSheet();
    scheduleAutoSave();
    return true;
};

/**
 * Attempts to decrease energy allocation
 * @param {number} amount - Amount to decrease (default 1)
 * @returns {boolean} Whether the decrease was successful
 */
window.decreaseEnergyAllocation = function(amount = 1) {
    if (!currentCharacterData || !window.isEditMode) return false;
    
    const currentEnergy = currentCharacterData.health_energy_points?.energy || 0;
    const newEnergy = currentEnergy - amount;
    
    if (newEnergy < 0) {
        showNotification('Energy allocation cannot be negative.', 'error');
        return false;
    }
    
    // Apply the decrease
    if (!currentCharacterData.health_energy_points) {
        currentCharacterData.health_energy_points = { health: 0, energy: 0 };
    }
    currentCharacterData.health_energy_points.energy = newEnergy;
    
    // Trigger re-render and auto-save
    window.refreshCharacterSheet();
    scheduleAutoSave();
    return true;
};

/**
 * Ensures Unarmed Prowess is always present in weapons list for display.
 * Calculates unarmed damage based on character's Strength score.
 * This is for UI display only - Unarmed Prowess is NOT saved to Firestore.
 * @param {Object} charData - Character data object
 * @returns {Array} Weapons array with Unarmed Prowess prepended
 */
function getWeaponsWithUnarmed(charData) {
    if (!charData || !charData.abilities) return [];
    const str = charData.abilities.strength || 0;
    const unarmedDamage = Math.ceil(str / 2);
    // Filter out any existing "Unarmed Prowess" (shouldn't be present, but just in case)
    const weapons = (charData.weapons || []).filter(w => {
        if (typeof w === 'string') return w !== 'Unarmed Prowess';
        return w.name !== 'Unarmed Prowess';
    });
    // Insert Unarmed Prowess at the top for display
    return [
        {
            name: 'Unarmed Prowess',
            damage: `${unarmedDamage} Bludgeoning`,
            damageType: 'Bludgeoning',
            range: 'Melee',
        },
        ...weapons
    ];
}

/**
 * Removes Unarmed Prowess from weapons array before saving to Firestore.
 * Unarmed Prowess is dynamically generated and should never be persisted.
 * @param {Array} weapons - Array of weapon objects or strings
 * @returns {Array} Filtered weapons array without Unarmed Prowess
 */
function stripUnarmedProwessFromWeapons(weapons) {
    return (weapons || []).filter(w => {
        if (typeof w === 'string') return w !== 'Unarmed Prowess';
        return w.name !== 'Unarmed Prowess';
    });
}

/**
 * Re-renders the archetype column with updated character data.
 * Recalculates all derived stats (defenses, health, energy, bonuses, etc.)
 * Called after equipping/unequipping items or other stat changes.
 * @param {Object} [options={}] - Reserved for future optimization options
 */
window.refreshArchetypeColumn = function(options = {}) {
    if (!currentCharacterData) return;
    
    // Note: weaponsOnly optimization removed due to ES module limitations
    // Always do full render to ensure consistency
    
    // Full recalculation for complete refresh
    let archetypeAbility = null;
    if (currentCharacterData.pow_prof > 0) archetypeAbility = currentCharacterData.pow_abil;
    else if (currentCharacterData.mart_prof > 0) archetypeAbility = currentCharacterData.mart_abil;
    const defensesCalc = calculateDefenses(currentCharacterData.abilities, currentCharacterData.defenseVals);
    const speed = calculateSpeed(currentCharacterData.abilities.agility || 0, getSpeedBase(currentCharacterData));
    const evasion = calculateEvasion(currentCharacterData.abilities.agility || 0, null, getEvasionBase(currentCharacterData));
    const maxHealth = calculateMaxHealth(
        currentCharacterData.health_energy_points.health || 0,
        currentCharacterData.abilities.vitality || 0,
        currentCharacterData.level || 1,
        archetypeAbility,
        currentCharacterData.abilities
    );
    const maxEnergy = calculateMaxEnergy(
        currentCharacterData.health_energy_points.energy || 0,
        archetypeAbility,
        currentCharacterData.abilities,
        currentCharacterData.level || 1
    );
    currentCharacterData.defenses = defensesCalc.defenseScores;
    currentCharacterData.defenseBonuses = defensesCalc.defenseBonuses;
    const calculatedData = {
        defenseScores: defensesCalc.defenseScores,
        defenseBonuses: defensesCalc.defenseBonuses,
        healthEnergy: { maxHealth, maxEnergy },
        bonuses: calculateBonuses(
            currentCharacterData.mart_prof,
            currentCharacterData.pow_prof,
            currentCharacterData.abilities,
            currentCharacterData.pow_abil || 'charisma'
        ),
        speed,
        evasion
    };
    // PATCH: Only inject Unarmed Prowess for display
    renderArchetype(
        { ...currentCharacterData, weapons: getWeaponsWithUnarmed(currentCharacterData) },
        calculatedData
    );
};

/**
 * Get calculated data for the current character
 * Used by components that need to refresh just their section
 */
window.getCalculatedData = function() {
    if (!currentCharacterData) return {};
    
    let archetypeAbility = null;
    if (currentCharacterData.pow_prof > 0) archetypeAbility = currentCharacterData.pow_abil;
    else if (currentCharacterData.mart_prof > 0) archetypeAbility = currentCharacterData.mart_abil;
    
    const defensesCalc = calculateDefenses(currentCharacterData.abilities, currentCharacterData.defenseVals);
    const speed = calculateSpeed(currentCharacterData.abilities.agility || 0, getSpeedBase(currentCharacterData));
    const evasion = calculateEvasion(currentCharacterData.abilities.agility || 0, null, getEvasionBase(currentCharacterData));
    const maxHealth = calculateMaxHealth(
        currentCharacterData.health_energy_points?.health || 0,
        currentCharacterData.abilities.vitality || 0,
        currentCharacterData.level || 1,
        archetypeAbility,
        currentCharacterData.abilities
    );
    const maxEnergy = calculateMaxEnergy(
        currentCharacterData.health_energy_points?.energy || 0,
        archetypeAbility,
        currentCharacterData.abilities,
        currentCharacterData.level || 1
    );
    
    return {
        defenseScores: defensesCalc.defenseScores,
        defenseBonuses: defensesCalc.defenseBonuses,
        healthEnergy: { maxHealth, maxEnergy },
        bonuses: calculateBonuses(
            currentCharacterData.mart_prof,
            currentCharacterData.pow_prof,
            currentCharacterData.abilities,
            currentCharacterData.pow_abil || 'charisma'
        ),
        speed,
        evasion
    };
};

/**
 * Recalculates all derived stats and re-renders the entire character sheet.
 * Called after any character data changes.
 */
window.refreshCharacterSheet = async function() {
    if (!currentCharacterData) return;
    
    // Determine archetype primary ability
    let archetypeAbility = null;
    if (currentCharacterData.pow_prof > 0) archetypeAbility = currentCharacterData.pow_abil;
    else if (currentCharacterData.mart_prof > 0) archetypeAbility = currentCharacterData.mart_abil;
    
    // Recalculate all derived stats
    const defensesCalc = calculateDefenses(currentCharacterData.abilities, currentCharacterData.defenseVals);
    const speed = calculateSpeed(currentCharacterData.abilities.agility || 0, getSpeedBase(currentCharacterData));
    const evasion = calculateEvasion(currentCharacterData.abilities.agility || 0, null, getEvasionBase(currentCharacterData));
    const maxHealth = calculateMaxHealth(
        currentCharacterData.health_energy_points?.health || 0,
        currentCharacterData.abilities.vitality || 0,
        currentCharacterData.level || 1,
        archetypeAbility,
        currentCharacterData.abilities
    );
    const maxEnergy = calculateMaxEnergy(
        currentCharacterData.health_energy_points?.energy || 0,
        archetypeAbility,
        currentCharacterData.abilities,
        currentCharacterData.level || 1
    );
    
    currentCharacterData.defenses = defensesCalc.defenseScores;
    currentCharacterData.defenseBonuses = defensesCalc.defenseBonuses;
    
    const calculatedData = {
        defenseScores: defensesCalc.defenseScores,
        defenseBonuses: defensesCalc.defenseBonuses,
        healthEnergy: { maxHealth, maxEnergy },
        bonuses: calculateBonuses(
            currentCharacterData.mart_prof,
            currentCharacterData.pow_prof,
            currentCharacterData.abilities,
            currentCharacterData.pow_abil || 'charisma'
        ),
        speed,
        evasion
    };
    
    // Re-render all components
    renderHeader(currentCharacterData, calculatedData);
    renderAbilities(currentCharacterData, calculatedData);
    renderSkills(currentCharacterData);
    renderArchetype({ ...currentCharacterData, weapons: getWeaponsWithUnarmed(currentCharacterData) }, calculatedData);
    await renderLibrary({ ...currentCharacterData, weapons: getWeaponsWithUnarmed(currentCharacterData) });
    
    // Update edit button notification dot
    updateEditButtonNotification();
};

document.addEventListener('DOMContentLoaded', async () => {
    const loadingOverlay = document.getElementById('loading-overlay');
    const characterSheet = document.getElementById('character-sheet');

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const characterId = urlParams.get('id');

        // --- Load traits from RTDB before loading/rendering character ---
        const allTraits = await loadTraitsFromDatabase();

        // NEW: Use unified loader
        let charData = await loadCharacterById(characterId);
        currentCharacterData = charData;

        // Attach traits to charData for library feats tab
        charData.allTraits = allTraits;
        // Also expose globally for convenience (optional)
        window.allTraits = allTraits;

        // Determine archetype primary ability
        let archetypeAbility = null;
        if (charData.pow_prof > 0) archetypeAbility = charData.pow_abil;
        else if (charData.mart_prof > 0) archetypeAbility = charData.mart_abil;

        // Derived calculations
        const defensesCalc = calculateDefenses(charData.abilities, charData.defenseVals);
        const speed = calculateSpeed(charData.abilities.agility || 0, getSpeedBase(charData));
        const evasion = calculateEvasion(charData.abilities.agility || 0, null, getEvasionBase(charData));
        const maxHealth = calculateMaxHealth(
            charData.health_energy_points.health || 0,
            charData.abilities.vitality || 0,
            charData.level || 1,
            archetypeAbility,
            charData.abilities
        );
        const maxEnergy = calculateMaxEnergy(
            charData.health_energy_points.energy || 0,
            archetypeAbility,
            charData.abilities,
            charData.level || 1
        );

        charData.defenses = defensesCalc.defenseScores;
        charData.defenseBonuses = defensesCalc.defenseBonuses;

        const calculatedData = {
            defenseScores: defensesCalc.defenseScores,
            defenseBonuses: defensesCalc.defenseBonuses,
            healthEnergy: { maxHealth, maxEnergy },
            bonuses: calculateBonuses(charData.mart_prof, charData.pow_prof, charData.abilities, charData.pow_abil || 'charisma'),
            speed,
            evasion
        };

        if (charData.currentHealth === undefined) charData.currentHealth = maxHealth;
        if (charData.currentEnergy === undefined) charData.currentEnergy = maxEnergy;

        // --- PATCH: Do NOT inject Unarmed Prowess into charData.weapons, only for display ---
        // Instead, pass getWeaponsWithUnarmed(charData) to renderArchetype and renderLibrary

        renderHeader(charData, calculatedData);
        renderAbilities(charData, calculatedData);
        renderSkills(charData);

        // Pass weapons with Unarmed Prowess for archetype column
        renderArchetype({ ...charData, weapons: getWeaponsWithUnarmed(charData) }, calculatedData);

        // For library, you may want to do the same if it displays weapons
        await renderLibrary({ ...charData, weapons: getWeaponsWithUnarmed(charData) });

        loadingOverlay.style.display = 'none';
        characterSheet.style.display = 'block';
        
        // Update edit button notification dot on initial load
        updateEditButtonNotification();

        document.getElementById('long-rest')?.addEventListener('click', longRest);

        window.isEditMode = false;

        document.getElementById('toggle-edit-mode')?.addEventListener('click', async () => {
            window.isEditMode = !window.isEditMode;
            // setEditMode handles the full re-render, no need to call refreshCharacterSheet
            await window.setEditMode(window.isEditMode);
        });

    } catch (error) {
        console.error('Error loading character:', error);
        const loadingOverlay = document.getElementById('loading-overlay');
        const msg = /Permission denied/i.test(error.message)
            ? 'Permission denied. Ensure rules include /users/{uid}/character/{docId} and App Check is active.'
            : error.message;
        loadingOverlay.innerHTML = `
            <div style="text-align:center;padding:40px;background:white;border-radius:12px;max-width:520px;">
                <h2 style="color:#dc3545;">Error Loading Character</h2>
                <p style="margin:20px 0;color:#6c757d;">${msg}</p>
                <p style="font-size:0.8em;color:#999;">ID: ${currentCharacterId || '(none)'} </p>
                <a href="/pages/characters.html" style="display:inline-block;padding:12px 24px;background:#1a73e8;color:white;text-decoration:none;border-radius:8px;font-weight:600;">Return to Characters</a>
            </div>
        `;
    }
});

window.showEquipmentModal = showEquipmentModal;
window.showFeatModal = showFeatModal;
window.enrichCharacterData = enrichCharacterData;
window.renderLibrary = renderLibrary;
window.currentCharacterData = () => currentCharacterData;