/**
 * In-memory inventory CAS mock for unit/hook tests — mirrors `inventory_row_cas_snapshot` checks.
 */

import { ApiError } from '@/lib/api-client';
import {
  inventoryCasExpectedMatchesRow,
  type InventoryPatchBucket,
  type InventoryPatchPayload,
} from './inventory-patch';

export type InventoryCasMockRow = Record<string, unknown> & {
  inventoryRowId: string;
  bucket: InventoryPatchBucket;
};

function readBucket(
  equipment: Record<string, unknown>,
  bucket: InventoryPatchBucket,
): Record<string, unknown>[] {
  if (bucket === 'armor') {
    const raw = equipment.armor;
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) return [raw as Record<string, unknown>];
    return [];
  }
  const raw = equipment[bucket];
  return Array.isArray(raw) ? (raw as Record<string, unknown>[]) : [];
}

function writeBucket(
  equipment: Record<string, unknown>,
  bucket: InventoryPatchBucket,
  rows: Record<string, unknown>[],
): void {
  if (bucket === 'armor') {
    equipment.armor = rows[0] ?? null;
  } else {
    equipment[bucket] = rows;
  }
}

/** Minimal server that rejects patches when `expected` disagrees with `inventory_row_cas_snapshot`. */
export class InventoryCasMockServer {
  private readonly rows = new Map<string, InventoryCasMockRow>();

  constructor(seed: InventoryCasMockRow[]) {
    for (const row of seed) {
      this.rows.set(row.inventoryRowId, { ...row });
    }
  }

  getRow(inventoryRowId: string): InventoryCasMockRow | undefined {
    return this.rows.get(inventoryRowId);
  }

  applyPatchOrThrow(patch: InventoryPatchPayload): void {
    for (const op of patch.ops) {
      if (op.op === 'add') {
        const rowId = op.inventoryRowId ?? (typeof op.item.inventoryRowId === 'string' ? op.item.inventoryRowId : '');
        if (!rowId) continue;
        if (this.rows.has(rowId)) {
          throw new ApiError('inventory_cas_conflict', 409);
        }
        const row: InventoryCasMockRow = {
          ...op.item,
          inventoryRowId: rowId,
          bucket: op.bucket,
        };
        if (typeof op.item.cost === 'number' && Number.isFinite(op.item.cost)) {
          row.cost = op.item.cost;
        } else if (op.item.cost === null) {
          row.cost = null;
        } else if (String(op.item.id ?? '').startsWith('lib-')) {
          row.cost = 0;
        }
        this.rows.set(rowId, row);
        continue;
      }

      const row = this.rows.get(op.inventoryRowId);
      if (!row) {
        throw new ApiError('inventory_cas_conflict', 409);
      }
      if ('expected' in op && !inventoryCasExpectedMatchesRow(row, op.bucket, op.expected)) {
        throw new ApiError('inventory_cas_conflict', 409);
      }

      if (op.op === 'remove') {
        this.rows.delete(op.inventoryRowId);
        continue;
      }

      if (op.op === 'update') {
        const next: InventoryCasMockRow = {
          ...row,
          ...op.item,
          inventoryRowId: op.inventoryRowId,
          bucket: op.bucket,
        };
        if (Object.prototype.hasOwnProperty.call(op.item, 'cost')) {
          next.cost = op.item.cost ?? null;
        }
        if (Object.prototype.hasOwnProperty.call(op.item, 'quantity')) {
          next.quantity = op.item.quantity;
        }
        this.rows.set(op.inventoryRowId, next);
      }
    }
  }

  toEquipment(): Record<string, unknown> {
    const equipment: Record<string, unknown> = {
      weapons: [],
      shields: [],
      items: [],
      accessories: [],
      armor: null,
      mainHand: [],
      offHand: [],
    };
    for (const row of this.rows.values()) {
      const { bucket, ...rest } = row;
      const bucketRows = readBucket(equipment, bucket);
      bucketRows.push(rest);
      writeBucket(equipment, bucket, bucketRows);
    }
    return equipment;
  }
}