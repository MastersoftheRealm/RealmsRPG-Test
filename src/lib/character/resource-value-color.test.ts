import { describe, expect, it } from 'vitest';
import { resourceCurrentValueClass } from './resource-value-color';

describe('HP and EN state colors', () => {
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
});
