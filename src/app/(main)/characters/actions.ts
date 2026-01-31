/**
 * Character Server Actions
 * =========================
 * Server actions for character CRUD operations.
 * These provide a type-safe, server-side API for character management.
 * 
 * Benefits over client-side service:
 * - Automatic revalidation of cached data
 * - Server-side validation
 * - Reduced client bundle size
 * - Better error handling
 */

'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/firebase/session';
import { getAdminFirestore } from '@/lib/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';
import type { Character } from '@/types';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Remove undefined values from an object recursively.
 */
function removeUndefined<T extends Record<string, unknown>>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(item => 
      typeof item === 'object' && item !== null 
        ? removeUndefined(item as Record<string, unknown>) 
        : item
    ) as unknown as T;
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
 * Prepare character data for saving.
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

  // Add server timestamp
  cleaned.updatedAt = FieldValue.serverTimestamp();

  return removeUndefined(cleaned);
}

// =============================================================================
// Character Actions
// =============================================================================

/**
 * Get all characters for the current user.
 */
export async function getCharactersAction() {
  try {
    const user = await requireAuth();
    const db = getAdminFirestore();
    
    const charactersRef = db
      .collection('users')
      .doc(user.uid)
      .collection('character');
    
    const snapshot = await charactersRef.orderBy('updatedAt', 'desc').get();
    
    const characters = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Unnamed',
        level: data.level || 1,
        portrait: data.portrait,
        archetypeName: data.archetype?.name,
        ancestryName: data.ancestry?.name,
        status: data.status,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      };
    });
    
    return { characters, error: null };
  } catch (error) {
    console.error('Error fetching characters:', error);
    return { characters: [], error: 'Failed to fetch characters' };
  }
}

/**
 * Get a single character by ID.
 */
export async function getCharacterAction(characterId: string) {
  try {
    const user = await requireAuth();
    const db = getAdminFirestore();
    
    const docRef = db
      .collection('users')
      .doc(user.uid)
      .collection('character')
      .doc(characterId);
    
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return { character: null, error: 'Character not found' };
    }
    
    const data = doc.data()!;
    const character = {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
    };
    
    return { character, error: null };
  } catch (error) {
    console.error('Error fetching character:', error);
    return { character: null, error: 'Failed to fetch character' };
  }
}

/**
 * Create a new character.
 */
export async function createCharacterAction(data: Partial<Character>) {
  try {
    const user = await requireAuth();
    const db = getAdminFirestore();
    
    const charactersRef = db
      .collection('users')
      .doc(user.uid)
      .collection('character');
    
    const cleanedData = prepareForSave(data);
    cleanedData.createdAt = FieldValue.serverTimestamp();
    
    const docRef = await charactersRef.add(cleanedData);
    
    revalidatePath('/characters');
    
    return { id: docRef.id, error: null };
  } catch (error) {
    console.error('Error creating character:', error);
    return { id: null, error: 'Failed to create character' };
  }
}

/**
 * Update an existing character.
 */
export async function updateCharacterAction(characterId: string, data: Partial<Character>) {
  try {
    const user = await requireAuth();
    const db = getAdminFirestore();
    
    const docRef = db
      .collection('users')
      .doc(user.uid)
      .collection('character')
      .doc(characterId);
    
    const cleanedData = prepareForSave(data);
    
    await docRef.set(cleanedData, { merge: true });
    
    revalidatePath('/characters');
    revalidatePath(`/characters/${characterId}`);
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating character:', error);
    return { success: false, error: 'Failed to update character' };
  }
}

/**
 * Delete a character.
 */
export async function deleteCharacterAction(characterId: string) {
  try {
    const user = await requireAuth();
    const db = getAdminFirestore();
    
    const docRef = db
      .collection('users')
      .doc(user.uid)
      .collection('character')
      .doc(characterId);
    
    await docRef.delete();
    
    revalidatePath('/characters');
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting character:', error);
    return { success: false, error: 'Failed to delete character' };
  }
}

/**
 * Duplicate a character.
 */
export async function duplicateCharacterAction(characterId: string) {
  try {
    const user = await requireAuth();
    const db = getAdminFirestore();
    
    // Get the original character
    const docRef = db
      .collection('users')
      .doc(user.uid)
      .collection('character')
      .doc(characterId);
    
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return { id: null, error: 'Character not found' };
    }
    
    const data = doc.data()!;
    
    // Create a copy
    const charactersRef = db
      .collection('users')
      .doc(user.uid)
      .collection('character');
    
    const copyData = {
      ...data,
      name: `${data.name || 'Unnamed'} (Copy)`,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    
    const newDocRef = await charactersRef.add(copyData);
    
    revalidatePath('/characters');
    
    return { id: newDocRef.id, error: null };
  } catch (error) {
    console.error('Error duplicating character:', error);
    return { id: null, error: 'Failed to duplicate character' };
  }
}
