import type { ChipData } from '@/components/patterns/list/grid-list-row';

export interface LeveledFeatLike {
  id: string | number;
  name?: string;
  description?: string;
  feat_lvl?: number;
  base_feat_id?: string;
  lvl_req?: number;
  uses_per_rec?: number;
  rec_period?: string;
}

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

export function formatFeatName(feat: LeveledFeatLike): string {
  const base = feat.name ?? '';
  const lvl = getFeatLevel(feat);
  return lvl > 1 ? `${base} (Level ${lvl})` : base;
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
  unmetReasonFor?: (feat: T) => string | undefined;
};

export type BuildFeatLevelChipsOptions<T extends LeveledFeatLike = LeveledFeatLike> = {
  /** Include the current rank as a marked descriptor chip (sheet play view). Codex omits it. */
  includeCurrent?: boolean;
  /**
   * Sheet edit rank picker (TASK-780). Implies includeCurrent.
   * Current = marked descriptor; qualified other ranks = `onSelect`; unqualified = disabled.
   */
  select?: FeatLevelChipSelect<T>;
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
