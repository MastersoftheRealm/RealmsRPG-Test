import { describe, expect, it } from 'vitest';
import type { ItemProperty, UserItem, UserTechnique } from '@/hooks';
import {
  buildArmamentLibraryList,
  buildArmamentSelectableItems,
  buildCreatureEquipmentLibraryList,
  buildEmpoweredTechniqueLibraryList,
  codexEquipmentAsLibraryItem,
} from './creature-creator-library-selectables';

function item(partial: Pick<UserItem, 'id' | 'docId' | 'name'>): UserItem {
  return {
    type: 'weapon',
    properties: [],
    ...partial,
  };
}

function technique(partial: Pick<UserTechnique, 'id' | 'docId' | 'name'>): UserTechnique {
  return {
    parts: [],
    ...partial,
  };
}

describe('creature library source merge (TASK-712)', () => {
  const pubItems = [
    item({ id: 'a', docId: 'doc-a', name: 'Public A' }),
    item({ id: 'b', docId: 'doc-b', name: 'Public B' }),
  ];
  const myItems = [
    item({ id: 'a', docId: 'doc-a', name: 'My A' }),
    item({ id: 'c', docId: 'doc-c', name: 'My C' }),
  ];

  it('all: public wins on id; armament hides already-selected docIds', () => {
    const rows = buildArmamentLibraryList('all', myItems, pubItems, ['doc-b']);
    expect(rows.map((r) => r.name).sort()).toEqual(['My C', 'Public A']);
  });

  it('public / my still scope catalogs', () => {
    expect(
      buildArmamentLibraryList('public', myItems, pubItems, [])
        .map((r) => r.id)
        .sort(),
    ).toEqual(['a', 'b']);
    expect(
      buildArmamentLibraryList('my', myItems, pubItems, [])
        .map((r) => r.id)
        .sort(),
    ).toEqual(['a', 'c']);
  });

  it('does not keep selected my-library items when source is Realms', () => {
    const rows = buildArmamentLibraryList('public', myItems, pubItems, ['doc-c']);
    expect(rows.map((r) => r.id).sort()).toEqual(['a', 'b']);
  });

  it('empowered list: public wins on id, then remaining rows dedupe on docId', () => {
    const pub = [
      technique({ id: 'p1', docId: 'doc-p1', name: 'Official P1' }),
      technique({ id: 'p2', docId: 'doc-p2', name: 'Official P2' }),
    ];
    const mine = [
      technique({ id: 'p1', docId: 'doc-p1', name: 'My P1' }),
      technique({ id: 'u1', docId: 'doc-u1', name: 'My U1' }),
      technique({ id: 'u2', docId: 'doc-p2', name: 'My copy of P2' }),
    ];
    const rows = buildEmpoweredTechniqueLibraryList('all', mine, pub);
    expect(rows.find((r) => r.id === 'p1')?.name).toBe('Official P1');
    expect(rows.map((r) => r.docId).sort()).toEqual(['doc-p1', 'doc-p2', 'doc-u1']);
    expect(rows.filter((r) => r.docId === 'doc-p2')).toHaveLength(1);
  });

  it('armament picker rows use per-kind catalog columns (TASK-810)', () => {
    const weapon = item({ id: 'w1', docId: 'doc-w1', name: 'Axe' });
    const rows = buildArmamentSelectableItems([weapon], [], 'weapon');
    expect(rows[0]?.columns?.map((c) => c.key)).toEqual(['Damage']);
    expect(rows[0]?.columns?.some((c) => c.key === 'Type' || c.key === 'type')).toBe(false);
  });

  it('equipment sources include codex gear and hide weapons (86e3jx63b)', () => {
    const myGear = {
      ...item({ id: 'u1', docId: 'doc-u1', name: 'My Rope' }),
      type: 'equipment' as const,
    };
    const myWeapon = item({ id: 'w1', docId: 'doc-w1', name: 'Sword' });
    const publicGear = {
      ...item({ id: 'p1', docId: 'doc-p1', name: 'Public Kit' }),
      type: 'equipment' as const,
    };
    const codex = [
      {
        id: 'rope',
        name: 'Rope',
        type: 'equipment' as const,
        currency: 1,
        gold_cost: 1,
        rarity: 'Common',
      },
      { id: 'axe', name: 'Codex Axe', type: 'weapon' as const, currency: 10, gold_cost: 10 },
    ];

    const all = buildCreatureEquipmentLibraryList(
      'all',
      [myGear, myWeapon],
      [publicGear],
      codex,
      [],
    );
    expect(all.map((row) => row.name).sort()).toEqual(['My Rope', 'Public Kit', 'Rope']);

    expect(
      buildCreatureEquipmentLibraryList('public', [myGear, myWeapon], [publicGear], codex, [])
        .map((row) => row.name)
        .sort(),
    ).toEqual(['Public Kit', 'Rope']);

    expect(
      buildCreatureEquipmentLibraryList('my', [myGear, myWeapon], [publicGear], codex, []).map(
        (row) => row.name,
      ),
    ).toEqual(['My Rope']);

    expect(
      buildCreatureEquipmentLibraryList('all', [myGear], [publicGear], codex, ['rope']).map(
        (row) => row.name,
      ),
    ).not.toContain('Rope');
  });

  it('equipment add keeps catalog currency instead of the property floor (86e3jx63b)', () => {
    const rope = codexEquipmentAsLibraryItem({
      id: 'rope',
      name: 'Rope',
      type: 'equipment',
      currency: 1,
      gold_cost: 1,
      rarity: 'Common',
      properties: [],
    });
    const rows = buildArmamentSelectableItems(
      [rope],
      [{ id: 1, name: 'Unused', description: '' } as unknown as ItemProperty],
      'equipment',
    );
    const data = rows[0]?.data as {
      sourceData?: { currency?: number; rarity?: string };
      stats?: Array<{ label: string; value: string | number }>;
    };
    expect(data.sourceData?.currency).toBe(1);
    expect(data.sourceData?.rarity).toBe('Common');
    expect(data.stats?.find((stat) => stat.label === 'Cost')?.value).toBe('1c');
    expect(rows[0]?.columns?.find((column) => column.key === 'currency')?.value).toBe('1');
  });
});
