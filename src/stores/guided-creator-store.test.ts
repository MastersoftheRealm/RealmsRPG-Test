import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_ABILITIES } from '@/types';
import { CHARACTER_STARTING_CURRENCY } from '@/lib/game/constants';
import { GUIDED_SUBSTEP_ORDER, useGuidedCreatorStore } from './guided-creator-store';
import { buildPathSelectionDraftPatch } from '@/lib/guided-creator/path-selection-draft';
import { isGuidedDraftSaveable } from '@/lib/guided-creator/substep-satisfaction';

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
    const { currentSubStep, draft, entryNonce } = useGuidedCreatorStore.getState();

    expect(currentSubStep).toBe('path');
    expect(entryNonce).toBe(0);
    expect(draft.creatorEntryMode).toBe('custom');
    expect(draft.pathLayer).toBe('l3');
    expect(draft.archetypePathId).toBeNull();
    expect(draft.archetypeType).toBeNull();
    expect(draft.speciesId).toBeNull();
    expect(draft.abilities).toEqual({ ...DEFAULT_ABILITIES });
    expect(draft.abilitiesMode).toBeNull();
  });

  it('clears a persisted create idempotency key so the next character gets a new one', () => {
    useGuidedCreatorStore.setState({
      draft: {
        ...useGuidedCreatorStore.getState().draft,
        clientRequestId: '11111111-2222-4333-8444-555555555555',
      },
    });

    useGuidedCreatorStore.getState().resetCreator();
    expect(useGuidedCreatorStore.getState().draft.clientRequestId).toBeNull();
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

describe('useGuidedCreatorStore path change blocks Reveal', () => {
  beforeEach(() => {
    for (const key of Object.keys(storage)) delete storage[key];
    useGuidedCreatorStore.getState().resetCreator();
    useGuidedCreatorStore.setState({
      currentSubStep: 'reveal',
      draft: {
        ...useGuidedCreatorStore.getState().draft,
        archetypePathId: 'path-a',
        archetypeType: 'power',
        pow_abil: 'intelligence',
        speciesId: 'sp-1',
        speciesName: 'Elf',
        selectedAncestryTraitIds: ['trait-1'],
        selectedCharacteristicId: 'char-1',
        abilities: { ...DEFAULT_ABILITIES, intelligence: 2 },
        abilitiesMode: 'recommended',
        skills: { '10': 0 },
        archetypeFeatIds: ['feat-a'],
        characterFeatIds: ['feat-c'],
        currency: CHARACTER_STARTING_CURRENCY,
        name: 'Hero',
        hpAllocated: 3,
        energyAllocated: 2,
      },
    });
  });

  it('changing path from Foundation re-locks Reveal', () => {
    const store = useGuidedCreatorStore.getState();
    expect(isGuidedDraftSaveable(GUIDED_SUBSTEP_ORDER, store.draft)).toBe(true);

    store.setSubStep('path');
    store.updateDraft(
      buildPathSelectionDraftPatch('path-a', {
        id: 'path-b',
        name: 'Other Path',
        type: 'martial',
        mart_abil: 'strength',
      }),
    );

    const next = useGuidedCreatorStore.getState();
    expect(next.canNavigateToSubStep('reveal')).toBe(false);
    expect(isGuidedDraftSaveable(GUIDED_SUBSTEP_ORDER, next.draft)).toBe(false);
  });
});
