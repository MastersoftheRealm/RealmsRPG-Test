import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(path.join(import.meta.dirname, 'table-scroll.tsx'), 'utf8');
const mdxSource = readFileSync(path.join(import.meta.dirname, '../../mdx-components.tsx'), 'utf8');

describe('TableScroll (TASK-826 / C6)', () => {
  it('is a positioned overflow container so sr-only headers cannot expand the page', () => {
    expect(source).toMatch(/relative max-w-full min-w-0 overflow-x-auto/);
  });

  it('is the MDX table overflow wrapper (no local overflow-x-auto fork)', () => {
    expect(mdxSource).toMatch(/from ['"]@\/components\/ui\/table-scroll['"]/);
    expect(mdxSource).toMatch(/<TableScroll/);
    expect(mdxSource).not.toMatch(/overflow-x-auto/);
  });
});
