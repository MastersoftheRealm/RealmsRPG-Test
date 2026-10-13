import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('help tooltip click-through (86e3jt15p)', () => {
  it('lets clicks pass through non-interactive help panels', () => {
    const source = readFileSync(path.join(import.meta.dirname, 'floating-help.tsx'), 'utf8');
    expect(source).toContain("interactive ? 'pointer-events-auto' : 'pointer-events-none'");
  });
});
