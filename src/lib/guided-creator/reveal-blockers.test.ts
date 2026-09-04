import { describe, expect, it } from 'vitest';
import { DEFAULT_ABILITIES, DEFAULT_DEFENSE_SKILLS } from '@/types';
import { CHARACTER_STARTING_CURRENCY } from '@/lib/game/constants';
import { GUIDED_CHAPTERS, type GuidedDraft } from '@/stores/guided-creator-store';
import { listGuidedRevealBlockers } from '@/lib/guided-creator/reveal-blockers';

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
    defenseVals: { ...DEFAULT_DEFENSE_SKILLS },
    skillAbilities: {},
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

describe('guided reveal blockers', () => {
  it('is empty when the draft is ready to create', () => {
    expect(
      listGuidedRevealBlockers({
        chapters: GUIDED_CHAPTERS,
        draft: saveableDraft(),
        healthEnergyRemaining: 0,
      }),
    ).toEqual([]);
  });

  it('lists name and Health/Energy on this page, not earlier chapters', () => {
    const blockers = listGuidedRevealBlockers({
      chapters: GUIDED_CHAPTERS,
      draft: saveableDraft({ name: '  ', hpAllocated: null, energyAllocated: null }),
      healthEnergyRemaining: 18,
    });
    expect(blockers.map((b) => b.kind)).toEqual(['name', 'healthEnergy']);
  });

  it('treats leftover Health/Energy points as a this-page issue even when allocated', () => {
    expect(
      listGuidedRevealBlockers({
        chapters: GUIDED_CHAPTERS,
        draft: saveableDraft({ hpAllocated: 1, energyAllocated: 0 }),
        healthEnergyRemaining: 17,
      }),
    ).toEqual([{ kind: 'healthEnergy', remaining: 17 }]);
  });

  it('names leftover Skill points when the Skills chapter already has picks', () => {
    expect(
      listGuidedRevealBlockers({
        chapters: GUIDED_CHAPTERS,
        draft: saveableDraft(),
        healthEnergyRemaining: 0,
        skillPointsRemaining: 2,
      }),
    ).toEqual([{ kind: 'skillPoints', remaining: 2, subStep: 'skills' }]);
  });

  it('names leftover Ability points only after the Abilities chapter is satisfied', () => {
    expect(
      listGuidedRevealBlockers({
        chapters: GUIDED_CHAPTERS,
        draft: saveableDraft({ abilitiesMode: 'custom' }),
        healthEnergyRemaining: 0,
        abilityPointsRemaining: 3,
      }),
    ).toEqual([{ kind: 'abilityPoints', remaining: 3, subStep: 'abilities' }]);

    expect(
      listGuidedRevealBlockers({
        chapters: GUIDED_CHAPTERS,
        draft: saveableDraft({ abilitiesMode: null, abilities: { ...DEFAULT_ABILITIES } }),
        healthEnergyRemaining: 0,
        abilityPointsRemaining: 7,
      }).map((b) => b.kind),
    ).toEqual(['chapter']);
  });

  it('names a single unfinished earlier chapter', () => {
    expect(
      listGuidedRevealBlockers({
        chapters: GUIDED_CHAPTERS,
        draft: saveableDraft({ abilitiesMode: null, abilities: { ...DEFAULT_ABILITIES } }),
        healthEnergyRemaining: 0,
      }),
    ).toEqual([
      { kind: 'chapter', chapterId: 'abilities', title: 'Abilities', subStep: 'abilities' },
    ]);
  });

  it('groups Your Archetype sub-steps into one chapter blocker', () => {
    expect(
      listGuidedRevealBlockers({
        chapters: GUIDED_CHAPTERS,
        draft: saveableDraft({
          skills: {},
          archetypeFeatIds: [],
          characterFeatIds: [],
        }),
        healthEnergyRemaining: 0,
      }),
    ).toEqual([
      {
        kind: 'chapter',
        chapterId: 'archetype',
        title: 'Your Archetype',
        subStep: 'skills',
      },
    ]);
  });
});
