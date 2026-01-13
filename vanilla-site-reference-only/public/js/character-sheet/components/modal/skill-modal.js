/**
 * Skill Modal for adding skills and sub-skills in edit mode
 */

import { openResourceModal, closeResourceModal, getCharacterData, getCurrentUser } from './modal-core.js';
import { fetchSkills } from '../../../core/rtdb-cache.js';
import { renderSkills } from '../skills.js';

let allSkills = [];
let filteredSkills = [];

// ============================================================================
// SKILL MODAL (base skills)
// ============================================================================

export async function showSkillModal() {
    openResourceModal();
    
    const title = document.getElementById('resource-modal-title');
    if (title) title.textContent = 'Add Skill';
    
    const body = document.getElementById('resource-modal-body');
    if (!body) return;
    body.innerHTML = '<div class="modal-loading">Loading skills...</div>';
    
    try {
        const skillsData = await fetchSkills();
        // Convert object to array and filter to base skills only (no base_skill property)
        allSkills = Object.entries(skillsData || {}).map(([id, skill]) => ({
            id,
            name: skill.name || id,
            ability: skill.ability || [],
            description: skill.description || '',
            base_skill: skill.base_skill || null
        })).filter(s => !s.base_skill); // Only base skills
        
        renderSkillModal(body);
    } catch (e) {
        body.innerHTML = `<div class="modal-error">Error loading skills.<br>${e.message || e}</div>`;
    }
}

function renderSkillModal(container) {
    container.innerHTML = `
        <div class="modal-filters">
            <input id="modal-skill-search" type="text" class="modal-search" placeholder="Search skills...">
        </div>
        <div class="modal-table-container">
            <table class="modal-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Ability</th>
                        <th style="width:80px;"></th>
                    </tr>
                </thead>
                <tbody id="modal-skill-tbody"></tbody>
            </table>
        </div>
    `;
    
    document.getElementById('modal-skill-search').addEventListener('input', applySkillFilters);
    applySkillFilters();
}

function applySkillFilters() {
    const charData = getCharacterData();
    const search = document.getElementById('modal-skill-search')?.value?.toLowerCase() || '';
    const currentSkills = charData?.skills || [];
    
    filteredSkills = allSkills.filter(skill => {
        // Search filter
        if (search && !skill.name.toLowerCase().includes(search)) return false;
        // Already has this skill
        const alreadyHas = currentSkills.some(cs => cs.name === skill.name);
        if (alreadyHas) return false;
        return true;
    });
    
    // Sort alphabetically
    filteredSkills.sort((a, b) => a.name.localeCompare(b.name));
    renderSkillTable();
}

function renderSkillTable() {
    const tbody = document.getElementById('modal-skill-tbody');
    if (!tbody) return;
    
    if (filteredSkills.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="modal-empty">No skills available to add.</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredSkills.map(skill => {
        const abilityStr = Array.isArray(skill.ability) ? skill.ability.join(', ') : skill.ability || '';
        return `
            <tr>
                <td><strong>${skill.name}</strong></td>
                <td>${abilityStr}</td>
                <td><button class="modal-add-btn" data-skill-name="${skill.name}" data-skill-ability="${(skill.ability && skill.ability[0]) || ''}">Add</button></td>
            </tr>
        `;
    }).join('');
    
    // Attach handlers
    tbody.querySelectorAll('.modal-add-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            addSkillToCharacter(btn.dataset.skillName, btn.dataset.skillAbility);
        });
    });
}

function addSkillToCharacter(skillName, ability) {
    const charData = getCharacterData();
    if (!charData) {
        alert('Character data not loaded.');
        return;
    }
    
    if (!Array.isArray(charData.skills)) charData.skills = [];
    
    // Check if already exists
    const alreadyHas = charData.skills.some(s => s.name === skillName);
    if (alreadyHas) return;
    
    // Add new skill with default values (not proficient, skill_val 0)
    charData.skills.push({
        name: skillName,
        ability: ability || null,
        skill_val: 0,
        prof: false
    });
    
    if (window.scheduleAutoSave) window.scheduleAutoSave();
    renderSkills(charData);
    closeResourceModal();
    if (typeof window.showNotification === 'function') {
        window.showNotification(`Added "${skillName}" skill.`, 'success');
    }
}

// ============================================================================
// SUB-SKILL MODAL
// ============================================================================

let allSubSkills = [];
let filteredSubSkills = [];

export async function showSubSkillModal() {
    openResourceModal();
    
    const title = document.getElementById('resource-modal-title');
    if (title) title.textContent = 'Add Sub-Skill';
    
    const body = document.getElementById('resource-modal-body');
    if (!body) return;
    body.innerHTML = '<div class="modal-loading">Loading sub-skills...</div>';
    
    try {
        const skillsData = await fetchSkills();
        const charData = getCharacterData();
        
        // Get list of proficient base skill names
        const proficientBaseSkills = (charData?.skills || [])
            .filter(s => s.prof)
            .map(s => s.name);
        
        // Convert object to array and filter to sub-skills where base_skill is proficient
        allSubSkills = Object.entries(skillsData || {}).map(([id, skill]) => ({
            id,
            name: skill.name || id,
            ability: skill.ability || [],
            description: skill.description || '',
            base_skill: skill.base_skill || null
        })).filter(s => s.base_skill && proficientBaseSkills.includes(s.base_skill));
        
        renderSubSkillModal(body);
    } catch (e) {
        body.innerHTML = `<div class="modal-error">Error loading sub-skills.<br>${e.message || e}</div>`;
    }
}

function renderSubSkillModal(container) {
    container.innerHTML = `
        <div class="modal-filters">
            <input id="modal-subskill-search" type="text" class="modal-search" placeholder="Search sub-skills...">
        </div>
        <div class="modal-table-container">
            <table class="modal-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Base Skill</th>
                        <th>Ability</th>
                        <th style="width:80px;"></th>
                    </tr>
                </thead>
                <tbody id="modal-subskill-tbody"></tbody>
            </table>
        </div>
    `;
    
    document.getElementById('modal-subskill-search').addEventListener('input', applySubSkillFilters);
    applySubSkillFilters();
}

function applySubSkillFilters() {
    const charData = getCharacterData();
    const search = document.getElementById('modal-subskill-search')?.value?.toLowerCase() || '';
    // Check all skills - sub-skills are those with a baseSkill property
    const currentSkills = charData?.skills || [];
    
    filteredSubSkills = allSubSkills.filter(skill => {
        // Search filter
        if (search && !skill.name.toLowerCase().includes(search)) return false;
        // Already has this sub-skill in the skills array
        const alreadyHas = currentSkills.some(cs => cs.name === skill.name);
        if (alreadyHas) return false;
        return true;
    });
    
    // Sort alphabetically
    filteredSubSkills.sort((a, b) => a.name.localeCompare(b.name));
    renderSubSkillTable();
}

function renderSubSkillTable() {
    const tbody = document.getElementById('modal-subskill-tbody');
    if (!tbody) return;
    
    if (filteredSubSkills.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="modal-empty">No sub-skills available. You need proficiency in a base skill first.</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredSubSkills.map(skill => {
        const abilityStr = Array.isArray(skill.ability) ? skill.ability.join(', ') : skill.ability || '';
        return `
            <tr>
                <td><strong>${skill.name}</strong></td>
                <td>${skill.base_skill || ''}</td>
                <td>${abilityStr}</td>
                <td><button class="modal-add-btn" data-subskill-name="${skill.name}" data-subskill-base="${skill.base_skill || ''}" data-subskill-ability="${(skill.ability && skill.ability[0]) || ''}">Add</button></td>
            </tr>
        `;
    }).join('');
    
    // Attach handlers
    tbody.querySelectorAll('.modal-add-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            addSubSkillToCharacter(btn.dataset.subskillName, btn.dataset.subskillBase, btn.dataset.subskillAbility);
        });
    });
}

function addSubSkillToCharacter(skillName, baseSkill, ability) {
    const charData = getCharacterData();
    if (!charData) {
        alert('Character data not loaded.');
        return;
    }
    
    if (!Array.isArray(charData.skills)) charData.skills = [];
    
    // Check if already exists in skills array
    const alreadyHas = charData.skills.some(s => s.name === skillName);
    if (alreadyHas) return;
    
    // Add new sub-skill to the main skills array with baseSkill property
    charData.skills.push({
        name: skillName,
        baseSkill: baseSkill,  // This marks it as a sub-skill
        ability: ability || null,
        skill_val: 0,
        prof: false
    });
    
    if (window.scheduleAutoSave) window.scheduleAutoSave();
    renderSkills(charData);
    closeResourceModal();
    if (typeof window.showNotification === 'function') {
        window.showNotification(`Added "${skillName}" sub-skill.`, 'success');
    }
}

// Export to window
window.showSkillModal = showSkillModal;
window.showSubSkillModal = showSubSkillModal;
