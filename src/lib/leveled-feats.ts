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

/** Level-1 row with no parent. Admin “add level” and the base-feat picker use this. */
export function isFeatFamilyBase(feat: LeveledFeatLike): boolean {
  if (feat.base_feat_id) return false;
  return feat.feat_lvl == null || feat.feat_lvl === 1;
}

/** Every row in `feat`'s family, lowest level first. */
export function sortedFeatFamily<T extends LeveledFeatLike>(feats: readonly T[], feat: T): T[] {
  const familyId = getFeatFamilyId(feat);
  return feats
    .filter((row) => getFeatFamilyId(row) === familyId)
    .sort((a, b) => getFeatLevel(a) - getFeatLevel(b));
}

/** Highest `feat_lvl` in a family list sorted ascending (same order as `groupFeatFamilies().levels`). */
export function peakFeatInFamily<T extends LeveledFeatLike>(levels: readonly T[]): T | undefined {
  return levels.length > 0 ? levels[levels.length - 1] : undefined;
}

export function maxFeatLevelInFamily(levels: readonly LeveledFeatLike[]): number {
  if (levels.length === 0) return 1;
  return levels.reduce((max, row) => Math.max(max, getFeatLevel(row)), 1);
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

export type LeveledFeatSourceType =
  | 'creature'
  | 'character'
  | 'archetype'
  | 'trait'
  | 'flaw'
  | 'characteristic';

export type MergeFeatRow = {
  id: string;
  name?: string | undefined;
  featSourceType?: LeveledFeatSourceType | undefined;
};

function namesMatchSavedName(saved: string | undefined, def: LeveledFeatLike | undefined): boolean {
  if (!def || saved == null) return false;
  const trimmed = saved.trim();
  if (!trimmed) return false;
  if (trimmed === (def.name ?? '').trim()) return true;
  if (trimmed === formatFeatName(def).trim()) return true;
  return false;
}

type FeatCatalog = 'creature' | 'character';

function resolveRowCatalog(
  row: MergeFeatRow,
  creatureDefsById: Map<string, LeveledFeatLike>,
  characterDefsById: Map<string, LeveledFeatLike>,
): FeatCatalog | null {
  const st = row.featSourceType;
  if (st === 'creature') return 'creature';
  if (st === 'character' || st === 'archetype') return 'character';
  if (st === 'trait' || st === 'flaw' || st === 'characteristic') return null;

  const id = String(row.id);
  const matchesCreature = namesMatchSavedName(row.name, creatureDefsById.get(id));
  const matchesCharacter = namesMatchSavedName(row.name, characterDefsById.get(id));
  if (matchesCreature && !matchesCharacter) return 'creature';
  if (matchesCharacter && !matchesCreature) return 'character';
  return null;
}

function defsForCatalog(
  catalog: FeatCatalog,
  creatureDefsById: Map<string, LeveledFeatLike>,
  characterDefsById: Map<string, LeveledFeatLike>,
): Map<string, LeveledFeatLike> {
  return catalog === 'creature' ? creatureDefsById : characterDefsById;
}

function getFamilyAndLevel(
  id: string,
  defsById: Map<string, LeveledFeatLike>,
): { familyId: string; level: number } | null {
  const def = defsById.get(id);
  if (!def) return null;
  return { familyId: getFeatFamilyId(def), level: getFeatLevel(def) };
}

export type MergeFeatsInFamilyOnAddArgs<T extends MergeFeatRow> = {
  existing: T[];
  added: T[];
  creatureDefsById: Map<string, LeveledFeatLike>;
  characterDefsById: Map<string, LeveledFeatLike>;
};

/** Replace lower ranks in the same catalog family when adding leveled feats (creature vs character maps stay separate). */
export function mergeFeatsInFamilyOnAdd<T extends MergeFeatRow>({
  existing,
  added,
  creatureDefsById,
  characterDefsById,
}: MergeFeatsInFamilyOnAddArgs<T>): T[] {
  return added.reduce<T[]>(
    (acc, nextFeat) => {
      const addedCatalog = resolveRowCatalog(nextFeat, creatureDefsById, characterDefsById);
      if (addedCatalog == null) {
        return [...acc, nextFeat];
      }

      const addedDefs = defsForCatalog(addedCatalog, creatureDefsById, characterDefsById);
      const nextMeta = getFamilyAndLevel(String(nextFeat.id), addedDefs);
      if (!nextMeta) {
        return [...acc, nextFeat];
      }

      const filtered = acc.filter((existingRow) => {
        const existingCatalog = resolveRowCatalog(existingRow, creatureDefsById, characterDefsById);
        if (existingCatalog !== addedCatalog) return true;

        const existingDefs = defsForCatalog(existingCatalog, creatureDefsById, characterDefsById);
        const existingMeta = getFamilyAndLevel(String(existingRow.id), existingDefs);
        if (!existingMeta || existingMeta.familyId !== nextMeta.familyId) return true;

        return existingMeta.level >= nextMeta.level;
      });

      return [...filtered, nextFeat];
    },
    [...existing],
  );
}

export type ComputeNextLeveledFeatFieldsInput = {
  sourceFeatLvl: number | undefined;
  sourceBaseFeatId: string | undefined;
  sourceDbFeatId: string;
  /** When the UI row is below the highest tier already in the family (e.g. GLR add on the base row). */
  existingFamilyMaxLevel?: number | undefined;
};

/** Shared level + base id for admin “add level” (character and creature). */
export function computeNextLeveledFeatFields(input: ComputeNextLeveledFeatFieldsInput): {
  feat_lvl: number;
  base_feat_id: string;
} {
  const curLvl = input.sourceFeatLvl != null && input.sourceFeatLvl > 0 ? input.sourceFeatLvl : 1;
  const familyPeak = input.existingFamilyMaxLevel;
  const effectiveCur = familyPeak != null && familyPeak > curLvl ? familyPeak : curLvl;
  const newLvl = effectiveCur + 1;
  const baseId = input.sourceBaseFeatId?.trim() || input.sourceDbFeatId;
  return { feat_lvl: newLvl, base_feat_id: baseId };
}

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
