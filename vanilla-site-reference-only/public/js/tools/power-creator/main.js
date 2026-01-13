import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-functions.js";
import { getFirestore, getDocs, collection, query, where, doc, setDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";
import { calculatePowerCosts, computeActionTypeFromSelection, deriveRange, deriveArea, deriveDuration } from '/js/calculators/power-calc.js';
import { fetchPowerParts } from '/js/core/rtdb-cache.js';

// Import shared utilities
import { capitalize } from '/js/shared/string-utils.js';
import { PART_IDS, findByIdOrName } from '/js/shared/id-constants.js';
import { initializeFirebase, auth as sharedAuth, db as sharedDb, rtdb as sharedRtdb, functions as sharedFunctions } from '/js/core/firebase-init.js';

(() => {
    // const powerParts = powerPartsData;
    let powerParts = [];
    let durationParts = {}; // kept but no longer used for multiplier logic

    const selectedPowerParts = [];
    let range = 0; // Internal default value
    let area = 1;
    let duration = 1;
    let areaEffectLevel = 1; // Initialize areaEffectLevel to 1
    let durationType = 'rounds'; // Default duration type
    let tpSources = []; // New global array to track TP sources

    // NEW: State for selected advanced mechanic parts
    const selectedAdvancedParts = [];

    /**
     * Find a part by ID or name (for backwards compatibility).
     * @param {number} partId - The part ID constant from PART_IDS
     * @param {string} fallbackName - Fallback name for old data
     * @param {boolean} [requireMechanic=false] - If true, only match mechanic parts
     * @returns {Object|undefined} The found part or undefined
     */
    function findPartByIdOrName(partId, fallbackName, requireMechanic = false) {
        let part = powerParts.find(p => p.id === partId && (!requireMechanic || p.mechanic || p.duration));
        if (!part && fallbackName) {
            part = powerParts.find(p => p.name === fallbackName && (!requireMechanic || p.mechanic || p.duration));
        }
        return part;
    }

    function addPowerPart() {
        if (powerParts.length === 0) return;
        const partIndex = selectedPowerParts.length;
        // Add selectedCategory: 'any' to each part
        selectedPowerParts.push({ part: powerParts[0], op_1_lvl: 0, op_2_lvl: 0, op_3_lvl: 0, applyDuration: false, selectedCategory: 'any' });
        renderPowerParts();
        updateTotalCosts();
    }

    // NEW: Handle category change for a part
    function updateSelectedCategory(index, category) {
        selectedPowerParts[index].selectedCategory = category;
        // If current part doesn't match, reset to first in filtered
        const filtered = getFilteredParts(category);
        if (!filtered.includes(selectedPowerParts[index].part)) {
            selectedPowerParts[index].part = filtered[0] || powerParts[0];
            selectedPowerParts[index].op_1_lvl = 0;
            selectedPowerParts[index].op_2_lvl = 0;
            selectedPowerParts[index].op_3_lvl = 0;
        }
        renderPowerParts();
        updateTotalCosts();
    }

    // Helper: get filtered parts by category
    function getFilteredParts(category) {
        if (!category || category === 'any') return [...powerParts].sort((a, b) => a.name.localeCompare(b.name));
        return powerParts.filter(p => p.category === category).sort((a, b) => a.name.localeCompare(b.name));
    }

    function generatePartContent(partIndex, part) {
		function hasOption(p, n) {
			const desc = p[`op_${n}_desc`];
			const en = p[`op_${n}_en`];
			const tp = p[`op_${n}_tp`];
			return (desc && String(desc).trim() !== '') || (en !== undefined && Number(en) !== 0) || (tp !== undefined && Number(tp) !== 0);
		}

		const anyOption = hasOption(part, 1) || hasOption(part, 2) || hasOption(part, 3);

		return `
            <h3>${part.name} <span class="small-text">Energy: <span id="baseEnergy-${partIndex}">${part.base_en}</span></span> <span class="small-text">Training Points: <span id="baseTP-${partIndex}">${part.base_tp}</span></span></h3>
            <p>Part EN: <span id="totalEnergy-${partIndex}">${part.base_en}</span> Part TP: <span id="totalTP-${partIndex}">${part.base_tp}</span></p>
            <p>${part.description}</p>
            
            ${anyOption ? `
            <div class="option-container">
                ${hasOption(part,1) ? `
                <div class="option-box">
                    <h4>Energy: ${part.op_1_en >= 0 ? '+' : ''}${part.op_1_en}     Training Points: ${part.op_1_tp >= 0 ? '+' : ''}${part.op_1_tp}</h4>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt1', 1)">+</button>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt1', -1)">-</button>
                    <span>Level: <span id="op_1_lvl-${partIndex}">${selectedPowerParts[partIndex].op_1_lvl}</span></span>
                    <p>${part.op_1_desc}</p>
                </div>` : ''}
                
                ${hasOption(part,2) ? `
                <div class="option-box">
                    <h4>Energy: ${part.op_2_en >= 0 ? '+' : ''}${part.op_2_en}     Training Points: ${part.op_2_tp >= 0 ? '+' : ''}${part.op_2_tp}</h4>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt2', 1)">+</button>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt2', -1)">-</button>
                    <span>Level: <span id="op_2_lvl-${partIndex}">${selectedPowerParts[partIndex].op_2_lvl}</span></span>
                    <p>${part.op_2_desc}</p>
                </div>` : ''}

                ${hasOption(part,3) ? `
                <div class="option-box">
                    <h4>Energy: ${part.op_3_en >= 0 ? '+' : ''}${part.op_3_en}     Training Points: ${part.op_3_tp >= 0 ? '+' : ''}${part.op_3_tp}</h4>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt3', 1)">+</button>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt3', -1)">-</button>
                    <span>Level: <span id="op_3_lvl-${partIndex}">${selectedPowerParts[partIndex].op_3_lvl}</span></span>
                    <p>${part.op_3_desc}</p>
                </div>` : ''}
            </div>` : ''}
            <!-- NEW: Apply Duration checkbox for each power part -->
            <label><input type="checkbox" id="applyDuration-${partIndex}" onclick="toggleApplyDuration(${partIndex})" ${selectedPowerParts[partIndex].applyDuration ? 'checked' : ''}> Apply Duration</label>
        `;
    }

    function updateSelectedPart(index, selectedValue) {
        // Use filtered list for this part's category
        const category = selectedPowerParts[index].selectedCategory || 'any';
        const filtered = getFilteredParts(category);
        const selectedPart = filtered[selectedValue] || filtered[0] || powerParts[0];
        selectedPowerParts[index].part = selectedPart;
        selectedPowerParts[index].op_1_lvl = 0;
        selectedPowerParts[index].op_2_lvl = 0;
        selectedPowerParts[index].op_3_lvl = 0;
        renderPowerParts();
        updateTotalCosts();
    }

    function toggleApplyDuration(index) {
        selectedPowerParts[index].applyDuration = !selectedPowerParts[index].applyDuration;
        updateTotalCosts();
    }

    function changeOptionLevel(index, option, delta) {
        const keyMap = { opt1: 'op_1_lvl', opt2: 'op_2_lvl', opt3: 'op_3_lvl' };
        const levelKey = keyMap[option] || 'op_1_lvl';
        const part = selectedPowerParts[index];
        part[levelKey] = Math.max(0, (part[levelKey] || 0) + delta);
        const el = document.getElementById(`${levelKey}-${index}`);
        if (el) el.textContent = part[levelKey];
        renderPowerParts();
        updateTotalCosts();
    }

    function changeRange(delta) {
        range = Math.max(0, range + delta);
        const displayRange = range === 0 ? 1 : range * 3;
        document.getElementById('rangeValue').textContent = displayRange;
        document.getElementById('rangeValue').nextSibling.textContent = displayRange > 1 ? ' spaces' : ' space';
        updateTotalCosts();
    }

    function changeArea(delta) {
        area = Math.max(1, area + delta);
        document.getElementById('areaValue').textContent = area;
        document.getElementById('areaValue').nextSibling.textContent = area > 1 ? ' spaces' : ' space';
        updateTotalCosts();
    }

    function changeDuration(delta) {
        const durationType = document.getElementById('durationType').value;
        const durationValues = {
            rounds: [1, 2, 3, 4, 5, 6],
            minutes: [1, 10, 30],
            hours: [1, 6, 12],
            days: [1, 10, 20, 30],
            permanent: [1]
        };

        const maxDuration = durationValues[durationType].length;
        duration = Math.max(1, Math.min(maxDuration, duration + delta));
        document.getElementById('durationValue').value = duration;

        updateTotalCosts();
    }

    function changeDurationType() {
        const durationType = document.getElementById('durationType').value;
        const durationValues = {
            rounds: [1, 2, 3, 4, 5, 6],
            minutes: [1, 10, 30],
            hours: [1, 6, 12],
            days: [1, 7, 14],
            permanent: [1]
        };

        const durationValueSelect = document.getElementById('durationValue');
        durationValueSelect.innerHTML = durationValues[durationType].map((value, index) => `<option value="${index + 1}">${value}</option>`).join('');
        durationValueSelect.disabled = durationType === 'permanent';

        // Reset duration to the first value of the new type
        duration = 1;
        durationValueSelect.value = duration;

        updateTotalCosts();
    }

    function removePowerPart(index) {
        selectedPowerParts.splice(index, 1);
        renderPowerParts();
        updateTotalCosts();
    }

    function updateAreaEffect() {
        const areaEffect = document.getElementById('areaEffect').value;
        const descElement = document.getElementById('areaEffectDescription');
        
        let partName = '';
        if (areaEffect === 'sphere') partName = 'Sphere of Effect';
        else if (areaEffect === 'cylinder') partName = 'Cylinder of Effect';
        else if (areaEffect === 'cone') partName = 'Cone of Effect';
        else if (areaEffect === 'line') partName = 'Line of Effect';
        
        if (partName) {
            const part = findPartByIdOrName(
                partName === 'Sphere of Effect' ? PART_IDS.SPHERE_OF_EFFECT :
                partName === 'Cylinder of Effect' ? PART_IDS.CYLINDER_OF_EFFECT :
                partName === 'Cone of Effect' ? PART_IDS.CONE_OF_EFFECT :
                PART_IDS.LINE_OF_EFFECT, 
                partName, true);
            if (part) {
                const opt1Level = areaEffectLevel - 1;
                descElement.textContent = part.description + (opt1Level > 0 ? ' ' + part.op_1_desc : '');
            } else {
                descElement.textContent = "Area of Effect is one target or one space.";
            }
        } else {
            descElement.textContent = "Area of Effect is one target or one space.";
        }
        
        updateTotalCosts();
    }

    function changeAreaEffectLevel(delta) {
        areaEffectLevel = Math.max(0, areaEffectLevel + delta);
        document.getElementById('areaEffectLevelValue').textContent = areaEffectLevel;
        updateTotalCosts();
    }

    function updateActionType() {
        const actionType = document.getElementById('actionType').value;
        const reactionChecked = document.getElementById('reactionCheckbox').checked;
        const descElement = document.getElementById('actionTypeDescription');
        
        let descriptions = [];
        
        // Add action type description
        if (actionType === 'quick') {
            const quickFreePart = findPartByIdOrName(PART_IDS.POWER_QUICK_OR_FREE_ACTION, 'Power Quick or Free Action', true);
            if (quickFreePart && quickFreePart.description) {
                descriptions.push(quickFreePart.description);
            }
        } else if (actionType === 'free') {
            const quickFreePart = findPartByIdOrName(PART_IDS.POWER_QUICK_OR_FREE_ACTION, 'Power Quick or Free Action', true);
            if (quickFreePart && quickFreePart.op_1_desc) {
                descriptions.push(quickFreePart.op_1_desc);
            }
        } else if (actionType === 'long3') {
            const longPart = findPartByIdOrName(PART_IDS.POWER_LONG_ACTION, 'Power Long Action', true);
            if (longPart && longPart.description) {
                descriptions.push(longPart.description);
            }
        } else if (actionType === 'long4') {
            const longPart = findPartByIdOrName(PART_IDS.POWER_LONG_ACTION, 'Power Long Action', true);
            if (longPart && longPart.op_1_desc) {
                descriptions.push(longPart.op_1_desc);
            }
        }
        
        // Add reaction description if checked
        if (reactionChecked) {
            const reactionPart = findPartByIdOrName(PART_IDS.POWER_REACTION, 'Power Reaction', true);
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
        // Build mechanic parts based on selections
        let mechanicParts = [];
        const actionType = document.getElementById('actionType').value;
        const reactionChecked = document.getElementById('reactionCheckbox').checked;

        // Helper to find a mechanic part by ID or name (for backwards compatibility)
        const getMechanicPart = (partId, name) => findPartByIdOrName(partId, name, true);

        if (reactionChecked) {
            const reactionPart = findPartByIdOrName(PART_IDS.POWER_REACTION, 'Power Reaction', true);
            if (reactionPart) {
                mechanicParts.push({ part: reactionPart, op_1_lvl: 0, op_2_lvl: 0, op_3_lvl: 0, applyDuration: false }); // Default unaffected
            }
        }
    
        if (actionType === 'quick') {
            const quickFreePart = findPartByIdOrName(PART_IDS.POWER_QUICK_OR_FREE_ACTION, 'Power Quick or Free Action', true);
            if (quickFreePart) {
                mechanicParts.push({ part: quickFreePart, op_1_lvl: 0, op_2_lvl: 0, op_3_lvl: 0, applyDuration: false }); // Default unaffected
            }
        } else if (actionType === 'free') {
            const quickFreePart = findPartByIdOrName(PART_IDS.POWER_QUICK_OR_FREE_ACTION, 'Power Quick or Free Action', true);
            if (quickFreePart) {
                mechanicParts.push({ part: quickFreePart, op_1_lvl: 1, op_2_lvl: 0, op_3_lvl: 0, applyDuration: false }); // Default unaffected
            }
        } else if (actionType === 'long3') {
            const longPart = findPartByIdOrName(PART_IDS.POWER_LONG_ACTION, 'Power Long Action', true);
            if (longPart) {
                mechanicParts.push({ part: longPart, op_1_lvl: 0, op_2_lvl: 0, op_3_lvl: 0, applyDuration: false }); // Default unaffected
            }
        } else if (actionType === 'long4') {
            const longPart = findPartByIdOrName(PART_IDS.POWER_LONG_ACTION, 'Power Long Action', true);
            if (longPart) {
                mechanicParts.push({ part: longPart, op_1_lvl: 1, op_2_lvl: 0, op_3_lvl: 0, applyDuration: false }); // Default unaffected
            }
        }
    
        // Area effect mechanic parts
        const areaEffect = document.getElementById('areaEffect').value;
        const areaEffectApplyDuration = document.getElementById('areaEffectApplyDuration').checked; // NEW
        let areaPartName = '';
        let areaPartId = null;
        if (areaEffect === 'sphere') { areaPartName = 'Sphere of Effect'; areaPartId = PART_IDS.SPHERE_OF_EFFECT; }
        else if (areaEffect === 'cylinder') { areaPartName = 'Cylinder of Effect'; areaPartId = PART_IDS.CYLINDER_OF_EFFECT; }
        else if (areaEffect === 'cone') { areaPartName = 'Cone of Effect'; areaPartId = PART_IDS.CONE_OF_EFFECT; }
        else if (areaEffect === 'line') { areaPartName = 'Line of Effect'; areaPartId = PART_IDS.LINE_OF_EFFECT; }
        else if (areaEffect === 'space') { areaPartName = 'Trail of Effect'; areaPartId = PART_IDS.TRAIL_OF_EFFECT; }
        
        if (areaPartName && areaPartId) {
            const areaPart = findPartByIdOrName(areaPartId, areaPartName, true);
            if (areaPart) {
                mechanicParts.push({ part: areaPart, op_1_lvl: areaEffectLevel - 1, op_2_lvl: 0, op_3_lvl: 0, applyDuration: areaEffectApplyDuration }); // Checkbox controls
            }
        }
    
        // Damage mechanic parts - now allow applyDuration for each damage row
        const addDamagePart = (damageType, dieAmount, dieSize, applyDuration) => {
            let partName = '';
            let partId = null;
            if (damageType === 'magic') { partName = 'Magic Damage'; partId = PART_IDS.MAGIC_DAMAGE; }
            else if (damageType === 'light') { partName = 'Light Damage'; partId = PART_IDS.LIGHT_DAMAGE; }
            else if (['fire', 'ice', 'acid', 'lightning'].includes(damageType)) { partName = 'Elemental Damage'; partId = PART_IDS.ELEMENTAL_DAMAGE; }
            else if (['poison', 'necrotic'].includes(damageType)) { partName = 'Poison or Necrotic Damage'; partId = PART_IDS.POISON_OR_NECROTIC_DAMAGE; }
            else if (damageType === 'sonic') { partName = 'Sonic Damage'; partId = PART_IDS.SONIC_DAMAGE; }
            else if (damageType === 'spiritual') { partName = 'Spiritual Damage'; partId = PART_IDS.SPIRITUAL_DAMAGE; }
            else if (damageType === 'psychic') { partName = 'Psychic Damage'; partId = PART_IDS.PSYCHIC_DAMAGE; }
            else if (['bludgeoning', 'piercing', 'slashing'].includes(damageType)) { partName = 'Physical Damage'; partId = PART_IDS.PHYSICAL_DAMAGE; }

            if (partName && partId) {
                const damagePart = findPartByIdOrName(partId, partName, true);
                if (damagePart) {
                    const totalDamage = dieAmount * dieSize;
                    const opt1Level = Math.floor((totalDamage - 4) / 2);
                    mechanicParts.push({ part: damagePart, op_1_lvl: Math.max(0, opt1Level), op_2_lvl: 0, op_3_lvl: 0, applyDuration: !!applyDuration });
                }
            }
        };

        // First damage row
        const dieAmount1 = parseInt(document.getElementById('dieAmount1').value, 10);
        const dieSize1 = parseInt(document.getElementById('dieSize1').value, 10);
        const damageType1 = document.getElementById('damageType1').value;
        const damageApplyDuration1 = document.getElementById('damageApplyDuration1')?.checked;
        if (!isNaN(dieAmount1) && !isNaN(dieSize1) && damageType1 !== "none") {
            addDamagePart(damageType1, dieAmount1, dieSize1, damageApplyDuration1);
        }

        // Second damage row
        const dieAmount2 = parseInt(document.getElementById('dieAmount2')?.value, 10);
        const dieSize2 = parseInt(document.getElementById('dieSize2')?.value, 10);
        const damageType2 = document.getElementById('damageType2')?.value;
        const damageApplyDuration2 = document.getElementById('damageApplyDuration2')?.checked;
        if (!isNaN(dieAmount2) && !isNaN(dieSize2) && damageType2 !== "none") {
            addDamagePart(damageType2, dieAmount2, dieSize2, damageApplyDuration2);
        }

        // Duration mechanic parts (from database)
        const focusChecked = document.getElementById('focusCheckbox').checked;
        const noHarmChecked = document.getElementById('noHarmCheckbox').checked;
        const endsOnceChecked = document.getElementById('endsOnceCheckbox').checked;
        const sustainValue = parseInt(document.getElementById('sustainValue').value, 10) || 0;

        const durationType = document.getElementById('durationType').value;
        const durationValue = parseInt(document.getElementById('durationValue').value, 10) || 1;
        const idx = durationValue - 1; // 0-based index of the selected entry

        // Add toggle-driven duration modifiers
        if (focusChecked) {
            const p = getMechanicPart('Focus for Duration');
            if (p) mechanicParts.push({ part: p, op_1_lvl: 0, op_2_lvl: 0, op_3_lvl: 0 });
        }
        if (noHarmChecked) {
            const p = getMechanicPart('No Harm or Adaptation for Duration');
            if (p) mechanicParts.push({ part: p, op_1_lvl: 0, op_2_lvl: 0, op_3_lvl: 0 });
        }
        if (endsOnceChecked) {
            const p = getMechanicPart('Duration Ends On Activation');
            if (p) mechanicParts.push({ part: p, op_1_lvl: 0, op_2_lvl: 0, op_3_lvl: 0 });
        }
        if (sustainValue > 0) {
            const p = getMechanicPart('Sustain for Duration');
            if (p) mechanicParts.push({ part: p, op_1_lvl: Math.max(0, sustainValue - 1), op_2_lvl: 0, op_3_lvl: 0 });
        }

        // Duration base type selection
        if (durationType === 'permanent') {
            const p = getMechanicPart('Duration (Permanent)');
            if (p) mechanicParts.push({ part: p, op_1_lvl: 0, op_2_lvl: 0, op_3_lvl: 0 });
        } else if (durationType === 'days') {
            const p = getMechanicPart('Duration (Days)');
            if (p) mechanicParts.push({ part: p, op_1_lvl: Math.max(0, idx), op_2_lvl: 0, op_3_lvl: 0 });
        } else if (durationType === 'hours') {
            const p = getMechanicPart('Duration (Hour)');
            if (p) mechanicParts.push({ part: p, op_1_lvl: Math.max(0, idx), op_2_lvl: 0, op_3_lvl: 0 });
        } else if (durationType === 'minutes') {
            const p = getMechanicPart('Duration (Minute)');
            if (p) mechanicParts.push({ part: p, op_1_lvl: Math.max(0, idx), op_2_lvl: 0, op_3_lvl: 0 });
        } else if (durationType === 'rounds') {
            // Only add when > 1 round. For 2 rounds (idx=1) => op1 = 0; 3 rounds (idx=2) => op1 = 1, etc.
            if (durationValue > 1) {
                const p = getMechanicPart('Duration (Round)');
                if (p) mechanicParts.push({ part: p, op_1_lvl: Math.max(0, idx - 1), op_2_lvl: 0, op_3_lvl: 0 });
            }
        }

        // NEW: Range as a mechanic part ("Power Range") - default unaffected
        const rangeSteps = range; // range 0 = melee; range 1+ = steps beyond melee
        if (rangeSteps > 0) {
            const rangePart = findPartByIdOrName(PART_IDS.POWER_RANGE, 'Power Range', true);
            if (rangePart) {
                mechanicParts.push({
                    part: rangePart,
                    op_1_lvl: Math.max(0, rangeSteps - 1),
                    op_2_lvl: 0,
                    op_3_lvl: 0,
                    applyDuration: false // Default unaffected
                });
            }
        }

        // Combine selected parts and mechanic parts
        const allParts = [...selectedPowerParts, ...mechanicParts, ...selectedAdvancedParts];
    
        // Use centralized calculator — include both id and name for reliable lookups
        const payloadForCalc = allParts.map(p => p.part ? ({
            id: p.part.id,
            name: p.part.name,
            op_1_lvl: p.op_1_lvl || 0,
            op_2_lvl: p.op_2_lvl || 0,
            op_3_lvl: p.op_3_lvl || 0,
            applyDuration: p.applyDuration || false
        }) : p);

        const { totalEnergy, totalTP, tpSources: newTPSources, energyRaw } = calculatePowerCosts(payloadForCalc, powerParts);
        tpSources = newTPSources;

        // Display energy rounded to the tenth (ceiling at one decimal place)
        const displayEnergy = Math.ceil(energyRaw * 10) / 10;
        document.getElementById("totalEnergy").textContent = displayEnergy.toFixed(1);
        document.getElementById("totalTP").textContent = totalTP;
    
        updatePowerSummary();
    }

    function updatePowerSummary() {
        const powerName = document.getElementById('powerName').value;
        const summaryEnergy = document.getElementById('totalEnergy').textContent;
        const summaryTP = document.getElementById('totalTP').textContent;
        const summaryRange = range === 0 ? 1 : range * 3;
        const summaryDuration = duration;
        const actionType = document.getElementById('actionType').value;
        const reactionChecked = document.getElementById('reactionCheckbox').checked;
        const actionTypeText = reactionChecked ? `${capitalize(actionType)} Reaction` : `${capitalize(actionType)} Action`;
        const focusChecked = document.getElementById('focusCheckbox').checked;
        const sustainValue = parseInt(document.getElementById('sustainValue').value, 10);
        const noHarmChecked = document.getElementById('noHarmCheckbox').checked;
        const endsOnceChecked = document.getElementById('endsOnceCheckbox').checked;

        document.getElementById('summaryEnergy').textContent = summaryEnergy;
        document.getElementById('summaryTP').textContent = summaryTP;
        document.getElementById('summaryRange').textContent = `${summaryRange} ${summaryRange > 1 ? 'Spaces' : 'Space'}`;
        document.getElementById('summaryDuration').textContent = `${summaryDuration} ${summaryDuration > 1 ? 'Rounds' : 'Round'}`;
        document.getElementById('summaryActionType').textContent = computeActionTypeFromSelection(actionType, reactionChecked);

        document.getElementById('summaryFocus').style.display = focusChecked ? 'block' : 'none';
        document.getElementById('summarySustain').style.display = sustainValue > 0 ? 'block' : 'none';
        document.getElementById('summarySustainValue').textContent = sustainValue;

        const dieAmount1 = parseInt(document.getElementById('dieAmount1').value, 10);
        const dieSize1 = parseInt(document.getElementById('dieSize1').value, 10);
        const damageType1 = document.getElementById('damageType1').value;
        const dieAmount2 = parseInt(document.getElementById('dieAmount2')?.value, 10);
        const dieSize2 = parseInt(document.getElementById('dieSize2')?.value, 10);
        const damageType2 = document.getElementById('damageType2')?.value;

        let damageText = '';
        if (!isNaN(dieAmount1) && !isNaN(dieSize1) && damageType1 !== 'none') {
            damageText += `${dieAmount1}d${dieSize1} ${damageType1}`;
        }
        if (!isNaN(dieAmount2) && !isNaN(dieSize2) && damageType2 !== 'none') {
            damageText += `, ${dieAmount2}d${dieSize2} ${damageType2}`;
        }
        document.getElementById('summaryDamage').textContent = damageText;
        document.getElementById('summaryDamage').style.display = damageText ? 'block' : 'none';

        // Update the summary parts
        const summaryPartsContainer = document.getElementById('summaryParts');
        summaryPartsContainer.innerHTML = '';
        selectedPowerParts.forEach((partData, partIndex) => {
            const part = partData.part;
            const partElement = document.createElement('div');
            partElement.innerHTML = `
                <h4>${part.name} <strong style="margin-right: 10px;">Energy:</strong> ${part.base_en} <strong style="margin-right: 10px;">Training Points:</strong> ${part.base_tp}</h4>
                <p>${part.description}</p>
                ${part.op_1_desc && partData.op_1_lvl > 0 ? `<p>Option 1: ${part.op_1_desc} (Level: ${partData.op_1_lvl})</p>` : ''}
                ${part.op_2_desc && partData.op_2_lvl > 0 ? `<p>Option 2: ${part.op_2_desc} (Level: ${partData.op_2_lvl})</p>` : ''}
                ${part.op_3_desc && partData.op_3_lvl > 0 ? `<p>Option 3: ${part.op_3_desc} (Level: ${partData.op_3_lvl})</p>` : ''}
            `;
            summaryPartsContainer.appendChild(partElement);
        });

        // New: Update the summary proficiencies
        const summaryProficiencies = document.getElementById('summaryProficiencies');
        summaryProficiencies.innerHTML = tpSources.map(source => `<p>${source}</p>`).join('');
    }

    function toggleTotalCosts() {
        const totalCosts = document.getElementById('totalCosts');
        totalCosts.classList.toggle('collapsed');
        const arrow = document.querySelector('#totalCosts .toggle-arrow');
        arrow.textContent = totalCosts.classList.contains('collapsed') ? '>' : '<';
    }
    // NEW: define toggleAdvancedMechanics
    function toggleAdvancedMechanics() {
        const c = document.getElementById('generalPowerOptionsContainer');
        if (!c) return;
        c.classList.toggle('show-advanced');
        const collapsedChips = document.getElementById('collapsedAddedChips');
        const classMap = {
            'Action': 'action',
            'Activation': 'activation',
            'Area of Effect': 'area',
            'Duration': 'duration',
            'Target': 'target',
            'Special': 'special',
            'Restriction': 'restriction'
        };
        if (c.classList.contains('show-advanced')) {
            collapsedChips.style.display = 'none';
        } else {
            // Populate with chips
            collapsedChips.innerHTML = '';
            selectedAdvancedParts.forEach(partData => {
                const chip = document.createElement('span');
                chip.className = 'chip ' + (classMap[partData.part.category] || 'special');
                chip.textContent = partData.part.name;
                collapsedChips.appendChild(chip);
            });
            collapsedChips.style.display = 'inline-block';
        }
    }

    // NEW: Set of excluded parts (those handled in basic mechanics)
    const excludedParts = new Set([
        'Power Quick or Free Action',
        'Power Long Action',
        'Power Reaction',
        'Sphere of Effect',
        'Cylinder of Effect',
        'Cone of Effect',
        'Line of Effect',
        'Trail of Effect',
        'Magic Damage',
        'Light Damage',
        'Elemental Damage',
        'Poison or Necrotic Damage',
        'Sonic Damage',
        'Spiritual Damage',
        'Psychic Damage',
        'Physical Damage',
        'Duration (Round)',
        'Duration (Minute)',
        'Duration (Hour)',
        'Duration (Days)',
        'Duration (Permanent)',
        'Focus for Duration',
        'No Harm or Adaptation for Duration',
        'Duration Ends On Activation',
        'Sustain for Duration',
        'Power Range'
    ]);

    // NEW: Function to populate advanced mechanics chips dynamically
    function populateAdvancedMechanics() {
        const categories = ['Action', 'Activation', 'Area of Effect', 'Duration', 'Target', 'Special', 'Restriction'];
        const classMap = {
            'Action': 'action',
            'Activation': 'activation',
            'Area of Effect': 'area',
            'Duration': 'duration',
            'Target': 'target',
            'Special': 'special',
            'Restriction': 'restriction'
        };
        const colorMap = {
            'Action': '#0b5ed7',
            'Activation': '#0f766e',
            'Area of Effect': '#166534',
            'Duration': '#6b21a8',
            'Target': '#9a3412',
            'Special': '#854d0e',
            'Restriction': '#b91c1c'
        };

        categories.forEach(cat => {
            const advGroup = Array.from(document.querySelectorAll('.adv-group')).find(group => group.querySelector('h4').textContent === cat);
            if (advGroup) {
                const chipsContainer = advGroup.querySelector('.chips');
                if (chipsContainer) {
                    chipsContainer.innerHTML = ''; // Clear any existing content
                    const parts = powerParts.filter(p => p.mechanic && p.category === cat && !excludedParts.has(p.name));
                    parts.forEach(part => {
                        const chip = document.createElement('span');
                        chip.className = 'chip ' + classMap[cat];
                        
                        // Create header wrapper for name and button
                        const header = document.createElement('div');
                        header.className = 'chip-header';
                        
                        const nameSpan = document.createElement('span');
                        nameSpan.className = 'chip-name';
                        nameSpan.textContent = part.name;
                        header.appendChild(nameSpan);

                        // Add + button with matching color
                        const addBtn = document.createElement('button');
                        addBtn.className = 'chip-add-button';
                        addBtn.textContent = '+';
                        addBtn.onclick = (e) => {
                            e.stopPropagation();
                            addAdvancedPart(part);
                        };
                        header.appendChild(addBtn);
                        chip.appendChild(header);

                        // Create expandable description div
                        const descDiv = document.createElement('div');
                        descDiv.className = 'chip-description';
                        descDiv.style.display = 'none'; // Initially hidden
                        descDiv.innerHTML = `
                            <p>${part.description || 'No description available.'}</p>
                            ${part.op_1_desc ? `<p>Option 1: ${part.op_1_desc}</p>` : ''}
                            ${part.op_2_desc ? `<p>Option 2: ${part.op_2_desc}</p>` : ''}
                            ${part.op_3_desc ? `<p>Option 3: ${part.op_3_desc}</p>` : ''}
                        `;

                        // Add click event to toggle description
                        chip.addEventListener('click', () => {
                            descDiv.style.display = descDiv.style.display === 'none' ? 'block' : 'none';
                        });

                        chip.appendChild(descDiv);
                        chipsContainer.appendChild(chip);
                    });
                }
            }
        });
    }

    // NEW: Function to add an advanced mechanic part
    function addAdvancedPart(part) {
        const existing = selectedAdvancedParts.find(ap => ap.part.name === part.name);
        if (!existing) {
            selectedAdvancedParts.push({ part, op_1_lvl: 0, op_2_lvl: 0, op_3_lvl: 0, applyDuration: false });
            renderAddedAdvancedParts();
            updateTotalCosts();
        }
    }

    // NEW: Function to render added advanced parts as chips
    function renderAddedAdvancedParts() {
        const container = document.getElementById('addedAdvancedPartsContainer');
        container.innerHTML = '';
        const chipsDiv = document.createElement('div');
        chipsDiv.className = 'chips';
        const classMap = {
            'Action': 'action',
            'Activation': 'activation',
            'Area of Effect': 'area',
            'Duration': 'duration',
            'Target': 'target',
            'Special': 'special',
            'Restriction': 'restriction'
        };
        selectedAdvancedParts.forEach((partData, idx) => {
            const part = partData.part;
            const chip = document.createElement('span');
            chip.className = 'chip ' + (classMap[part.category] || 'special');
            
            // Create header wrapper for name and button
            const header = document.createElement('div');
            header.className = 'chip-header';
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'chip-name';
            nameSpan.textContent = part.name;
            header.appendChild(nameSpan);

            // Add remove button
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-advanced-part';
            removeBtn.textContent = '✕';
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                removeAdvancedPart(idx);
            };
            header.appendChild(removeBtn);
            chip.appendChild(header);

            // Create expandable description div with options
            const descDiv = document.createElement('div');
            descDiv.className = 'chip-description';
            descDiv.style.display = 'none'; // Initially hidden
            descDiv.innerHTML = `
                <p>${part.description}</p>
                ${part.op_1_desc ? `
                <div class="option-container">
                    <div class="option-box">
                        <h4>Energy: ${part.op_1_en >= 0 ? '+' : ''}${part.op_1_en} Training Points: ${part.op_1_tp >= 0 ? '+' : ''}${part.op_1_tp}</h4>
                        <button onclick="event.stopPropagation(); changeAdvancedOptionLevel(${idx}, 'opt1', 1)">+</button>
                        <button onclick="event.stopPropagation(); changeAdvancedOptionLevel(${idx}, 'opt1', -1)">-</button>
                        <span>Level: <span id="adv-op_1_lvl-${idx}">${partData.op_1_lvl}</span></span>
                        <p>${part.op_1_desc}</p>
                    </div>
                </div>` : ''}
                ${part.op_2_desc ? `
                <div class="option-container">
                    <div class="option-box">
                        <h4>Energy: ${part.op_2_en >= 0 ? '+' : ''}${part.op_2_en} Training Points: ${part.op_2_tp >= 0 ? '+' : ''}${part.op_2_tp}</h4>
                        <button onclick="event.stopPropagation(); changeAdvancedOptionLevel(${idx}, 'opt2', 1)">+</button>
                        <button onclick="event.stopPropagation(); changeAdvancedOptionLevel(${idx}, 'opt2', -1)">-</button>
                        <span>Level: <span id="adv-op_2_lvl-${idx}">${partData.op_2_lvl}</span></span>
                        <p>${part.op_2_desc}</p>
                    </div>
                </div>` : ''}
                ${part.op_3_desc ? `
                <div class="option-container">
                    <div class="option-box">
                        <h4>Energy: ${part.op_3_en >= 0 ? '+' : ''}${part.op_3_en} Training Points: ${part.op_3_tp >= 0 ? '+' : ''}${part.op_3_tp}</h4>
                        <button onclick="event.stopPropagation(); changeAdvancedOptionLevel(${idx}, 'opt3', 1)">+</button>
                        <button onclick="event.stopPropagation(); changeAdvancedOptionLevel(${idx}, 'opt3', -1)">-</button>
                        <span>Level: <span id="adv-op_3_lvl-${idx}">${partData.op_3_lvl}</span></span>
                        <p>${part.op_3_desc}</p>
                    </div>
                </div>` : ''}
                <label><input type="checkbox" id="applyDurationAdv-${idx}" onclick="event.stopPropagation(); toggleAdvancedApplyDuration(${idx})" ${partData.applyDuration ? 'checked' : ''}> Apply Duration</label>
            `;

            // Add click event to toggle description
            chip.addEventListener('click', () => {
                descDiv.style.display = descDiv.style.display === 'none' ? 'block' : 'none';
            });

            chip.appendChild(descDiv);
            chipsDiv.appendChild(chip);
        });
        container.appendChild(chipsDiv);
    }

    // NEW: Function to change option level for advanced parts
    function changeAdvancedOptionLevel(idx, option, delta) {
        const keyMap = { opt1: 'op_1_lvl', opt2: 'op_2_lvl', opt3: 'op_3_lvl' };
        const levelKey = keyMap[option] || 'op_1_lvl';
        const partData = selectedAdvancedParts[idx];
        partData[levelKey] = Math.max(0, (partData[levelKey] || 0) + delta);
        const el = document.getElementById(`adv-${levelKey}-${idx}`);
        if (el) el.textContent = partData[levelKey];
        updateTotalCosts();
    }

    // NEW: Function to toggle apply duration for advanced parts
    function toggleAdvancedApplyDuration(idx) {
        selectedAdvancedParts[idx].applyDuration = !selectedAdvancedParts[idx].applyDuration;
        updateTotalCosts();
    }

    // NEW: Function to remove an advanced part
    function removeAdvancedPart(idx) {
        selectedAdvancedParts.splice(idx, 1);
        renderAddedAdvancedParts();
        updateTotalCosts();
    }

    function addDamageRow() {
        const additionalDamageRow = document.getElementById('additionalDamageRow');
        additionalDamageRow.innerHTML = `
            <h4>Damage: 
                <input type="number" id="dieAmount2" min="1" max="99" value="" placeholder="Amount"> d 
                <select id="dieSize2">
                    <option value="" selected disabled>Size</option>
                    <option value="4">4</option>
                    <option value="6">6</option>
                    <option value="8">8</option>
                    <option value="10">10</option>
                    <option value="12">12</option>
                </select>
                <select id="damageType2" onchange="updateDamageType()">
                    <option value="none" selected>No Damage</option>
                    <option value="magic">Magic</option>
                    <option value="light">Light</option>
                    <option value="fire">Fire</option>
                    <option value="ice">Ice</option>
                    <option value="lightning">Lightning</option>
                    <option value="spiritual">Spiritual</option>
                    <option value="sonic">Sonic</option>
                    <option value="poison">Poison</option>
                    <option value="necrotic">Necrotic</option>
                    <option value="acid">Acid</option>
                    <option value="psychic">Psychic</option>
                    <option value="bludgeoning">Bludgeoning</option>
                    <option value="piercing">Piercing</option>
                    <option value="slashing">Slashing</option>
                </select>
                <button id="removeDamageRowButton" class="medium-button red-button" onclick="removeDamageRow()">-</button>
                <label style="margin-left:10px;"><input type="checkbox" id="damageApplyDuration2" onclick="updateTotalCosts()"> Apply Duration</label>
            </h4>
        `;
        document.getElementById('addDamageRowButton').style.display = 'none';
    }

    function removeDamageRow() {
        const additionalDamageRow = document.getElementById('additionalDamageRow');
        additionalDamageRow.innerHTML = '';
        document.getElementById('addDamageRowButton').style.display = 'inline-block';
    }

    function renderPowerParts() {
        const powerPartsContainer = document.getElementById("powerPartsContainer");
        powerPartsContainer.innerHTML = "";

        // Get all unique categories, sorted
        const categories = [...new Set(powerParts.map(p => p.category).filter(Boolean))].sort();

        selectedPowerParts.forEach((partData, partIndex) => {
            const powerPartSection = document.createElement("div");
            powerPartSection.id = `powerPart-${partIndex}`;
            powerPartSection.classList.add("power-part-section");

            // Use selectedCategory for this part, default to 'any'
            const selectedCategory = partData.selectedCategory || 'any';
            const filteredParts = getFilteredParts(selectedCategory);

            // Build category dropdown
            const categoryOptions = [`<option value="any"${selectedCategory === 'any' ? ' selected' : ''}>Any</option>`]
                .concat(categories.map(cat => `<option value="${cat}"${selectedCategory === cat ? ' selected' : ''}>${cat}</option>`)).join('');

            // Build part dropdown (filtered)
            const partOptions = filteredParts.map((part, idx) =>
                `<option value="${idx}"${partData.part === part ? ' selected' : ''}>${part.name}</option>`
            ).join('');

            powerPartSection.innerHTML = `
                <div style="display: flex; gap: 10px; align-items: center;">
                    <select onchange="updateSelectedPart(${partIndex}, this.value)">
                        ${partOptions}
                    </select>
                    <select style="margin-left:8px;" onchange="updateSelectedCategory(${partIndex}, this.value)">
                        ${categoryOptions}
                    </select>
                </div>
                <div id="partContent-${partIndex}">
                    ${generatePartContent(partIndex, partData.part)}
                </div>
                <button class="delete-button" onclick="removePowerPart(${partIndex})">Delete</button>
            `;
            powerPartsContainer.appendChild(powerPartSection);
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        document.getElementById("addPowerPartButton").addEventListener("click", addPowerPart);
        document.getElementById('dieAmount1').addEventListener('input', updateTotalCosts);
        document.getElementById('dieSize1').addEventListener('change', updateTotalCosts);
        document.getElementById('damageType1').addEventListener('change', updateDamageType);

        const totalCostsArrow = document.querySelector('#totalCosts .toggle-arrow');
        if (totalCostsArrow) totalCostsArrow.addEventListener('click', toggleTotalCosts);
    });

    // Helper: build mechanic parts for save (similar to technique creator)
    function buildMechanicPartsForSave() {
        const mechanicParts = [];
        const actionType = document.getElementById('actionType')?.value;
        const reactionChecked = document.getElementById('reactionCheckbox')?.checked;

        // Reaction
        if (reactionChecked) {
            const reactionPart = findPartByIdOrName(PART_IDS.POWER_REACTION, 'Power Reaction', true);
            if (reactionPart) mechanicParts.push({ part: reactionPart, op_1_lvl: 0, op_2_lvl: 0, op_3_lvl: 0, applyDuration: false });
        }

        // Action Type
        if (actionType === 'quick') {
            const quickFreePart = findPartByIdOrName(PART_IDS.POWER_QUICK_OR_FREE_ACTION, 'Power Quick or Free Action', true);
            if (quickFreePart) mechanicParts.push({ part: quickFreePart, op_1_lvl: 0, op_2_lvl: 0, op_3_lvl: 0, applyDuration: false });
        } else if (actionType === 'free') {
            const quickFreePart = findPartByIdOrName(PART_IDS.POWER_QUICK_OR_FREE_ACTION, 'Power Quick or Free Action', true);
            if (quickFreePart) mechanicParts.push({ part: quickFreePart, op_1_lvl: 1, op_2_lvl: 0, op_3_lvl: 0, applyDuration: false });
        } else if (actionType === 'long3') {
            const longPart = findPartByIdOrName(PART_IDS.POWER_LONG_ACTION, 'Power Long Action', true);
            if (longPart) mechanicParts.push({ part: longPart, op_1_lvl: 0, op_2_lvl: 0, op_3_lvl: 0, applyDuration: false });
        } else if (actionType === 'long4') {
            const longPart = findPartByIdOrName(PART_IDS.POWER_LONG_ACTION, 'Power Long Action', true);
            if (longPart) mechanicParts.push({ part: longPart, op_1_lvl: 1, op_2_lvl: 0, op_3_lvl: 0, applyDuration: false });
        }

        // Area of Effect
        const areaEffect = document.getElementById('areaEffect')?.value;
        const areaEffectApplyDuration = document.getElementById('areaEffectApplyDuration')?.checked || false;
        let areaPartName = '';
        let areaPartId = null;
        if (areaEffect === 'sphere') { areaPartName = 'Sphere of Effect'; areaPartId = PART_IDS.SPHERE_OF_EFFECT; }
        else if (areaEffect === 'cylinder') { areaPartName = 'Cylinder of Effect'; areaPartId = PART_IDS.CYLINDER_OF_EFFECT; }
        else if (areaEffect === 'cone') { areaPartName = 'Cone of Effect'; areaPartId = PART_IDS.CONE_OF_EFFECT; }
        else if (areaEffect === 'line') { areaPartName = 'Line of Effect'; areaPartId = PART_IDS.LINE_OF_EFFECT; }
        else if (areaEffect === 'space') { areaPartName = 'Trail of Effect'; areaPartId = PART_IDS.TRAIL_OF_EFFECT; }
        
        if (areaPartName && areaPartId) {
            const areaPart = findPartByIdOrName(areaPartId, areaPartName, true);
            if (areaPart) {
                mechanicParts.push({ part: areaPart, op_1_lvl: Math.max(0, areaEffectLevel - 1), op_2_lvl: 0, op_3_lvl: 0, applyDuration: areaEffectApplyDuration });
            }
        }

        // Damage (both rows, now allow applyDuration)
        const addDamagePart = (damageType, dieAmount, dieSize, applyDuration) => {
            let partName = '';
            let partId = null;
            if (damageType === 'magic') { partName = 'Magic Damage'; partId = PART_IDS.MAGIC_DAMAGE; }
            else if (damageType === 'light') { partName = 'Light Damage'; partId = PART_IDS.LIGHT_DAMAGE; }
            else if (['fire', 'ice', 'acid', 'lightning'].includes(damageType)) { partName = 'Elemental Damage'; partId = PART_IDS.ELEMENTAL_DAMAGE; }
            else if (['poison', 'necrotic'].includes(damageType)) { partName = 'Poison or Necrotic Damage'; partId = PART_IDS.POISON_OR_NECROTIC_DAMAGE; }
            else if (damageType === 'sonic') { partName = 'Sonic Damage'; partId = PART_IDS.SONIC_DAMAGE; }
            else if (damageType === 'spiritual') { partName = 'Spiritual Damage'; partId = PART_IDS.SPIRITUAL_DAMAGE; }
            else if (damageType === 'psychic') { partName = 'Psychic Damage'; partId = PART_IDS.PSYCHIC_DAMAGE; }
            else if (['bludgeoning', 'piercing', 'slashing'].includes(damageType)) { partName = 'Physical Damage'; partId = PART_IDS.PHYSICAL_DAMAGE; }

            if (partName && partId) {
                const damagePart = findPartByIdOrName(partId, partName, true);
                if (damagePart) {
                    const totalDamage = dieAmount * dieSize;
                    const op1 = Math.max(0, Math.floor((totalDamage - 4) / 2));
                    mechanicParts.push({ part: damagePart, op_1_lvl: op1, op_2_lvl: 0, op_3_lvl: 0, applyDuration: !!applyDuration });
                }
            }
        };

        const dieAmount1 = parseInt(document.getElementById('dieAmount1')?.value, 10);
        const dieSize1 = parseInt(document.getElementById('dieSize1')?.value, 10);
        const damageType1 = document.getElementById('damageType1')?.value;
        const damageApplyDuration1 = document.getElementById('damageApplyDuration1')?.checked;
        if (!isNaN(dieAmount1) && !isNaN(dieSize1) && damageType1 && damageType1 !== "none") addDamagePart(damageType1, dieAmount1, dieSize1, damageApplyDuration1);

        const dieAmount2 = parseInt(document.getElementById('dieAmount2')?.value, 10);
        const dieSize2 = parseInt(document.getElementById('dieSize2')?.value, 10);
        const damageType2 = document.getElementById('damageType2')?.value;
        const damageApplyDuration2 = document.getElementById('damageApplyDuration2')?.checked;
        if (!isNaN(dieAmount2) && !isNaN(dieSize2) && damageType2 && damageType2 !== "none") addDamagePart(damageType2, dieAmount2, dieSize2, damageApplyDuration2);

        // Duration mechanic parts (from database)
        const focusChecked = document.getElementById('focusCheckbox')?.checked;
        const noHarmChecked = document.getElementById('noHarmCheckbox')?.checked;
        const endsOnceChecked = document.getElementById('endsOnceCheckbox')?.checked;
        const sustainValue = parseInt(document.getElementById('sustainValue')?.value, 10) || 0;

        const durationType = document.getElementById('durationType')?.value;
        const durationValue = parseInt(document.getElementById('durationValue')?.value, 10) || 1;
        const idx = durationValue - 1; // 0-based index of the selected entry

        // Helper to find a mechanic part by ID or name (for backwards compatibility)
        const getMechanicPartById = (partId, name) => findPartByIdOrName(partId, name, true);

        // Add toggle-driven duration modifiers
        if (focusChecked) {
            const p = getMechanicPartById(PART_IDS.FOCUS_FOR_DURATION, 'Focus for Duration');
            if (p) mechanicParts.push({ part: p, op_1_lvl: 0, op_2_lvl: 0, op_3_lvl: 0, applyDuration: false });
        }
        if (noHarmChecked) {
            const p = getMechanicPartById(PART_IDS.NO_HARM_OR_ADAPTATION_FOR_DURATION, 'No Harm or Adaptation for Duration');
            if (p) mechanicParts.push({ part: p, op_1_lvl: 0, op_2_lvl: 0, op_3_lvl: 0, applyDuration: false });
        }
        if (endsOnceChecked) {
            const p = getMechanicPartById(PART_IDS.DURATION_ENDS_ON_ACTIVATION, 'Duration Ends On Activation');
            if (p) mechanicParts.push({ part: p, op_1_lvl: 0, op_2_lvl: 0, op_3_lvl: 0, applyDuration: false });
        }
        if (sustainValue > 0) {
            const p = getMechanicPartById(PART_IDS.SUSTAIN_FOR_DURATION, 'Sustain for Duration');
            if (p) mechanicParts.push({ part: p, op_1_lvl: Math.max(0, sustainValue - 1), op_2_lvl: 0, op_3_lvl: 0, applyDuration: false });
        }

        // Duration base type selection
        if (durationType === 'permanent') {
            const p = getMechanicPartById(PART_IDS.DURATION_PERMANENT, 'Duration (Permanent)');
            if (p) mechanicParts.push({ part: p, op_1_lvl: 0, op_2_lvl: 0, op_3_lvl: 0, applyDuration: false });
        } else if (durationType === 'days') {
            const p = getMechanicPartById(PART_IDS.DURATION_DAYS, 'Duration (Days)');
            if (p) mechanicParts.push({ part: p, op_1_lvl: Math.max(0, idx), op_2_lvl: 0, op_3_lvl: 0, applyDuration: false });
        } else if (durationType === 'hours') {
            const p = getMechanicPartById(PART_IDS.DURATION_HOUR, 'Duration (Hour)');
            if (p) mechanicParts.push({ part: p, op_1_lvl: Math.max(0, idx), op_2_lvl: 0, op_3_lvl: 0, applyDuration: false });
        } else if (durationType === 'minutes') {
            const p = getMechanicPartById(PART_IDS.DURATION_MINUTE, 'Duration (Minute)');
            if (p) mechanicParts.push({ part: p, op_1_lvl: Math.max(0, idx), op_2_lvl: 0, op_3_lvl: 0, applyDuration: false });
        } else if (durationType === 'rounds') {
            // Only add when > 1 round. For 2 rounds (idx=1) => op1 = 0; 3 rounds (idx=2) => op1 = 1, etc.
            if (durationValue > 1) {
                const p = getMechanicPartById(PART_IDS.DURATION_ROUND, 'Duration (Round)');
                if (p) mechanicParts.push({ part: p, op_1_lvl: Math.max(0, idx - 1), op_2_lvl: 0, op_3_lvl: 0, applyDuration: false });
            }
        }

        // Range as a mechanic part ("Power Range")
        const rangeSteps = range; // range 0 = melee; range 1+ = steps beyond melee
        if (rangeSteps > 0) {
            const rangePart = findPartByIdOrName(PART_IDS.POWER_RANGE, 'Power Range', true);
            if (rangePart) {
                mechanicParts.push({
                    part: rangePart,
                    op_1_lvl: Math.max(0, rangeSteps - 1),
                    op_2_lvl: 0,
                    op_3_lvl: 0,
                    applyDuration: false
                });
            }
        }

        return mechanicParts;
    }

    async function savePowerToLibrary(functions, userId) {
        const powerName = document.getElementById('powerName').value?.trim();
        if (!powerName) {
            alert('Please enter a power name');
            return;
        }
        const powerDescription = document.getElementById('powerDescription').value || '';

        // Build damage array
        const damageArray = [];
        const dieAmount1 = document.getElementById('dieAmount1')?.value || '';
        const dieSize1 = document.getElementById('dieSize1')?.value || '';
        const damageType1 = document.getElementById('damageType1')?.value || 'none';
        const damageApplyDuration1 = document.getElementById('damageApplyDuration1')?.checked || false;
        if (dieAmount1 && dieSize1 && damageType1 !== 'none') {
            damageArray.push({ amount: dieAmount1, size: dieSize1, type: damageType1, applyDuration: damageApplyDuration1 });
        }

        const dieAmount2 = document.getElementById('dieAmount2')?.value || '';
        const dieSize2 = document.getElementById('dieSize2')?.value || '';
        const damageType2 = document.getElementById('damageType2')?.value || 'none';
        const damageApplyDuration2 = document.getElementById('damageApplyDuration2')?.checked || false;
        if (dieAmount2 && dieSize2 && damageType2 !== 'none') {
            damageArray.push({ amount: dieAmount2, size: dieSize2, type: damageType2, applyDuration: damageApplyDuration2 });
        }

        // Build mechanic parts
        const mechanicParts = buildMechanicPartsForSave();
        
        // Combine user-selected parts and mechanic parts
        const allParts = [
            ...selectedPowerParts.map(p => ({
                part: p.part,
                op_1_lvl: p.op_1_lvl || 0,
                op_2_lvl: p.op_2_lvl || 0,
                op_3_lvl: p.op_3_lvl || 0,
                applyDuration: p.applyDuration || false // ✓ SAVED
            })),
            ...mechanicParts, // ✓ Built by buildMechanicPartsForSave with applyDuration
            ...selectedAdvancedParts.map(p => ({
                part: p.part,
                op_1_lvl: p.op_1_lvl || 0,
                op_2_lvl: p.op_2_lvl || 0,
                op_3_lvl: p.op_3_lvl || 0,
                applyDuration: p.applyDuration || false // ✓ SAVED (but always false in current implementation)
            }))
        ];

        // Map to compact structure - THIS PRESERVES applyDuration
        // Now includes both id and name for forwards/backwards compatibility
        const partsPayload = allParts.map(p => ({
            id: p.part.id,
            name: p.part.name, // Keep name for backwards compatibility
            op_1_lvl: p.op_1_lvl || 0,
            op_2_lvl: p.op_2_lvl || 0,
            op_3_lvl: p.op_3_lvl || 0,
            applyDuration: p.applyDuration || false // ✓ PRESERVED IN SAVE
        }));

        try {
            const idToken = await getAuth().currentUser.getIdToken();
            const db = getFirestore();
            const powersRef = collection(db, 'users', userId, 'library');
            const q = query(powersRef, where('name', '==', powerName));
            const querySnapshot = await getDocs(q);

            let docRef;
            if (!querySnapshot.empty) {
                docRef = doc(db, 'users', userId, 'library', querySnapshot.docs[0].id);
            } else {
                docRef = doc(powersRef);
            }

            await setDoc(docRef, {
                name: powerName,
                description: powerDescription,
                parts: partsPayload,
                damage: damageArray,
                timestamp: new Date()
            });

            alert('Power saved to library');
        } catch (e) {
            console.error('Error saving power:', e);
            alert('Error saving power to library');
        }
    }

    async function loadSavedPowers(db, userId) {
        const savedPowersList = document.getElementById('savedPowersList');
        savedPowersList.innerHTML = ''; // Clear existing list
    
        try {
            const querySnapshot = await getDocs(collection(db, 'users', userId, 'library'));
            querySnapshot.forEach((docSnapshot) => {
                const power = docSnapshot.data();
                const listItem = document.createElement('li');
                listItem.textContent = power.name;
    
                const loadButton = document.createElement('button');
                loadButton.textContent = 'Load';
                loadButton.addEventListener('click', () => {
                    loadPower(power);
                    closeModal();
                });
    
                listItem.appendChild(loadButton);
                savedPowersList.appendChild(listItem);
            });
        } catch (e) {
            alert('Error fetching saved powers');
        }
    }
    
    function loadPower(power) {
        document.getElementById('powerName').value = power.name || '';
        document.getElementById('powerDescription').value = power.description || '';

        // Handle damage (now includes applyDuration)
        const damageData = power.damage || [];
        if (damageData.length > 0) {
            const dmg1 = damageData[0];
            document.getElementById('dieAmount1').value = dmg1.amount || '';
            document.getElementById('dieSize1').value = dmg1.size || '';
            document.getElementById('damageType1').value = dmg1.type || 'none';
            document.getElementById('damageApplyDuration1').checked = !!dmg1.applyDuration;
        } else {
            document.getElementById('dieAmount1').value = '';
            document.getElementById('dieSize1').value = '';
            document.getElementById('damageType1').value = 'none';
            document.getElementById('damageApplyDuration1').checked = false;
        }

        if (damageData.length > 1) {
            addDamageRow();
            const dmg2 = damageData[1];
            document.getElementById('dieAmount2').value = dmg2.amount || '';
            document.getElementById('dieSize2').value = dmg2.size || '';
            document.getElementById('damageType2').value = dmg2.type || 'none';
            document.getElementById('damageApplyDuration2').checked = !!dmg2.applyDuration;
        }
        // CHANGED: Load ALL parts, including mechanic parts, to preserve applyDuration state
        const savedParts = power.parts || power.powerParts || [];
        selectedPowerParts.length = 0;
        selectedAdvancedParts.length = 0;

        // Track mechanic parts to restore UI state
        let savedRange = 0;
        let savedAreaEffect = 'none';
        let savedAreaEffectLevel = 1;
        let savedAreaEffectApplyDuration = false;
        let savedActionType = 'basic';
        let savedReaction = false;
        let savedDurationType = 'rounds';
        let savedDurationValue = 1;
        let savedFocus = false;
        let savedNoHarm = false;
        let savedEndsOnce = false;
        let savedSustain = 0;

        savedParts.forEach(p => {
            // Use findByIdOrName for backwards compatibility with old saves (name only) and new saves (id + name)
            const partObj = findByIdOrName(powerParts, p) || powerParts.find(pp => pp.name === p.part);
            if (!partObj) return;

            // Get part ID for comparison (prefer partObj.id, but also check PART_IDS constants)
            const partId = partObj.id;

            // Restore UI state from mechanic parts
            if (partObj.mechanic || partObj.duration) {
                if (partId === PART_IDS.POWER_RANGE || partObj.name === 'Power Range') {
                    savedRange = (p.op_1_lvl || 0) + 1;
                } else if (partId === PART_IDS.SPHERE_OF_EFFECT || partObj.name === 'Sphere of Effect') {
                    savedAreaEffect = 'sphere';
                    savedAreaEffectLevel = (p.op_1_lvl || 0) + 1;
                    savedAreaEffectApplyDuration = p.applyDuration || false;
                } else if (partId === PART_IDS.CYLINDER_OF_EFFECT || partObj.name === 'Cylinder of Effect') {
                    savedAreaEffect = 'cylinder';
                    savedAreaEffectLevel = (p.op_1_lvl || 0) + 1;
                    savedAreaEffectApplyDuration = p.applyDuration || false;
                } else if (partId === PART_IDS.CONE_OF_EFFECT || partObj.name === 'Cone of Effect') {
                    savedAreaEffect = 'cone';
                    savedAreaEffectLevel = (p.op_1_lvl || 0) + 1;
                    savedAreaEffectApplyDuration = p.applyDuration || false;
                } else if (partId === PART_IDS.LINE_OF_EFFECT || partObj.name === 'Line of Effect') {
                    savedAreaEffect = 'line';
                    savedAreaEffectLevel = (p.op_1_lvl || 0) + 1;
                    savedAreaEffectApplyDuration = p.applyDuration || false;
                } else if (partId === PART_IDS.TRAIL_OF_EFFECT || partObj.name === 'Trail of Effect') {
                    savedAreaEffect = 'space';
                    savedAreaEffectLevel = (p.op_1_lvl || 0) + 1;
                    savedAreaEffectApplyDuration = p.applyDuration || false;
                } else if (partId === PART_IDS.POWER_REACTION || partObj.name === 'Power Reaction') {
                    savedReaction = true;
                } else if (partId === PART_IDS.POWER_QUICK_OR_FREE_ACTION || partObj.name === 'Power Quick or Free Action') {
                    savedActionType = (p.op_1_lvl || 0) === 0 ? 'quick' : 'free';
                } else if (partId === PART_IDS.POWER_LONG_ACTION || partObj.name === 'Power Long Action') {
                    savedActionType = (p.op_1_lvl || 0) === 0 ? 'long3' : 'long4';
                } else if (partId === PART_IDS.FOCUS_FOR_DURATION || partObj.name === 'Focus for Duration') {
                    savedFocus = true;
                } else if (partId === PART_IDS.NO_HARM_OR_ADAPTATION_FOR_DURATION || partObj.name === 'No Harm or Adaptation for Duration') {
                    savedNoHarm = true;
                } else if (partId === PART_IDS.DURATION_ENDS_ON_ACTIVATION || partObj.name === 'Duration Ends On Activation') {
                    savedEndsOnce = true;
                } else if (partId === PART_IDS.SUSTAIN_FOR_DURATION || partObj.name === 'Sustain for Duration') {
                    savedSustain = (p.op_1_lvl || 0) + 1;
                } else if (partId === PART_IDS.DURATION_PERMANENT || partObj.name === 'Duration (Permanent)') {
                    savedDurationType = 'permanent';
                    savedDurationValue = 1;
                } else if (partId === PART_IDS.DURATION_DAYS || partObj.name === 'Duration (Days)') {
                    savedDurationType = 'days';
                    savedDurationValue = (p.op_1_lvl || 0) + 1;
                } else if (partId === PART_IDS.DURATION_HOUR || partObj.name === 'Duration (Hour)') {
                    savedDurationType = 'hours';
                    savedDurationValue = (p.op_1_lvl || 0) + 1;
                } else if (partId === PART_IDS.DURATION_MINUTE || partObj.name === 'Duration (Minute)') {
                    savedDurationType = 'minutes';
                    savedDurationValue = (p.op_1_lvl || 0) + 1;
                } else if (partId === PART_IDS.DURATION_ROUND || partObj.name === 'Duration (Round)') {
                    savedDurationType = 'rounds';
                    savedDurationValue = (p.op_1_lvl || 0) + 2; // 0 → 2 rounds, 1 → 3 rounds, etc.
                }
                // Don't add mechanic parts to selectedPowerParts or selectedAdvancedParts
                return;
            }

            // Restore non-mechanic parts
            selectedPowerParts.push({
                part: partObj,
                op_1_lvl: p.op_1_lvl ?? p.opt1Level ?? 0,
                op_2_lvl: p.op_2_lvl ?? p.opt2Level ?? 0,
                op_3_lvl: p.op_3_lvl ?? p.opt3Level ?? 0,
                applyDuration: p.applyDuration || false
            });
        });

        // Restore UI state
        range = savedRange;
        const displayRange = range === 0 ? 1 : range * 3;
        document.getElementById('rangeValue').textContent = displayRange;
        document.getElementById('rangeValue').nextSibling.textContent = displayRange > 1 ? ' spaces' : ' space';

        document.getElementById('areaEffect').value = savedAreaEffect;
        areaEffectLevel = savedAreaEffectLevel;
        document.getElementById('areaEffectLevelValue').textContent = areaEffectLevel;
        document.getElementById('areaEffectApplyDuration').checked = savedAreaEffectApplyDuration;
        updateAreaEffect(); // Update description

        document.getElementById('actionType').value = savedActionType;
        document.getElementById('reactionCheckbox').checked = savedReaction;
        updateActionType(); // Update description

        document.getElementById('durationType').value = savedDurationType;
        changeDurationType(); // Populate dropdown
        document.getElementById('durationValue').value = savedDurationValue;
        duration = savedDurationValue;

        document.getElementById('focusCheckbox').checked = savedFocus;
        document.getElementById('noHarmCheckbox').checked = savedNoHarm;
        document.getElementById('endsOnceCheckbox').checked = savedEndsOnce;
        document.getElementById('sustainValue').value = savedSustain;

        renderPowerParts();
        renderAddedAdvancedParts();
        updateTotalCosts(); // Recalculate with restored UI state
    }
    
    function openModal() {
        document.getElementById('loadPowerModal').style.display = 'block';
    }
    
    function closeModal() {
        document.getElementById('loadPowerModal').style.display = 'none';
    }
    
    document.addEventListener('DOMContentLoaded', function() {
        const loadPowerButton = document.getElementById('loadPowerButton');
        const closeButton = document.querySelector('.close-button');
    
        loadPowerButton.addEventListener('click', () => {
            const auth = getAuth();
            const user = auth.currentUser;
            if (user) {
                const db = getFirestore();
                loadSavedPowers(db, user.uid);
                openModal();
            } else {
                alert('Please login to load saved powers.');
            }
        });
    
        closeButton.addEventListener('click', closeModal);
    
        window.addEventListener('click', (event) => {
            if (event.target === document.getElementById('loadPowerModal')) {
                closeModal();
            }
        });
    });

    document.addEventListener('DOMContentLoaded', async function() {
        // Use centralized Firebase initialization
        const { auth, functions, db, rtdb } = await initializeFirebase();
        const database = rtdb;

            // Fetch power parts from shared RTDB cache
            powerParts = await fetchPowerParts(database);
            
            // Extract duration parts from cached data using ID-based lookups
            durationParts = {
                rounds: findPartByIdOrName(PART_IDS.DURATION_ROUND, 'Duration (Round)', false),
                minutes: findPartByIdOrName(PART_IDS.DURATION_MINUTE, 'Duration (Minute)', false),
                hours: findPartByIdOrName(PART_IDS.DURATION_HOUR, 'Duration (Hour)', false),
                days: findPartByIdOrName(PART_IDS.DURATION_DAYS, 'Duration (Days)', false),
                permanent: findPartByIdOrName(PART_IDS.DURATION_PERMANENT, 'Duration (Permanent)', false)
            };

            // NEW: Populate advanced mechanics chips after fetching parts
            populateAdvancedMechanics();

            onAuthStateChanged(auth, (user) => {
                const savePowerButton = document.getElementById('savePowerButton');
                if (user) {
                    savePowerButton.textContent = 'Save Power';
                    savePowerButton.addEventListener('click', () => savePowerToLibrary(functions, user.uid));
                } else {
                    savePowerButton.textContent = 'Login to Save Powers';
                    savePowerButton.addEventListener('click', () => {
                        window.location.href = '/pages/login.html';
                    });
                }
            });
    });

// Expose functions to global scope for inline event handlers
window.updateSelectedPart = updateSelectedPart;
window.changeOptionLevel = changeOptionLevel;
window.changeRange = changeRange;
window.changeArea = changeArea;
window.changeDuration = changeDuration;
window.changeDurationType = changeDurationType;
window.removePowerPart = removePowerPart;
window.updateTotalCosts = updateTotalCosts;
window.updateAreaEffect = updateAreaEffect;
window.changeAreaEffectLevel = changeAreaEffectLevel;
window.updateActionType = updateActionType;
window.updateDamageType = updateDamageType;
window.addDamageRow = addDamageRow;
window.removeDamageRow = removeDamageRow;
window.toggleTotalCosts = toggleTotalCosts;
window.loadSavedPowers = loadSavedPowers;
window.loadPower = loadPower;
window.openModal = openModal;
window.closeModal = closeModal;
window.toggleApplyDuration = toggleApplyDuration; // NEW
window.toggleAdvancedMechanics = toggleAdvancedMechanics; // NEW
window.changeAdvancedOptionLevel = changeAdvancedOptionLevel; // NEW
window.toggleAdvancedApplyDuration = toggleAdvancedApplyDuration; // NEW
window.removeAdvancedPart = removeAdvancedPart; // NEW
window.populateAdvancedMechanics = populateAdvancedMechanics; // NEW
window.updateSelectedCategory = updateSelectedCategory; // NEW

})();
