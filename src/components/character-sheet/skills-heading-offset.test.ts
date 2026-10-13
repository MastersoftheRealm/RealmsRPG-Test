import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('skills heading stays below the sticky section tabs (86e3jv3yy)', () => {
  it('offsets the Skills heading by the tab strip on narrow widths', () => {
    const source = readFileSync(path.join(import.meta.dirname, 'skills-section.tsx'), 'utf8');
    const headingAt = source.indexOf('>Skills</h2>');
    const row = source.slice(Math.max(0, headingAt - 500), headingAt);

    expect(row).toContain('max-md:sticky');
    expect(row).toContain('max-md:top-12');
    expect(row).toContain('max-md:scroll-mt-12');
    expect(row).toContain('max-md:bg-surface');
  });
});
