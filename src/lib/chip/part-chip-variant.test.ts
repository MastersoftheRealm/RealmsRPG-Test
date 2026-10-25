import { describe, expect, it } from 'vitest';
import { partChipVariant } from './part-chip-variant';

describe('partChipVariant (86dzw3vkx)', () => {
  it('maps technique part categories to theme-aware chip variants', () => {
    expect(partChipVariant('Offense')).toBe('technique');
    expect(partChipVariant('Defensive')).toBe('restriction');
    expect(partChipVariant('Utility')).toBe('special');
  });

  it('keeps canonical power part category tokens', () => {
    expect(partChipVariant('Action')).toBe('action');
    expect(partChipVariant('Duration')).toBe('duration');
  });
});
