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
      enablePowers: true,
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
        enablePowers: true,
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
        enablePowers: true,
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

  it('hidden Powers, Techniques, and Inventory do not spend TP (86e3jx639)', () => {
    const power = {
      id: 'p1',
      name: 'A',
      energy: 1,
      action: 'Action',
      duration: '-',
      range: '6',
      area: '-',
      damage: '-',
      tp: 4,
      parts: [{ id: Number(range.id), name: range.name, op_1_lvl: 0 }],
    };
    const hidden = computeCreatureTrainingSpent(
      { ...initialState, enablePowers: false, powers: [power] },
      { powerPartsDb: [range] },
    );
    const shown = computeCreatureTrainingSpent(
      { ...initialState, enablePowers: true, powers: [power] },
      { powerPartsDb: [range] },
    );
    expect(hidden).toBe(0);
    expect(shown).toBeGreaterThan(0);

    const legacyHidden = computeCreatureTrainingSpent({
      ...initialState,
      enableTechniques: false,
      techniques: [
        {
          id: 't1',
          name: 'Strike',
          energy: 1,
          tp: 3,
          action: 'Action',
          weapon: '-',
          damage: '1',
        },
      ],
    });
    expect(legacyHidden).toBe(0);
  });

  it('falls back to stored tp when listed parts are missing from codex (1dfe8wf3xet)', () => {
    const creature = {
      ...initialState,
      enablePowers: true,
      powers: [
        {
          id: 'p1',
          name: 'A',
          energy: 1,
          action: 'Action',
          duration: '-',
          range: '-',
          area: '-',
          damage: '-',
          tp: 7,
          parts: [{ id: 999999, name: 'Missing', op_1_lvl: 0 }],
        },
      ],
    };
    const spentWithDb = computeCreatureTrainingSpent(creature, {
      powerPartsDb: [range],
    });
    const spentLegacy = computeCreatureTrainingSpent(creature, { powerPartsDb: [] });
    expect(spentWithDb).toBe(7);
    expect(spentLegacy).toBe(7);
  });

  it('uses stored tp when one listed part is missing beside a resolvable part (1dfe8wf3xet)', () => {
    const durationMinute = snapshotParts([PART_IDS.DURATION_MINUTE])[0]!;
    const creature = {
      ...initialState,
      enablePowers: true,
      powers: [
        {
          id: 'p1',
          name: 'A',
          energy: 1,
          action: 'Action',
          duration: '-',
          range: '-',
          area: '-',
          damage: '-',
          tp: 7,
          parts: [
            { id: 999999, name: 'Missing', op_1_lvl: 0 },
            { id: Number(durationMinute.id), name: durationMinute.name, op_1_lvl: 0 },
          ],
        },
      ],
    };
    expect(computeCreatureTrainingSpent(creature, { powerPartsDb: [range, durationMinute] })).toBe(
      7,
    );
  });

  it('does not mix live range with stored tp when a listed part is missing (1dfe8wf3xet)', () => {
    const creatureWithRangePart = {
      ...initialState,
      enablePowers: true,
      powers: [
        {
          id: 'p1',
          name: 'A',
          energy: 1,
          action: 'Action',
          duration: '-',
          range: '-',
          area: '-',
          damage: '-',
          tp: 7,
          parts: [
            { id: 999999, name: 'Missing', op_1_lvl: 0 },
            { id: Number(range.id), name: range.name, op_1_lvl: 0 },
          ],
        },
      ],
    };
    expect(computeCreatureTrainingSpent(creatureWithRangePart, { powerPartsDb: [range] })).toBe(7);

    const creatureWithRangeField = {
      ...initialState,
      enablePowers: true,
      powers: [
        {
          id: 'p2',
          name: 'B',
          energy: 1,
          action: 'Action',
          duration: '-',
          range: '1',
          area: '-',
          damage: '-',
          tp: 7,
          actionType: 'basic',
          rangeValue: { steps: 1 },
          parts: [{ id: 999999, name: 'Missing', op_1_lvl: 0 }],
        },
      ],
    };
    expect(computeCreatureTrainingSpent(creatureWithRangeField, { powerPartsDb: [range] })).toBe(7);
  });

  it('uses stored tp for choice composition when a listed part is missing (1dfe8wf3xet)', () => {
    const durationMinute = snapshotParts([PART_IDS.DURATION_MINUTE])[0]!;
    const creature = {
      ...initialState,
      enablePowers: true,
      powers: [
        {
          id: 'p1',
          name: 'A',
          energy: 1,
          action: 'Action',
          duration: '-',
          range: '-',
          area: '-',
          damage: '-',
          tp: 7,
          actionType: 'basic',
          durationValue: { type: 'minutes', value: 1 },
          parts: [{ id: 999999, name: 'Missing', op_1_lvl: 0 }],
          composition: {
            structure: 'choice' as const,
            variants: [{ id: 'a', label: 'A' }],
          },
        },
      ],
    };
    expect(computeCreatureTrainingSpent(creature, { powerPartsDb: [durationMinute, range] })).toBe(
      7,
    );
  });

  it('uses stored tp for technique when one listed part is missing (1dfe8wf3xet)', () => {
    const zeroTpPart = {
      id: 888001,
      name: 'Zero TP',
      base_tp: 0,
      op_1_tp: 0,
    };
    const creature = {
      ...initialState,
      enableTechniques: true,
      techniques: [
        {
          id: 't1',
          name: 'Strike',
          energy: 1,
          tp: 7,
          action: 'Action',
          weapon: '-',
          damage: '1',
          parts: [
            { id: 999999, name: 'Missing', op_1_lvl: 0 },
            { id: 888001, name: 'Zero TP', op_1_lvl: 0 },
          ],
        },
      ],
    };
    expect(computeCreatureTrainingSpent(creature, { techniquePartsDb: [zeroTpPart] })).toBe(7);
  });

  it('still adds live spend for a second power whose parts all resolve (1dfe8wf3xet)', () => {
    const creature = {
      ...initialState,
      enablePowers: true,
      powers: [
        {
          id: 'broken',
          name: 'Broken',
          energy: 1,
          action: 'Action',
          duration: '-',
          range: '-',
          area: '-',
          damage: '-',
          tp: 7,
          parts: [{ id: 999999, name: 'Missing', op_1_lvl: 0 }],
        },
        {
          id: 'good',
          name: 'Good',
          energy: 1,
          action: 'Action',
          duration: '-',
          range: '-',
          area: '-',
          damage: '-',
          tp: 99,
          parts: [{ id: Number(range.id), name: range.name, op_1_lvl: 0 }],
        },
      ],
    };
    const spent = computeCreatureTrainingSpent(creature, { powerPartsDb: [range] });
    expect(spent).toBe(8);
  });

  it('still prices from live codex when parts resolve (1dfe8wf3xet)', () => {
    const creature = {
      ...initialState,
      enablePowers: true,
      powers: [
        {
          id: 'p1',
          name: 'A',
          energy: 1,
          action: 'Action',
          duration: '-',
          range: '-',
          area: '-',
          damage: '-',
          tp: 99,
          parts: [{ id: Number(range.id), name: range.name, op_1_lvl: 0 }],
        },
      ],
    };
    const spent = computeCreatureTrainingSpent(creature, { powerPartsDb: [range] });
    expect(spent).toBeGreaterThan(0);
    expect(spent).toBeLessThan(99);
  });
});
