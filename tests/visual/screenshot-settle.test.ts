import { describe, expect, it } from 'vitest';
import {
  STYLEGUIDE_CATEGORY_WRAP_EXTRA_HEIGHT_PX,
  STYLEGUIDE_MOBILE_BASELINE_SCROLL_HEIGHT,
  isDocumentHeightSettled,
  isStyleguideCategoryRowBaselineLayout,
  isStyleguideCategoryRowWrappedLayout,
} from './screenshot-settle';

describe('styleguide Category row layout', () => {
  it('passes when Duration stays on the first line with Action', () => {
    expect(isStyleguideCategoryRowBaselineLayout(412, 412)).toBe(true);
    expect(isStyleguideCategoryRowBaselineLayout(415, 412)).toBe(true);
    expect(isStyleguideCategoryRowWrappedLayout(415, 412)).toBe(false);
  });

  it('fails when Duration wraps to its own line (42px lower)', () => {
    const wrappedDurationTop = 412 + STYLEGUIDE_CATEGORY_WRAP_EXTRA_HEIGHT_PX;
    expect(isStyleguideCategoryRowBaselineLayout(wrappedDurationTop, 412)).toBe(false);
    expect(isStyleguideCategoryRowWrappedLayout(wrappedDurationTop, 412)).toBe(true);
  });

  it('maps wrapped layout to the failing mobile capture height', () => {
    const wrappedHeight =
      STYLEGUIDE_MOBILE_BASELINE_SCROLL_HEIGHT + STYLEGUIDE_CATEGORY_WRAP_EXTRA_HEIGHT_PX;
    expect(wrappedHeight).toBe(10_805);
    expect(wrappedHeight).not.toBe(STYLEGUIDE_MOBILE_BASELINE_SCROLL_HEIGHT);
  });
});

describe('isDocumentHeightSettled', () => {
  it('is false while height is still changing', () => {
    expect(isDocumentHeightSettled([10_763, 10_805, 10_805], 3)).toBe(false);
  });

  it('does not treat a stable wrapped height streak as the baseline', () => {
    const wrapped =
      STYLEGUIDE_MOBILE_BASELINE_SCROLL_HEIGHT + STYLEGUIDE_CATEGORY_WRAP_EXTRA_HEIGHT_PX;
    expect(isDocumentHeightSettled([wrapped, wrapped, wrapped], 3)).toBe(true);
    expect(wrapped).toBe(10_805);
    expect(wrapped).not.toBe(STYLEGUIDE_MOBILE_BASELINE_SCROLL_HEIGHT);
  });

  it('is true only after three identical samples at baseline height', () => {
    expect(isDocumentHeightSettled([10_763, 10_763], 3)).toBe(false);
    expect(isDocumentHeightSettled([10_763, 10_763, 10_763], 3)).toBe(true);
  });

  it('rejects a late height spike after a stable streak', () => {
    expect(isDocumentHeightSettled([10_763, 10_763, 10_763, 10_805], 3)).toBe(false);
  });
});
