import { describe, expect, it } from 'vitest';
import {
  buildInventoryPatch,
  inventoryRowCasSnapshot,
  replaceEquipmentDirtyWithInventoryPatch,
} from './inventory-patch';

const HEALTH_ROW = '10000000-0000-4000-8000-000000000001';
const ENERGY_ROW = '20000000-0000-4000-8000-000000000002';

describe('inventory patch', () => {
  const baseline = {
    equipment: {
      items: [
        {
          inventoryRowId: HEALTH_ROW,
          id: 'health-potion',
          name: 'Health Potion',
          quantity: 1,
        },
        {
          inventoryRowId: ENERGY_ROW,
          id: 'energy-potion',
          name: 'Energy Potion',
          quantity: 1,
        },
      ],
    },
  };

  it('two-tab stale tab: only sends the row this tab edited (baseline from last save)', () => {
    const tabALocal = {
      equipment: {
        items: [
          {
            inventoryRowId: HEALTH_ROW,
            id: 'health-potion',
            name: 'Health Potion',
            quantity: 3,
          },
          {
            inventoryRowId: ENERGY_ROW,
            id: 'energy-potion',
            name: 'Energy Potion',
            quantity: 1,
          },
        ],
      },
    };
    const patch = buildInventoryPatch(baseline.equipment, tabALocal.equipment);
    expect(patch.ops).toHaveLength(1);
    expect(patch.ops[0]).toMatchObject({
      op: 'update',
      inventoryRowId: HEALTH_ROW,
      expected: inventoryRowCasSnapshot(baseline.equipment.items[0]!),
    });
  });

  it('sends full expected snapshot on update', () => {
    const tabA = {
      equipment: {
        items: [
          {
            inventoryRowId: HEALTH_ROW,
            id: 'health-potion',
            name: 'Health Potion',
            quantity: 3,
            equipped: true,
          },
          {
            inventoryRowId: ENERGY_ROW,
            id: 'energy-potion',
            name: 'Energy Potion',
            quantity: 1,
          },
        ],
      },
    };
    const patch = buildInventoryPatch(baseline.equipment, tabA.equipment);
    expect(patch.ops[0]).toEqual({
      op: 'update',
      bucket: 'items',
      inventoryRowId: HEALTH_ROW,
      expected: inventoryRowCasSnapshot(baseline.equipment.items[0]!),
      item: {
        id: 'health-potion',
        name: 'Health Potion',
        quantity: 3,
        equipped: true,
      },
    });
  });

  it('replaces full equipment dirty payload with inventoryPatch on save', () => {
    const cleaned: Record<string, unknown> = {
      equipment: {
        items: [
          {
            inventoryRowId: HEALTH_ROW,
            id: 'health-potion',
            name: 'Health Potion',
            quantity: 3,
          },
          {
            inventoryRowId: ENERGY_ROW,
            id: 'energy-potion',
            name: 'Energy Potion',
            quantity: 2,
          },
        ],
      },
    };
    replaceEquipmentDirtyWithInventoryPatch(cleaned, baseline);
    expect(cleaned).not.toHaveProperty('equipment');
    const ops = (cleaned.inventoryPatch as { ops: unknown[] }).ops;
    expect(ops).toHaveLength(2);
  });
});