import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('item creator property option row (86e3jx9gf)', () => {
  it('wraps the level stepper so the increment is not clipped at phone width', () => {
    const source = readFileSync(path.join(import.meta.dirname, 'item-creator-helpers.tsx'), 'utf8');
    const optionStart = source.indexOf('{hasOption &&');
    const optionEnd = source.indexOf('property.op_1_desc', optionStart);
    const option = source.slice(optionStart, optionEnd);

    expect(optionStart).toBeGreaterThan(-1);
    expect(option).toContain('flex flex-wrap items-center justify-between gap-x-3 gap-y-2');
    expect(option).toContain('flex min-w-0 flex-wrap');
    expect(option).toContain('whitespace-nowrap');
    expect(option).toContain('className="shrink-0"');
    expect(option).not.toContain('flex items-center justify-between"');
  });
});
