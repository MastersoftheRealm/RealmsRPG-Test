import { describe, expect, it } from 'vitest';
import { formatRolePolicyLimit, ROLE_POLICY_LIMIT_UNLIMITED_SENTINEL } from './role-limits';

describe('formatRolePolicyLimit (86e3jzu5u)', () => {
  it('shows Unlimited at the admin sentinel', () => {
    expect(ROLE_POLICY_LIMIT_UNLIMITED_SENTINEL).toBe(9999);
    expect(formatRolePolicyLimit(9999)).toBe('Unlimited');
    expect(formatRolePolicyLimit(10000)).toBe('Unlimited');
  });

  it('shows the numeric value below the sentinel', () => {
    expect(formatRolePolicyLimit(3)).toBe('3');
    expect(formatRolePolicyLimit(9998)).toBe('9998');
  });
});
