import { describe, expect, it } from 'vitest';
import { isAtRoleQuota } from './role-quota-messages';

describe('isAtRoleQuota (86e3ka3kt)', () => {
  it('is true at the cap and false below it', () => {
    expect(isAtRoleQuota(3, 3)).toBe(true);
    expect(isAtRoleQuota(2, 3)).toBe(false);
    expect(isAtRoleQuota(20, 20)).toBe(true);
  });

  it('does not block when the cap is unknown', () => {
    expect(isAtRoleQuota(3, undefined)).toBe(false);
    expect(isAtRoleQuota(3, null)).toBe(false);
  });
});
