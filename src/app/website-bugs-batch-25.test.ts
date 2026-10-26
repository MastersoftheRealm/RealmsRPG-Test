import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROBOTS_DISALLOW } from '@/app/robots';

const nextConfig = readFileSync(path.join(process.cwd(), 'next.config.ts'), 'utf8');

describe('website bugs batch 25 — Search Console redirect aliases (1dfe8wf24w1)', () => {
  it('uses permanent redirects for legacy /browse and /signup aliases', () => {
    expect(nextConfig).toMatch(
      /source:\s*'\/browse',\s*destination:\s*'\/library',\s*permanent:\s*true/,
    );
    expect(nextConfig).toMatch(
      /source:\s*'\/signup',\s*destination:\s*'\/register',\s*permanent:\s*true/,
    );
  });

  it('disallows legacy redirect-only paths in robots.txt', () => {
    expect(ROBOTS_DISALLOW).toEqual(
      expect.arrayContaining([
        '/browse',
        '/signup',
        '/encounter-tracker',
        '/crafting/new',
        '/characters/new/advanced',
      ]),
    );
  });
});
