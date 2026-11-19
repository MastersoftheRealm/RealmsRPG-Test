/**
 * Item-level inventory patch for relational CAS saves.
 * Leaf module — no UI imports.
 */

const INVENTORY_PATCH_BUCKETS = [
  'weapons',
  'shields',
  'armor',
  'items',
  'accessories',
  'mainHand',
  'offHand',
] as const;

type InventoryPatchBucket = (typeof INVENTORY_PATCH_BUCKETS)[number];

export type InventoryCasSnapshot = {
  quantity: number;
  equipped: boolean;
  name: string;
  type: string;
  description: string;
  cost: number | null;
};

export type InventoryPatchOp =
  | {
      op: 'add';
      bucket: InventoryPatchBucket;
      inventoryRowId?: string | undefined;
      item: Record<string, unknown>;
      position?: number | undefined;
    }
  | {
      op: 'update';
      bucket: InventoryPatchBucket;
      inventoryRowId: string;
      expected: InventoryCasSnapshot;
      item: Record<string, unknown>;
    }
  | {
      op: 'remove';
      bucket: InventoryPatchBucket;
      inventoryRowId: string;
      expected: InventoryCasSnapshot;
    }
  | {
      op: 'reorder';
      bucket: InventoryPatchBucket;
      inventoryRowId: string;
      expected: InventoryCasSnapshot;
      position: number;
    };

export type InventoryPatchPayload = { ops: InventoryPatchOp[] };

function readEquipmentBucket(
  equipment: unknown,
  bucket: InventoryPatchBucket,
): Record<string, unknown>[] {
  if (!equipment || typeof equipment !== 'object') return [];
  const equip = equipment as Record<string, unknown>;
  const raw = equip[bucket];
  if (bucket === 'armor' && raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return [raw as Record<string, unknown>];
  }
  if (!Array.isArray(raw)) return [];
  return raw.filter((row): row is Record<string, unknown> => !!row && typeof row === 'object');
}

function readInventoryRowId(row: Record<string, unknown>): string | null {
  const raw = row.inventoryRowId;
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  return null;
}

function newInventoryRowId(): string {
  return globalThis.crypto.randomUUID();
}

function rowQuantity(row: Record<string, unknown>): number {
  const q = row.quantity;
  if (typeof q === 'number' && Number.isFinite(q)) return q;
  return 1;
}

export function inventoryRowCasSnapshot(row: Record<string, unknown>): InventoryCasSnapshot {
  const cost = row.cost;
  return {
    quantity: rowQuantity(row),
    equipped: row.equipped === true,
    name: typeof row.name === 'string' ? row.name : '',
    type: typeof row.type === 'string' ? row.type : '',
    description: typeof row.description === 'string' ? row.description : '',
    cost: typeof cost === 'number' && Number.isFinite(cost) ? cost : null,
  };
}

function leanRowForPatchOp(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (row.id !== undefined) out.id = row.id;
  if (row.name !== undefined) out.name = row.name;
  out.equipped = row.equipped === true;
  const q = rowQuantity(row);
  if (q !== 1) out.quantity = q;
  if (Object.prototype.hasOwnProperty.call(row, 'type')) {
    const type = row.type;
    out.type = typeof type === 'string' && type.length > 0 ? type : null;
  }
  if (Object.prototype.hasOwnProperty.call(row, 'description')) {
    const description = row.description;
    out.description =
      typeof description === 'string' && description.trim().length > 0 ? description.trim() : null;
  }
  if (Object.prototype.hasOwnProperty.call(row, 'cost')) {
    const cost = row.cost;
    out.cost = typeof cost === 'number' && Number.isFinite(cost) ? cost : null;
  }
  return out;
}

function rowsEqual(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  return (
    JSON.stringify(inventoryRowCasSnapshot(a)) === JSON.stringify(inventoryRowCasSnapshot(b))
  );
}

function orderRowIds(rows: Record<string, unknown>[]): string[] {
  return rows
    .map((row) => readInventoryRowId(row) ?? (row as { _provisionalRowId?: string })._provisionalRowId)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);
}

/**
 * Build item-level ops from autosave baseline → current equipment (requires inventoryRowId).
 */
export function buildInventoryPatch(
  baselineEquipment: unknown,
  currentEquipment: unknown,
): InventoryPatchPayload {
  const ops: InventoryPatchOp[] = [];
  const provisionalIds = new Map<Record<string, unknown>, string>();

  for (const bucket of INVENTORY_PATCH_BUCKETS) {
    const before = readEquipmentBucket(baselineEquipment, bucket);
    const after = readEquipmentBucket(currentEquipment, bucket);

    const beforeMap = new Map<string, Record<string, unknown>>();
    for (const row of before) {
      const rowId = readInventoryRowId(row);
      if (!rowId) continue;
      beforeMap.set(rowId, row);
    }

    for (const [rowId, row] of beforeMap) {
      if (!after.some((candidate) => readInventoryRowId(candidate) === rowId)) {
        ops.push({
          op: 'remove',
          bucket,
          inventoryRowId: rowId,
          expected: inventoryRowCasSnapshot(row),
        });
      }
    }

    for (let i = 0; i < after.length; i++) {
      const row = after[i]!;
      const existingId = readInventoryRowId(row);
      if (existingId) {
        const prev = beforeMap.get(existingId);
        if (!prev) {
          ops.push({
            op: 'add',
            bucket,
            inventoryRowId: existingId,
            item: leanRowForPatchOp(row),
            position: i + 1,
          });
        } else if (!rowsEqual(prev, row)) {
          ops.push({
            op: 'update',
            bucket,
            inventoryRowId: existingId,
            expected: inventoryRowCasSnapshot(prev),
            item: leanRowForPatchOp(row),
          });
        }
        continue;
      }

      const provisionalId = newInventoryRowId();
      provisionalIds.set(row, provisionalId);
      ops.push({
        op: 'add',
        bucket,
        inventoryRowId: provisionalId,
        item: leanRowForPatchOp(row),
        position: i + 1,
      });
    }

    const orderBefore = orderRowIds(before);
    const orderAfter = after.map((row) => {
      const id = readInventoryRowId(row);
      if (id) return id;
      return provisionalIds.get(row) ?? '';
    }).filter(Boolean);

    if (orderBefore.join('|') !== orderAfter.join('|')) {
      for (let position = 0; position < orderAfter.length; position++) {
        const rowId = orderAfter[position]!;
        const prev = beforeMap.get(rowId);
        if (!prev) continue;
        const prevIndex = orderBefore.indexOf(rowId);
        if (prevIndex === position) continue;
        ops.push({
          op: 'reorder',
          bucket,
          inventoryRowId: rowId,
          expected: inventoryRowCasSnapshot(prev),
          position: position + 1,
        });
      }
    }
  }

  return { ops };
}

export function replaceEquipmentDirtyWithInventoryPatch(
  cleaned: Record<string, unknown>,
  saveBaseline: Record<string, unknown>,
): void {
  if (!Object.prototype.hasOwnProperty.call(cleaned, 'equipment')) return;
  const patch = buildInventoryPatch(saveBaseline.equipment, cleaned.equipment);
  delete cleaned.equipment;
  if (patch.ops.length === 0) return;
  cleaned.inventoryPatch = patch;
}

export function attachRelationalInventoryPatchToDirty(
  dirty: Record<string, unknown>,
  saveBaseline: Record<string, unknown>,
): void {
  if (dirty.inventoryPatch !== undefined) return;
  replaceEquipmentDirtyWithInventoryPatch(dirty, saveBaseline);
}