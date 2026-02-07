import { toStrArray, toNumArray } from '../shared/array-utils.js';
// Note: This file uses Firebase compat SDK loaded via script tags.
// Environment config is loaded globally as window.RealmsEnv from environment.js
// which must be imported in the HTML page before this script runs.

let firebaseInitialized = false;
let auth, db, rtdb; // Add rtdb for Realtime Database

export async function initializeFirebase() {
    if (firebaseInitialized) return { auth, db, rtdb };
    
    return new Promise((resolve, reject) => {
        const checkFirebase = setInterval(() => {
            if (typeof firebase !== 'undefined') {
                clearInterval(checkFirebase);
                
                auth = firebase.auth();
                db = firebase.firestore();
                rtdb = firebase.database(); // Initialize Realtime Database
                
                // Get reCAPTCHA site key from global environment config
                const recaptchaSiteKey = window.RealmsEnv?.RECAPTCHA_SITE_KEY || '__RECAPTCHA_SITE_KEY_PROD__';
                
                // NEW: Activate App Check BEFORE waiting for auth
                let appCheckReady = Promise.resolve();
                if (firebase.appCheck) {
                    appCheckReady = new Promise((resolveAppCheck) => {
                        try {
                            firebase.appCheck().activate(
                                recaptchaSiteKey,
                                true
                            );
                            console.log('[CharacterSheet] App Check activated');
                            // Wait a moment for token generation
                            setTimeout(resolveAppCheck, 500);
                        } catch (err) {
                            console.warn('[CharacterSheet] App Check activation failed:', err);
                            resolveAppCheck();
                        }
                    });
                }
                
                // Wait for both App Check AND auth state
                appCheckReady.then(() => {
                    firebase.auth().onAuthStateChanged((user) => {
                        firebaseInitialized = true;
                        resolve({ auth, db, rtdb, user });
                    });
                });
            }
        }, 100);
        
        setTimeout(() => {
            clearInterval(checkFirebase);
            reject(new Error('Firebase initialization timeout'));
        }, 10000);
    });
}

export function waitForAuth() {
    return new Promise((resolve) => {
        if (!auth) {
            resolve(null);
            return;
        }
        const u = auth.currentUser;
        if (u) {
            resolve(u);
        } else {
            const unsub = auth.onAuthStateChanged(user => {
                unsub();
                resolve(user);
            });
        }
    });
}

export { auth, db, rtdb };

// Load feats from Realtime Database using compat SDK
export async function loadFeatsFromDatabase() {
    try {
        // Ensure Firebase is initialized
        if (!rtdb) {
            await initializeFirebase();
        }
        
        const featsRef = rtdb.ref('feats');
        const snapshot = await featsRef.once('value');
        const data = snapshot.val();
        
        if (!data) {
            console.warn('No feats found in database');
            return [];
        }

        const feats = Object.values(data).map(f => ({
            ...f,
            ability_req: toStrArray(f.ability_req),
            abil_req_val: toNumArray(f.abil_req_val),
            tags: toStrArray(f.tags),
            skill_req: toStrArray(f.skill_req),
            skill_req_val: toNumArray(f.skill_req_val),
            lvl_req: parseInt(f.lvl_req) || 0,
            uses_per_rec: parseInt(f.uses_per_rec) || 0,
            mart_abil_req: f.mart_abil_req || '',
            char_feat: f.char_feat || false,
        }));

        console.log(`✓ Loaded ${feats.length} feats from database`);
        return feats;
    } catch (error) {
        console.error('Error loading feats from database:', error);
        return [];
    }
}

// Load technique parts from Realtime Database using compat SDK
export async function loadTechniquePartsFromDatabase() {
    try {
        // Ensure Firebase is initialized
        if (!rtdb) {
            await initializeFirebase();
        }
        
        const partsRef = rtdb.ref('parts');
        const snapshot = await partsRef.once('value');
        const data = snapshot.val();
        
        if (!data) {
            console.warn('No technique parts found in database');
            return [];
        }

        // Filter for technique parts only
        const techniqueParts = Object.entries(data)
            .filter(([id, part]) => part.type && part.type.toLowerCase() === 'technique')
            .map(([id, part]) => ({
                id: id,
                name: part.name || '',
                description: part.description || '',
                base_en: parseFloat(part.base_en) || 0,
                base_tp: parseFloat(part.base_tp) || 0,
                op_1_en: parseFloat(part.op_1_en) || 0,
                op_1_tp: parseFloat(part.op_1_tp) || 0,
                op_2_en: parseFloat(part.op_2_en) || 0,
                op_2_tp: parseFloat(part.op_2_tp) || 0,
                op_3_en: parseFloat(part.op_3_en) || 0,
                op_3_tp: parseFloat(part.op_3_tp) || 0,
                mechanic: part.mechanic === 'true' || part.mechanic === true,
                percentage: part.percentage === 'true' || part.percentage === true
            }));

        console.log(`✓ Loaded ${techniqueParts.length} technique parts from database`);
        return techniqueParts;
    } catch (error) {
        console.error('Error loading technique parts from database:', error);
        return [];
    }
}

// Load power parts from Realtime Database using compat SDK
export async function loadPowerPartsFromDatabase() {
    try {
        if (!rtdb) await initializeFirebase();
        const partsRef = rtdb.ref('parts');
        const snap = await partsRef.once('value');
        const data = snap.val();
        if (!data) return [];
        const powerParts = Object.entries(data)
            .filter(([_, p]) => p.type && String(p.type).toLowerCase() === 'power')
            .map(([id, p]) => ({
                id,
                name: p.name || '',
                description: p.description || '',
                category: p.category || '',
                base_en: parseFloat(p.base_en) || 0,
                base_tp: parseFloat(p.base_tp) || 0,
                op_1_desc: p.op_1_desc || '',
                op_1_en: parseFloat(p.op_1_en) || 0,
                op_1_tp: parseFloat(p.op_1_tp) || 0,
                op_2_desc: p.op_2_desc || '',
                op_2_en: parseFloat(p.op_2_en) || 0,
                op_2_tp: parseFloat(p.op_2_tp) || 0,
                op_3_desc: p.op_3_desc || '',
                op_3_en: parseFloat(p.op_3_en) || 0,
                op_3_tp: parseFloat(p.op_3_tp) || 0,
                mechanic: p.mechanic === true || p.mechanic === 'true',
                percentage: p.percentage === true || p.percentage === 'true',
                duration: p.duration === true || p.duration === 'true'
            }));
        console.log(`✓ Loaded ${powerParts.length} power parts from database`);
        return powerParts;
    } catch (e) {
        console.error('Error loading power parts:', e);
        return [];
    }
}

// Load equipment/items from Realtime Database
export async function loadEquipmentFromDatabase() {
    try {
        if (!rtdb) {
            await initializeFirebase();
        }
        
        const itemsRef = rtdb.ref('items');
        const snapshot = await itemsRef.once('value');
        const data = snapshot.val();
        
        if (!data) {
            console.warn('No items found in database');
            return [];
        }

        const equipment = Object.values(data).map(item => ({
            name: item.name || '',
            description: item.description || '',
            category: item.category || '',
            currency: parseInt(item.currency) || 0,
            rarity: item.rarity || 'Common'
        }));

        console.log(`✓ Loaded ${equipment.length} equipment items from database`);
        return equipment;
    } catch (error) {
        console.error('Error loading equipment from database:', error);
        return [];
    }
}
