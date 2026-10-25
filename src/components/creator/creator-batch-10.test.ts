import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const section = readFileSync(new URL('./collapsible-section.tsx', import.meta.url), 'utf8');
const loadModal = readFileSync(new URL('./LoadFromLibraryModal.tsx', import.meta.url), 'utf8');
const weaponShield = readFileSync(
  new URL('../../app/(main)/item-creator/item-creator-editor-weapon-shield.tsx', import.meta.url),
  'utf8',
);
const armor = readFileSync(
  new URL('../../app/(main)/item-creator/item-creator-editor-armor.tsx', import.meta.url),
  'utf8',
);
const button = readFileSync(new URL('../ui/button.tsx', import.meta.url), 'utf8');
const segmented = readFileSync(
  new URL('../patterns/chrome/segmented-control.tsx', import.meta.url),
  'utf8',
);
const slider = readFileSync(
  new URL('../patterns/select/powered-martial-slider.tsx', import.meta.url),
  'utf8',
);
const loadout = readFileSync(
  new URL(
    '../../app/(main)/creature-creator/creature-creator-editor-loadout-sections.tsx',
    import.meta.url,
  ),
  'utf8',
);
const usmToolbar = readFileSync(
  new URL('../patterns/select/unified-selection-modal-toolbar.tsx', import.meta.url),
  'utf8',
);

describe('creator batch 10 (86e3jyweu / 86e3jywdp / 86e3jywe4 / 86e3jyh5h)', () => {
  it('aligns collapse chevrons and optional Remove at md (86e3jyweu)', () => {
    expect(section).toContain('items-start');
    expect(section).toContain('min-w-[5.75rem] justify-end');
    expect(section).toContain('whitespace-nowrap text-danger-fg');
  });

  it('stabilizes creator Load modal height at md to avoid layout jump (86e3jyweu)', () => {
    expect(loadModal).toContain('md:min-h-[60vh]');
    expect(loadModal).toContain('md:max-h-[60vh]');
  });

  it('stacks weapon configuration groups before lg (86e3jyweu)', () => {
    expect(weaponShield).toContain('flex-col gap-6 lg:flex-row lg:flex-wrap lg:items-center');
  });

  it('uses single-column armor configuration below lg (86e3jywe4)', () => {
    // 20rem auto-fit stays one column until the row can hold two tracks.
    // That is wider than the creator form below lg. Do not use lg:grid-cols-3.
    expect(armor).toContain(
      'grid grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))] gap-6',
    );
    expect(armor).not.toContain('lg:grid-cols-3');
    expect(armor).not.toContain('md:grid-cols-3');
    expect(armor).not.toMatch(/\b(?:sm|md):grid-cols-/);
  });

  it('dark theme secondary buttons and load tabs read as active (86e3jywdp)', () => {
    expect(button).toContain('dark:text-text-primary');
    expect(segmented).toContain('dark:text-text-primary dark:hover:bg-surface-alt');
  });

  it('hides duplicate slider tick at the thumb and wraps Add Power meta (86e3jyh5h)', () => {
    expect(slider).toContain("tickValue === sliderValue ? 'opacity-0'");
    expect(loadout).toContain('flex flex-wrap items-baseline gap-x-2 gap-y-1');
    expect(loadout).toContain('whitespace-nowrap');
    expect(usmToolbar).toContain('toolbarStartClassName="min-w-0 basis-full sm:basis-0 sm:flex-1"');
  });
});
