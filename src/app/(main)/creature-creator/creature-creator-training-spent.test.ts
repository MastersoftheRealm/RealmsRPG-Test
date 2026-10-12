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
          parts: [{ id: String(range.id), name: range.name, op_1_lvl: 0 }],
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
          parts: [{ id: String(range.id), name: range.name, op_1_lvl: 1 }],
        },
      ],
    };
    const spent = computeCreatureTrainingSpent(creature, { powerPartsDb: [range] });
    expect(spent).toBe(1);
  });
});
