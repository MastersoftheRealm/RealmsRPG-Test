/**
 * Library Modals
 * Handles adding techniques, powers, weapons, and armor from user's Firestore library
 */

import { 
    openResourceModal, 
    closeResourceModal, 
    getCharacterData, 
    refreshLibraryAfterChange,
    getCurrentUser,
    getFirestoreDb,
    applySort
} from './modal-core.js';
import { 
    fetchTechniqueParts, 
    fetchPowerParts 
} from '../../../core/rtdb-cache.js';
import { calculateTechniqueCosts, computeActionType as computeTechniqueActionType } from '../../../calculators/technique-calc.js';
import { calculatePowerCosts, computeActionType as computePowerActionType } from '../../../calculators/power-calc.js';

// ============================================================================
// TECHNIQUES
// ============================================================================

let userTechniques = [];
let filteredTechniques = [];
let techniqueSortState = { col: 'name', dir: 1 };
let techniquePartsDb = [];

export async function showTechniqueModal() {
    openResourceModal();
    
    const title = document.getElementById('resource-modal-title');
    if (title) title.textContent = 'Add Technique';
    
    const body = document.getElementById('resource-modal-body');
    if (!body) return;
    body.innerHTML = '<div class="modal-loading">Loading techniques from your library...</div>';
    
    const user = getCurrentUser();
    if (!user) {
        body.innerHTML = '<div class="modal-error">Please log in to access your technique library.</div>';
        return;
    }
    
    try {
        const db = getFirestoreDb();
        if (!db) throw new Error('Firestore not available');
        
        // Load technique parts for calculations
        techniquePartsDb = await fetchTechniqueParts();
        
        // Correct collection: techniqueLibrary
        const snapshot = await db.collection('users').doc(user.uid).collection('techniqueLibrary').get();
        userTechniques = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Derive energy and action type from parts
            const partsPayload = Array.isArray(data.parts) ? data.parts.map(p => ({
                name: p.name,
                op_1_lvl: p.op_1_lvl || 0,
                op_2_lvl: p.op_2_lvl || 0,
                op_3_lvl: p.op_3_lvl || 0
            })) : [];
            const calc = calculateTechniqueCosts(partsPayload, techniquePartsDb);
            const actionType = computeTechniqueActionType(partsPayload);
            
            userTechniques.push({ 
                id: doc.id, 
                ...data,
                energy: calc.totalEnergy,
                actionType: actionType
            });
        });
        renderTechniqueModal(body);
    } catch (e) {
        body.innerHTML = `<div class="modal-error">Error loading techniques.<br>${e.message || e}</div>`;
    }
}

function renderTechniqueModal(container) {
    container.innerHTML = `
        <div class="modal-filters">
            <input id="modal-technique-search" type="text" class="modal-search" placeholder="Search techniques...">
        </div>
        <div class="modal-table-container">
            <table class="modal-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Action</th>
                        <th>Energy</th>
                        <th style="width:80px;"></th>
                    </tr>
                </thead>
                <tbody id="modal-technique-tbody"></tbody>
            </table>
        </div>
    `;
    
    document.getElementById('modal-technique-search').addEventListener('input', applyTechniqueFilters);
    applyTechniqueFilters();
}

function applyTechniqueFilters() {
    const charData = getCharacterData();
    const search = document.getElementById('modal-technique-search')?.value?.toLowerCase() || '';
    const currentTechniques = charData?.techniques || [];
    
    filteredTechniques = userTechniques.filter(t => {
        if (search && !t.name.toLowerCase().includes(search)) return false;
        const alreadyHas = currentTechniques.some(ct => {
            const name = typeof ct === 'string' ? ct : ct?.name;
            return name === t.name;
        });
        if (alreadyHas) return false;
        return true;
    });
    
    applySort(filteredTechniques, techniqueSortState, 'name');
    renderTechniqueTable();
}

function renderTechniqueTable() {
    const tbody = document.getElementById('modal-technique-tbody');
    if (!tbody) return;
    
    if (filteredTechniques.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="modal-empty">No techniques available to add.</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredTechniques.map(t => `
        <tr>
            <td><strong>${t.name}</strong></td>
            <td>${t.actionType || 'Basic Action'}</td>
            <td>${t.energy || 0}</td>
            <td><button class="modal-add-btn" onclick="window.addTechniqueToCharacter('${encodeURIComponent(t.name)}')">Add</button></td>
        </tr>
    `).join('');
}

window.addTechniqueToCharacter = function(encodedName) {
    const name = decodeURIComponent(encodedName);
    const charData = getCharacterData();
    
    if (!charData) {
        alert('Character data not loaded.');
        return;
    }
    
    if (!Array.isArray(charData.techniques)) charData.techniques = [];
    if (!charData.techniques.includes(name)) {
        charData.techniques.push(name);
    }
    
    if (window.scheduleAutoSave) window.scheduleAutoSave();
    refreshLibraryAfterChange(charData, 'techniques');
    closeResourceModal();
    if (typeof window.showNotification === 'function') window.showNotification(`Added "${name}" technique.`, 'success');
};

window.removeTechniqueFromCharacter = function(encodedName) {
    const name = decodeURIComponent(encodedName);
    const charData = getCharacterData();
    
    if (!charData) return;
    
    if (Array.isArray(charData.techniques)) {
        charData.techniques = charData.techniques.filter(t => {
            if (typeof t === 'string') return t !== name;
            return t?.name !== name;
        });
    }
    
    if (window.scheduleAutoSave) window.scheduleAutoSave();
    refreshLibraryAfterChange(charData, 'techniques');
    if (typeof window.showNotification === 'function') window.showNotification(`Removed "${name}" technique.`, 'success');
};

// ============================================================================
// POWERS
// ============================================================================

let userPowers = [];
let filteredPowers = [];
let powerSortState = { col: 'name', dir: 1 };
let powerPartsDb = [];

export async function showPowerModal() {
    openResourceModal();
    
    const title = document.getElementById('resource-modal-title');
    if (title) title.textContent = 'Add Power';
    
    const body = document.getElementById('resource-modal-body');
    if (!body) return;
    body.innerHTML = '<div class="modal-loading">Loading powers from your library...</div>';
    
    const user = getCurrentUser();
    if (!user) {
        body.innerHTML = '<div class="modal-error">Please log in to access your power library.</div>';
        return;
    }
    
    try {
        const db = getFirestoreDb();
        if (!db) throw new Error('Firestore not available');
        
        // Load power parts for calculations
        powerPartsDb = await fetchPowerParts();
        
        // Correct collection: library (for powers)
        const snapshot = await db.collection('users').doc(user.uid).collection('library').get();
        userPowers = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Derive energy and action type from parts
            const partsPayload = Array.isArray(data.parts) ? data.parts.map(p => ({
                name: p.name,
                op_1_lvl: p.op_1_lvl || 0,
                op_2_lvl: p.op_2_lvl || 0,
                op_3_lvl: p.op_3_lvl || 0,
                applyDuration: p.applyDuration || false
            })) : [];
            const calc = calculatePowerCosts(partsPayload, powerPartsDb);
            const actionType = computePowerActionType(partsPayload);
            
            userPowers.push({ 
                id: doc.id, 
                ...data,
                energy: calc.totalEnergy,
                actionType: actionType
            });
        });
        renderPowerModal(body);
    } catch (e) {
        body.innerHTML = `<div class="modal-error">Error loading powers.<br>${e.message || e}</div>`;
    }
}

function renderPowerModal(container) {
    container.innerHTML = `
        <div class="modal-filters">
            <input id="modal-power-search" type="text" class="modal-search" placeholder="Search powers...">
        </div>
        <div class="modal-table-container">
            <table class="modal-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Action</th>
                        <th>Energy</th>
                        <th style="width:80px;"></th>
                    </tr>
                </thead>
                <tbody id="modal-power-tbody"></tbody>
            </table>
        </div>
    `;
    
    document.getElementById('modal-power-search').addEventListener('input', applyPowerFilters);
    applyPowerFilters();
}

function applyPowerFilters() {
    const charData = getCharacterData();
    const search = document.getElementById('modal-power-search')?.value?.toLowerCase() || '';
    const currentPowers = charData?.powers || [];
    
    filteredPowers = userPowers.filter(p => {
        if (search && !p.name.toLowerCase().includes(search)) return false;
        const alreadyHas = currentPowers.some(cp => {
            const name = typeof cp === 'string' ? cp : cp?.name;
            return name === p.name;
        });
        if (alreadyHas) return false;
        return true;
    });
    
    applySort(filteredPowers, powerSortState, 'name');
    renderPowerTable();
}

function renderPowerTable() {
    const tbody = document.getElementById('modal-power-tbody');
    if (!tbody) return;
    
    if (filteredPowers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="modal-empty">No powers available to add.</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredPowers.map(p => `
        <tr>
            <td><strong>${p.name}</strong></td>
            <td>${p.actionType || 'Basic Action'}</td>
            <td>${p.energy || 0}</td>
            <td><button class="modal-add-btn" onclick="window.addPowerToCharacter('${encodeURIComponent(p.name)}')">Add</button></td>
        </tr>
    `).join('');
}

window.addPowerToCharacter = function(encodedName) {
    const name = decodeURIComponent(encodedName);
    const charData = getCharacterData();
    
    if (!charData) {
        alert('Character data not loaded.');
        return;
    }
    
    if (!Array.isArray(charData.powers)) charData.powers = [];
    
    // Check if power already exists (support both string and object format)
    const exists = charData.powers.some(p => {
        const pName = typeof p === 'string' ? p : p.name;
        return pName === name;
    });
    
    if (!exists) {
        // Add as object with innate defaulting to false
        charData.powers.push({ name: name, innate: false });
    }
    
    if (window.scheduleAutoSave) window.scheduleAutoSave();
    refreshLibraryAfterChange(charData, 'powers');
    closeResourceModal();
    if (typeof window.showNotification === 'function') window.showNotification(`Added "${name}" power.`, 'success');
};

window.removePowerFromCharacter = function(encodedName) {
    const name = decodeURIComponent(encodedName);
    const charData = getCharacterData();
    
    if (!charData) return;
    
    if (Array.isArray(charData.powers)) {
        charData.powers = charData.powers.filter(p => {
            if (typeof p === 'string') return p !== name;
            return p?.name !== name;
        });
    }
    
    if (window.scheduleAutoSave) window.scheduleAutoSave();
    refreshLibraryAfterChange(charData, 'powers');
    if (typeof window.showNotification === 'function') window.showNotification(`Removed "${name}" power.`, 'success');
};

/**
 * Toggle the innate status of a power
 * @param {string} powerName - The name of the power
 * @param {boolean} isInnate - Whether the power should be innate
 */
window.togglePowerInnate = function(powerName, isInnate) {
    const charData = getCharacterData();
    if (!charData) return;
    
    if (!Array.isArray(charData.powers)) charData.powers = [];
    
    // Convert all powers to object format and update the target power
    charData.powers = charData.powers.map(p => {
        const pName = typeof p === 'string' ? p : p.name;
        const pInnate = typeof p === 'object' ? p.innate : false;
        
        if (pName === powerName) {
            return { name: pName, innate: isInnate };
        }
        return { name: pName, innate: pInnate };
    });
    
    if (window.scheduleAutoSave) window.scheduleAutoSave();
    refreshLibraryAfterChange(charData, 'powers');
    
    const status = isInnate ? 'marked as innate' : 'unmarked as innate';
    if (typeof window.showNotification === 'function') {
        window.showNotification(`"${powerName}" ${status}.`, 'success');
    }
};

// ============================================================================
// WEAPONS (includes shields)
// ============================================================================

let userWeapons = [];
let filteredWeapons = [];
let weaponSortState = { col: 'name', dir: 1 };

export async function showWeaponModal() {
    openResourceModal();
    
    const title = document.getElementById('resource-modal-title');
    if (title) title.textContent = 'Add Weapon / Shield';
    
    const body = document.getElementById('resource-modal-body');
    if (!body) return;
    body.innerHTML = '<div class="modal-loading">Loading weapons from your library...</div>';
    
    const user = getCurrentUser();
    if (!user) {
        body.innerHTML = '<div class="modal-error">Please log in to access your item library.</div>';
        return;
    }
    
    try {
        const db = getFirestoreDb();
        if (!db) throw new Error('Firestore not available');
        
        // Correct collection: itemLibrary
        const snapshot = await db.collection('users').doc(user.uid).collection('itemLibrary').get();
        userWeapons = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Filter to weapons and shields (case-insensitive)
            const armType = (data.armamentType || '').toLowerCase();
            if (armType === 'weapon' || armType === 'shield') {
                userWeapons.push({ id: doc.id, ...data });
            }
        });
        renderWeaponModal(body);
    } catch (e) {
        body.innerHTML = `<div class="modal-error">Error loading weapons.<br>${e.message || e}</div>`;
    }
}

function renderWeaponModal(container) {
    container.innerHTML = `
        <div class="modal-filters">
            <input id="modal-weapon-search" type="text" class="modal-search" placeholder="Search weapons...">
        </div>
        <div class="modal-table-container">
            <table class="modal-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Rarity</th>
                        <th style="width:80px;"></th>
                    </tr>
                </thead>
                <tbody id="modal-weapon-tbody"></tbody>
            </table>
        </div>
    `;
    
    document.getElementById('modal-weapon-search').addEventListener('input', applyWeaponFilters);
    applyWeaponFilters();
}

function applyWeaponFilters() {
    const charData = getCharacterData();
    const search = document.getElementById('modal-weapon-search')?.value?.toLowerCase() || '';
    const currentWeapons = charData?.weapons || [];
    
    filteredWeapons = userWeapons.filter(w => {
        if (search && !w.name.toLowerCase().includes(search)) return false;
        const alreadyHas = currentWeapons.some(cw => {
            const name = typeof cw === 'string' ? cw : cw?.name;
            return name === w.name;
        });
        if (alreadyHas) return false;
        return true;
    });
    
    applySort(filteredWeapons, weaponSortState, 'name');
    renderWeaponTable();
}

function renderWeaponTable() {
    const tbody = document.getElementById('modal-weapon-tbody');
    if (!tbody) return;
    
    if (filteredWeapons.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="modal-empty">No weapons available to add.</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredWeapons.map(w => `
        <tr>
            <td><strong>${w.name}</strong></td>
            <td>${w.armamentType === 'shield' ? 'Shield' : 'Weapon'}</td>
            <td>${w.rarity || 'Common'}</td>
            <td><button class="modal-add-btn" onclick="window.addWeaponToCharacter('${encodeURIComponent(w.name)}')">Add</button></td>
        </tr>
    `).join('');
}

window.addWeaponToCharacter = function(encodedName) {
    const name = decodeURIComponent(encodedName);
    const charData = getCharacterData();
    
    if (!charData) {
        alert('Character data not loaded.');
        return;
    }
    
    if (!Array.isArray(charData.weapons)) charData.weapons = [];
    const alreadyHas = charData.weapons.some(w => {
        const wName = typeof w === 'string' ? w : w?.name;
        return wName === name;
    });
    if (!alreadyHas) {
        // Find the full weapon object from userWeapons
        const weaponObj = userWeapons.find(w => w.name === name);
        if (weaponObj) {
            charData.weapons.push({ ...weaponObj, equipped: false });
        }
    }
    
    if (window.scheduleAutoSave) window.scheduleAutoSave();
    refreshLibraryAfterChange(charData, 'inventory');
    closeResourceModal();
    if (typeof window.showNotification === 'function') window.showNotification(`Added "${name}" weapon.`, 'success');
};

window.removeWeaponFromCharacter = function(encodedName) {
    const name = decodeURIComponent(encodedName);
    const charData = getCharacterData();
    
    if (!charData) return;
    
    if (Array.isArray(charData.weapons)) {
        charData.weapons = charData.weapons.filter(w => {
            if (typeof w === 'string') return w !== name;
            return w?.name !== name;
        });
    }
    
    if (window.scheduleAutoSave) window.scheduleAutoSave();
    refreshLibraryAfterChange(charData, 'inventory');
    if (typeof window.showNotification === 'function') window.showNotification(`Removed "${name}" weapon.`, 'success');
};

// ============================================================================
// ARMOR
// ============================================================================

let userArmor = [];
let filteredArmor = [];
let armorSortState = { col: 'name', dir: 1 };

export async function showArmorModal() {
    openResourceModal();
    
    const title = document.getElementById('resource-modal-title');
    if (title) title.textContent = 'Add Armor';
    
    const body = document.getElementById('resource-modal-body');
    if (!body) return;
    body.innerHTML = '<div class="modal-loading">Loading armor from your library...</div>';
    
    const user = getCurrentUser();
    if (!user) {
        body.innerHTML = '<div class="modal-error">Please log in to access your item library.</div>';
        return;
    }
    
    try {
        const db = getFirestoreDb();
        if (!db) throw new Error('Firestore not available');
        
        // Correct collection: itemLibrary
        const snapshot = await db.collection('users').doc(user.uid).collection('itemLibrary').get();
        userArmor = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Filter to armor only (case-insensitive)
            const armType = (data.armamentType || '').toLowerCase();
            if (armType === 'armor') {
                userArmor.push({ id: doc.id, ...data });
            }
        });
        renderArmorModal(body);
    } catch (e) {
        body.innerHTML = `<div class="modal-error">Error loading armor.<br>${e.message || e}</div>`;
    }
}

function renderArmorModal(container) {
    container.innerHTML = `
        <div class="modal-filters">
            <input id="modal-armor-search" type="text" class="modal-search" placeholder="Search armor...">
        </div>
        <div class="modal-table-container">
            <table class="modal-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Rarity</th>
                        <th style="width:80px;"></th>
                    </tr>
                </thead>
                <tbody id="modal-armor-tbody"></tbody>
            </table>
        </div>
    `;
    
    document.getElementById('modal-armor-search').addEventListener('input', applyArmorFilters);
    applyArmorFilters();
}

function applyArmorFilters() {
    const charData = getCharacterData();
    const search = document.getElementById('modal-armor-search')?.value?.toLowerCase() || '';
    const currentArmor = charData?.armor || [];
    
    filteredArmor = userArmor.filter(a => {
        if (search && !a.name.toLowerCase().includes(search)) return false;
        const alreadyHas = currentArmor.some(ca => {
            const name = typeof ca === 'string' ? ca : ca?.name;
            return name === a.name;
        });
        if (alreadyHas) return false;
        return true;
    });
    
    applySort(filteredArmor, armorSortState, 'name');
    renderArmorTable();
}

function renderArmorTable() {
    const tbody = document.getElementById('modal-armor-tbody');
    if (!tbody) return;
    
    if (filteredArmor.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="modal-empty">No armor available to add.</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredArmor.map(a => `
        <tr>
            <td><strong>${a.name}</strong></td>
            <td>${a.rarity || 'Common'}</td>
            <td><button class="modal-add-btn" onclick="window.addArmorToCharacter('${encodeURIComponent(a.name)}')">Add</button></td>
        </tr>
    `).join('');
}

window.addArmorToCharacter = function(encodedName) {
    const name = decodeURIComponent(encodedName);
    const charData = getCharacterData();
    
    if (!charData) {
        alert('Character data not loaded.');
        return;
    }
    
    if (!Array.isArray(charData.armor)) charData.armor = [];
    const alreadyHas = charData.armor.some(a => {
        const aName = typeof a === 'string' ? a : a?.name;
        return aName === name;
    });
    if (!alreadyHas) {
        // Find the full armor object from userArmor
        const armorObj = userArmor.find(a => a.name === name);
        if (armorObj) {
            charData.armor.push({ ...armorObj, equipped: false });
        }
    }
    
    if (window.scheduleAutoSave) window.scheduleAutoSave();
    refreshLibraryAfterChange(charData, 'inventory');
    closeResourceModal();
    if (typeof window.showNotification === 'function') window.showNotification(`Added "${name}" armor.`, 'success');
};

window.removeArmorFromCharacter = function(encodedName) {
    const name = decodeURIComponent(encodedName);
    const charData = getCharacterData();
    
    if (!charData) return;
    
    if (Array.isArray(charData.armor)) {
        charData.armor = charData.armor.filter(a => {
            if (typeof a === 'string') return a !== name;
            return a?.name !== name;
        });
    }
    
    if (window.scheduleAutoSave) window.scheduleAutoSave();
    refreshLibraryAfterChange(charData, 'inventory');
    if (typeof window.showNotification === 'function') window.showNotification(`Removed "${name}" armor.`, 'success');
};

// Export to window
window.showTechniqueModal = showTechniqueModal;
window.showPowerModal = showPowerModal;
window.showWeaponModal = showWeaponModal;
window.showArmorModal = showArmorModal;
