import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const page = readFileSync(path.join(import.meta.dirname, 'page.tsx'), 'utf8');

describe('Admin Core Rules back control (86e3jzu5g)', () => {
  it('uses the same Back to Admin control as other admin pages', () => {
    expect(page).not.toContain('ChevronLeft');
    expect(page).toContain('variant="secondary"');
    expect(page).toContain('<Link href="/admin">← Back to Admin</Link>');
  });
});
