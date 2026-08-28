import type { ChipData } from '@/components/patterns/list/grid-list-row';
import type { AllowUndefinedOptionals } from '@/lib/utils/exact-optional';

interface LeveledFeatLikeFields {
  id: string | number;
  name?: string | undefined;
  description?: string | undefined;
  feat_lvl?: number | undefined;
  base_feat_id?: string | undefined;
  lvl_req?: number | undefined;
  uses_per_rec?: number | undefined;
  rec_period?: string | undefined;
}

export type LeveledFeatLike = AllowUndefinedOptionals<LeveledFeatLikeFields>;

export interface FeatFamily<T extends LeveledFeatLike> {
  familyId: string;
  main: T;
  levels: T[];
}

export function getFeatLevel(feat: LeveledFeatLike | undefined): number {
  const lvl = feat?.feat_lvl;
  return lvl != null && lvl > 0 ? lvl : 1;
}

export function getFeatFamilyId(feat: LeveledFeatLike): string {
  return feat.base_feat_id ? String(feat.base_feat_id) : String(feat.id);
}

/** Roman suffixes on feat names (longest first for parsing). Matches codex migration pattern. */
const FEAT_ROMAN_SUFFIXES = ['XI', 'X', 'IX', 'VIII', 'VII', 'VI', 'V', 'IV', 'III', 'II'] as const;

const ROMAN_TO_LEVEL: Record<string, number> = {
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
  VI: 6,
  VII: 7,
  VIII: 8,
  IX: 9,
  X: 10,
  XI: 11,
};

function romanSuffixToLevel(suffix: string): number | null {
  return ROMAN_TO_LEVEL[suffix.toUpperCase()] ?? null;
}

export function levelToRomanNumeral(level: number): string {
  if (level <= 1) return '';
  const pairs: Array<[number, string]> = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let remaining = level;
  let result = '';
  for (const [value, numeral] of pairs) {
    while (remaining >= value) {
      result += numeral;
      remaining -= value;
    }
  }
  return result;
}

export function parseFeatNameRomanSuffix(name: string): {
  baseName: string;
  romanSuffix: string | null;
  levelFromSuffix: number | null;
} {
  for (const suffix of FEAT_ROMAN_SUFFIXES) {
    const pattern = new RegExp(`\\s+${suffix}$`, 'i');
    if (pattern.test(name)) {
      return {
        baseName: name.replace(pattern, '').trim(),
        romanSuffix: suffix,
        levelFromSuffix: romanSuffixToLevel(suffix),
      };
    }
  }
  return { baseName: name, romanSuffix: null, levelFromSuffix: null };
}

export function formatFeatName(feat: LeveledFeatLike): string {
  const storedName = feat.name ?? '';
  const lvl = getFeatLevel(feat);
  if (lvl <= 1) return storedName;

  const { baseName, levelFromSuffix } = parseFeatNameRomanSuffix(storedName);
  if (levelFromSuffix === lvl) return storedName;

  return `${baseName} ${levelToRomanNumeral(lvl)}`;
}

export function groupFeatFamilies<T extends LeveledFeatLike>(feats: T[]): FeatFamily<T>[] {
  const byFamily = new Map<string, T[]>();
  feats.forEach((feat) => {
    const familyId = getFeatFamilyId(feat);
    if (!byFamily.has(familyId)) byFamily.set(familyId, []);
    const familyGroup = byFamily.get(familyId);
    if (familyGroup === undefined) return;
    familyGroup.push(feat);
  });

  return [...byFamily.entries()]
    .map(([familyId, group]) => {
      const sorted = [...group].sort((a, b) => getFeatLevel(a) - getFeatLevel(b));
      const levelOne = sorted.find((f) => getFeatLevel(f) === 1);
      const explicitBase = sorted.find((f) => !f.base_feat_id && getFeatLevel(f) <= 1);
      const main = explicitBase ?? levelOne ?? sorted[0];
      if (main === undefined) return null;
      return { familyId, main, levels: sorted };
    })
    .filter((family): family is FeatFamily<T> => family !== null);
}

/** Map feat family id → sorted levels (level 1 first). Used for feat rank chips and family lookup. */
export function buildFeatLevelsByFamily<T extends LeveledFeatLike>(feats: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  feats.forEach((feat) => {
    const family = getFeatFamilyId(feat);
    if (!map.has(family)) map.set(family, []);
    const familyLevels = map.get(family);
    if (familyLevels === undefined) return;
    familyLevels.push(feat);
  });
  map.forEach((levels) => levels.sort((a, b) => getFeatLevel(a) - getFeatLevel(b)));
  return map;
}

export function featLevelChipDescription(lvl: LeveledFeatLike): string {
  const reqLevel =
    lvl.lvl_req != null && lvl.lvl_req > 0 ? `Req. Character Level ${lvl.lvl_req}` : null;
  const uses =
    lvl.uses_per_rec != null && lvl.uses_per_rec > 0
      ? `Uses: ${lvl.uses_per_rec}${lvl.rec_period ? ` / ${lvl.rec_period}` : ''}`
      : null;
  const details = [reqLevel, uses, lvl.description].filter(Boolean).join('\n');
  return details || 'No additional details.';
}

export type FeatLevelChipSelect<T extends LeveledFeatLike = LeveledFeatLike> = {
  featName: string;
  maxQualified: number;
  onSelectLevel: (level: number) => void;
  unmetReasonFor?: ((feat: T) => string | undefined) | undefined;
};

export type BuildFeatLevelChipsOptions<T extends LeveledFeatLike = LeveledFeatLike> = {
  /** Include the current rank as a marked descriptor chip (sheet play view). Codex omits it. */
  includeCurrent?: boolean | undefined;
  /**
   * Sheet edit rank picker (TASK-780). Implies includeCurrent.
   * Current = marked descriptor; qualified other ranks = `onSelect`; unqualified = disabled.
   */
  select?: FeatLevelChipSelect<T> | undefined;
};

export function buildFeatLevelChips<T extends LeveledFeatLike>(
  familyLevels: T[],
  currentId: string | number,
  options?: BuildFeatLevelChipsOptions<T>,
): ChipData[] {
  const select = options?.select;
  const includeCurrent = options?.includeCurrent === true || select != null;
  return familyLevels
    .filter((lvl) => includeCurrent || String(lvl.id) !== String(currentId))
    .sort((a, b) => getFeatLevel(a) - getFeatLevel(b))
    .map((lvl) => {
      const level = getFeatLevel(lvl);
      const isCurrent = String(lvl.id) === String(currentId);
      const description = featLevelChipDescription(lvl);
      const name = `Level ${level}`;

      if (!select) {
        return {
          name,
          description,
          category: isCurrent ? 'success' : 'default',
          kind: isCurrent ? 'descriptor' : undefined,
          current: isCurrent || undefined,
        } satisfies ChipData;
      }

      if (isCurrent) {
        return {
          name,
          description,
          category: 'success',
          kind: 'descriptor',
          current: true,
        } satisfies ChipData;
      }

      const qualified = level <= select.maxQualified;
      if (!qualified) {
        const unmet = select.unmetReasonFor?.(lvl)?.trim();
        return {
          name,
          description: unmet || description,
          kind: 'descriptor',
          disabled: true,
        } satisfies ChipData;
      }

      return {
        name,
        description,
        kind: 'descriptor',
        onSelect: () => select.onSelectLevel(level),
        selectAriaLabel: `Set ${select.featName} to ${name}`,
      } satisfies ChipData;
    });
}
