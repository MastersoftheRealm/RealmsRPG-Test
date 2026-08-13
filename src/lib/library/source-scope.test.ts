import { describe, expect, it } from 'vitest';
import { mergeLibraryBySource } from './source-scope';

describe('mergeLibraryBySource', () => {
  const pub = [{ id: 'a', name: 'Public A' }, { id: 'b', name: 'Public B' }];
  const mine = [{ id: 'c', name: 'My C' }, { id: 'a', name: 'My A' }];

  it('all: user then public (public wins on id)', () => {
    const rows = mergeLibraryBySource('all', pub, mine);
    const byId = Object.fromEntries(rows.map((r) => [r.id, r.name]));
    expect(byId).toEqual({ a: 'Public A', b: 'Public B', c: 'My C' });
  });

  it('public: Realms only', () => {
    expect(mergeLibraryBySource('public', pub, mine).map((r) => r.id).sort()).toEqual([
      'a',
      'b',
    ]);
  });

  it('my: user library only', () => {
    expect(mergeLibraryBySource('my', pub, mine).map((r) => r.id).sort()).toEqual(['a', 'c']);
  });

  it('keeps selected ids when source would hide them', () => {
    const rows = mergeLibraryBySource('public', pub, mine, ['c']);
    expect(rows.map((r) => r.id).sort()).toEqual(['a', 'b', 'c']);
  });
});
