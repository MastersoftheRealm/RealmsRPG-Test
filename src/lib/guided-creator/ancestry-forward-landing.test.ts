import { describe, expect, it } from 'vitest';
import type { Trait } from '@/hooks';
import { buildAncestryPickTasks } from '@/lib/guided-creator/ancestry-pick-tasks';
import {
  ANCESTRY_DEEP_ENTRY_OVERVIEW_SKIP_PHASE_INDEX,
  ANCESTRY_SPECIES_OVERVIEW_PHASE_INDEX,
  resolveForwardLandingPhaseIndex,
} from '@/lib/guided-creator/ancestry-forward-landing';
import { prefersDeepCatalogEntry } from '@/lib/guided-creator/creator-entry-mode';

function trait(partial: Pick<Trait, 'id' | 'name'> & Partial<Trait>): Trait {
  return { description: '', ...partial };
}

const traits: Trait[] = [
  trait({ id: 'char-1', name: 'Characteristic One' }),
  trait({ id: 'anc-1', name: 'Ancestry One' }),
];

const species = {
  species_traits: [] as string[],
  characteristics: ['char-1'],
  ancestry_traits: ['anc-1'],
  flaws: [] as string[],
};

const customDraft = { creatorEntryMode: 'custom' as const, archetypePathId: null };

describe('resolveForwardLandingPhaseIndex', () => {
  const tasks = buildAncestryPickTasks({
    species,
    allTraits: traits,
    selectedFlawId: null,
    selectedAncestryTraitIds: [],
  });

  it('lands on species overview for guided entry', () => {
    expect(
      resolveForwardLandingPhaseIndex(tasks, {
        creatorEntryMode: 'guided',
        archetypePathId: null,
      })
    ).toBe(ANCESTRY_SPECIES_OVERVIEW_PHASE_INDEX);
  });

  it('does not skip overview for custom deep entry when picks remain (TASK-640 regression)', () => {
    expect(prefersDeepCatalogEntry(customDraft)).toBe(true);
    expect(tasks.length).toBeGreaterThan(0);
    expect(resolveForwardLandingPhaseIndex(tasks, customDraft)).toBe(
      ANCESTRY_SPECIES_OVERVIEW_PHASE_INDEX
    );
    expect(resolveForwardLandingPhaseIndex(tasks, customDraft)).not.toBe(
      ANCESTRY_DEEP_ENTRY_OVERVIEW_SKIP_PHASE_INDEX
    );
  });

  it('lands on overview when no picks remain', () => {
    expect(resolveForwardLandingPhaseIndex([], customDraft)).toBe(
      ANCESTRY_SPECIES_OVERVIEW_PHASE_INDEX
    );
  });
});
