import { describe, expect, it } from 'vitest';
import { PASSWORD_MIN_LENGTH } from './password-policy';

describe('PASSWORD_MIN_LENGTH', () => {
  it('remains 6 for existing UI validation', () => {
    expect(PASSWORD_MIN_LENGTH).toBe(6);
  });
});
