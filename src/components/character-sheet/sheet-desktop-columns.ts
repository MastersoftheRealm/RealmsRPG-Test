/**
 * Sheet body columns (86e3jvv37 / C5).
 *
 * Skills | Archetype | Library used to become `1fr 1fr 2fr` at `lg` (1024).
 * Each side track was then about a quarter of the tool container, so from
 * 1024 through 1440 the Weapons name cell collapsed (measured 38px at 1440)
 * and the Skills Bonus column was clipped. 1920 was fine because the name
 * cell was about 100px.
 *
 * Three columns start at `xl` (1280), and only with minimum tracks that keep
 * a 100px weapon name and the Bonus column inside the card. Below that the
 * sections stack. The tool container is `--container-full-tool` (1600px)
 * with `lg:px-8`.
 */

const REM_PX = 16;
const SHEET_TOOL_MAX_PX = 1600;
const SHEET_LG_PAD_PX = 32;
const SHEET_COLUMN_GAP_PX = 16;

/** `minmax(22.5rem, 1fr)` — card padding plus a 100px name and the weapon metric columns. */
export const SHEET_SIDE_TRACK_MIN_REM = 22.5;
/** `minmax(26rem, 2fr)` — Library stays the wide track. */
export const SHEET_LIBRARY_TRACK_MIN_REM = 26;

const SIDE_MIN_PX = SHEET_SIDE_TRACK_MIN_REM * REM_PX;
const LIBRARY_MIN_PX = SHEET_LIBRARY_TRACK_MIN_REM * REM_PX;

/** Archetype card `md:p-6` plus the weapons block `p-3`. */
const WEAPONS_CHROME_PX = 24 * 2 + 12 * 2;
/** Range 3.75rem + Attack 3.75rem + Damage 4.25rem. */
const WEAPON_METRIC_PX = (3.75 + 3.75 + 4.25) * REM_PX;
/** Skills card `md:p-6`. Prof 2.5rem + Ability 4rem + Bonus 5rem. */
const SKILLS_CHROME_PX = 24 * 2;
const SKILL_FIXED_PX = (2.5 + 4 + 5) * REM_PX;

export const SHEET_DESKTOP_GRID_CLASSNAME =
  'md:grid md:snap-none md:grid-cols-1 md:items-start md:overflow-visible md:pb-0 xl:grid-cols-[minmax(22.5rem,1fr)_minmax(22.5rem,1fr)_minmax(26rem,2fr)]';

/** Content box inside the sheet `PageContainer` (`size="tool"`). */
export function sheetDesktopContentWidth(viewportPx: number): number {
  const pad = viewportPx >= 1024 ? SHEET_LG_PAD_PX * 2 : viewportPx >= 640 ? 48 : 32;
  return Math.min(viewportPx, SHEET_TOOL_MAX_PX) - pad;
}

/** True when Skills, Archetype, and Library can sit side by side without crushing either table. */
export function sheetThreeColumnFits(viewportPx: number): boolean {
  const need = SIDE_MIN_PX * 2 + LIBRARY_MIN_PX + SHEET_COLUMN_GAP_PX * 2;
  return sheetDesktopContentWidth(viewportPx) >= need;
}

export function sheetColumnTracks(
  viewportPx: number,
): { skills: number; archetype: number; library: number } | null {
  if (!sheetThreeColumnFits(viewportPx) || viewportPx < 1280) return null;
  const tracks = sheetDesktopContentWidth(viewportPx) - SHEET_COLUMN_GAP_PX * 2;
  const free = tracks - SIDE_MIN_PX * 2 - LIBRARY_MIN_PX;
  const fr = free / 4;
  return {
    skills: SIDE_MIN_PX + fr,
    archetype: SIDE_MIN_PX + fr,
    library: LIBRARY_MIN_PX + fr * 2,
  };
}

/** Weapons name cell after metric columns. Null when the three-column grid is off. */
export function sheetWeaponNameCellPx(viewportPx: number): number | null {
  const tracks = sheetColumnTracks(viewportPx);
  if (!tracks) return null;
  return tracks.archetype - WEAPONS_CHROME_PX - WEAPON_METRIC_PX;
}

/** Room left for a skill name once Prof, Ability, and Bonus keep their widths. */
export function sheetSkillNameCellPx(viewportPx: number): number | null {
  const tracks = sheetColumnTracks(viewportPx);
  if (!tracks) return null;
  return tracks.skills - SKILLS_CHROME_PX - SKILL_FIXED_PX;
}
