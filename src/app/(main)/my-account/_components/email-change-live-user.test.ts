import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Email changes must confirm the session with Auth before updateUser.
 * A locally verified access token is not enough for a revoked or banned user.
 */
const source = readFileSync(path.join(import.meta.dirname, 'use-my-account-page.ts'), 'utf8');

describe('email change live user check', () => {
  it('calls getUser before updateUser({ email })', () => {
    const start = source.indexOf('const handleEmailChange');
    const end = source.indexOf('const handlePasswordChange');
    const handler = source.slice(start, end);

    expect(handler).toContain('supabase.auth.getUser()');
    expect(handler.indexOf('supabase.auth.getUser()')).toBeLessThan(
      handler.indexOf('updateUser({ email:'),
    );
  });
});
