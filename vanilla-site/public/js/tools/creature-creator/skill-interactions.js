import { creatureSkills, creatureSkillValues, defenseSkillState } from './state.js';
import { getSkillPointsRemaining, getSkillBonus, getBaseDefenseValue } from './utils.js';
import { findByIdOrName } from '/js/shared/id-constants.js';

let skills = []; // Will be set in initCreatureSkills

export function updateSkillsList() {
    const ul = document.getElementById("skillsList");
    ul.innerHTML = "";
    creatureSkills.slice().sort().forEach((skill, idx) => {
        const li = document.createElement("li");
        li.textContent = skill + formatSkillBonusDisplay(skill);
        const skillValue = typeof creatureSkillValues[skill] === "number" ? creatureSkillValues[skill] : 0;
        const minusBtn = document.createElement("button");
        minusBtn.textContent = "-";
        minusBtn.className = "small-button";
        minusBtn.style.marginLeft = "8px";
        minusBtn.onclick = () => {
            if (creatureSkillValues[skill] > 0) {
                creatureSkillValues[skill]--;
                updateSkillsList();
                updateDefensesUI();
                updateSummary();
            }
        };
        minusBtn.disabled = skillValue <= 0;
        const valueSpan = document.createElement("span");
        valueSpan.textContent = ` ${skillValue} `;
        valueSpan.style.fontWeight = "bold";
        valueSpan.style.margin = "0 2px";
        const plusBtn = document.createElement("button");
        plusBtn.textContent = "+";
        plusBtn.className = "small-button";
        plusBtn.onclick = () => {
            if (creatureSkillValues[skill] < 3 && getSkillPointsRemaining() > 0) {
                creatureSkillValues[skill]++;
                updateSkillsList();
                updateDefensesUI();
                updateSummary();
            }
        };
        plusBtn.disabled = skillValue >= 3 || getSkillPointsRemaining() <= 0;
        const skillObj = findByIdOrName(skills, { name: skill });
        if (skillObj && skillObj.description) {
            li.title = skillObj.description;
        }
        li.appendChild(minusBtn);
        li.appendChild(valueSpan);
        li.appendChild(plusBtn);
        const btn = document.createElement("button");
        btn.textContent = "✕";
        btn.className = "small-button red-button";
        btn.onclick = () => {
            creatureSkills.splice(idx, 1);
            delete creatureSkillValues[skill];
            updateSkillsList();
            updateSkillsDropdownOptions();
            updateDefensesUI();
            updateSummary();
        };
        li.appendChild(btn);
        ul.appendChild(li);
    });
    let skillPointsDisplay = document.getElementById("skillPointsBoxDisplay");
    if (!skillPointsDisplay) {
        skillPointsDisplay = document.createElement("div");
        skillPointsDisplay.id = "skillPointsBoxDisplay";
        skillPointsDisplay.style.marginTop = "8px";
        skillPointsDisplay.style.fontWeight = "bold";
        ul.parentElement.appendChild(skillPointsDisplay);
    }
    const points = getSkillPointsRemaining();
    skillPointsDisplay.textContent = `Skill Points Remaining: ${points}`;
    skillPointsDisplay.style.color = points < 0 ? "red" : "";
}

export function updateSkillsDropdownOptions() {
    const skillsDropdown = document.getElementById("skillsDropdown");
    while (skillsDropdown.options.length > 1) skillsDropdown.remove(1);
    skills
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(skill => {
            if (skill.subSkill) {
                if (!skill.baseSkill || !creatureSkills.includes(skill.baseSkill)) return;
            }
            if (creatureSkills.includes(skill.name)) return;
            const opt = document.createElement("option");
            opt.value = skill.name;
            opt.textContent = skill.name;
            if (skill.description) opt.title = skill.description;
            skillsDropdown.appendChild(opt);
        });
}

export function formatSkillBonusDisplay(skillName) {
    const skillObj = findByIdOrName(skills, { name: skillName });
    if (!skillObj) return "";
    const bonus = getSkillBonus(skillObj);
    const sign = bonus >= 0 ? "+" : "";
    return ` (${sign}${bonus})`;
}

// Dummy stubs for updateDefensesUI and updateSummary, to be replaced by actual imports in integration
function updateDefensesUI() {}
function updateSummary() {}

// Main initialization for skills UI
export function initCreatureSkills(deps = {}) {
    if (deps.skills && Array.isArray(deps.skills)) {
        skills = deps.skills;
    }
    // Provide hooks for updateDefensesUI and updateSummary if passed
    if (typeof deps.updateDefensesUI === "function") updateDefensesUI = deps.updateDefensesUI;
    if (typeof deps.updateSummary === "function") updateSummary = deps.updateSummary;

    updateSkillsDropdownOptions();
    updateSkillsList();
    document.getElementById("addSkillBtn").onclick = () => {
        const val = document.getElementById("skillsDropdown").value;
        if (!val) return;
        const skillObj = findByIdOrName(skills, { name: val });
        if (skillObj && skillObj.subSkill && skillObj.baseSkill && !creatureSkills.includes(skillObj.baseSkill)) {
            alert(`You must add the base skill "${skillObj.baseSkill}" before adding "${skillObj.name}".`);
            return;
        }
        if (getSkillPointsRemaining() < 1) {
            alert("You do not have enough skill points to add another skill.");
            return;
        }
        if (!creatureSkills.includes(val)) {
            creatureSkills.push(val);
            creatureSkillValues[val] = 0;
            updateSkillsList();
            updateSkillsDropdownOptions();
            updateDefensesUI();
            updateSummary();
        }
    };
    if (!document.getElementById("removeAllSkillsBtn")) {
        const removeAllSkillsBtn = document.createElement("button");
        removeAllSkillsBtn.id = "removeAllSkillsBtn";
        removeAllSkillsBtn.textContent = "Remove All";
        removeAllSkillsBtn.className = "small-button red-button";
        removeAllSkillsBtn.style.marginLeft = "5px";
        removeAllSkillsBtn.onclick = () => {
            creatureSkills.length = 0;
            for (const k in creatureSkillValues) delete creatureSkillValues[k];
            updateSkillsList();
            updateSkillsDropdownOptions();
            updateDefensesUI();
            updateSummary();
        };
        document.getElementById("addSkillBtn").after(removeAllSkillsBtn);
    }

    // --- Ensure skills update when abilities change ---
    document.querySelectorAll('.creature-ability-dropdown').forEach(dropdown => {
        dropdown.addEventListener('change', () => {
            updateSkillsList();
        });
    });
}
