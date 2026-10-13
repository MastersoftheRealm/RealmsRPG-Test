import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { isHardProtectedPath } from './middleware';

describe('signed-out /account (86e3jtwyk)', () => {
  it('requires sign-in for /account and still protects /my-account', () => {
    expect(isHardProtectedPath('/account')).toBe(true);
    expect(isHardProtectedPath('/my-account')).toBe(true);
    expect(isHardProtectedPath('/campaigns')).toBe(false);
    expect(isHardProtectedPath('/')).toBe(false);
  });

  it('rewrites a signed-in /account visit onto the account page', () => {
    const config = readFileSync(path.join(import.meta.dirname, '../../../next.config.ts'), 'utf8');
    expect(config).toMatch(
      /beforeFiles:\s*\[[\s\S]*source:\s*'\/account',\s*destination:\s*'\/my-account'/,
    );
  });
});
