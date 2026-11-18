import { describe, expect, it } from 'vitest';
import { buildInventoryPatch, replaceEquipmentDirtyWithInventoryPatch } from './inventory-patch';

describe('inventory patch (86e3juw0a)', () => {
  const baseline = {
    equipment: {
      items: [
        { id: 'health-potion', name: 'Health Potion', quantity: 1 },
        { id: 'energy-potion', name: 'Energy Potion', quantity: 1 },
      ],
    },
  };

  it('two-tab stale tab: only sends the row this tab edited (baseline from last save)', () => {
    const tabABaseline = baseline;
    const tabALocal = {
      equipment: {
        items: [
          { id: 'health-potion', name: 'Health Potion', quantity: 3 },
          { id: 'energy-potion', name: 'Energy Potion', quantity: 1 },
        ],
      },
    };
    const patch = buildInventoryPatch(tabABaseline.equipment, tabALocal.equipment);
    expect(patch.ops).toHaveLength(1);
    expect(patch.ops[0]).toMatchObject({ id: 'health-potion', expectedQuantity: 1 });
  });

  it('builds only the changed row when another item quantity changes on another tab', () => {
    const tabA = {
      equipment: {
        items: [
          { id: 'health-potion', name: 'Health Potion', quantity: 3 },
          { id: 'energy-potion', name: 'Energy Potion', quantity: 1 },
        ],
      },
    };
    const patch = buildInventoryPatch(baseline.equipment, tabA.equipment);
    expect(patch.ops).toEqual([
      {
        op: 'update',
        bucket: 'items',
        id: 'health-potion',
        expectedQuantity: 1,
        item: { id: 'health-potion', name: 'Health Potion', quantity: 3 },
      },
    ]);
  });

  it('replaces full equipment dirty payload with inventoryPatch on save', () => {
    const cleaned: Record<string, unknown> = {
      equipment: {
        items: [
          { id: 'health-potion', name: 'Health Potion', quantity: 3 },
          { id: 'energy-potion', name: 'Energy Potion', quantity: 2 },
        ],
      },
    };
    const stored = {
      equipment: {
        items: [
          { id: 'health-potion', name: 'Health Potion', quantity: 1 },
          { id: 'energy-potion', name: 'Energy Potion', quantity: 1 },
        ],
      },
    };
    replaceEquipmentDirtyWithInventoryPatch(cleaned, stored);
    expect(cleaned).not.toHaveProperty('equipment');
    expect(cleaned.inventoryPatch).toEqual({
      ops: [
        {
          op: 'update',
          bucket: 'items',
          id: 'health-potion',
          expectedQuantity: 1,
          item: { id: 'health-potion', name: 'Health Potion', quantity: 3 },
        },
        {
          op: 'update',
          bucket: 'items',
          id: 'energy-potion',
          expectedQuantity: 1,
          item: { id: 'energy-potion', name: 'Energy Potion', quantity: 2 },
        },
      ],
    });
  });

  it('uses name: keys for custom rows without id when the name is unique', () => {
    const patch = buildInventoryPatch(
      { items: [{ name: 'Rope', quantity: 1 }] },
      { items: [{ name: 'Rope', quantity: 2 }] },
    );
    expect(patch.ops[0]).toMatchObject({
      op: 'update',
      id: 'name:Rope',
      expectedQuantity: 1,
    });
  });

  it('covers add, remove, and reorder ops', () => {
    const from = {
      items: [
        { id: 'a', quantity: 1 },
        { id: 'b', quantity: 2 },
      ],
    };
    const to = {
      items: [
        { id: 'b', quantity: 2 },
        { id: 'c', quantity: 1 },
      ],
    };
    const patch = buildInventoryPatch(from, to);
    const ops = patch.ops.map((op) => op.op);
    expect(ops).toContain('remove');
    expect(ops).toContain('add');
    expect(ops).toContain('reorder');
  });
});
