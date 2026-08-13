import { describe, expect, it } from 'vitest';
import {
  findByNormalizedId,
  indexByNormalizedIds,
  indexDisplayNamesByNormalizedIds,
  normalizeId,
  resolveNormalizedRefLabel,
  resolveNormalizedRefList,
  rowMatchesNormalizedId,
} from '@/lib/utils/normalize-id';

describe('normalize-id', () => {
  it('trims and lowercases', () => {
    expect(normalizeId('  ABC-1  ')).toBe('abc-1');
  });

  it('matches id or docId case-insensitively', () => {
    const row = { id: 'lib-row', docId: 'User-UUID' };
    expect(rowMatchesNormalizedId(row, 'USER-uuid')).toBe(true);
    expect(rowMatchesNormalizedId(row, 'LIB-ROW')).toBe(true);
    expect(rowMatchesNormalizedId(row, 'other')).toBe(false);
  });

  it('indexes both id and docId', () => {
    const map = indexByNormalizedIds([{ id: 'lib-row', docId: 'user-uuid', name: 'Bolt' }]);
    expect(map.get(normalizeId('LIB-ROW'))?.name).toBe('Bolt');
    expect(map.get(normalizeId('user-uuid'))?.name).toBe('Bolt');
  });

  it('findByNormalizedId returns the matching row', () => {
    const list = [{ id: 'a', docId: 'doc-a', name: 'A' }];
    expect(findByNormalizedId(list, 'DOC-A')?.name).toBe('A');
    expect(findByNormalizedId(list, 'missing')).toBeUndefined();
  });

  it('indexes display names by id, docId, and name', () => {
    const { byId, byName } = indexDisplayNamesByNormalizedIds([
      { id: 'lib-row', docId: 'user-uuid', name: 'Bolt' },
    ]);
    expect(byId.get(normalizeId('LIB-ROW'))).toBe('Bolt');
    expect(byId.get(normalizeId('user-uuid'))).toBe('Bolt');
    expect(byName.get(normalizeId('Bolt'))).toBe('Bolt');
  });

  it('resolves id:qty refs to Name ×N and keeps unmatched id text', () => {
    const { byId, byName } = indexDisplayNamesByNormalizedIds([
      { id: 'torch', docId: 'torch-doc', name: 'Torch' },
    ]);
    expect(resolveNormalizedRefLabel('torch-doc:3', byId, byName)).toBe('Torch ×3');
    expect(resolveNormalizedRefLabel('Torch:2', byId, byName)).toBe('Torch ×2');
    expect(resolveNormalizedRefList(['missing'], byId, byName)).toEqual(['missing']);
  });
});
