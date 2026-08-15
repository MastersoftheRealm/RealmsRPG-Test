import { describe, expect, it } from 'vitest';
import { resolveCharacterVisibility } from './character-list-columns';

describe('resolveCharacterVisibility', () => {
  it('prefers the visibility column over the JSON blob', () => {
    expect(
      resolveCharacterVisibility({
        visibility: 'private',
        data: { visibility: 'public' },
      }),
    ).toBe('private');
  });

  it('falls back to the blob when the column is missing', () => {
    expect(resolveCharacterVisibility({ data: { visibility: 'campaign' } })).toBe('campaign');
  });

  it('defaults to private when neither source is a known visibility', () => {
    expect(resolveCharacterVisibility({ visibility: 'anything', data: {} })).toBe('private');
    expect(resolveCharacterVisibility({})).toBe('private');
  });
});
