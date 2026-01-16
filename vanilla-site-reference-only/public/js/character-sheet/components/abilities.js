import { formatBonus } from '../utils.js';
import { 
    getCharacterResourceTracking,
    getAbilityIncreaseCostInfo,
    getAbilityDecreaseInfo,
    ABILITY_CONSTRAINTS
} from '../validation.js';
import { calculateAbilityPoints, calculateAbilityPointsSpent, calculateSkillPoints } from '../level-progression.js';

const abilityNames = ['strength', 'vitality', 'agility', 'acuity', 'intelligence', 'charisma'];
const defenseNames = ['might', 'fortitude', 'reflex', 'discernment', 'mentalFortitude', 'resolve'];
const defenseDisplayNames = ['Might', 'Fortitude', 'Reflex', 'Discernment', 'Mental Fort.', 'Resolve'];

/**
 * Calculate skill points spent on defense vals
 * Each defense val costs 2 skill points
 */
function calculateDefenseSkillPoints(defenseVals) {
    return Object.values(defenseVals || {}).reduce((sum, val) => sum + (val * 2), 0);
}

/**
 * Get skill points available for defense vals
 */
function getDefenseSkillPointsTracking(charData) {
    const level = charData.level || 1;
    const totalSkillPoints = calculateSkillPoints(level);
    
    // Calculate spent on skills (from skills component)
    const skillsSpent = charData.skills ? charData.skills.reduce((sum, skill) => {
        let cost = skill.skill_val || 0;
        // Add 1 for proficiency if it's a base skill (not a sub-skill)
        const isSubSkill = skill.baseSkill || false;
        if (skill.prof && !isSubSkill) {
            cost += 1;
        }
        return sum + cost;
    }, 0) : 0;
    
    const defenseSpent = calculateDefenseSkillPoints(charData.defenseVals);
    const totalSpent = skillsSpent + defenseSpent;
    const remaining = totalSkillPoints - totalSpent;
    
    return { total: totalSkillPoints, spent: totalSpent, remaining, defenseSpent, skillsSpent };
}

/**
 * Renders the resource tracker bar showing remaining ability points and skill points
 * Health-Energy points are now shown in the header section
 * @param {object} charData - Character data
 * @returns {string} HTML string for resource tracker
 */
function renderResourceTracker(charData) {
    const resources = getCharacterResourceTracking(charData);
    const skillTracking = getDefenseSkillPointsTracking(charData);
    
    // Three states for ability points: over-budget (red), has-points (green), no-points (blue)
    let abilityClass;
    if (resources.abilityPoints.remaining < 0) {
        abilityClass = 'over-budget';
    } else if (resources.abilityPoints.remaining > 0) {
        abilityClass = 'has-points';
    } else {
        abilityClass = 'no-points';
    }
    
    // Three states for skill points: over-budget (red), has-points (green), no-points (blue)
    let skillClass;
    if (skillTracking.remaining < 0) {
        skillClass = 'over-budget';
    } else if (skillTracking.remaining > 0) {
        skillClass = 'has-points';
    } else {
        skillClass = 'no-points';
    }
    
    return `
        <div class="resource-tracker">
            <div class="resource-item ability-resource">
                <span class="resource-label">Ability Points:</span>
                <span class="resource-value ${abilityClass}">
                    ${resources.abilityPoints.remaining} / ${resources.abilityPoints.total}
                </span>
                <span class="resource-constraint">(Max: ${resources.abilityPoints.maxAbility}, Neg Sum: ${resources.abilityPoints.negativeSum}/${ABILITY_CONSTRAINTS.MAX_NEGATIVE_SUM})</span>
            </div>
            <div class="resource-item skill-resource">
                <span class="resource-label">Skill Points:</span>
                <span class="resource-value ${skillClass}">
                    ${skillTracking.remaining} / ${skillTracking.total}
                </span>
                <span class="resource-constraint">(Skills: ${skillTracking.skillsSpent}, Defenses: ${skillTracking.defenseSpent})</span>
            </div>
        </div>
    `;
}

/**
 * Renders a single ability in edit mode with increment/decrement buttons
 * @param {object} charData - Character data
 * @param {object} entry - Ability entry with name and defense info
 * @returns {string} HTML string for editable ability
 */
function renderEditableAbility(charData, entry) {
    const abilVal = charData.abilities?.[entry.abil] || 0;
    const defVal = charData.defenseVals?.[entry.defKey] || 0;
    const defenseBonus = abilVal + defVal;
    const defenseScore = defenseBonus + 10;
    const level = charData.level || 1;
    const maxDefenseBonus = level + 10;
    
    const editInfo = window.getAbilityEditInfo ? window.getAbilityEditInfo(entry.abil) : {
        canIncrease: true,
        canDecrease: true,
        increaseCost: 1,
        decreaseRefund: 1
    };
    
    const costLabel = editInfo.increaseCost > 1 ? `(${editInfo.increaseCost}pts)` : '';
    
    // Defense editing validation - only block if max defense bonus is reached
    const skillTracking = getDefenseSkillPointsTracking(charData);
    const canIncreaseDefense = defenseBonus < maxDefenseBonus; // Allow overspending skill points
    const canDecreaseDefense = defVal > 0;
    const defenseIncTitle = !canIncreaseDefense 
        ? `Defense cannot exceed level + 10 (${maxDefenseBonus})`
        : `Increase defense value (2 skill points)${skillTracking.remaining < 2 ? ' - will overspend' : ''}`;
    const defenseDecTitle = canDecreaseDefense ? 'Decrease defense value (refund 2 skill points)' : 'Defense value is 0';
    
    return `
        <div class="ability edit-mode-ability">
            <div class="ability-name">${entry.abil}</div>
            <div class="ability-edit-controls">
                <button class="ability-dec" 
                    onclick="window.decreaseAbility('${entry.abil}')" 
                    ${!editInfo.canDecrease ? 'disabled' : ''}
                    title="${editInfo.decreaseReason || 'Decrease ability'}">−</button>
                <span class="ability-mod-display">${formatBonus(abilVal)}</span>
                <button class="ability-inc" 
                    onclick="window.increaseAbility('${entry.abil}')" 
                    title="${editInfo.increaseReason || 'Increase ability'} ${costLabel}">+</button>
            </div>
            ${editInfo.increaseCost > 1 ? `<div class="ability-cost-hint">${costLabel}</div>` : ''}
            <div class="sub-ability">
                <div class="sub-ability-title">${entry.label}</div>
                <div class="sub-ability-label">SCORE</div>
                <div class="sub-ability-score">${defenseScore}</div>
                <div class="sub-ability-label">BONUS</div>
                <div class="defense-edit-controls">
                    <button class="defense-dec" 
                        onclick="window.decreaseDefense('${entry.defKey}')" 
                        ${!canDecreaseDefense ? 'disabled' : ''}
                        title="${defenseDecTitle}">−</button>
                    <span class="sub-ability-bonus-display">${formatBonus(defenseBonus)}</span>
                    <button class="defense-inc" 
                        onclick="window.increaseDefense('${entry.defKey}')" 
                        ${!canIncreaseDefense ? 'disabled' : ''}
                        title="${defenseIncTitle}">+</button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Renders a single ability in view mode (original button style)
 * @param {object} charData - Character data
 * @param {object} entry - Ability entry with name and defense info
 * @returns {string} HTML string for view-mode ability
 */
function renderViewAbility(charData, entry) {
    const abilVal = charData.abilities?.[entry.abil] || 0;
    const defVal = charData.defenseVals?.[entry.defKey] || 0;
    const defenseBonus = abilVal + defVal;
    const defenseScore = defenseBonus + 10;
    
    return `
        <div class="ability">
            <div class="ability-name">${entry.abil}</div>
            <button class="ability-mod" onclick="rollAbility('${entry.abil}', ${abilVal})">${formatBonus(abilVal)}</button>
            <div class="sub-ability">
                <div class="sub-ability-title">${entry.label}</div>
                <div class="sub-ability-label">SCORE</div>
                <div class="sub-ability-score">${defenseScore}</div>
                <div class="sub-ability-label">BONUS</div>
                <button class="sub-ability-bonus" onclick="rollDefense('${entry.label}', ${defenseBonus})">${formatBonus(defenseBonus)}</button>
            </div>
        </div>
    `;
}

export function renderAbilities(charData, calculatedData) {
    const container = document.getElementById('abilities-section');
    container.innerHTML = '';
    
    const isEditMode = window.isEditMode || false;
    const isEditingAbilities = window.isEditingAbilities || false;

    const abilityOrder = [
        { abil: 'strength', defKey: 'might', label: 'Might' },
        { abil: 'vitality', defKey: 'fortitude', label: 'Fortitude' },
        { abil: 'agility', defKey: 'reflex', label: 'Reflex' },
        { abil: 'acuity', defKey: 'discernment', label: 'Discernment' },
        { abil: 'intelligence', defKey: 'mentalFortitude', label: 'Mental Fort.' },
        { abil: 'charisma', defKey: 'resolve', label: 'Resolve' }
    ];

    // Add pencil icon in top-right when in edit mode (always visible)
    if (isEditMode) {
        const resources = getCharacterResourceTracking(charData);
        const remaining = resources.abilityPoints.remaining;
        // Three states: over-budget (red), has-points (green), no-points (blue)
        let penClass;
        if (remaining < 0) {
            penClass = 'over-budget';
        } else if (remaining > 0) {
            penClass = 'has-points';
        } else {
            penClass = 'no-points';
        }
        const penIcon = `
            <div class="abilities-edit-toggle">
                <span class="edit-section-toggle ${penClass}" onclick="window.toggleAbilitiesEditor()" title="Edit abilities">🖉</span>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', penIcon);
    }

    // Add resource tracker if actively editing abilities
    if (isEditMode && isEditingAbilities) {
        const trackerHtml = renderResourceTracker(charData);
        container.insertAdjacentHTML('beforeend', trackerHtml);
    }

    const abilitiesWrapper = document.createElement('div');
    abilitiesWrapper.className = 'abilities';

    abilityOrder.forEach(entry => {
        // Show editable version only if actively editing abilities
        if (isEditMode && isEditingAbilities) {
            abilitiesWrapper.insertAdjacentHTML('beforeend', renderEditableAbility(charData, entry));
        } else {
            abilitiesWrapper.insertAdjacentHTML('beforeend', renderViewAbility(charData, entry));
        }
    });

    container.appendChild(abilitiesWrapper);
}
