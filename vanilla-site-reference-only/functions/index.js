/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onRequest, onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { getFirestore } = require('firebase-admin/firestore');
const admin = require('firebase-admin');
const logger = require("firebase-functions/logger");
const cors = require('cors')({ origin: true });

const API_KEY = defineSecret('API_KEY');
const APP_ID = defineSecret('APP_ID');
const AUTH_DOMAIN = defineSecret('AUTH_DOMAIN');
const DATABASE_URL = defineSecret('DATABASE_URL');
const MEASUREMENT_ID = defineSecret('MEASUREMENT_ID');
const MESSAGING_SENDER_ID = defineSecret('MESSAGING_SENDER_ID');
const PROJECT_ID = defineSecret('PROJECT_ID');
const STORAGE_BUCKET = defineSecret('STORAGE_BUCKET');
const RECAPTCHA_SECRET_KEY = defineSecret('RECAPTCHA_SECRET_KEY');
const RECAPTCHA_SITE_KEY = defineSecret('RECAPTCHA_SITE_KEY');

admin.initializeApp();

exports.registerUser = onCall(
  { secrets: [API_KEY, APP_ID, AUTH_DOMAIN, DATABASE_URL, MEASUREMENT_ID, MESSAGING_SENDER_ID, PROJECT_ID, STORAGE_BUCKET, RECAPTCHA_SECRET_KEY, RECAPTCHA_SITE_KEY] },
  async (data, context) => {
    const { username, email, password } = data;
    try {
      const userRecord = await admin.auth().createUser({ email, password });
      const db = getFirestore();
      await db.collection('users').doc(userRecord.uid).set({ username });
      await db.collection('usernames').doc(username).set({ uid: userRecord.uid });
      return { message: 'User registered successfully' };
    } catch (error) {
      console.error('Error registering user:', error);
      throw new HttpsError('internal', 'Error registering user');
    }
  }
);

exports.updateUserEmail = onCall(async (data, context) => {
  const { newEmail } = data;
  const uid = context.auth.uid;

  if (!uid) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  try {
    await admin.auth().updateUser(uid, { email: newEmail });
    const emailVerificationLink = await admin.auth().generateEmailVerificationLink(newEmail);
    return { message: 'Email updated successfully. Please verify your new email.', emailVerificationLink };
  } catch (error) {
    console.error('Error updating email:', error);
    throw new HttpsError('internal', 'Error updating email');
  }
});

exports.savePowerToLibrary = onCall(async (data, context) => {
    const { powerName, powerDescription, parts, damage } = data;
    const uid = context.auth.uid;

    if (!uid) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    // Validate required fields
    if (!(typeof powerName === "string") || powerName.trim().length === 0) {
        throw new HttpsError("invalid-argument", "The function must be called with a valid 'powerName'.");
    }
    if (!Array.isArray(parts)) {
        throw new HttpsError("invalid-argument", "Missing or invalid 'parts' array.");
    }
    if (!Array.isArray(damage)) {
        throw new HttpsError("invalid-argument", "Missing or invalid 'damage' array.");
    }

    try {
        const db = getFirestore();
        // Overwrite if name exists, else add new
        const powersRef = db.collection('users').doc(uid).collection('library');
        const querySnap = await powersRef.where('name', '==', powerName).get();
        let docRef;
        if (!querySnap.empty) {
            docRef = powersRef.doc(querySnap.docs[0].id);
        } else {
            docRef = powersRef.doc();
        }
        await docRef.set({
            name: powerName,
            description: powerDescription || "",
            parts,
            damage,
            timestamp: new Date()
        });
        logger.info('Power document written with ID: ', docRef.id);
        return { message: 'Power saved to library', docId: docRef.id };
    } catch (error) {
        logger.error('Error adding power document: ', error);
        throw new HttpsError('internal', 'Error saving power to library');
    }
});

exports.savePowerToLibrary = onRequest((req, res) => {
    cors(req, res, async () => {
        const { powerName, powerDescription, parts, damage } = req.body;
        
        // Verify the ID token from the Authorization header
        const idToken = req.headers.authorization?.split('Bearer ')[1];
        if (!idToken) {
            res.status(401).json({ error: 'Unauthorized: No ID token provided.' });
            return;
        }

        try {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const uid = decodedToken.uid;

            // Validate required fields
            if (!(typeof powerName === "string") || powerName.trim().length === 0) {
                res.status(400).json({ error: "The function must be called with a valid 'powerName'." });
                return;
            }
            if (!Array.isArray(parts)) {
                res.status(400).json({ error: "Missing or invalid 'parts' array." });
                return;
            }
            if (!Array.isArray(damage)) {
                res.status(400).json({ error: "Missing or invalid 'damage' array." });
                return;
            }

            const db = getFirestore();
            // Overwrite if name exists, else add new
            const powersRef = db.collection('users').doc(uid).collection('library');
            const querySnap = await powersRef.where('name', '==', powerName).get();
            let docRef;
            if (!querySnap.empty) {
                docRef = powersRef.doc(querySnap.docs[0].id);
            } else {
                docRef = powersRef.doc();
            }
            await docRef.set({
                name: powerName,
                description: powerDescription || "",
                parts,
                damage,
                timestamp: new Date()
            });
            logger.info('Power document written with ID: ', docRef.id);
            res.status(200).json({ message: 'Power saved to library', docId: docRef.id });
        } catch (error) {
            logger.error('Error adding power document: ', error);
            res.status(500).json({ error: 'Error saving power to library' });
        }
    });
});

exports.deletePowerFromLibrary = onCall(async (data, context) => {
    const { powerId } = data;
    const uid = context.auth.uid;

    if (!uid) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    try {
        const db = getFirestore();
        await db.collection('users').doc(uid).collection('library').doc(powerId).delete();
        return { message: 'Power deleted successfully' };
    } catch (error) {
        console.error('Error deleting power: ', error);
        throw new HttpsError('internal', 'Error deleting power');
    }
});

exports.saveItemToLibrary = onCall(async (data, context) => {
    // Robust check for authentication
    if (!context.auth) {
        logger.error('Unauthenticated request: context.auth is undefined');
        throw new HttpsError('unauthenticated', 'You must be authenticated to save an item.');
    }

    const {
        itemName,
        itemDescription,
        armamentType,
        properties,
        damage // Add damage parameter
    } = data;
    const uid = context.auth.uid;

    if (!(typeof itemName === "string") || itemName.length === 0) {
        logger.error('Invalid itemName:', itemName);
        throw new HttpsError("invalid-argument", "The function must be called with a valid 'itemName'.");
    }

    // Validate armamentType
    if (!armamentType || !['Weapon', 'Armor', 'Shield'].includes(armamentType)) {
        logger.error('Invalid armamentType:', armamentType);
        throw new HttpsError("invalid-argument", "The function must be called with a valid 'armamentType' (Weapon, Armor, or Shield).");
    }

    // Validate properties array
    if (!Array.isArray(properties)) {
        logger.error('properties is not an array:', properties);
        throw new HttpsError("invalid-argument", "properties must be an array.");
    }

    // Validate damage array (optional)
    if (damage !== undefined && !Array.isArray(damage)) {
        logger.error('damage is not an array:', damage);
        throw new HttpsError("invalid-argument", "damage must be an array if provided.");
    }

    try {
        const db = getFirestore();
        const docRef = await db.collection('users').doc(uid).collection('itemLibrary').add({
            name: itemName,
            description: itemDescription || "",
            armamentType,
            properties,
            damage: damage || [], // Add damage array
            timestamp: new Date()
        });
        logger.info('Item document written with ID: ', docRef.id);
        return { message: 'Item saved to library', docId: docRef.id };
    } catch (error) {
        logger.error('Error adding item document: ', error, data);
        throw new HttpsError('internal', 'Error saving item to library: ' + error.message);
    }
});

// --- Technique Library Functions (minimal format) ---
exports.saveTechniqueToLibrary = onCall(async (data, context) => {
    const { techniqueName, techniqueDescription, parts, weapon, damage } = data;
    const uid = context.auth.uid;

    if (!uid) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    // Validate required fields
    if (!(typeof techniqueName === "string") || techniqueName.trim().length === 0) {
        throw new HttpsError("invalid-argument", "The function must be called with a valid 'techniqueName'.");
    }
    if (!Array.isArray(parts)) {
        throw new HttpsError("invalid-argument", "Missing or invalid 'parts' array.");
    }
    if (!damage || typeof damage !== "object" || !("amount" in damage) || !("size" in damage)) {
        throw new HttpsError("invalid-argument", "Missing or invalid 'damage' object.");
    }
    if (!weapon || typeof weapon !== "object" || !("name" in weapon)) {
        throw new HttpsError("invalid-argument", "Missing or invalid 'weapon' object.");
    }

    try {
        const db = getFirestore();
        // Overwrite if name exists, else add new
        const techniquesRef = db.collection('users').doc(uid).collection('techniqueLibrary');
        const querySnap = await techniquesRef.where('name', '==', techniqueName).get();
        let docRef;
        if (!querySnap.empty) {
            docRef = techniquesRef.doc(querySnap.docs[0].id);
        } else {
            docRef = techniquesRef.doc();
        }
        await docRef.set({
            name: techniqueName,
            description: techniqueDescription || "",
            parts,
            weapon,
            damage,
            timestamp: new Date()
        });
        logger.info('Technique document written with ID: ', docRef.id);
        return { message: 'Technique saved to library', docId: docRef.id };
    } catch (error) {
        logger.error('Error adding technique document: ', error);
        throw new HttpsError('internal', 'Error saving technique to library');
    }
});

exports.saveTechniqueToLibrary = onRequest((req, res) => {
    cors(req, res, async () => {
        const { techniqueName, techniqueDescription, parts, weapon, damage } = req.body;
        // Verify the ID token from the Authorization header
        const idToken = req.headers.authorization?.split('Bearer ')[1];
        if (!idToken) {
            res.status(401).json({ error: 'Unauthorized: No ID token provided.' });
            return;
        }

        try {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const uid = decodedToken.uid;

            // Validate required fields
            if (!(typeof techniqueName === "string") || techniqueName.trim().length === 0) {
                res.status(400).json({ error: "The function must be called with a valid 'techniqueName'." });
                return;
            }
            if (!Array.isArray(parts)) {
                res.status(400).json({ error: "Missing or invalid 'parts' array." });
                return;
            }
            if (!damage || typeof damage !== "object" || !("amount" in damage) || !("size" in damage)) {
                res.status(400).json({ error: "Missing or invalid 'damage' object." });
                return;
            }
            if (!weapon || typeof weapon !== "object" || !("name" in weapon)) {
                res.status(400).json({ error: "Missing or invalid 'weapon' object." });
                return;
            }

            const db = getFirestore();
            // Overwrite if name exists, else add new
            const techniquesRef = db.collection('users').doc(uid).collection('techniqueLibrary');
            const querySnap = await techniquesRef.where('name', '==', techniqueName).get();
            let docRef;
            if (!querySnap.empty) {
                docRef = techniquesRef.doc(querySnap.docs[0].id);
            } else {
                docRef = techniquesRef.doc();
            }
            await docRef.set({
                name: techniqueName,
                description: techniqueDescription || "",
                parts,
                weapon,
                damage,
                timestamp: new Date()
            });
            logger.info('Technique document written with ID: ', docRef.id);
            res.status(200).json({ message: 'Technique saved to library', docId: docRef.id });
        } catch (error) {
            logger.error('Error adding technique document: ', error);
            res.status(500).json({ error: 'Error saving technique to library' });
        }
    });
});

exports.deleteTechniqueFromLibrary = onCall(async (data, context) => {
    const { techniqueId } = data;
    const uid = context.auth.uid;

    if (!uid) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    try {
        const db = getFirestore();
        await db.collection('users').doc(uid).collection('techniqueLibrary').doc(techniqueId).delete();
        return { message: 'Technique deleted successfully' };
    } catch (error) {
        console.error('Error deleting technique: ', error);
        throw new HttpsError('internal', 'Error deleting technique');
    }
});

exports.saveCreatureToLibrary = onCall(async (data, context) => {
    const { creatureName, creatureData } = data;
    const uid = context.auth?.uid;

    if (!uid) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    if (!(typeof creatureName === "string") || creatureName.length === 0) {
        throw new HttpsError("invalid-argument", "The function must be called with a valid 'creatureName'.");
    }
    if (!creatureData || typeof creatureData !== "object") {
        throw new HttpsError("invalid-argument", "Missing or invalid 'creatureData' object.");
    }

    try {
        const db = getFirestore();
        const docRef = await db.collection('users').doc(uid).collection('creatureLibrary').add({
            name: creatureName,
            ...creatureData,
            timestamp: new Date()
        });
        logger.info('Creature document written with ID: ', docRef.id);
        return { message: 'Creature saved to library', docId: docRef.id };
    } catch (error) {
        logger.error('Error saving creature document: ', error);
        throw new HttpsError('internal', 'Error saving creature to library');
    }
});

exports.saveCharacterToLibraryHttp = onRequest((req, res) => {
  cors(req, res, async () => {
    // Verify the ID token from the Authorization header
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      res.status(401).json({ error: 'Unauthorized: No ID token provided.' });
      return;
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;

      const {
        name,
        species,
        traits,
        size,
        mart_prof,
        pow_prof,
        pow_abil,
        mart_abil,
        abilities,
        defenseVals,
        skills,
        feats,
        equipment,
        weapons,
        armor,
        powers,
        techniques,
        health_energy_points,
        currentHealth,        // NEW: Accept current health
        currentEnergy,        // NEW: Accept current energy
        currency,             // NEW: Accept remaining currency
        appearance,
        archetypeDesc,
        notes,
        weight,
        height
      } = req.body || {};

      // Basic validation
      if (!(typeof name === "string") || name.trim().length === 0) {
        res.status(400).json({ error: "Character name is required." });
        return;
      }
      if (!(typeof species === "string") || species.trim().length === 0) {
        res.status(400).json({ error: "Species is required." });
        return;
      }
      if (!Array.isArray(traits) || !Array.isArray(skills) || !Array.isArray(feats) ||
          !Array.isArray(equipment) || !Array.isArray(weapons) || !Array.isArray(armor) ||
          !Array.isArray(powers) || !Array.isArray(techniques) ||
          !health_energy_points || typeof health_energy_points !== 'object' ||
          !abilities || typeof abilities !== 'object') {
        res.status(400).json({ error: "Invalid payload." });
        return;
      }

      const db = getFirestore();
      const charDocId = name.trim();
      
      // Build document data
      const docData = {
        name,
        species,
        traits,
        size,
        mart_prof,
        pow_prof,
        abilities,
        defenseVals: defenseVals || {},
        skills,
        feats,
        equipment,
        weapons,
        armor,
        powers,
        techniques,
        health_energy_points,
        currentHealth: currentHealth ?? 0,     // NEW: Store current health
        currentEnergy: currentEnergy ?? 0,     // NEW: Store current energy
        currency: currency ?? 0,               // NEW: Store remaining currency
        appearance,
        archetypeDesc,
        notes,
        weight,
        height
      };
      
      // Only add pow_abil and mart_abil if they have values
      if (pow_abil !== undefined && pow_abil !== null) docData.pow_abil = pow_abil;
      if (mart_abil !== undefined && mart_abil !== null) docData.mart_abil = mart_abil;

      await db.collection('users').doc(uid).collection('character').doc(charDocId).set(docData);

      logger.info('Character saved for user:', uid, 'character:', charDocId);
      res.status(200).json({ message: 'Character saved successfully', docId: charDocId });
    } catch (error) {
      logger.error('Error saving character:', error);
      res.status(500).json({ error: 'Error saving character: ' + error.message });
    }
  });
});
