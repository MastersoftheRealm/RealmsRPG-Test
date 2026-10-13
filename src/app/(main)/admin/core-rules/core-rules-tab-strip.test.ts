import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const page = readFileSync(path.join(import.meta.dirname, 'page.tsx'), 'utf8');
const globals = readFileSync(path.join(import.meta.dirname, '../../../globals.css'), 'utf8');

describe('Admin Core Rules tab strip (86e3jzu59)', () => {
  it('wraps the tab list so labels are not clipped under a chevron', () => {
    expect(page).toContain('className="admin-core-rules-tabs"');
    expect(globals).toMatch(/\.admin-core-rules-tabs \.tab-nav-list\s*\{[^}]*flex-wrap:\s*wrap/);
    expect(globals).toMatch(/\.admin-core-rules-tabs \.tab-nav-list\s*\{[^}]*overflow:\s*visible/);
    expect(globals).toMatch(
      /\.admin-core-rules-tabs \.tab-nav-list\s*\{[^}]*scrollbar-width:\s*none/,
    );
  });
});
