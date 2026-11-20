import { describe, expect, it } from 'vitest';
import type { Character } from '@/types';
import { cleanForSave } from '@/lib/data-enrichment/clean-for-save';
import {
  applyInventoryPatchToEquipment,
  buildInventoryPatch,
  inventoryRowCasSnapshot,
} from '@/lib/character/inventory-patch';
import { mergeCharacterSaveResultIntoDetailQuery } from './use-characters';

const HEALTH_ROW = '10000000-0000-4000-8000-000000000001';
const KNIFE_ROW = '20000000-0000-4000-8000-000000000002';

describe('mergeCharacterSaveResultIntoDetailQuery (library inventoryPatch only)', () => {
  const beforeCache = {
    character: {
      id: 'c1',
      name: 'Hero',
      level: 1,
      abilities: {
        strength: 0,
        vitality: 0,
        agility: 0,
        acuity: 0,
        intelligence: 0,
        charisma: 0,
      },
      equipment: {
        items: [
          {
            inventoryRowId: HEALTH_ROW,
            id: 'health-potion',
            name: 'Health Potion',
            quantity: 2,
            cost: 25,
          },
        ],
        weapons: [],
      },
    } as Character,
  };

  const librarySaveResult = {
    applied: {
      inventoryPatch: {
        ops: [
          {
            op: 'add' as const,
            bucket: 'weapons' as const,
            inventoryRowId: KNIFE_ROW,
            position: 1,
            item: { id: 'lib-knife', name: 'Knife', quantity: 1, equipped: false, cost: 0 },
          },
        ],
      },
    },
    updatedAt: '2026-01-02T00:00:00.000Z',
    inventoryPatchResult: {
      createdRows: [{ inventoryRowId: KNIFE_ROW, bucket: 'weapons', position: 1 }],
    },
  };

  it('replays inventoryPatch onto detail-cache equipment so remove CAS matches server', () => {
    const next = mergeCharacterSaveResultIntoDetailQuery(
      beforeCache,
      librarySaveResult as Parameters<typeof mergeCharacterSaveResultIntoDetailQuery>[1],
    );
    const weapons = next?.character?.equipment?.weapons as unknown as Array<Record<string, unknown>>;
    expect(weapons).toHaveLength(1);
    expect(weapons[0]?.inventoryRowId).toBe(KNIFE_ROW);
    expect(weapons[0]?.cost).toBe(0);

    const serverRow = (
      applyInventoryPatchToEquipment(
        beforeCache.character.equipment,
        librarySaveResult.applied.inventoryPatch,
      ) as { weapons: Record<string, unknown>[] }
    ).weapons[0]!;

    const removePatch = buildInventoryPatch({ weapons: [serverRow] }, { weapons: [] });
    expect(removePatch.ops[0]).toMatchObject({
      op: 'remove',
      bucket: 'weapons',
      inventoryRowId: KNIFE_ROW,
      expected: inventoryRowCasSnapshot(serverRow, 'weapons'),
    });
  });

  it('first quantity bump after library weapon add sends update not add (E)', () => {
    const next = mergeCharacterSaveResultIntoDetailQuery(
      beforeCache,
      librarySaveResult as Parameters<typeof mergeCharacterSaveResultIntoDetailQuery>[1],
    );
    const equipment = next?.character?.equipment;
    const baseline = { weapons: (equipment?.weapons ?? []) as unknown as Record<string, unknown>[] };
    const afterBump = {
      weapons: [{ ...baseline.weapons[0]!, quantity: 2 }],
    };
    const patch = buildInventoryPatch(baseline, afterBump);
    expect(patch.ops).toEqual([
      expect.objectContaining({
        op: 'update',
        bucket: 'weapons',
        inventoryRowId: KNIFE_ROW,
        item: expect.objectContaining({ quantity: 2 }),
      }),
    ]);
    expect(patch.ops.some((op) => op.op === 'add')).toBe(false);
  });

  it('replaying the same library save merge does not duplicate weapon rows', () => {
    let cache: Parameters<typeof mergeCharacterSaveResultIntoDetailQuery>[0] = beforeCache;
    cache = mergeCharacterSaveResultIntoDetailQuery(cache, librarySaveResult as never) ?? cache;
    cache = mergeCharacterSaveResultIntoDetailQuery(cache, librarySaveResult as never) ?? cache;
    const weapons = cache?.character?.equipment?.weapons as unknown[];
    expect(weapons).toHaveLength(1);
  });

  it('stale save merge does not clobber newer local qty', () => {
    const fresh = mergeCharacterSaveResultIntoDetailQuery(
      beforeCache,
      librarySaveResult as Parameters<typeof mergeCharacterSaveResultIntoDetailQuery>[1],
    );
    const baseWeapon = fresh!.character!.equipment!.weapons![0]!;
    const withLocalQty: Parameters<typeof mergeCharacterSaveResultIntoDetailQuery>[0] = {
      ...fresh,
      character: {
        ...(fresh!.character as Character),
        updatedAt: '2026-01-03T00:00:00.000Z',
        equipment: {
          ...(fresh!.character as Character).equipment,
          weapons: [{ ...baseWeapon, quantity: 5 }],
        },
      },
    };
    const staleReplay = mergeCharacterSaveResultIntoDetailQuery(
      withLocalQty,
      {
        ...librarySaveResult,
        updatedAt: '2026-01-02T00:00:00.000Z',
      } as Parameters<typeof mergeCharacterSaveResultIntoDetailQuery>[1],
    );
    const weapons = staleReplay?.character?.equipment?.weapons as Array<{ quantity?: number }>;
    expect(weapons?.[0]?.quantity).toBe(5);
  });
});

describe('cleanForSave relational CAS cost (B)', () => {
  it('keeps cost on inventory rows for CAS snapshots', () => {
    const cleaned = cleanForSave({
      id: 'c1',
      name: 'Hero',
      level: 1,
      abilities: {
        strength: 0,
        vitality: 0,
        agility: 0,
        acuity: 0,
        intelligence: 0,
        charisma: 0,
      },
      equipment: {
        items: [
          {
            inventoryRowId: HEALTH_ROW,
            id: 'health-potion',
            name: 'Health Potion',
            quantity: 3,
            cost: 25,
          },
        ],
      },
    } as Character) as { equipment?: { items: Array<{ cost?: number }> } };
    expect(cleaned.equipment?.items[0]?.cost).toBe(25);
    expect(inventoryRowCasSnapshot(cleaned.equipment!.items[0]!, 'items').cost).toBe(25);
  });
});