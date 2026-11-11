import { describe, expect, it } from 'vitest';
import { createDefaultEncounter, type Encounter } from '@/types/encounter';
import { encounterPlayPageGatePhase } from './EncounterPlayPageGate';

describe('encounterPlayPageGatePhase', () => {
  it('returns loading while the encounter query is in flight', () => {
    expect(
      encounterPlayPageGatePhase({
        isLoading: true,
        error: null,
        encounterData: undefined,
        encounter: null,
      }),
    ).toBe('loading');
  });

  it('returns error when the query failed or returned no row', () => {
    expect(
      encounterPlayPageGatePhase({
        isLoading: false,
        error: new Error('nope'),
        encounterData: null,
        encounter: null,
      }),
    ).toBe('error');
  });

  it('returns initializing until local encounter state is hydrated', () => {
    const row = { ...createDefaultEncounter('combat', 'Test'), id: 'enc-gate-1' };
    expect(
      encounterPlayPageGatePhase({
        isLoading: false,
        error: null,
        encounterData: row,
        encounter: null,
      }),
    ).toBe('initializing');
  });

  it('returns ready for combat when encounter state is set', () => {
    const row = { ...createDefaultEncounter('combat', 'Test'), id: 'enc-gate-2' };
    expect(
      encounterPlayPageGatePhase({
        isLoading: false,
        error: null,
        encounterData: row,
        encounter: row,
      }),
    ).toBe('ready');
  });

  it('skill pages stay initializing until skillEncounter exists', () => {
    const combatOnly: Encounter = {
      ...createDefaultEncounter('combat', 'No skill'),
      id: 'enc-gate-3',
      skillEncounter: undefined,
    };
    expect(
      encounterPlayPageGatePhase({
        isLoading: false,
        error: null,
        encounterData: combatOnly,
        encounter: combatOnly,
        requireSkillEncounter: true,
      }),
    ).toBe('initializing');
  });
});
