import { describe, expect, it } from 'vitest';
import type { Encounter, TrackedCombatant } from '@/types/encounter';
import {
  encounterAfterAddingCombatants,
  encounterAfterAutoSortToggle,
  encounterAfterInitiativeEdit,
  orderCombatantsByInitiative,
  sortCombatantsForTurnOrder,
} from './combat-encounter-helpers';
import { encounterStateAfterStart } from './use-combat-round-actions';

function fighter(
  partial: Partial<TrackedCombatant> & Pick<TrackedCombatant, 'id' | 'initiative'>,
): TrackedCombatant {
  return {
    name: partial.id,
    acuity: 0,
    maxHealth: 10,
    currentHealth: 10,
    maxEnergy: 4,
    currentEnergy: 4,
    armor: 0,
    evasion: 10,
    ap: 4,
    conditions: [],
    notes: '',
    combatantType: 'enemy',
    isAlly: false,
    isSurprised: false,
    ...partial,
  };
}

function encounter(combatants: TrackedCombatant[], overrides: Partial<Encounter> = {}): Encounter {
  return {
    id: 'enc',
    name: 'Sort',
    type: 'combat',
    status: 'preparing',
    combatants,
    round: 0,
    currentTurnIndex: -1,
    isActive: false,
    applySurprise: false,
    ...overrides,
  };
}

describe('auto sort initiative (86e3t5a7m)', () => {
  const roll5 = fighter({ id: 'r5', initiative: 5 });
  const roll18 = fighter({ id: 'r18', initiative: 18 });
  const roll12 = fighter({ id: 'r12', initiative: 12 });

  it('sorts enemies high to low as they are added while the box is on', () => {
    const added = [roll5, roll18, roll12].reduce(
      (current, combatant) => encounterAfterAddingCombatants(current, [combatant]),
      encounter([]),
    );
    expect(added.combatants.map((c) => c.initiative)).toEqual([18, 12, 5]);
  });

  it('keeps add order when Auto Sort Initiative is off', () => {
    const added = encounterAfterAddingCombatants(
      encounter([roll5], { autoSortInitiative: false }),
      [roll18, roll12],
    );
    expect(added.combatants.map((c) => c.id)).toEqual(['r5', 'r18', 'r12']);
  });

  it('re-sorts when an initiative changes and keeps the current turn on that combatant', () => {
    const running = encounter([roll18, roll12, roll5], {
      round: 1,
      currentTurnIndex: 0,
      isActive: true,
      status: 'active',
    });
    const next = running.combatants.map((c) => (c.id === 'r12' ? { ...c, initiative: 20 } : c));
    const edited = encounterAfterInitiativeEdit(running, next, true);
    expect(edited.combatants.map((c) => c.id)).toEqual(['r12', 'r18', 'r5']);
    expect(edited.currentTurnIndex).toBe(1);
  });

  it('does not reorder when health changes or the initiative value is unchanged', () => {
    const manual = encounter([roll5, roll18], { autoSortInitiative: true });
    const healed = encounterAfterInitiativeEdit(
      manual,
      manual.combatants.map((c) => (c.id === 'r5' ? { ...c, currentHealth: 1 } : c)),
      false,
    );
    expect(healed.combatants.map((c) => c.id)).toEqual(['r5', 'r18']);
  });

  it('sorts the current list when the box is turned on and leaves a manual order when turned off', () => {
    const manual = encounter([roll5, roll18, roll12], { autoSortInitiative: false });
    const enabled = encounterAfterAutoSortToggle(manual, true);
    expect(enabled.autoSortInitiative).toBe(true);
    expect(enabled.combatants.map((c) => c.initiative)).toEqual([18, 12, 5]);

    const disabled = encounterAfterAutoSortToggle(enabled, false);
    expect(disabled.autoSortInitiative).toBe(false);
    expect(disabled.combatants.map((c) => c.initiative)).toEqual([18, 12, 5]);
  });

  it('sorts on start while the box is on, including an encounter that was still in add order', () => {
    const started = encounterStateAfterStart(encounter([roll5, roll18, roll12]));
    expect(started.round).toBe(1);
    expect(started.currentTurnIndex).toBe(0);
    expect(started.isActive).toBe(true);
    expect(started.combatants.map((c) => c.initiative)).toEqual([18, 12, 5]);
  });

  it('does not sort on start when the box is off', () => {
    const started = encounterStateAfterStart(
      encounter([roll5, roll18, roll12], { autoSortInitiative: false }),
    );
    expect(started.combatants.map((c) => c.id)).toEqual(['r5', 'r18', 'r12']);
  });

  it('alternates allies and enemies from the highest roll, with companions last', () => {
    const ordered = orderCombatantsByInitiative([
      fighter({ id: 'p1', initiative: 13, combatantType: 'ally', isAlly: true }),
      fighter({ id: 'p2', initiative: 4, acuity: 3, combatantType: 'ally', isAlly: true }),
      fighter({ id: 'p3', initiative: 4, acuity: 2, combatantType: 'ally', isAlly: true }),
      fighter({ id: 'e1', initiative: 14 }),
      fighter({ id: 'e2', initiative: 10 }),
      fighter({ id: 'e3', initiative: 8 }),
      fighter({ id: 'e4', initiative: 6 }),
      fighter({ id: 'e5', initiative: 4 }),
      fighter({ id: 'c1', initiative: 30, combatantType: 'companion', isAlly: true }),
    ]);
    expect(ordered.map((c) => c.id)).toEqual([
      'e1',
      'p1',
      'e2',
      'p2',
      'e3',
      'p3',
      'e4',
      'e5',
      'c1',
    ]);
  });

  it('still shows surprised creatures after everyone else in round 1', () => {
    const open = fighter({ id: 'open', initiative: 10 });
    const surprised = fighter({ id: 'surprised', initiative: 30, isSurprised: true });
    const added = encounterAfterAddingCombatants(encounter([open], { round: 1 }), [surprised]);
    expect(added.combatants.map((c) => c.id)).toEqual(['surprised', 'open']);
    expect(sortCombatantsForTurnOrder(added.combatants, 1).map((c) => c.id)).toEqual([
      'open',
      'surprised',
    ]);
  });
});
