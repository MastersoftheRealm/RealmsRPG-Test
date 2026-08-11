import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_ABILITIES } from '@/types';
import { useGuidedCreatorStore } from './guided-creator-store';

const storage: Record<string, string> = {};

vi.stubGlobal('localStorage', {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, value: string) => {
    storage[key] = value;
  },
  removeItem: (key: string) => {
    delete storage[key];
  },
  clear: () => {
    for (const key of Object.keys(storage)) delete storage[key];
  },
});

describe('useGuidedCreatorStore resetCreator', () => {
  beforeEach(() => {
    for (const key of Object.keys(storage)) delete storage[key];
    useGuidedCreatorStore.setState({
      currentSubStep: 'species',
      completedSubSteps: ['path'],
      draft: {
        ...useGuidedCreatorStore.getState().draft,
        creatorEntryMode: 'custom',
        pathLayer: 'l1',
        archetypeType: 'power',
        pow_abil: 'intelligence',
        speciesId: 'species-1',
        speciesName: 'Elf',
        abilities: { ...DEFAULT_ABILITIES, intelligence: 2 },
        abilitiesMode: 'custom',
      },
      navigationIntent: 'forward',
      entryNonce: 3,
    });
  });

  it('preserves custom entry on Path L3 and clears chapter progress', () => {
    useGuidedCreatorStore.getState().resetCreator();
    const { currentSubStep, completedSubSteps, draft, entryNonce } =
      useGuidedCreatorStore.getState();

    expect(currentSubStep).toBe('path');
    expect(completedSubSteps).toEqual([]);
    expect(entryNonce).toBe(0);
    expect(draft.creatorEntryMode).toBe('custom');
    expect(draft.pathLayer).toBe('l3');
    expect(draft.archetypePathId).toBeNull();
    expect(draft.archetypeType).toBeNull();
    expect(draft.speciesId).toBeNull();
    expect(draft.abilities).toEqual({ ...DEFAULT_ABILITIES });
    expect(draft.abilitiesMode).toBeNull();
  });

  it('preserves guided entry on Path L1', () => {
    useGuidedCreatorStore.setState({
      draft: {
        ...useGuidedCreatorStore.getState().draft,
        creatorEntryMode: 'guided',
        pathLayer: 'l3',
        archetypePathId: 'path-a',
        archetypeType: 'martial',
      },
    });

    useGuidedCreatorStore.getState().resetCreator();
    const { draft } = useGuidedCreatorStore.getState();

    expect(draft.creatorEntryMode).toBe('guided');
    expect(draft.pathLayer).toBe('l1');
    expect(draft.archetypePathId).toBeNull();
    expect(draft.archetypeType).toBeNull();
  });
});
