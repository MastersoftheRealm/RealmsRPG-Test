import { describe, expect, it } from 'vitest';
import type { Character } from '@/types';
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
            item: { id: 'lib-knife', name: 'Knife', quantity: 1, equipped: false },
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

  it('first quantity bump after library weapon add sends update not add', () => {
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
      }),
    ]);
    expect(patch.ops.some((op) => op.op === 'add')).toBe(false);
  });
});