import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CREATOR_SAVE_DISABLED_CLASS } from '@/components/creator/CreatorSaveToolbar';
import {
  selectionLeavePromptCopy,
  selectionSearchText,
} from '@/components/patterns/select/unified-selection-modal-helpers';
import {
  appendSpeciesLanguage,
  dedupeSpeciesPickerTraits,
  orderSpeciesSizes,
  speciesLibraryRecordToFormState,
} from './species-creator-bootstrap';

describe('species sizes stay in written order (86e3jx1n1)', () => {
  it('sorts a click-order pair into Tiny through Huge', () => {
    expect(orderSpeciesSizes(['Huge', 'Small'])).toEqual(['Small', 'Huge']);
    expect(orderSpeciesSizes(['Medium', 'Tiny'])).toEqual(['Tiny', 'Medium']);
  });

  it('keeps an unknown size after the written options', () => {
    expect(orderSpeciesSizes(['Gargantuan', 'Tiny', 'Colossal'])).toEqual([
      'Tiny',
      'Gargantuan',
      'Colossal',
    ]);
  });

  it('orders sizes loaded from a library row', () => {
    const form = speciesLibraryRecordToFormState(
      {
        name: 'Watcher',
        type: 'Humanoid',
        sizes: ['Huge', 'Small'],
        languages: ['Universal'],
      },
      [],
      [],
    );
    expect(form.sizes).toEqual(['Small', 'Huge']);
  });
});

describe('trait search ignores surrounding spaces (86e3jx1n1)', () => {
  it('trims and lowercases the query, and treats a blank query as no search', () => {
    expect(selectionSearchText('  Vampiric  ')).toBe('vampiric');
    expect(selectionSearchText('   ')).toBe('');
  });

  it('uses the trimmed query in the shared selection modal', () => {
    const modal = readFileSync(
      new URL('../../../components/patterns/select/unified-selection-modal.tsx', import.meta.url),
      'utf8',
    );
    expect(modal).toContain('selectionSearchText(searchQuery)');
    expect(modal).not.toContain('searchQuery.toLowerCase()');
  });
});

describe('species trait picker hides a duplicate name (86e3jx1mv)', () => {
  it('keeps the lower id when two rows share a name', () => {
    const kept = dedupeSpeciesPickerTraits([
      { id: '40', name: 'Vampiric' },
      { id: '12', name: ' vampiric ' },
      { id: '12', name: 'Vampiric' },
      { id: '3', name: 'Aquatic' },
    ]);
    expect(kept.map((trait) => trait.id)).toEqual(['3', '12']);
  });

  it('dedupes inside each trait picker after that picker filter', () => {
    const editor = readFileSync(new URL('./species-creator-editor.tsx', import.meta.url), 'utf8');
    expect(editor).toContain('dedupeSpeciesPickerTraits(traits.filter((t) => filter(t)))');
  });
});

describe('trait picker leave confirms match (86e3jx1mn)', () => {
  it('asks every add picker to add before leaving', () => {
    const flaw = selectionLeavePromptCopy({
      confirmLabel: 'Add selected',
      selectedCount: 2,
      itemLabel: 'flaw',
    });
    const species = selectionLeavePromptCopy({
      confirmLabel: 'Add Selected',
      selectedCount: 2,
      itemLabel: 'trait',
    });
    expect(flaw.title).toBe('Add selected?');
    expect(species.title).toBe(flaw.title);
    expect(species.description).toBe('You have 2 traits selected. Add them before leaving?');
    expect(flaw.discardLabel).toBe("Don't add");
    expect(species.discardLabel).toBe(flaw.discardLabel);
  });

  it('does not give the species/ancestry picker a different leave title', () => {
    const modal = readFileSync(
      new URL('../../../components/patterns/select/unified-selection-modal.tsx', import.meta.url),
      'utf8',
    );
    const prompt = readFileSync(
      new URL(
        '../../../components/patterns/select/unified-selection-modal-leave-prompt.tsx',
        import.meta.url,
      ),
      'utf8',
    );
    expect(modal).toContain('selectionLeavePromptCopy');
    expect(modal).not.toContain('Leave without adding?');
    expect(modal).toContain('primaryActions={primaryActions}');
    expect(modal).toContain('selectedItems={selectedForActions}');
    expect(prompt).toContain("typeof primaryActions === 'function'");
  });
});

describe('species languages reject a case-only duplicate (86e3jx1kz)', () => {
  it('keeps the existing spelling and refuses the new one', () => {
    expect(appendSpeciesLanguage(['Universal'], ' universal ')).toBeNull();
    expect(appendSpeciesLanguage(['Universal'], 'UNIVERSAL')).toBeNull();
    expect(appendSpeciesLanguage(['Universal'], ' Elvish ')).toEqual(['Universal', 'Elvish']);
  });

  it('collapses a case-only pair loaded from a library row', () => {
    const form = speciesLibraryRecordToFormState(
      {
        name: 'Watcher',
        type: 'Humanoid',
        sizes: ['Medium'],
        languages: ['Universal', 'universal'],
      },
      [],
      [],
    );
    expect(form.languages).toEqual(['Universal']);
  });
});

describe('disabled species Save is visibly disabled (86e3jxgx6)', () => {
  it('uses the muted disabled control treatment on Save', () => {
    expect(CREATOR_SAVE_DISABLED_CLASS).toContain('disabled:cursor-not-allowed');
    expect(CREATOR_SAVE_DISABLED_CLASS).toContain('disabled:bg-surface-alt');
    expect(CREATOR_SAVE_DISABLED_CLASS).toContain('disabled:text-text-muted');
    const toolbar = readFileSync(
      new URL('../../../components/creator/CreatorSaveToolbar.tsx', import.meta.url),
      'utf8',
    );
    expect(toolbar).toContain('!saving && saveDisabled ? CREATOR_SAVE_DISABLED_CLASS');
    expect(toolbar).toContain('className={saveDisabledClass}');
  });
});
