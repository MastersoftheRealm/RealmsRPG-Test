/**
 * Server-Side Data Fetching Utilities
 * =====================================
 * Helper functions for fetching data in Server Components.
 * 
 * These functions use the Firebase Admin SDK and can only be called
 * from Server Components or Server Actions.
 * 
 * Usage in a Server Component:
 * ```tsx
 * import { getServerCharacters, getServerSession } from '@/lib/server';
 * 
 * export default async function CharactersPage() {
 *   const session = await getServerSession();
 *   if (!session.user) {
 *     redirect('/login');
 *   }
 *   
 *   const characters = await getServerCharacters(session.user.uid);
 *   return <CharactersList initialData={characters} />;
 * }
 * ```
 */

import { getSession, type SessionUser } from '@/lib/firebase/session';
import { 
  getUserCharacters, 
  getCharacterById,
  getFeats,
  getSkills,
  getSpecies,
  getTraits,
  getArchetypes,
  getPowerParts,
  getTechniqueParts,
  getItemProperties,
  getEquipment,
} from '@/lib/firebase/server';

// =============================================================================
// Session Helpers
// =============================================================================

/**
 * Get the current session in a Server Component.
 * Returns { user, error } - check user for null to determine auth state.
 */
export async function getServerSession(): Promise<{ 
  user: SessionUser | null; 
  error: string | null 
}> {
  return getSession();
}

/**
 * Get the current user ID or null if not authenticated.
 */
export async function getServerUserId(): Promise<string | null> {
  const { user } = await getSession();
  return user?.uid || null;
}

// =============================================================================
// Character Data
// =============================================================================

/**
 * Get all characters for a user.
 * Use in Server Components for SSR.
 */
export async function getServerCharacters(userId: string) {
  return getUserCharacters(userId);
}

/**
 * Get a single character by ID.
 * Use in Server Components for SSR.
 */
export async function getServerCharacter(userId: string, characterId: string) {
  return getCharacterById(userId, characterId);
}

// =============================================================================
// Game Data (from RTDB)
// =============================================================================

/**
 * Get all game data in a single call.
 * Useful for pages that need multiple data types.
 * 
 * Note: These calls are made in parallel for efficiency.
 */
export async function getServerGameData() {
  const [
    feats,
    skills,
    species,
    traits,
    archetypes,
    powerParts,
    techniqueParts,
    itemProperties,
    equipment,
  ] = await Promise.all([
    getFeats(),
    getSkills(),
    getSpecies(),
    getTraits(),
    getArchetypes(),
    getPowerParts(),
    getTechniqueParts(),
    getItemProperties(),
    getEquipment(),
  ]);

  return {
    feats,
    skills,
    species,
    traits,
    archetypes,
    powerParts,
    techniqueParts,
    itemProperties,
    equipment,
  };
}

/**
 * Get codex data for the Codex page.
 */
export async function getServerCodexData() {
  const [
    feats,
    skills,
    species,
    traits,
    powerParts,
    techniqueParts,
    itemProperties,
    equipment,
  ] = await Promise.all([
    getFeats(),
    getSkills(),
    getSpecies(),
    getTraits(),
    getPowerParts(),
    getTechniqueParts(),
    getItemProperties(),
    getEquipment(),
  ]);

  return {
    feats,
    skills,
    species,
    traits,
    powerParts,
    techniqueParts,
    itemProperties,
    equipment,
  };
}

/**
 * Get creator data for Power/Technique/Item creators.
 */
export async function getServerCreatorData() {
  const [powerParts, techniqueParts, itemProperties] = await Promise.all([
    getPowerParts(),
    getTechniqueParts(),
    getItemProperties(),
  ]);

  return {
    powerParts,
    techniqueParts,
    itemProperties,
  };
}

/**
 * Get character creator data.
 */
export async function getServerCharacterCreatorData() {
  const [feats, skills, species, traits, archetypes] = await Promise.all([
    getFeats(),
    getSkills(),
    getSpecies(),
    getTraits(),
    getArchetypes(),
  ]);

  return {
    feats,
    skills,
    species,
    traits,
    archetypes,
  };
}

// Re-export individual fetchers for granular access
export {
  getFeats as getServerFeats,
  getSkills as getServerSkills,
  getSpecies as getServerSpecies,
  getTraits as getServerTraits,
  getArchetypes as getServerArchetypes,
  getPowerParts as getServerPowerParts,
  getTechniqueParts as getServerTechniqueParts,
  getItemProperties as getServerItemProperties,
  getEquipment as getServerEquipment,
} from '@/lib/firebase/server';
