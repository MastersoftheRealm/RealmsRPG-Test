import { describe, expect, it } from 'vitest';
import type { ItemProperty } from '@/hooks';
import { creatorPropertyTrainingPoints } from './item-creator-helpers';

describe('item creator property card Training Points', () => {
  it('uses whole-option round-up (0.5 base + 0.5/level at level 1 → 2 TP)', () => {
    const property = {
      id: '501',
      name: 'Reach',
      description: '',
      base_tp: 0.5,
      op_1_tp: 0.5,
    } satisfies ItemProperty;
    expect(creatorPropertyTrainingPoints(property, 1)).toBe(2);
  });
});