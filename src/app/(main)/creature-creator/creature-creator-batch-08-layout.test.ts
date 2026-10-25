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
    expect(rightSlotIdx).toBeGreaterThan(-1);
    expect(chevronIdx).toBeGreaterThan(rightSlotIdx);
    expect(header).toContain('basis-full');
    expect(header).toContain('max-lg:w-full');
    expect(header).toContain('max-lg:order-last');
    expect(header.indexOf('max-lg:order-last')).toBeLessThan(chevronIdx);
  });

  it('summary resource tiles follow the panel width, not five viewport columns (86e3jxgx8)', () => {
    const boxes = summary.slice(
      summary.indexOf('resourceBoxes &&'),
      summary.indexOf('Badge (Rarity'),
    );
    expect(boxes).toContain('repeat(auto-fit,minmax(8rem,1fr))');
    expect(boxes).toContain('break-normal');
    expect(boxes).not.toContain('lg:grid-cols-5');
    expect(boxes).not.toContain('break-words');
    expect(boxes).not.toContain('overflow-x-auto');
  });

  it('optional Remove is spaced clear of the collapse chevron (86e3jywdc)', () => {
    const header = section.slice(section.indexOf('<Card'));
    const gapIdx = header.indexOf('gap-6');
    const removeIdx = header.indexOf('Remove');
    const chevronIdx = header.indexOf('ChevronUp');
    expect(gapIdx).toBeGreaterThan(-1);
    expect(removeIdx).toBeGreaterThan(gapIdx);
    expect(chevronIdx).toBeGreaterThan(removeIdx);
  });

  it('feat badge danger colour treats negative remaining as over budget', () => {
    expect(section).toContain('points.spent < 0 || points.spent > points.total');
    expect(loadout).toContain('spent: stats.featRemaining, total: stats.featPoints');
  });
});
