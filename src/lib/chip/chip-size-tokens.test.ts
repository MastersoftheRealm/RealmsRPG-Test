import { describe, expect, it } from 'vitest';
import {
  CHIP_ENTITY_INLINE_SIZE,
  expandableShellChipSize,
  resolveDescriptorChipSize,
} from './chip-size-tokens';

describe('chip-size-tokens', () => {
  it('maps entity inline sizes to the descriptor token', () => {
    expect(CHIP_ENTITY_INLINE_SIZE).toBe('descriptor');
    expect(expandableShellChipSize('md')).toBe('descriptor');
    expect(resolveDescriptorChipSize('sm')).toBe('descriptor');
    expect(resolveDescriptorChipSize('descriptor')).toBe('descriptor');
    expect(resolveDescriptorChipSize(undefined)).toBe('descriptor');
  });

  it('keeps dense sm and prominent md/lg distinct from entity inline', () => {
    expect(expandableShellChipSize('sm')).toBe('sm');
    expect(resolveDescriptorChipSize('md')).toBe('md');
    expect(resolveDescriptorChipSize('lg')).toBe('lg');
  });
});
