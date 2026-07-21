/**
 * Combat encounter helpers (TASK-608)
 * ===================================
 * Pure turn-order / initiative helpers for the combat encounter facade.
 */

import type { Combatant } from "@/types/encounter";
import {
  generateId,
  rollInitiative,
} from "../encounter-view-helpers";

export { generateId, rollInitiative };

/** Initiative order used for turn tracking and drag-reorder remapping. */
export function sortCombatantsForTurnOrder(
  combatants: Combatant[],
  round: number,
): Combatant[] {
  const companions = combatants.filter((c) => c.combatantType === 'companion');
  const nonCompanions = combatants.filter(
    (c) => c.combatantType !== 'companion',
  );
  if (round === 1) {
    const notSurprised = nonCompanions.filter((c) => !c.isSurprised);
    const surprised = nonCompanions.filter((c) => c.isSurprised);
    return [...notSurprised, ...surprised, ...companions];
  }
  return [...nonCompanions, ...companions];
}

export function remapTurnIndexAfterReorder(
  prevIndex: number,
  oldSorted: Combatant[],
  newSorted: Combatant[],
): number {
  if (prevIndex < 0) return prevIndex;
  const currentId = oldSorted[prevIndex]?.id;
  if (!currentId) return Math.min(prevIndex, Math.max(0, newSorted.length - 1));
  const nextIndex = newSorted.findIndex((c) => c.id === currentId);
  return nextIndex >= 0
    ? nextIndex
    : Math.min(prevIndex, Math.max(0, newSorted.length - 1));
}

export function sortByRollAndAcuity(a: Combatant, b: Combatant): number {
  if (b.initiative !== a.initiative) return b.initiative - a.initiative;
  return b.acuity - a.acuity;
}

/** Ally/enemy alternate order with companions last (Sort Initiative / auto-sort). */
export function orderCombatantsByInitiative(combatants: Combatant[]): Combatant[] {
  const companions = combatants
    .filter((c) => c.combatantType === 'companion')
    .sort(sortByRollAndAcuity);
  const allies = combatants
    .filter((c) => c.combatantType === 'ally')
    .sort(sortByRollAndAcuity);
  const enemies = combatants
    .filter((c) => c.combatantType === 'enemy')
    .sort(sortByRollAndAcuity);
  let startWithAlly = true;
  if (allies[0] && enemies[0]) {
    startWithAlly = sortByRollAndAcuity(allies[0], enemies[0]) <= 0;
  } else if (!allies[0]) {
    startWithAlly = false;
  }
  const sorted: Combatant[] = [];
  const alliesCopy = [...allies];
  const enemiesCopy = [...enemies];
  let useAlly = startWithAlly;
  while (alliesCopy.length > 0 || enemiesCopy.length > 0) {
    if (useAlly && alliesCopy.length > 0) sorted.push(alliesCopy.shift()!);
    else if (!useAlly && enemiesCopy.length > 0)
      sorted.push(enemiesCopy.shift()!);
    else if (alliesCopy.length > 0) sorted.push(alliesCopy.shift()!);
    else if (enemiesCopy.length > 0) sorted.push(enemiesCopy.shift()!);
    useAlly = !useAlly;
  }
  return [...sorted, ...companions];
}

export type NewCombatantForm = {
  name: string;
  initiative: number;
  acuity: number;
  maxHealth: number;
  maxEnergy: number;
  armor: number;
  evasion: number;
  combatantType: import('@/types/encounter').CombatantType;
  isAlly: boolean;
  isSurprised: boolean;
  quantity: number;
};

export function createEmptyNewCombatantForm(
  rollInitiativeFn: (acuity: number) => number = rollInitiative,
): NewCombatantForm {
  return {
    name: "",
    initiative: rollInitiativeFn(0),
    acuity: 0,
    maxHealth: 20,
    maxEnergy: 10,
    armor: 0,
    evasion: 10,
    combatantType: "ally",
    isAlly: true,
    isSurprised: false,
    quantity: 1,
  };
}
