import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('new character chooser at phone width (86e3juh1g)', () => {
  it('lets the Guided card shrink so the badge and description stay on screen', () => {
    const source = readFileSync(path.join(import.meta.dirname, 'page.tsx'), 'utf8');
    expect(source).toMatch(/grid min-w-0 max-w-4xl/);
    expect(source).toMatch(/min-h-\[16rem\] min-w-0 flex-col/);
    expect(source).toMatch(/flex w-full min-w-0 flex-wrap items-center gap-3/);
    expect(source).not.toMatch(/whitespace-nowrap/);
    expect(source).toMatch(/whitespace-normal/);
  });
});
