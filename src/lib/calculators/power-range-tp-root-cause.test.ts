import { describe, expect, it } from 'vitest';
import { mapSelectedToCharacterItems } from '@/components/character-sheet/add-library-item/map-selection';
import { PART_IDS } from '@/lib/id-constants';
import { snapshotParts } from '@/lib/calculators/power-composition.fixture';
import {
  buildPowerPartsPayloadForCost,
  calculatePowerCosts,
  derivePowerDisplay,
  type PowerDocument,
} from '@/lib/calculators/power-calc';
import { calculateTechniqueCosts } from '@/lib/calculators/technique-calc';
import { calculateDamageOptionLevel } from '@/lib/calculators/mechanic-builder';
import { calculateItemCosts, trainingPointsForItemPropertyRef } from '@/lib/calculators/item-calc';
import { publishedPowerTrainingPoints } from '@/lib/library/published-training-points';
import {
  buildRequiredProficiencies,
  calculateProficiencyTP,
  sumRequiredProficiencyTrainingPoints,
} from '@/lib/proficiencies';
import { computeGuidedRequiredTrainingSpent } from '@/lib/guided-creator/build-character';
import { computeCreatureTrainingSpent } from '@/app/(main)/creature-creator/creature-creator-training-spent';
import { initialState } from '@/app/(main)/creature-creator/creature-creator-constants';
import {
  partsToChips,
  propertiesToChips,
} from '@/components/patterns/list/creature-stat-block-helpers';
import type { GuidedDraft } from '@/stores/guided-creator-store';
import type { LibraryPower } from '@/types/library';
import type { CharacterPower } from '@/types';
import type { SelectableItem } from '@/components/patterns/select/unified-selection-modal';

/**
 * Live Training Point paths for Power Range.
 * Codex snapshot: base 0.5, option 1 is 0.5 per level.
 * Steps 1/2/3/4 are 3/6/9/12 spaces, and the option level is steps minus 1.
 * The unrounded sum is still 0.5, 1, 1.5, and 2. The published price raises the
 * option until that option's product is a whole number, then rounds the total
 * up with the base. A repeated part is kept once, at the highest use.
 */

const range = snapshotParts([PART_IDS.POWER_RANGE])[0]!;

function rangePower(steps: number): PowerDocument {
  return {
    name: 'Bolt',
    actionType: 'basic',
    range: { steps },
    parts: [],
  };
}

function display(steps: number) {
  return derivePowerDisplay(rangePower(steps), [range]);
}

function rawSum(steps: number): number {
  return calculatePowerCosts(buildPowerPartsPayloadForCost(rangePower(steps), [range]), [range])
    .tpRaw;
}

function libraryPower(id: string, steps: number): LibraryPower {
  return {
    id,
    docId: id,
    name: id,
    actionType: 'basic',
    range: { steps },
    parts: [],
  };
}

function budgetFor(stepsList: number[]): number {
  const powers = stepsList.map((steps, index) => libraryPower(`p${index}`, steps));
  return sumRequiredProficiencyTrainingPoints({
    powers: mapSelectedToCharacterItems(
      'power',
      powers.map(
        (power) =>
          ({
            id: power.id,
            name: power.name,
            columns: [],
            data: power,
          }) as unknown as SelectableItem,
      ),
      'powers',
      { powerPartsDb: [range], techniquePartsDb: [], itemPropertiesDb: [] },
    ) as CharacterPower[],
    techniques: [],
    weapons: [],
    armor: [],
    powerPartsDb: [range],
  });
}

describe('Power Range Training Points on the live paths', () => {
  it('reads the Codex rates the creators use', () => {
    expect(range.base_tp).toBe(0.5);
    expect(range.op_1_tp).toBe(0.5);
  });

  it('rounds the first step up to 1 and shows that price', () => {
    const shown = display(1);
    expect(shown.range).toBe('3 spaces');
    expect(rawSum(1)).toBe(0.5);
    expect(shown.tp).toBe(1);
    expect(shown.tpSources).toEqual(['1 TP: Power Range']);
    expect(shown.partChips.map((chip) => chip.text)).toEqual(['Power Range | TP: 1']);
    expect(publishedPowerTrainingPoints({ name: 'Bolt', range: { steps: 1 } }, [range]).tp).toBe(1);
  });

  it('publishes 6, 9, and 12 spaces from the whole-option total, not the raw sum and not a floor', () => {
    expect(display(2).range).toBe('6 spaces');
    expect(rawSum(2)).toBe(1);
    expect(display(2).tp).toBe(2);
    expect(display(2).tpSources).toEqual(['2 TP: Power Range (Opt1 2)']);
    expect(display(2).partChips.map((chip) => chip.text)).toEqual(['Power Range (Opt1 1) | TP: 2']);

    expect(display(3).range).toBe('9 spaces');
    expect(rawSum(3)).toBe(1.5);
    expect(display(3).tp).toBe(2);

    expect(display(4).range).toBe('12 spaces');
    expect(rawSum(4)).toBe(2);
    expect(display(4).tp).toBe(3);
    expect(display(4).tpSources).toEqual(['3 TP: Power Range (Opt1 4)']);
    expect(
      publishedPowerTrainingPoints({ name: 'Bolt', tp: 1, range: { steps: 4 } }, [range]).tp,
    ).toBe(3);
  });

  it('charges a repeated range once, at the highest use, on the sheet, guided, and creature budgets', () => {
    expect(budgetFor([1])).toBe(1);
    expect(budgetFor([1, 1])).toBe(1);
    expect(budgetFor([2])).toBe(2);
    expect(budgetFor([4])).toBe(3);
    expect(budgetFor([2, 4])).toBe(3);
    expect(budgetFor([1, 4])).toBe(3);

    const near = libraryPower('near', 2);
    const far = libraryPower('far', 4);
    const guided = computeGuidedRequiredTrainingSpent(
      {
        powerIds: ['near', 'far'],
        innatePowerIds: [],
        techniqueIds: [],
        equipment: [],
      } as GuidedDraft,
      { officialPowers: [near, far], powerPartsDb: [range] },
    );
    expect(guided).toBe(3);

    const creature = computeCreatureTrainingSpent(
      {
        ...initialState,
        enablePowers: true,
        powers: [
          {
            id: 'near',
            name: 'Near',
            energy: 1,
            action: 'Action',
            duration: '-',
            range: '6',
            area: '-',
            damage: '-',
            parts: [],
            rangeValue: { steps: 2 },
          },
          {
            id: 'far',
            name: 'Far',
            energy: 1,
            action: 'Action',
            duration: '-',
            range: '12',
            area: '-',
            damage: '-',
            parts: [],
            rangeValue: { steps: 4 },
          },
        ],
      },
      { powerPartsDb: [range] },
    );
    expect(creature).toBe(3);

    const required = buildRequiredProficiencies({
      powers: mapSelectedToCharacterItems(
        'power',
        [near, far].map(
          (power) =>
            ({
              id: power.id,
              name: power.name,
              columns: [],
              data: power,
            }) as unknown as SelectableItem,
        ),
        'powers',
        { powerPartsDb: [range], techniquePartsDb: [], itemPropertiesDb: [] },
      ) as CharacterPower[],
      techniques: [],
      weapons: [],
      armor: [],
      powerPartsDb: [range],
    });
    expect(required.filter((row) => row.name === 'Power Range')).toHaveLength(1);
    expect(calculateProficiencyTP(required.find((row) => row.name === 'Power Range')!)).toBe(3);
  });

  it('prices a technique option with the same whole-option round-up', () => {
    const additional = snapshotParts([PART_IDS.ADDITIONAL_DAMAGE])[0]!;
    expect(additional.base_tp).toBe(1);
    expect(additional.op_1_tp).toBe(0.5);
    const level = calculateDamageOptionLevel(1, 6);
    expect(level).toBe(1);
    const costs = calculateTechniqueCosts(
      [{ id: Number(additional.id), name: additional.name, op_1_lvl: level }],
      [additional],
    );
    expect(costs.totalTP).toBe(2);
    expect(costs.totalTP).not.toBe(1);
  });

  it('keeps item chips on a raw sum while the character budget uses the whole-option price', () => {
    const property = {
      id: 501,
      name: 'Reach',
      base_tp: 0.5,
      op_1_tp: 0.5,
    };
    const atUsedLevel1 = trainingPointsForItemPropertyRef(
      { id: property.id, name: property.name, op_1_lvl: 1 },
      [property],
    );
    const atUsedLevel3 = calculateItemCosts(
      [{ id: property.id, name: property.name, op_1_lvl: 3 }],
      [property],
    ).totalTP;
    expect(atUsedLevel1).toBe(1);
    expect(atUsedLevel3).toBe(2);

    const required = buildRequiredProficiencies({
      powers: [],
      techniques: [],
      weapons: [
        {
          id: 'weapon',
          name: 'Weapon',
          properties: [{ id: property.id, name: property.name, op_1_lvl: 1 }],
        },
      ],
      armor: [],
      itemPropertiesDb: [property],
    });
    expect(calculateProficiencyTP(required[0]!)).toBe(2);

    const statBlock = propertiesToChips(
      [
        { id: property.id, name: property.name, op_1_lvl: 0 },
        { id: property.id, name: property.name, op_1_lvl: 1 },
      ],
      [property],
    );
    expect(statBlock[0]?.cost).toBeUndefined();
    expect(statBlock[1]?.cost).toBe(1);

    const partChip = partsToChips([{ id: range.id, name: range.name, op_1_lvl: 1 }], [range]);
    expect(partChip[0]?.cost).toBe(2);
  });
});
