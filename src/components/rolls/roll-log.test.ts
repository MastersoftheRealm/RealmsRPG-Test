import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(path.join(import.meta.dirname, 'roll-log.tsx'), 'utf8');

const rollButton = readFileSync(
  path.join(import.meta.dirname, '../patterns/chrome/roll-button.tsx'),
  'utf8',
);

describe('RollLog layout (TASK-826 / C6)', () => {
  it('unmounts the closed panel instead of laying out a zero-size 360px card', () => {
    expect(source).toMatch(/\{isOpen \? \(/);
    expect(source).toMatch(/w-\[min\(22\.5rem,calc\(100svw-2\*var\(--dock-gap\)\)\)\]/);
    expect(source).not.toMatch(/w-\[360px\]/);
    expect(source).not.toMatch(/pointer-events-none h-0 w-0 max-w-0/);
  });
});

describe('RollLog bonus source hover (TASK-893)', () => {
  it('resolves a modifier label onto the bonus chip title', () => {
    expect(source).toContain('resolveRollModifierLabel');
    expect(source).toContain('title={bonusLabel}');
  });
});

describe('RollLog outside click (TASK-895)', () => {
  it('closes on pointerdown outside and ignores roll triggers', () => {
    expect(source).toContain('pointerdown');
    expect(source).toContain("closest('[data-roll-trigger]')");
    expect(source).toContain('Escape');
    expect(rollButton).toContain('data-roll-trigger');
  });
});
