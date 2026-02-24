/**
 * Guest Encounter Storage
 * ========================
 * localStorage persistence for encounters when user is not signed in.
 * IDs use prefix "local-" so we can distinguish from API-backed encounters.
 */

import type { Encounter, EncounterSummary } from '@/types/encounter';

const GUEST_LIST_KEY = 'realms_guest_encounters';
const GUEST_PREFIX = 'local-';

export function isGuestEncounterId(id: string): boolean {
  return id.startsWith(GUEST_PREFIX);
}

function encounterStorageKey(id: string): string {
  return `realms_encounter_${id}`;
}

function summaryFromEncounter(e: Encounter): EncounterSummary {
  return {
    id: e.id,
    name: e.name,
    description: e.description,
    type: e.type,
    status: e.status,
    combatantCount: e.combatants?.length ?? 0,
    participantCount: e.skillEncounter?.participants?.length ?? 0,
    round: e.round ?? 0,
    updatedAt: e.updatedAt,
    createdAt: e.createdAt,
  };
}

export function getGuestEncountersList(): EncounterSummary[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GUEST_LIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as EncounterSummary[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getGuestEncounter(id: string): Encounter | null {
  if (typeof window === 'undefined' || !isGuestEncounterId(id)) return null;
  try {
    const raw = localStorage.getItem(encounterStorageKey(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Encounter;
    return parsed && typeof parsed.id === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

export function createGuestEncounter(
  data: Omit<Encounter, 'id' | 'createdAt' | 'updatedAt'>
): string {
  const id = `${GUEST_PREFIX}${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const encounter: Encounter = {
    ...data,
    id,
    createdAt: now,
    updatedAt: now,
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(encounterStorageKey(id), JSON.stringify(encounter));
    const list = getGuestEncountersList();
    list.unshift(summaryFromEncounter(encounter));
    localStorage.setItem(GUEST_LIST_KEY, JSON.stringify(list));
  }
  return id;
}

export function saveGuestEncounter(
  id: string,
  data: Partial<Omit<Encounter, 'id' | 'createdAt'>>
): void {
  if (typeof window === 'undefined' || !isGuestEncounterId(id)) return;
  const existing = getGuestEncounter(id);
  if (!existing) return;
  const updated: Encounter = {
    ...existing,
    ...data,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(encounterStorageKey(id), JSON.stringify(updated));
  const list = getGuestEncountersList();
  const idx = list.findIndex((e) => e.id === id);
  if (idx >= 0) {
    list[idx] = summaryFromEncounter(updated);
    localStorage.setItem(GUEST_LIST_KEY, JSON.stringify(list));
  }
}

export function deleteGuestEncounter(id: string): void {
  if (typeof window === 'undefined' || !isGuestEncounterId(id)) return;
  localStorage.removeItem(encounterStorageKey(id));
  const list = getGuestEncountersList().filter((e) => e.id !== id);
  localStorage.setItem(GUEST_LIST_KEY, JSON.stringify(list));
}
