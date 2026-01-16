/**
 * Shared RTDB Cache Utility
 * 
 * Centralized caching for all Firebase Realtime Database fetches.
 * Used across character sheets, creators (power, technique, item, creature), and codex.
 * 
 * All fetch functions are cached and return consistent data structures.
 */

// ============================================================================
// Cache Storage
// ============================================================================

let _powerPartsCache = null;
let _techniquePartsCache = null;
let _itemPropertiesCache = null;
let _allFeatsCache = null;
let _creatureFeatsCache = null;
let _equipmentCache = null;
let _traitsCache = null;
let _skillsCache = null;
let _speciesCache = null;

/**
 * Clear all caches (useful for testing or refreshing data)
 */
export function clearAllCaches() {
    _powerPartsCache = null;
    _techniquePartsCache = null;
    _itemPropertiesCache = null;
    _allFeatsCache = null;
    _creatureFeatsCache = null;
    _equipmentCache = null;
    _traitsCache = null;
    _skillsCache = null;
    _speciesCache = null;
}

/**
 * Get cached feat data synchronously (returns null if not cached)
 * @returns {Array|null} Cached feat data or null
 */
export function getCachedFeats() {
    return _allFeatsCache;
}

// ============================================================================
// Retry Helper (for network resilience)
// ============================================================================

/**
 * Fetch with retry logic for network resilience
 * @param {Function} fetchFn - Function that returns a promise
 * @param {number} attempts - Number of retry attempts
 * @returns {Promise<any>}
 */
async function fetchWithRetry(fetchFn, attempts = 3) {
    let lastErr;
    for (let i = 0; i < attempts; i++) {
        try {
            return await fetchFn();
        } catch (err) {
            lastErr = err;
            const msg = (err && err.message) || '';
            const isOffline = msg.includes('Client is offline') || 
                             msg.toLowerCase().includes('network') ||
                             msg.includes('PERMISSION_DENIED');
            
            // Don't retry permission errors on last attempt
            if (err.code === 'PERMISSION_DENIED' && i === attempts - 1) {
                throw err;
            }
            
            if (!isOffline || i === attempts - 1) throw err;
            
            // Simple exponential backoff
            await new Promise(res => setTimeout(res, 500 * (i + 1)));
        }
    }
    throw lastErr;
}

/**
 * Get reference with retry (for Firebase v9 modular SDK)
 * @param {Object} database - Firebase database instance
 * @param {string} path - RTDB path
 * @param {number} attempts - Number of retry attempts
 * @returns {Promise<DataSnapshot>}
 */
export async function getWithRetry(database, path, attempts = 3) {
    // Handle both v9 modular SDK and compatibility SDK
    if (database.ref) {
        // Compatibility SDK (window.firebase.database())
        const fetchFn = () => database.ref(path).once('value');
        return await fetchWithRetry(fetchFn, attempts);
    } else {
        // Modular SDK (getDatabase)
        const { ref, get } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js');
        const dbRef = ref(database, path);
        const fetchFn = () => get(dbRef);
        return await fetchWithRetry(fetchFn, attempts);
    }
}

// ============================================================================
// Power Parts
// ============================================================================

/**
 * Fetch power parts from RTDB (cached)
 * Compatible with both Firebase v9 modular and compat SDKs
 * @param {Object} database - Firebase database instance (optional if window.firebase.database exists)
 * @returns {Promise<Array>} Array of power part objects
 */
export async function fetchPowerParts(database = null) {
    if (_powerPartsCache) return _powerPartsCache;
    
    // Auto-detect database if not provided
    if (!database) {
        if (window.firebase?.database) {
            database = window.firebase.database();
        } else {
            console.warn('[rtdb-cache] No database provided and window.firebase.database not available');
            return [];
        }
    }
    
    try {
        const snapshot = await getWithRetry(database, 'parts');
        
        if (!snapshot.exists()) {
            console.warn('[rtdb-cache] No parts found in database');
            return [];
        }
        
        const data = snapshot.val();
        _powerPartsCache = Object.entries(data)
            .filter(([id, part]) => part.type && part.type.toLowerCase() === 'power')
            .map(([id, part]) => ({
                id,
                name: part.name || '',
                description: part.description || '',
                category: part.category || '',
                base_en: parseFloat(part.base_en) || 0,
                base_tp: parseFloat(part.base_tp) || 0,
                op_1_desc: part.op_1_desc || '',
                op_1_en: parseFloat(part.op_1_en) || 0,
                op_1_tp: parseFloat(part.op_1_tp) || 0,
                op_2_desc: part.op_2_desc || '',
                op_2_en: parseFloat(part.op_2_en) || 0,
                op_2_tp: parseFloat(part.op_2_tp) || 0,
                op_3_desc: part.op_3_desc || '',
                op_3_en: parseFloat(part.op_3_en) || 0,
                op_3_tp: parseFloat(part.op_3_tp) || 0,
                type: part.type || 'power',
                mechanic: part.mechanic === 'true' || part.mechanic === true,
                percentage: part.percentage === 'true' || part.percentage === true,
                duration: part.duration === 'true' || part.duration === true
            }));
        
        console.log(`[rtdb-cache] Loaded ${_powerPartsCache.length} power parts`);
        return _powerPartsCache;
    } catch (e) {
        console.error('[rtdb-cache] Failed to fetch power parts:', e);
        return [];
    }
}

// ============================================================================
// Technique Parts
// ============================================================================

/**
 * Fetch technique parts from RTDB (cached)
 * Compatible with both Firebase v9 modular and compat SDKs
 * @param {Object} database - Firebase database instance (optional if window.firebase.database exists)
 * @returns {Promise<Array>} Array of technique part objects
 */
export async function fetchTechniqueParts(database = null) {
    if (_techniquePartsCache) return _techniquePartsCache;
    
    if (!database) {
        if (window.firebase?.database) {
            database = window.firebase.database();
        } else {
            console.warn('[rtdb-cache] No database provided and window.firebase.database not available');
            return [];
        }
    }
    
    try {
        const snapshot = await getWithRetry(database, 'parts');
        
        if (!snapshot.exists()) {
            console.warn('[rtdb-cache] No parts found in database');
            return [];
        }
        
        const data = snapshot.val();
        _techniquePartsCache = Object.entries(data)
            .filter(([id, part]) => part.type && part.type.toLowerCase() === 'technique')
            .map(([id, part]) => ({
                id,
                name: part.name || '',
                description: part.description || '',
                category: part.category || '',
                base_en: parseFloat(part.base_en) || 0,
                base_tp: parseFloat(part.base_tp) || 0,
                op_1_desc: part.op_1_desc || '',
                op_1_en: parseFloat(part.op_1_en) || 0,
                op_1_tp: parseFloat(part.op_1_tp) || 0,
                op_2_desc: part.op_2_desc || '',
                op_2_en: parseFloat(part.op_2_en) || 0,
                op_2_tp: parseFloat(part.op_2_tp) || 0,
                op_3_desc: part.op_3_desc || '',
                op_3_en: parseFloat(part.op_3_en) || 0,
                op_3_tp: parseFloat(part.op_3_tp) || 0,
                type: part.type || 'technique',
                mechanic: part.mechanic === 'true' || part.mechanic === true,
                percentage: part.percentage === 'true' || part.percentage === true,
                alt_base_en: parseFloat(part.alt_base_en) || 0,
                alt_tp: parseFloat(part.alt_tp) || 0,
                alt_desc: part.alt_desc || ''
            }));
        
        console.log(`[rtdb-cache] Loaded ${_techniquePartsCache.length} technique parts`);
        return _techniquePartsCache;
    } catch (e) {
        console.error('[rtdb-cache] Failed to fetch technique parts:', e);
        return [];
    }
}

// ============================================================================
// Item Properties
// ============================================================================

/**
 * Fetch item properties from RTDB (cached)
 * Compatible with both Firebase v9 modular and compat SDKs
 * @param {Object} database - Firebase database instance (optional if window.firebase.database exists)
 * @returns {Promise<Array>} Array of item property objects
 */
export async function fetchItemProperties(database = null) {
    if (_itemPropertiesCache) return _itemPropertiesCache;
    
    if (!database) {
        if (window.firebase?.database) {
            database = window.firebase.database();
        } else {
            console.warn('[rtdb-cache] No database provided and window.firebase.database not available');
            return [];
        }
    }
    
    try {
        const snapshot = await getWithRetry(database, 'properties');
        
        if (!snapshot.exists()) {
            console.warn('[rtdb-cache] No properties found in database');
            return [];
        }
        
        const data = snapshot.val();
        _itemPropertiesCache = Object.entries(data).map(([id, prop]) => ({
            id,
            name: prop.name || '',
            description: prop.description || '',
            base_ip: parseFloat(prop.base_ip) || 0,
            base_tp: parseFloat(prop.base_tp) || 0,
            base_c: parseFloat(prop.base_c) || 0,
            op_1_desc: prop.op_1_desc || '',
            op_1_ip: parseFloat(prop.op_1_ip) || 0,
            op_1_tp: parseFloat(prop.op_1_tp) || 0,
            op_1_c: parseFloat(prop.op_1_c) || 0,
            type: prop.type ? prop.type.charAt(0).toUpperCase() + prop.type.slice(1) : 'Weapon'
        }));
        
        console.log(`[rtdb-cache] Loaded ${_itemPropertiesCache.length} item properties`);
        return _itemPropertiesCache;
    } catch (e) {
        console.error('[rtdb-cache] Failed to fetch item properties:', e);
        return [];
    }
}

// ============================================================================
// Feats (Character)
// ============================================================================

/**
 * Fetch all character feats from RTDB (cached)
 * Compatible with both Firebase v9 modular and compat SDKs
 * @param {Object} database - Firebase database instance (optional if window.firebase.database exists)
 * @returns {Promise<Array>} Array of feat objects
 */
export async function fetchAllFeats(database = null) {
    if (_allFeatsCache) return _allFeatsCache;
    
    if (!database) {
        if (window.firebase?.database) {
            database = window.firebase.database();
        } else {
            console.warn('[rtdb-cache] No database provided and window.firebase.database not available');
            return [];
        }
    }
    
    try {
        const snapshot = await getWithRetry(database, 'feats');
        
        if (!snapshot.exists()) {
            console.warn('[rtdb-cache] No feats found in database');
            return [];
        }
        
        const data = snapshot.val();
        _allFeatsCache = Object.entries(data).map(([id, feat]) => ({
            id,
            name: feat.name || '',
            description: feat.description || '',
            uses_per_rec: parseInt(feat.uses_per_rec) || 0,
            rec_period: feat.rec_period || 'Full Recovery',
            char_feat: feat.char_feat === true || feat.char_feat === 'true',
            state_feat: feat.state_feat === true || feat.state_feat === 'true',
            feat_lvl: parseInt(feat.feat_lvl) || 1
        }));
        
        console.log(`[rtdb-cache] Loaded ${_allFeatsCache.length} character feats`);
        return _allFeatsCache;
    } catch (e) {
        console.error('[rtdb-cache] Failed to fetch feats:', e);
        return [];
    }
}

// ============================================================================
// Creature Feats
// ============================================================================

/**
 * Fetch all creature feats from RTDB (cached)
 * Compatible with both Firebase v9 modular and compat SDKs
 * @param {Object} database - Firebase database instance (optional if window.firebase.database exists)
 * @returns {Promise<Array>} Array of creature feat objects
 */
export async function fetchCreatureFeats(database = null) {
    if (_creatureFeatsCache) return _creatureFeatsCache;
    
    if (!database) {
        if (window.firebase?.database) {
            database = window.firebase.database();
        } else {
            console.warn('[rtdb-cache] No database provided and window.firebase.database not available');
            return [];
        }
    }
    
    try {
        const snapshot = await getWithRetry(database, 'creature_feats');
        
        if (!snapshot.exists()) {
            console.warn('[rtdb-cache] No creature_feats found in database');
            return [];
        }
        
        const data = snapshot.val();
        _creatureFeatsCache = Object.values(data);
        
        console.log(`[rtdb-cache] Loaded ${_creatureFeatsCache.length} creature feats`);
        return _creatureFeatsCache;
    } catch (e) {
        console.error('[rtdb-cache] Failed to fetch creature feats:', e);
        return [];
    }
}

// ============================================================================
// Equipment (General Items)
// ============================================================================

/**
 * Fetch general equipment from RTDB (cached)
 * Compatible with both Firebase v9 modular and compat SDKs
 * @param {Object} database - Firebase database instance (optional if window.firebase.database exists)
 * @returns {Promise<Array>} Array of equipment objects
 */
export async function fetchEquipment(database = null) {
    if (_equipmentCache) return _equipmentCache;
    
    if (!database) {
        if (window.firebase?.database) {
            database = window.firebase.database();
        } else {
            console.warn('[rtdb-cache] No database provided and window.firebase.database not available');
            return [];
        }
    }
    
    try {
        const snapshot = await getWithRetry(database, 'items');
        
        if (!snapshot.exists()) {
            console.warn('[rtdb-cache] No items found in database');
            return [];
        }
        
        const data = snapshot.val();
        _equipmentCache = Object.values(data);
        
        console.log(`[rtdb-cache] Loaded ${_equipmentCache.length} equipment items`);
        return _equipmentCache;
    } catch (e) {
        console.error('[rtdb-cache] Failed to fetch equipment:', e);
        return [];
    }
}

// ============================================================================
// Traits
// ============================================================================

/**
 * Fetch all traits from RTDB (cached)
 * Compatible with both Firebase v9 modular and compat SDKs
 * @param {Object} database - Firebase database instance (optional if window.firebase.database exists)
 * @returns {Promise<Object>} Traits object (keyed by id)
 */
export async function fetchTraits(database = null) {
    if (_traitsCache) return _traitsCache;
    
    if (!database) {
        if (window.firebase?.database) {
            database = window.firebase.database();
        } else {
            console.warn('[rtdb-cache] No database provided and window.firebase.database not available');
            return {};
        }
    }
    
    try {
        const snapshot = await getWithRetry(database, 'traits');
        
        if (!snapshot.exists()) {
            console.warn('[rtdb-cache] No traits found in database');
            return {};
        }
        
        _traitsCache = snapshot.val();
        
        console.log(`[rtdb-cache] Loaded ${Object.keys(_traitsCache).length} traits`);
        return _traitsCache;
    } catch (e) {
        console.error('[rtdb-cache] Failed to fetch traits:', e);
        return {};
    }
}

// ============================================================================
// Skills
// ============================================================================

/**
 * Fetch all skills from RTDB (cached)
 * Compatible with both Firebase v9 modular and compat SDKs
 * @param {Object} database - Firebase database instance (optional if window.firebase.database exists)
 * @returns {Promise<Object>} Skills object
 */
export async function fetchSkills(database = null) {
    if (_skillsCache) return _skillsCache;
    
    if (!database) {
        if (window.firebase?.database) {
            database = window.firebase.database();
        } else {
            console.warn('[rtdb-cache] No database provided and window.firebase.database not available');
            return {};
        }
    }
    
    try {
        const snapshot = await getWithRetry(database, 'skills');
        
        if (!snapshot.exists()) {
            console.warn('[rtdb-cache] No skills found in database');
            return {};
        }
        
        _skillsCache = snapshot.val();
        
        console.log(`[rtdb-cache] Loaded ${Object.keys(_skillsCache).length} skills`);
        return _skillsCache;
    } catch (e) {
        console.error('[rtdb-cache] Failed to fetch skills:', e);
        return {};
    }
}

// ============================================================================
// Species
// ============================================================================

/**
 * Fetch all species from RTDB (cached)
 * Compatible with both Firebase v9 modular and compat SDKs
 * @param {Object} database - Firebase database instance (optional if window.firebase.database exists)
 * @returns {Promise<Object>} Species object
 */
export async function fetchSpecies(database = null) {
    if (_speciesCache) return _speciesCache;
    
    if (!database) {
        if (window.firebase?.database) {
            database = window.firebase.database();
        } else {
            console.warn('[rtdb-cache] No database provided and window.firebase.database not available');
            return {};
        }
    }
    
    try {
        const snapshot = await getWithRetry(database, 'species');
        
        if (!snapshot.exists()) {
            console.warn('[rtdb-cache] No species found in database');
            return {};
        }
        
        _speciesCache = snapshot.val();
        
        console.log(`[rtdb-cache] Loaded ${Object.keys(_speciesCache).length} species`);
        return _speciesCache;
    } catch (e) {
        console.error('[rtdb-cache] Failed to fetch species:', e);
        return {};
    }
}

// ============================================================================
// Backwards Compatibility Aliases
// ============================================================================

// For code that expects specific function names
export const loadPowerPartsFromDatabase = fetchPowerParts;
export const loadTechniquePartsFromDatabase = fetchTechniqueParts;
export const loadItemPropertiesFromDatabase = fetchItemProperties;
export const loadFeatsFromDatabase = fetchAllFeats;
export const loadCreatureFeatsFromDatabase = fetchCreatureFeats;
export const loadEquipmentFromDatabase = fetchEquipment;
export const loadTraitsFromDatabase = fetchTraits;
