import { describe, expect, it } from 'vitest';
import { cleanForSave } from '@/lib/data-enrichment/clean-for-save';
import {
  buildInventoryPatch,
  coerceInventoryPatchCreatedRows,
  mergeInventoryCreatedRows,
  replaceEquipmentDirtyWithInventoryPatch,
} from '@/lib/character/inventory-patch';
import { inventoryRowCasSnapshot } from '@/lib/character/inventory-patch';
import { remoteCharacterBaselineIsStale } from '@/lib/character/dirty-patch';
import {
  appendLibraryItemToCharacter,
  libraryAddDirtyFields,
} from './add-library-item/map-library-to-character';
import { mergeCharacterSaveResultIntoDetailQuery } from './use-characters';
import type { Character } from '@/types';
import type { LibraryItem } from '@/types/library';

const HEALTH_ROW = '10000000-0000-4000-8000-000000000001';
const KNIFE_ROW = '20000000-0000-4000-8000-000000000002';

const sampleKnife = {
  id: 'lib-knife-id',
  docId: 'lib-knife-id',
  name: 'Knife',
  type: 'weapon',
  properties: [],
} satisfies Pick<LibraryItem, 'id' | 'name' | 'type'> & { docId: string; properties: [] };

const baseCharacter = {
  id: 'c1',
  name: 'Hero',
  updatedAt: '2026-01-01T00:00:00.000Z',
  equipment: {
    items: [
      {
        inventoryRowId: HEALTH_ROW,
        id: 'health-potion',
        name: 'Health Potion',
        quantity: 3,
      },
    ],
    weapons: [],
    armor: [],
    shields: [],
  },
} as unknown as Character;

const emptyDbs = { powerPartsDb: [], techniquePartsDb: [], itemPropertiesDb: [] };

describe('library add inventory regression', () => {
  it('mergeCharacterSaveResultIntoDetailQuery stamps row id by bucket position when applied row lacks it', () => {
    const cached = { ...baseCharacter };
    const withKnife = appendLibraryItemToCharacter(cached, 'weapon', sampleKnife, emptyDbs);
    const applied = libraryAddDirtyFields('weapon', withKnife);
    const createdRows = coerceInventoryPatchCreatedRows([
      { inventoryRowId: KNIFE_ROW, bucket: 'weapons', position: 1 },
    ]);
    const result = mergeCharacterSaveResultIntoDetailQuery(
      { character: cached },
      {
        applied,
        updatedAt: '2026-01-02T00:00:00.000Z',
        inventoryPatchResult: { createdRows },
      },
    );
    const weapons = result?.character?.equipment?.weapons as Array<{ inventoryRowId?: string }>;
    expect(weapons[0]?.inventoryRowId).toBe(KNIFE_ROW);
  });

  it('after library add, refreshed autosave baseline builds a remove op for the new weapon', () => {
    const sheetBaseline = cleanForSave(baseCharacter) as Record<string, unknown>;
    const afterLibrary = appendLibraryItemToCharacter(baseCharacter, 'weapon', sampleKnife, emptyDbs);
    afterLibrary.updatedAt = '2026-01-02T00:00:00.000Z';
  const cacheCharacter = {
      ...afterLibrary,
      equipment: mergeInventoryCreatedRows(afterLibrary.equipment, [
        { inventoryRowId: KNIFE_ROW, bucket: 'weapons', position: 1 },
      ]) as Character['equipment'],
    };
    expect(remoteCharacterBaselineIsStale(cacheCharacter.updatedAt, sheetBaseline)).toBe(true);

    const refreshedBaseline = cleanForSave(cacheCharacter) as Record<string, unknown>;
    const afterRemove: Character = {
      ...cacheCharacter,
      equipment: {
        ...cacheCharacter.equipment,
        weapons: [],
      },
    };
    const dirty = cleanForSave(afterRemove) as Record<string, unknown>;
    replaceEquipmentDirtyWithInventoryPatch(dirty, refreshedBaseline);
    const ops = (dirty.inventoryPatch as { ops: unknown[] }).ops;
    expect(ops).toEqual([
      expect.objectContaining({
        op: 'remove',
        bucket: 'weapons',
        inventoryRowId: KNIFE_ROW,
        expected: inventoryRowCasSnapshot(
          (refreshedBaseline.equipment as { weapons: Record<string, unknown>[] }).weapons[0]!,
        ),
      }),
    ]);
  });

  it('after library add, qty edit on health uses CAS against refreshed baseline', () => {
    const afterLibrary = appendLibraryItemToCharacter(baseCharacter, 'weapon', sampleKnife, emptyDbs);
    const baseline = cleanForSave({
      ...afterLibrary,
      equipment: mergeInventoryCreatedRows(afterLibrary.equipment, [
        { inventoryRowId: KNIFE_ROW, bucket: 'weapons', position: 1 },
      ]) as Character['equipment'],
      updatedAt: '2026-01-02T00:00:00.000Z',
    } as Character) as Record<string, unknown>;

    const qtyEdit: Character = {
      ...(afterLibrary as Character),
      equipment: {
        ...(afterLibrary.equipment ?? {}),
        items: [
          {
            inventoryRowId: HEALTH_ROW,
            id: 'health-potion',
            name: 'Health Potion',
            quantity: 5,
          },
        ],
        weapons: [
          {
            id: 'lib-knife-id',
            name: 'Knife',
            inventoryRowId: KNIFE_ROW,
          },
        ],
      },
    };
    const patch = buildInventoryPatch(baseline.equipment, cleanForSave(qtyEdit).equipment);
    expect(patch.ops).toEqual([
      expect.objectContaining({
        op: 'update',
        inventoryRowId: HEALTH_ROW,
        item: expect.objectContaining({ quantity: 5 }),
      }),
    ]);
    expect(patch.ops.some((op) => op.op === 'add')).toBe(false);
  });

  it('after library add, reorder weapons uses row ids from refreshed baseline', () => {
    const baseline = cleanForSave({
      ...baseCharacter,
      equipment: {
        items: baseCharacter.equipment?.items ?? [],
        weapons: [
          { id: 'w-a', name: 'A', inventoryRowId: 'a0000000-0000-4000-8000-000000000001' },
          { id: 'lib-knife-id', name: 'Knife', inventoryRowId: KNIFE_ROW },
        ],
        armor: [],
        shields: [],
      },
      updatedAt: '2026-01-02T00:00:00.000Z',
    } as Character) as Record<string, unknown>;

    const reordered: Character = {
      ...baseCharacter,
      equipment: {
        items: baseCharacter.equipment?.items ?? [],
        weapons: [
          { id: 'lib-knife-id', name: 'Knife', inventoryRowId: KNIFE_ROW },
          { id: 'w-a', name: 'A', inventoryRowId: 'a0000000-0000-4000-8000-000000000001' },
        ],
        armor: [],
        shields: [],
      },
    };
    const patch = buildInventoryPatch(baseline.equipment, cleanForSave(reordered).equipment);
    expect(patch.ops.some((op) => op.op === 'reorder')).toBe(true);
  });
});