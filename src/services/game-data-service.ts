/**
 * Game Data Service
 * ==================
 * Game data (archetypes, skills, feats, species) — reads from Firestore codex collections.
 * Migrated from RTDB (TASK-118/119).
 */

import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { waitForFirebase } from '@/lib/firebase/client';
import type { Archetype, Skill, Feat, Ancestry } from '@/types';

// Simple in-memory cache
const cache: Map<string, { data: unknown; timestamp: number }> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached data or fetch from Firestore codex collection.
 */
async function getCachedCodexList<T>(
  collectionName: string,
  addId: (item: T & { id: string }) => T & { id: string } = (x) => x
): Promise<(T & { id: string })[]> {
  const cacheKey = `codex:${collectionName}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as (T & { id: string })[];
  }

  await waitForFirebase();
  const colRef = collection(db, collectionName);
  const snapshot = await getDocs(colRef);
  const items = snapshot.docs.map((d) => addId({ ...d.data(), id: d.id } as T & { id: string }));
  cache.set(cacheKey, { data: items, timestamp: Date.now() });
  return items;
}

async function getCachedCodexDoc<T>(collectionName: string, docId: string): Promise<(T & { id: string }) | null> {
  const cacheKey = `codex:${collectionName}:${docId}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T & { id: string };
  }

  await waitForFirebase();
  const docRef = doc(db, collectionName, docId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  const data = { ...snap.data(), id: snap.id } as T & { id: string };
  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}

/**
 * Clear the cache for a specific path or all paths.
 */
export function clearCache(path?: string): void {
  if (path) {
    for (const k of cache.keys()) {
      if (k.startsWith(path) || k === path) cache.delete(k);
    }
  } else {
    cache.clear();
  }
}

// =============================================================================
// Archetypes (from Firestore codex_archetypes)
// =============================================================================

/**
 * Get all archetypes.
 */
export async function getArchetypes(): Promise<Archetype[]> {
  return getCachedCodexList<Archetype>('codex_archetypes');
}

/**
 * Get a single archetype by ID.
 */
export async function getArchetype(id: string): Promise<Archetype | null> {
  return getCachedCodexDoc<Archetype>('codex_archetypes', id);
}

// =============================================================================
// Skills (from Firestore codex_skills)
// =============================================================================

/**
 * Get all skills.
 */
export async function getSkills(): Promise<Skill[]> {
  return getCachedCodexList<Skill>('codex_skills');
}

/**
 * Get a single skill by ID.
 */
export async function getSkill(id: string): Promise<Skill | null> {
  return getCachedCodexDoc<Skill>('codex_skills', id);
}

// =============================================================================
// Feats (from Firestore codex_feats)
// =============================================================================

/**
 * Get all feats.
 */
export async function getFeats(): Promise<Feat[]> {
  return getCachedCodexList<Feat>('codex_feats');
}

/**
 * Get a single feat by ID.
 */
export async function getFeat(id: string): Promise<Feat | null> {
  return getCachedCodexDoc<Feat>('codex_feats', id);
}

// =============================================================================
// Ancestries / Species (from Firestore codex_species)
// =============================================================================

/**
 * Get all ancestries/species.
 */
export async function getAncestries(): Promise<Ancestry[]> {
  return getCachedCodexList<Ancestry>('codex_species');
}

/**
 * Get a single ancestry by ID.
 */
export async function getAncestry(id: string): Promise<Ancestry | null> {
  return getCachedCodexDoc<Ancestry>('codex_species', id);
}

// =============================================================================
// Generic Data Fetching (legacy — RTDB paths; prefer codex hooks)
// =============================================================================

/**
 * Get any data by path. For codex data, use codex hooks.
 * Kept for backwards compatibility; only codex paths supported via Firestore.
 */
export async function getGameData<T>(path: string): Promise<T | null> {
  const codexMap: Record<string, string> = {
    archetypes: 'codex_archetypes',
    skills: 'codex_skills',
    feats: 'codex_feats',
    species: 'codex_species',
  };
  const col = codexMap[path];
  if (col) {
    const items = await getCachedCodexList(col);
    return Object.fromEntries(items.map((i) => [i.id, i])) as T;
  }
  return null;
}

/**
 * Get data as an array with IDs.
 */
export async function getGameDataList<T extends { id?: string }>(path: string): Promise<T[]> {
  const codexMap: Record<string, string> = {
    archetypes: 'codex_archetypes',
    skills: 'codex_skills',
    feats: 'codex_feats',
    species: 'codex_species',
  };
  const col = codexMap[path];
  if (col) {
    return getCachedCodexList<T>(col) as Promise<T[]>;
  }
  return [];
}
