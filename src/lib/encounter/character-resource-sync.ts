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
const pendingTimers = new Map<string, ReturnType<typeof setTimeout>>();

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
    ...(character.health?.max !== undefined && {
      health: {
        current: character.health.current ?? currentHealth ?? 0,
        max: character.health.max,
      },
    }),
    ...(character.energy?.max !== undefined && {
      energy: {
        current: character.energy.current ?? currentEnergy ?? 0,
        max: character.energy.max,
      },
    }),
  };
}
