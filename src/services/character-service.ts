/**
 * Character Service
 * ==================
 * Firebase operations for character data
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/client';
import type { Character, CharacterSummary } from '@/types';

/**
 * Get the current user ID or throw an error.
 */
function requireUserId(): string {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    throw new Error('User not authenticated');
  }
  return userId;
}

/**
 * Get the characters collection reference for the current user.
 */
function getCharactersCollection(userId: string) {
  return collection(db, 'users', userId, 'character');
}

/**
 * Remove undefined values from an object recursively.
 */
function removeUndefined<T extends Record<string, unknown>>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined) as unknown as T;
  } else if (obj && typeof obj === 'object') {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) {
        clean[k] = typeof v === 'object' && v !== null 
          ? removeUndefined(v as Record<string, unknown>) 
          : v;
      }
    }
    return clean as T;
  }
  return obj;
}

/**
 * Convert Firestore document to Character.
 */
function docToCharacter(id: string, data: DocumentData): Character {
  return {
    id,
    name: data.name || 'Unnamed',
    level: data.level || 1,
    abilities: data.abilities || {
      strength: 0,
      vitality: 0,
      agility: 0,
      acuity: 0,
      intelligence: 0,
      charisma: 0,
    },
    ...data,
    createdAt: data.createdAt?.toDate?.() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
  } as Character;
}

/**
 * Prepare character data for saving (update).
 */
function prepareForSave(data: Partial<Character>): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, createdAt, updatedAt, ...dataToSave } = data;

  // Remove display-only properties
  const cleaned = { ...dataToSave } as Record<string, unknown>;
  delete cleaned._displayFeats;
  delete cleaned.allTraits;
  delete cleaned.defenses;
  delete cleaned.defenseBonuses;

  // Add timestamp
  cleaned.updatedAt = Timestamp.now();

  return removeUndefined(cleaned);
}

/**
 * Prepare character data for creation.
 */
function prepareForCreate(data: Partial<Character>): Record<string, unknown> {
  const cleaned = prepareForSave(data);
  cleaned.createdAt = Timestamp.now();
  return cleaned;
}

// =============================================================================
// Character CRUD Operations
// =============================================================================

/**
 * Get all characters for the current user.
 */
export async function getCharacters(): Promise<CharacterSummary[]> {
  const userId = requireUserId();
  const charactersRef = getCharactersCollection(userId);
  const q = query(charactersRef, orderBy('updatedAt', 'desc'));
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || 'Unnamed',
      level: data.level || 1,
      portrait: data.portrait,
      archetypeName: data.archetype?.name,
      ancestryName: data.ancestry?.name,
      status: data.status,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
    };
  });
}

/**
 * Get a single character by ID.
 */
export async function getCharacter(characterId: string): Promise<Character | null> {
  const userId = requireUserId();
  
  if (!characterId?.trim()) {
    throw new Error('Invalid character ID');
  }
  
  const docRef = doc(db, 'users', userId, 'character', characterId.trim());
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  return docToCharacter(docSnap.id, docSnap.data());
}

/**
 * Save a character (create or update).
 */
export async function saveCharacter(
  characterId: string, 
  data: Partial<Character>
): Promise<void> {
  const userId = requireUserId();
  
  if (!characterId?.trim()) {
    throw new Error('Invalid character ID');
  }
  
  const cleanedData = prepareForSave(data);
  const docRef = doc(db, 'users', userId, 'character', characterId.trim());
  
  await setDoc(docRef, cleanedData, { merge: true });
}

/**
 * Create a new character with auto-generated ID.
 */
export async function createCharacter(data: Partial<Character>): Promise<string> {
  const userId = requireUserId();
  const charactersRef = getCharactersCollection(userId);
  const newDocRef = doc(charactersRef);
  
  const cleanedData = prepareForCreate(data);
  
  await setDoc(newDocRef, cleanedData);
  
  return newDocRef.id;
}

/**
 * Delete a character.
 */
export async function deleteCharacter(characterId: string): Promise<void> {
  const userId = requireUserId();
  
  if (!characterId?.trim()) {
    throw new Error('Invalid character ID');
  }
  
  const docRef = doc(db, 'users', userId, 'character', characterId.trim());
  await deleteDoc(docRef);
}

/**
 * Duplicate a character.
 */
export async function duplicateCharacter(characterId: string): Promise<string> {
  const character = await getCharacter(characterId);
  
  if (!character) {
    throw new Error('Character not found');
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, createdAt, updatedAt, ...data } = character;
  
  return createCharacter({
    ...data,
    name: `${data.name} (Copy)`,
  });
}
