import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  SHEET_HEADER_GRID_CLASSNAME,
  SHEET_HEADER_STATS_WRAP_CLASSNAME,
  sheetHeaderThreeColumnFits,
  sheetHeaderVitalGridClass,
} from './sheet-header-layout';

const sheetHeader = readFileSync(path.join(import.meta.dirname, 'sheet-header.tsx'), 'utf8');

describe('sheet header layout at 1024 (86e3jvv3j)', () => {
  it('wires the shared grid classes instead of lg three-column tracks', () => {
    expect(sheetHeader).toContain('SHEET_HEADER_GRID_CLASSNAME');
    expect(sheetHeader).toContain('SHEET_HEADER_STATS_WRAP_CLASSNAME');
    expect(sheetHeader).toContain('sheetHeaderVitalGridClass');
    expect(SHEET_HEADER_GRID_CLASSNAME).not.toContain('lg:grid-cols-[minmax');
    expect(SHEET_HEADER_GRID_CLASSNAME).toContain(
      'xl:grid-cols-[minmax(0,1.5fr)_auto_minmax(16rem,1.1fr)]',
    );
    expect(SHEET_HEADER_STATS_WRAP_CLASSNAME).toContain('md:col-span-2');
    expect(SHEET_HEADER_STATS_WRAP_CLASSNAME).toContain('xl:col-span-1');
    expect(SHEET_HEADER_STATS_WRAP_CLASSNAME).not.toContain('lg:col-span');
  });

  it('keeps two rows through 1024 and enables three columns from 1280', () => {
    expect(sheetHeaderThreeColumnFits(1024)).toBe(false);
    expect(sheetHeaderThreeColumnFits(1279)).toBe(false);
    expect(sheetHeaderThreeColumnFits(1280)).toBe(true);
    expect(sheetHeaderThreeColumnFits(1440)).toBe(true);
  });

  it('uses four-across vitals when the cluster spans the header width', () => {
    expect(sheetHeaderVitalGridClass(4)).toContain('md:grid-cols-4');
    expect(sheetHeaderVitalGridClass(4)).toContain('xl:grid-cols-2');
    expect(sheetHeaderVitalGridClass(4)).not.toContain('lg:grid-cols');
  });
});
