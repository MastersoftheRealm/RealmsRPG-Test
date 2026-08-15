import { describe, expect, it } from 'vitest';
import {
  dedupeByDocId,
  mergeEmpoweredTechniquesWithSource,
  mergeLibraryWithSource,
  mergeLookupPool,
  powerListToSelectable,
  type WithSource,
} from '@/lib/creator/advanced-powers-selectable';
import type { UserPower } from '@/hooks/use-user-library';

describe('advanced-powers-selectable merge helpers', () => {
  it('tags mine vs public sources', () => {
    const merged = mergeLibraryWithSource([{ id: 'a', name: 'A' }], [{ id: 'b', name: 'B' }]);
    expect(merged).toEqual([
      { id: 'a', name: 'A', _source: 'my' },
      { id: 'b', name: 'B', _source: 'public' },
    ]);
  });

  it('dedupes by docId then id (first wins)', () => {
    const list = [
      { docId: 'x', id: '1', name: 'First' },
      { docId: 'x', id: '2', name: 'Dup' },
      { id: 'y', name: 'Other' },
      { id: 'y', name: 'DupId' },
    ];
    expect(dedupeByDocId(list)).toEqual([
      { docId: 'x', id: '1', name: 'First' },
      { id: 'y', name: 'Other' },
    ]);
  });

  it('mergeLookupPool prefers user row when ids collide', () => {
    const mine = [{ docId: 'p1', name: 'Mine' }];
    const pub = [
      { docId: 'p1', name: 'Public' },
      { docId: 'p2', name: 'OnlyPublic' },
    ];
    expect(mergeLookupPool(mine, pub).map((r) => r.name)).toEqual(['Mine', 'OnlyPublic']);
  });

  it('mergeEmpoweredTechniquesWithSource tags and dedupes', () => {
    const merged = mergeEmpoweredTechniquesWithSource(
      [{ id: 'e1', name: 'Mine ET' } as never],
      [{ id: 'e1', name: 'Public ET' } as never, { docId: 'e2', id: 'e2', name: 'Other' } as never],
    );
    expect(
      merged.map((t) => ({ id: String(t.docId ?? t.id), source: t._source, name: t.name })),
    ).toEqual([
      { id: 'e1', source: 'my', name: 'Mine ET' },
      { id: 'e2', source: 'public', name: 'Other' },
    ]);
  });
});

describe('powerListToSelectable', () => {
  it('skips rows without id and builds compact columns', () => {
    const list: WithSource<UserPower>[] = [
      { _source: 'my', name: 'NoId' } as WithSource<UserPower>,
      {
        _source: 'public',
        docId: 'firebolt',
        id: 'firebolt',
        name: 'Firebolt',
        description: 'A bolt',
        parts: [],
        actionType: 'action',
      } as WithSource<UserPower>,
    ];
    const items = powerListToSelectable(list, [], new Set(['firebolt']));
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('firebolt');
    expect(items[0].name).toBe('Firebolt');
    expect(items[0].columns?.map((c) => c.key)).toEqual([
      'Action',
      'Energy',
      'Training Points',
      'Damage',
    ]);
    expect((items[0].data as WithSource<UserPower>)._source).toBe('public');
  });

  it('adds path badge only when selected + recommended + pathName', () => {
    const power = {
      _source: 'my' as const,
      id: 'p1',
      docId: 'p1',
      name: 'Spark',
      description: '',
      parts: [],
    } as WithSource<UserPower>;
    const without = powerListToSelectable([power], [], new Set(['p1']), {
      pathName: 'Mage',
      selectedIds: new Set(),
    });
    expect(without[0].badges).toBeUndefined();

    const withBadge = powerListToSelectable([power], [], new Set(['p1']), {
      pathName: 'Mage',
      selectedIds: new Set(['p1']),
    });
    expect(withBadge[0].badges).toEqual([{ label: '(Mage)', color: 'gray' }]);
  });
});
