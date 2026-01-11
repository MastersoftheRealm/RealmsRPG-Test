import { auth, db, waitForAuth } from './firebase-config.js';

async function fetchAllCharacters(user) {
    const colRef = db.collection('users').doc(user.uid).collection('character');
    const snap = await colRef.get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getCharacterData(charId) {
    const user = await waitForAuth();
    if (!user) throw new Error('User not authenticated');
    if (!charId || !String(charId).trim()) throw new Error('Invalid character id');
    const cleanId = String(charId).trim();
    try {
        const docRef = db.collection('users').doc(user.uid).collection('character').doc(cleanId);
        const docSnap = await docRef.get();
        if (docSnap.exists) return { id: cleanId, ...docSnap.data() };
        // Fallback: list collection and try alternative matches
        const all = await fetchAllCharacters(user);
        const direct = all.find(c => c.id === cleanId);
        if (direct) return direct;
        const ci = all.find(c => c.id.toLowerCase() === cleanId.toLowerCase());
        if (ci) return ci;
        const byName = all.find(c => (c.name || '').toLowerCase() === cleanId.toLowerCase());
        if (byName) return byName;
        throw new Error('Character not found');
    } catch (e) {
        if (e.code === 'permission-denied') throw new Error('PERMISSION_DENIED');
        throw e;
    }
}

// Helper: Recursively remove all undefined values from an object/array
function removeUndefined(obj) {
    if (Array.isArray(obj)) {
        return obj.map(removeUndefined);
    } else if (obj && typeof obj === 'object') {
        const clean = {};
        for (const [k, v] of Object.entries(obj)) {
            // --- PATCH: Allow 0 as a valid value (do not skip 0), only skip undefined ---
            if (v !== undefined) {
                clean[k] = removeUndefined(v);
            }
        }
        return clean;
    }
    return obj;
}

export async function saveCharacterData(charId, data) {
    const user = await waitForAuth();
    if (!user) throw new Error('User not authenticated');
    if (!charId || !String(charId).trim()) throw new Error('Invalid character id');
    const { id, ...dataToSave } = data;
    // Remove display-only properties before saving
    delete dataToSave._displayFeats; // Always remove _displayFeats (display only, never persisted)
    delete dataToSave.allTraits;     // Always remove allTraits (display only, never persisted)
    // --- Remove derived/temporary fields ---
    delete dataToSave.defenses;         // Remove defense scores (derived)
    delete dataToSave.defenseBonuses;   // Remove defense bonuses (derived)
    // Remove all undefined values before saving
    const cleanedData = removeUndefined(dataToSave);
    try {
        const docRef = db.collection('users').doc(user.uid).collection('character').doc(String(charId).trim());
        await docRef.set(cleanedData, { merge: true });
    } catch (e) {
        if (e.code === 'permission-denied') throw new Error('PERMISSION_DENIED');
        throw e;
    }
}
