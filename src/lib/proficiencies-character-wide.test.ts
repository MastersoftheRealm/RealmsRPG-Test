import { describe, expect, it } from 'vitest';
import { PART_IDS } from '@/lib/id-constants';
import { snapshotParts } from '@/lib/calculators/power-composition.fixture';
import {
  buildRequiredProficiencies,
  calculateProficiencyTP,
  optionLevelForWholeTrainingPoints,
} from '@/lib/proficiencies';

describe('character-wide Training Points (86e3krpzp)', () => {
  it('rounds 0.5 TP per level used at level 3 up to level 4 (2 TP)', () => {
    expect(optionLevelForWholeTrainingPoints(0.5, 3)).toBe(4);
    const required = buildRequiredProficiencies({
      powers: [
        {
          id: 'one',
          name: 'One',
          parts: [{ id: 'half', name: 'Half Step', op_1_lvl: 3 }],
        },
      ],
      techniques: [],
      weapons: [],
      armor: [],
      powerPartsDb: [{ id: 'half', name: 'Half Step', base_tp: 0, op_1_tp: 0.5 }],
    });
    expect(required).toHaveLength(1);
    expect(required[0]?.op1Level).toBe(4);
    expect((required[0]?.op1TP ?? 0) * (required[0]?.op1Level ?? 0)).toBe(2);
    expect(calculateProficiencyTP(required[0]!)).toBe(2);
  });

  it('rounds 0.25 TP per level used at level 3 up to level 4 (1 TP)', () => {
    expect(optionLevelForWholeTrainingPoints(0.25, 3)).toBe(4);
    const required = buildRequiredProficiencies({
      powers: [
        {
          id: 'one',
          name: 'One',
          parts: [{ id: 'quarter', name: 'Quarter Step', op_1_lvl: 3 }],
        },
      ],
      techniques: [],
      weapons: [],
      armor: [],
      powerPartsDb: [{ id: 'quarter', name: 'Quarter Step', base_tp: 0, op_1_tp: 0.25 }],
    });
    expect(required[0]?.op1Level).toBe(4);
    expect((required[0]?.op1TP ?? 0) * (required[0]?.op1Level ?? 0)).toBe(1);
    expect(calculateProficiencyTP(required[0]!)).toBe(1);
  });

  it('pays a Codex base once and keeps each option at its highest level', () => {
    const range = snapshotParts([PART_IDS.POWER_RANGE])[0]!;
    const part = (level: number) => ({
      id: String(range.id),
      name: range.name,
      op_1_lvl: level,
    });
    const required = buildRequiredProficiencies({
      powers: [
        { id: 'a', name: 'A', parts: [part(0)] },
        { id: 'b', name: 'B', parts: [part(1), { id: 'other', name: 'Other', op_2_lvl: 3 }] },
        { id: 'c', name: 'C', parts: [part(3)] },
      ],
      techniques: [],
      weapons: [],
      armor: [],
      powerPartsDb: [
        range,
        { id: 'other', name: 'Other', base_tp: 1, op_1_tp: 0, op_2_tp: 0.25, op_3_tp: 0 },
      ],
    });
    const rangeRow = required.find((prof) => prof.name === range.name);
    const other = required.find((prof) => prof.name === 'Other');
    expect(required.filter((prof) => prof.name === range.name)).toHaveLength(1);
    expect(range.base_tp).toBe(0.5);
    expect(range.op_1_tp).toBe(0.5);
    expect(rangeRow?.baseTP).toBe(0.5);
    expect(rangeRow?.op1Level).toBe(4);
    expect(calculateProficiencyTP(rangeRow!)).toBe(3);
    expect(other?.op2Level).toBe(4);
    expect((other?.op2TP ?? 0) * (other?.op2Level ?? 0)).toBe(1);
    const onePower = buildRequiredProficiencies({
      powers: [{ id: 'a', name: 'A', parts: [part(0)] }],
      techniques: [],
      weapons: [],
      armor: [],
      powerPartsDb: [range],
    });
    const twoPowers = buildRequiredProficiencies({
      powers: [
        { id: 'a', name: 'A', parts: [part(0)] },
        { id: 'b', name: 'B', parts: [part(0)] },
      ],
      techniques: [],
      weapons: [],
      armor: [],
      powerPartsDb: [range],
    });
    expect(calculateProficiencyTP(onePower[0]!)).toBe(calculateProficiencyTP(twoPowers[0]!));
    expect(twoPowers).toHaveLength(1);
  });
});
