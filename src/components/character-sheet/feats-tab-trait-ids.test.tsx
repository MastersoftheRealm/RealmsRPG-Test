import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { traitIdPendingCatalogName } from '@/lib/character/sheet-trait-display';
import { FeatsTab } from './feats-tab';

vi.mock('@/hooks', () => ({
  useCodexSkills: () => ({ data: [] }),
}));

describe('traitIdPendingCatalogName', () => {
  it('treats unresolved numeric ids as pending only while the catalog loads', () => {
    expect(traitIdPendingCatalogName('42', undefined, true)).toBe(true);
    expect(traitIdPendingCatalogName('42', undefined, false)).toBe(false);
    expect(traitIdPendingCatalogName('42', 'Wings', true)).toBe(false);
    expect(traitIdPendingCatalogName('wings', undefined, true)).toBe(false);
  });
});

describe('FeatsTab feat slot display (advisory only)', () => {
  it('shows over-limit counts without danger styling on archetype and character counters', () => {
    const html = renderToStaticMarkup(
      <FeatsTab
        showEditControls
        maxArchetypeFeats={2}
        maxCharacterFeats={1}
        archetypeFeats={[{ name: 'A' }, { name: 'B' }, { name: 'C' }]}
        characterFeats={[{ name: 'X' }, { name: 'Y' }]}
      />,
    );
    expect(html).toContain('3/2');
    expect(html).toContain('2/1');
    expect(html).not.toContain('text-danger-fg');
  });
});

describe('FeatsTab trait catalog loading (86e3jvjh8)', () => {
  it('drops unresolved numeric trait ids while the catalog is still loading', () => {
    expect(traitIdPendingCatalogName('999001', undefined, true)).toBe(true);
    const html = renderToStaticMarkup(
      <FeatsTab
        vanillaTraits={{ ancestryTraits: ['999001'] }}
        traitsDb={[]}
        traitsCatalogLoading
      />,
    );
    expect(html).not.toContain('999001');
  });

  it('renders resolved trait names once the catalog supplies them', () => {
    const html = renderToStaticMarkup(
      <FeatsTab
        vanillaTraits={{ ancestryTraits: ['tr-1'] }}
        traitsDb={[{ id: 'tr-1', name: 'Keen Senses', description: 'Sharp' }]}
        traitsCatalogLoading={false}
      />,
    );
    expect(html).toContain('Keen Senses');
    expect(html).not.toContain('Loading...');
  });
});
