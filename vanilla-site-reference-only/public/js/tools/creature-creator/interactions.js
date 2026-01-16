import { resistances, weaknesses, immunities, senses, movement, feats, powersTechniques, armaments, creatureSkills, creatureSkillValues, creatureLanguages, conditionImmunities, defenseSkillState } from './state.js';
import { updateList, capitalize, SENSES_DISPLAY, MOVEMENT_DISPLAY, getAbilityValue, getSkillBonus, getBaseDefenseValue, getSkillPointsRemaining, getRemainingFeatPoints, getAbilityPointCost, getAbilityPointTotal, getLevelValue, getVitalityValue, getBaseHitPoints, getBaseEnergy, getHitEnergyTotal, getMaxArchetypeProficiency, getPowerProficiency, getMartialProficiency, validateArchetypeProficiency, getInnatePowers, getInnateEnergy, getHighestNonVitalityAbility, getBaseFeatPoints, getSpentFeatPoints, getSkillPointTotal, getSkillPointsSpent, addFeatFromDatabase, removeFeat, getCreatureCurrency } from './utils.js';
import { calculateCreatureTPSpent, getAdjustedCreatureTP } from './tp-calc.js';
import { getBaseTP } from './utils.js';

// Add imports for item, power, and technique calculations
import { calculateItemCosts, calculateCurrencyCostAndRarity, extractProficiencies } from '/js/calculators/item-calc.js';
import { derivePowerDisplay } from '/js/calculators/power-calc.js';
import { deriveTechniqueDisplay } from '/js/calculators/technique-calc.js';

// Import shared RTDB cache utility
import { 
    fetchCreatureFeats, 
    fetchItemProperties, 
    fetchPowerParts, 
    fetchTechniqueParts 
} from '/js/core/rtdb-cache.js';

// Import ID-based lookup helpers
import { CREATURE_FEAT_IDS, findByIdOrName } from '/js/shared/id-constants.js';

// Firebase database will be auto-detected by rtdb-cache
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

let skills = []; // Will be set in initCreatureCreator
let allCreatureFeats = []; // Will be loaded from Realtime Database
let itemPropertiesData = []; // Will be loaded from Realtime Database
let powerPartsData = []; // Will be loaded from Realtime Database
let techniquePartsData = []; // Will be loaded from Realtime Database

import { getHighestAbility } from './utils.js';

// Helper to find creature feat by ID or name
function findCreatureFeat(idOrRef, fallbackName = null) {
    if (typeof idOrRef === 'number' || typeof idOrRef === 'string') {
        return findByIdOrName(allCreatureFeats, { id: idOrRef, name: fallbackName || idOrRef });
    }
    return findByIdOrName(allCreatureFeats, idOrRef);
}

// Helper: get background feat points for resistances/weaknesses/immunities/condition immunities/senses/movements
function getBackgroundFeatPoints() {
    let total = 0;
    // For each resistance, add "Resistance" feat points
    const resistanceFeat = findCreatureFeat(CREATURE_FEAT_IDS.RESISTANCE, "Resistance");
    if (resistanceFeat) total += resistances.length * resistanceFeat.feat_points;
    // For each weakness, add "Weakness" feat points
    const weaknessFeat = findCreatureFeat(CREATURE_FEAT_IDS.WEAKNESS, "Weakness");
    if (weaknessFeat) total += weaknesses.length * weaknessFeat.feat_points;
    // For each immunity, add "Immunity" feat points
    const immunityFeat = findCreatureFeat(CREATURE_FEAT_IDS.IMMUNITY, "Immunity");
    if (immunityFeat) total += immunities.length * immunityFeat.feat_points;
    // For each condition immunity, add "Condition Immunity" feat points
    const condImmunityFeat = findCreatureFeat(CREATURE_FEAT_IDS.CONDITION_IMMUNITY, "Condition Immunity");
    if (condImmunityFeat) total += conditionImmunities.length * condImmunityFeat.feat_points;
    // For each sense, add the corresponding feat points
    senses.forEach(sense => {
        const senseFeat = findCreatureFeat({ name: sense });
        if (senseFeat) total += senseFeat.feat_points;
    });
    // For each movement, add the corresponding feat points
    movement.forEach(move => {
        const moveFeat = findCreatureFeat({ name: move.type });
        if (moveFeat) total += moveFeat.feat_points;
    });
    return total;
}

// Patch getSpentFeatPoints to include background feats
import { getSpentFeatPoints as originalGetSpentFeatPoints } from './utils.js';
function getSpentFeatPointsWithBackground() {
    return originalGetSpentFeatPoints() + getBackgroundFeatPoints();
}

function getRemainingFeatPointsWithBackground() {
    const level = getLevelValue();
    return getBaseFeatPoints(level) - getSpentFeatPointsWithBackground();
}

// Update functions for lists
export function updateResistancesList() {
    resistances.sort();
    updateList("resistancesList", resistances, idx => {
        resistances.splice(idx, 1);
        updateResistancesList();
        updateSummary();
    }, null, allCreatureFeats);
}

export function updateWeaknessesList() {
    weaknesses.sort();
    updateList("weaknessesList", weaknesses, idx => {
        weaknesses.splice(idx, 1);
        updateWeaknessesList();
        updateSummary();
    }, null, allCreatureFeats);
}

export function updateImmunitiesList() {
    immunities.sort();
    updateList("immunitiesList", immunities, idx => {
        immunities.splice(idx, 1);
        updateImmunitiesList();
        updateSummary();
    }, null, allCreatureFeats);
}

export function updateSensesList() {
    updateList("sensesList", senses, (val, idx) => {
        senses.splice(senses.indexOf(val), 1);
        removeFeat(val);
        updateSensesList();
        updateSummary();
    }, null, allCreatureFeats); // Pass allCreatureFeats for descriptions
}

export function updateMovementList() {
    const movementTypes = movement.map(m => m.type);
    updateList("movementList", movementTypes, (val) => {
        movement.splice(movement.findIndex(m => m.type === val), 1);
        removeFeat(val);
        updateMovementList();
        updateSummary();
    }, MOVEMENT_DISPLAY, allCreatureFeats);
    // Add associated feat from the database for movement
    movement.forEach(move => {
        addFeatFromDatabase(move.type);
    });
}

export function updateConditionImmunityList() {
    conditionImmunities.sort();
    updateList("conditionImmunityList", conditionImmunities, idx => {
        conditionImmunities.splice(idx, 1);
        updateConditionImmunityList();
        updateSummary();
    }, null, allCreatureFeats);
}

export function updateLanguagesList() {
    const ul = document.getElementById("languagesList");
    ul.innerHTML = "";
    creatureLanguages.slice().sort((a, b) => a.localeCompare(b)).forEach((lang, idx) => {
        const li = document.createElement("li");
        li.textContent = lang;
        const btn = document.createElement("button");
        btn.textContent = "✕";
        btn.className = "small-button red-button";
        btn.style.marginLeft = "6px";
        btn.onclick = () => {
            creatureLanguages.splice(idx, 1);
            updateLanguagesList();
            updateSummary();
        };
        li.appendChild(btn);
        ul.appendChild(li);
    });
}

export function updateDefensesUI() {
    const defenses = [
        "Might",
        "Fortitude",
        "Reflex",
        "Discernment",
        "Mental Fortitude",
        "Resolve"
    ];
    defenses.forEach(def => {
        const el = document.getElementById('defense' + def.replace(/\s/g, ''));
        if (el) {
            const base = getBaseDefenseValue(def);
            const bonus = defenseSkillState[def] || 0;
            el.textContent = base + bonus;
        }
        const minusBtn = document.querySelector(`.defense-minus[data-defense="${def}"]`);
        const plusBtn = document.querySelector(`.defense-plus[data-defense="${def}"]`);
        if (minusBtn) minusBtn.disabled = (defenseSkillState[def] <= 0);
        if (plusBtn) plusBtn.disabled = (getSkillPointsRemaining() < 2);
    });
    const skillPointsElem = document.getElementById('summarySkillPoints');
    if (skillPointsElem) {
        skillPointsElem.textContent = getSkillPointsRemaining();
        skillPointsElem.style.color = getSkillPointsRemaining() < 0 ? "red" : "";
    }
    // --- Add this block to update skill points UI in the skills section as well ---
    let skillPointsDisplay = document.getElementById("skillPointsBoxDisplay");
    if (skillPointsDisplay) {
        const points = getSkillPointsRemaining();
        skillPointsDisplay.textContent = `Skill Points Remaining: ${points}`;
        skillPointsDisplay.style.color = points < 0 ? "red" : "";
    }
}

export function updateCreatureAbilityDropdowns() {
    const abilityDropdowns = document.querySelectorAll('.creature-ability-dropdown');
    let total = 0;
    abilityDropdowns.forEach(dropdown => {
        const value = parseInt(dropdown.value);
        if (!isNaN(value)) {
            const cost = getAbilityPointCost(value);
            total += cost;
        }
    });
    let level = 1;
    const levelInput = document.getElementById('creatureLevel');
    if (levelInput) {
        level = parseFloat(levelInput.value) || 1;
    }
    const maxPoints = getAbilityPointTotal(level);
    const counter = document.getElementById('remaining-points');
    if (counter) {
        counter.textContent = maxPoints - total;
        counter.style.color = (maxPoints - total) <= 0 ? "red" : "#007bff";
    }
    abilityDropdowns.forEach(dropdown => {
        const options = dropdown.querySelectorAll('option');
        options.forEach(option => {
            option.disabled = false;
        });
    });
}

export function updateHealthEnergyUI() {
    const level = getLevelValue();
    const vitality = getVitalityValue();
    const baseHP = getBaseHitPoints();
    const baseEN = getBaseEnergy();
    const totalPoints = getHitEnergyTotal(level);
    const hpInput = document.getElementById('hitPointsInput');
    const enInput = document.getElementById('energyInput');
    let hp = parseInt(hpInput.value);
    let en = parseInt(enInput.value);
    if (isNaN(hp) || hp < baseHP) hp = baseHP;
    if (isNaN(en) || en < baseEN) en = baseEN;
    let allocatedHP = hp - baseHP;
    let allocatedEN = en - baseEN;
    if (allocatedHP < 0) allocatedHP = 0;
    if (allocatedEN < 0) allocatedEN = 0;
    let spent = allocatedHP + allocatedEN;
    let remaining = totalPoints - spent;
    if (remaining < 0) {
        if (hpInput === document.activeElement) {
            allocatedHP = Math.max(0, allocatedHP + remaining);
            hp = baseHP + allocatedHP;
        } else if (enInput === document.activeElement) {
            allocatedEN = Math.max(0, allocatedEN + remaining);
            en = baseEN + allocatedEN;
        } else {
            allocatedEN = Math.max(0, totalPoints - allocatedHP);
            en = baseEN + allocatedEN;
        }
        spent = allocatedHP + allocatedEN;
        remaining = totalPoints - spent;
    }
    document.getElementById('hitEnergyTotal').textContent = remaining;
    hpInput.value = hp;
    enInput.value = en;
    document.getElementById('decreaseHitPoints').disabled = hp <= baseHP;
    document.getElementById('decreaseEnergy').disabled = en <= baseEN;
    document.getElementById('increaseHitPoints').disabled = remaining <= 0;
    document.getElementById('increaseEnergy').disabled = remaining <= 0;
}

export function updateInnateInfo() {
    const level = document.getElementById("creatureLevel").value || 1;
    const innatePowers = getInnatePowers(level);
    const innateEnergy = getInnateEnergy(innatePowers);
    document.getElementById("innatePowers").textContent = innatePowers;
    document.getElementById("innateEnergy").textContent = innateEnergy;
    document.getElementById("summaryInnatePowers").textContent = innatePowers;
    document.getElementById("summaryInnateEnergy").textContent = innateEnergy;
}

export function updateCreatureDetailsBox() {
    const level = document.getElementById("creatureLevel")?.value || 1;
    const highestAbility = getHighestAbility();
    // Use new base TP formula
    const baseTP = getBaseTP(level, highestAbility);
    const detailsTP = document.getElementById("detailsTP");
    if (detailsTP) {
        const creatureData = {
            armaments,
            powersTechniques,
        };
        const adjustedTP = calculateCreatureTPSpent(creatureData, itemPropertiesData, powerPartsData, techniquePartsData);
        const currentTP = baseTP - adjustedTP;
        detailsTP.textContent = `${currentTP} / ${baseTP}`;
        detailsTP.style.color = currentTP < 0 ? "red" : "";
    }
    // Update Feat Points
    const detailsFeatPoints = document.getElementById("detailsFeatPoints");
    if (detailsFeatPoints) {
        const remaining = getRemainingFeatPointsWithBackground ? getRemainingFeatPointsWithBackground() : getRemainingFeatPoints();
        detailsFeatPoints.textContent = remaining.toFixed(1).replace(/\.0$/, "");
        detailsFeatPoints.style.color = remaining < 0 ? "red" : "";
    }
    // Update Skill Points
    const detailsSkillPoints = document.getElementById("detailsSkillPoints");
    if (detailsSkillPoints) {
        const skillPoints = getSkillPointsRemaining();
        detailsSkillPoints.textContent = skillPoints;
        detailsSkillPoints.style.color = skillPoints < 0 ? "red" : "";
    }
    // Update Currency
    const detailsCurrency = document.getElementById("detailsCurrency");
    if (detailsCurrency) {
        const currency = getCreatureCurrency(level);
        detailsCurrency.textContent = currency;
        detailsCurrency.style.color = "";
    }
}

export function updateSummary() {
    document.getElementById("summaryName").textContent = document.getElementById("creatureName").value || "-";
    document.getElementById("summaryLevel").textContent = document.getElementById("creatureLevel").value || "-";
    document.getElementById("summaryType").textContent = document.getElementById("creatureType").value || "-";
    document.getElementById("summaryResistances").textContent = resistances.slice().sort().join(", ") || "None";
    const allImmunities = [...immunities, ...conditionImmunities].map(x => String(x)).filter(Boolean);
    allImmunities.sort((a, b) => a.localeCompare(b));
    document.getElementById("summaryImmunities").textContent = allImmunities.length ? allImmunities.join(", ") : "None";
    document.getElementById("summarySenses").textContent = senses
        .slice()
        .sort()
        .map(s => SENSES_DISPLAY[s] || s)
        .join(", ") || "None";
    const others = movement.slice().sort((a, b) => a.type.localeCompare(b.type));
    let movementSummary = others.map(m => MOVEMENT_DISPLAY[m.type] || m.type);
    document.getElementById("summaryMovement").textContent = movementSummary.length ? movementSummary.join(", ") : "None";
    const remaining = getRemainingFeatPointsWithBackground();
    const featPointsElem = document.getElementById("summaryFeatPoints");
    if (featPointsElem) {
        featPointsElem.textContent = remaining.toFixed(1).replace(/\.0$/, "");
        featPointsElem.style.color = remaining < 0 ? "red" : "";
    }
    const summarySkillsElem = document.getElementById("summarySkills");
    if (summarySkillsElem) {
        const skillSummaries = creatureSkills
            .slice()
            .sort((a, b) => a.localeCompare(b))
            .map(skillName => {
                const skillObj = findByIdOrName(skills, { name: skillName });
                if (!skillObj) return "";
                const bonus = getSkillBonus(skillObj);
                const sign = bonus >= 0 ? "+" : "";
                return `${skillName} ${sign}${bonus}`;
            })
            .filter(Boolean);
        summarySkillsElem.textContent = skillSummaries.length ? skillSummaries.join(", ") : "None";
    }
    const summaryLanguagesElem = document.getElementById("summaryLanguages");
    if (summaryLanguagesElem) {
        const langs = creatureLanguages.slice().sort((a, b) => a.localeCompare(b));
        summaryLanguagesElem.textContent = langs.length ? langs.join(", ") : "None";
    }
    // --- Archetype Proficiency summary ---
    const profLabelElem = document.getElementById("summaryProfLabel");
    const profValueElem = document.getElementById("summaryProfValue");
    if (profLabelElem && profValueElem) {
        profLabelElem.textContent = "Power Proficiency: ";
        profValueElem.textContent = getPowerProficiency();
        // Add martial proficiency as well
        if (profValueElem.nextSibling) profValueElem.nextSibling.remove();
        profValueElem.insertAdjacentHTML('afterend', `<span style="margin-left:10px;"><strong>Martial Proficiency:</strong> ${getMartialProficiency()}</span>`);
    }
    // --- Calculate spent TP and adjust total TP ---
    const level = getLevelValue();
    const highestAbility = getHighestAbility();
    // Use new base TP formula
    const baseTP = getBaseTP(level, highestAbility);
    const creatureData = {
        armaments,
        powersTechniques,
    };
    const adjustedTP = calculateCreatureTPSpent(creatureData, itemPropertiesData, powerPartsData, techniquePartsData);
    const currentTP = baseTP - adjustedTP;

    // Update summary with adjusted TP (assuming there's a summary element for TP; add if missing)
    const summaryTPElem = document.getElementById('summaryTP');
    if (summaryTPElem) {
        summaryTPElem.textContent = `${currentTP} / ${baseTP}`;
        summaryTPElem.style.color = currentTP < 0 ? "red" : "";
    }
    updateCreatureDetailsBox();
}

export function renderFeats() {
    const container = document.getElementById("featsContainer");
    container.innerHTML = "";
    feats.forEach((feat, idx) => {
        const row = document.createElement("div");
        row.className = "feat-row";
        const select = document.createElement("select");
        select.style.minWidth = "220px";
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Select Feat";
        select.appendChild(defaultOption);
        // Only show feats with mechanic: false
        allCreatureFeats
            .filter(f => !f.mechanic)
            .forEach(f => {
                const opt = document.createElement("option");
                opt.value = f.name;
                opt.textContent = `${f.name} (${f.feat_points})`;
                if (feat.name === f.name) opt.selected = true;
                select.appendChild(opt);
            });
        select.onchange = e => {
            const selected = findCreatureFeat({ name: e.target.value });
            if (selected) {
                feat.name = selected.name;
                feat.points = selected.feat_points;
            } else {
                feat.name = "";
                feat.points = 0; // No points for blank
            }
            renderFeats();
            updateSummary();
        };
        row.appendChild(select);
        if (feat.name) {
            const selected = findCreatureFeat({ name: feat.name });
            if (selected) {
                const info = document.createElement("span");
                info.style.marginLeft = "10px";
                info.innerHTML = `<strong>${selected.name}</strong> (Feat Points: ${selected.feat_points})<br><span style="font-style:italic;font-size:13px;">${selected.description}</span>`;
                row.appendChild(info);
            }
        }
        const removeBtn = document.createElement("button");
        removeBtn.className = "small-button red-button";
        removeBtn.textContent = "✕";
        removeBtn.onclick = () => { feats.splice(idx, 1); renderFeats(); updateSummary(); };
        row.appendChild(removeBtn);
        container.appendChild(row);
    });
}

export function renderArmaments() {
    const tbody = document.getElementById('armaments-list');
    if (!tbody) return;
    tbody.innerHTML = '';
    armaments.forEach((armament, idx) => {
        const costs = calculateItemCosts(armament.properties || [], itemPropertiesData);
        const { currencyCost, rarity } = calculateCurrencyCostAndRarity(costs.totalCurrency, costs.totalIP);
        const proficiencies = extractProficiencies(armament.properties || [], itemPropertiesData);
        const row = document.createElement('tr');
        row.className = 'armament-row expandable';
        row.onclick = () => {
            row.classList.toggle('expanded');
            const nextRow = row.nextElementSibling;
            if (nextRow && nextRow.classList.contains('details-row')) {
                if (nextRow.style.display === 'none') {
                    nextRow.style.display = 'table-row';
                    nextRow.classList.add('expanded');
                } else {
                    nextRow.classList.remove('expanded');
                    setTimeout(() => nextRow.style.display = 'none', 300);
                }
            }
        };
        row.innerHTML = `
            <td>${armament.name || 'Unnamed'}</td>
            <td>${armament.armamentType || 'Unknown'}</td>
            <td>${costs.totalTP}</td>
            <td>${currencyCost}</td>
            <td>${rarity}</td>
            <td><button class="small-button red-button" onclick="removeArmament(${idx})">Remove</button><span class="expand-icon">▼</span></td>
        `;
        tbody.appendChild(row);

        // Details row
        const detailsRow = document.createElement('tr');
        detailsRow.className = 'details-row';
        detailsRow.style.display = 'none';
        detailsRow.innerHTML = `
            <td colspan="6">
                <div class="library-body">
                    ${armament.description ? `<div class="library-description">${armament.description}</div>` : ''}
                    <div class="library-details">
                        <div class="detail-field">
                            <label>Training Points:</label>
                            <span>${costs.totalTP}</span>
                        </div>
                    </div>
                    ${proficiencies.length > 0 ? `<h4 style="margin:16px 0 8px;color:var(--primary);">Properties & Proficiencies</h4><div class="library-parts">${proficiencies.map(p => `<div class="part-chip proficiency-chip" title="${p.description}">${p.name}${p.level > 0 ? ` (Level ${p.level})` : ''} | TP: ${p.baseTP}${p.optionTP > 0 ? ` + ${p.optionTP}` : ''}</div>`).join('')}</div>` : ''}
                </div>
            </td>
        `;
        tbody.appendChild(detailsRow);
    });
}

export function removeArmament(idx) {
    armaments.splice(idx, 1);
    renderArmaments();
    updateSummary();
}

export function addArmament(item) {
    armaments.push({ ...item });
    renderArmaments();
    updateSummary();
}

export function renderPowers() {
    const tbody = document.getElementById('powers-list');
    if (!tbody) return;
    tbody.innerHTML = '';
    powersTechniques.forEach((item, idx) => {
        if (item.type === 'power') {
            const display = derivePowerDisplay(item, powerPartsData);
            const row = document.createElement('tr');
            row.className = 'power-row expandable';
            row.onclick = () => {
                row.classList.toggle('expanded');
                const nextRow = row.nextElementSibling;
                if (nextRow && nextRow.classList.contains('details-row')) {
                    if (nextRow.style.display === 'none') {
                        nextRow.style.display = 'table-row';
                        nextRow.classList.add('expanded');
                    } else {
                        nextRow.classList.remove('expanded');
                        setTimeout(() => nextRow.style.display = 'none', 300);
                    }
                }
            };
            row.innerHTML = `
                <td>${display.name}</td>
                <td>${display.energy}</td>
                <td>${display.actionType}</td>
                <td>${display.duration}</td>
                <td>${display.range}</td>
                <td>${display.area}</td>
                <td>${display.damageStr || '-'}</td>
                <td><button class="small-button red-button" onclick="removePower(${idx})">Remove</button><span class="expand-icon">▼</span></td>
            `;
            tbody.appendChild(row);

            // Details row
            const detailsRow = document.createElement('tr');
            detailsRow.className = 'details-row';
            detailsRow.style.display = 'none';
            detailsRow.innerHTML = `
                <td colspan="8">
                    <div class="library-body">
                        ${display.description ? `<div class="library-description">${display.description}</div>` : ''}
                        <div class="library-details">
                            <div class="detail-field">
                                <label>Training Points:</label>
                                <span>${display.tp}</span>
                            </div>
                        </div>
                        ${display.partChipsHTML ? `<h4 style="margin:16px 0 8px;color:var(--primary);">Parts & Proficiencies</h4><div class="library-parts">${display.partChipsHTML}</div>` : ''}
                        ${display.tpSources.length > 0 ? `<div class="power-summary-proficiencies"><h4>Proficiencies:</h4><div>${display.tpSources.map(source => `<p>${source}</p>`).join('')}</div></div>` : ''}
                    </div>
                </td>
            `;
            tbody.appendChild(detailsRow);
        }
    });
}

export function renderTechniques() {
    const tbody = document.getElementById('techniques-list');
    if (!tbody) return;
    tbody.innerHTML = '';
    powersTechniques.forEach((item, idx) => {
        if (item.type === 'technique') {
            const partsArr = Array.isArray(item.parts)
                ? item.parts.map(p => ({
                    name: p.name,
                    op_1_lvl: p.op_1_lvl || 0,
                    op_2_lvl: p.op_2_lvl || 0,
                    op_3_lvl: p.op_3_lvl || 0
                }))
                : [];
            const display = deriveTechniqueDisplay({ ...item, parts: partsArr }, techniquePartsData);
            const row = document.createElement('tr');
            row.className = 'technique-row expandable';
            row.onclick = () => {
                row.classList.toggle('expanded');
                const nextRow = row.nextElementSibling;
                if (nextRow && nextRow.classList.contains('details-row')) {
                    if (nextRow.style.display === 'none') {
                        nextRow.style.display = 'table-row';
                        nextRow.classList.add('expanded');
                    } else {
                        nextRow.classList.remove('expanded');
                        setTimeout(() => nextRow.style.display = 'none', 300);
                    }
                }
            };
            row.innerHTML = `
                <td>${display.name}</td>
                <td>${display.energy}</td>
                <td>${display.tp}</td>
                <td>${display.actionType}</td>
                <td>${display.weaponName}</td>
                <td>${display.damageStr}</td>
                <td><button class="small-button red-button" onclick="removePower(${idx})">Remove</button><span class="expand-icon">▼</span></td>
            `;
            tbody.appendChild(row);

            // Details row
            const detailsRow = document.createElement('tr');
            detailsRow.className = 'details-row';
            detailsRow.style.display = 'none';
            detailsRow.innerHTML = `
                <td colspan="7">
                    <div class="library-body">
                        ${display.description ? `<div class="library-description">${display.description}</div>` : ''}
                        <div class="library-details">
                            <div class="detail-field">
                                <label>Training Points:</label>
                                <span>${display.tp}</span>
                            </div>
                        </div>
                        ${display.partChipsHTML ? `<h4 style="margin:16px 0 8px;color:var(--primary);">Technique Parts & Proficiencies</h4><div class="library-parts">${display.partChipsHTML}</div>` : ''}
                        ${display.tpSources.length > 0 ? `<div class="power-summary-proficiencies"><h4>Proficiencies:</h4><div>${display.tpSources.map(source => `<p>${source}</p>`).join('')}</div></div>` : ''}
                    </div>
                </td>
            `;
            tbody.appendChild(detailsRow);
        }
    });
}

export function removePower(idx) {
    powersTechniques.splice(idx, 1);
    renderPowers();
    renderTechniques();
    updateSummary();
}

export function addPower(item) {
    powersTechniques.push({ ...item });
    renderPowers();
    renderTechniques();
    updateSummary();
}

export function addTechnique(item) {
    powersTechniques.push({ ...item });
    renderPowers();
    renderTechniques();
    updateSummary();
}

// Expose functions to window for HTML onclick
window.removeArmament = removeArmament;
window.removePower = removePower;

// Main initialization function to be called from creatureCreator.js
export async function initCreatureCreator(deps = {}) {
    // Load data from shared RTDB cache (uses getDatabase internally)
    const db = getDatabase();
    allCreatureFeats = await fetchCreatureFeats(db);
    itemPropertiesData = await fetchItemProperties(db);
    powerPartsData = await fetchPowerParts(db);
    techniquePartsData = await fetchTechniqueParts(db);

    // Accept skills from deps
    if (deps.skills && Array.isArray(deps.skills)) {
        skills = deps.skills;
    }

    // Setup event listeners for all UI elements

    // Level, Name, Type
    document.getElementById("creatureName").addEventListener("input", () => {
        updateSummary();
        updateCreatureDetailsBox();
    });
    document.getElementById("creatureLevel").addEventListener("input", () => {
        updateSummary();
        updateCreatureAbilityDropdowns();
        updateHealthEnergyUI();
        updateDefensesUI();
        updateCreatureDetailsBox();
    });
    document.getElementById("creatureType").addEventListener("change", () => {
        updateSummary();
        updateCreatureDetailsBox();
    });

    // Resistances
    updateResistancesList();
    document.getElementById("addResistanceBtn").onclick = () => {
        const val = document.getElementById("resistanceDropdown").value;
        if (val && !resistances.includes(val)) {
            resistances.push(val);
            updateResistancesList();
            updateSummary();
        }
    };
    // Remove all resistances button
    if (!document.getElementById("removeAllResistBtn")) {
        const removeAllResistBtn = document.createElement("button");
        removeAllResistBtn.id = "removeAllResistBtn";
        removeAllResistBtn.textContent = "Remove All";
        removeAllResistBtn.className = "small-button red-button";
        removeAllResistBtn.style.marginLeft = "5px";
        removeAllResistBtn.onclick = () => {
            resistances.length = 0;
            updateResistancesList();
            updateSummary();
        };
        document.getElementById("addResistanceBtn").after(removeAllResistBtn);
    }

    // Weaknesses
    updateWeaknessesList();
    document.getElementById("addWeaknessBtn").onclick = () => {
        const val = document.getElementById("weaknessDropdown").value;
        if (val && !weaknesses.includes(val)) {
            weaknesses.push(val);
            updateWeaknessesList();
            updateSummary();
        }
    };
    if (!document.getElementById("removeAllWeakBtn")) {
        const removeAllWeakBtn = document.createElement("button");
        removeAllWeakBtn.id = "removeAllWeakBtn";
        removeAllWeakBtn.textContent = "Remove All";
        removeAllWeakBtn.className = "small-button red-button";
        removeAllWeakBtn.style.marginLeft = "5px";
        removeAllWeakBtn.onclick = () => {
            weaknesses.length = 0;
            updateWeaknessesList();
            updateSummary();
        };
        document.getElementById("addWeaknessBtn").after(removeAllWeakBtn);
    }

    // Immunities
    updateImmunitiesList();
    document.getElementById("addImmunityBtn").onclick = () => {
        const val = document.getElementById("immunityDropdown").value;
        if (val && !immunities.includes(val)) {
            immunities.push(val);
            updateImmunitiesList();
            updateSummary();
        }
    };
    if (!document.getElementById("removeAllImmuneBtn")) {
        const removeAllImmuneBtn = document.createElement("button");
        removeAllImmuneBtn.id = "removeAllImmuneBtn";
        removeAllImmuneBtn.textContent = "Remove All";
        removeAllImmuneBtn.className = "small-button red-button";
        removeAllImmuneBtn.style.marginLeft = "5px";
        removeAllImmuneBtn.onclick = () => {
            immunities.length = 0;
            updateImmunitiesList();
            updateSummary();
        };
        document.getElementById("addImmunityBtn").after(removeAllImmuneBtn);
    }

    // Senses
    updateSensesList();
    document.getElementById("addSenseBtn").onclick = () => {
        const val = document.getElementById("senseDropdown").value;
        if (!val) return;
        const sensesGroups = [
            ["Darkvision", "Darkvision II", "Darkvision III"],
            ["Blindsense", "Blindsense II", "Blindsense III", "Blindsense IV"],
            ["Telepathy", "Telepathy II"],
        ];
        for (const group of sensesGroups) {
            if (group.includes(val)) {
                for (const g of group) {
                    if (g !== val) {
                        const idx = senses.indexOf(g);
                        if (idx !== -1) senses.splice(idx, 1);
                    }
                }
            }
        }
        if (!senses.includes(val)) {
            senses.push(val);
        }
        updateSensesList();
        updateSummary();
    };
    if (!document.getElementById("removeAllSensesBtn")) {
        const removeAllSensesBtn = document.createElement("button");
        removeAllSensesBtn.id = "removeAllSensesBtn";
        removeAllSensesBtn.textContent = "Remove All";
        removeAllSensesBtn.className = "small-button red-button";
        removeAllSensesBtn.style.marginLeft = "5px";
        removeAllSensesBtn.onclick = () => {
            senses.length = 0;
            updateSensesList();
            updateSummary();
        };
        document.getElementById("addSenseBtn").after(removeAllSensesBtn);
    }

    // Movement
    updateMovementList();
    document.getElementById("addMovementBtn").onclick = () => {
        const val = document.getElementById("movementDropdown").value;
        if (!val) return;
        const movementGroups = [
            ["Fly Half", "Fly"],
            ["Burrow", "Burrow II"],
            ["Jump", "Jump II", "Jump III"],
            ["Speedy", "Speedy II", "Speedy III"],
            ["Slow", "Slow II", "Slow III"]
        ];
        for (const group of movementGroups) {
            if (group.includes(val)) {
                for (const g of group) {
                    if (g !== val) {
                        const idx = movement.findIndex(m => m.type === g);
                        if (idx !== -1) {
                            movement.splice(idx, 1);
                        }
                    }
                }
            }
        }
        if (!movement.some(m => m.type === val)) {
            movement.push({ type: val });
        }
        updateMovementList();
        updateSummary();
    };
    if (!document.getElementById("removeAllMoveBtn")) {
        const removeAllMoveBtn = document.createElement("button");
        removeAllMoveBtn.id = "removeAllMoveBtn";
        removeAllMoveBtn.textContent = "Remove All";
        removeAllMoveBtn.className = "small-button red-button";
        removeAllMoveBtn.style.marginLeft = "5px";
        removeAllMoveBtn.onclick = () => {
            movement.length = 0;
            updateMovementList();
            updateSummary();
        };
        document.getElementById("addMovementBtn").after(removeAllMoveBtn);
    }

    // Condition Immunities
    updateConditionImmunityList();
    document.getElementById("addConditionImmunityBtn").onclick = () => {
        const val = document.getElementById("conditionImmunityDropdown").value;
        if (val && !conditionImmunities.includes(val)) {
            conditionImmunities.push(val);
            updateConditionImmunityList();
            updateSummary();
        }
    };

    // Feats
    renderFeats();
    document.getElementById("addFeatBtn").onclick = () => {
        feats.push({ name: "", points: 0 }); // Start with blank feat, no points
        renderFeats();
        updateSummary();
    };

    // Expose removeArmament and removePower to window for HTML onclick
    window.removeArmament = removeArmament;
    window.removePower = removePower;

    // Set window functions for modals
    window.openPowerModal = deps.openPowerModal;
    window.openTechniqueModal = deps.openTechniqueModal;
    window.openArmamentModal = deps.openArmamentModal;

    // Powers/Techniques
    document.getElementById("addPowerBtn").onclick = window.openPowerModal || (() => {});
    document.getElementById("addTechniqueBtn").onclick = window.openTechniqueModal || (() => {});

    // Armaments
    document.getElementById("addArmamentBtn").onclick = window.openArmamentModal || (() => {});

    // Languages
    updateLanguagesList();
    document.getElementById("addLanguageBtn").onclick = () => {
        const input = document.getElementById("languageInput");
        let val = input.value.trim();
        if (!val) return;
        if (!creatureLanguages.some(l => l.toLowerCase() === val.toLowerCase())) {
            creatureLanguages.push(val);
            updateLanguagesList();
            updateSummary();
        }
        input.value = "";
        input.focus();
    };

    // Abilities
    document.querySelectorAll('.creature-ability-dropdown').forEach(dropdown => {
        dropdown.addEventListener('change', () => {
            updateCreatureAbilityDropdowns();
            updateHealthEnergyUI();
            updateDefensesUI();
            updateCreatureDetailsBox();
        });
    });

    // Health/Energy
    function setupHealthEnergyHandlers() {
        const hpInput = document.getElementById('hitPointsInput');
        const enInput = document.getElementById('energyInput');
        const incHP = document.getElementById('increaseHitPoints');
        const decHP = document.getElementById('decreaseHitPoints');
        const incEN = document.getElementById('increaseEnergy');
        const decEN = document.getElementById('decreaseEnergy');
        function changeHP(delta) {
            hpInput.value = parseInt(hpInput.value) + delta;
            updateHealthEnergyUI();
        }
        function changeEN(delta) {
            enInput.value = parseInt(enInput.value) + delta;
            updateHealthEnergyUI();
        }
        incHP.onclick = () => changeHP(1);
        decHP.onclick = () => changeHP(-1);
        incEN.onclick = () => changeEN(1);
        decEN.onclick = () => changeEN(-1);
        hpInput.oninput = updateHealthEnergyUI;
        enInput.oninput = updateHealthEnergyUI;
    }
    setupHealthEnergyHandlers();

    // Defenses
    function setupDefenseSkillButtons() {
        document.querySelectorAll('.defense-plus').forEach(btn => {
            btn.onclick = () => {
                const def = btn.dataset.defense;
                if (getSkillPointsRemaining() >= 2) {
                    defenseSkillState[def] = (defenseSkillState[def] || 0) + 1;
                    updateDefensesUI();
                    updateSummary(); // <-- ensure summary and skill points update
                }
            };
        });
        document.querySelectorAll('.defense-minus').forEach(btn => {
            btn.onclick = () => {
                const def = btn.dataset.defense;
                const base = getBaseDefenseValue(def);
                const current = getBaseDefenseValue(def) + (defenseSkillState[def] || 0);
                if ((defenseSkillState[def] || 0) > 0 && current > base) {
                    defenseSkillState[def] = (defenseSkillState[def] || 0) - 1;
                    updateDefensesUI();
                    updateSummary(); // <-- ensure summary and skill points update
                }
            };
        });
    }
    setupDefenseSkillButtons();

    // Details box toggle
    function setupCreatureDetailsBoxToggle() {
        const box = document.getElementById("creatureDetailsBox");
        const arrow = document.getElementById("creatureDetailsToggle");
        if (!box || !arrow) return;
        arrow.onclick = function(e) {
            e.stopPropagation();
            box.classList.toggle("collapsed");
            arrow.textContent = box.classList.contains("collapsed") ? ">" : "<";
        };
        arrow.style.zIndex = "1002";
    }
    setupCreatureDetailsBoxToggle();

    // Save/Load UI
    if (typeof deps.addSaveLoadCreatureUI === 'function') {
        deps.addSaveLoadCreatureUI();
    }

    // Modal event listeners
    if (typeof deps.setupModalEventListeners === 'function') {
        deps.setupModalEventListeners();
    }

    // Set modal update summary
    if (typeof deps.setModalUpdateSummary === 'function') {
        deps.setModalUpdateSummary(updateSummary);
    }

    // --- Archetype Proficiency allocation logic ---
    function updateArchetypeProficiencyUI() {
        const level = getLevelValue();
        const max = getMaxArchetypeProficiency(level);
        const power = getPowerProficiency();
        const martial = getMartialProficiency();
        const totalElem = document.getElementById('archetypeProficiencyTotal');
        const errorElem = document.getElementById('archetypeProficiencyError');
        totalElem.textContent = `Total: ${power + martial} / ${max}`;
        if ((power + martial) > max || power < 0 || martial < 0) {
            totalElem.style.color = "red";
            errorElem.style.display = "";
            errorElem.textContent = "You cannot allocate more than the allowed total proficiency points.";
        } else {
            totalElem.style.color = "#007bff";
            errorElem.style.display = "none";
        }
    }
    function clampArchetypeProficiencyInputs() {
        const level = getLevelValue();
        const max = getMaxArchetypeProficiency(level);
        const powerInput = document.getElementById('powerProficiencyInput');
        const martialInput = document.getElementById('martialProficiencyInput');
        let power = parseInt(powerInput.value) || 0;
        let martial = parseInt(martialInput.value) || 0;
        if (power < 0) power = 0;
        if (martial < 0) martial = 0;
        if (power + martial > max) {
            // Reduce the one that was just changed
            if (document.activeElement === powerInput) {
                power = Math.max(0, max - martial);
            } else {
                martial = Math.max(0, max - power);
            }
        }
        powerInput.value = power;
        martialInput.value = martial;
    }
    const powerInput = document.getElementById('powerProficiencyInput');
    const martialInput = document.getElementById('martialProficiencyInput');
    if (powerInput && martialInput) {
        powerInput.addEventListener('input', () => {
            clampArchetypeProficiencyInputs();
            updateArchetypeProficiencyUI();
            updateInnateInfo();
            updateSummary();
        });
        martialInput.addEventListener('input', () => {
            clampArchetypeProficiencyInputs();
            updateArchetypeProficiencyUI();
            updateInnateInfo();
            updateSummary();
        });
    }
    // Update on level change as well
    document.getElementById("creatureLevel").addEventListener("input", () => {
        clampArchetypeProficiencyInputs();
        updateArchetypeProficiencyUI();
        updateInnateInfo();
        updateSummary();
    });
    // Initial update
    clampArchetypeProficiencyInputs();
    updateArchetypeProficiencyUI();

    // Initial updates
    updateInnateInfo();
    updateCreatureAbilityDropdowns();
    updateHealthEnergyUI();
    updateDefensesUI();
    updateSummary();
    updateCreatureDetailsBox(); // Ensure details box is correct on load
}

function addFeatByName(featName) {
    // Only add if not already present
    if (!feats.some(f => f.name === featName)) {
        const featData = findCreatureFeat({ name: featName });
        if (featData) {
            feats.push({ name: featData.name, points: featData.feat_points });
            renderFeats();
            updateSummary();
        }
    }
}
