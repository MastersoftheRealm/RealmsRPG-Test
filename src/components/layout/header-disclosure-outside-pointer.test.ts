import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { armDismissClickSwallow, shouldCloseDisclosureOnOutsidePointer } from './header';

const headerSource = readFileSync(path.join(import.meta.dirname, 'header.tsx'), 'utf8');
const characterCardSource = readFileSync(
  path.join(import.meta.dirname, '../character/character-card.tsx'),
  'utf8',
);

const menuRoot = {
  contains: (node: Node) => (node as { id?: string }).id === 'inside',
} as HTMLElement;

/** Character cards open the sheet by following the card link click. */
function characterCardOpens(click: Event): boolean {
  return !click.defaultPrevented;
}

function dispatchClick(target: EventTarget): Event {
  const click = new Event('click', { bubbles: true, cancelable: true });
  target.dispatchEvent(click);
  return click;
}

/** ClickUp 86e3jywd8 — dismiss disclosure without the click opening the card. */
describe('shouldCloseDisclosureOnOutsidePointer (86e3jywd8)', () => {
  it('does not dismiss for null root or null target', () => {
    expect(shouldCloseDisclosureOnOutsidePointer(null, { id: 'x' } as unknown as EventTarget)).toBe(
      false,
    );
    expect(shouldCloseDisclosureOnOutsidePointer(menuRoot, null)).toBe(false);
  });

  it('stays open when pointer is inside the menu root', () => {
    const inside = { id: 'inside' };
    expect(shouldCloseDisclosureOnOutsidePointer(menuRoot, inside as unknown as EventTarget)).toBe(
      false,
    );
  });

  it('dismisses when pointer is outside the menu root', () => {
    const outside = { id: 'outside' };
    expect(shouldCloseDisclosureOnOutsidePointer(menuRoot, outside as unknown as EventTarget)).toBe(
      true,
    );
  });

  it('useDisclosureMenu arms a capture click swallow and does not preventDefault on pointerdown', () => {
    const hook = headerSource.slice(
      headerSource.indexOf('function useDisclosureMenu'),
      headerSource.indexOf('export function Header'),
    );
    expect(hook).toContain('armDismissClickSwallow');
    expect(hook).toContain("addEventListener('pointerdown', onPointerDown, true)");
    expect(hook).not.toContain('event.preventDefault()');
    expect(headerSource).toContain("addEventListener('click', onClick, true)");
    expect(headerSource).not.toContain("addEventListener('click', handleClick)");
    expect(characterCardSource).toContain('href={`/characters/${character.id}`}');
  });
});

describe('armDismissClickSwallow (86e3jywd8)', () => {
  it('dismiss click does not open the card', () => {
    const doc = new EventTarget();
    armDismissClickSwallow({
      documentTarget: doc,
      isOutside: () => true,
      scheduleTimeout: () => 0 as unknown as ReturnType<typeof setTimeout>,
      cancelTimeout: () => {},
    });

    const click = dispatchClick(doc);
    expect(characterCardOpens(click)).toBe(false);
    expect(click.defaultPrevented).toBe(true);

    const next = dispatchClick(doc);
    expect(characterCardOpens(next)).toBe(true);
  });

  it('does not swallow a click inside the menu, and only the next outside click', () => {
    const doc = new EventTarget();
    let outside = false;
    armDismissClickSwallow({
      documentTarget: doc,
      isOutside: () => outside,
      scheduleTimeout: () => 0 as unknown as ReturnType<typeof setTimeout>,
      cancelTimeout: () => {},
    });

    const inside = dispatchClick(doc);
    expect(characterCardOpens(inside)).toBe(true);

    outside = true;
    const later = dispatchClick(doc);
    expect(characterCardOpens(later)).toBe(true);
  });

  it('clears the swallow on timeout so a later click opens the card', () => {
    const doc = new EventTarget();
    let fire: (() => void) | undefined;
    armDismissClickSwallow({
      documentTarget: doc,
      isOutside: () => true,
      scheduleTimeout: (callback) => {
        fire = callback;
        return 1 as unknown as ReturnType<typeof setTimeout>;
      },
      cancelTimeout: () => {},
    });

    fire?.();
    const click = dispatchClick(doc);
    expect(characterCardOpens(click)).toBe(true);
  });
});
