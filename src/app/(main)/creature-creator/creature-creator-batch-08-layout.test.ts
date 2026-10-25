import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const loadout = readFileSync(
  new URL('./creature-creator-editor-loadout-sections.tsx', import.meta.url),
  'utf8',
);
const page = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
const section = readFileSync(
  new URL('../../../components/creator/collapsible-section.tsx', import.meta.url),
  'utf8',
);
const summary = readFileSync(
  new URL('../../../components/creator/creator-summary-panel.tsx', import.meta.url),
  'utf8',
);

describe('creature creator batch 8 layout (86e3jzdvr / 86e3jzdvd / 86e3jzdv0 / 86e3jywdc / 86e3jxgx8)', () => {
  it('powers table keeps NAME left-aligned and widens ACTION (86e3jzdvr)', () => {
    expect(loadout).toContain("label: 'NAME', width: '1.4fr', align: 'left'");
    expect(loadout).toContain('CREATURE_POWER_LIST_GRID');
    expect(loadout).toContain('allowMultiline: true');
  });

  it('feat section badge uses remaining points like the summary (86e3jzdvd)', () => {
    expect(loadout).toContain('spent: stats.featRemaining, total: stats.featPoints');
  });

  it('Add Power modal uses shared GLR grid and headers (86e3jzdv0)', () => {
    expect(page).toContain("getListHeaderColumns('power')");
    expect(page).toContain("getModalGridColumns('power')");
  });

  it('optional section Remove sits before the collapse chevron (86e3jywdc)', () => {
    const header = section.slice(section.indexOf('<Card'));
    const removeIdx = header.indexOf('Remove');
    const chevronIdx = header.indexOf('ChevronUp');
    const rightSlotIdx = header.indexOf('{rightSlot}');
    expect(removeIdx).toBeGreaterThan(-1);
    expect(chevronIdx).toBeGreaterThan(removeIdx);
    expect(rightSlotIdx).toBeGreaterThan(chevronIdx);
    expect(header).toContain('basis-full');
    expect(header).toContain('max-lg:w-full');
    expect(header.indexOf('basis-full')).toBeGreaterThan(chevronIdx);
  });

  it('summary resource boxes use a 2-column grid on narrow viewports (86e3jxgx8)', () => {
    expect(summary).toContain('grid grid-cols-2 gap-2 lg:grid-cols-5');
  });
});
