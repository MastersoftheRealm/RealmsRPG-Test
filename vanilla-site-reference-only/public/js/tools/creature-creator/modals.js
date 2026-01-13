import { powersTechniques, armaments } from './state.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { addArmament } from './interactions.js';
import { addPower } from './interactions.js';
import { addTechnique } from './interactions.js';

// Modal variables
let powerModalListenerAdded = false;
let techniqueModalListenerAdded = false;
let armamentModalListenerAdded = false;

// Firebase dependencies
let currentUser = null;
let firebaseDb = null;
let authReadyPromise = null;

export function setFirebaseDeps(user, db, promise) {
    currentUser = user;
    firebaseDb = db;
    authReadyPromise = promise;
}

// Power modal functions
export async function fetchSavedPowers() {
    await authReadyPromise;
    if (!currentUser || !firebaseDb) return [];
    try {
        const querySnapshot = await getDocs(collection(firebaseDb, 'users', currentUser.uid, 'library'));
        const powers = [];
        querySnapshot.forEach(doc => {
            powers.push({ id: doc.id, ...doc.data(), type: 'power' });
        });
        return powers;
    } catch (error) {
        if (error.code === "permission-denied") {
            alert("You do not have permission to access your saved powers. Please ensure you are logged in and your account has access.");
        } else {
            alert("Error fetching saved powers: " + (error.message || error));
        }
        return [];
    }
}

export function displaySavedPowers(powers) {
    const powerList = document.getElementById('savedPowersList');
    powerList.innerHTML = '';
    if (!powers.length) {
        powerList.innerHTML = '<div>No saved powers found.</div>';
        return;
    }
    powers.forEach(power => {
        const div = document.createElement('div');
        div.className = 'power-item';
        div.innerHTML = `
            <span>${power.name} (TP: ${power.totalTP || 0})</span>
            <button class="small-button blue-button select-power-btn" data-id="${power.id}">Select</button>
        `;
        powerList.appendChild(div);
    });
}

export function openPowerModal() {
    if (!currentUser) {
        alert('Please log in to access saved powers.');
        return;
    }
    const modal = document.getElementById('loadPowerModal');
    modal.style.display = 'block';
    fetchSavedPowers().then(displaySavedPowers);
}

export function closePowerModal() {
    document.getElementById('loadPowerModal').style.display = 'none';
}

// Technique modal functions
export async function fetchSavedTechniques() {
    await authReadyPromise;
    if (!currentUser || !firebaseDb) return [];
    try {
        const querySnapshot = await getDocs(collection(firebaseDb, 'users', currentUser.uid, 'techniqueLibrary'));
        const techniques = [];
        querySnapshot.forEach(doc => {
            techniques.push({ id: doc.id, ...doc.data(), type: 'technique' });
        });
        return techniques;
    } catch (error) {
        if (error.code === "permission-denied") {
            alert("You do not have permission to access your saved techniques. Please ensure you are logged in and your account has access.");
        } else {
            alert("Error fetching saved techniques: " + (error.message || error));
        }
        return [];
    }
}

export function displaySavedTechniques(techniques) {
    const techList = document.getElementById('savedTechniquesList');
    techList.innerHTML = '';
    if (!techniques.length) {
        techList.innerHTML = '<div>No saved techniques found.</div>';
        return;
    }
    const table = document.createElement('table');
    table.className = 'powers-table';
    const headers = ['Name', 'TP', 'Energy', 'Weapon', 'Damage', 'Select'];
    const headerRow = document.createElement('tr');
    headers.forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);
    techniques.forEach(tech => {
        const row = document.createElement('tr');
        const nameCell = document.createElement('td');
        nameCell.textContent = tech.name || '';
        row.appendChild(nameCell);
        const bpCell = document.createElement('td');
        bpCell.textContent = tech.totalTP !== undefined ? tech.totalTP : (tech.bp !== undefined ? tech.bp : '');
        row.appendChild(bpCell);
        const energyCell = document.createElement('td');
        energyCell.textContent = tech.totalEnergy !== undefined ? tech.totalEnergy : '';
        row.appendChild(energyCell);
        const weaponCell = document.createElement('td');
        weaponCell.textContent = tech.weapon && tech.weapon.name ? tech.weapon.name : "Unarmed Prowess";
        row.appendChild(weaponCell);
        const dmgCell = document.createElement('td');
        let damageStr = "";
        if (tech.damage && Array.isArray(tech.damage)) {
            damageStr = tech.damage
                .filter(d => d && d.amount && d.size && d.amount !== '0' && d.size !== '0')
                .map(d => `${d.amount}d${d.size}`)
                .join(', ');
        }
        dmgCell.textContent = damageStr;
        row.appendChild(dmgCell);
        const selectCell = document.createElement('td');
        const selectBtn = document.createElement('button');
        selectBtn.className = 'small-button blue-button select-technique-btn';
        selectBtn.dataset.id = tech.id;
        selectBtn.textContent = 'Select';
        selectCell.appendChild(selectBtn);
        row.appendChild(selectCell);
        table.appendChild(row);
    });
    techList.appendChild(table);
}

export function openTechniqueModal() {
    if (!currentUser) {
        alert('Please log in to access saved techniques.');
        return;
    }
    const modal = document.getElementById('loadTechniqueModal');
    modal.style.display = 'block';
    fetchSavedTechniques().then(displaySavedTechniques);
}

export function closeTechniqueModal() {
    document.getElementById('loadTechniqueModal').style.display = 'none';
}

// Armament modal functions
export async function fetchSavedArmaments() {
    await authReadyPromise;
    if (!currentUser || !firebaseDb) return [];
    try {
        const querySnapshot = await getDocs(collection(firebaseDb, 'users', currentUser.uid, 'itemLibrary'));
        const items = [];
        querySnapshot.forEach(doc => {
            items.push({ id: doc.id, ...doc.data() });
        });
        return items;
    } catch (error) {
        if (error.code === "permission-denied") {
            alert("You do not have permission to access your saved armaments. Please ensure you are logged in and your account has access.");
        } else {
            alert("Error fetching saved armaments: " + (error.message || error));
        }
        return [];
    }
}

export function displaySavedArmaments(items) {
    const armamentList = document.getElementById('savedArmamentsList');
    armamentList.innerHTML = '';
    if (!items.length) {
        armamentList.innerHTML = '<div>No saved armaments found.</div>';
        return;
    }
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'power-item';
        div.innerHTML = `
            <span>${item.name} (${item.armamentType})</span>
            <button class="small-button blue-button select-armament-btn" data-id="${item.id}">Select</button>
        `;
        armamentList.appendChild(div);
    });
}

export function openArmamentModal() {
    if (!currentUser) {
        alert('Please log in to access saved armaments.');
        return;
    }
    const modal = document.getElementById('loadArmamentModal');
    modal.style.display = 'block';
    fetchSavedArmaments().then(displaySavedArmaments);
}

export function closeArmamentModal() {
    document.getElementById('loadArmamentModal').style.display = 'none';
}

// --- Add this at the top ---
let modalUpdateSummary = () => {}

// Allow main to inject updateSummary
export function setModalUpdateSummary(fn) {
    if (typeof fn === "function") modalUpdateSummary = fn;
}

// Setup modal event listeners
export function setupModalEventListeners() {
    // Power modal
    if (document.querySelector('#loadPowerModal .close-button')) {
        document.querySelector('#loadPowerModal .close-button').onclick = closePowerModal;
    }
    if (!powerModalListenerAdded) {
        const powerList = document.getElementById('savedPowersList');
        if (powerList) {
            powerList.addEventListener('click', async (e) => {
                if (e.target.classList.contains('select-power-btn')) {
                    const powerId = e.target.dataset.id;
                    const powers = await fetchSavedPowers();
                    const power = powers.find(p => p.id === powerId);
                    if (power) {
                        addPower({ ...power });
                        closePowerModal();
                    }
                }
            });
            powerModalListenerAdded = true;
        }
    }

    // Technique modal
    if (document.querySelector('#loadTechniqueModal .close-button')) {
        document.querySelector('#loadTechniqueModal .close-button').onclick = closeTechniqueModal;
    }
    if (!techniqueModalListenerAdded) {
        const techList = document.getElementById('savedTechniquesList');
        if (techList) {
            techList.addEventListener('click', async (e) => {
                if (e.target.classList.contains('select-technique-btn')) {
                    const techId = e.target.dataset.id;
                    const techniques = await fetchSavedTechniques();
                    const tech = techniques.find(t => t.id === techId);
                    if (tech) {
                        addTechnique({ ...tech });
                        closeTechniqueModal();
                    }
                }
            });
            techniqueModalListenerAdded = true;
        }
    }

    // Armament modal
    if (document.querySelector('#loadArmamentModal .close-button')) {
        document.querySelector('#loadArmamentModal .close-button').onclick = closeArmamentModal;
    }
    if (!armamentModalListenerAdded) {
        const armamentList = document.getElementById('savedArmamentsList');
        if (armamentList) {
            armamentList.addEventListener('click', async (e) => {
                if (e.target.classList.contains('select-armament-btn')) {
                    const armamentId = e.target.dataset.id;
                    const items = await fetchSavedArmaments();
                    const item = items.find(i => i.id === armamentId);
                    if (item) {
                        addArmament({ ...item });
                        closeArmamentModal();
                    }
                }
            });
            armamentModalListenerAdded = true;
        }
    }
}
