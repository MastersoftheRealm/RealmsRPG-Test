import { describe, expect, it } from 'vitest';
import { canIncreaseDefense } from './skill-allocation';

describe('canIncreaseDefense (T4 / M5)', () => {
  it('allows a skill-point defense of 0 at level 3 even when the ability bonus is 3', () => {
    expect(canIncreaseDefense(0, 3, 3, 2)).toBe(true);
  });

  it('blocks when the skill-point portion already equals level', () => {
    expect(canIncreaseDefense(3, 3, 0, 10)).toBe(false);
  });
});
