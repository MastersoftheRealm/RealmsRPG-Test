import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const featsTab = readFileSync(new URL('./feats-tab.tsx', import.meta.url), 'utf8');
const pageData = readFileSync(
  new URL('../../app/(detail)/characters/[id]/use-character-sheet-page-data.ts', import.meta.url),
  'utf8',
);

describe('feat slot count display (sheet is advisory only)', () => {
  it('does not use over-limit danger styling on feat counters', () => {
    expect(featsTab).not.toContain('archetypeOver');
    expect(featsTab).not.toContain('characterOver');
    expect(featsTab).not.toMatch(/addButtonClassName=\{[^}]*danger/);
  });
});

describe('trait catalog loading (86e3jvjh8)', () => {
  it('drops unresolved numeric ids and shows a loading state', () => {
    expect(featsTab).toContain('traitIdPendingCatalogName');
    expect(featsTab).toContain("emptyMessage={traitsAwaitingNames ? 'Loading...' : 'No traits'}");
    expect(featsTab).toContain('if (base.pending && !customName) return [];');
  });

  it('marks the owner sheet catalog as loading only before the trait request returns', () => {
    expect(pageData).toContain(
      'traitsCatalogLoading: loadCatalog && catalog.traitsDb.length === 0 && traitsCatalogPending',
    );
  });
});
