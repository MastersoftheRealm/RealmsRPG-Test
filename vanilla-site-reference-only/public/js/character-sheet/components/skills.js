import { formatBonus } from '../utils.js';
import { calculateSkillPoints } from '../level-progression.js';
import { fetchSkills, fetchSpecies } from '../../core/rtdb-cache.js';
import { renderAbilities } from './abilities.js';
import { findByIdOrName } from '/js/shared/id-constants.js';

// Track if skills are being edited
let isEditingSkills = false;

// Cache for skills data from RTDB
let skillsDataCache = null;
let speciesDataCache = null;

// Load skills data from RTDB
async function loadSkillsData() {
    if (skillsDataCache) return skillsDataCache;
    try {
        const data = await fetchSkills();
        skillsDataCache = data || {};
        return skillsDataCache;
    } catch (e) {
        console.error('[skills] Failed to load skills data:', e);
        return {};
    }
}

// Load species data from RTDB
async function loadSpeciesData() {
    if (speciesDataCache) return speciesDataCache;
    try {
        const data = await fetchSpecies();
        speciesDataCache = data || {};
        return speciesDataCache;
    } catch (e) {
        console.error('[skills] Failed to load species data:', e);
        return {};
    }
}

// Get skills granted by species
function getSpeciesSkills(charData, speciesData) {
    if (!charData.species || !speciesData) return [];
    const speciesEntry = findByIdOrName(Object.values(speciesData), { id: charData.speciesId, name: charData.species });
    return speciesEntry?.skills || [];
}

// Check if a skill is from species
function isSkillFromSpecies(skillName, speciesSkills) {
    return speciesSkills.includes(skillName);
}

// Check if a skill is a sub-skill by looking up in RTDB data
function isSubSkill(skillName, skillsData) {
    const skillEntry = findByIdOrName(Object.values(skillsData || {}), { name: skillName });
    return skillEntry?.base_skill ? skillEntry.base_skill : null;
}

// Get skill info from RTDB
function getSkillInfo(skillName, skillsData) {
    return findByIdOrName(Object.values(skillsData || {}), { name: skillName }) || null;
}

// Helper to refresh abilities section when skill points change
function refreshAbilitiesSection(charData) {
    // Only refresh if the abilities section is visible/rendered
    try {
        // Get calculated data for abilities render
        const calculatedData = window.getCalculatedData ? window.getCalculatedData() : {};
        renderAbilities(charData, calculatedData);
    } catch (e) {
        // Ignore if abilities section not available
    }
}

// Toggle skill editing mode
window.toggleSkillsEditor = function() {
    isEditingSkills = !isEditingSkills;
    // window.currentCharacterData is a function that returns the data
    const charData = typeof window.currentCharacterData === 'function' 
        ? window.currentCharacterData() 
        : window.currentCharacterData;
    if (charData) renderSkills(charData);
};

// Calculate spent skill points:
// - Sum of all skill_val from all skills
// - Plus 1 for each proficient skill that is not a sub-skill
function calculateSpentSkillPoints(skills, skillsData, speciesSkills) {
    let spent = 0;
    
    (skills || []).forEach(skill => {
        const baseSkillName = skill.baseSkill || isSubSkill(skill.name, skillsData);
        
        // Add skill_val for all skills
        spent += skill.skill_val || 0;
        
        // Add 1 for proficiency only for non-sub-skills
        if (skill.prof && !baseSkillName) {
            spent += 1;
        }
    });
    
    return spent;
}

// Calculate defense skill points spent
function calculateDefenseSkillPoints(defenseVals) {
    return Object.values(defenseVals || {}).reduce((sum, val) => sum + (val * 2), 0);
}

// Get skill point tracking (includes defense spending for proper sync with ability editing)
function getSkillPointTracking(charData, skillsData, speciesSkills) {
    const level = charData.level || 1;
    const total = calculateSkillPoints(level);
    const skillsSpent = calculateSpentSkillPoints(charData.skills, skillsData, speciesSkills);
    const defenseSpent = calculateDefenseSkillPoints(charData.defenseVals);
    const totalSpent = skillsSpent + defenseSpent;
    const remaining = total - totalSpent;
    return { total, spent: totalSpent, remaining, skillsSpent, defenseSpent };
}

export async function renderSkills(charData) {
    const container = document.getElementById('skills-column');
    container.innerHTML = '';
    
    const isEditMode = document.body.classList.contains('edit-mode');
    
    // Load skills and species data from RTDB
    const skillsData = await loadSkillsData();
    const speciesData = await loadSpeciesData();
    const speciesSkills = getSpeciesSkills(charData, speciesData);
    
    // Separate skills into base skills and sub-skills based on RTDB data or baseSkill property
    const allSkills = charData.skills || [];
    const baseSkills = [];
    const subSkills = [];
    
    allSkills.forEach(skill => {
        // First check if skill already has baseSkill property (set when added via modal)
        // Otherwise check RTDB data
        const baseSkillName = skill.baseSkill || isSubSkill(skill.name, skillsData);
        if (baseSkillName) {
            subSkills.push({ ...skill, baseSkill: baseSkillName });
        } else {
            baseSkills.push(skill);
        }
    });
    
    // Helper: for unprof bonuses, if ability is negative, double it; otherwise divide by 2 rounded down
    const unprofBonus = (abilityValue) => {
        return abilityValue < 0 ? abilityValue * 2 : Math.floor(abilityValue / 2);
    };
    
    // Skills Section (base skills)
    const skillsSection = document.createElement('div');
    skillsSection.className = 'skills-section';
    
    // Build header with optional edit icon
    let headerHtml = '<div class="section-title">SKILLS</div>';
    if (isEditMode) {
        const tracking = getSkillPointTracking(charData, skillsData, speciesSkills);
        // Three states: over-budget (red), has-points (green), no-points (blue)
        let penClass;
        if (tracking.remaining < 0) {
            penClass = 'over-budget';
        } else if (tracking.remaining > 0) {
            penClass = 'has-points';
        } else {
            penClass = 'no-points';
        }
        headerHtml = `
            <div class="skills-header-row">
                <div class="section-title">SKILLS</div>
                <span class="edit-section-toggle ${penClass}" onclick="window.toggleSkillsEditor()" title="Edit skills">🖉</span>
            </div>
        `;
    }
    skillsSection.innerHTML = headerHtml;
    
    // Show skill point tracker when editing
    if (isEditMode && isEditingSkills) {
        const tracking = getSkillPointTracking(charData, skillsData, speciesSkills);
        // Three states: over-budget (red), has-points (green), no-points (blue)
        let trackerClass;
        if (tracking.remaining < 0) {
            trackerClass = 'over-budget';
        } else if (tracking.remaining > 0) {
            trackerClass = 'has-points';
        } else {
            trackerClass = 'no-points';
        }
        const trackerHtml = `
            <div class="skill-point-tracker">
                <div class="tracker-row">
                    <span class="tracker-label">Skill Points:</span>
                    <span class="tracker-value ${trackerClass}">${tracking.remaining} / ${tracking.total}</span>
                </div>
                <button class="skill-add-btn" onclick="window.showSkillModal()">+ Add Skill</button>
            </div>
        `;
        skillsSection.insertAdjacentHTML('beforeend', trackerHtml);
    }
    
    const skillsTable = document.createElement('table');
    skillsTable.className = 'skills-table';
    
    // Header differs in edit mode - note: remove column only shown when editing
    if (isEditMode && isEditingSkills) {
        skillsTable.innerHTML = `
            <thead>
                <tr>
                    <th style="width:40px;">PROF.</th>
                    <th>SKILL</th>
                    <th style="width:80px;">ABILITY</th>
                    <th style="width:100px;">BONUS</th>
                </tr>
            </thead>
            <tbody id="skills-tbody"></tbody>
        `;
    } else {
        skillsTable.innerHTML = `
            <thead>
                <tr>
                    <th style="width:40px;">PROF.</th>
                    <th>SKILL</th>
                    <th style="width:60px;">ABILITY</th>
                    <th style="width:60px;">BONUS</th>
                </tr>
            </thead>
            <tbody id="skills-tbody"></tbody>
        `;
    }
    
    const skillsTbody = skillsTable.querySelector('#skills-tbody');
    
    if (baseSkills.length > 0) {
        baseSkills.forEach((skill) => {
            // Find original index in charData.skills
            const originalIdx = allSkills.findIndex(s => s.name === skill.name);
            const row = document.createElement('tr');
            // Blue when proficient, rust orange when not
            const profDotClass = skill.prof ? 'prof-dot-blue' : 'prof-dot-orange';
            const skillInfo = getSkillInfo(skill.name, skillsData);
            const availableAbilities = skillInfo?.ability || [];
            const abilityName = skill.ability || (availableAbilities[0]) || '';
            const abilityAbbr = abilityName ? abilityName.substring(0, 3).toUpperCase() : 'N/A';
            
            // Check if this skill is from species (locked)
            const isFromSpecies = isSkillFromSpecies(skill.name, speciesSkills);
            
            // Calculate skill bonus: prof ? (ability + skill_val) : unprofBonus(ability)
            const abilityValue = charData.abilities?.[abilityName?.toLowerCase()] || 0;
            const skillVal = skill.skill_val || 0;
            const bonus = skill.prof ? (abilityValue + skillVal) : unprofBonus(abilityValue);
            
            if (isEditMode && isEditingSkills) {
                // Build ability cell - always show dropdown if multiple abilities available (even for species skills)
                let abilityCellHtml;
                if (availableAbilities.length > 1) {
                    const options = availableAbilities.map(ab => {
                        const abbr = ab.substring(0, 3).toUpperCase();
                        const selected = ab === abilityName ? 'selected' : '';
                        return `<option value="${ab}" ${selected}>${abbr}</option>`;
                    }).join('');
                    abilityCellHtml = `<select class="ability-select" data-skill-idx="${originalIdx}">${options}</select>`;
                } else {
                    abilityCellHtml = `<span class="ability-abbr">${abilityAbbr}</span>`;
                }
                
                // Prof dot - clickable only if not from species
                const profDotHtml = isFromSpecies
                    ? `<span class="prof-dot ${profDotClass}" title="Species skill proficiency (locked)"></span>`
                    : `<span class="prof-dot ${profDotClass} clickable" data-skill-idx="${originalIdx}" title="Toggle proficiency"></span>`;
                
                // Skill name with species indicator and remove button
                const skillNameHtml = isFromSpecies
                    ? `${skill.name} <span class="species-skill-tag">(Species)</span>`
                    : `${skill.name} <button class="skill-remove-btn" data-skill-idx="${originalIdx}" title="Remove skill">✕</button>`;
                
                row.innerHTML = `
                    <td>${profDotHtml}</td>
                    <td class="skill-name">${skillNameHtml}</td>
                    <td>${abilityCellHtml}</td>
                    <td class="skill-bonus-cell">
                        <button class="skill-adjust-btn" data-skill-idx="${originalIdx}" data-dir="-1">−</button>
                        <span class="skill-bonus-display">${formatBonus(bonus)}</span>
                        <button class="skill-adjust-btn" data-skill-idx="${originalIdx}" data-dir="1">+</button>
                    </td>
                `;
            } else {
                row.innerHTML = `
                    <td><span class="prof-dot ${profDotClass}"></span></td>
                    <td class="skill-name">${skill.name}</td>
                    <td class="ability-abbr">${abilityAbbr}</td>
                    <td><button class="bonus-button" onclick="rollSkill('${skill.name}', ${bonus})">${formatBonus(bonus)}</button></td>
                `;
            }
            
            skillsTbody.appendChild(row);
        });
    } else {
        const colspan = isEditMode && isEditingSkills ? 5 : 4;
        skillsTbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align:center;color:var(--text-secondary);">No skills selected</td></tr>`;
    }
    
    skillsSection.appendChild(skillsTable);
    container.appendChild(skillsSection);
    
    // Sub-Skills Section
    const subSkillsSection = document.createElement('div');
    subSkillsSection.className = 'subskills-section';
    subSkillsSection.innerHTML = '<div class="section-title">SUB-SKILLS</div>';
    
    // Show add subskill button in edit mode if there are proficient base skills
    if (isEditMode && isEditingSkills) {
        const hasProficientBaseSkills = baseSkills.some(s => s.prof);
        if (hasProficientBaseSkills) {
            subSkillsSection.insertAdjacentHTML('beforeend', `
                <div class="skill-point-tracker" style="margin-bottom:12px;">
                    <button class="skill-add-btn" onclick="window.showSubSkillModal()">+ Add Sub-Skill</button>
                </div>
            `);
        }
    }
    
    const subSkillsTable = document.createElement('table');
    subSkillsTable.className = 'subskills-table';
    
    if (isEditMode && isEditingSkills) {
        subSkillsTable.innerHTML = `
            <thead>
                <tr>
                    <th style="width:40px;">PROF.</th>
                    <th style="width:50px;">BASE</th>
                    <th>SKILL</th>
                    <th style="width:80px;">ABILITY</th>
                    <th style="width:100px;">BONUS</th>
                    <th style="width:30px;"></th>
                </tr>
            </thead>
            <tbody id="subskills-tbody"></tbody>
        `;
    } else {
        subSkillsTable.innerHTML = `
            <thead>
                <tr>
                    <th style="width:40px;">PROF.</th>
                    <th style="width:50px;">BASE</th>
                    <th>SKILL</th>
                    <th style="width:60px;">ABILITY</th>
                    <th style="width:60px;">BONUS</th>
                </tr>
            </thead>
            <tbody id="subskills-tbody"></tbody>
        `;
    }
    
    const subSkillsTbody = subSkillsTable.querySelector('#subskills-tbody');
    
    if (subSkills.length > 0) {
        subSkills.forEach((subSkill) => {
            // Find original index in charData.skills
            const originalIdx = allSkills.findIndex(s => s.name === subSkill.name);
            const row = document.createElement('tr');
            const profDotClass = subSkill.prof ? 'prof-dot-blue' : 'prof-dot-orange';
            const skillInfo = getSkillInfo(subSkill.name, skillsData);
            const availableAbilities = skillInfo?.ability || [];
            const abilityName = subSkill.ability || (availableAbilities[0]) || '';
            const abilityAbbr = abilityName ? abilityName.substring(0, 3).toUpperCase() : 'N/A';
            // Truncate base skill name (4 chars)
            const baseAbbr = subSkill.baseSkill ? subSkill.baseSkill.substring(0, 4) : 'N/A';
            
            // Find base skill's skill_val and proficiency
            const baseSkillObj = findByIdOrName(baseSkills, { name: subSkill.baseSkill });
            const baseSkillVal = baseSkillObj?.skill_val || 0;
            const baseSkillProf = baseSkillObj?.prof || false;
            
            // Calculate subskill bonus based on proficiency rules:
            // If base skill is not proficient: can't be proficient with sub-skill
            // - Use unprofBonus(ability) + baseSkillVal
            // If base skill IS proficient but sub-skill is not proficient:
            // - Use ability + baseSkillVal
            // If both base skill and sub-skill are proficient:
            // - Use ability + skill_val + baseSkillVal
            const abilityValue = charData.abilities?.[abilityName?.toLowerCase()] || 0;
            const skillVal = subSkill.skill_val || 0;
            
            let bonus;
            if (!baseSkillProf) {
                // Base skill not proficient: use unproficient calculation
                bonus = unprofBonus(abilityValue) + baseSkillVal;
            } else if (subSkill.prof) {
                // Both proficient: full bonus
                bonus = abilityValue + skillVal + baseSkillVal;
            } else {
                // Base proficient, sub-skill not: ability + base skill val
                bonus = abilityValue + baseSkillVal;
            }
            
            if (isEditMode && isEditingSkills) {
                // Build ability cell - dropdown if multiple abilities available
                let abilityCellHtml;
                if (availableAbilities.length > 1) {
                    const options = availableAbilities.map(ab => {
                        const abbr = ab.substring(0, 3).toUpperCase();
                        const selected = ab === abilityName ? 'selected' : '';
                        return `<option value="${ab}" ${selected}>${abbr}</option>`;
                    }).join('');
                    abilityCellHtml = `<select class="ability-select" data-skill-idx="${originalIdx}">${options}</select>`;
                } else {
                    abilityCellHtml = `<span class="ability-abbr">${abilityAbbr}</span>`;
                }
                
                // Prof dot - clickable only if base skill is proficient
                const profDotHtml = baseSkillProf
                    ? `<span class="prof-dot ${profDotClass} clickable" data-skill-idx="${originalIdx}" title="Toggle proficiency"></span>`
                    : `<span class="prof-dot ${profDotClass}" title="Base skill must be proficient first"></span>`;
                
                row.innerHTML = `
                    <td>${profDotHtml}</td>
                    <td title="${subSkill.baseSkill || ''}">${baseAbbr}</td>
                    <td class="skill-name">${subSkill.name} <button class="skill-remove-btn" data-skill-idx="${originalIdx}" title="Remove sub-skill">✕</button></td>
                    <td>${abilityCellHtml}</td>
                    <td class="skill-bonus-cell">
                        <button class="skill-adjust-btn" data-skill-idx="${originalIdx}" data-dir="-1">−</button>
                        <span class="skill-bonus-display">${formatBonus(bonus)}</span>
                        <button class="skill-adjust-btn" data-skill-idx="${originalIdx}" data-dir="1">+</button>
                    </td>
                `;
            } else {
                row.innerHTML = `
                    <td><span class="prof-dot ${profDotClass}"></span></td>
                    <td title="${subSkill.baseSkill || ''}">${baseAbbr}</td>
                    <td class="skill-name">${subSkill.name}</td>
                    <td class="ability-abbr">${abilityAbbr}</td>
                    <td><button class="bonus-button" onclick="rollSkill('${subSkill.name}', ${bonus})">${formatBonus(bonus)}</button></td>
                `;
            }
            
            subSkillsTbody.appendChild(row);
        });
        
        subSkillsSection.appendChild(subSkillsTable);
        container.appendChild(subSkillsSection);
    } else if (isEditMode && isEditingSkills && baseSkills.some(s => s.prof)) {
        // Show empty subskills section in edit mode if there are proficient base skills
        const colspan = 5;
        subSkillsTbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align:center;color:var(--text-secondary);">No sub-skills</td></tr>`;
        subSkillsSection.appendChild(subSkillsTable);
        container.appendChild(subSkillsSection);
    } else if (subSkills.length === 0 && !isEditMode) {
        // Show empty sub-skills section when not in edit mode for consistency
        subSkillsTbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-secondary);">No sub-skills</td></tr>`;
        subSkillsSection.appendChild(subSkillsTable);
        container.appendChild(subSkillsSection);
    }
    
    // Attach event handlers for edit mode
    if (isEditMode && isEditingSkills) {
        attachSkillEditHandlers(container, charData, skillsData, speciesSkills);
    }
}

function attachSkillEditHandlers(container, charData, skillsData, speciesSkills) {
    // Get all skills for checking base skill proficiency
    const allSkills = charData.skills || [];
    
    // Toggle proficiency for any skill (uses data-skill-idx which is index in charData.skills)
    container.querySelectorAll('.prof-dot.clickable[data-skill-idx]').forEach(dot => {
        dot.addEventListener('click', () => {
            const idx = parseInt(dot.dataset.skillIdx);
            if (charData.skills && charData.skills[idx]) {
                const skill = charData.skills[idx];
                const wasProficient = skill.prof;
                
                // Check if this is a sub-skill
                const baseSkillName = skill.baseSkill || isSubSkill(skill.name, skillsData);
                
                if (baseSkillName) {
                    // This is a sub-skill - check if base skill is proficient
                    const baseSkill = findByIdOrName(allSkills, { name: baseSkillName });
                    if (!baseSkill || !baseSkill.prof) {
                        // Can't be proficient in sub-skill if base skill isn't proficient
                        alert(`You must be proficient in ${baseSkillName} before becoming proficient in this sub-skill.`);
                        return;
                    }
                    
                    // Toggle proficiency
                    skill.prof = !wasProficient;
                    
                    if (!wasProficient) {
                        // Making proficient: ensure skill_val is at least 1
                        if ((skill.skill_val || 0) < 1) {
                            skill.skill_val = 1;
                        }
                    } else {
                        // Removing proficiency: reset skill_val to 0
                        skill.skill_val = 0;
                    }
                } else {
                    // Base skill - toggle normally
                    skill.prof = !wasProficient;
                    
                    // If removing proficiency from base skill, also remove from sub-skills
                    if (wasProficient) {
                        skill.skill_val = 0;
                        // Remove proficiency from all sub-skills of this base skill
                        allSkills.forEach(s => {
                            const sBaseSkill = s.baseSkill || isSubSkill(s.name, skillsData);
                            if (sBaseSkill === skill.name && s.prof) {
                                s.prof = false;
                                s.skill_val = 0;
                            }
                        });
                    }
                }
                
                if (window.scheduleAutoSave) window.scheduleAutoSave();
                renderSkills(charData);
                refreshAbilitiesSection(charData);
            }
        });
    });
    
    // Handle ability select dropdown change
    container.querySelectorAll('.ability-select[data-skill-idx]').forEach(select => {
        select.addEventListener('change', () => {
            const idx = parseInt(select.dataset.skillIdx);
            if (charData.skills && charData.skills[idx]) {
                charData.skills[idx].ability = select.value;
                if (window.scheduleAutoSave) window.scheduleAutoSave();
                renderSkills(charData);
                refreshAbilitiesSection(charData);
            }
        });
    });
    
    // Adjust skill_val for skills
    container.querySelectorAll('.skill-adjust-btn[data-skill-idx]').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.skillIdx);
            const dir = parseInt(btn.dataset.dir);
            if (charData.skills && charData.skills[idx]) {
                const skill = charData.skills[idx];
                const tracking = getSkillPointTracking(charData, skillsData, speciesSkills);
                const newVal = (skill.skill_val || 0) + dir;
                
                // Check if this is a sub-skill
                const baseSkillName = skill.baseSkill || isSubSkill(skill.name, skillsData);
                const isFromSpecies = isSkillFromSpecies(skill.name, speciesSkills);
                
                if (baseSkillName) {
                    // Sub-skill logic
                    if (dir > 0) {
                        // Increasing
                        if (!skill.prof) {
                            // Not proficient: check base skill proficiency
                            const baseSkill = findByIdOrName(allSkills, { name: baseSkillName });
                            if (!baseSkill || !baseSkill.prof) {
                                alert(`You must be proficient in ${baseSkillName} before becoming proficient in this sub-skill.`);
                                return;
                            }
                            // Make proficient and set skill_val to 1
                            skill.prof = true;
                            skill.skill_val = 1;
                        } else {
                            // Already proficient: increase skill_val (allow overspending)
                            skill.skill_val = newVal;
                        }
                    } else {
                        // Decreasing
                        if (skill.prof && newVal < 1) {
                            // Can't go below 1 if proficient: set to 0 and remove proficiency
                            skill.skill_val = 0;
                            skill.prof = false;
                        } else if (newVal >= 0) {
                            skill.skill_val = newVal;
                        }
                    }
                } else {
                    // Base skill logic
                    if (dir > 0) {
                        // Increasing
                        if (!skill.prof && !isFromSpecies) {
                            // Not proficient and not from species: make proficient
                            skill.prof = true;
                            // Skill_val remains 0 (or set to 0 explicitly?)
                            skill.skill_val = 0;
                        } else {
                            // Already proficient or from species: increase skill_val (allow overspending)
                            skill.skill_val = newVal;
                        }
                    } else {
                        // Decreasing
                        if (newVal < 0) return;
                        skill.skill_val = newVal;
                    }
                }
                
                if (window.scheduleAutoSave) window.scheduleAutoSave();
                renderSkills(charData);
                refreshAbilitiesSection(charData);
            }
        });
    });
    
    // Remove skill
    container.querySelectorAll('.skill-remove-btn[data-skill-idx]').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.skillIdx);
            if (charData.skills && charData.skills[idx]) {
                const skillName = charData.skills[idx].name;
                // Check both baseSkill property and RTDB data
                const baseSkillName = charData.skills[idx].baseSkill || isSubSkill(skillName, skillsData);
                
                // If removing a base skill, also remove any sub-skills that depend on it
                if (!baseSkillName) {
                    charData.skills = charData.skills.filter((s, i) => {
                        if (i === idx) return false; // Remove this skill
                        // Also remove sub-skills of this base skill
                        const sBaseSkill = s.baseSkill || isSubSkill(s.name, skillsData);
                        if (sBaseSkill === skillName) return false;
                        return true;
                    });
                } else {
                    // Just remove this sub-skill
                    charData.skills.splice(idx, 1);
                }
                
                if (window.scheduleAutoSave) window.scheduleAutoSave();
                renderSkills(charData);
                refreshAbilitiesSection(charData);
            }
        });
    });
}
