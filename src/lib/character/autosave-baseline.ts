import type { MutableRefObject } from 'react';
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

const registeredBaselines = new Map<string, MutableRefObject<Record<string, unknown> | null>>();

export function registerCharacterAutosaveBaseline(
  characterId: string,
  ref: MutableRefObject<Record<string, unknown> | null>,
): () => void {
  const id = characterId.trim();
  registeredBaselines.set(id, ref);
  return () => {
    if (registeredBaselines.get(id) === ref) registeredBaselines.delete(id);
  };
}

export function advanceCharacterAutosaveBaseline(
  characterId: string,
  result: CharacterSaveBaselineResult,
): void {
  const ref = registeredBaselines.get(characterId.trim());
  if (!ref) return;
  ref.current = advanceAutosaveBaselineFromSaveResult(ref.current, result);
}

/** Test helper — read the live sheet baseline when the sheet hook is mounted. */
export function peekCharacterAutosaveBaselineForTest(
  characterId: string,
): Record<string, unknown> | null {
  return registeredBaselines.get(characterId.trim())?.current ?? null;
}
