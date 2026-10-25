import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const section = readFileSync(new URL('./collapsible-section.tsx', import.meta.url), 'utf8');
const loadModal = readFileSync(new URL('./LoadFromLibraryModal.tsx', import.meta.url), 'utf8');
const creaturePage = readFileSync(
  new URL('../../app/(main)/creature-creator/page.tsx', import.meta.url),
  'utf8',
);
const weaponShield = readFileSync(
  new URL('../../app/(main)/item-creator/item-creator-editor-weapon-shield.tsx', import.meta.url),
  'utf8',
);

const CREATURE_LOAD_PLACEHOLDER = 'Search creatures by name, type, or level...';

/**
 * Full-screen Load search text box. Prod at 375 measured 285px of text against
 * 297px for the creature placeholder (px-4 + 1px border + pl-10 + pr-4).
 */
function loadSearchTextBox(viewport: number): number {
  const modalPad = 8; // max-sm:px-2
  const border = 1;
  const padLeft = 32; // max-sm:pl-8
  const padRight = 8; // max-sm:pr-2
  return viewport - modalPad * 2 - border * 2 - padLeft - padRight;
}

describe('optional section chevron column (86e3jyweu)', () => {
  it('keeps the chevron in the last column whether or not the header has extra controls', () => {
    const header = section.slice(section.indexOf('<Card'));
    const rightSlotIdx = header.indexOf('{rightSlot}');
    const chevronIdx = header.indexOf('ChevronDown');
    expect(rightSlotIdx).toBeGreaterThan(-1);
    expect(chevronIdx).toBeGreaterThan(rightSlotIdx);
    expect(header.indexOf('Remove')).toBeLessThan(chevronIdx);
    expect(header).toContain("actionsOnOwnRow && 'flex-wrap'");
    expect(header).toContain('max-lg:order-last');
    expect(header).toContain('basis-full');
    expect(header).toContain('max-lg:w-full');
    expect(header).toContain('min-w-[5.75rem] justify-end');
    expect(header).not.toContain("'ml-auto flex flex-shrink-0 items-center self-start pt-0.5'");
  });
});

describe('Load search placeholder width (86e3jyh5h)', () => {
  it('keeps the creature Load placeholder and gives it at least 297px of text at 375', () => {
    expect(creaturePage).toContain(`searchPlaceholder: '${CREATURE_LOAD_PLACEHOLDER}'`);
    expect(CREATURE_LOAD_PLACEHOLDER).toBe('Search creatures by name, type, or level...');
    expect(loadModal).toContain('max-sm:px-2');
    expect(loadModal).toContain('placeholderInputClassName="max-sm:pl-8 max-sm:pr-2"');
    expect(loadModal).toContain('md:min-h-[60vh]');
    expect(loadModal).toContain('md:max-h-[60vh]');
    expect(loadSearchTextBox(375)).toBeGreaterThanOrEqual(297);
    expect(loadSearchTextBox(360)).toBeGreaterThanOrEqual(297);
  });

  it('leaves Weapon Configuration rows on the passing layout', () => {
    expect(weaponShield).toContain('flex-col gap-6 lg:flex-row lg:flex-wrap lg:items-center');
  });
});
