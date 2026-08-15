import { describe, expect, it } from 'vitest';
import robots, { ROBOTS_DISALLOW } from '@/app/robots';
import sitemap, { SITEMAP_PATHS } from '@/app/sitemap';

describe('robots / sitemap (TASK-771)', () => {
  it('disallows dev, auth, api, admin, and account paths', () => {
    expect(ROBOTS_DISALLOW).toEqual(
      expect.arrayContaining(['/dev/', '/login', '/register', '/api/', '/admin', '/my-account']),
    );
    const doc = robots();
    const rules = Array.isArray(doc.rules) ? doc.rules[0] : doc.rules;
    expect(rules?.disallow).toEqual([...ROBOTS_DISALLOW]);
    expect(String(doc.sitemap)).toMatch(/\/sitemap\.xml$/);
  });

  it('lists public marketing routes and omits /dev and /login', () => {
    expect(SITEMAP_PATHS).toContain('/');
    expect(SITEMAP_PATHS).toContain('/rules');
    expect(SITEMAP_PATHS).not.toContain('/dev/styleguide');
    expect(SITEMAP_PATHS).not.toContain('/login');
    const entries = sitemap();
    expect(entries.map((e) => e.url).every((url) => url.startsWith('http'))).toBe(true);
    expect(entries).toHaveLength(SITEMAP_PATHS.length);
  });
});
