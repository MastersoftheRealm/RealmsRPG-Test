import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const helpers = readFileSync(new URL('./CreatureCreatorHelpers.tsx', import.meta.url), 'utf8');
const traits = readFileSync(
  new URL('./creature-creator-editor-traits-section.tsx', import.meta.url),
  'utf8',
);

describe('creature creator AddItemDropdown phone width (86e3ptm8f)', () => {
  it('lets the select shrink inside a flex row so long sense options do not overflow', () => {
    expect(helpers).toMatch(/flex min-w-0 items-center gap-2/);
    expect(helpers).toMatch(/w-0 min-w-0 flex-1/);
  });

  it('bounds Senses and Movement columns inside the card grid', () => {
    expect(traits).toContain('grid min-w-0 gap-4 md:grid-cols-2');
    const sensesMovement = traits.slice(traits.indexOf('Senses & Movement'));
    expect(sensesMovement.match(/className="min-w-0"/g)?.length).toBeGreaterThanOrEqual(2);
  });
});
