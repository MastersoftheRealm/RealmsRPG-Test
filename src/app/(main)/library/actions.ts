/**
 * Library Server Actions
 * =======================
 * Server actions for user's library items (powers, techniques, items, creatures).
 * These handle CRUD operations for user-created content.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/firebase/session';
import { getAdminFirestore } from '@/lib/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';

// =============================================================================
// Powers
// =============================================================================

/**
 * Get all powers for the current user.
 */
export async function getUserPowersAction() {
  try {
    const user = await requireAuth();
    const db = getAdminFirestore();
    
    const powersRef = db
      .collection('users')
      .doc(user.uid)
      .collection('powers');
    
    const snapshot = await powersRef.orderBy('createdAt', 'desc').get();
    
    const powers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
    }));
    
    return { powers, error: null };
  } catch (error) {
    console.error('Error fetching powers:', error);
    return { powers: [], error: 'Failed to fetch powers' };
  }
}

/**
 * Save a power to the library.
 */
export async function savePowerAction(data: {
  name: string;
  description?: string;
  parts: unknown[];
  damage?: unknown;
  actionType?: string;
  range?: unknown;
  area?: unknown;
  duration?: unknown;
  totalEN?: number;
  totalTP?: number;
}) {
  try {
    const user = await requireAuth();
    const db = getAdminFirestore();
    
    const powersRef = db
      .collection('users')
      .doc(user.uid)
      .collection('powers');
    
    const powerData = {
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    
    const docRef = await powersRef.add(powerData);
    
    revalidatePath('/library');
    
    return { id: docRef.id, error: null };
  } catch (error) {
    console.error('Error saving power:', error);
    return { id: null, error: 'Failed to save power' };
  }
}

/**
 * Delete a power from the library.
 */
export async function deletePowerAction(powerId: string) {
  try {
    const user = await requireAuth();
    const db = getAdminFirestore();
    
    await db
      .collection('users')
      .doc(user.uid)
      .collection('powers')
      .doc(powerId)
      .delete();
    
    revalidatePath('/library');
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting power:', error);
    return { success: false, error: 'Failed to delete power' };
  }
}

// =============================================================================
// Techniques
// =============================================================================

/**
 * Get all techniques for the current user.
 */
export async function getUserTechniquesAction() {
  try {
    const user = await requireAuth();
    const db = getAdminFirestore();
    
    const techniquesRef = db
      .collection('users')
      .doc(user.uid)
      .collection('techniques');
    
    const snapshot = await techniquesRef.orderBy('createdAt', 'desc').get();
    
    const techniques = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
    }));
    
    return { techniques, error: null };
  } catch (error) {
    console.error('Error fetching techniques:', error);
    return { techniques: [], error: 'Failed to fetch techniques' };
  }
}

/**
 * Save a technique to the library.
 */
export async function saveTechniqueAction(data: {
  name: string;
  description?: string;
  parts: unknown[];
  damage?: unknown;
  actionType?: string;
  range?: unknown;
  staminaCost?: number;
  totalTP?: number;
}) {
  try {
    const user = await requireAuth();
    const db = getAdminFirestore();
    
    const techniquesRef = db
      .collection('users')
      .doc(user.uid)
      .collection('techniques');
    
    const techniqueData = {
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    
    const docRef = await techniquesRef.add(techniqueData);
    
    revalidatePath('/library');
    
    return { id: docRef.id, error: null };
  } catch (error) {
    console.error('Error saving technique:', error);
    return { id: null, error: 'Failed to save technique' };
  }
}

/**
 * Delete a technique from the library.
 */
export async function deleteTechniqueAction(techniqueId: string) {
  try {
    const user = await requireAuth();
    const db = getAdminFirestore();
    
    await db
      .collection('users')
      .doc(user.uid)
      .collection('techniques')
      .doc(techniqueId)
      .delete();
    
    revalidatePath('/library');
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting technique:', error);
    return { success: false, error: 'Failed to delete technique' };
  }
}

// =============================================================================
// Items
// =============================================================================

/**
 * Get all items for the current user.
 */
export async function getUserItemsAction() {
  try {
    const user = await requireAuth();
    const db = getAdminFirestore();
    
    const itemsRef = db
      .collection('users')
      .doc(user.uid)
      .collection('items');
    
    const snapshot = await itemsRef.orderBy('createdAt', 'desc').get();
    
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
    }));
    
    return { items, error: null };
  } catch (error) {
    console.error('Error fetching items:', error);
    return { items: [], error: 'Failed to fetch items' };
  }
}

/**
 * Save an item to the library.
 */
export async function saveItemAction(data: {
  name: string;
  description?: string;
  type: string;
  properties: unknown[];
  goldCost?: number;
  damage?: unknown;
  armorValue?: number;
}) {
  try {
    const user = await requireAuth();
    const db = getAdminFirestore();
    
    const itemsRef = db
      .collection('users')
      .doc(user.uid)
      .collection('items');
    
    const itemData = {
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    
    const docRef = await itemsRef.add(itemData);
    
    revalidatePath('/library');
    
    return { id: docRef.id, error: null };
  } catch (error) {
    console.error('Error saving item:', error);
    return { id: null, error: 'Failed to save item' };
  }
}

/**
 * Delete an item from the library.
 */
export async function deleteItemAction(itemId: string) {
  try {
    const user = await requireAuth();
    const db = getAdminFirestore();
    
    await db
      .collection('users')
      .doc(user.uid)
      .collection('items')
      .doc(itemId)
      .delete();
    
    revalidatePath('/library');
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting item:', error);
    return { success: false, error: 'Failed to delete item' };
  }
}

// =============================================================================
// Creatures
// =============================================================================

/**
 * Get all creatures for the current user.
 */
export async function getUserCreaturesAction() {
  try {
    const user = await requireAuth();
    const db = getAdminFirestore();
    
    const creaturesRef = db
      .collection('users')
      .doc(user.uid)
      .collection('creatures');
    
    const snapshot = await creaturesRef.orderBy('createdAt', 'desc').get();
    
    const creatures = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
    }));
    
    return { creatures, error: null };
  } catch (error) {
    console.error('Error fetching creatures:', error);
    return { creatures: [], error: 'Failed to fetch creatures' };
  }
}

/**
 * Save a creature to the library.
 */
export async function saveCreatureAction(data: Record<string, unknown>) {
  try {
    const user = await requireAuth();
    const db = getAdminFirestore();
    
    const creaturesRef = db
      .collection('users')
      .doc(user.uid)
      .collection('creatures');
    
    const creatureData = {
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    
    const docRef = await creaturesRef.add(creatureData);
    
    revalidatePath('/library');
    
    return { id: docRef.id, error: null };
  } catch (error) {
    console.error('Error saving creature:', error);
    return { id: null, error: 'Failed to save creature' };
  }
}

/**
 * Delete a creature from the library.
 */
export async function deleteCreatureAction(creatureId: string) {
  try {
    const user = await requireAuth();
    const db = getAdminFirestore();
    
    await db
      .collection('users')
      .doc(user.uid)
      .collection('creatures')
      .doc(creatureId)
      .delete();
    
    revalidatePath('/library');
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting creature:', error);
    return { success: false, error: 'Failed to delete creature' };
  }
}
