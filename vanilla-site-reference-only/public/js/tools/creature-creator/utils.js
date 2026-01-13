// Import and re-export capitalize from shared module for backwards compatibility
import { capitalize as sharedCapitalize } from '/js/shared/string-utils.js';
import { findByIdOrName } from '/js/shared/id-constants.js';

// Returns the highest ability score from the UI
export function getHighestAbility() {
    const abilities = [
        parseInt(document.getElementById('creatureAbilityStrength')?.value || 0),
        parseInt(document.getElementById('creatureAbilityVitality')?.value || 0),
        parseInt(document.getElementById('creatureAbilityAgility')?.value || 0),
        parseInt(document.getElementById('creatureAbilityAcuity')?.value || 0),
        parseInt(document.getElementById('creatureAbilityIntelligence')?.value || 0),
        parseInt(document.getElementById('creatureAbilityCharisma')?.value || 0)
    ];
    return Math.max(...abilities);
}
import { 
    resistances, weaknesses, immunities, senses, movement, feats, creatureSkills, creatureSkillValues, 
    conditionImmunities, defenseSkillState 
} from './state.js';
import {
    calcAbilityPointTotal,
    calcSkillPointTotal,
    calcHitEnergyTotal,
    calcCreatureCurrency
} from './calc.js';
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

// --- Archetype Proficiency Logic ---
export function getMaxArchetypeProficiency(level) {
    level = parseFloat(level) || 1;
    if (level < 1) {
        return Math.ceil(2 * level);
    }
    return 2 + Math.floor(level / 5);
}

export function getPowerProficiency() {
    const el = document.getElementById('powerProficiencyInput');
    return el ? parseInt(el.value) || 0 : 0;
}

export function getMartialProficiency() {
    const el = document.getElementById('martialProficiencyInput');
    return el ? parseInt(el.value) || 0 : 0;
}

export function validateArchetypeProficiency() {
    const level = getLevelValue();
    const max = getMaxArchetypeProficiency(level);
    const power = getPowerProficiency();
    const martial = getMartialProficiency();
    return (power >= 0 && martial >= 0 && (power + martial) <= max);
}

// Utility functions
// Helper: Add feat to feats list if it doesn't already exist
export async function addFeatFromDatabase(featName) {
    const db = getDatabase();
    const featsRef = ref(db, 'creature_feats');
    const snapshot = await get(featsRef);
    if (snapshot.exists()) {
        const allFeats = Object.values(snapshot.val());
        const feat = findByIdOrName(allFeats, { name: featName });
        if (feat && !feats.some(f => f.name === feat.name)) {
            feats.push({ name: feat.name, points: feat.feat_points });
        }
    }
}

// Helper: Remove feat from feats list by name
export function removeFeat(featName) {
    const idx = feats.findIndex(f => f.name === featName);
    if (idx !== -1) {
        feats.splice(idx, 1);
    }
}

export async function updateList(listId, arr, removeHandler, displayMap, allCreatureFeats) {
    const ul = document.getElementById(listId);
    ul.innerHTML = "";
    for (const [idx, val] of arr.slice().sort().entries()) {
        const li = document.createElement("li");
        li.textContent = displayMap && displayMap[val] ? displayMap[val] : val;
        // Fetch description from database for tooltip
        if (allCreatureFeats && Array.isArray(allCreatureFeats)) {
            const feat = findByIdOrName(allCreatureFeats, { name: val });
            if (feat && feat.description) {
                li.title = feat.description;
            }
        }
        const btn = document.createElement("button");
        btn.textContent = "✕";
        btn.className = "small-button red-button";
        btn.onclick = () => { removeHandler(val, idx); };
        li.appendChild(btn);
        ul.appendChild(li);

        // Add associated feat from the database for senses or movement
        if (listId === "sensesList" || listId === "movementList") {
            await addFeatFromDatabase(val);
        }
    }
}

// Re-export capitalize from shared module for backwards compatibility
export const capitalize = sharedCapitalize;

export function formatDamage(damageArr) {
    if (!Array.isArray(damageArr)) return '';
    return damageArr.map(d => {
        if (d.amount && d.size && d.type && d.type !== 'none') {
            return `${d.amount}d${d.size} ${d.type}`;
        }
        return '';
    }).filter(Boolean).join(', ');
}

export function formatTechniqueAction(item) {
    let action = item.actionType ? capitalize(item.actionType) : '-';
    if (item.reactionChecked) action += " Reaction";
    else if (action !== '-') action += " Action";
    return action;
}

export function formatTechniqueDamage(damageArr) {
    if (!Array.isArray(damageArr)) return '';
    return damageArr
        .filter(d => d && d.amount && d.size && d.amount !== '0' && d.size !== '0')
        .map(d => `Increased Damage: ${d.amount}d${d.size}`)
        .join(', ');
}

export function formatTechniqueParts(partsArr) {
    if (!Array.isArray(partsArr) || !partsArr.length) return '-';
    return partsArr.map(part => {
        let txt = part.part || '';
        if (part.opt1Level) txt += ` Opt 1: (${part.opt1Level})`;
        if (part.opt2Level) txt += ` Opt 2: (${part.opt2Level})`;
        if (part.opt3Level) txt += ` Opt 3: (${part.opt3Level})`;
        return txt;
    }).join(', ');
}

// Calculations
export function getBaseFeatPoints(level) {
    level = parseFloat(level) || 1;
    const martialProf = getMartialProficiency();
    if (level < 1) {
        // 4 * level + martial proficiency, rounded up
        return Math.ceil(4 * level) + martialProf;
    }
    let martialBonus = Math.min(martialProf, 2) * 1; // MARTIAL_BONUS_FEAT_POINTS = 1
    // If martial proficiency >= 2, get +1 per 3 levels after 4
    if (martialProf >= 2 && level >= 4) {
        martialBonus += Math.floor((level - 1) / 3) * 1; // MARTIAL_BONUS_FEAT_POINTS_LEVEL_4 = 1
    }
    let base = 4 + 1 * (level - 1); // BASE_FEAT_POINTS + FEAT_POINTS_PER_LEVEL * (level - 1)
    return base + martialBonus;
}

export function getSpecialFeatPoints() {
    // Removed all calculations for senses, movement, condition immunities, and Hover adjustments
    // These elements now only have names and descriptions, no feat point contributions
    return 0;
}

export function getSpentFeatPoints() {
    let points = feats.reduce((sum, f) => sum + (parseFloat(f.points) || 0), 0);
    points += getSpecialFeatPoints();
    return points;
}

export function getRemainingFeatPoints() {
    const level = document.getElementById("creatureLevel").value || 1;
    return getBaseFeatPoints(level) - getSpentFeatPoints();
}

export function getProficiency(level) {
    // Not used anymore for summary, use getPowerProficiency/getMartialProficiency directly
    return getMaxArchetypeProficiency(level);
}

export function getCreatureCurrency(level) {
    level = parseFloat(level) || 1;
    return calcCreatureCurrency(level);
}

export function getAbilityPointCost(val) {
    val = parseInt(val);
    if (isNaN(val)) return 0;
    if (val <= 4) return val;
    return 4 + (val - 4) * 2;
}

export function getAbilityPointTotal(level) {
    level = parseFloat(level) || 1;
    return calcAbilityPointTotal(level);
}

export function getSkillPointTotal() {
    const level = parseFloat(document.getElementById('creatureLevel')?.value) || 1;
    return calcSkillPointTotal(level);
}

export function getSkillPointsSpent() {
    let skillValuePoints = 0;
    for (const skill of creatureSkills) {
        skillValuePoints += creatureSkillValues[skill] || 0;
    }
    return Object.values(defenseSkillState).reduce((sum, v) => sum + v * 2, 0) + creatureSkills.length + skillValuePoints;
}

export function getSkillPointsRemaining() {
    return getSkillPointTotal() - getSkillPointsSpent();
}

export function getAbilityValue(id) {
    const el = document.getElementById(id);
    return el ? parseInt(el.value) || 0 : 0;
}

export function getSkillBonus(skillObj) {
    if (!skillObj) return 0;
    // Support both 'ability' (from DB) and 'abilities' (legacy)
    let abilityArr = [];
    if (Array.isArray(skillObj.abilities)) {
        abilityArr = skillObj.abilities;
    } else if (Array.isArray(skillObj.ability)) {
        abilityArr = skillObj.ability;
    } else if (typeof skillObj.ability === "string") {
        abilityArr = [skillObj.ability];
    }
    if (!abilityArr.length) return 0;
    const abilityMap = {
        strength: 'creatureAbilityStrength',
        vitality: 'creatureAbilityVitality',
        agility: 'creatureAbilityAgility',
        acuity: 'creatureAbilityAcuity',
        intelligence: 'creatureAbilityIntelligence',
        charisma: 'creatureAbilityCharisma'
    };
    let max = -Infinity;
    abilityArr.forEach(ability => {
        const id = abilityMap[ability.toLowerCase()];
        if (id) {
            const val = getAbilityValue(id);
            if (val > max) max = val;
        }
    });
    // Always use the skill's name for value lookup
    const skillName = skillObj.name;
    const skillValue = typeof creatureSkillValues[skillName] === "number" ? creatureSkillValues[skillName] : 0;
    return (max === -Infinity ? 0 : max) + skillValue;
}

export function getBaseDefenseValue(defense) {
    switch (defense) {
        case "Might": return 10 + getAbilityValue('creatureAbilityStrength');
        case "Fortitude": return 10 + getAbilityValue('creatureAbilityVitality');
        case "Reflex": return 10 + getAbilityValue('creatureAbilityAgility');
        case "Discernment": return 10 + getAbilityValue('creatureAbilityAcuity');
        case "Mental Fortitude": return 10 + getAbilityValue('creatureAbilityIntelligence');
        case "Resolve": return 10 + getAbilityValue('creatureAbilityCharisma');
        default: return 10;
    }
}

export function getHighestNonVitalityAbility() {
    const ids = [
        'creatureAbilityStrength',
        'creatureAbilityAgility',
        'creatureAbilityAcuity',
        'creatureAbilityIntelligence',
        'creatureAbilityCharisma'
    ];
    let max = -Infinity;
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const val = parseInt(el.value) || 0;
            if (val > max) max = val;
        }
    });
    return max === -Infinity ? 0 : max;
}

export function getLevelValue() {
    const l = document.getElementById('creatureLevel');
    return l ? parseFloat(l.value) || 1 : 1;
}

export function getVitalityValue() {
    const v = document.getElementById('creatureAbilityVitality');
    return v ? parseInt(v.value) || 0 : 0;
}

export function getBaseHitPoints() {
    return getLevelValue() * getVitalityValue();
}

export function getBaseEnergy() {
    return getLevelValue() * getHighestNonVitalityAbility();
}

export function getHitEnergyTotal(level) {
    level = parseFloat(level) || 1;
    return calcHitEnergyTotal(level);
}

export function getInnatePowers(level) {
    // Only grant innate powers if Power Proficiency > 0
    const powerProf = getPowerProficiency();
    if (powerProf <= 0) return 0;
    level = parseFloat(level) || 1;
    if (level < 1) return 0;
    return 2 + Math.floor((level - 1) / 3);
}

export function getInnateEnergy(innatePowers) {
    // Only grant innate energy if Power Proficiency > 0
    const powerProf = getPowerProficiency();
    if (powerProf <= 0 || innatePowers === 0) return 0;
    if (powerProf === 1) return 6;
    if (powerProf === 2) {
        // 8 + 1 per 3 levels after 4
        const level = getLevelValue();
        let bonus = 0;
        if (level >= 4) {
            bonus = Math.floor((level - 1) / 3);
        }
        return 8 + bonus;
    }
    if (powerProf > 2) {
        // For powerProf > 2, treat as 2 for this calculation (no extra benefit)
        const level = getLevelValue();
        let bonus = 0;
        if (level >= 4) {
            bonus = Math.floor((level - 1) / 3);
        }
        return 8 + bonus;
    }
    return 0;
}

// Remove hardcoded descriptions
// export const SENSES_DESCRIPTIONS = { ... };
// export const MOVEMENT_DESCRIPTIONS = { ... };

// Keep display names for UI
export const SENSES_DISPLAY = {
    "Darkvision": "Darkvision (6 spaces)",
    "Darkvision II": "Darkvision II (12 spaces)",
    "Darkvision III": "Darkvision III (24 spaces)",
    "Blindsense": "Blindsense (3 spaces)",
    "Blindsense II": "Blindsense II (6 spaces)",
    "Blindsense III": "Blindsense III (12 spaces)",
    "Blindsense IV": "Blindsense IV (24 spaces)",
    "Amphibious": "Amphibious",
    "All-Surface Climber": "All-Surface Climber",
    "Telepathy": "Telepathy (12 spaces)",
    "Telepathy II": "Telepathy II (48 spaces)",
    "Telepathically Intune": "Telepathically Intune (12 spaces)",
    "Waterbreathing": "Waterbreathing",
    "Unrestrained Movement": "Unrestrained Movement"
};

export const MOVEMENT_DISPLAY = {
    "Ground": "Ground",
    "Fly Half": "Flying (Half Speed)",
    "Fly": "Flying II (Full Speed)",
    "Burrow": "Burrow (Half Speed)",
    "Burrow II": "Burrow II (Full Speed)",
    "Jump": "Jump (Long 3, High 2 spaces)",
    "Jump II": "Jump II (Long 4, High 3 spaces)",
    "Jump III": "Jump III (Long 5, High 4 spaces)",
    "Speedy": "Speedy (+2 spaces)",
    "Speedy II": "Speedy II (+4 spaces)",
    "Speedy III": "Speedy III (+6 spaces)",
    "Slow": "Slow (-2 spaces)",
    "Slow II": "Slow II (-4 spaces)",
    "Slow III": "Slow III (-6 spaces)",
    "Slow Walker": "Slow Walker",
    "Hover": "Hover"
};

// For base TP, update where it's calculated in summary/details
// In updateCreatureDetailsBox and updateSummary, replace:
// const baseTP = (22 + highestAbility) + ((2 + highestAbility) * (parseFloat(level) - 1));
// with:
export function getBaseTP(level, highestAbility) {
    level = parseFloat(level) || 1;
    if (level < 1) {
        return Math.ceil(22 * level) + highestAbility;
    }
    return (22 + highestAbility) + ((2 + highestAbility) * (level - 1));
}

// Ensure all feat-related logic dynamically fetches data from the database
