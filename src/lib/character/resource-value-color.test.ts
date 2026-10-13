import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { resourceCurrentValueClass } from './resource-value-color';

const sheet = readFileSync(
  new URL('../../components/character-sheet/sheet-resource-input.tsx', import.meta.url),
  'utf8',
);
const encounter = readFileSync(
  new URL('../../components/encounters/combatant-card-resources.tsx', import.meta.url),
  'utf8',
);

describe('HP and EN state colors (86e3jwn5d)', () => {
  it('uses gold when Health or Energy is over max', () => {
    expect(resourceCurrentValueClass('health', 12, 10)).toBe('text-warning-fg');
    expect(resourceCurrentValueClass('energy', 8, 6)).toBe('text-warning-fg');
  });

  it('uses dark red for negative Health above −max', () => {
    expect(resourceCurrentValueClass('health', -1, 10)).toBe('text-danger-900 dark:text-danger-fg');
    expect(resourceCurrentValueClass('health', -9, 10)).toBe('text-danger-900 dark:text-danger-fg');
  });

  it('uses the darkest text at or below −max Health', () => {
    expect(resourceCurrentValueClass('health', -10, 10)).toBe('text-text-primary');
    expect(resourceCurrentValueClass('health', -11, 10)).toBe('text-text-primary');
  });

  it('leaves a full or positive pool on the normal color', () => {
    expect(resourceCurrentValueClass('health', 10, 10)).toBeNull();
    expect(resourceCurrentValueClass('health', 0, 10)).toBeNull();
    expect(resourceCurrentValueClass('energy', 0, 6)).toBeNull();
    expect(resourceCurrentValueClass('energy', -2, 6)).toBeNull();
  });

  it('paints the current Health and Energy numbers on the sheet and the encounter card', () => {
    expect(sheet).toContain('resourceCurrentValueClass(colorVariant, current, max)');
    expect(sheet).toContain('chrome.valueClass');
    expect(encounter.match(/resourceCurrentValueClass\(\s*'health'/g)?.length).toBe(4);
    expect(encounter.match(/resourceCurrentValueClass\(\s*'energy'/g)?.length).toBe(4);
  });
});
