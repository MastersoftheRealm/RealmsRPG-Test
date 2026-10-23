import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Repro (86e3q9vhq): /encounters showed the signed-out local banner while the
 * visitor was still signed in, because `user` is null until auth resolves.
 */
const pageSource = readFileSync(path.join(import.meta.dirname, 'page.tsx'), 'utf8');
const listHookSource = readFileSync(
  path.join(import.meta.dirname, '../../../hooks/use-encounters.ts'),
  'utf8',
);

describe('encounters signed-out banner (86e3q9vhq)', () => {
  it('does not treat an unresolved session as signed out', () => {
    expect(pageSource).toContain('using encounters locally');
    expect(pageSource).toMatch(/initialized && !user && \(/);
    expect(pageSource).toMatch(/!initialized \|\| isLoading/);
  });

  it('does not load the guest encounter list before auth resolves', () => {
    expect(listHookSource).toMatch(/enabled:\s*initialized/);
  });
});
