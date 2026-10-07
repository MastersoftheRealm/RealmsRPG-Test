import { describe, expect, it } from 'vitest';
import type { ChipData } from '@/components/patterns/list/grid-list-row-types';
import {
  armSelectChipFocus,
  consumeSelectChipFocus,
  gridListChipReactKey,
  type SelectChipFocusSlot,
} from './grid-list-chip-utils';

describe('gridListChipReactKey', () => {
  it('stays the same when a chip becomes the current selection (86e3kfkbx)', () => {
    const before = {
      name: 'Alt B',
      chipKey: 'b',
      category: 'default',
    } as ChipData;
    const after = {
      name: 'Alt B',
      chipKey: 'b',
      category: 'success',
      current: true,
    } as ChipData;
    expect(gridListChipReactKey(before, 1)).toBe(gridListChipReactKey(after, 1));
    expect(gridListChipReactKey(after, 1)).not.toContain('success');
  });
});

describe('select chip focus (86e3kfkbx)', () => {
  it('restores only the chip that was activated, even when variant ids match', () => {
    const alternate = { pending: false } satisfies SelectChipFocusSlot;
    const randomize = { pending: false } satisfies SelectChipFocusSlot;
    armSelectChipFocus(randomize);
    expect(consumeSelectChipFocus(alternate)).toBe(false);
    expect(consumeSelectChipFocus(randomize)).toBe(true);
    expect(consumeSelectChipFocus(randomize)).toBe(false);
  });
});
