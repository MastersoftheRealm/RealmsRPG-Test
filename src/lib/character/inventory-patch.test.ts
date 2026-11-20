import { describe, expect, it } from 'vitest';
import { cleanForSave } from '@/lib/data-enrichment/clean-for-save';
import {
  buildInventoryPatch,
  inventoryRowCasSnapshot,
  mergeInventoryCreatedRows,
  mirrorInventoryRowIdsOntoSheetEquipment,
  prepareInventoryPatchForAutosave,
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
      expected: inventoryRowCasSnapshot(baseline.equipment.items[0]!, 'items'),
    });
  });

  it('quantity decrease to 1 still sends quantity on the update item', () => {
    const before = {
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
    const after = {
      equipment: {
        items: [
          {
            inventoryRowId: HEALTH_ROW,
            id: 'health-potion',
            name: 'Health Potion',
            quantity: 1,
          },
        ],
      },
    };
    const patch = buildInventoryPatch(before.equipment, after.equipment);
    expect(patch.ops[0]).toMatchObject({
      op: 'update',
      item: { quantity: 1 },
    });
  });

  it('CAS snapshot mirrors relational custom_type on the sheet row', () => {
    expect(
      inventoryRowCasSnapshot(
        {
          id: 'lib-bed-roll',
          name: 'Bed Roll',
          type: 'equipment',
        },
        'items',
      ).type,
    ).toBe('equipment');
    expect(
      inventoryRowCasSnapshot({ id: 'lib-knife', name: 'Knife', type: 'weapon' }, 'weapons').type,
    ).toBe('');
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
      expected: inventoryRowCasSnapshot(baseline.equipment.items[0]!, 'items'),
      item: {
        id: 'health-potion',
        name: 'Health Potion',
        quantity: 3,
        equipped: true,
      },
    });
  });

  it('emits add op when a new item has no inventoryRowId yet', () => {
    const tabA = {
      equipment: {
        items: [
          {
            inventoryRowId: HEALTH_ROW,
            id: 'health-potion',
            name: 'Health Potion',
            quantity: 1,
          },
          {
            id: 'grapple-rope',
            name: 'Grapple Rope',
            quantity: 1,
          },
        ],
      },
    };
    const patch = buildInventoryPatch(baseline.equipment, tabA.equipment);
    expect(patch.ops).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          op: 'add',
          bucket: 'items',
          item: { id: 'grapple-rope', name: 'Grapple Rope', equipped: false, quantity: 1 },
          position: 2,
        }),
      ]),
    );
    const addOp = patch.ops.find((op) => op.op === 'add');
    expect(addOp && 'inventoryRowId' in addOp && addOp.inventoryRowId).toBeTruthy();
  });

  it('remove and reorder ops include expected snapshots', () => {
    const withExtra = {
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
          {
            inventoryRowId: '30000000-0000-4000-8000-000000000003',
            id: 'rope',
            name: 'Rope',
            quantity: 1,
          },
        ],
      },
    };
    const removed = {
      equipment: { items: [baseline.equipment.items[0]!] },
    };
    const removePatch = buildInventoryPatch(withExtra.equipment, removed.equipment);
    expect(removePatch.ops).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          op: 'remove',
          inventoryRowId: ENERGY_ROW,
        }),
        expect.objectContaining({
          op: 'remove',
          inventoryRowId: '30000000-0000-4000-8000-000000000003',
        }),
      ]),
    );

    const reordered = {
      equipment: {
        items: [withExtra.equipment.items[2]!, withExtra.equipment.items[0]!],
      },
    };
    const reorderPatch = buildInventoryPatch(withExtra.equipment, reordered.equipment);
    expect(reorderPatch.ops).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ op: 'reorder', inventoryRowId: HEALTH_ROW, position: 2 }),
        expect.objectContaining({
          op: 'reorder',
          inventoryRowId: '30000000-0000-4000-8000-000000000003',
          position: 1,
        }),
      ]),
    );
  });

  it('library weapon with UI type matches baseline without type — no spurious ops', () => {
    const rowId = '40000000-0000-4000-8000-000000000004';
    const baseline = {
      weapons: [
        {
          inventoryRowId: rowId,
          id: 'lib-knife',
          name: 'Knife',
          quantity: 1,
        },
      ],
    };
    const afterAddUiType = {
      weapons: [
        {
          inventoryRowId: rowId,
          id: 'lib-knife',
          name: 'Knife',
          type: 'weapon',
          quantity: 1,
        },
      ],
    };
    expect(buildInventoryPatch(baseline, afterAddUiType).ops).toHaveLength(0);
  });

  it('library weapon qty edit does not send UI bucket type', () => {
    const rowId = '40000000-0000-4000-8000-000000000004';
    const baseline = {
      weapons: [
        {
          inventoryRowId: rowId,
          id: 'lib-knife',
          name: 'Knife',
          quantity: 1,
        },
      ],
    };
    const afterQty = {
      weapons: [
        {
          inventoryRowId: rowId,
          id: 'lib-knife',
          name: 'Knife',
          type: 'weapon',
          quantity: 2,
        },
      ],
    };
    const patch = buildInventoryPatch(baseline, afterQty);
    expect(patch.ops).toHaveLength(1);
    expect(patch.ops[0]).toMatchObject({ op: 'update', item: { quantity: 2 } });
    expect((patch.ops[0] as { item: Record<string, unknown> }).item).not.toHaveProperty('type');
  });

  it('new library weapon row omits UI bucket type from add patch item', () => {
    const patch = buildInventoryPatch(
      { weapons: [] },
      {
        weapons: [{ id: 'lib-knife', name: 'Knife', type: 'weapon', quantity: 1 }],
      },
    );
    const addOp = patch.ops.find((op) => op.op === 'add');
    expect(addOp).toBeDefined();
    expect(addOp).toMatchObject({
      bucket: 'weapons',
      item: { id: 'lib-knife', name: 'Knife', quantity: 1, equipped: false },
    });
    expect((addOp as { item: Record<string, unknown> }).item).not.toHaveProperty('type');
  });

  it('codex equipment type is still sent when it differs from weapons bucket label', () => {
    const patch = buildInventoryPatch(
      { weapons: [] },
      {
        weapons: [
          { id: 'lib-bed-roll', name: 'Bed Roll', type: 'equipment', quantity: 1 },
        ],
      },
    );
    const addOp = patch.ops.find((op) => op.op === 'add');
    expect(addOp).toMatchObject({
      item: expect.objectContaining({ type: 'equipment' }),
    });
  });

  it('clearing type sends null in patch item', () => {
    const before = {
      equipment: {
        items: [
          {
            inventoryRowId: HEALTH_ROW,
            id: 'custom-potion',
            name: 'Health Potion',
            quantity: 1,
            type: 'consumable',
          },
        ],
      },
    };
    const after = {
      equipment: {
        items: [
          {
            inventoryRowId: HEALTH_ROW,
            id: 'custom-potion',
            name: 'Health Potion',
            quantity: 1,
            type: '',
          },
        ],
      },
    };
    const patch = buildInventoryPatch(before.equipment, after.equipment);
    expect(patch.ops[0]).toMatchObject({
      op: 'update',
      item: { type: null },
    });
  });

  it('mirrors provisional inventoryRowId from cleaned save onto sheet equipment', () => {
    const baseline = {
      equipment: {
        items: [
          {
            inventoryRowId: HEALTH_ROW,
            id: 'health-potion',
            name: 'Health Potion',
            quantity: 1,
          },
        ],
      },
    };
    const sheet = {
      equipment: {
        items: [
          {
            inventoryRowId: HEALTH_ROW,
            id: 'health-potion',
            name: 'Health Potion',
            quantity: 1,
          },
          { id: 'custom-rope', name: 'Rope', quantity: 1 },
        ],
      },
    };
    const cleaned = cleanForSave(sheet as never) as Record<string, unknown>;
    prepareInventoryPatchForAutosave(baseline, cleaned);
    const mirrored = mirrorInventoryRowIdsOntoSheetEquipment(
      sheet.equipment,
      cleaned.equipment,
    ) as { items: Array<{ inventoryRowId?: string; name?: string }> };
    const rope = mirrored.items.find((row) => row.name === 'Rope');
    const cleanedRope = (
      cleaned.equipment as { items: Array<{ inventoryRowId?: string; name?: string }> }
    ).items.find((row) => row.name === 'Rope');
    expect(cleanedRope?.inventoryRowId).toBeTruthy();
    expect(rope?.inventoryRowId).toBe(cleanedRope?.inventoryRowId);
  });

  it('cleanForSave keeps inventoryRowId so CAS updates target the same row', () => {
    const loaded = {
      equipment: {
        items: [
          {
            inventoryRowId: HEALTH_ROW,
            id: 'health-potion',
            name: 'Health Potion',
            quantity: 1,
          },
        ],
      },
    };
    const edited = {
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
    const baseline = cleanForSave(loaded as never) as Record<string, unknown>;
    const dirty = cleanForSave(edited as never) as Record<string, unknown>;
    replaceEquipmentDirtyWithInventoryPatch(dirty, baseline);
    const ops = (dirty.inventoryPatch as { ops: unknown[] }).ops;
    expect(ops).toEqual([expect.objectContaining({ op: 'update', inventoryRowId: HEALTH_ROW })]);
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

describe('mergeInventoryCreatedRows', () => {
  const PROVISIONAL = '90000000-0000-4000-8000-000000000099';

  it('stamps row id by client provisional inventoryRowId, not server position', () => {
    const equipment = {
      weapons: [
        { id: 'w-new', name: 'Dagger', inventoryRowId: PROVISIONAL },
        { id: 'w-old', name: 'Sword' },
      ],
      shields: [],
      armor: [],
      items: [],
      accessories: [],
    };
    const merged = mergeInventoryCreatedRows(equipment, [
      {
        inventoryRowId: PROVISIONAL,
        bucket: 'weapons',
        position: 2,
      },
    ]) as typeof equipment;
    expect(merged.weapons[0]?.inventoryRowId).toBe(PROVISIONAL);
    expect(merged.weapons[1]?.inventoryRowId).toBeUndefined();
  });
});
