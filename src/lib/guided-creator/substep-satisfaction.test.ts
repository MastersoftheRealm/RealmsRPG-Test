import { describe, expect, it } from 'vitest';
import { DEFAULT_ABILITIES } from '@/types';
import { CHARACTER_STARTING_CURRENCY } from '@/stores/character-creator-store';
import {
  GUIDED_SUBSTEP_ORDER,
  type GuidedDraft,
} from '@/stores/guided-creator-store';
import { buildPathSelectionDraftPatch } from '@/lib/guided-creator/path-selection-draft';
import { buildGuidedSingleSpeciesDraftPatch } from '@/lib/guided-creator/species-selection-draft';
import {
  canOpenGuidedSubStep,
  isGuidedDraftSaveable,
  isGuidedSubStepSatisfied,
} from '@/lib/guided-creator/substep-satisfaction';

function saveableDraft(overrides: Partial<GuidedDraft> = {}): GuidedDraft {
  return {
    creatorEntryMode: 'guided',
    pathLayer: 'l1',
    archetypePathId: 'path-a',
    archetypeType: 'power',
    pow_abil: 'intelligence',
    mart_abil: null,
    speciesId: 'sp-1',
    speciesName: 'Elf',
    speciesMixed: false,
    mixedSpeciesIds: null,
    mixedSpeciesNames: null,
    selectedSpeciesSkillIds: [],
    selectedSpeciesTraits: [],
    selectedFlawSpeciesId: null,
    selectedSize: null,
    selectedSpeciesTraitChoices: {},
    selectedAncestryTraitIds: ['trait-1'],
    selectedCharacteristicId: 'char-1',
    selectedFlawId: null,
    abilities: { ...DEFAULT_ABILITIES, intelligence: 2 },
    abilitiesMode: 'recommended',
    skills: { '10': 0 },
    declinedPathSkillIds: [],
    archetypeFeatIds: ['feat-a'],
    characterFeatIds: ['feat-c'],
    equipmentPhase: 'weapon',
    powersPhase: 'innate',
    loadoutWeapons: [],
    loadoutArmor: [],
    armaments: [],
    equipment: [],
    currency: CHARACTER_STARTING_CURRENCY,
    unarmedProwess: 0,
    powerIds: [],
    innatePowerIds: [],
    techniqueIds: [],
    name: 'Hero',
    age: '',
    heightCm: null,
    weightKg: null,
    appearanceNotes: '',
    description: '',
    portraitUrl: null,
    hpAllocated: 3,
    energyAllocated: 2,
    ...overrides,
  };
}

describe('guided sub-step satisfaction', () => {
  it('a complete draft is saveable and Reveal is reachable', () => {
    const draft = saveableDraft();
    expect(isGuidedDraftSaveable(GUIDED_SUBSTEP_ORDER, draft)).toBe(true);
    expect(canOpenGuidedSubStep('reveal', GUIDED_SUBSTEP_ORDER, draft)).toBe(true);
  });

  it('changing path after Reveal clears dependents and blocks Reveal', () => {
    const before = saveableDraft();
    expect(isGuidedDraftSaveable(GUIDED_SUBSTEP_ORDER, before)).toBe(true);

    const patch = buildPathSelectionDraftPatch('path-a', {
      id: 'path-b',
      name: 'Other Path',
      type: 'martial',
      mart_abil: 'strength',
    });
    const after = { ...before, ...patch };

    expect(isGuidedSubStepSatisfied('abilities', after)).toBe(false);
    expect(isGuidedSubStepSatisfied('skills', after)).toBe(false);
    expect(isGuidedSubStepSatisfied('archetype-feats', after)).toBe(false);
    expect(isGuidedSubStepSatisfied('character-feat', after)).toBe(false);
    expect(isGuidedSubStepSatisfied('reveal', after)).toBe(false);
    expect(canOpenGuidedSubStep('reveal', GUIDED_SUBSTEP_ORDER, after)).toBe(false);
    expect(isGuidedDraftSaveable(GUIDED_SUBSTEP_ORDER, after)).toBe(false);
  });

  it('changing species after Reveal clears ancestry and blocks Reveal', () => {
    const before = saveableDraft();
    const patch = buildGuidedSingleSpeciesDraftPatch(
      { speciesId: before.speciesId, speciesMixed: before.speciesMixed },
      { id: 'sp-2', name: 'Dwarf' },
      []
    );
    const after = { ...before, ...patch };

    expect(isGuidedSubStepSatisfied('ancestry', after)).toBe(false);
    expect(isGuidedSubStepSatisfied('reveal', after)).toBe(false);
    expect(canOpenGuidedSubStep('reveal', GUIDED_SUBSTEP_ORDER, after)).toBe(false);
    expect(isGuidedDraftSaveable(GUIDED_SUBSTEP_ORDER, after)).toBe(false);
  });

  it('negative remaining Currency fails loadout and blocks Reveal', () => {
    const draft = saveableDraft({ currency: -25 });
    expect(isGuidedSubStepSatisfied('loadout', draft)).toBe(false);
    expect(canOpenGuidedSubStep('reveal', GUIDED_SUBSTEP_ORDER, draft)).toBe(false);
    expect(isGuidedDraftSaveable(GUIDED_SUBSTEP_ORDER, draft)).toBe(false);
  });
});
