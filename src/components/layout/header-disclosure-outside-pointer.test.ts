import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { shouldCloseDisclosureOnOutsidePointer } from './header';

const headerSource = readFileSync(path.join(import.meta.dirname, 'header.tsx'), 'utf8');

/** ClickUp 86e3jywd8 — dismiss disclosure without click-through. */
describe('shouldCloseDisclosureOnOutsidePointer (86e3jywd8)', () => {
  const root = {
    contains: (node: Node) => (node as { id?: string }).id === 'inside',
  } as HTMLElement;

  it('does not dismiss for null root or null target', () => {
    expect(shouldCloseDisclosureOnOutsidePointer(null, { id: 'x' } as unknown as EventTarget)).toBe(
      false,
    );
    expect(shouldCloseDisclosureOnOutsidePointer(root, null)).toBe(false);
  });

  it('stays open when pointer is inside the menu root', () => {
    const inside = { id: 'inside' };
    expect(shouldCloseDisclosureOnOutsidePointer(root, inside as unknown as EventTarget)).toBe(
      false,
    );
  });

  it('dismisses when pointer is outside the menu root', () => {
    const outside = { id: 'outside' };
    expect(shouldCloseDisclosureOnOutsidePointer(root, outside as unknown as EventTarget)).toBe(
      true,
    );
  });

  it('useDisclosureMenu uses capture pointerdown and preventDefault on outside dismiss', () => {
    expect(headerSource).toContain('shouldCloseDisclosureOnOutsidePointer');
    expect(headerSource).toContain("addEventListener('pointerdown', onPointerDown, true)");
    expect(headerSource).toContain('event.preventDefault()');
    expect(headerSource).not.toContain("addEventListener('click', handleClick)");
  });
});
