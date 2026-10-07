import { describe, expect, it } from 'vitest';
import {
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
});
