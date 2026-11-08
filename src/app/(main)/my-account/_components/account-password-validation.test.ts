import { describe, expect, it } from 'vitest';
import { PASSWORD_MIN_LENGTH } from '@/lib/password-policy';
import { validateNewAccountPassword } from './account-password-validation';

describe('validateNewAccountPassword', () => {
  it('rejects passwords shorter than PASSWORD_MIN_LENGTH', () => {
    expect(validateNewAccountPassword('')).toBe(
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    );
    expect(validateNewAccountPassword('a'.repeat(PASSWORD_MIN_LENGTH - 1))).toBe(
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    );
    expect(validateNewAccountPassword('a'.repeat(PASSWORD_MIN_LENGTH))).toBeNull();
  });
});
