import { formatBonus } from '../utils.js';
import { getCharacterResourceTracking } from '../validation.js';
import { calculateSkillPoints } from '../level-progression.js';

/**
 * Check if character has any unapplied points or unchosen feats
 * @param {object} charData - Character data
 * @returns {object} Object with hasUnappliedPoints boolean and details
 */
/**
 * Format ability display text based on character's martial and power abilities
 * @param {object} charData - Character data
 * @returns {string} Formatted ability text
 */
function formatAbilityText(charData) {
    if (!charData) return 'No Archetype Abilities';
    
    const powAbil = charData.pow_abil;
    const martAbil = charData.mart_abil;
    const powProf = charData.pow_prof || 0;
    const martProf = charData.mart_prof || 0;
    
    const parts = [];
    
    if (powProf > 0 && powAbil) {
        const capitalizedPowAbil = String(powAbil).charAt(0).toUpperCase() + String(powAbil).slice(1).toLowerCase();
        parts.push(`Power: ${capitalizedPowAbil}`);
    }
    
    if (martProf > 0 && martAbil) {
        const capitalizedMartAbil = String(martAbil).charAt(0).toUpperCase() + String(martAbil).slice(1).toLowerCase();
        parts.push(`Martial: ${capitalizedMartAbil}`);
    }
    
    if (parts.length === 0) {
        return 'No Archetype Abilities';
    }
    
    return parts.join(' • ');
}

function checkUnappliedPoints(charData) {
    const resources = getCharacterResourceTracking(charData);
    const level = charData.level || 1;
    const xp = charData.xp || 0;
    const canLevelUp = xp >= (level * 4);
    
    // Calculate skill points spent including defense vals
    const skillsSpent = (charData.skills || []).reduce((sum, skill) => {
        let cost = skill.skill_val || 0;
        const isSubSkill = skill.baseSkill || false;
        if (skill.prof && !isSubSkill) cost += 1;
        return sum + cost;
    }, 0);
    const defenseSpent = Object.values(charData.defenseVals || {}).reduce((sum, val) => sum + (val * 2), 0);
    const totalSkillSpent = skillsSpent + defenseSpent;
    const totalSkillPoints = calculateSkillPoints(level);
    const skillRemaining = totalSkillPoints - totalSkillSpent;
    
    const hasUnapplied = 
        resources.abilityPoints.remaining > 0 ||
        resources.healthEnergyPoints.remaining > 0 ||
        skillRemaining > 0 ||
        resources.feats.archetype.remaining > 0 ||
        resources.feats.character.remaining > 0;
    
    return {
        hasUnappliedPoints: hasUnapplied,
        canLevelUp,
        details: {
            abilityPoints: resources.abilityPoints.remaining,
            healthEnergyPoints: resources.healthEnergyPoints.remaining,
            skillPoints: skillRemaining,
            archetypeFeats: resources.feats.archetype.remaining,
            characterFeats: resources.feats.character.remaining
        }
    };
}

/**
 * Renders the health-energy allocation controls for edit mode
 * @param {object} charData - Character data
 * @param {object} calculatedData - Calculated data including max health/energy
 * @returns {string} HTML string for health-energy editor
 */
function renderHealthEnergyEditor(charData, calculatedData) {
    try {
        const resources = getCharacterResourceTracking(charData);
        
        if (!resources || !resources.healthEnergyPoints) {
            console.error('[Health-Energy Editor] Missing resource tracking data:', resources);
            return '';
        }
        
        const healthAlloc = resources.healthEnergyPoints.health || 0;
        const energyAlloc = resources.healthEnergyPoints.energy || 0;
        const remaining = resources.healthEnergyPoints.remaining || 0;
        
        const isExpanded = window.isEditingHealthEnergy || false;
        const expandedClass = isExpanded ? ' expanded' : '';
        
        // Three states: over-budget (red), has-points (green), no-points (blue)
        let remainingClass;
        if (remaining < 0) {
            remainingClass = 'over-budget';
        } else if (remaining > 0) {
            remainingClass = 'has-points';
        } else {
            remainingClass = 'no-points';
        }

        return `
            <div id="health-energy-editor" class="health-energy-editor${expandedClass}">
                <div class="he-header">
                    <span class="he-title">Health-Energy Points</span>
                    <span class="he-remaining ${remainingClass}">${remaining} remaining</span>
                </div>
                <div class="he-controls">
                    <div class="he-control-group">
                        <span class="he-label">Health (+${healthAlloc})</span>
                        <div class="he-buttons">
                            <button class="he-btn dec" onclick="window.decreaseHealthAllocation()" ${healthAlloc <= 0 ? 'disabled' : ''}>−</button>
                            <span class="he-value">${healthAlloc}</span>
                            <button class="he-btn inc" onclick="window.increaseHealthAllocation()">+</button>
                        </div>
                        <span class="he-max">Max HP: ${calculatedData.healthEnergy.maxHealth}</span>
                    </div>
                    <div class="he-control-group">
                        <span class="he-label">Energy (+${energyAlloc})</span>
                        <div class="he-buttons">
                            <button class="he-btn dec" onclick="window.decreaseEnergyAllocation()" ${energyAlloc <= 0 ? 'disabled' : ''}>−</button>
                            <span class="he-value">${energyAlloc}</span>
                            <button class="he-btn inc" onclick="window.increaseEnergyAllocation()">+</button>
                        </div>
                        <span class="he-max">Max EP: ${calculatedData.healthEnergy.maxEnergy}</span>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('[Health-Energy Editor] Error rendering:', error);
        return '';
    }
}

export function renderHeader(charData, calculatedData) {
    const container = document.getElementById('header-section');
    container.innerHTML = '';
    
    const isEditMode = window.isEditMode || false;
    
    const currentHealth = charData.currentHealth ?? calculatedData.healthEnergy.maxHealth;
    const currentEnergy = charData.currentEnergy ?? calculatedData.healthEnergy.maxEnergy;
    const terminal = Math.ceil(calculatedData.healthEnergy.maxHealth / 4);
    
    // Gender symbol
    const genderSymbol = charData.gender === 'female' ? '♀' : 
                        charData.gender === 'male' ? '♂' : '';
    
    // Build health-energy editor HTML if in edit mode
    const healthEnergyEditorHtml = isEditMode ? renderHealthEnergyEditor(charData, calculatedData) : '';
    
    // Determine pencil icon color based on remaining points
    const resources = isEditMode ? getCharacterResourceTracking(charData) : null;
    // Three states: over-budget (red), has-points (green), no-points (blue)
    let penClass = 'no-points';
    if (resources && resources.healthEnergyPoints) {
        const remaining = resources.healthEnergyPoints.remaining;
        if (remaining < 0) {
            penClass = 'over-budget';
        } else if (remaining > 0) {
            penClass = 'has-points';
        } else {
            penClass = 'no-points';
        }
    }
    const healthEnergyToggle = isEditMode ? `<span class="edit-section-toggle resources-edit-toggle ${penClass}" onclick="window.toggleHealthEnergyEditor()" title="Edit Health/Energy allocation">🖉</span>` : '';

    // Calculate Innate Threshold for display (show threshold in header innate-section)
    let innateThreshold = 0;
    try {
        if (typeof window.calculateArchetypeProgression === 'function') {
            const progression = window.calculateArchetypeProgression(
                charData.level || 1,
                charData.mart_prof || 0,
                charData.pow_prof || 0,
                charData.archetypeChoices || {}
            );
            innateThreshold = progression.innateThreshold || 0;
        }
    } catch (e) {
        console.warn('[Header] Failed to calculate innate threshold', e);
        innateThreshold = charData.innateEnergy || 0;
    }

    const header = document.createElement('div');
    header.className = 'header';
    header.innerHTML = `
        <div class="header-left">
            <div class="portrait" style="background-image: url('${charData.portrait || '/images/placeholder-portrait.png'}');">
                ${!charData.portrait ? '<div class="portrait-placeholder">📷</div>' : ''}
            </div>
            <div class="character-details">
                <h1 class="name">${genderSymbol ? genderSymbol + ' ' : ''}${charData.name || 'Unnamed Character'}</h1>
                <div class="ability-text">${formatAbilityText(charData)}</div>
                <div class="race-class">${charData.species || 'Unknown Species'}</div>
                <div class="xp-level">XP: ${charData.xp || 0}</div>
                <div class="xp-level">LEVEL ${charData.level || 1}</div>
            </div>
        </div>
        <div class="header-middle">
            <div class="speed" title="Movement speed in spaces per turn">
                <div class="stat-label">SPEED</div>
                <div class="stat-value">
                    ${calculatedData.speed}
                    ${isEditMode ? `<span class="edit-icon stat-edit-icon ${(charData.speedBase !== undefined && charData.speedBase !== 6) ? 'modified' : ''}" data-edit="speed" title="Edit Speed Base (Default: 6)">🖉</span>` : ''}
                </div>
            </div>
            <div class="evasion" title="Difficulty to hit with attacks">
                <div class="stat-label">EVASION</div>
                <div class="stat-value">
                    ${calculatedData.evasion}
                    ${isEditMode ? `<span class="edit-icon stat-edit-icon ${(charData.evasionBase !== undefined && charData.evasionBase !== 10) ? 'modified' : ''}" data-edit="evasion" title="Edit Evasion Base (Default: 10)">🖉</span>` : ''}
                </div>
            </div>
        </div>
        <div class="header-right">
            ${healthEnergyEditorHtml}
            <div class="resources-grid">
                ${healthEnergyToggle}
                <div class="resource-section health-section">
                    <div class="bar health-bar">
                        <span class="bar-label">HEALTH</span>
                        <div class="bar-controls">
                            <button onclick="changeHealth(1)" title="Increase health">▲</button>
                            <input type="text" id="currentHealth" value="${currentHealth}" data-max="${calculatedData.healthEnergy.maxHealth}">
                            <span class="bar-separator">/</span>
                            <span class="bar-max">${calculatedData.healthEnergy.maxHealth}</span>
                            <button onclick="changeHealth(-1)" title="Decrease health">▼</button>
                        </div>
                    </div>
                </div>
                <div class="resource-section energy-section">
                    <div class="bar energy-bar">
                        <span class="bar-label">ENERGY</span>
                        <div class="bar-controls">
                            <button onclick="changeEnergy(1)" title="Increase energy">▲</button>
                            <input type="text" id="currentEnergy" value="${currentEnergy}" data-max="${calculatedData.healthEnergy.maxEnergy}">
                            <span class="bar-separator">/</span>
                            <span class="bar-max">${calculatedData.healthEnergy.maxEnergy}</span>
                            <button onclick="changeEnergy(-1)" title="Decrease energy">▼</button>
                        </div>
                    </div>
                </div>
                <div class="resource-section terminal-section">
                    <span class="stat-label">TERMINAL</span>
                    <span class="stat-value">${terminal}</span>
                </div>
                <div class="resource-section innate-section">
                    <span class="stat-label">INNATE ENERGY</span>
                    <span class="stat-value">${innateThreshold}</span>
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(header);

    const healthInput = document.getElementById('currentHealth');
    const energyInput = document.getElementById('currentEnergy');

    if (healthInput) {
        healthInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const raw = e.target.value.trim();
                const currentVal = parseInt(charData.currentHealth) || 0;
                let newValue;
                if (/^[+]/.test(raw)) newValue = currentVal + (parseInt(raw.substring(1)) || 0);
                else if (/^-/.test(raw)) newValue = currentVal - (parseInt(raw.substring(1)) || 0);
                else newValue = parseInt(raw) || 0;
                e.target.value = newValue;
                charData.currentHealth = newValue;
                window.updateCharacterData?.({ currentHealth: newValue });
                window.updateResourceColors?.();
            }
        });
        healthInput.addEventListener('blur', () => {
            healthInput.value = charData.currentHealth;
            window.updateResourceColors?.();
        });
    }

    if (energyInput) {
        energyInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const raw = e.target.value.trim();
                const currentVal = parseInt(charData.currentEnergy) || 0;
                const maxEnergy = parseInt(e.target.dataset.max) || 0;
                let newValue;
                if (/^[+]/.test(raw)) newValue = currentVal + (parseInt(raw.substring(1)) || 0);
                else if (/^-/.test(raw)) newValue = currentVal - (parseInt(raw.substring(1)) || 0);
                else newValue = parseInt(raw) || 0;
                newValue = Math.max(0, Math.min(maxEnergy, newValue));
                e.target.value = newValue;
                charData.currentEnergy = newValue;
                window.updateCharacterData?.({ currentEnergy: newValue });
                window.updateResourceColors?.();
            }
        });
        energyInput.addEventListener('blur', () => {
            energyInput.value = charData.currentEnergy;
            window.updateResourceColors?.();
        });
    }

    // Initial color state
    window.updateResourceColors?.();

    const isEdit = window.isEditMode;
    const level = charData.level || 1;
    const xp = charData.xp || 0;
    const canLevelUp = xp >= (level * 4);
    const unappliedInfo = checkUnappliedPoints(charData);
    
    // Example for character name:
    let nameHtml = '';
    if (isEdit) {
        nameHtml = `<span class="editable-field" id="name-display">${charData.name}</span>
                    <span class="edit-icon" data-edit="name">🖉</span>`;
    } else {
        nameHtml = `<span>${charData.name}</span>`;
    }

    // Add similar for XP - show level up indicator if can level up
    let xpHtml = '';
    if (isEdit) {
        const xpClass = canLevelUp ? 'can-level-up' : '';
        xpHtml = `<span class="editable-field ${xpClass}" id="xp-display">${xp}</span>
                  <span class="edit-icon" data-edit="xp">🖉</span>`;
    } else {
        xpHtml = `${xp}`;
    }
    
    // Level HTML with dropdown editing
    let levelHtml = '';
    if (isEdit) {
        const levelPenClass = canLevelUp ? 'level-up-available' : '';
        levelHtml = `<span class="editable-field" id="level-display">${level}</span>
                     <span class="edit-icon ${levelPenClass}" data-edit="level" title="${canLevelUp ? 'Ready to level up!' : 'Edit level'}">🖉</span>`;
    } else {
        levelHtml = `${level}`;
    }

    // Update the HTML to use nameHtml, xpHtml, and levelHtml
    header.innerHTML = `
        <div class="header-left">
            <div class="portrait" style="background-image: url('${charData.portrait || '/images/placeholder-portrait.png'}');">
                ${!charData.portrait ? '<div class="portrait-placeholder">📷</div>' : ''}
            </div>
            <div class="character-details">
                <h1 class="name">${genderSymbol ? genderSymbol + ' ' : ''}${nameHtml}</h1>
                <div class="ability-text">
                    ${isEdit ? '<span class="editable-field" id="ability-display">' + formatAbilityText(charData) + '</span><span class="edit-icon" data-edit="abilities" title="Edit Archetype Abilities">🖉</span>' : formatAbilityText(charData)}
                </div>
                <div class="race-class">${charData.species || 'Unknown Species'}</div>
                <div class="xp-level">XP: ${xpHtml}${canLevelUp ? '<span class="level-up-indicator" title="Ready to level up!">⬆</span>' : ''}</div>
                <div class="xp-level">LEVEL ${levelHtml}</div>
            </div>
        </div>
        <div class="header-middle">
            <div class="speed" title="Movement speed in spaces per turn">
                <div class="stat-label">SPEED</div>
                <div class="stat-value">
                    ${calculatedData.speed}
                    ${isEdit ? `<span class="edit-icon stat-edit-icon ${(charData.speedBase !== undefined && charData.speedBase !== 6) ? 'modified' : ''}" data-edit="speed" title="Edit Speed Base (Default: 6)">🖉</span>` : ''}
                </div>
            </div>
            <div class="evasion" title="Difficulty to hit with attacks">
                <div class="stat-label">EVASION</div>
                <div class="stat-value">
                    ${calculatedData.evasion}
                    ${isEdit ? `<span class="edit-icon stat-edit-icon ${(charData.evasionBase !== undefined && charData.evasionBase !== 10) ? 'modified' : ''}" data-edit="evasion" title="Edit Evasion Base (Default: 10)">🖉</span>` : ''}
                </div>
            </div>
        </div>
        <div class="header-right">
            ${healthEnergyEditorHtml}
            <div class="resources-grid">
                ${healthEnergyToggle}
                <div class="resource-section health-section">
                    <div class="bar health-bar">
                        <span class="bar-label">HEALTH</span>
                        <div class="bar-controls">
                            <button onclick="changeHealth(1)" title="Increase health">▲</button>
                            <input type="text" id="currentHealth" value="${currentHealth}" data-max="${calculatedData.healthEnergy.maxHealth}">
                            <span class="bar-separator">/</span>
                            <span class="bar-max">${calculatedData.healthEnergy.maxHealth}</span>
                            <button onclick="changeHealth(-1)" title="Decrease health">▼</button>
                        </div>
                    </div>
                </div>
                <div class="resource-section energy-section">
                    <div class="bar energy-bar">
                        <span class="bar-label">ENERGY</span>
                        <div class="bar-controls">
                            <button onclick="changeEnergy(1)" title="Increase energy">▲</button>
                            <input type="text" id="currentEnergy" value="${currentEnergy}" data-max="${calculatedData.healthEnergy.maxEnergy}">
                            <span class="bar-separator">/</span>
                            <span class="bar-max">${calculatedData.healthEnergy.maxEnergy}</span>
                            <button onclick="changeEnergy(-1)" title="Decrease energy">▼</button>
                        </div>
                    </div>
                </div>
                <div class="resource-section terminal-section">
                    <span class="stat-label">TERMINAL</span>
                    <span class="stat-value">${terminal}</span>
                </div>
                <div class="resource-section innate-section">
                    <span class="stat-label">INNATE ENERGY</span>
                    <span class="stat-value">${charData.innateEnergy || 0}</span>
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(header);

    // ...existing code for health/energy inputs again (duplicated in original, keeping as is)...

    // Add event listener for edit icon (name):
    if (isEdit) {
        const editIcon = header.querySelector('.edit-icon[data-edit="name"]');
        const displaySpan = header.querySelector('#name-display');
        if (editIcon && displaySpan) {
            editIcon.addEventListener('click', () => {
                // Replace span with input
                const input = document.createElement('input');
                input.type = 'text';
                input.value = charData.name;
                input.className = 'editable-input';
                input.style.border = '1px solid #1a73e8';
                input.style.padding = '2px 4px';
                input.style.borderRadius = '3px';
                input.style.background = '#f0f8ff';

                // Replace display with input
                displaySpan.replaceWith(input);
                input.focus();
                input.select();

                // Handle saving on blur or Enter
                const saveChange = () => {
                    const newValue = input.value.trim();
                    if (newValue && newValue !== charData.name) {
                        charData.name = newValue;
                        window.scheduleAutoSave(); // Trigger save
                    }
                    // Replace input back with span and re-render
                    input.replaceWith(displaySpan);
                    displaySpan.textContent = charData.name;
                };

                input.addEventListener('blur', saveChange);
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        saveChange();
                    } else if (e.key === 'Escape') {
                        // Cancel: revert without saving
                        input.replaceWith(displaySpan);
                    }
                });
            });
        }
    }

    // Add event listener for XP edit icon:
    if (isEdit) {
        const xpEditIcon = header.querySelector('.edit-icon[data-edit="xp"]');
        const xpDisplaySpan = header.querySelector('#xp-display');
        if (xpEditIcon && xpDisplaySpan) {
            xpEditIcon.addEventListener('click', () => {
                // Replace span with input
                const input = document.createElement('input');
                input.type = 'number';
                input.value = charData.xp || 0;
                input.className = 'editable-input';
                input.style.border = '1px solid #1a73e8';
                input.style.padding = '2px 4px';
                input.style.borderRadius = '3px';
                input.style.background = '#f0f8ff';
                input.min = 0; // Prevent negative XP

                // Replace display with input
                xpDisplaySpan.replaceWith(input);
                input.focus();
                input.select();

                // Handle saving on blur or Enter
                const saveChange = () => {
                    const newValue = parseInt(input.value) || 0;
                    if (newValue !== (charData.xp || 0)) {
                        charData.xp = newValue;
                        window.scheduleAutoSave(); // Trigger save
                    }
                    // Replace input back with span and re-render
                    input.replaceWith(xpDisplaySpan);
                    xpDisplaySpan.textContent = charData.xp || 0;
                };

                input.addEventListener('blur', saveChange);
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        saveChange();
                    } else if (e.key === 'Escape') {
                        // Cancel: revert without saving
                        input.replaceWith(xpDisplaySpan);
                    }
                });
            });
        }
    }

    // Add event listener for Ability edit icon:
    if (isEdit) {
        const abilityEditIcon = header.querySelector('.edit-icon[data-edit="abilities"]');
        const abilityDisplaySpan = header.querySelector('#ability-display');
        if (abilityEditIcon && abilityDisplaySpan) {
            abilityEditIcon.addEventListener('click', () => {
                showAbilityEditModal(charData, abilityDisplaySpan);
            });
        }
    }

    // Add event listeners for Speed and Evasion edit icons:
    if (isEdit) {
        const speedEditIcon = header.querySelector('.edit-icon[data-edit="speed"]');
        const evasionEditIcon = header.querySelector('.edit-icon[data-edit="evasion"]');
        
        if (speedEditIcon) {
            speedEditIcon.addEventListener('click', () => {
                showStatEditModal(charData, 'speed', 6, 'Speed Base');
            });
        }
        
        if (evasionEditIcon) {
            evasionEditIcon.addEventListener('click', () => {
                showStatEditModal(charData, 'evasion', 10, 'Evasion Base');
            });
        }
    }

    // Add event listener for Level edit icon:
    if (isEdit) {
        const levelEditIcon = header.querySelector('.edit-icon[data-edit="level"]');
        const levelDisplaySpan = header.querySelector('#level-display');
        if (levelEditIcon && levelDisplaySpan) {
            levelEditIcon.addEventListener('click', () => {
                const currentLevel = charData.level || 1;
                
                // Create dropdown for level selection
                const select = document.createElement('select');
                select.className = 'editable-input level-select';
                select.style.border = '1px solid #1a73e8';
                select.style.padding = '2px 4px';
                select.style.borderRadius = '3px';
                select.style.background = '#f0f8ff';
                
                // Add options 1-20
                for (let i = 1; i <= 20; i++) {
                    const option = document.createElement('option');
                    option.value = i;
                    option.textContent = i;
                    if (i === currentLevel) option.selected = true;
                    select.appendChild(option);
                }
                
                // Replace display with select
                levelDisplaySpan.replaceWith(select);
                select.focus();
                
                // Handle level change
                const handleLevelChange = (newLevel) => {
                    if (newLevel === currentLevel) {
                        // No change, just restore
                        select.replaceWith(levelDisplaySpan);
                        return;
                    }
                    
                    const xpCost = currentLevel * 4;
                    const currentXp = charData.xp || 0;
                    const canReduceXp = currentXp > 0 && newLevel > currentLevel;
                    
                    let message = `Are you sure you want to change level from ${currentLevel} to ${newLevel}?`;
                    if (canReduceXp && newLevel > currentLevel) {
                        message += `\\n\\nWould you like to spend ${xpCost} XP to represent leveling up from level ${currentLevel}?`;
                        message += `\\n\\nCurrent XP: ${currentXp}`;
                        message += `\\nXP after spending: ${Math.max(0, currentXp - xpCost)}`;
                    }
                    
                    // Use a custom confirmation dialog approach
                    if (confirm(message)) {
                        charData.level = newLevel;
                        
                        // Ask about XP reduction only when leveling up
                        if (canReduceXp && newLevel > currentLevel) {
                            const reduceXp = confirm(`Spend ${xpCost} XP for this level increase?\\n\\nClick OK to spend XP, or Cancel to keep current XP total.`);
                            if (reduceXp) {
                                charData.xp = Math.max(0, currentXp - xpCost);
                            }
                        }
                        
                        window.scheduleAutoSave();
                        window.refreshCharacterSheet();
                    } else {
                        // Restore original display
                        select.replaceWith(levelDisplaySpan);
                    }
                };
                
                select.addEventListener('change', () => {
                    const newLevel = parseInt(select.value);
                    handleLevelChange(newLevel);
                });
                
                select.addEventListener('blur', () => {
                    // If still in DOM, restore original
                    if (select.parentNode) {
                        select.replaceWith(levelDisplaySpan);
                    }
                });
                
                select.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        select.replaceWith(levelDisplaySpan);
                    } else if (e.key === 'Enter') {
                        e.preventDefault();
                        const newLevel = parseInt(select.value);
                        handleLevelChange(newLevel);
                    }
                });
            });
        }
    }

    // ...existing code...
}

/**
 * Show modal for editing character's martial and power abilities
 * @param {object} charData - Character data
 * @param {HTMLElement} displaySpan - The span element to update after editing
 */
function showAbilityEditModal(charData, displaySpan) {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'ability-edit-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    // Create modal content
    const modal = document.createElement('div');
    modal.className = 'ability-edit-modal';
    modal.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 24px;
        min-width: 400px;
        max-width: 500px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    `;
    
    const abilities = ['Strength', 'Vitality', 'Agility', 'Acuity', 'Intelligence', 'Charisma'];
    const powProf = charData.pow_prof || 0;
    const martProf = charData.mart_prof || 0;
    const currentPowAbil = charData.pow_abil || 'charisma'; // Default to charisma
    const currentMartAbil = charData.mart_abil || 'strength'; // Default to strength
    
    let newPowAbil = currentPowAbil;
    let newMartAbil = currentMartAbil;
    
    modal.innerHTML = `
        <h2 style="margin: 0 0 20px 0; color: var(--primary-dark); text-align: center;">Edit Archetype Abilities</h2>
        
        ${powProf > 0 ? `
        <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-primary);">Power Ability:</label>
            <select id="power-ability-select" style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                ${abilities.map(ability => 
                    `<option value="${ability.toLowerCase()}" ${ability.toLowerCase() === currentPowAbil.toLowerCase() ? 'selected' : ''}>${ability}</option>`
                ).join('')}
            </select>
        </div>
        ` : ''}
        
        ${martProf > 0 ? `
        <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-primary);">Martial Ability:</label>
            <select id="martial-ability-select" style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                ${abilities.map(ability => 
                    `<option value="${ability.toLowerCase()}" ${ability.toLowerCase() === currentMartAbil.toLowerCase() ? 'selected' : ''}>${ability}</option>`
                ).join('')}
            </select>
        </div>
        ` : ''}
        
        ${powProf === 0 && martProf === 0 ? '<p style="text-align: center; color: var(--text-secondary); margin-bottom: 20px;">No archetype proficiencies found. Set martial or power proficiency first.</p>' : ''}
        
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button id="cancel-ability-edit" style="padding: 8px 16px; border: 1px solid #ddd; background: #f8f9fa; border-radius: 6px; cursor: pointer;">Cancel</button>
            <button id="save-ability-edit" style="padding: 8px 16px; border: none; background: var(--primary-blue); color: white; border-radius: 6px; cursor: pointer; font-weight: 600;">Save Changes</button>
        </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Event listeners
    const powerSelect = modal.querySelector('#power-ability-select');
    const martialSelect = modal.querySelector('#martial-ability-select');
    
    if (powerSelect) {
        powerSelect.addEventListener('change', (e) => {
            newPowAbil = e.target.value;
        });
    }
    
    if (martialSelect) {
        martialSelect.addEventListener('change', (e) => {
            newMartAbil = e.target.value;
        });
    }
    
    // Cancel button
    modal.querySelector('#cancel-ability-edit').addEventListener('click', () => {
        document.body.removeChild(overlay);
    });
    
    // Save button
    modal.querySelector('#save-ability-edit').addEventListener('click', () => {
        let changed = false;
        
        if (powProf > 0) {
            const newValue = newPowAbil.toLowerCase();
            const oldValue = (charData.pow_abil || 'charisma').toLowerCase();
            if (newValue !== oldValue) {
                charData.pow_abil = newValue;
                changed = true;
            }
        }
        
        if (martProf > 0) {
            const newValue = newMartAbil.toLowerCase();
            const oldValue = (charData.mart_abil || 'strength').toLowerCase();
            if (newValue !== oldValue) {
                charData.mart_abil = newValue;
                changed = true;
            }
        }
        
        if (changed) {
            // Update the display
            displaySpan.textContent = formatAbilityText(charData);
            
            // Trigger auto-save and refresh
            if (window.scheduleAutoSave) window.scheduleAutoSave();
            if (window.refreshCharacterSheet) window.refreshCharacterSheet();
        }
        
        document.body.removeChild(overlay);
    });
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    });
    
    // Close on Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            document.removeEventListener('keydown', handleEscape);
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
        }
    };
    document.addEventListener('keydown', handleEscape);
}

/**
 * Show modal for editing speed or evasion base values
 * @param {object} charData - Character data
 * @param {string} statType - 'speed' or 'evasion'
 * @param {number} defaultValue - Default base value (6 for speed, 10 for evasion)
 * @param {string} displayName - Human-readable name for the modal
 */
function showStatEditModal(charData, statType, defaultValue, displayName) {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'stat-edit-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    // Create modal content
    const modal = document.createElement('div');
    modal.className = 'stat-edit-modal';
    modal.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 24px;
        min-width: 350px;
        max-width: 400px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    `;
    
    const fieldName = statType + 'Base';
    const currentValue = charData[fieldName] ?? defaultValue;
    const isModified = currentValue !== defaultValue;
    
    modal.innerHTML = `
        <h2 style="margin: 0 0 20px 0; color: var(--primary-dark); text-align: center;">Edit ${displayName}</h2>
        
        <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-primary);">${displayName}:</label>
            <div style="display: flex; align-items: center; gap: 12px;">
                <button id="decrease-stat" style="width: 32px; height: 32px; border: 1px solid #ddd; background: #f8f9fa; border-radius: 6px; cursor: pointer; font-weight: bold;">−</button>
                <input type="number" id="stat-value-input" value="${currentValue}" min="0" max="99" style="width: 80px; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; text-align: center; font-size: 16px; font-weight: bold;">
                <button id="increase-stat" style="width: 32px; height: 32px; border: 1px solid #ddd; background: #f8f9fa; border-radius: 6px; cursor: pointer; font-weight: bold;">+</button>
                <button id="reset-stat" style="padding: 6px 12px; border: 1px solid #ddd; background: #fff3cd; border-radius: 6px; cursor: pointer; font-size: 12px;">Reset to ${defaultValue}</button>
            </div>
        </div>
        
        <div style="margin-bottom: 20px; padding: 12px; background: #f8f9fa; border-radius: 6px; font-size: 14px;">
            <div style="color: var(--text-secondary);">Default: ${defaultValue}</div>
            <div style="color: var(--text-primary); font-weight: 600;">Current: <span id="current-display">${currentValue}</span> ${isModified ? '<span style="color: #dc3545;">(Modified)</span>' : ''}</div>
        </div>
        
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button id="cancel-stat-edit" style="padding: 8px 16px; border: 1px solid #ddd; background: #f8f9fa; border-radius: 6px; cursor: pointer;">Cancel</button>
            <button id="save-stat-edit" style="padding: 8px 16px; border: none; background: var(--primary-blue); color: white; border-radius: 6px; cursor: pointer; font-weight: 600;">Save Changes</button>
        </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    const input = modal.querySelector('#stat-value-input');
    const currentDisplay = modal.querySelector('#current-display');
    const decreaseBtn = modal.querySelector('#decrease-stat');
    const increaseBtn = modal.querySelector('#increase-stat');
    const resetBtn = modal.querySelector('#reset-stat');
    
    // Update display function
    const updateDisplay = () => {
        const value = parseInt(input.value) || 0;
        currentDisplay.textContent = value;
        currentDisplay.nextElementSibling?.remove(); // Remove previous modified indicator
        if (value !== defaultValue) {
            const modifiedSpan = document.createElement('span');
            modifiedSpan.style.color = '#dc3545';
            modifiedSpan.textContent = ' (Modified)';
            currentDisplay.parentNode.appendChild(modifiedSpan);
        }
    };
    
    // Event listeners
    decreaseBtn.addEventListener('click', () => {
        const currentVal = parseInt(input.value) || 0;
        input.value = Math.max(0, currentVal - 1);
        updateDisplay();
    });
    
    increaseBtn.addEventListener('click', () => {
        const currentVal = parseInt(input.value) || 0;
        input.value = Math.min(99, currentVal + 1);
        updateDisplay();
    });
    
    resetBtn.addEventListener('click', () => {
        input.value = defaultValue;
        updateDisplay();
    });
    
    input.addEventListener('input', updateDisplay);
    
    // Cancel button
    modal.querySelector('#cancel-stat-edit').addEventListener('click', () => {
        document.body.removeChild(overlay);
    });
    
    // Save button
    modal.querySelector('#save-stat-edit').addEventListener('click', () => {
        const newValue = parseInt(input.value) || defaultValue;
        
        if (newValue === defaultValue) {
            // Reset to default - remove the custom property
            delete charData[fieldName];
        } else {
            // Set custom value
            charData[fieldName] = newValue;
        }
        
        // Trigger auto-save and refresh
        if (window.scheduleAutoSave) window.scheduleAutoSave();
        if (window.refreshCharacterSheet) window.refreshCharacterSheet();
        
        document.body.removeChild(overlay);
    });
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    });
    
    // Close on Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            document.removeEventListener('keydown', handleEscape);
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
        }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Focus the input
    input.focus();
    input.select();
}

function formatArchetype(archetype) {
    if (!archetype) return 'No Archetype';
    if (typeof archetype === 'string') return archetype;
    if (archetype.type === 'powered-martial') {
        return `Powered-Martial (${archetype.powerAbility}/${archetype.martialAbility})`;
    }
    return `${archetype.type || 'Unknown'} (${archetype.ability || 'N/A'})`;
}
