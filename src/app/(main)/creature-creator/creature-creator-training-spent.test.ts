import { describe, expect, it } from 'vitest';
import { PART_IDS } from '@/lib/id-constants';
import { snapshotParts } from '@/lib/calculators/power-composition.fixture';
import { initialState } from './creature-creator-constants';
import { computeCreatureTrainingSpent } from './creature-creator-training-spent';

describe('computeCreatureTrainingSpent (86e3krpzp)', () => {
  const range = snapshotParts([PART_IDS.POWER_RANGE])[0]!;

  it('dedupes repeated parts across creature powers', () => {
    const creature = {
      ...initialState,
      powers: [
        {
          id: 'p1',
          name: 'A',
          energy: 1,
          action: 'Action',
          duration: '-',
          range: '6',
          area: '-',
          damage: '-',
          parts: [{ id: Number(range.id), name: range.name, op_1_lvl: 0 }],
        },
        {
          id: 'p2',
          name: 'B',
          energy: 1,
          action: 'Action',
          duration: '-',
          range: '12',
          area: '-',
          damage: '-',
          parts: [{ id: Number(range.id), name: range.name, op_1_lvl: 1 }],
        },
      ],
    };
    const spent = computeCreatureTrainingSpent(creature, { powerPartsDb: [range] });
    const baseOnly = computeCreatureTrainingSpent(
      {
        ...initialState,
        powers: [
          {
            id: 'only',
            name: 'Only',
            energy: 1,
            action: 'Action',
            duration: '-',
            range: '3',
            area: '-',
            damage: '-',
            parts: [{ id: Number(range.id), name: range.name, op_1_lvl: 0 }],
          },
        ],
      },
      { powerPartsDb: [range] },
    );
    // Option level 1 at 0.5 TP is not whole, so the shared option is level 2.
    // The base is still paid once: two copies of the base-only power match one.
    expect(range.op_1_tp).toBe(0.5);
    expect(spent).toBe(2);
    expect(baseOnly).toBe(1);
    const doubledBase = computeCreatureTrainingSpent(
      {
        ...initialState,
        powers: [
          {
            id: 'a',
            name: 'A',
            energy: 1,
            action: 'Action',
            duration: '-',
            range: '3',
            area: '-',
            damage: '-',
            parts: [{ id: Number(range.id), name: range.name, op_1_lvl: 0 }],
          },
          {
            id: 'b',
            name: 'B',
            energy: 1,
            action: 'Action',
            duration: '-',
            range: '3',
            area: '-',
            damage: '-',
            parts: [{ id: Number(range.id), name: range.name, op_1_lvl: 0 }],
          },
        ],
      },
      { powerPartsDb: [range] },
    );
    expect(doubledBase).toBe(baseOnly);
  });
});
