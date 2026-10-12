/**
 * Sheet header grid (86e3jvv3j / C5).
 *
 * Identity | vitals | resources used to switch to three columns at `lg` (1024).
 * At that width the tool container leaves too little room for Health/Energy
 * steppers and the Action Points column stretches to an empty tower.
 *
 * Three columns start at `xl` (1280), matching the sheet body (86e3jvv37).
 * From `md` through `lg`, identity and resources share the top row and vitals
 * span full width with four compact tiles across.
 */

import { sheetDesktopContentWidth } from './sheet-desktop-columns';

/** `minmax(16rem, 1.1fr)` — Health/Energy row plus Action Points. */
export const SHEET_HEADER_RESOURCES_MIN_REM = 16;
/** Middle vitals cluster: 2×2 LargeStatBlock at 6.25rem (+ gap). */
export const SHEET_HEADER_VITALS_CLUSTER_MIN_REM = 13.5;
/** Portrait + minimum identity text beside it. */
export const SHEET_HEADER_IDENTITY_MIN_REM = 18;

const RESOURCES_MIN_PX = SHEET_HEADER_RESOURCES_MIN_REM * 16;
const VITALS_MIN_PX = SHEET_HEADER_VITALS_CLUSTER_MIN_REM * 16;
const IDENTITY_MIN_PX = SHEET_HEADER_IDENTITY_MIN_REM * 16;
const HEADER_COLUMN_GAP_PX = 20;

export const SHEET_HEADER_GRID_CLASSNAME =
  'grid min-w-0 grid-cols-1 items-stretch gap-4 md:grid-cols-2 md:items-start md:gap-5 xl:grid-cols-[minmax(0,1.5fr)_auto_minmax(16rem,1.1fr)] xl:items-center xl:gap-6';

export const SHEET_HEADER_STATS_WRAP_CLASSNAME =
  'flex min-w-0 justify-center md:col-span-2 xl:col-span-1 xl:col-start-2 xl:row-start-1';

/** Four vitals: 2×2 on phones, four-across when the cluster is full-width, 2×2 in the middle column. */
export function sheetHeaderVitalGridClass(vitalCount: number): string {
  if (vitalCount >= 4) {
    return 'grid w-max max-w-full grid-cols-2 gap-2 md:grid-cols-4 md:gap-2.5 xl:grid-cols-2';
  }
  if (vitalCount === 3) {
    return 'grid w-max max-w-full grid-cols-2 gap-2 sm:grid-cols-3 md:gap-2.5';
  }
  return 'grid w-max max-w-full grid-cols-2 gap-2 md:gap-2.5';
}

export function sheetHeaderThreeColumnFits(viewportPx: number): boolean {
  if (viewportPx < 1280) return false;
  const need = IDENTITY_MIN_PX + VITALS_MIN_PX + RESOURCES_MIN_PX + HEADER_COLUMN_GAP_PX * 2;
  return sheetDesktopContentWidth(viewportPx) >= need;
}
