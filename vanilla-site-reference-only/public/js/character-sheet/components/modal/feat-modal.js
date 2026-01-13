/**
 * Feat Modal
 * Handles adding archetype and character feats from the RTDatabase
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
import { getCharacterResourceTracking, validateFeatAddition } from '../../validation.js';
import { renderAbilities } from '../abilities.js';
import { toStrArray, toNumArray } from '../../../shared/array-utils.js';

// --- Feat state ---
let allFeats = [];
let filteredFeats = [];
let featSortState = { col: 'name', dir: 1 };
let featsLoaded = false;
let selectedFeatType = 'archetype';
let selectedFeatCategory = '';

/**
 * Show the feat selection modal
 * @param {string} featType - 'archetype' or 'character'
 */
export async function showFeatModal(featType = 'archetype') {
    await initFirebase();
    selectedFeatType = featType;
    selectedFeatCategory = '';
    openResourceModal();
    
    const title = document.getElementById('resource-modal-title');
    if (title) title.textContent = featType === 'archetype' ? 'Add Archetype Feat' : 'Add Character Feat';
    
    const body = document.getElementById('resource-modal-body');
    if (!body) return;
    body.innerHTML = '<div class="modal-loading">Loading feats...</div>';
    
    if (!featsLoaded) {
        try {
            const snap = await getWithRetry('feats');
            const data = snap.val();
            allFeats = Object.values(data).map(f => ({
                ...f,
                ability_req: toStrArray(f.ability_req),
                abil_req_val: toNumArray(f.abil_req_val),
                skill_req: toStrArray(f.skill_req),
                skill_req_val: toNumArray(f.skill_req_val),
                lvl_req: parseInt(f.lvl_req) || 0,
                char_feat: f.char_feat || false,
                state_feat: f.state_feat || false,
            }));
            featsLoaded = true;
        } catch (e) {
            body.innerHTML = `<div class="modal-error">Error loading feats.<br>${e.message || e}</div>`;
            return;
        }
    }
    
    renderFeatModal(body);
}

/**
 * Roman numeral utilities for feat leveling
 */
const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const ROMAN_TO_NUM = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10 };

/**
 * Parse a feat name to extract base name and roman numeral level
 * @param {string} name - Feat name like "Action Surge II"
 * @returns {{ baseName: string, level: number, hasLevel: boolean }}
 */
function parseFeatLevel(name) {
    if (!name) return { baseName: name, level: 1, hasLevel: false };
    
    // Check for roman numeral at the end (with space before it)
    const match = name.match(/^(.+?)\s+(I{1,3}|IV|VI{0,3}|IX|X)$/i);
    if (match) {
        const baseName = match[1].trim();
        const roman = match[2].toUpperCase();
        const level = ROMAN_TO_NUM[roman] || 1;
        return { baseName, level, hasLevel: true };
    }
    
    // No roman numeral - this is level 1 (base feat)
    return { baseName: name, level: 1, hasLevel: false };
}

/**
 * Get the prerequisite feat name for a leveled feat
 * @param {string} name - Feat name like "Action Surge II"
 * @returns {string|null} - Prerequisite feat name or null if none needed
 */
function getPrerequisiteFeat(name) {
    const parsed = parseFeatLevel(name);
    if (parsed.level <= 1) return null; // Level 1 feats have no prerequisite
    
    const prevLevel = parsed.level - 1;
    if (prevLevel === 1) {
        // Previous level is the base feat (no numeral)
        return parsed.baseName;
    }
    // Previous level has a roman numeral
    return `${parsed.baseName} ${ROMAN_NUMERALS[prevLevel - 1]}`;
}

/**
 * Get the feat name that this feat replaces (the lower level version)
 * @param {string} name - Feat name like "Action Surge III"
 * @returns {string|null} - Feat to replace or null
 */
function getFeatToReplace(name) {
    return getPrerequisiteFeat(name); // Same as prerequisite
}

/**
 * Check if character meets feat requirements
 */
function checkFeatRequirements(feat, charData) {
    const issues = [];
    const level = charData.level || 1;
    
    if (feat.lvl_req && level < feat.lvl_req) {
        issues.push(`Level ${feat.lvl_req} required`);
    }
    
    if (feat.ability_req && feat.ability_req.length > 0) {
        const abilities = charData.abilities || {};
        for (let i = 0; i < feat.ability_req.length; i++) {
            const reqAbil = feat.ability_req[i];
            const reqVal = feat.abil_req_val?.[i] || 0;
            const charVal = abilities[reqAbil.toLowerCase()] || 0;
            if (charVal < reqVal) {
                issues.push(`${reqAbil} ${reqVal} required (have ${charVal})`);
            }
        }
    }
    
    if (feat.skill_req && feat.skill_req.length > 0) {
        const skillsArray = Array.isArray(charData.skills) ? charData.skills : [];
        const abilities = charData.abilities || {};
        
        for (let i = 0; i < feat.skill_req.length; i++) {
            const reqSkill = feat.skill_req[i];
            const reqVal = feat.skill_req_val?.[i] || 0;
            
            // Find the skill by name (case insensitive)
            const skill = skillsArray.find(s => s.name && s.name.toLowerCase() === reqSkill.toLowerCase());
            
            if (!skill || !skill.prof) {
                // Skill not found or not proficient
                issues.push(`${reqSkill} proficiency required (not proficient)`);
            } else {
                // Calculate skill bonus: ability value + skill_val
                const abilityName = skill.ability || '';
                const abilityValue = abilities[abilityName.toLowerCase()] || 0;
                const skillVal = skill.skill_val || 0;
                const bonus = abilityValue + skillVal;
                
                if (bonus < reqVal) {
                    issues.push(`${reqSkill} +${reqVal} required (have +${bonus})`);
                }
            }
        }
    }
    
    if (feat.mart_prof_req) {
        const martProf = charData.mart_prof || 0;
        if (martProf < parseInt(feat.mart_prof_req)) {
            issues.push(`Martial Prof ${feat.mart_prof_req} required`);
        }
    }
    if (feat.pow_prof_req) {
        const powProf = charData.pow_prof || 0;
        if (powProf < parseInt(feat.pow_prof_req)) {
            issues.push(`Power Prof ${feat.pow_prof_req} required`);
        }
    }
    
    // Check for prerequisite feat (roman numeral leveling)
    const prereqFeat = getPrerequisiteFeat(feat.name);
    if (prereqFeat) {
        const featsArray = charData.feats || [];
        const hasPrereq = featsArray.some(f => {
            const name = typeof f === 'string' ? f : f?.name;
            return name === prereqFeat;
        });
        if (!hasPrereq) {
            issues.push(`Requires "${prereqFeat}" feat`);
        }
    }
    
    return { met: issues.length === 0, issues };
}

function renderFeatModal(container) {
    const charData = getCharacterData();
    const tracking = charData ? getCharacterResourceTracking(charData) : null;
    const featTracking = selectedFeatType === 'archetype' ? tracking?.feats?.archetype : tracking?.feats?.character;
    const remaining = featTracking?.remaining ?? '?';
    const max = featTracking?.max ?? '?';
    
    let typeFilteredFeats = allFeats.filter(f => {
        if (selectedFeatType === 'archetype') return !f.char_feat;
        return f.char_feat;
    });
    
    const categories = Array.from(new Set(typeFilteredFeats.map(f => f.category).filter(Boolean))).sort();
    // Three-state: green (has-points) if remaining > 0, blue (no-points) if remaining == 0, red (over-budget) if remaining < 0
    const remainingClass = remaining > 0 ? 'has-points' : (remaining < 0 ? 'over-budget' : 'no-points');
    
    container.innerHTML = `
        <div class="modal-header-info">
            <span class="feat-slots-badge ${remainingClass}">${remaining} / ${max} slots remaining</span>
        </div>
        <div class="modal-filters">
            <input id="modal-feat-search" type="text" class="modal-search" placeholder="Search feats...">
            <select id="modal-feat-category" class="modal-select">
                <option value="">All Categories</option>
                ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
            <label class="modal-checkbox-label">
                <input type="checkbox" id="modal-feat-eligible" class="modal-checkbox" checked>
                Show only eligible
            </label>
        </div>
        <div class="modal-table-container">
            <table class="modal-table">
                <thead>
                    <tr>
                        <th data-col="name" class="sortable">Name</th>
                        <th data-col="lvl_req" class="sortable">Lvl</th>
                        <th data-col="category" class="sortable">Category</th>
                        <th>Requirements</th>
                        <th style="width:80px;"></th>
                    </tr>
                </thead>
                <tbody id="modal-feat-tbody"></tbody>
            </table>
        </div>
    `;
    
    document.getElementById('modal-feat-search').addEventListener('input', applyFeatFilters);
    document.getElementById('modal-feat-category').addEventListener('change', e => {
        selectedFeatCategory = e.target.value;
        applyFeatFilters();
    });
    document.getElementById('modal-feat-eligible').addEventListener('change', applyFeatFilters);
    
    container.querySelectorAll('.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const col = th.getAttribute('data-col');
            if (featSortState.col === col) {
                featSortState.dir *= -1;
            } else {
                featSortState.col = col;
                featSortState.dir = 1;
            }
            applyFeatFilters();
        });
    });
    
    applyFeatFilters();
}

function applyFeatFilters() {
    const charData = getCharacterData();
    const search = document.getElementById('modal-feat-search')?.value?.toLowerCase() || '';
    const onlyEligible = document.getElementById('modal-feat-eligible')?.checked ?? true;
    
    let typeFiltered = allFeats.filter(f => {
        if (selectedFeatType === 'archetype') return !f.char_feat;
        return f.char_feat;
    });
    
    filteredFeats = typeFiltered.filter(f => {
        if (search && !f.name.toLowerCase().includes(search) && !(f.description && f.description.toLowerCase().includes(search))) return false;
        if (selectedFeatCategory && f.category !== selectedFeatCategory) return false;
        
        if (charData) {
            const featsArray = charData.feats || [];
            const alreadyHas = featsArray.some(existing => {
                const name = typeof existing === 'string' ? existing : existing?.name;
                return name === f.name;
            });
            if (alreadyHas) return false;
        }
        
        if (onlyEligible && charData) {
            const req = checkFeatRequirements(f, charData);
            if (!req.met) return false;
        }
        
        return true;
    });
    
    applySort(filteredFeats, featSortState, featSortState.col);
    renderFeatTable();
}

function renderFeatTable() {
    const tbody = document.getElementById('modal-feat-tbody');
    if (!tbody) return;
    
    const charData = getCharacterData();
    const tracking = charData ? getCharacterResourceTracking(charData) : null;
    const featTracking = selectedFeatType === 'archetype' ? tracking?.feats?.archetype : tracking?.feats?.character;
    const canAdd = (featTracking?.remaining ?? 0) > 0;
    
    if (filteredFeats.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="modal-empty">No feats match your filters.</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredFeats.map(f => {
        const req = charData ? checkFeatRequirements(f, charData) : { met: true, issues: [] };
        const reqText = [];
        
        if (f.lvl_req) reqText.push(`Lvl ${f.lvl_req}`);
        if (f.ability_req?.length) {
            const abilReqs = f.ability_req.map((a, i) => `${a} ${f.abil_req_val?.[i] || 0}`).join(', ');
            reqText.push(abilReqs);
        }
        if (f.skill_req?.length) {
            const skillReqs = f.skill_req.map((s, i) => `${s} ${f.skill_req_val?.[i] || 0}`).join(', ');
            reqText.push(skillReqs);
        }
        
        // Allow adding feats even when overspent or requirements not met
        // Button styling indicates status: green (slots available + met), blue (slots full + met), red (unmet requirements)
        let btnClass = 'modal-add-btn';
        let btnTitle = 'Add feat';
        if (!req.met) {
            btnClass += ' btn-unmet';
            btnTitle = `Requirements not met: ${req.issues.join(', ')}`;
        } else if (!canAdd) {
            btnClass += ' btn-overspend';
            btnTitle = 'Will overspend feat slots';
        }
        
        return `
            <tr class="${req.met ? '' : 'row-unmet'}">
                <td><strong>${f.name}</strong></td>
                <td>${f.lvl_req || '-'}</td>
                <td>${f.category || '-'}</td>
                <td class="requirements-cell ${req.met ? '' : 'unmet'}">${reqText.join('; ') || '-'}</td>
                <td>
                    <button class="${btnClass}" 
                            onclick="window.addFeatToCharacter('${encodeURIComponent(f.name)}', '${selectedFeatType}', ${!req.met})"
                            title="${btnTitle}">
                        Add
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Add a feat to the character
 * @param {string} encodedName - URL-encoded feat name
 * @param {string} featType - 'archetype' or 'character'
 * @param {boolean} unmetRequirements - Whether the feat has unmet requirements
 */
window.addFeatToCharacter = async function(encodedName, featType, unmetRequirements = false) {
    const name = decodeURIComponent(encodedName);
    const charData = getCharacterData();
    
    if (!charData) {
        alert('Character data not loaded.');
        return;
    }
    
    // Allow overspending - just proceed without validation blocking
    // The UI will show red styling if overspent
    
    if (!Array.isArray(charData.feats)) charData.feats = [];
    
    const alreadyHas = charData.feats.some(f => {
        const featName = typeof f === 'string' ? f : f?.name;
        return featName === name;
    });
    
    if (!alreadyHas) {
        // Check if this is a leveled feat that should replace a lower level version
        const featToReplace = getFeatToReplace(name);
        if (featToReplace) {
            // Remove the lower level version
            charData.feats = charData.feats.filter(f => {
                const featName = typeof f === 'string' ? f : f?.name;
                return featName !== featToReplace;
            });
        }
        
        // Store feat with unmet requirements flag if applicable
        if (unmetRequirements) {
            charData.feats.push({ name: name, unmetRequirements: true });
        } else {
            charData.feats.push(name);
        }
    }
    
    if (window.scheduleAutoSave) window.scheduleAutoSave();
    
    // Refresh library first (this will re-enrich the character data)
    await refreshLibraryAfterChange(charData, 'feats');
    
    // Then refresh abilities section to update feat point tracking (now with enriched data)
    try {
        const calculatedData = window.getCalculatedData ? window.getCalculatedData() : {};
        renderAbilities(charData, calculatedData);
    } catch (e) {
        // Ignore if abilities section not available
    }
    
    closeResourceModal();
    const warningMsg = unmetRequirements ? ' (requirements not met)' : '';
    const replacedMsg = getFeatToReplace(name) ? ` (replaced ${getFeatToReplace(name)})` : '';
    if (typeof window.showNotification === 'function') window.showNotification(`Added "${name}" feat${warningMsg}${replacedMsg}.`, unmetRequirements ? 'warning' : 'success');
};

/**
 * Remove a feat from the character
 */
window.removeFeatFromCharacter = async function(encodedName, featType) {
    const name = decodeURIComponent(encodedName);
    const charData = getCharacterData();
    
    if (!charData) {
        alert('Character data not loaded.');
        return;
    }
    
    if (Array.isArray(charData.feats)) {
        charData.feats = charData.feats.filter(f => {
            if (typeof f === 'string') return f !== name;
            if (f && typeof f === 'object') return f.name !== name;
            return true;
        });
    }
    
    if (window.scheduleAutoSave) window.scheduleAutoSave();
    
    // Refresh library first (this will re-enrich the character data)  
    await refreshLibraryAfterChange(charData, 'feats');
    
    // Then refresh abilities section to update feat point tracking (now with enriched data)
    try {
        const calculatedData = window.getCalculatedData ? window.getCalculatedData() : {};
        renderAbilities(charData, calculatedData);
    } catch (e) {
        // Ignore if abilities section not available
    }
    
    if (typeof window.showNotification === 'function') window.showNotification(`Removed "${name}" feat.`, 'success');
};

// Export to window
window.showFeatModal = showFeatModal;
