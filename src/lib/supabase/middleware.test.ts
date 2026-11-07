import { describe, expect, it } from 'vitest';
import { ACCOUNT_PATH_ALIAS_REWRITE } from '@/lib/security/next-app-flags';
import { isHardProtectedPath } from './middleware';

describe('signed-out /account', () => {
  it('requires sign-in for /account and still protects /my-account', () => {
    expect(isHardProtectedPath('/account')).toBe(true);
    expect(isHardProtectedPath('/my-account')).toBe(true);
    expect(isHardProtectedPath('/campaigns')).toBe(false);
    expect(isHardProtectedPath('/')).toBe(false);
  });

  it('rewrites a signed-in /account visit onto the account page', () => {
    expect(ACCOUNT_PATH_ALIAS_REWRITE).toEqual({
      source: '/account',
      destination: '/my-account',
    });
  });
});
