/**
 * Game Data Service
 * ==================
 * Firebase Realtime Database operations for game data
 * (archetypes, skills, feats, species, etc.)
 */

import { ref, get, child } from 'firebase/database';
import { rtdb } from '@/lib/firebase/client';
import type { Archetype, Skill, Feat, Ancestry } from '@/types';

// Simple in-memory cache
const cache: Map<string, { data: unknown; timestamp: number }> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached data or fetch from RTDB.
 */
async function getCachedData<T>(path: string): Promise<T | null> {
  const cached = cache.get(path);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  
  const snapshot = await get(child(ref(rtdb), path));
  
  if (!snapshot.exists()) {
    return null;
  }
  
  const data = snapshot.val();
  cache.set(path, { data, timestamp: Date.now() });
  
  return data as T;
}

/**
 * Clear the cache for a specific path or all paths.
 */
export function clearCache(path?: string): void {
  if (path) {
    cache.delete(path);
  } else {
    cache.clear();
  }
}

// =============================================================================
// Archetypes
// =============================================================================

/**
 * Get all archetypes.
 */
export async function getArchetypes(): Promise<Archetype[]> {
  const data = await getCachedData<Record<string, Archetype>>('archetypes');
  
  if (!data) return [];
  
  return Object.entries(data).map(([id, archetype]) => ({
    ...archetype,
    id,
  }));
}

/**
 * Get a single archetype by ID.
 */
export async function getArchetype(id: string): Promise<Archetype | null> {
  const data = await getCachedData<Archetype>(`archetypes/${id}`);
  
  if (!data) return null;
  
  return { ...data, id };
}

// =============================================================================
// Skills
// =============================================================================

/**
 * Get all skills.
 */
export async function getSkills(): Promise<Skill[]> {
  const data = await getCachedData<Record<string, Skill>>('skills');
  
  if (!data) return [];
  
  return Object.entries(data).map(([id, skill]) => ({
    ...skill,
    id,
  }));
}

/**
 * Get a single skill by ID.
 */
export async function getSkill(id: string): Promise<Skill | null> {
  const data = await getCachedData<Skill>(`skills/${id}`);
  
  if (!data) return null;
  
  return { ...data, id };
}

// =============================================================================
// Feats
// =============================================================================

/**
 * Get all feats.
 */
export async function getFeats(): Promise<Feat[]> {
  const data = await getCachedData<Record<string, Feat>>('feats');
  
  if (!data) return [];
  
  return Object.entries(data).map(([id, feat]) => ({
    ...feat,
    id,
  }));
}

/**
 * Get a single feat by ID.
 */
export async function getFeat(id: string): Promise<Feat | null> {
  const data = await getCachedData<Feat>(`feats/${id}`);
  
  if (!data) return null;
  
  return { ...data, id };
}

// =============================================================================
// Ancestries / Species
// =============================================================================

/**
 * Get all ancestries/species.
 */
export async function getAncestries(): Promise<Ancestry[]> {
  const data = await getCachedData<Record<string, Ancestry>>('species');
  
  if (!data) return [];
  
  return Object.entries(data).map(([id, ancestry]) => ({
    ...ancestry,
    id,
  }));
}

/**
 * Get a single ancestry by ID.
 */
export async function getAncestry(id: string): Promise<Ancestry | null> {
  const data = await getCachedData<Ancestry>(`species/${id}`);
  
  if (!data) return null;
  
  return { ...data, id };
}

// =============================================================================
// Generic Data Fetching
// =============================================================================

/**
 * Get any data from RTDB by path.
 */
export async function getGameData<T>(path: string): Promise<T | null> {
  return getCachedData<T>(path);
}

/**
 * Get data as an array with IDs.
 */
export async function getGameDataList<T extends { id?: string }>(
  path: string
): Promise<T[]> {
  const data = await getCachedData<Record<string, T>>(path);
  
  if (!data) return [];
  
  return Object.entries(data).map(([id, item]) => ({
    ...item,
    id,
  }));
}
