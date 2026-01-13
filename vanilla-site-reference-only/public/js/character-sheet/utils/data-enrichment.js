/**
 * Centralized Data Enrichment Utility
 * 
 * Handles all data normalization and enrichment for character data,
 * pairing raw character data with full objects from Firebase/RTDB.
 * 
 * This eliminates duplication between main.js and library.js.
 */

import { formatPowerDamage, derivePowerDisplay } from '../../calculators/power-calc.js';
import { deriveTechniqueDisplay } from '../../calculators/technique-calc.js';
import { deriveItemDisplay } from '../../calculators/item-calc.js';
import { 
    fetchPowerParts, 
    fetchTechniqueParts, 
    fetchItemProperties, 
    fetchAllFeats, 
    fetchEquipment,
    clearAllCaches
} from '../../core/rtdb-cache.js';
import { findByIdOrName, PROPERTY_IDS } from '/js/shared/id-constants.js';

// Re-export cache functions for backwards compatibility
export { fetchPowerParts, fetchTechniqueParts, fetchItemProperties, fetchAllFeats, fetchEquipment };

/**
 * Clear all caches (alias to rtdb-cache clearAllCaches)
 */
export function clearEnrichmentCaches() {
    clearAllCaches();
}

// ============================================================================
// Enrichment Functions
// ============================================================================

/**
 * Enrich feats with full data from RTDB
 * @param {Array} characterFeats - Array of feat names or {name, currentUses} objects
 * @returns {Object} - { displayFeats, saveableFeats }
 */
export async function enrichFeats(characterFeats) {
    const allFeats = await fetchAllFeats();
    const featEntries = Array.isArray(characterFeats) ? characterFeats : [];
    
    const displayFeats = featEntries.map(featEntry => {
        const featName = typeof featEntry === 'string' ? featEntry : (featEntry?.name || '');
        const currentUses = typeof featEntry === 'object' && typeof featEntry.currentUses === 'number'
            ? featEntry.currentUses
            : undefined;
        const unmetRequirements = typeof featEntry === 'object' && featEntry.unmetRequirements === true;
        
        if (!featName) return null;
        
        const featData = findByIdOrName(allFeats, featEntry);
        if (featData) {
            return {
                name: featData.name,
                description: featData.description || 'No description',
                category: featData.char_feat ? 'Character' : 'Archetype',
                uses: featData.uses_per_rec || 0,
                recovery: featData.rec_period || 'Full Recovery',
                currentUses: typeof currentUses === 'number' ? currentUses : featData.uses_per_rec || 0,
                char_feat: !!featData.char_feat,
                state_feat: !!featData.state_feat,
                feat_lvl: parseInt(featData.feat_lvl) || 1,
                unmetRequirements
            };
        }
        
        return {
            name: featName,
            description: 'No description available',
            category: 'Character',
            uses: 0,
            recovery: 'Full Recovery',
            currentUses: typeof currentUses === 'number' ? currentUses : 0,
            char_feat: false,
            state_feat: false,
            feat_lvl: 1,
            unmetRequirements
        };
    }).filter(Boolean);
    
    // Saveable format: only name, currentUses, and unmetRequirements
    const saveableFeats = featEntries.map(featEntry => {
        if (typeof featEntry === 'string') return featEntry;
        if (featEntry && typeof featEntry === 'object' && featEntry.name) {
            const obj = { name: featEntry.name };
            if (typeof featEntry.currentUses === 'number') obj.currentUses = featEntry.currentUses;
            if (featEntry.unmetRequirements === true) obj.unmetRequirements = true;
            return obj;
        }
        return null;
    }).filter(Boolean);
    
    return { displayFeats, saveableFeats };
}

/**
 * Enrich techniques with full data from user's Firestore library
 * @param {Array} characterTechniques - Array of technique names
 * @param {string} userId - Firebase user ID
 * @returns {Object} - { displayTechniques, saveableTechniques }
 */
export async function enrichTechniques(characterTechniques, userId) {
    const techniquePartsDb = await fetchTechniqueParts();
    const techEntries = Array.isArray(characterTechniques) ? characterTechniques : [];
    
    if (!userId || !window.firebase?.firestore) {
        return { displayTechniques: [], saveableTechniques: techEntries };
    }
    
    try {
        const db = window.firebase.firestore();
        const techSnap = await db.collection('users').doc(userId).collection('techniqueLibrary').get();
        
        const allTechniques = [];
        techSnap.forEach(docSnap => {
            const t = docSnap.data();
            allTechniques.push({ ...t, id: docSnap.id });
        });
        
        const displayTechniques = techEntries.map(entry => {
            const name = typeof entry === 'string' ? entry : (entry?.name || '');
            if (!name) return null;
            
            const found = findByIdOrName(allTechniques, entry);
            if (!found) {
                return {
                    name,
                    description: 'No description available',
                    energy: 0,
                    actionType: 'Basic Action',
                    weaponName: 'Unarmed',
                    damageStr: '',
                    parts: [],
                    partChipsHTML: ''
                };
            }
            
            const display = deriveTechniqueDisplay(found, techniquePartsDb);
            return {
                ...found,
                ...display,
                partsDb: techniquePartsDb
            };
        }).filter(Boolean);
        
        // Saveable format: only names
        const saveableTechniques = techEntries.map(t => 
            typeof t === 'string' ? t : (t?.name || '')
        ).filter(Boolean);
        
        return { displayTechniques, saveableTechniques };
    } catch (e) {
        console.warn('[DataEnrichment] Failed to enrich techniques:', e);
        return { displayTechniques: [], saveableTechniques: techEntries };
    }
}

/**
 * Enrich powers with full data from user's Firestore library
 * @param {Array} characterPowers - Array of power names
 * @param {string} userId - Firebase user ID
 * @returns {Object} - { displayPowers, saveablePowers }
 */
export async function enrichPowers(characterPowers, userId) {
    const powerPartsDb = await fetchPowerParts();
    const powerEntries = Array.isArray(characterPowers) ? characterPowers : [];
    
    if (!userId || !window.firebase?.firestore) {
        return { displayPowers: [], saveablePowers: powerEntries };
    }
    
    try {
        const db = window.firebase.firestore();
        const powersSnap = await db.collection('users').doc(userId).collection('library').get();
        
        const allPowers = [];
        powersSnap.forEach(docSnap => {
            const p = docSnap.data();
            allPowers.push({ ...p, id: docSnap.id });
        });
        
        const displayPowers = powerEntries.map(entry => {
            const name = typeof entry === 'string' ? entry : (entry?.name || '');
            const innate = typeof entry === 'object' ? !!entry.innate : false;
            if (!name) return null;
            
            const found = findByIdOrName(allPowers, entry);
            if (!found) {
                return {
                    name,
                    innate,
                    description: 'No description available',
                    energy: 0,
                    actionType: 'Basic Action',
                    damageStr: '',
                    area: '',
                    duration: '',
                    partChipsHTML: ''
                };
            }
            
            const display = derivePowerDisplay(found, powerPartsDb);
            return {
                ...found,
                ...display,
                innate,
                partsDb: powerPartsDb
            };
        }).filter(Boolean);
        
        // Saveable format: objects with name and innate flag
        const saveablePowers = powerEntries.map(p => {
            const name = typeof p === 'string' ? p : (p?.name || '');
            const innate = typeof p === 'object' ? !!p.innate : false;
            return name ? { name, innate } : null;
        }).filter(Boolean);
        
        return { displayPowers, saveablePowers };
    } catch (e) {
        console.warn('[DataEnrichment] Failed to enrich powers:', e);
        return { displayPowers: [], saveablePowers: powerEntries };
    }
}

/**
 * Enrich weapons with full data from user's Firestore item library
 * @param {Array} characterWeapons - Array of weapon names or {name, equipped} objects
 * @param {string} userId - Firebase user ID
 * @returns {Object} - { displayWeapons, saveableWeapons, allItems }
 */
export async function enrichWeapons(characterWeapons, userId) {
    const itemPropsDb = await fetchItemProperties();
    const weaponEntries = Array.isArray(characterWeapons) ? characterWeapons : [];
    
    if (!userId || !window.firebase?.firestore) {
        return { displayWeapons: [], saveableWeapons: weaponEntries, allItems: [] };
    }
    
    try {
        const db = window.firebase.firestore();
        const itemSnap = await db.collection('users').doc(userId).collection('itemLibrary').get();
        
        const allItems = [];
        itemSnap.forEach(docSnap => {
            const i = docSnap.data();
            allItems.push({ ...i, id: docSnap.id });
        });
        
        // Cache globally for session
        window.userItemLibrary = allItems;
        
        const displayWeapons = weaponEntries.map(entry => {
            const name = typeof entry === 'string' ? entry : (entry?.name || '');
            const equipped = typeof entry === 'object' ? !!entry.equipped : false;
            if (!name) return null;
            
            const found = allItems.find(i => 
                i.name === name && (i.armamentType === 'Weapon' || i.armamentType === 'Shield')
            );
            
            if (!found) {
                return {
                    name,
                    damage: '-',
                    damageType: '',
                    range: 'Melee',
                    properties: [],
                    totalBP: 0,
                    currencyCost: 0,
                    rarity: 'Common',
                    equipped
                };
            }
            
            const display = deriveItemDisplay(found, itemPropsDb);
            return { ...found, ...display, equipped };
        }).filter(Boolean);
        
        // Saveable format: name and equipped state
        const saveableWeapons = weaponEntries.map(w => {
            if (typeof w === 'string') return w;
            if (w && typeof w === 'object' && w.name) {
                return { name: w.name, equipped: !!w.equipped };
            }
            return null;
        }).filter(Boolean);
        
        return { displayWeapons, saveableWeapons, allItems };
    } catch (e) {
        console.warn('[DataEnrichment] Failed to enrich weapons:', e);
        return { displayWeapons: [], saveableWeapons: weaponEntries, allItems: [] };
    }
}

/**
 * Enrich armor with full data from user's Firestore item library
 * @param {Array} characterArmor - Array of armor names or {name, equipped} objects
 * @param {Array} allItems - Pre-fetched items array (from enrichWeapons)
 * @returns {Object} - { displayArmor, saveableArmor }
 */
export async function enrichArmor(characterArmor, allItems = []) {
    const itemPropsDb = await fetchItemProperties();
    const armorEntries = Array.isArray(characterArmor) ? characterArmor : [];
    
    // Filter to armor items only
    const armorItems = allItems.filter(i => i.armamentType === 'Armor');
    
    const displayArmor = armorEntries.map(entry => {
        const name = typeof entry === 'string' ? entry : (entry?.name || '');
        const equipped = typeof entry === 'object' ? !!entry.equipped : false;
        if (!name) return null;
        
        const found = armorItems.find(a => a.name === name);
        
        if (!found) {
            return {
                name,
                damageReduction: 0,
                properties: [],
                totalBP: 0,
                currencyCost: 0,
                rarity: 'Common',
                equipped
            };
        }
        
        // Calculate damage reduction from properties
        const drProp = (found.properties || []).find(p => p.id === PROPERTY_IDS.DAMAGE_REDUCTION || p.name === 'Damage Reduction');
        const damageReduction = drProp ? (1 + (drProp.op_1_lvl || 0)) : 0;
        
        const display = deriveItemDisplay(found, itemPropsDb);
        return { ...found, ...display, damageReduction, equipped };
    }).filter(Boolean);
    
    // Saveable format: name and equipped state
    const saveableArmor = armorEntries.map(a => {
        if (typeof a === 'string') return a;
        if (a && typeof a === 'object' && a.name) {
            return { name: a.name, equipped: !!a.equipped };
        }
        return null;
    }).filter(Boolean);
    
    return { displayArmor, saveableArmor };
}

/**
 * Enrich equipment with full data from RTDB and user's library
 * @param {Array} characterEquipment - Array of equipment names or {name, quantity} objects
 * @param {Array} allItems - Pre-fetched items array (from enrichWeapons)
 * @returns {Object} - { displayEquipment, saveableEquipment }
 */
export async function enrichEquipment(characterEquipment, allItems = []) {
    const itemPropsDb = await fetchItemProperties();
    const rtdbEquipment = await fetchEquipment();
    const equipEntries = Array.isArray(characterEquipment) ? characterEquipment : [];
    
    const displayEquipment = equipEntries.map(entry => {
        const name = typeof entry === 'string' ? entry : (entry?.name || '');
        const quantity = typeof entry === 'object' ? (entry.quantity || 1) : 1;
        if (!name) return null;
        
        // First try RTDB 'items' node
        const foundRtdb = findByIdOrName(rtdbEquipment, entry);
        if (foundRtdb) {
            const display = deriveItemDisplay(foundRtdb, itemPropsDb);
            return { ...foundRtdb, ...display, quantity };
        }
        
        // Fallback: try user's item library for general items
        const foundLib = allItems.find(i => 
            i.name === name && (!i.armamentType || i.armamentType === 'General')
        );
        if (foundLib) {
            const display = deriveItemDisplay(foundLib, itemPropsDb);
            return { ...foundLib, ...display, quantity };
        }
        
        // Final fallback: use entry as-is
        return {
            name,
            description: entry?.description || '',
            category: entry?.category || 'General',
            currency: entry?.currency || 0,
            rarity: entry?.rarity || 'Common',
            quantity
        };
    }).filter(Boolean);
    
    // Saveable format: name and quantity
    const saveableEquipment = equipEntries.map(e => {
        if (typeof e === 'string') return e;
        if (e && typeof e === 'object' && e.name) {
            return { name: e.name, quantity: e.quantity || 1 };
        }
        return null;
    }).filter(Boolean);
    
    return { displayEquipment, saveableEquipment };
}

// ============================================================================
// Main Enrichment Function
// ============================================================================

/**
 * Enriches raw character data with full objects from Firebase/RTDB.
 * Returns both display-ready data and saveable (minimal) data.
 * 
 * PERFORMANCE OPTIMIZATION: Uses Promise.all() to parallelize independent fetches,
 * reducing total load time. Feats, techniques, powers, and weapons fetch simultaneously.
 * Armor and equipment wait for weapons (to reuse allItems), but also run in parallel.
 * 
 * @param {Object} rawData - Raw character data from Firestore
 * @param {string} userId - Firebase user ID
 * @returns {Object} - Enriched character data with _display* properties
 */
export async function enrichCharacterData(rawData, userId) {
    if (!rawData) return rawData;
    
    const data = { ...rawData };
    
    try {
        // OPTIMIZATION: Parallelize independent fetches to reduce total load time
        // Feats, techniques, powers, and weapons can all fetch in parallel
        const [featsResult, techniquesResult, powersResult, weaponsResult] = await Promise.all([
            enrichFeats(data.feats),
            enrichTechniques(data.techniques, userId),
            enrichPowers(data.powers, userId),
            enrichWeapons(data.weapons, userId)
        ]);
        
        // Apply results from parallel fetches
        data._displayFeats = featsResult.displayFeats;
        data.feats = featsResult.saveableFeats;
        
        data._techniques = techniquesResult.displayTechniques;
        data.techniques = techniquesResult.saveableTechniques;
        
        data._powers = powersResult.displayPowers;
        data.powers = powersResult.saveablePowers;
        
        data._weapons = weaponsResult.displayWeapons;
        data.weapons = weaponsResult.saveableWeapons;
        const allItems = weaponsResult.allItems;
        
        // Set user item library promise for global access
        if (window._setUserItemLibraryPromise && allItems) {
            window._setUserItemLibraryPromise(Promise.resolve(allItems));
        }
        
        // Armor and equipment depend on allItems, so they run sequentially after weapons
        // But can run in parallel with each other
        const [armorResult, equipmentResult] = await Promise.all([
            enrichArmor(data.armor, allItems),
            enrichEquipment(data.equipment, allItems)
        ]);
        
        data._armor = armorResult.displayArmor;
        data.armor = armorResult.saveableArmor;
        
        data._equipment = equipmentResult.displayEquipment;
        data.equipment = equipmentResult.saveableEquipment;
        
        // Compose inventory object for library rendering
        data._inventory = {
            weapons: weaponsResult.displayWeapons,
            armor: armorResult.displayArmor,
            equipment: equipmentResult.displayEquipment
        };
        
    } catch (e) {
        console.error('[DataEnrichment] Error enriching character data:', e);
    }
    
    return data;
}

/**
 * Normalize character data to expected shape (ensures all arrays exist)
 * @param {Object} raw - Raw character data
 * @returns {Object} - Normalized character data
 */
export function normalizeCharacter(raw) {
    const c = raw || {};
    c.feats = Array.isArray(c.feats) ? c.feats : [];
    c.techniques = Array.isArray(c.techniques) ? c.techniques : [];
    c.powers = Array.isArray(c.powers) ? c.powers : [];
    c.equipment = Array.isArray(c.equipment) ? c.equipment : [];
    c.weapons = Array.isArray(c.weapons) ? c.weapons : [];
    c.armor = Array.isArray(c.armor) ? c.armor : [];
    c.traits = Array.isArray(c.traits) ? c.traits : [];
    c.skills = Array.isArray(c.skills) ? c.skills : [];
    c.subSkills = Array.isArray(c.subSkills) ? c.subSkills : [];
    c.defenseVals = c.defenseVals || { might: 0, fortitude: 0, reflex: 0, discernment: 0, mentalFortitude: 0, resolve: 0 };
    c.abilities = c.abilities || { strength: 0, vitality: 0, agility: 0, acuity: 0, intelligence: 0, charisma: 0 };
    c.health_energy_points = c.health_energy_points || { health: 0, energy: 0 };
    return c;
}
