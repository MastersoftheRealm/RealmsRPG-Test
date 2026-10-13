import { describe, expect, it } from 'vitest';
import { traitIdPendingCatalogName } from './sheet-trait-display';

describe('trait ids while the catalog loads (86e3jvjh8)', () => {
  it('hides a numeric id until the catalog can supply a name', () => {
    expect(traitIdPendingCatalogName('12', undefined, true)).toBe(true);
    expect(traitIdPendingCatalogName('128', '', true)).toBe(true);
    expect(traitIdPendingCatalogName('176', '   ', true)).toBe(true);
  });

  it('keeps a stored name, and a resolved name, on screen', () => {
    expect(traitIdPendingCatalogName('Darkvision', undefined, true)).toBe(false);
    expect(traitIdPendingCatalogName('12', 'Keen Senses', true)).toBe(false);
  });

  it('leaves an unresolved id in place once the catalog has finished loading', () => {
    expect(traitIdPendingCatalogName('12', undefined, false)).toBe(false);
  });
});
