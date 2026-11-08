import { describe, expect, it } from 'vitest';
import { PASSWORD_MIN_LENGTH } from '@/lib/password-policy';

function clientPasswordTooShort(password: string): boolean {
  return password.length < PASSWORD_MIN_LENGTH;
}

describe('my-account password policy', () => {
  it('rejects new passwords shorter than PASSWORD_MIN_LENGTH', () => {
    expect(clientPasswordTooShort('')).toBe(true);
    expect(clientPasswordTooShort('a'.repeat(PASSWORD_MIN_LENGTH - 1))).toBe(true);
    expect(clientPasswordTooShort('a'.repeat(PASSWORD_MIN_LENGTH))).toBe(false);
  });
});
