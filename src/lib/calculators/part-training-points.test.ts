import { describe, expect, it } from 'vitest';
import { PART_IDS } from '@/lib/id-constants';
import { buildRequiredProficiencies, calculateProficiencyTP } from '@/lib/proficiencies';
import { computePartTrainingPoints } from './part-training-points';
import { calculateDamageOptionLevel } from './mechanic-builder';
import { snapshotParts } from './power-composition.fixture';
import { calculateTechniqueCosts } from './technique-calc';

/** Synthetic Additional Damage rates. Real id 6 is base 1 / option 0.5 in the snapshot. */
const SYNTHETIC_ADDITIONAL_DAMAGE = {
  id: 906,
  name: 'Additional Damage',
  base_tp: 0,
  op_1_tp: 1.5,
  op_2_tp: 0,
  op_3_tp: 0,
};

describe('computePartTrainingPoints', () => {
  it('prices Elemental Damage option 1 from Codex at the whole-number level', () => {
    const elemental = snapshotParts([PART_IDS.ELEMENTAL_DAMAGE])[0]!;
    expect(elemental.base_tp).toBe(2);
    expect(elemental.op_1_tp).toBe(0.5);
    // Level 1 is 0.5 TP, so the requirement is level 2 (1 TP) plus the base.
    expect(computePartTrainingPoints(elemental, { op_1_lvl: 1 })).toBe(3);
  });

  it('sums base and option TP and rounds the instance up', () => {
    expect(
      computePartTrainingPoints(
        { id: 901, name: 'Test', base_tp: 2, op_1_tp: 1, op_2_tp: 0, op_3_tp: 0 },
        { op_1_lvl: 2 },
      ),
    ).toBe(4);
  });

  it('rounds technique Additional Damage option 1 up with the rest of the part', () => {
    // 1.5 per level at level 1 is not a whole number, so the requirement is level 2 (3 TP).
    expect(
      computePartTrainingPoints(SYNTHETIC_ADDITIONAL_DAMAGE, { op_1_lvl: 1 }, 'technique'),
    ).toBe(3);
    expect(
      computePartTrainingPoints(SYNTHETIC_ADDITIONAL_DAMAGE, { op_1_lvl: 2 }, 'technique'),
    ).toBe(3);
    expect(computePartTrainingPoints(SYNTHETIC_ADDITIONAL_DAMAGE, { op_1_lvl: 1 }, 'power')).toBe(
      3,
    );
    expect(computePartTrainingPoints(SYNTHETIC_ADDITIONAL_DAMAGE, { op_1_lvl: 2 }, 'power')).toBe(
      3,
    );
  });

  it('matches creator and proficiency Training Points for Additional Damage +1d6 and +1d2', () => {
    const additional = snapshotParts([PART_IDS.ADDITIONAL_DAMAGE])[0]!;
    expect(additional.base_tp).toBe(1);
    expect(additional.op_1_tp).toBe(0.5);
    const cases = [
      { dice: 1, size: 6, label: '+1d6', level: 1, tp: 2 },
      { dice: 1, size: 2, label: '+1d2', level: 0, tp: 1 },
    ] as const;

    for (const row of cases) {
      const level = calculateDamageOptionLevel(row.dice, row.size);
      expect(level, row.label).toBe(row.level);
      const creatorTP = calculateTechniqueCosts(
        [{ id: Number(additional.id), name: additional.name, op_1_lvl: level }],
        [additional],
      ).totalTP;
      const required = buildRequiredProficiencies({
        powers: [],
        techniques: [
          {
            id: `additional-${row.size}`,
            name: 'Additional Damage check',
            parts: [{ id: String(additional.id), name: additional.name, op_1_lvl: level }],
          },
        ],
        weapons: [],
        armor: [],
        techniquePartsDb: [additional],
      });
      const proficiencyTP = required.reduce((sum, prof) => sum + calculateProficiencyTP(prof), 0);
      expect(creatorTP, row.label).toBe(row.tp);
      expect(proficiencyTP, row.label).toBe(row.tp);
    }
  });

  it('prices Power Range from Codex: base once, then the option at a whole-number level', () => {
    const range = snapshotParts([PART_IDS.POWER_RANGE])[0]!;
    expect(range.base_tp).toBe(0.5);
    expect(range.op_1_tp).toBe(0.5);
    // 3 spaces is the base only. 0.5 rounds up to 1.
    expect(computePartTrainingPoints(range, { op_1_lvl: 0 })).toBe(1);
    // 6 spaces is option level 1. 0.5 is not whole, so level 2 (1 TP) plus the base is 2.
    expect(computePartTrainingPoints(range, { op_1_lvl: 1 })).toBe(2);
    // 12 spaces is option level 3. That needs level 4 (2 TP) plus the base, which is 3.
    expect(computePartTrainingPoints(range, { op_1_lvl: 3 })).toBe(3);
  });
});
