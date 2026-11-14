import { describe, expect, it } from 'vitest';
import type { LibraryPower } from '@/types/library';
import type { GuidedDraft } from '@/stores/guided-creator-store';
import { PART_IDS } from '@/lib/id-constants';
import { snapshotParts } from '@/lib/calculators/power-composition.fixture';
import {
  computeGuidedRequiredTrainingSpent,
  computeGuidedTrainingPointsBudgetSpent,
} from '@/lib/guided-creator/build-character';
import {
  guidedLoadoutTrainingPointsOverspendMessage,
  sumGuidedListedCombatTrainingPoints,
} from '@/lib/guided-creator/loadout-tp';

function minimalDraft(overrides: Partial<GuidedDraft> = {}): GuidedDraft {
  return {
    creatorEntryMode: 'guided',
    pathLayer: 'l1',
    archetypePathId: '1',
    archetypeType: 'power',
    pow_abil: 'intelligence',
    mart_abil: null,
    speciesId: null,
    speciesName: null,
    speciesMixed: false,
    mixedSpeciesIds: null,
    mixedSpeciesNames: null,
    selectedSpeciesSkillIds: [],
    selectedSpeciesTraitIds: [],
    selectedFlawSpeciesId: null,
    selectedSize: null,
    selectedSpeciesTraitChoices: {},
    selectedAncestryTraitIds: [],
    selectedCharacteristicId: null,
    selectedFlawId: null,
    abilities: { strength: 0, vitality: 0, agility: 0, intelligence: 2, awareness: 0, presence: 0 },
    abilitiesMode: 'recommended',
    skills: {},
    defenseVals: { armor: 0, guard: 0, evasion: 0, mental: 0, physical: 0 },
    skillAbilities: {},
    declinedPathSkillIds: [],
    archetypeFeatIds: [],
    characterFeatIds: [],
    equipmentPhase: 'weapon',
    loadoutWeapons: [],
    loadoutArmor: [],
    equipment: [],
    unarmedProwess: 0,
    powerIds: [],
    innatePowerIds: [],
    techniqueIds: [],
    powersPhase: 'powers',
    hpAllocated: 0,
    energyAllocated: 0,
    ...overrides,
  } as GuidedDraft;
}

describe('computeGuidedTrainingPointsBudgetSpent', () => {
  it('matches deduped proficiency spend when catalog chip TP sums higher', () => {
    const range = snapshotParts([PART_IDS.POWER_RANGE])[0]!;
    const draft = minimalDraft({
      powerIds: ['elemental-burst', 'mend-beast'],
      innatePowerIds: [],
      techniqueIds: [],
    });
    const officialPowers: LibraryPower[] = [
      {
        id: 'elemental-burst',
        docId: 'elemental-burst',
        name: 'Elemental Burst',
        parts: [{ id: Number(range.id), name: range.name, op_1_lvl: 0 }],
      },
      {
        id: 'mend-beast',
        docId: 'mend-beast',
        name: 'Mend Beast',
        parts: [{ id: Number(range.id), name: range.name, op_1_lvl: 1 }],
      },
    ];
    const ctx = {
      officialPowers,
      powerPartsDb: [range],
    };
    const listedTpById: Record<string, number> = {
      'elemental-burst': 14,
      'mend-beast': 13,
    };
    const tpCostOf = (id: string) => listedTpById[id] ?? 0;

    const listedChipTotal = sumGuidedListedCombatTrainingPoints(
      {
        powerIds: draft.powerIds,
        techniqueIds: draft.techniqueIds,
        innatePowerIds: draft.innatePowerIds,
      },
      tpCostOf,
    );
    expect(listedChipTotal).toBe(27);

    const deduped = computeGuidedRequiredTrainingSpent(draft, ctx);
    expect(deduped).toBeLessThan(listedChipTotal);

    const poolSpent = computeGuidedTrainingPointsBudgetSpent(draft, ctx, 0, tpCostOf);
    expect(poolSpent).toBe(deduped);

    const warning = guidedLoadoutTrainingPointsOverspendMessage(poolSpent, 25);
    expect(warning).toBeNull();
  });

  it('does not double-count budget display when the same id is on power and innate lists', () => {
    const range = snapshotParts([PART_IDS.POWER_RANGE])[0]!;
    const draft = minimalDraft({
      powerIds: ['dup-power'],
      innatePowerIds: ['dup-power'],
      techniqueIds: [],
    });
    const officialPowers: LibraryPower[] = [
      {
        id: 'dup-power',
        docId: 'dup-power',
        name: 'Dup',
        parts: [{ id: Number(range.id), name: range.name, op_1_lvl: 0 }],
      },
    ];
    const ctx = { officialPowers, powerPartsDb: [range] };
    const tpCostOf = () => 14;

    expect(
      sumGuidedListedCombatTrainingPoints(
        {
          powerIds: draft.powerIds,
          techniqueIds: draft.techniqueIds,
          innatePowerIds: draft.innatePowerIds,
        },
        tpCostOf,
      ),
    ).toBe(14);

    const deduped = computeGuidedRequiredTrainingSpent(draft, ctx);
    const poolSpent = computeGuidedTrainingPointsBudgetSpent(draft, ctx, 0, tpCostOf);
    expect(poolSpent).toBe(deduped);
    expect(poolSpent).toBeLessThanOrEqual(25);
  });
});
