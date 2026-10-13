import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  SHEET_DESKTOP_GRID_CLASSNAME,
  archetypeStackedWeaponNamePx,
  sheetSkillNameCellPx,
  sheetThreeColumnFits,
  sheetWeaponNameCellPx,
} from './sheet-desktop-columns';

const sheetBody = readFileSync(path.join(import.meta.dirname, 'character-sheet-body.tsx'), 'utf8');
const weapons = readFileSync(
  path.join(import.meta.dirname, '../patterns/list/quick-armaments-sections.tsx'),
  'utf8',
);

describe('sheet columns from 1024 to 1440 (86e3jvv37)', () => {
  it('does not use the quarter-width tracks that collapsed the weapon name', () => {
    expect(sheetBody).toContain('SHEET_DESKTOP_GRID_CLASSNAME');
    expect(sheetBody).not.toContain('lg:grid-cols-[1fr_1fr_2fr]');
    expect(sheetBody).not.toContain('md:items-stretch');
    expect(SHEET_DESKTOP_GRID_CLASSNAME).toContain('md:items-start');
    expect(SHEET_DESKTOP_GRID_CLASSNAME).toContain(
      'xl:grid-cols-[minmax(22.5rem,1fr)_minmax(22.5rem,1fr)_minmax(26rem,2fr)]',
    );
  });

  it('stacks through 1024 and through 110% of a 1280 window', () => {
    expect(sheetThreeColumnFits(1024)).toBe(false);
    expect(sheetThreeColumnFits(1164)).toBe(false);
    expect(sheetWeaponNameCellPx(1024)).toBeNull();
    expect(sheetWeaponNameCellPx(1164)).toBeNull();
  });

  it('keeps a 100px weapon name and the Skills Bonus column from 1280 through 1440', () => {
    for (const viewport of [1280, 1440, 1920]) {
      expect(sheetThreeColumnFits(viewport)).toBe(true);
      expect(sheetWeaponNameCellPx(viewport)).toBeGreaterThanOrEqual(100);
      expect(sheetSkillNameCellPx(viewport)).toBeGreaterThan(0);
    }
  });

  it('gives the weapons table one col per header so Name is not Range', () => {
    const table = weapons.slice(weapons.indexOf('export function QuickWeaponsTable'));
    const colgroup = table.slice(table.indexOf('<colgroup>'), table.indexOf('</colgroup>'));
    expect(colgroup.match(/<col\b/g)).toHaveLength(4);
    expect(table).toContain('min-w-[18rem]');
    expect(table).toContain('table-fixed');
  });

  it('floors the weapons table at 18rem so a 320px card keeps a 100px name', () => {
    const table = weapons.slice(weapons.indexOf('export function QuickWeaponsTable'));
    const scroll = table.slice(table.indexOf('<TableScroll>'), table.indexOf('</TableScroll>'));
    const wrapperAt = scroll.indexOf('className="min-w-[18rem]"');
    const tableAt = scroll.indexOf('<table');
    expect(wrapperAt).toBeGreaterThanOrEqual(0);
    expect(tableAt).toBeGreaterThan(wrapperAt);
    expect(scroll).not.toContain('min-w-[18rem] table-fixed');
    expect(archetypeStackedWeaponNamePx(320)).toBeGreaterThanOrEqual(100);
    expect(archetypeStackedWeaponNamePx(375)).toBeGreaterThanOrEqual(100);
  });
});
