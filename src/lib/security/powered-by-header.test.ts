import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('next.config poweredByHeader (86e3ka84y)', () => {
  it('disables the x-powered-by framework fingerprint', () => {
    const configPath = path.resolve(__dirname, '../../../next.config.ts');
    const source = readFileSync(configPath, 'utf8');
    expect(source).toMatch(/poweredByHeader:\s*false/);
  });
});
