import { initializeFirebase } from '/js/core/auth.js'; // Use correct path for your project
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-functions.js";
import { getFirestore, getDocs, collection, query, where, doc, setDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";
import { calculateItemCosts } from '/js/calculators/item-calc.js';
import { 
    buildMechanicPartPayload,
    calculateTechniqueCosts,
    computeSplits,
    computeAdditionalDamageLevel,
    computeActionTypeFromSelection,
    formatTechniqueDamage
} from '/js/calculators/technique-calc.js';
import { fetchTechniqueParts, fetchItemProperties } from '/js/core/rtdb-cache.js';

// Import shared utilities
import { sanitizeId, capitalize } from '/js/shared/string-utils.js';
import { PART_IDS, findByIdOrName } from '/js/shared/id-constants.js';

// Store Firebase objects after initialization
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;
let firebaseFunctions = null;
let selectedWeapon = { name: "Unarmed Prowess", tp: 0, id: null };
let weaponLibrary = [];
let techniqueParts = []; // Initialize as empty array - will be populated from database

(() => {
    const selectedTechniqueParts = [];
    let tpSources = []; // New global array to track TP sources

    /**
     * Find a part by ID or name (for backwards compatibility).
     * @param {number} partId - The part ID constant from PART_IDS
     * @param {string} fallbackName - Fallback name for old data
     * @param {boolean} [requireMechanic=false] - If true, only match mechanic parts
     * @returns {Object|undefined} The found part or undefined
     */
    function findPartById(partId, fallbackName, requireMechanic = false) {
        let part = techniqueParts.find(p => p.id === partId && (!requireMechanic || p.mechanic));
        if (!part && fallbackName) {
            part = techniqueParts.find(p => p.name === fallbackName && (!requireMechanic || p.mechanic));
        }
        return part;
    }

    function addTechniquePart() {
        // Add the first available part of any type (base, increase, decrease), excluding mechanic parts
        const allParts = techniqueParts.filter(p => !p.mechanic);
        if (allParts.length === 0) return;
        selectedTechniqueParts.push({ part: allParts[0], op_1_lvl: 0, op_2_lvl: 0, op_3_lvl: 0, useAltCost: false });

        renderTechniqueParts();
        updateTotalCosts();
    }

    function generatePartContent(partIndex, part) {
        const hasOption1 =
            (part.op_1_desc && part.op_1_desc.trim() !== '') ||
            (part.op_1_en && part.op_1_en !== 0) ||
            (part.op_1_tp && part.op_1_tp !== 0);

        return `
            <h3>${part.name} <span class="small-text">Energy: <span id="baseEnergy-${partIndex}">${part.base_en}</span></span> <span class="small-text">Training Points: <span id="baseTP-${partIndex}">${part.base_tp}</span></span></h3>
            <p>Part EN: <span id="totalEnergy-${partIndex}">${part.base_en}</span> Part TP: <span id="totalTP-${partIndex}">${part.base_tp}</span></p>
            <p>${part.description}</p>
            
            ${hasOption1 ? `
            <div class="option-container">
                ${hasOption1 ? `
                <div class="option-box">
                    <h4>Energy: ${part.op_1_en >= 0 ? '+' : ''}${part.op_1_en}     Training Points: ${part.op_1_tp >= 0 ? '+' : ''}${part.op_1_tp}</h4>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt1', 1)">+</button>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt1', -1)">-</button>
                    <span>Level: <span id="op_1_lvl-${partIndex}">${selectedTechniqueParts[partIndex].op_1_lvl}</span></span>
                    <p>${part.op_1_desc}</p>
                </div>` : ''}
                
                ${part.op_2_desc ? `
                <div class="option-box">
                    <h4>Energy: ${part.op_2_en >= 0 ? '+' : ''}${part.op_2_en}     Training Points: ${part.op_2_tp >= 0 ? '+' : ''}${part.op_2_tp}</h4>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt2', 1)">+</button>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt2', -1)">-</button>
                    <span>Level: <span id="op_2_lvl-${partIndex}">${selectedTechniqueParts[partIndex].op_2_lvl}</span></span>
                    <p>${part.op_2_desc}</p>
                </div>` : ''}

                ${part.op_3_desc ? `
                <div class="option-box">
                    <h4>Energy: ${part.op_3_en >= 0 ? '+' : ''}${part.op_3_en}     Training Points: ${part.op_3_tp >= 0 ? '+' : ''}${part.op_3_tp}</h4>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt3', 1)">+</button>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt3', -1)">-</button>
                    <span>Level: <span id="op_3_lvl-${partIndex}">${selectedTechniqueParts[partIndex].op_3_lvl}</span></span>
                    <p>${part.op_3_desc}</p>
                </div>` : ''}
            </div>` : ''}

            ${part.alt_base_en ? `
            <div class="option-box">
                <h4>Alternate Base Energy: ${part.alt_base_en}</h4>
                <button id="altEnergyButton-${partIndex}" class="alt-energy-button" onclick="toggleAltEnergy(${partIndex})">Toggle</button>
                <p>${part.alt_desc}</p>
            </div>` : ''}
        `;
    }

    function updateSelectedPart(index, selectedValue) {
        const selectedPart = techniqueParts[selectedValue];
        selectedTechniqueParts[index].part = selectedPart;
        selectedTechniqueParts[index].op_1_lvl = 0;
        selectedTechniqueParts[index].op_2_lvl = 0;
        selectedTechniqueParts[index].op_3_lvl = 0;
        selectedTechniqueParts[index].useAltCost = false;

        // Preserve the selected category
        const selectedCategory = selectedTechniqueParts[index].category || 'any';
        filterPartsByCategory(index, selectedCategory);

        renderTechniqueParts();
        updateTotalCosts();
    }

    function changeOptionLevel(index, option, delta) {
        const keyMap = { opt1: 'op_1_lvl', opt2: 'op_2_lvl', opt3: 'op_3_lvl' };
        const levelKey = keyMap[option] || 'op_1_lvl';
        const partData = selectedTechniqueParts[index];
        if (!partData) return;
        partData[levelKey] = Math.max(0, (partData[levelKey] || 0) + delta);
        renderTechniqueParts();
        updateTotalCosts();
    }

    function toggleAltEnergy(partIndex) {
        const partData = selectedTechniqueParts[partIndex];
        partData.useAltCost = !partData.useAltCost;

        renderTechniqueParts();
        updateTotalCosts();
    }

    function updateActionType() {
        const actionType = document.getElementById('actionType').value;
        const reactionChecked = document.getElementById('reactionCheckbox').checked;
        const descElement = document.getElementById('actionTypeDescription');
        
        let descriptions = [];
        
        // Add action type description
        if (actionType === 'quick') {
            const quickFreePart = findPartById(PART_IDS.QUICK_OR_FREE_ACTION, 'Quick or Free Action', true);
            if (quickFreePart && quickFreePart.description) {
                descriptions.push(quickFreePart.description);
            }
        } else if (actionType === 'free') {
            const quickFreePart = findPartById(PART_IDS.QUICK_OR_FREE_ACTION, 'Quick or Free Action', true);
            if (quickFreePart && quickFreePart.op_1_desc) {
                descriptions.push(quickFreePart.op_1_desc);
            }
        } else if (actionType === 'long3') {
            const longPart = findPartById(PART_IDS.LONG_ACTION, 'Long Action', true);
            if (longPart && longPart.description) {
                descriptions.push(longPart.description);
            }
        } else if (actionType === 'long4') {
            const longPart = findPartById(PART_IDS.LONG_ACTION, 'Long Action', true);
            if (longPart && longPart.op_1_desc) {
                descriptions.push(longPart.op_1_desc);
            }
        }
        
        // Add reaction description if checked
        if (reactionChecked) {
            const reactionPart = findPartById(PART_IDS.REACTION, 'Reaction', true);
            if (reactionPart && reactionPart.description) {
                descriptions.push(reactionPart.description);
            }
        }
        
        // Set combined description
        if (descElement) {
            descElement.textContent = descriptions.join(' ');
        }
        
        updateTotalCosts();
    }

    function updateDamageType() {
        updateTotalCosts();
    }

    function updateTotalCosts() {
        const userPartsPayload = selectedTechniqueParts.map(p => ({
            name: p.part.name,
            op_1_lvl: p.op_1_lvl || 0,
            op_2_lvl: p.op_2_lvl || 0,
            op_3_lvl: p.op_3_lvl || 0
        }));

        // Read current UI selections
        const actionTypeSel = document.getElementById('actionType').value;
        const reactionFlag = document.getElementById('reactionCheckbox').checked;
        const dieAmount1 = parseInt(document.getElementById('dieAmount1').value, 10) || 0;
        const dieSize1 = parseInt(document.getElementById('dieSize1').value, 10) || 0;
        const weaponTP = selectedWeapon?.tp || 0;

        // Build mechanic parts via centralized helper
        const mechanicParts = buildMechanicPartPayload({
            actionTypeSelection: actionTypeSel,
            reaction: reactionFlag,
            weaponTP,
            diceAmt: dieAmount1,
            dieSize: dieSize1,
            partsDb: techniqueParts
        });

        // Combined payload
        const allPartsPayload = [...userPartsPayload, ...mechanicParts];

        // Calculate totals (NOW capturing energyRaw)
        const { totalEnergy, totalTP, tpSources: newTPSources, energyRaw } = calculateTechniqueCosts(allPartsPayload, techniqueParts);
        tpSources = newTPSources;

        // Display decimal energy (one decimal, rounded UP) in the creator UI
        const displayEnergy = Math.ceil(energyRaw * 10) / 10;
        document.getElementById("totalEnergy").textContent = displayEnergy.toFixed(1);
        document.getElementById("totalTP").textContent = totalTP;
    
        updateTechniqueSummary();
    }

    function updateTechniqueSummary() {
        const actionTypeSel = document.getElementById('actionType').value;
        const reactionChecked = document.getElementById('reactionCheckbox').checked;
        const dieAmount1 = parseInt(document.getElementById('dieAmount1').value, 10);
        const dieSize1 = parseInt(document.getElementById('dieSize1').value, 10);
        document.getElementById('summaryActionType').textContent =
            computeActionTypeFromSelection(actionTypeSel, reactionChecked);

        let damageText = '';
        if (!isNaN(dieAmount1) && !isNaN(dieSize1) && dieAmount1 > 0 && dieSize1 > 0) {
            damageText = `Increased Damage: ${formatTechniqueDamage({ amount: dieAmount1, size: dieSize1 })}`;
        }
        document.getElementById('summaryDamage').textContent = damageText;
        document.getElementById('summaryDamage').style.display = damageText ? 'block' : 'none';

        // Update the summary parts
        const summaryPartsContainer = document.getElementById('summaryParts');
        summaryPartsContainer.innerHTML = '';
        selectedTechniqueParts.forEach((partData) => {
            const part = partData.part;
            const partElement = document.createElement('div');
            partElement.innerHTML = `
                <h4>${part.name}</h4>
                <p>Energy: ${part.base_en}</p>
                <p>Training Points: ${part.base_tp}</p>
                <p>${part.description}</p>
                ${part.op_1_desc ? `<p>Option 1: ${part.op_1_desc} (Level: ${partData.op_1_lvl || 0})</p>` : ''}
                ${part.op_2_desc ? `<p>Option 2: ${part.op_2_desc} (Level: ${partData.op_2_lvl || 0})</p>` : ''}
                ${part.op_3_desc ? `<p>Option 3: ${part.op_3_desc} (Level: ${partData.op_3_lvl || 0})</p>` : ''}
                ${part.alt_desc ? `<p>Alternate Energy: ${part.alt_desc}</p>` : ''}
            `;
            summaryPartsContainer.appendChild(partElement);
        });

        // Show selected weapon in summary
        let weaponSummary = document.getElementById('summaryWeapon');
        if (!weaponSummary) {
            // Add if not present
            const summaryTop = document.querySelector('.technique-summary-top');
            weaponSummary = document.createElement('p');
            weaponSummary.id = 'summaryWeapon';
            summaryTop.insertBefore(weaponSummary, summaryTop.querySelector('p'));
        }
        weaponSummary.innerHTML = `Weapon: <span>${selectedWeapon ? selectedWeapon.name : "Unarmed Prowess"}</span>`;

        // Update the summary proficiencies
        const summaryProficiencies = document.getElementById('summaryProficiencies');
        summaryProficiencies.innerHTML = tpSources.map(source => `<p>${source}</p>`).join('');
    }

    function toggleTotalCosts() {
        const totalCosts = document.getElementById('totalCosts');
        totalCosts.classList.toggle('collapsed');
        const arrow = document.querySelector('#totalCosts .toggle-arrow');
        arrow.textContent = totalCosts.classList.contains('collapsed') ? '>' : '<';
    }

    // Consolidate all event listeners into one function
    function initializeEventListeners() {
        document.getElementById("addTechniquePartButton").addEventListener("click", addTechniquePart);
        document.getElementById('dieAmount1').addEventListener('input', updateTotalCosts);
        document.getElementById('dieSize1').addEventListener('change', updateTotalCosts);

        const totalCostsArrow = document.querySelector('#totalCosts .toggle-arrow');
        if (totalCostsArrow) totalCostsArrow.addEventListener('click', toggleTotalCosts);

        // Modal load/save logic
        const loadTechniqueButton = document.getElementById('loadTechniqueButton');
        const closeButton = document.querySelector('.close-button');
        loadTechniqueButton.addEventListener('click', () => {
            const user = firebaseAuth.currentUser;
            if (user) {
                loadSavedTechniques(firebaseDb, user.uid);
                openModal();
            } else {
                alert('Please login to load saved techniques.');
            }
        });
        // Guard in case the close button is not present yet
        if (closeButton) closeButton.addEventListener('click', closeModal);
        window.addEventListener('click', (event) => {
            if (event.target === document.getElementById('loadTechniqueModal')) {
                closeModal();
            }
        });

        // Save button logic (update on auth state)
        const saveTechniqueButton = document.getElementById('saveTechniqueButton');
        onAuthStateChanged(firebaseAuth, (user) => {
            // Remove previous listeners to avoid stacking
            const newBtn = saveTechniqueButton.cloneNode(true);
            saveTechniqueButton.parentNode.replaceChild(newBtn, saveTechniqueButton);
            if (user) {
                newBtn.textContent = 'Save Technique';
                newBtn.addEventListener('click', () => saveTechniqueToLibrary(firebaseFunctions, user.uid));
            } else {
                newBtn.textContent = 'Login to Save Techniques';
                newBtn.addEventListener('click', () => {
                    window.location.href = '/pages/login.html';
                });
            }
        });

        document.getElementById('techniqueWeaponSelect').addEventListener('change', onTechniqueWeaponChange);
    }

    // Single DOMContentLoaded for all initialization
    document.addEventListener("DOMContentLoaded", async () => {
        // Initialize Firebase once
        const { app, auth, db, functions } = await initializeFirebase();
        firebaseApp = app;
        firebaseAuth = auth;
        firebaseDb = db;
        firebaseFunctions = functions;

        // Fetch technique parts from shared RTDB cache
        techniqueParts = await fetchTechniqueParts(getDatabase(app));
        
        if (!techniqueParts || techniqueParts.length === 0) {
            alert('Failed to load technique parts. Please refresh the page.');
        }

        // Set up event listeners
        initializeEventListeners();

        // Load weapon library for authenticated users
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                await loadWeaponLibrary();
            }
        });

        updateWeaponBoxUI();
    });

    function renderTechniqueParts() {
        const techniquePartsContainer = document.getElementById("techniquePartsContainer");
        techniquePartsContainer.innerHTML = "";

        selectedTechniqueParts.forEach((partData, partIndex) => {
            // Prevent error if partData or partData.part is undefined
            if (!partData || !partData.part) return;

            const techniquePartSection = document.createElement("div");
            techniquePartSection.id = `techniquePart-${partIndex}`;
            techniquePartSection.classList.add("technique-part-section");

            let filteredParts = techniqueParts.filter(p => !p.mechanic); // Exclude mechanic parts
            const selectedCategory = partData.category || 'any';
            if (selectedCategory !== 'any') {
                filteredParts = filteredParts.filter(part => part.category === selectedCategory);
            }

            filteredParts.sort((a, b) => a.name.localeCompare(b.name));

            const categories = [...new Set(techniqueParts.map(part => part.category))].sort();
            const categoryOptions = categories.map(category => `<option value="${category}" ${selectedCategory === category ? 'selected' : ''}>${category}</option>`).join('');

            techniquePartSection.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <select onchange="updateSelectedPart(${partIndex}, this.value)">
                        ${filteredParts.map(part => `<option value="${techniqueParts.indexOf(part)}" ${partData.part === part ? 'selected' : ''}>${part.name}</option>`).join('')}
                    </select>
                    <select id="categorySelect-${partIndex}" onchange="filterPartsByCategory(${partIndex}, this.value)">
                        <option value="any" ${selectedCategory === 'any' ? 'selected' : ''}>Any</option>
                        ${categoryOptions}
                    </select>
                </div>
                <div id="partContent-${partIndex}">
                    ${generatePartContent(partIndex, partData.part)}
                </div>
                <button class="delete-button" onclick="removeTechniquePart(${partIndex})">Delete</button>
            `;
            techniquePartsContainer.appendChild(techniquePartSection);
        });
    }

    function removeTechniquePart(index) {
        selectedTechniqueParts.splice(index, 1);
        renderTechniqueParts();
        updateTotalCosts();
    }

    // --- MISSING FUNCTION: filterPartsByCategory ---
    function filterPartsByCategory(partIndex, category) {
        selectedTechniqueParts[partIndex].category = category;

        let filteredParts = techniqueParts.slice(); // Start with all parts
        if (category !== 'any') {
            filteredParts = filteredParts.filter(part => part.category === category);
        }

        filteredParts.sort((a, b) => a.name.localeCompare(b.name));

        const selectElement = document.querySelector(`#techniquePart-${partIndex} select`);
        selectElement.innerHTML = filteredParts.map((part, index) => `<option value="${techniqueParts.indexOf(part)}" ${selectedTechniqueParts[partIndex].part === part ? 'selected' : ''}>${part.name}</option>`).join('');
    }

    // --- MISSING FUNCTION: updateWeaponBoxUI ---
    function updateWeaponBoxUI() {
        const infoDiv = document.getElementById('selectedWeaponInfo');
        if (!infoDiv) return;
        if (selectedWeapon && selectedWeapon.name !== "Unarmed Prowess") {
            infoDiv.innerHTML = `<b>${selectedWeapon.name}</b> (TP: ${selectedWeapon.tp})`;
        } else {
            infoDiv.innerHTML = `Unarmed Prowess (no additional cost)`;
        }
    }

    // --- MISSING FUNCTION: loadWeaponLibrary ---
    async function loadWeaponLibrary() {
        if (!firebaseAuth || !firebaseDb) return;
        const user = firebaseAuth.currentUser;
        if (!user) return;
        try {
            // Fetch properties data from shared RTDB cache
            const database = getDatabase(firebaseApp);
            const propertiesData = await fetchItemProperties(database);
            if (!propertiesData || propertiesData.length === 0) {
                console.error('Failed to load properties for weapon library');
                return;
            }

            const snapshot = await getDocs(collection(firebaseDb, 'users', user.uid, 'itemLibrary'));
            weaponLibrary = [];
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                // Filter for weapons by armamentType
                if (data.armamentType === 'Weapon') {
                    // Calculate total TP from properties
                    const costs = calculateItemCosts(data.properties || [], propertiesData);
                    weaponLibrary.push({
                        id: docSnap.id,
                        name: data.name,
                        totalTP: costs.totalTP || 0
                    });
                }
            });
            await populateWeaponSelect();
        } catch (e) {
            console.error('Error loading weapon library:', e);
            alert('Error loading weapon library');
        }
    }

    // --- MISSING FUNCTION: populateWeaponSelect ---
    async function populateWeaponSelect() {
        const select = document.getElementById('techniqueWeaponSelect');
        if (!select) return;
        while (select.options.length > 1) select.remove(1);
        weaponLibrary.forEach(weapon => {
            const opt = document.createElement('option');
            opt.value = weapon.id;
            opt.textContent = weapon.name;
            select.appendChild(opt);
        });
    }

    // --- MISSING FUNCTION: openWeaponLibraryModal ---
    function openWeaponLibraryModal() {
        const modal = document.getElementById('weaponLibraryModal');
        if (modal) {
            modal.style.display = 'block';
            renderWeaponLibraryList();
        }
    }

    // --- MISSING FUNCTION: closeWeaponLibraryModal ---
    function closeWeaponLibraryModal() {
        const modal = document.getElementById('weaponLibraryModal');
        if (modal) modal.style.display = 'none';
    }

    // --- MISSING FUNCTION: renderWeaponLibraryList ---
    function renderWeaponLibraryList() {
        const list = document.getElementById('weaponLibraryList');
        if (!list) return;
        list.innerHTML = '';
        weaponLibrary.forEach(weapon => {
            const li = document.createElement('li');
            li.innerHTML = `<b>${weapon.name}</b> (TP: ${weapon.totalTP}) <button onclick="selectWeaponFromLibrary('${weapon.id}')">Select</button>`;
            list.appendChild(li);
        });
    }

    // --- MISSING FUNCTION: onTechniqueWeaponChange ---
    function onTechniqueWeaponChange() {
        const select = document.getElementById('techniqueWeaponSelect');
        const value = select.value;
        if (value === "unarmed") {
            selectedWeapon = { name: "Unarmed Prowess", tp: 0, id: null };
        } else {
            const weapon = weaponLibrary.find(w => w.id === value);
            if (weapon) {
                selectedWeapon = { name: weapon.name, tp: Number(weapon.totalTP) || 0, id: weapon.id };
            }
        }
        updateWeaponBoxUI();
        updateTotalCosts();
    }

    // Replace old buildMechanicPartsForSave with centralized version
    function buildMechanicPartsForSave() {
        const actionTypeSel = document.getElementById('actionType')?.value;
        const reactionFlag = document.getElementById('reactionCheckbox')?.checked;
        const dieAmount1 = parseInt(document.getElementById('dieAmount1')?.value, 10) || 0;
        const dieSize1  = parseInt(document.getElementById('dieSize1')?.value, 10) || 0;
        const weaponTP  = selectedWeapon?.tp || 0;

        return buildMechanicPartPayload({
            actionTypeSelection: actionTypeSel,
            reaction: reactionFlag,
            weaponTP,
            diceAmt: dieAmount1,
            dieSize: dieSize1,
            partsDb: techniqueParts
        }).map(p => ({
            id: p.id,
            name: p.name,
            op_1_lvl: p.op_1_lvl || 0,
            op_2_lvl: p.op_2_lvl || 0,
            op_3_lvl: p.op_3_lvl || 0
        }));
    }

    // UPDATED: Save Technique (minimal fields per new requirements)
    async function saveTechniqueToLibrary(functions, userId) {
        const techniqueName = document.getElementById('techniqueName').value?.trim();
        if (!techniqueName) {
            alert('Please enter a technique name');
            return;
        }
        const techniqueDescription = document.getElementById('techniqueDescription').value || '';

        const dieAmount1 = document.getElementById('dieAmount1')?.value || '';
        const dieSize1 = document.getElementById('dieSize1')?.value || '';
        const damage = (dieAmount1 && dieSize1) ? { amount: dieAmount1, size: dieSize1 } : { amount: '0', size: '0' };

        // Mechanic parts already flattened
        const mechanicParts = buildMechanicPartsForSave();

        // Flatten user-selected parts (skip any missing .part)
        const userPartsPayload = selectedTechniqueParts
            .filter(p => p && p.part)
            .map(p => ({
                id: p.part.id,
                name: p.part.name,
                op_1_lvl: p.op_1_lvl || 0,
                op_2_lvl: p.op_2_lvl || 0,
                op_3_lvl: p.op_3_lvl || 0
            }));

        // Unified payload
        const partsPayload = [...userPartsPayload, ...mechanicParts];

        if (partsPayload.length === 0) {
            console.warn('Saving technique with no parts (allowed, but check if intentional).');
        }

        const weaponPayload = (selectedWeapon && selectedWeapon.name && selectedWeapon.name !== 'Unarmed Prowess')
            ? { name: selectedWeapon.name }
            : { name: 'Unarmed Prowess' };

        try {
            if (!firebaseAuth.currentUser) {
                alert('Please login to save techniques');
                return;
            }
            await firebaseAuth.currentUser.getIdToken(true);
            const db = firebaseDb;
            const techniquesRef = collection(db, 'users', userId, 'techniqueLibrary');
            const q = query(techniquesRef, where('name', '==', techniqueName));
            const querySnapshot = await getDocs(q);

            let docRef;
            if (!querySnapshot.empty) {
                docRef = doc(db, 'users', userId, 'techniqueLibrary', querySnapshot.docs[0].id);
            } else {
                docRef = doc(techniquesRef);
            }

            await setDoc(docRef, {
                name: techniqueName,
                description: techniqueDescription,
                parts: partsPayload,
                weapon: weaponPayload,
                damage,
                timestamp: new Date()
            });

            console.log(`Saved technique '${techniqueName}' with ${partsPayload.length} parts (user:${userPartsPayload.length} mechanic:${mechanicParts.length})`);
            alert('Technique saved (minimal format)');
        } catch (e) {
            console.error('Error saving technique (minimal):', e);
            alert('Error saving technique.');
        }
    }

    // UPDATED: Load Technique (supports new minimal shape & old shape)
    function loadTechnique(technique) {
        // Name / Description
        document.getElementById('techniqueName').value = technique.name || '';
        document.getElementById('techniqueDescription').value = technique.description || '';

        // Damage (handle new object or legacy array)
        let dmgObj = null;
        if (technique.damage) {
            if (Array.isArray(technique.damage)) {
                // legacy: first element
                dmgObj = technique.damage[0] || null;
            } else {
                dmgObj = technique.damage;
            }
        }
        if (dmgObj) {
            document.getElementById('dieAmount1').value = dmgObj.amount || '';
            document.getElementById('dieSize1').value = dmgObj.size || '';
        } else {
            document.getElementById('dieAmount1').value = '';
            document.getElementById('dieSize1').value = '';
        }

        // Parts (new key: parts; fallback to legacy techniqueParts)
        const savedParts = technique.parts || technique.techniqueParts || [];
        selectedTechniqueParts.length = 0;
        savedParts.forEach(p => {
            const partObj = findByIdOrName(techniqueParts, p);
            if (partObj && !partObj.mechanic) {
                selectedTechniqueParts.push({
                    part: partObj,
                    op_1_lvl: p.op_1_lvl || 0,
                    op_2_lvl: p.op_2_lvl || 0,
                    op_3_lvl: p.op_3_lvl || 0,
                    useAltCost: false
                });
            }
        });

        // Weapon (only name stored now)
        if (technique.weapon && technique.weapon.name) {
            selectedWeapon = {
                name: technique.weapon.name,
                tp: 0,
                id: null
            };
            const sel = document.getElementById('techniqueWeaponSelect');
            if (sel) sel.value = (selectedWeapon.name === 'Unarmed Prowess') ? 'unarmed' : '';
        } else {
            selectedWeapon = { name: 'Unarmed Prowess', tp: 0, id: null };
            const sel = document.getElementById('techniqueWeaponSelect');
            if (sel) sel.value = 'unarmed';
        }

        renderTechniqueParts();
        updateWeaponBoxUI();
        updateTotalCosts(); // Recalculate energy & TP from current definitions
    }

    // Load saved techniques list into modal
    async function loadSavedTechniques(db, userId) {
        const savedTechniquesList = document.getElementById('savedTechniquesList');
        if (!savedTechniquesList) return;
        savedTechniquesList.innerHTML = '';

        try {
            const querySnapshot = await getDocs(collection(db, 'users', userId, 'techniqueLibrary'));
            querySnapshot.forEach((docSnapshot) => {
                const technique = docSnapshot.data();
                const listItem = document.createElement('li');
                listItem.textContent = technique.name;

                const loadButton = document.createElement('button');
                loadButton.textContent = 'Load';
                loadButton.addEventListener('click', () => {
                    loadTechnique(technique);
                    closeModal();
                });

                listItem.appendChild(loadButton);
                savedTechniquesList.appendChild(listItem);
            });
        } catch (e) {
            console.error('Error fetching saved techniques: ', e);
            alert('Error fetching saved techniques');
        }
    }

    // Simple modal helpers
    function openModal() {
        const modal = document.getElementById('loadTechniqueModal');
        if (modal) modal.style.display = 'block';
    }
    function closeModal() {
        const modal = document.getElementById('loadTechniqueModal');
        if (modal) modal.style.display = 'none';
    }

    // Expose functions to global scope for inline event handlers
    window.updateSelectedPart = updateSelectedPart;
    window.changeOptionLevel = changeOptionLevel;
    window.toggleAltEnergy = toggleAltEnergy;
    window.updateTotalCosts = updateTotalCosts;
    window.updateActionType = updateActionType;
    window.updateDamageType = updateDamageType;
    window.filterPartsByCategory = filterPartsByCategory;
    window.toggleTotalCosts = toggleTotalCosts;
    window.loadSavedTechniques = loadSavedTechniques;
    window.loadTechnique = loadTechnique;
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.removeTechniquePart = removeTechniquePart;
    window.openWeaponLibraryModal = openWeaponLibraryModal;
    window.closeWeaponLibraryModal = closeWeaponLibraryModal;
    window.selectWeaponFromLibrary = function(id) {
        const weapon = weaponLibrary.find(w => w.id === id);
        if (weapon) {
            selectedWeapon = { name: weapon.name, tp: Number(weapon.totalTP) || 0, id: weapon.id };
            const select = document.getElementById('techniqueWeaponSelect');
            if (select) select.value = id;
            updateWeaponBoxUI();
            updateTotalCosts();
            closeWeaponLibraryModal();
        }
    };
    window.onTechniqueWeaponChange = onTechniqueWeaponChange;
    window.saveTechniqueToLibrary = saveTechniqueToLibrary;
    window.computeSplits = computeSplits;
})();
