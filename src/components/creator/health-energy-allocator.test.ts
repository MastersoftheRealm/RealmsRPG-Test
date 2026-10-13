import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const allocator = readFileSync(
  path.join(import.meta.dirname, 'health-energy-allocator.tsx'),
  'utf8',
);
const pointStatus = readFileSync(
  path.join(import.meta.dirname, '../patterns/chrome/point-status.tsx'),
  'utf8',
);
const resourceInput = readFileSync(
  path.join(import.meta.dirname, '../character-sheet/sheet-resource-input.tsx'),
  'utf8',
);

describe('sheet Health/Energy allocation row (86e3juy8k)', () => {
  it('stacks the sheet controls and names the pool badge as remaining', () => {
    const inline = allocator.slice(allocator.indexOf("variant === 'inline'"));
    expect(inline).not.toContain('sm:flex-row');
    expect(inline).toContain('flex min-w-0 flex-col gap-3');
    expect(inline).toContain('flex min-w-0 flex-wrap items-center gap-2');
    expect(allocator).toContain("label={compactLabels ? 'remaining' : undefined}");
    expect(pointStatus).toContain('{label ? <span className="font-normal"> {label}</span> : null}');
  });

  it('lets Health and Energy steppers wrap inside their cards', () => {
    expect(resourceInput).toContain('flex min-w-0 flex-wrap items-center gap-2');
    expect(resourceInput).not.toMatch(/inputRef[\s\S]{0,400}flex-nowrap/);
  });
});
