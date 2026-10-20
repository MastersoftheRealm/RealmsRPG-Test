import { describe, expect, it } from 'vitest';
import { resolveCharacterVisibility } from './character-list-columns';

describe('resolveCharacterVisibility', () => {
  it('uses the relational visibility column', () => {
    expect(resolveCharacterVisibility({ visibility: 'campaign' })).toBe('campaign');
  });

  it('defaults to private when neither source is a known visibility', () => {
    expect(resolveCharacterVisibility({ visibility: 'anything' })).toBe('private');
    expect(resolveCharacterVisibility({})).toBe('private');
  });
});
