/**
 * Item-level inventory patch for relational CAS saves (86e3juw0a).
 * Leaf module — no UI imports.
 */

import { matchesSheetEquipmentItem } from '@/lib/character/sheet-equipment-match';

export const INVENTORY_PATCH_BUCKETS = [
  'weapons',
  'shields',
  'armor',
  'items',
  'accessories',
  'mainHand',
  'offHand',
] as const;

export type InventoryPatchBucket = (typeof INVENTORY_PATCH_BUCKETS)[number];

export type InventoryPatchOp =
  | {
      op: 'add';
      bucket: InventoryPatchBucket;
      item: Record<string, unknown>;
      position?: number | undefined;
    }
  | {
      op: 'update';
      bucket: InventoryPatchBucket;
      id: string;
      expectedQuantity: number;
      item: Record<string, unknown>;
    }
  | {
      op: 'remove';
      bucket: InventoryPatchBucket;
      id: string;
      expectedQuantity: number;
    }
  | {
      op: 'reorder';
      bucket: InventoryPatchBucket;
      id: string;
      expectedQuantity: number;
      position: number;
    };

export type InventoryPatchPayload = { ops: InventoryPatchOp[] };

type SheetEquipmentRow = { id?: string | number | undefined; name?: string | undefined };

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

export function inventoryRowIdentity(row: Record<string, unknown>): string | null {
  const id = row.id;
  if (typeof id === 'string' && id.trim()) return id.trim();
  if (typeof id === 'number' && Number.isFinite(id)) return String(id);
  const name = row.name;
  if (typeof name === 'string' && name.trim()) return `name:${name.trim()}`;
  return null;
}

function rowQuantity(row: Record<string, unknown>): number {
  const q = row.quantity;
  if (typeof q === 'number' && Number.isFinite(q)) return q;
  return 1;
}

function leanRowForPatchOp(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (row.id !== undefined) out.id = row.id;
  if (row.name !== undefined) out.name = row.name;
  if (row.equipped) out.equipped = true;
  const q = rowQuantity(row);
  if (q !== 1) out.quantity = q;
  if (typeof row.type === 'string' && row.type) out.type = row.type;
  if (typeof row.description === 'string' && row.description.trim()) {
    out.description = row.description.trim();
  }
  if (typeof row.cost === 'number' && Number.isFinite(row.cost)) out.cost = row.cost;
  return out;
}

function rowsEqual(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  return JSON.stringify(leanRowForPatchOp(a)) === JSON.stringify(leanRowForPatchOp(b));
}

function findRowIndex(rows: Record<string, unknown>[], identity: string): number {
  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    if (!row) continue;
    if (inventoryRowIdentity(row) === identity) return idx;
    const itemId = identity.startsWith('name:') ? identity.slice(5) : identity;
    if (matchesSheetEquipmentItem(row as SheetEquipmentRow, itemId, idx)) return idx;
  }
  return -1;
}

/**
 * Build item-level ops from autosave baseline → current equipment.
 * Custom rows without `id` use `name:<name>` only when that name is unique in the bucket;
 * otherwise the whole bucket is replaced with remove+add ops (server rejects ambiguous ids).
 */
export function buildInventoryPatch(
  baselineEquipment: unknown,
  currentEquipment: unknown,
): InventoryPatchPayload {
  const ops: InventoryPatchOp[] = [];

  for (const bucket of INVENTORY_PATCH_BUCKETS) {
    const before = readEquipmentBucket(baselineEquipment, bucket);
    const after = readEquipmentBucket(currentEquipment, bucket);

    const beforeIds = before.map((row) => inventoryRowIdentity(row)).filter(Boolean) as string[];
    const nameOnly = beforeIds.filter((id) => id.startsWith('name:'));
    const dupNames = new Set(
      nameOnly.filter((name, _i, arr) => arr.filter((n) => n === name).length > 1),
    );
    const ambiguousBucket =
      dupNames.size > 0 ||
      new Set(beforeIds).size !== beforeIds.length ||
      new Set(after.map((r) => inventoryRowIdentity(r)).filter(Boolean)).size !==
        after.filter((r) => inventoryRowIdentity(r)).length;

    if (ambiguousBucket) {
      for (const row of before) {
        const id = inventoryRowIdentity(row);
        if (!id) continue;
        ops.push({ op: 'remove', bucket, id, expectedQuantity: rowQuantity(row) });
      }
      for (let position = 0; position < after.length; position++) {
        const row = after[position]!;
        const id = inventoryRowIdentity(row);
        if (!id) continue;
        ops.push({
          op: 'add',
          bucket,
          item: leanRowForPatchOp(row),
          position: position + 1,
        });
      }
      continue;
    }

    const beforeMap = new Map<string, Record<string, unknown>>();
    for (const row of before) {
      const id = inventoryRowIdentity(row);
      if (id) beforeMap.set(id, row);
    }
    const afterMap = new Map<string, Record<string, unknown>>();
    for (const row of after) {
      const id = inventoryRowIdentity(row);
      if (id) afterMap.set(id, row);
    }

    for (const [id, row] of beforeMap) {
      if (!afterMap.has(id)) {
        ops.push({ op: 'remove', bucket, id, expectedQuantity: rowQuantity(row) });
      }
    }

    for (const [id, row] of afterMap) {
      const prev = beforeMap.get(id);
      if (!prev) {
        ops.push({
          op: 'add',
          bucket,
          item: leanRowForPatchOp(row),
          position: findRowIndex(after, id) + 1 || undefined,
        });
        continue;
      }
      if (!rowsEqual(prev, row)) {
        ops.push({
          op: 'update',
          bucket,
          id,
          expectedQuantity: rowQuantity(prev),
          item: leanRowForPatchOp(row),
        });
      }
    }

    const orderBefore = before.map((row) => inventoryRowIdentity(row)).filter(Boolean) as string[];
    const orderAfter = after.map((row) => inventoryRowIdentity(row)).filter(Boolean) as string[];
    if (orderBefore.join('|') !== orderAfter.join('|')) {
      for (let position = 0; position < orderAfter.length; position++) {
        const id = orderAfter[position]!;
        const prev = beforeMap.get(id);
        if (!prev) continue;
        const prevIndex = orderBefore.indexOf(id);
        if (prevIndex === position) continue;
        ops.push({
          op: 'reorder',
          bucket,
          id,
          expectedQuantity: rowQuantity(prev),
          position: position + 1,
        });
      }
    }
  }

  return { ops };
}

/** When equipment is dirty, replace the full blob with an incremental inventory patch. */
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

/** Prefer existing inventoryPatch; otherwise translate equipment using the save baseline snapshot. */
export function attachRelationalInventoryPatchToDirty(
  dirty: Record<string, unknown>,
  saveBaseline: Record<string, unknown>,
): void {
  if (dirty.inventoryPatch !== undefined) return;
  replaceEquipmentDirtyWithInventoryPatch(dirty, saveBaseline);
}
