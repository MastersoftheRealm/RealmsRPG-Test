import { describe, expect, it } from 'vitest';
import type { Encounter, TrackedCombatant } from '@/types/encounter';
import { encounterStateAfterEnd, encounterStateAfterStart } from './use-combat-round-actions';

const combatant: TrackedCombatant = {
  id: 'a',
  name: 'Alpha',
  initiative: 10,
  acuity: 0,
  maxHealth: 10,
  currentHealth: 5,
  maxEnergy: 4,
  currentEnergy: 2,
  armor: 0,
  evasion: 10,
  ap: 2,
  conditions: [],
  notes: '',
  combatantType: 'ally',
  isAlly: true,
  isSurprised: false,
};

function baseEncounter(overrides: Partial<Encounter>): Encounter {
  return {
    id: 'e1',
    name: 'Test',
    type: 'combat',
    status: 'preparing',
    combatants: [combatant],
    round: 0,
    currentTurnIndex: -1,
    isActive: false,
    applySurprise: false,
    ...overrides,
  };
}

describe('combat round persistence (86e3p800n)', () => {
  it('end encounter keeps the current round for list display and resume', () => {
    const ended = encounterStateAfterEnd(
      baseEncounter({ status: 'active', round: 3, currentTurnIndex: 1, isActive: true }),
    );
    expect(ended.round).toBe(3);
    expect(ended.isActive).toBe(false);
    expect(ended.status).toBe('paused');
  });

  it('start encounter uses round 1 when none started yet', () => {
    const started = encounterStateAfterStart(baseEncounter());
    expect(started.round).toBe(1);
    expect(started.currentTurnIndex).toBe(0);
  });

  it('resume after end encounter keeps round and opens at first turn index', () => {
    const resumed = encounterStateAfterStart(
      baseEncounter({ status: 'paused', round: 4, currentTurnIndex: -1 }),
    );
    expect(resumed.round).toBe(4);
    expect(resumed.currentTurnIndex).toBe(0);
    expect(resumed.isActive).toBe(true);
  });
});
