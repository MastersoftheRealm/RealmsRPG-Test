/**
 * Guest Character Storage
 * ========================
 * localStorage persistence for finished characters when the user is not signed in.
 * IDs use prefix "local-" so API routes never treat them as cloud UUIDs (ADR-0026).
 */

import { DEFAULT_ABILITIES } from '@/types/abilities';
import type { Character, CharacterSummary } from '@/types';
import { MAX_PORTRAIT_DATA_URL_LENGTH } from '@/lib/portrait';

const GUEST_LIST_KEY = 'realms_guest_characters';
const GUEST_PREFIX = 'local-';

export const GUEST_CHARACTER_CAP = 3;

export class GuestCharacterCapError extends Error {
  constructor() {
    super(
      `You can keep up to ${GUEST_CHARACTER_CAP} characters in this browser. Sign in to save more, or delete one first.`,
    );
    this.name = 'GuestCharacterCapError';
  }
}

export function isGuestCharacterId(id: string | null | undefined): boolean {
  return typeof id === 'string' && id.startsWith(GUEST_PREFIX);
}

function characterStorageKey(id: string): string {
  return `realms_character_${id}`;
}

function clipPortrait(portrait: string | undefined): string | undefined {
  if (!portrait) return undefined;
  if (portrait.startsWith('data:') && portrait.length > MAX_PORTRAIT_DATA_URL_LENGTH) {
    return undefined;
  }
  return portrait;
}

function summaryFromCharacter(c: Character): CharacterSummary {
  return {
    id: c.id,
    name: c.name,
    level: c.level,
    ...(c.portrait ? { portrait: c.portrait } : {}),
    ...(c.archetype?.name ? { archetypeName: c.archetype.name } : {}),
    ...(c.ancestry?.name ? { ancestryName: c.ancestry.name } : {}),
    status: c.status ?? 'complete',
    visibility: 'private',
    ...(c.updatedAt ? { updatedAt: c.updatedAt } : {}),
  };
}

export function getGuestCharactersList(): CharacterSummary[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GUEST_LIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CharacterSummary[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getGuestCharacter(id: string): Character | null {
  if (typeof window === 'undefined' || !isGuestCharacterId(id)) return null;
  try {
    const raw = localStorage.getItem(characterStorageKey(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Character;
    return parsed && typeof parsed.id === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

export function createGuestCharacter(data: Partial<Character>): string {
  const list = getGuestCharactersList();
  if (list.length >= GUEST_CHARACTER_CAP) {
    throw new GuestCharacterCapError();
  }

  const id = `${GUEST_PREFIX}${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const portrait = clipPortrait(typeof data.portrait === 'string' ? data.portrait : undefined);
  const character: Character = {
    ...data,
    id,
    name: data.name?.trim() || 'Unnamed Hero',
    level: data.level || 1,
    abilities: data.abilities ?? DEFAULT_ABILITIES,
    visibility: 'private',
    createdAt: now,
    updatedAt: now,
  };
  delete character.userId;
  if (portrait) character.portrait = portrait;
  else delete character.portrait;

  if (typeof window !== 'undefined') {
    localStorage.setItem(characterStorageKey(id), JSON.stringify(character));
    list.unshift(summaryFromCharacter(character));
    localStorage.setItem(GUEST_LIST_KEY, JSON.stringify(list));
  }
  return id;
}

export function saveGuestCharacter(
  id: string,
  data: Partial<Omit<Character, 'id' | 'createdAt'>>,
): void {
  if (typeof window === 'undefined' || !isGuestCharacterId(id)) return;
  const existing = getGuestCharacter(id);
  if (!existing) return;
  const portrait = clipPortrait(
    typeof data.portrait === 'string'
      ? data.portrait
      : typeof existing.portrait === 'string'
        ? existing.portrait
        : undefined,
  );
  const updated: Character = {
    ...existing,
    ...data,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
    visibility: 'private',
    ...(portrait ? { portrait } : {}),
  };
  delete updated.userId;
  if (!portrait) delete updated.portrait;
  localStorage.setItem(characterStorageKey(id), JSON.stringify(updated));
  const list = getGuestCharactersList();
  const idx = list.findIndex((c) => c.id === id);
  const summary = summaryFromCharacter(updated);
  if (idx >= 0) {
    list[idx] = summary;
  } else {
    list.unshift(summary);
  }
  localStorage.setItem(GUEST_LIST_KEY, JSON.stringify(list));
}

export function deleteGuestCharacter(id: string): void {
  if (typeof window === 'undefined' || !isGuestCharacterId(id)) return;
  localStorage.removeItem(characterStorageKey(id));
  const list = getGuestCharactersList().filter((c) => c.id !== id);
  localStorage.setItem(GUEST_LIST_KEY, JSON.stringify(list));
}

export function duplicateGuestCharacter(id: string): string {
  const existing = getGuestCharacter(id);
  if (!existing) {
    throw new Error('Character not found');
  }
  return createGuestCharacter({
    ...existing,
    name: `${existing.name} (Copy)`,
  });
}
