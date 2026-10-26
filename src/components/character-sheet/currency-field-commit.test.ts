import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { currencyDraftOnBlur, currencyDraftOnEnter } from './currency-field-commit';

const panel = readFileSync(path.join(import.meta.dirname, 'library-inventory-panel.tsx'), 'utf8');

describe('unedited Currency does not overwrite a newer value (86e3juw07)', () => {
  it('leaves 100 in place when the other tab focused 86 and did not type', () => {
    const blur = currencyDraftOnBlur({ draft: '86', currency: 100, edited: false });
    expect(blur.save).toBeNull();
    expect(blur.display).toBe('100');

    const enter = currencyDraftOnEnter({ draft: '86', currency: 100, edited: false });
    expect(enter.save).toBeNull();
    expect(enter.display).toBe('100');
  });

  it('still saves a typed Currency value', () => {
    expect(currencyDraftOnBlur({ draft: '40', currency: 100, edited: true })).toEqual({
      save: 40,
      display: '40',
    });
    expect(currencyDraftOnEnter({ draft: '+14', currency: 86, edited: true })).toEqual({
      save: 100,
      display: '100',
    });
    expect(currencyDraftOnEnter({ draft: '-10', currency: 86, edited: true })).toEqual({
      save: 76,
      display: '76',
    });
  });

  it('shows 0 when a negative Currency is blurred, matching the saved floor (86e3juw0d)', () => {
    expect(currencyDraftOnBlur({ draft: '-10', currency: 86, edited: true })).toEqual({
      save: 0,
      display: '0',
    });
    expect(currencyDraftOnBlur({ draft: '-10', currency: 0, edited: true })).toEqual({
      save: null,
      display: '0',
    });
  });

  it('still saves a cleared Currency field as 0', () => {
    expect(currencyDraftOnBlur({ draft: '', currency: 86, edited: true })).toEqual({
      save: 0,
      display: '0',
    });
  });

  it('does not save when the typed value matches Currency', () => {
    expect(currencyDraftOnBlur({ draft: '100', currency: 100, edited: true }).save).toBeNull();
  });

  it('wires the sheet Currency field through that commit', () => {
    expect(panel).toContain('currencyDraftOnBlur');
    expect(panel).toContain('currencyDraftOnEnter');
    expect(panel).toContain('edited: editedRef.current');
    expect(panel).not.toContain('if (value !== currency && onCurrencyChange)');
  });
});

describe('Currency formatting and ceiling (86e3jwn5g)', () => {
  it('groups thousands in the display string after commit', () => {
    expect(currencyDraftOnBlur({ draft: '12500', currency: 0, edited: true })).toEqual({
      save: 12500,
      display: '12,500',
    });
    expect(currencyDraftOnBlur({ draft: '12,500', currency: 0, edited: true })).toEqual({
      save: 12500,
      display: '12,500',
    });
  });

  it('clamps typed Currency above the sheet maximum', () => {
    const over = 1_000_000_000;
    expect(currencyDraftOnBlur({ draft: String(over), currency: 0, edited: true }).save).toBe(
      999_999_999,
    );
  });

  it('shows grouped Currency when the field was not edited', () => {
    expect(currencyDraftOnBlur({ draft: '1200', currency: 1_200_000, edited: false }).display).toBe(
      '1,200,000',
    );
  });
});
