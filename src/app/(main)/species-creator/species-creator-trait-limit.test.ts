import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import {
  commitSpeciesTraitBatch,
  openTraitSlots,
  traitSelectionLimitMessage,
} from './species-creator-bootstrap';

describe('trait selection slot cap', () => {
  it('counts open ancestry slots after one is already used', () => {
    expect(openTraitSlots(1, 6)).toBe(5);
    expect(openTraitSlots(6, 6)).toBe(0);
    expect(openTraitSlots(7, 6)).toBe(0);
  });

  it('asks the user to deselect extras instead of dropping them', () => {
    expect(traitSelectionLimitMessage('ancestry traits', 6, 5)).toBe(
      'Ancestry traits have 5 open slots. Deselect 1 extra trait before adding.',
    );
    expect(traitSelectionLimitMessage('flaws', 4, 3)).toBe(
      'Flaws have 3 open slots. Deselect 1 extra trait before adding.',
    );
    expect(traitSelectionLimitMessage('characteristics', 7, 6)).toBe(
      'Characteristics have 6 open slots. Deselect 1 extra trait before adding.',
    );
    expect(traitSelectionLimitMessage('flaws', 2, 1)).toBe(
      'Flaws have 1 open slot. Deselect 1 extra trait before adding.',
    );
  });

  it('stays quiet when the selection fits, and says when nothing is open', () => {
    expect(traitSelectionLimitMessage('ancestry traits', 5, 5)).toBeNull();
    expect(traitSelectionLimitMessage('ancestry traits', 1, 0)).toBe(
      'No open slots for ancestry traits. Remove one before adding more.',
    );
  });

  it('does not call onAddBatch when the pick would exceed open slots', () => {
    const onAddBatch = vi.fn();
    const onClose = vi.fn();
    commitSpeciesTraitBatch({
      ids: ['extra-1', 'extra-2'],
      category: 'ancestry_traits',
      currentCount: 5,
      limit: 6,
      onAddBatch,
      onClose,
    });
    expect(onAddBatch).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('describes a disabled Add with the visible limit text', () => {
    const editor = readFileSync(new URL('./species-creator-editor.tsx', import.meta.url), 'utf8');
    const footer = readFileSync(
      new URL(
        '../../../components/patterns/select/unified-selection-modal-footer.tsx',
        import.meta.url,
      ),
      'utf8',
    );
    expect(editor).toContain('aria-describedby={');
    expect(editor).toContain('speciesLimitId');
    expect(editor).not.toContain('title={speciesLimit');
    expect(footer).toContain('aria-describedby={confirmDescribedBy}');
  });
});
