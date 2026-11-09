import { describe, expect, it } from 'vitest';
import { HIDE_SCREENSHOT_CHROME_CSS, isDocumentHeightSettled } from './screenshot-settle';

describe('isDocumentHeightSettled', () => {
  it('is false while height is still changing', () => {
    expect(isDocumentHeightSettled([10_763, 10_805, 10_805], 3)).toBe(false);
    expect(isDocumentHeightSettled([10_763, 10_805, 10_805, 10_805], 3)).toBe(true);
  });

  it('is true only after three identical samples', () => {
    expect(isDocumentHeightSettled([10_763, 10_763], 3)).toBe(false);
    expect(isDocumentHeightSettled([10_763, 10_763, 10_763], 3)).toBe(true);
  });

  it('rejects a late height spike after a stable streak', () => {
    expect(isDocumentHeightSettled([10_763, 10_763, 10_763, 10_805], 3)).toBe(false);
  });
});

describe('HIDE_SCREENSHOT_CHROME_CSS', () => {
  it('suppresses the toast portal that can extend mobile full-page height', () => {
    expect(HIDE_SCREENSHOT_CHROME_CSS).toContain('[aria-label="Notifications"]');
    expect(HIDE_SCREENSHOT_CHROME_CSS).toContain('display: none');
  });
});
