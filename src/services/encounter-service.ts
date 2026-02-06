/**
 * Encounter Service
 * ==================
 * Client-side Firebase operations for encounter data.
 * Encounters are user-owned documents stored under users/{uid}/encounters/.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/client';
import type { Encounter, EncounterSummary } from '@/types/encounter';

function requireUserId(): string {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    throw new Error('User not authenticated');
  }
  return userId;
}

function encountersCollection(userId: string) {
  return collection(db, 'users', userId, 'encounters');
}

function encounterDoc(userId: string, encounterId: string) {
  return doc(db, 'users', userId, 'encounters', encounterId);
}

function docToEncounter(id: string, data: Record<string, unknown>): Encounter {
  return {
    id,
    name: (data.name as string) || 'Unnamed Encounter',
    description: data.description as string | undefined,
    type: (data.type as Encounter['type']) || 'combat',
    status: (data.status as Encounter['status']) || 'preparing',
    combatants: (data.combatants as Encounter['combatants']) || [],
    round: (data.round as number) ?? 0,
    currentTurnIndex: (data.currentTurnIndex as number) ?? -1,
    isActive: (data.isActive as boolean) ?? false,
    applySurprise: (data.applySurprise as boolean) ?? false,
    skillEncounter: data.skillEncounter as Encounter['skillEncounter'],
    createdAt: (data.createdAt as Timestamp)?.toDate?.() ?? data.createdAt,
    updatedAt: (data.updatedAt as Timestamp)?.toDate?.() ?? data.updatedAt,
  };
}

function encounterToSummary(encounter: Encounter): EncounterSummary {
  return {
    id: encounter.id,
    name: encounter.name,
    description: encounter.description,
    type: encounter.type,
    status: encounter.status,
    combatantCount: encounter.combatants?.length ?? 0,
    participantCount: encounter.skillEncounter?.participants?.length ?? 0,
    round: encounter.round,
    updatedAt: encounter.updatedAt,
    createdAt: encounter.createdAt,
  };
}

/**
 * Get all encounters for the current user.
 */
export async function getEncounters(): Promise<EncounterSummary[]> {
  const userId = requireUserId();
  const q = query(encountersCollection(userId), orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => {
    const encounter = docToEncounter(d.id, d.data() as Record<string, unknown>);
    return encounterToSummary(encounter);
  });
}

/**
 * Get a single encounter by ID.
 */
export async function getEncounter(encounterId: string): Promise<Encounter | null> {
  const userId = requireUserId();
  const docRef = encounterDoc(userId, encounterId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) return null;
  return docToEncounter(snapshot.id, snapshot.data() as Record<string, unknown>);
}

/**
 * Create a new encounter. Returns the new encounter ID.
 */
export async function createEncounter(
  data: Omit<Encounter, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const userId = requireUserId();
  const docRef = await addDoc(encountersCollection(userId), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Save (update) an existing encounter.
 */
export async function saveEncounter(
  encounterId: string,
  data: Partial<Omit<Encounter, 'id' | 'createdAt'>>
): Promise<void> {
  const userId = requireUserId();
  const docRef = encounterDoc(userId, encounterId);
  await setDoc(
    docRef,
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Delete an encounter.
 */
export async function deleteEncounter(encounterId: string): Promise<void> {
  const userId = requireUserId();
  const docRef = encounterDoc(userId, encounterId);
  await deleteDoc(docRef);
}
