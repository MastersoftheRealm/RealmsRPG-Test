/**
 * Two-way HP / EN / AP sync between encounter combatants and character sheets.
 */

import { saveCharacter } from '@/services/character-service';
import type { Character } from '@/types';
import type { TrackedCombatant } from '@/types/encounter';

export type CharacterResourcePatch = Pick<
  Partial<Character>,
  'currentHealth' | 'currentEnergy' | 'actionPoints' | 'health' | 'energy'
>;

const DEBOUNCE_MS = 400;
const REMOTE_SUPPRESS_MS = DEBOUNCE_MS + 1200;
const pendingTimers = new Map<string, ReturnType<typeof setTimeout>>();
const lastLocalResourceEditAt = new Map<string, number>();

/** Mark that HP/EN/AP were edited locally — suppress stale realtime echoes briefly. */
export function notifyLocalResourceEdit(characterId: string): void {
  lastLocalResourceEditAt.set(characterId, Date.now());
}

export function shouldSuppressRemoteResourceMerge(characterId: string): boolean {
  const t = lastLocalResourceEditAt.get(characterId);
  if (!t) return false;
  if (Date.now() - t > REMOTE_SUPPRESS_MS) {
    lastLocalResourceEditAt.delete(characterId);
    return false;
  }
  return true;
}

/** Read HP/EN/AP from character `data` JSON. Top-level fields win over nested health/energy.current. */
export function readResourcesFromCharacterData(data: Record<string, unknown>): {
  currentHealth?: number;
  currentEnergy?: number;
  actionPoints?: number;
  healthMax?: number;
  energyMax?: number;
} {
  const health = data.health as { current?: number; max?: number } | undefined;
  const energy = data.energy as { current?: number; max?: number } | undefined;

  return {
    currentHealth:
      typeof data.currentHealth === 'number' ? data.currentHealth : health?.current,
    currentEnergy:
      typeof data.currentEnergy === 'number' ? data.currentEnergy : energy?.current,
    actionPoints: typeof data.actionPoints === 'number' ? data.actionPoints : undefined,
    healthMax: typeof health?.max === 'number' ? health.max : undefined,
    energyMax: typeof energy?.max === 'number' ? energy.max : undefined,
  };
}

/** Apply resource fields from DB/realtime payload onto local character state (consistent nested objects). */
export function mergeResourceUpdatesIntoCharacter(
  prev: Character,
  data: Record<string, unknown>
): Character | null {
  const r = readResourcesFromCharacterData(data);
  if (
    r.currentHealth === undefined &&
    r.currentEnergy === undefined &&
    r.actionPoints === undefined
  ) {
    return null;
  }

  const updates: Partial<Character> = {};
  if (r.currentHealth !== undefined) updates.currentHealth = r.currentHealth;
  if (r.currentEnergy !== undefined) updates.currentEnergy = r.currentEnergy;
  if (r.actionPoints !== undefined) updates.actionPoints = r.actionPoints;

  if (r.currentHealth !== undefined && (r.healthMax !== undefined || prev.health?.max !== undefined)) {
    updates.health = {
      ...(prev.health ?? {}),
      current: r.currentHealth,
      max: r.healthMax ?? prev.health?.max ?? 0,
    } as Character['health'];
  } else if (r.healthMax !== undefined && prev.health) {
    updates.health = { ...prev.health, max: r.healthMax } as Character['health'];
  }

  if (r.currentEnergy !== undefined && (r.energyMax !== undefined || prev.energy?.max !== undefined)) {
    updates.energy = {
      ...(prev.energy ?? {}),
      current: r.currentEnergy,
      max: r.energyMax ?? prev.energy?.max ?? 0,
    } as Character['energy'];
  } else if (r.energyMax !== undefined && prev.energy) {
    updates.energy = { ...prev.energy, max: r.energyMax } as Character['energy'];
  }

  return { ...prev, ...updates };
}

export function withSyncedResourceFields(
  prev: Character,
  patch: { currentHealth?: number; currentEnergy?: number; actionPoints?: number }
): Character {
  const next = { ...prev, ...patch };
  if (patch.currentHealth !== undefined) {
    next.currentHealth = patch.currentHealth;
    if (prev.health?.max !== undefined) {
      next.health = { ...prev.health, current: patch.currentHealth, max: prev.health.max };
    }
  }
  if (patch.currentEnergy !== undefined) {
    next.currentEnergy = patch.currentEnergy;
    if (prev.energy?.max !== undefined) {
      next.energy = { ...prev.energy, current: patch.currentEnergy, max: prev.energy.max };
    }
  }
  if (patch.actionPoints !== undefined) {
    next.actionPoints = patch.actionPoints;
  }
  return next;
}

export function buildResourcePatchFromCombatant(combatant: {
  currentHealth: number;
  currentEnergy: number;
  ap: number;
  maxHealth: number;
  maxEnergy: number;
}): CharacterResourcePatch {
  return {
    currentHealth: combatant.currentHealth,
    currentEnergy: combatant.currentEnergy,
    actionPoints: combatant.ap,
    health: { current: combatant.currentHealth, max: combatant.maxHealth },
    energy: { current: combatant.currentEnergy, max: combatant.maxEnergy },
  };
}

export function isOwnedLinkedCombatant(
  combatant: TrackedCombatant | undefined,
  userId: string | undefined
): boolean {
  return (
    !!userId &&
    combatant?.sourceType === 'campaign-character' &&
    !!combatant.sourceId &&
    combatant.sourceUserId === userId
  );
}

export function scheduleCharacterResourceSync(
  characterId: string,
  patch: CharacterResourcePatch
): void {
  notifyLocalResourceEdit(characterId);
  const existing = pendingTimers.get(characterId);
  if (existing) clearTimeout(existing);

  pendingTimers.set(
    characterId,
    setTimeout(() => {
      pendingTimers.delete(characterId);
      void saveCharacter(characterId, patch).catch(() => {});
    }, DEBOUNCE_MS)
  );
}

export function scheduleCharacterResourceSyncFromCombatant(combatant: TrackedCombatant): void {
  if (!combatant.sourceId) return;
  scheduleCharacterResourceSync(combatant.sourceId, buildResourcePatchFromCombatant(combatant));
}

export function buildResourcePatchFromCharacter(character: {
  currentHealth?: number;
  currentEnergy?: number;
  actionPoints?: number;
  health?: { current?: number; max?: number };
  energy?: { current?: number; max?: number };
}): CharacterResourcePatch | null {
  const currentHealth = character.currentHealth ?? character.health?.current;
  const currentEnergy = character.currentEnergy ?? character.energy?.current;
  const actionPoints = character.actionPoints;

  if (
    currentHealth === undefined &&
    currentEnergy === undefined &&
    actionPoints === undefined
  ) {
    return null;
  }

  return {
    ...(currentHealth !== undefined && { currentHealth }),
    ...(currentEnergy !== undefined && { currentEnergy }),
    ...(actionPoints !== undefined && { actionPoints }),
    ...(character.health?.max !== undefined &&
      currentHealth !== undefined && {
        health: {
          current: currentHealth,
          max: character.health.max,
        },
      }),
    ...(character.energy?.max !== undefined &&
      currentEnergy !== undefined && {
        energy: {
          current: currentEnergy,
          max: character.energy.max,
        },
      }),
  };
}
