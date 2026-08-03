/**
 * Combat encounter helpers (TASK-608 / TASK-666a)
 * ===============================================
 * Pure turn-order / initiative / roster builders for the combat encounter facade.
 */

import type { Combatant, CombatantType, TrackedCombatant } from "@/types/encounter";
import type { CampaignCharacter, CampaignCharacterEncounterData } from "@/types/campaign";
import { generateId, rollInitiative } from "../encounter-view-helpers";

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

function sortByRollAndAcuity(a: Combatant, b: Combatant): number {
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

export function createEmptyNewCombatantForm(): NewCombatantForm {
  return {
    name: "",
    initiative: rollInitiative(0),
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

/** Build 1–26 manual combatants from the add-sidebar form (A/B suffixes when qty > 1). */
export function buildManualCombatantsFromForm(
  form: NewCombatantForm,
): TrackedCombatant[] {
  const quantity = Math.max(1, Math.min(26, form.quantity || 1));
  const combatants: TrackedCombatant[] = [];
  for (let i = 0; i < quantity; i++) {
    const suffix = quantity > 1 ? ` ${String.fromCharCode(65 + i)}` : "";
    combatants.push({
      id: generateId(),
      name: form.name + suffix,
      initiative: form.initiative,
      acuity: form.acuity,
      maxHealth: form.maxHealth,
      maxEnergy: form.maxEnergy,
      armor: form.armor,
      evasion: form.evasion,
      currentHealth: form.maxHealth,
      currentEnergy: form.maxEnergy,
      ap: 4,
      conditions: [],
      notes: "",
      combatantType: form.combatantType,
      isAlly:
        form.combatantType === "ally" || form.combatantType === "companion",
      isSurprised: form.isSurprised,
      sourceType: "manual",
    });
  }
  return combatants;
}

/** Next unused A–Z suffix for a duplicated combatant base name. */
function nextDuplicateCombatantName(
  combatantName: string,
  existingNames: string[],
): string {
  const baseNameMatch = combatantName.match(/^(.+?)\s*[A-Z]?$/);
  const baseName = baseNameMatch ? baseNameMatch[1].trim() : combatantName;
  const escaped = baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const usedSuffixes = existingNames
    .filter((n) => n.startsWith(baseName))
    .map((n) => {
      const m = n.match(new RegExp(`^${escaped}\\s*([A-Z])?$`));
      return m ? m[1] || "" : "";
    })
    .filter(Boolean);
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let suffix = "";
  for (const letter of alphabet) {
    if (!usedSuffixes.includes(letter)) {
      suffix = ` ${letter}`;
      break;
    }
  }
  return baseName + suffix;
}

export function buildDuplicateCombatant(
  combatant: Combatant,
  existingNames: string[],
): TrackedCombatant {
  return {
    ...combatant,
    id: generateId(),
    name: nextDuplicateCombatantName(combatant.name, existingNames),
    currentHealth: combatant.maxHealth,
    currentEnergy: combatant.maxEnergy,
    conditions: [],
  };
}

/** Map campaign-character encounter payload → tracked combatant. */
export function buildCampaignCharacterCombatant(
  charMeta: CampaignCharacter,
  data: CampaignCharacterEncounterData,
): TrackedCombatant {
  const abilities = data.abilities || {};
  const acuity = abilities.acuity ?? 0;
  const d = data as Record<string, unknown>;
  return {
    id: generateId(),
    name: charMeta.characterName,
    initiative: rollInitiative(acuity),
    acuity,
    maxHealth: data.health?.max ?? 20,
    currentHealth:
      (d.currentHealth as number | undefined) ??
      data.health?.current ??
      data.health?.max ??
      20,
    maxEnergy: data.energy?.max ?? 10,
    currentEnergy:
      (d.currentEnergy as number | undefined) ??
      data.energy?.current ??
      data.energy?.max ??
      10,
    armor: 0,
    evasion: data.evasion ?? 10 + (abilities.agility ?? 0),
    ap: (d.actionPoints as number | undefined) ?? 4,
    conditions: [],
    notes: "",
    combatantType: "ally" as CombatantType,
    isAlly: true,
    isSurprised: false,
    sourceType: "campaign-character" as const,
    sourceId: charMeta.characterId,
    sourceUserId: charMeta.userId,
  };
}
