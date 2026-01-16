import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app-check.js";
import { AUTH_DOMAIN, RECAPTCHA_SITE_KEY } from '../../core/environment.js';
//import skills from '../scripts/skillsData.js';
//import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-functions.js";

// Import from modules
import * as creatureState from './state.js';
import * as creatureInteractions from './interactions.js';
import * as creatureModals from './modals.js';
import * as creatureSaveLoad from './save-load.js';
import * as creatureSkillInteractions from './skill-interactions.js';

// --- Firebase Initialization (v11 compat, global) ---
let firebaseApp, firebaseAuth, firebaseDb, currentUser, firebaseRTDB;
let authReadyPromise = new Promise(resolve => {
    document.addEventListener('DOMContentLoaded', async function() {
        const response = await fetch('/__/firebase/init.json');
        const firebaseConfig = await response.json();
        firebaseConfig.authDomain = AUTH_DOMAIN;
        firebaseApp = initializeApp(firebaseConfig);

        initializeAppCheck(firebaseApp, {
            provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
            isTokenAutoRefreshEnabled: true
        });

        firebaseAuth = getAuth(firebaseApp);
        firebaseDb = getFirestore(firebaseApp);

        // Add Realtime Database
        const { getDatabase } = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js");
        firebaseRTDB = getDatabase(firebaseApp);

        onAuthStateChanged(firebaseAuth, (user) => {
            currentUser = user;
            creatureModals.setFirebaseDeps(user, firebaseDb, authReadyPromise);
            resolve();
        });
    });
});

// --- Skills Loader ---
async function loadSkillsFromFirebase() {
    if (!firebaseRTDB) return [];
    const { get, ref } = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js");
    try {
        const snapshot = await get(ref(firebaseRTDB, 'skills'));
        if (snapshot.exists()) {
            return Object.values(snapshot.val());
        }
    } catch (e) {
        console.error("Failed to load skills from Firebase:", e);
    }
    return [];
}


import { getHighestAbility } from './utils.js';

function updateDetailsTP() {
    const level = parseFloat(document.getElementById('creatureLevel')?.value || 1);
    const highestAbility = getHighestAbility();
    const totalTP = 22 + highestAbility + ((highestAbility + 2) * (level - 1));
    document.getElementById('detailsTP').textContent = totalTP;
    // --- Add this to update the details box for feat/skill points/currency ---
    if (window.creatureInteractions && typeof window.creatureInteractions.updateCreatureDetailsBox === "function") {
        window.creatureInteractions.updateCreatureDetailsBox();
    }
}

// --- Main Entry Point: Delegate all UI/event logic to modules ---
document.addEventListener('DOMContentLoaded', async () => {
    await authReadyPromise;
    // Load skills from Firebase RTDB before initializing UI
    const skills = await loadSkillsFromFirebase();
    // Provide skills to modules via dependency injection
    if (creatureSaveLoad && typeof creatureSaveLoad.setSkills === 'function') {
        creatureSaveLoad.setSkills(skills);
    }
    if (creatureInteractions && typeof creatureInteractions.initCreatureCreator === 'function') {
        creatureInteractions.initCreatureCreator({
            firebaseApp,
            firebaseAuth,
            firebaseDb,
            firebaseRTDB,
            currentUser,
            authReadyPromise,
            skills,
            ...creatureState,
            ...creatureModals,
            ...creatureSaveLoad
        });
    }
    // --- Initialize skill interactions ---
    if (creatureSkillInteractions && typeof creatureSkillInteractions.initCreatureSkills === 'function') {
        creatureSkillInteractions.initCreatureSkills({
            skills,
            updateDefensesUI: creatureInteractions.updateDefensesUI,
            updateSummary: creatureInteractions.updateSummary
        });
    }
    // If the modules do not provide an init function, ensure all UI/event logic is handled in those modules.
});

// Expose Firebase/auth for modules if needed
export { firebaseApp, firebaseAuth, firebaseDb, firebaseRTDB, currentUser, authReadyPromise };

// Attach listeners after DOM loaded
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('creatureLevel')?.addEventListener('input', updateDetailsTP);
    [
        'creatureAbilityStrength',
        'creatureAbilityVitality',
        'creatureAbilityAgility',
        'creatureAbilityAcuity',
        'creatureAbilityIntelligence',
        'creatureAbilityCharisma'
    ].forEach(id => {
        document.getElementById(id)?.addEventListener('change', updateDetailsTP);
    });
    updateDetailsTP();
});
