import { describe, expect, it } from 'vitest';
import { advanceAutosaveBaselineFromSaveResult } from './autosave-baseline';

const HEALTH_ROW = '10000000-0000-4000-8000-000000000001';

describe('advanceAutosaveBaselineFromSaveResult', () => {
  it('replays inventoryPatch when baseline has no equipment object yet (library-only advance)', () => {
    const next = advanceAutosaveBaselineFromSaveResult(null, {
      applied: {
        inventoryPatch: {
          ops: [
            {
              op: 'add',
              bucket: 'weapons',
              inventoryRowId: '20000000-0000-4000-8000-000000000002',
              item: { id: 'lib-knife', name: 'Knife', quantity: 1, equipped: false },
              position: 1,
            },
          ],
        },
      },
    });
    const weapons = (next.equipment as { weapons: unknown[] }).weapons;
    expect(weapons).toHaveLength(1);
  });

  it('replays inventoryPatch onto baseline equipment after a successful save', () => {
    const baseline = {
      equipment: {
        items: [
          {
            inventoryRowId: HEALTH_ROW,
            id: 'health-potion',
            name: 'Health Potion',
            quantity: 2,
          },
        ],
      },
    };

    const next = advanceAutosaveBaselineFromSaveResult(baseline, {
      applied: {
        inventoryPatch: {
          ops: [
            {
              op: 'update',
              bucket: 'items',
              inventoryRowId: HEALTH_ROW,
              expected: {
                quantity: 2,
                equipped: false,
                name: 'Health Potion',
                type: '',
                description: '',
                cost: null,
              },
              item: {
                id: 'health-potion',
                name: 'Health Potion',
                quantity: 1,
                equipped: false,
              },
            },
          ],
        },
      },
      updatedAt: '2026-01-02T00:00:00.000Z',
    });

    const items = (next.equipment as { items: Array<{ quantity?: number }> }).items;
    expect(items[0]?.quantity).toBe(1);
    expect(next).not.toHaveProperty('inventoryPatch');
  });
});
