import { 
    resistances, weaknesses, immunities, senses, movement, feats, powersTechniques, armaments, creatureSkills, creatureSkillValues, 
    creatureLanguages, conditionImmunities, defenseSkillState 
} from './state.js';
import { getAbilityValue, getSkillBonus, getBaseDefenseValue } from './utils.js';
import { authReadyPromise, currentUser, firebaseDb } from './main.js';
import { collection, doc, setDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { findByIdOrName } from '/js/shared/id-constants.js';

// Utility: Get IDs from array of objects
function extractIds(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.map(obj => obj && obj.id ? obj.id : null).filter(Boolean);
}

let skills = [];
export function setSkills(skillsArr) {
    skills = Array.isArray(skillsArr) ? skillsArr : [];
}

// Gather all creature data for saving
// Streamlined format: stores names/references only for feats, powers, techniques, armaments
export async function getCreatureSaveData() {
    // Basic info
    const creatureName = document.getElementById("creatureName")?.value || "";
    const level = parseFloat(document.getElementById("creatureLevel")?.value) || 1;
    const type = document.getElementById("creatureType")?.value || "";
    const description = document.getElementById("creatureDescription")?.value || "";
    
    // Proficiencies
    const powerProficiency = parseInt(document.getElementById("powerProficiencyInput")?.value) || 0;
    const martialProficiency = parseInt(document.getElementById("martialProficiencyInput")?.value) || 0;
    
    // Hit Points and Energy
    const hitPoints = parseInt(document.getElementById('hitPointsInput')?.value) || 0;
    const energy = parseInt(document.getElementById('energyInput')?.value) || 0;
    
    // Abilities (values only)
    const abilities = {
        strength: getAbilityValue('creatureAbilityStrength'),
        vitality: getAbilityValue('creatureAbilityVitality'),
        agility: getAbilityValue('creatureAbilityAgility'),
        acuity: getAbilityValue('creatureAbilityAcuity'),
        intelligence: getAbilityValue('creatureAbilityIntelligence'),
        charisma: getAbilityValue('creatureAbilityCharisma')
    };
    
    // Defenses (calculated values)
    const defenses = {
        might: getBaseDefenseValue("Might") + (defenseSkillState["Might"] || 0),
        fortitude: getBaseDefenseValue("Fortitude") + (defenseSkillState["Fortitude"] || 0),
        reflex: getBaseDefenseValue("Reflex") + (defenseSkillState["Reflex"] || 0),
        discernment: getBaseDefenseValue("Discernment") + (defenseSkillState["Discernment"] || 0),
        mentalFortitude: getBaseDefenseValue("Mental Fortitude") + (defenseSkillState["Mental Fortitude"] || 0),
        resolve: getBaseDefenseValue("Resolve") + (defenseSkillState["Resolve"] || 0)
    };
    
    // Skills (name and bonus value)
    const skillsArr = creatureSkills.slice().map(skillName => {
        const skillObj = findByIdOrName(skills, { name: skillName });
        const bonus = getSkillBonus(skillObj);
        const value = typeof creatureSkillValues[skillName] === "number" ? creatureSkillValues[skillName] : 0;
        return { name: skillName, bonus, value };
    });
    
    // Feats (names only in array)
    const featsArr = feats.map(f => typeof f === "string" ? f : (f.name || "")).filter(Boolean);
    
    // Resistances, Weaknesses, Immunities (names only)
    const resistancesArr = resistances.slice();
    const weaknessesArr = weaknesses.slice();
    const immunitiesArr = immunities.slice();
    const conditionImmunitiesArr = conditionImmunities.slice();
    
    // Senses and Movement (names only)
    const sensesArr = senses.slice();
    const movementArr = movement.map(m => m.type || m);
    
    // Languages
    const languagesArr = creatureLanguages.slice();
    
    // Powers (names only)
    const powersArr = powersTechniques
        .filter(x => x.type === "power")
        .map(p => p.name || "")
        .filter(Boolean);
    
    // Techniques (names only)
    const techniquesArr = powersTechniques
        .filter(x => x.type === "technique")
        .map(t => t.name || "")
        .filter(Boolean);
    
    // Armaments (names only)
    const armamentsArr = armaments
        .map(a => a.name || "")
        .filter(Boolean);
    
    return {
        name: creatureName,
        level,
        type,
        description,
        powerProficiency,
        martialProficiency,
        hitPoints,
        energy,
        abilities,
        defenses,
        skills: skillsArr,
        feats: featsArr,
        resistances: resistancesArr,
        weaknesses: weaknessesArr,
        immunities: immunitiesArr,
        conditionImmunities: conditionImmunitiesArr,
        senses: sensesArr,
        movement: movementArr,
        languages: languagesArr,
        powers: powersArr,
        techniques: techniquesArr,
        armaments: armamentsArr
    };
}

// Save Creature to Library
export async function saveCreatureToLibrary() {
    await authReadyPromise;
    if (!currentUser || !firebaseDb) {
        alert("You must be logged in to save creatures.");
        return;
    }
    const creatureName = document.getElementById("creatureName")?.value?.trim();
    if (!creatureName) {
        alert("Please enter a name for your creature.");
        return;
    }
    const creatureData = await getCreatureSaveData();
    try {
        const creaturesRef = collection(firebaseDb, 'users', currentUser.uid, 'creatureLibrary');
        const q = query(creaturesRef, where('name', '==', creatureName));
        const querySnapshot = await getDocs(q);
        let docRef;
        if (!querySnapshot.empty) {
            docRef = doc(firebaseDb, 'users', currentUser.uid, 'creatureLibrary', querySnapshot.docs[0].id);
        } else {
            docRef = doc(creaturesRef);
        }
        await setDoc(docRef, {
            name: creatureName,
            ...creatureData,
            timestamp: new Date()
        });
        alert("Creature saved to your library!");
    } catch (error) {
        console.error("Error saving creature:", error.message, error.stack);
        alert("Error saving creature: " + error.message);
    }
}

// Load all saved creatures
export async function loadSavedCreatures() {
    await authReadyPromise;
    if (!currentUser || !firebaseDb) return [];
    try {
        const querySnapshot = await getDocs(collection(firebaseDb, 'users', currentUser.uid, 'creatureLibrary'));
        const creatures = [];
        querySnapshot.forEach(docSnap => {
            creatures.push({ id: docSnap.id, ...docSnap.data() });
        });
        return creatures;
    } catch (error) {
        alert("Error fetching saved creatures: " + (error.message || error));
        return [];
    }
}

// Display saved creatures in a modal
export function displaySavedCreatures(creatures) {
    const creatureList = document.getElementById('savedCreaturesList');
    creatureList.innerHTML = '';
    if (!creatures.length) {
        creatureList.innerHTML = '<div>No saved creatures found.</div>';
        return;
    }
    creatures.forEach(creature => {
        const div = document.createElement('div');
        div.className = 'creature-item';
        div.innerHTML = `
            <span>${creature.name} (Level: ${creature.level || '-'})</span>
            <button class="small-button blue-button select-creature-btn" data-id="${creature.id}">Load</button>
        `;
        creatureList.appendChild(div);
    });
}

// Open the load creature modal
export function openCreatureModal() {
    if (!currentUser) {
        alert('Please log in to access saved creatures.');
        return;
    }
    const modal = document.getElementById('loadCreatureModal');
    modal.style.display = 'block';
    loadSavedCreatures().then(displaySavedCreatures);
}

// Close the load creature modal
export function closeCreatureModal() {
    document.getElementById('loadCreatureModal').style.display = 'none';
}

// Load a creature into the UI
export async function loadCreatureById(creatureId) {
    await authReadyPromise;
    if (!currentUser || !firebaseDb) return;
    try {
        const docSnap = await getDocs(query(
            collection(firebaseDb, 'users', currentUser.uid, 'creatureLibrary'),
            where('__name__', '==', creatureId)
        ));
        if (!docSnap.empty) {
            const creature = docSnap.docs[0].data();
            loadCreature(creature);
        }
    } catch (error) {
        alert("Error loading creature: " + (error.message || error));
    }
}

// Populate the UI with creature data
export function loadCreature(creature) {
    document.getElementById("creatureName").value = creature.name || "";
    document.getElementById("creatureLevel").value = creature.level || 1;
    document.getElementById("creatureType").value = creature.type || "";
    if (document.getElementById("powerProficiencyInput")) {
        document.getElementById("powerProficiencyInput").value = creature.powerProficiency || 0;
    }
    if (document.getElementById("martialProficiencyInput")) {
        document.getElementById("martialProficiencyInput").value = creature.martialProficiency || 0;
    }
    if (document.getElementById("creatureDescription")) {
        document.getElementById("creatureDescription").value = creature.description || "";
    }
    // When loading feats, if you need to set points, use feat_points
    alert("Creature loaded! (You must implement full UI population logic.)");
    updateSummary();
}

// Add Save/Load Creature Buttons and Modal to UI
export function addSaveLoadCreatureUI() {
    const container = document.getElementById("creatureCreatorContainer");
    if (!container) return;
    if (!document.getElementById("saveCreatureButton")) {
        const btn = document.createElement("button");
        btn.id = "saveCreatureButton";
        btn.className = "medium-button blue-button";
        btn.textContent = "Save Creature";
        btn.style.margin = "16px 0";
        btn.onclick = saveCreatureToLibrary;
        container.insertBefore(btn, container.firstChild);
    }
    if (!document.getElementById("loadCreatureButton")) {
        const btn = document.createElement("button");
        btn.id = "loadCreatureButton";
        btn.className = "medium-button blue-button";
        btn.textContent = "Load Creature";
        btn.style.margin = "16px 8px";
        btn.onclick = openCreatureModal;
        container.insertBefore(btn, container.firstChild.nextSibling);
    }
    if (!document.getElementById("loadCreatureModal")) {
        const modal = document.createElement("div");
        modal.id = "loadCreatureModal";
        modal.className = "modal";
        modal.style.display = "none";
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-button" id="closeCreatureModalBtn">&times;</span>
                <h3>Load Creature</h3>
                <div id="savedCreaturesList"></div>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById("closeCreatureModalBtn").onclick = closeCreatureModal;
        modal.addEventListener('click', async (e) => {
            if (e.target.classList.contains('select-creature-btn')) {
                const creatureId = e.target.dataset.id;
                await loadCreatureById(creatureId);
                closeCreatureModal();
            }
        });
    }
}
