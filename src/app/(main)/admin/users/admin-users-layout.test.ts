import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(path.join(import.meta.dirname, 'page.tsx'), 'utf8');

describe('Admin users layout (86e3jzu53)', () => {
  it('keeps Effective limits and Change role in a wrapping card, not a wide table', () => {
    expect(source).not.toMatch(/<table/);
    expect(source).not.toMatch(/TableScroll/);
    expect(source).not.toMatch(/whitespace-nowrap/);
    expect(source).toMatch(/Effective limits/);
    expect(source).toMatch(/label="Change role"/);
    expect(source).toMatch(
      /grid min-w-0 gap-4 rounded-lg border border-border bg-surface p-4 lg:grid-cols-\[minmax\(0,1fr\)_minmax\(0,12\.5rem\)\]/,
    );
    expect(source).toMatch(/flex min-w-0 flex-wrap gap-x-3 gap-y-1/);
  });
});
