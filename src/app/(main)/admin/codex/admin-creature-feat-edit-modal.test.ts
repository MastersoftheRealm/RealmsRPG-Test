import { describe, expect, it } from 'vitest';
import { parseOptionalAdminDecimalInput } from './admin-creature-feat-edit-modal';

describe('parseOptionalAdminDecimalInput', () => {
  it('accepts fractional and negative feat point values', () => {
    expect(parseOptionalAdminDecimalInput('0.5')).toBe(0.5);
    expect(parseOptionalAdminDecimalInput('-0.5')).toBe(-0.5);
  });

  it('returns undefined for empty or non-numeric input', () => {
    expect(parseOptionalAdminDecimalInput('')).toBeUndefined();
    expect(parseOptionalAdminDecimalInput('-')).toBeUndefined();
  });

  it('still accepts whole numbers', () => {
    expect(parseOptionalAdminDecimalInput('2')).toBe(2);
    expect(parseOptionalAdminDecimalInput('0')).toBe(0);
  });
});
