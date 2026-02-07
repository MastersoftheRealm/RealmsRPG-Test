/**
 * Server-Side Data Fetching Utilities
 * =====================================
 * Helper functions for fetching data in Server Components.
 * Uses Supabase session and Prisma.
 */

import { getSession, type SessionUser } from '@/lib/supabase/session';
import { getUserCharacters, getCharacterById } from '@/lib/character-server';
import {
  getFeats,
  getSkills,
  getSpecies,
  getTraits,
  getArchetypes,
  getPowerParts,
  getTechniqueParts,
  getItemProperties,
  getEquipment,
} from '@/lib/codex-server';

// =============================================================================
// Session Helpers
// =============================================================================

export async function getServerSession(): Promise<{
  user: SessionUser | null;
  error: string | null;
}> {
  return getSession();
}

export async function getServerUserId(): Promise<string | null> {
  const { user } = await getSession();
  return user?.uid ?? null;
}

// =============================================================================
// Character Data
// =============================================================================

export async function getServerCharacters(userId: string) {
  return getUserCharacters(userId);
}

export async function getServerCharacter(userId: string, characterId: string) {
  return getCharacterById(userId, characterId);
}

// =============================================================================
// Game Data (Prisma)
// =============================================================================

export async function getServerGameData() {
  const [feats, skills, species, traits, archetypes, powerParts, techniqueParts, itemProperties, equipment] =
    await Promise.all([
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

export async function getServerCodexData() {
  const [feats, skills, species, traits, powerParts, techniqueParts, itemProperties, equipment] =
    await Promise.all([
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

export async function getServerCreatorData() {
  const [powerParts, techniqueParts, itemProperties] = await Promise.all([
    getPowerParts(),
    getTechniqueParts(),
    getItemProperties(),
  ]);
  return { powerParts, techniqueParts, itemProperties };
}

export async function getServerCharacterCreatorData() {
  const [feats, skills, species, traits, archetypes] = await Promise.all([
    getFeats(),
    getSkills(),
    getSpecies(),
    getTraits(),
    getArchetypes(),
  ]);
  return { feats, skills, species, traits, archetypes };
}

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
} from '@/lib/codex-server';
