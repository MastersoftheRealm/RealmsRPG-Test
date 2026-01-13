/**
 * Equipment Modal
 * Handles adding general equipment from the RTDatabase codex
 */

import { 
    openResourceModal, 
    closeResourceModal, 
    getCharacterData, 
    refreshLibraryAfterChange,
    getWithRetry,
    applySort,
    initFirebase
} from './modal-core.js';

// --- Mini-codex equipment state ---
let allEquipment = [];
let filteredEquipment = [];
let equipmentSortState = { col: 'name', dir: 1 };
let equipmentLoaded = false;
let selectedCategory = '';
let selectedRarity = '';

/**
 * Show the equipment modal for adding general items
 */
export async function showEquipmentModal() {
    await initFirebase();
    openResourceModal();
    
    const title = document.getElementById('resource-modal-title');
    if (title) title.textContent = 'Add Equipment';
    
    const body = document.getElementById('resource-modal-body');
    if (!body) return;
    body.innerHTML = '<div class="modal-loading">Loading equipment...</div>';
    
    if (!equipmentLoaded) {
        try {
            const snap = await getWithRetry('items');
            const data = snap.val();
            allEquipment = Object.values(data).map(e => ({
                ...e,
                currency: parseInt(e.currency) || 0,
            }));
            equipmentLoaded = true;
        } catch (e) {
            body.innerHTML = `<div class="modal-error">Error loading equipment.<br>${e.message || e}</div>`;
            return;
        }
    }
    
    renderEquipmentModal(body);
}

function renderEquipmentModal(container) {
    const categories = Array.from(new Set(allEquipment.map(e => e.category).filter(Boolean))).sort();
    const rarities = Array.from(new Set(allEquipment.map(e => e.rarity).filter(Boolean))).sort();

    container.innerHTML = `
        <div class="modal-filters">
            <input id="modal-equip-search" type="text" class="modal-search" placeholder="Search equipment...">
            <select id="modal-equip-category" class="modal-select">
                <option value="">All Categories</option>
                ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
            <select id="modal-equip-rarity" class="modal-select">
                <option value="">All Rarities</option>
                ${rarities.map(r => `<option value="${r}">${r}</option>`).join('')}
            </select>
        </div>
        <div class="modal-table-container">
            <table class="modal-table">
                <thead>
                    <tr>
                        <th data-col="name" class="sortable">Name</th>
                        <th data-col="description" class="sortable">Description</th>
                        <th data-col="category" class="sortable">Category</th>
                        <th data-col="currency" class="sortable">Currency</th>
                        <th data-col="rarity" class="sortable">Rarity</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody id="modal-equip-tbody"></tbody>
            </table>
        </div>
    `;
    
    // Attach event listeners
    document.getElementById('modal-equip-search').addEventListener('input', applyEquipmentFilters);
    document.getElementById('modal-equip-category').addEventListener('change', e => {
        selectedCategory = e.target.value;
        applyEquipmentFilters();
    });
    document.getElementById('modal-equip-rarity').addEventListener('change', e => {
        selectedRarity = e.target.value;
        applyEquipmentFilters();
    });
    container.querySelectorAll('.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const col = th.getAttribute('data-col');
            if (equipmentSortState.col === col) {
                equipmentSortState.dir *= -1;
            } else {
                equipmentSortState.col = col;
                equipmentSortState.dir = 1;
            }
            applyEquipmentFilters();
        });
    });
    
    applyEquipmentFilters();
}

function applyEquipmentFilters() {
    const search = document.getElementById('modal-equip-search')?.value?.toLowerCase() || '';
    
    filteredEquipment = allEquipment.filter(e => {
        if (search && !e.name.toLowerCase().includes(search) && !(e.description && e.description.toLowerCase().includes(search))) return false;
        if (selectedCategory && e.category !== selectedCategory) return false;
        if (selectedRarity && e.rarity !== selectedRarity) return false;
        return true;
    });
    
    applySort(filteredEquipment, equipmentSortState, equipmentSortState.col);
    renderEquipmentTable();
}

function renderEquipmentTable() {
    const tbody = document.getElementById('modal-equip-tbody');
    if (!tbody) return;
    
    if (filteredEquipment.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="modal-empty">No equipment matches your filters.</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredEquipment.map(e => `
        <tr>
            <td><strong>${e.name}</strong></td>
            <td class="truncated">${e.description ? e.description.substring(0, 80) + (e.description.length > 80 ? '...' : '') : ''}</td>
            <td>${e.category || ''}</td>
            <td>${e.currency || ''}</td>
            <td>${e.rarity || ''}</td>
            <td><button class="modal-add-btn" onclick="window.addEquipmentToCharacter('${encodeURIComponent(e.name)}')">Add</button></td>
        </tr>
    `).join('');
}

/**
 * Add equipment to character
 */
window.addEquipmentToCharacter = function(encodedName) {
    const name = decodeURIComponent(encodedName);
    const charData = getCharacterData();
    if (!charData) {
        alert('Character data not loaded.');
        return;
    }
    
    if (!Array.isArray(charData.equipment)) charData.equipment = [];
    
    // Check if already present (by name)
    const idx = charData.equipment.findIndex(e => {
        if (typeof e === 'string') return e === name;
        if (e && typeof e === 'object' && e.name) return e.name === name;
        return false;
    });
    
    if (idx !== -1) {
        // Increment quantity
        if (typeof charData.equipment[idx] === 'object' && charData.equipment[idx] !== null) {
            charData.equipment[idx].quantity = (charData.equipment[idx].quantity || 1) + 1;
        } else {
            charData.equipment[idx] = { name, quantity: 2 };
        }
    } else {
        charData.equipment.push({ name, quantity: 1 });
    }
    
    if (window.scheduleAutoSave) window.scheduleAutoSave();
    refreshLibraryAfterChange(charData, 'inventory');
    closeResourceModal();
    if (typeof window.showNotification === 'function') window.showNotification(`Added "${name}" to equipment.`, 'success');
};

// Export to window
window.showEquipmentModal = showEquipmentModal;
