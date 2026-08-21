import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(path.join(import.meta.dirname, 'roll-log.tsx'), 'utf8');

describe('RollLog layout (TASK-826 / C6)', () => {
  it('unmounts the closed panel instead of laying out a zero-size 360px card', () => {
    expect(source).toMatch(/\{isOpen \? \(/);
    expect(source).toMatch(/w-\[min\(22\.5rem,calc\(100svw-2\*var\(--dock-gap\)\)\)\]/);
    expect(source).not.toMatch(/w-\[360px\]/);
    expect(source).not.toMatch(/pointer-events-none h-0 w-0 max-w-0/);
  });
});
