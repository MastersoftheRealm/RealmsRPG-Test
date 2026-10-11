import { describe, expect, it } from 'vitest';
import { expandedBodyClickShouldToggle, selectedTextInside } from './grid-list-row';

const description = 'A burst of fire that fills the area.';

describe('open GLR text selection does not close the item (86e3jrjfg)', () => {
  it('keeps the item open when a drag selects its description', () => {
    expect(
      expandedBodyClickShouldToggle({
        interactive: false,
        deltaX: 64,
        deltaY: 3,
        selectedText: description,
      }),
    ).toBe(false);
  });

  it('keeps the item open when the pointer moved even if no characters were selected', () => {
    expect(
      expandedBodyClickShouldToggle({
        interactive: false,
        deltaX: 12,
        deltaY: 0,
        selectedText: '',
      }),
    ).toBe(false);
  });

  it('still closes the item on a plain click', () => {
    expect(
      expandedBodyClickShouldToggle({
        interactive: false,
        deltaX: 0,
        deltaY: 1,
        selectedText: '',
      }),
    ).toBe(true);
  });

  it('ignores a selection that belongs to a different item', () => {
    const other = {} as Node;
    const thisItem = { contains: (node: Node | null) => node !== other };
    expect(
      selectedTextInside(thisItem, {
        isCollapsed: false,
        anchorNode: other,
        toString: () => description,
      }),
    ).toBe('');
    expect(
      expandedBodyClickShouldToggle({
        interactive: false,
        deltaX: 0,
        deltaY: 0,
        selectedText: '',
      }),
    ).toBe(true);
  });

  it('reads a selection whose anchor is inside this item', () => {
    const anchor = {} as Node;
    const thisItem = { contains: (node: Node | null) => node === anchor };
    expect(
      selectedTextInside(thisItem, {
        isCollapsed: false,
        anchorNode: anchor,
        toString: () => description,
      }),
    ).toBe(description);
  });

  it('still ignores a click on a nested control', () => {
    expect(
      expandedBodyClickShouldToggle({
        interactive: true,
        deltaX: 0,
        deltaY: 0,
        selectedText: '',
      }),
    ).toBe(false);
  });
});
