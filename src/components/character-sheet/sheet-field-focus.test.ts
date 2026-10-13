import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { sheetFieldDismissReturnsFocus } from './sheet-field-focus';

const identity = readFileSync(new URL('./sheet-header-identity.tsx', import.meta.url), 'utf8');
const resource = readFileSync(new URL('./sheet-resource-input.tsx', import.meta.url), 'utf8');

describe('inline field focus after Enter or Escape (86e3jw5kc)', () => {
  it('returns focus for Enter and Escape, not for other keys', () => {
    expect(sheetFieldDismissReturnsFocus('Enter')).toBe(true);
    expect(sheetFieldDismissReturnsFocus('Escape')).toBe(true);
    expect(sheetFieldDismissReturnsFocus('Tab')).toBe(false);
  });

  it('focuses the name and XP pencils after a key dismiss', () => {
    expect(identity).toContain('sheetFieldDismissReturnsFocus(e.key)');
    expect(identity).toContain('nameEditButtonRef.current?.focus()');
    expect(identity).toContain('xpEditButtonRef.current?.focus()');
    expect(identity).toContain('restoreNameFocusRef.current = true');
    expect(identity).toContain('restoreXpFocusRef.current = true');
  });

  it('keeps HP focus on the field instead of blurring to the page', () => {
    expect(resource).toContain('sheetFieldDismissReturnsFocus(e.key)');
    expect(resource).not.toContain('.blur()');
  });
});
