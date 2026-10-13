import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./notes-tab.tsx', import.meta.url), 'utf8');

describe('note header collapse (86e3jvzt3)', () => {
  it('keeps rename on the name and leaves the rest of the header to collapse', () => {
    expect(source).toContain('onClick={() => setIsExpanded(!isExpanded)}');
    expect(source).toContain('<div className="flex min-w-0 flex-1 items-center">');
    expect(source).toContain(
      'className="flex min-w-0 max-w-full cursor-pointer items-center gap-1 text-sm font-medium text-text-primary hover:text-primary-fg-hover"',
    );
    expect(source).not.toContain(
      'className="flex min-w-0 flex-1 cursor-pointer items-center gap-1 text-sm font-medium text-text-primary hover:text-primary-fg-hover"',
    );
  });
});
