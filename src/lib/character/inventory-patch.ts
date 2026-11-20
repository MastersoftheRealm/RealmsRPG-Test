/**
 * Item-level inventory patch for relational CAS saves.
 * Leaf module — no UI imports.
 */

import { matchesSheetEquipmentItem } from '@/lib/character/sheet-equipment-match';

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

function equipmentRowIdentityKey(row: Record<string, unknown>): string {
  const id = row.id != null ? String(row.id) : '';
  const name = typeof row.name === 'string' ? row.name : '';
  return `${id}\0${name}`;
}

function readInventoryRowId(row: Record<string, unknown>): string | null {
  const raw = row.inventoryRowId;
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  return null;
}

function newInventoryRowId(): string {
  return globalThis.crypto.randomUUID();
}

/** `cleanForSave` omits quantity 1; treat missing as 1 everywhere we diff or merge inventory qty. */
export function savedInventoryQuantity(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return 1;
}

function rowQuantity(row: Record<string, unknown>): number {
  return savedInventoryQuantity(row.quantity);
}

/** UI bucket labels are not stored in relational `custom_type` (prod codex rows use NULL). */
function isUiBucketInventoryType(
  type: string,
  bucket: InventoryPatchBucket,
): boolean {
  if (!type) return false;
  if (bucket === 'weapons') return type === 'weapon';
  if (bucket === 'armor') return type === 'armor';
  if (bucket === 'shields') return type === 'shield';
  return false;
}

/** Strip UI bucket `type` from sheet rows so baseline, patch ops, and CAS stay aligned. */
function normalizeInventoryRowForRelational(
  row: Record<string, unknown>,
  bucket: InventoryPatchBucket,
): Record<string, unknown> {
  const type = row.type;
  if (typeof type === 'string' && isUiBucketInventoryType(type, bucket)) {
    const next = { ...row };
    delete next.type;
    return next;
  }
  return row;
}

export function normalizeEquipmentForInventoryRelational(equipment: unknown): unknown {
  if (!equipment || typeof equipment !== 'object') return equipment;
  const equip = equipment as Record<string, unknown>;
  let changed = false;
  const next: Record<string, unknown> = { ...equip };

  const normalizeBucket = (bucket: InventoryPatchBucket, value: unknown): unknown => {
    if (bucket === 'armor') {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
      const row = value as Record<string, unknown>;
      const normalized = normalizeInventoryRowForRelational(row, bucket);
      if (normalized !== row) changed = true;
      return normalized;
    }
    if (!Array.isArray(value)) return value;
    const rows = value as Record<string, unknown>[];
    const normalizedRows = rows.map((row) => {
      const normalized = normalizeInventoryRowForRelational(row, bucket);
      if (normalized !== row) changed = true;
      return normalized;
    });
    return normalizedRows;
  };

  for (const bucket of INVENTORY_PATCH_BUCKETS) {
    if (!(bucket in equip)) continue;
    const normalized = normalizeBucket(bucket, equip[bucket]);
    if (normalized !== equip[bucket]) next[bucket] = normalized;
  }

  return changed ? next : equipment;
}

function relationalInventoryCasType(
  row: Record<string, unknown>,
  bucket: InventoryPatchBucket,
): string {
  const type = typeof row.type === 'string' ? row.type : '';
  if (isUiBucketInventoryType(type, bucket)) return '';
  return type;
}

export function inventoryRowCasSnapshot(
  row: Record<string, unknown>,
  bucket: InventoryPatchBucket,
): InventoryCasSnapshot {
  const cost = row.cost;
  return {
    quantity: rowQuantity(row),
    equipped: row.equipped === true,
    name: typeof row.name === 'string' ? row.name : '',
    type: relationalInventoryCasType(row, bucket),
    description: typeof row.description === 'string' ? row.description : '',
    cost: typeof cost === 'number' && Number.isFinite(cost) ? cost : null,
  };
}

function leanRowForPatchOp(
  row: Record<string, unknown>,
  bucket: InventoryPatchBucket,
): Record<string, unknown> {
  const normalized = normalizeInventoryRowForRelational(row, bucket);
  const out: Record<string, unknown> = {};
  if (normalized.id !== undefined) out.id = normalized.id;
  if (normalized.name !== undefined) out.name = normalized.name;
  out.equipped = normalized.equipped === true;
  out.quantity = rowQuantity(normalized);
  if (Object.prototype.hasOwnProperty.call(normalized, 'type')) {
    const type = normalized.type;
    out.type = typeof type === 'string' && type.length > 0 ? type : null;
  }
  if (Object.prototype.hasOwnProperty.call(normalized, 'description')) {
    const description = normalized.description;
    out.description =
      typeof description === 'string' && description.trim().length > 0 ? description.trim() : null;
  }
  if (Object.prototype.hasOwnProperty.call(normalized, 'cost')) {
    const cost = normalized.cost;
    out.cost = typeof cost === 'number' && Number.isFinite(cost) ? cost : null;
  }
  return out;
}

function rowsEqual(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  bucket: InventoryPatchBucket,
): boolean {
  return (
    JSON.stringify(inventoryRowCasSnapshot(a, bucket)) ===
    JSON.stringify(inventoryRowCasSnapshot(b, bucket))
  );
}

function orderRowIds(rows: Record<string, unknown>[]): string[] {
  return rows
    .map(
      (row) => readInventoryRowId(row) ?? (row as { _provisionalRowId?: string })._provisionalRowId,
    )
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
          expected: inventoryRowCasSnapshot(row, bucket),
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
            item: leanRowForPatchOp(row, bucket),
            position: i + 1,
          });
        } else if (!rowsEqual(prev, row, bucket)) {
          ops.push({
            op: 'update',
            bucket,
            inventoryRowId: existingId,
            expected: inventoryRowCasSnapshot(prev, bucket),
            item: leanRowForPatchOp(row, bucket),
          });
        }
        continue;
      }

      const provisionalId = newInventoryRowId();
      provisionalIds.set(row, provisionalId);
      row.inventoryRowId = provisionalId;
      ops.push({
        op: 'add',
        bucket,
        inventoryRowId: provisionalId,
        item: leanRowForPatchOp(row, bucket),
        position: i + 1,
      });
    }

    const orderBefore = orderRowIds(before);
    const orderAfter = after
      .map((row) => {
        const id = readInventoryRowId(row);
        if (id) return id;
        return provisionalIds.get(row) ?? '';
      })
      .filter(Boolean);

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
          expected: inventoryRowCasSnapshot(prev, bucket),
          position: position + 1,
        });
      }
    }
  }

  return { ops };
}

/**
 * `buildInventoryPatch` stamps provisional `inventoryRowId` on cleaned equipment rows only.
 * Mirror those ids onto live sheet equipment so post-save merge and the next baseline match.
 */
export function mirrorInventoryRowIdsOntoSheetEquipment(
  sheetEquipment: unknown,
  cleanedEquipment: unknown,
): unknown {
  if (!sheetEquipment || typeof sheetEquipment !== 'object') return sheetEquipment;
  if (!cleanedEquipment || typeof cleanedEquipment !== 'object') return sheetEquipment;
  const sheet = sheetEquipment as Record<string, unknown>;
  const cleaned = cleanedEquipment as Record<string, unknown>;
  let anyChanged = false;
  const nextSheet: Record<string, unknown> = { ...sheet };

  for (const bucket of INVENTORY_PATCH_BUCKETS) {
    const cleanedRows = readEquipmentBucket(cleaned, bucket);
    const sheetRows = readEquipmentBucket(sheet, bucket);
    if (cleanedRows.length === 0) continue;

    const nextRows = sheetRows.map((row) => ({ ...row }));
    let bucketChanged = false;

    for (const cleanRow of cleanedRows) {
      const rowId = readInventoryRowId(cleanRow);
      if (!rowId) continue;

      let idx = nextRows.findIndex((row) => readInventoryRowId(row) === rowId);
      if (idx < 0) {
        const key = equipmentRowIdentityKey(cleanRow);
        idx = nextRows.findIndex(
          (row) => !readInventoryRowId(row) && equipmentRowIdentityKey(row) === key,
        );
      }
      if (idx < 0) {
        const itemId = cleanRow.id;
        if (typeof itemId === 'string' || typeof itemId === 'number') {
          idx = nextRows.findIndex(
            (row) =>
              !readInventoryRowId(row) &&
              matchesSheetEquipmentItem(row as { id?: string | number; name?: string }, itemId, -1),
          );
        }
      }
      if (idx < 0) continue;

      const sheetRow = nextRows[idx]!;
      if (readInventoryRowId(sheetRow) === rowId) continue;
      nextRows[idx] = { ...sheetRow, inventoryRowId: rowId };
      bucketChanged = true;
    }

    if (!bucketChanged) continue;
    anyChanged = true;
    if (bucket === 'armor') {
      nextSheet.armor = nextRows[0] ?? null;
    } else {
      nextSheet[bucket] = nextRows;
    }
  }

  return anyChanged ? nextSheet : sheetEquipment;
}

export function prepareInventoryPatchForAutosave(
  saveBaseline: Record<string, unknown> | null | undefined,
  cleaned: Record<string, unknown>,
): void {
  if (!saveBaseline || !cleaned.equipment) return;
  buildInventoryPatch(saveBaseline.equipment, cleaned.equipment);
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

export type InventoryPatchCreatedRow = {
  inventoryRowId: string;
  bucket: InventoryPatchBucket;
  position: number;
};

const PATCH_BUCKETS = new Set<string>(INVENTORY_PATCH_BUCKETS);

export function coerceInventoryPatchCreatedRows(
  rows: Array<{ inventoryRowId: string; bucket: string; position: number }>,
): InventoryPatchCreatedRow[] {
  return rows.flatMap((row) => {
    if (!PATCH_BUCKETS.has(row.bucket)) return [];
    return [
      {
        inventoryRowId: row.inventoryRowId,
        bucket: row.bucket as InventoryPatchBucket,
        position: row.position,
      },
    ];
  });
}

/** Stamp server-assigned (or confirmed) row ids onto equipment after a successful inventory patch. */
/** Apply a persisted inventoryPatch onto an equipment snapshot (autosave baseline advance). */
export function applyInventoryPatchToEquipment(
  equipment: unknown,
  patch: InventoryPatchPayload,
): unknown {
  if (!patch.ops.length) return equipment;
  const equip: Record<string, unknown> =
    equipment && typeof equipment === 'object'
      ? { ...(equipment as Record<string, unknown>) }
      : {};

  for (const op of patch.ops) {
    const bucket = op.bucket;
    let rows = [...readEquipmentBucket(equip, bucket)];

    if (op.op === 'remove') {
      rows = rows.filter((row) => readInventoryRowId(row) !== op.inventoryRowId);
    } else if (op.op === 'add') {
      const rowId = op.inventoryRowId ?? readInventoryRowId(op.item);
      const row: Record<string, unknown> = normalizeInventoryRowForRelational(
        { ...op.item },
        bucket,
      );
      if (rowId) row.inventoryRowId = rowId;
      const position = Math.max(1, op.position ?? rows.length + 1);
      const index = Math.min(position - 1, rows.length);
      rows = [...rows.slice(0, index), row, ...rows.slice(index)];
    } else if (op.op === 'update') {
      const index = rows.findIndex((row) => readInventoryRowId(row) === op.inventoryRowId);
      if (index >= 0) {
        const merged = { ...rows[index], ...op.item, inventoryRowId: op.inventoryRowId };
        rows[index] = normalizeInventoryRowForRelational(merged, bucket);
      }
    } else if (op.op === 'reorder') {
      const from = rows.findIndex((row) => readInventoryRowId(row) === op.inventoryRowId);
      if (from >= 0) {
        const nextRows = [...rows];
        const [row] = nextRows.splice(from, 1);
        const to = Math.max(0, Math.min(op.position - 1, nextRows.length));
        nextRows.splice(to, 0, row!);
        rows = nextRows;
      }
    }

    if (bucket === 'armor') {
      equip.armor = rows[0] ?? null;
    } else {
      equip[bucket] = rows;
    }
  }

  return equip;
}

export function mergeInventoryCreatedRows(
  equipment: unknown,
  createdRows: InventoryPatchCreatedRow[],
): unknown {
  if (!equipment || typeof equipment !== 'object' || createdRows.length === 0) return equipment;
  const equip = { ...(equipment as Record<string, unknown>) };
  for (const created of createdRows) {
    const bucket = created.bucket;
    const rows = readEquipmentBucket(equip, bucket);
    const index = rows.findIndex((row) => readInventoryRowId(row) === created.inventoryRowId);
    if (index < 0) continue;
    rows[index] = { ...rows[index], inventoryRowId: created.inventoryRowId };
    if (bucket === 'armor') {
      equip.armor = rows[0] ?? null;
    } else {
      equip[bucket] = rows;
    }
  }
  return equip;
}
