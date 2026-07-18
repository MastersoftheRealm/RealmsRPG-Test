import { describe, expect, it } from 'vitest';
import { IMAGE_MATTE_FALLBACK, getImageMatteFillColor } from './crop-image';

describe('getImageMatteFillColor', () => {
  it('returns the light-theme fallback when document is unavailable (Node tests)', () => {
    expect(getImageMatteFillColor()).toBe(IMAGE_MATTE_FALLBACK);
  });
});
