import { describe, expect, it } from 'vitest';
import {
  buildPreviewAbilityChips,
  formatPreviewAbilityValue,
  PREVIEW_ABILITY_ORDER,
} from './preview-ability-summary';

describe('preview-ability-summary (TASK-686)', () => {
  it('formats signed values with unicode minus', () => {
    expect(formatPreviewAbilityValue(3)).toBe('+3');
    expect(formatPreviewAbilityValue(0)).toBe('0');
    expect(formatPreviewAbilityValue(-2)).toBe('−2');
  });

  it('returns all six abilities in canonical order including zeros', () => {
    const chips = buildPreviewAbilityChips({
      strength: 2,
      vitality: 0,
      agility: -1,
      acuity: 1,
      intelligence: 0,
      charisma: 0,
    });
    expect(chips.map((c) => c.ability)).toEqual(PREVIEW_ABILITY_ORDER);
    expect(chips).toHaveLength(6);
    expect(chips.find((c) => c.ability === 'strength')?.display).toBe('+2');
    expect(chips.find((c) => c.ability === 'vitality')?.display).toBe('0');
    expect(chips.find((c) => c.ability === 'agility')?.display).toBe('−1');
  });
});
