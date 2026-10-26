import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('signed-in /signup (86e3jtwyr)', () => {
  it('sends /signup to the registration page instead of a 404', () => {
    const config = readFileSync(path.join(import.meta.dirname, '../../../next.config.ts'), 'utf8');
    expect(config).toMatch(
      /source:\s*'\/signup',\s*destination:\s*'\/register',\s*permanent:\s*true/,
    );
  });
});
