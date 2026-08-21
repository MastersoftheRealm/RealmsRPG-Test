import { describe, expect, it } from 'vitest';
import type { UserItem, UserTechnique } from '@/hooks';
import {
  buildArmamentLibraryList,
  buildArmamentSelectableItems,
  buildEmpoweredTechniqueLibraryList,
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
});
