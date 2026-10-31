/**
 * Sheet edit: when max Health or Energy drops, current drops to the new max
 * if it would stay above that max (DECISIONS.md sheet/combat; ClickUp 86e3juy8e).
 * A current value already at or below the new max stays, including below 0.
 * Raising the max while current is at or above it is the existing allocation path.
 */

import type { AbilityName, Character } from '@/types';
import type { CoreRulesMap } from '@/types/core-rules';
import { computeMaxHealthEnergy } from '@/lib/game/calculations';
import { withSyncedResourceFields } from '@/lib/encounter/character-resource-sync';

type Rules = Partial<CoreRulesMap> | undefined;

function currentWhenMaxDrops(current: number, oldMax: number, newMax: number): number {
  if (newMax < oldMax && current > newMax) return newMax;
  return current;
}

export function withCurrentFollowingMaxDrop(
  prev: Character,
  next: Character,
  rules?: Rules,
): Character {
  const oldMax = computeMaxHealthEnergy(prev, rules);
  const newMax = computeMaxHealthEnergy(next, rules);
  const currentHP = prev.currentHealth ?? prev.health?.current ?? oldMax.maxHealth;
  const currentEN = prev.currentEnergy ?? prev.energy?.current ?? oldMax.maxEnergy;
  const nextHP = currentWhenMaxDrops(currentHP, oldMax.maxHealth, newMax.maxHealth);
  const nextEN = currentWhenMaxDrops(currentEN, oldMax.maxEnergy, newMax.maxEnergy);
  const patch: { currentHealth?: number; currentEnergy?: number } = {};
  if (nextHP !== currentHP) patch.currentHealth = nextHP;
  if (nextEN !== currentEN) patch.currentEnergy = nextEN;
  if (patch.currentHealth === undefined && patch.currentEnergy === undefined) return next;
  return withSyncedResourceFields(next, patch);
}

export function applySheetHealthPointsChange(
  prev: Character,
  value: number,
  rules?: Rules,
): Character {
  const oldPoints = prev.healthPoints ?? 0;
  const delta = value - oldPoints;
  const newPoints = Math.max(0, value);
  const next = { ...prev, healthPoints: newPoints };
  if (delta <= 0) return withCurrentFollowingMaxDrop(prev, next, rules);
  const { maxHealth: oldMax } = computeMaxHealthEnergy(prev, rules);
  const currentHP = prev.currentHealth ?? prev.health?.current ?? oldMax;
  const shouldBump = currentHP >= oldMax;
  const newCurrent = shouldBump ? currentHP + delta : currentHP;
  return withSyncedResourceFields(next, { currentHealth: newCurrent });
}

export function applySheetEnergyPointsChange(
  prev: Character,
  value: number,
  rules?: Rules,
): Character {
  const oldPoints = prev.energyPoints ?? 0;
  const delta = value - oldPoints;
  const newPoints = Math.max(0, value);
  const next = { ...prev, energyPoints: newPoints };
  if (delta <= 0) return withCurrentFollowingMaxDrop(prev, next, rules);
  const { maxEnergy: oldMax } = computeMaxHealthEnergy(prev, rules);
  const currentEN = prev.currentEnergy ?? prev.energy?.current ?? oldMax;
  const shouldBump = currentEN >= oldMax;
  const newCurrent = shouldBump ? currentEN + delta : currentEN;
  return withSyncedResourceFields(next, { currentEnergy: newCurrent });
}

export function applySheetAbilityChange(
  prev: Character,
  ability: AbilityName,
  value: number,
  rules?: Rules,
): Character {
  const next: Character = {
    ...prev,
    abilities: { ...prev.abilities, [ability]: value },
  };
  return withCurrentFollowingMaxDrop(prev, next, rules);
}
