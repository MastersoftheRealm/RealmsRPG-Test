import { describe, expect, it } from 'vitest';
import { shouldCloseDisclosureOnFocusLeave } from './header';

/** ClickUp 86e3jw5n1 — desktop header disclosure focus-leave close. */
describe('shouldCloseDisclosureOnFocusLeave (86e3jw5n1)', () => {
  it('stays open when focus moves within the menu root', () => {
    const inner = { id: 'inner' };
    const root = {
      contains: (node: Node) => (node as { id?: string }).id === 'inner',
    } as HTMLElement;

    expect(shouldCloseDisclosureOnFocusLeave(root, inner as EventTarget)).toBe(false);
  });

  it('closes when focus leaves the menu root or relatedTarget is null', () => {
    const root = {
      contains: () => false,
    } as HTMLElement;
    const outside = { id: 'outside' };

    expect(shouldCloseDisclosureOnFocusLeave(root, outside as EventTarget)).toBe(true);
    expect(shouldCloseDisclosureOnFocusLeave(root, null)).toBe(true);
  });
});
