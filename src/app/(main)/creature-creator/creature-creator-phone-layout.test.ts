import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const editor = readFileSync(new URL('./creature-creator-editor.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../../../app/globals.css', import.meta.url), 'utf8');

describe('creature creator phone layout (86e3jx9gn)', () => {
  it('stacks Level, Type, and Size below sm so the values are not clipped', () => {
    expect(editor).toContain('grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-4');
    expect(editor).not.toContain('grid-cols-3 gap-2 sm:gap-4');
  });

  it('insets the editor from the Roll Log FAB below md', () => {
    expect(editor).toContain('creature-creator-dock-frame');
    expect(css).toContain('.creature-creator-dock-frame');
    expect(css).toContain('padding-inline-end: var(--sheet-mobile-fab-gutter)');
  });
});
