import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./archetype-section.tsx', import.meta.url), 'utf8');

describe('attack bonus table header (86e3k0cm9)', () => {
  it('names the first column instead of leaving an empty th', () => {
    expect(source).toContain('<span className="sr-only">Ability</span>');
    expect(source).not.toMatch(/<th className="py-1 text-left"><\/th>/);
  });
});
