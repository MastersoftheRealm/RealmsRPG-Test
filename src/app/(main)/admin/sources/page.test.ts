import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { adminSourcesRowDetailLine } from './admin-sources-copy';

describe('Admin Sources page', () => {
  it('uses a standard touch target for row remove controls', () => {
    const page = readFileSync(join(process.cwd(), 'src/app/(main)/admin/sources/page.tsx'), 'utf8');
    expect(page).toMatch(
      /<IconButton[\s\S]*?size="md"[\s\S]*?adminSourcesRemoveButtonLabel\(itemName, selectedSource\)/,
    );
  });

  it('formats row detail copy with the stored field name', () => {
    expect(adminSourcesRowDetailLine('feat_lvl', '3')).toBe('feat_lvl 3');
  });
});
