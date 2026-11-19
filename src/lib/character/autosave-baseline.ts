import { applyCharacterDirtyPatch } from '@/lib/character/dirty-patch';
import {
  applyInventoryPatchToEquipment,
  coerceInventoryPatchCreatedRows,
  mergeInventoryCreatedRows,
  type InventoryPatchPayload,
} from '@/lib/character/inventory-patch';

export type CharacterSaveBaselineResult = {
  applied: Record<string, unknown>;
  updatedAt?: string | undefined;
  inventoryPatchResult?: {
    createdRows?: Array<{ inventoryRowId: string; bucket: string; position: number }>;
  };
};

/** Advance the autosave baseline exactly like a successful sheet PATCH (applied + created row ids). */
export function advanceAutosaveBaselineFromSaveResult(
  baseline: Record<string, unknown> | null,
  result: CharacterSaveBaselineResult,
): Record<string, unknown> {
  const applied = { ...result.applied };
  const inventoryPatch = applied.inventoryPatch as InventoryPatchPayload | undefined;
  if ('inventoryPatch' in applied) delete applied.inventoryPatch;

  let next = applyCharacterDirtyPatch(
    baseline ?? {},
    applied,
    result.updatedAt ? { documentUpdatedAt: result.updatedAt } : undefined,
  );
  if (inventoryPatch?.ops?.length) {
    next = {
      ...next,
      equipment: applyInventoryPatchToEquipment(next.equipment, inventoryPatch),
    };
  }
  const createdRows = coerceInventoryPatchCreatedRows(
    result.inventoryPatchResult?.createdRows ?? [],
  );
  if (createdRows.length > 0) {
    next = {
      ...next,
      equipment: mergeInventoryCreatedRows(next.equipment, createdRows),
    };
  }
  return next;
}
