import type { ChipData } from '@/components/shared/grid-list-row';

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
    byFamily.get(familyId)!.push(feat);
  });

  return [...byFamily.entries()].map(([familyId, group]) => {
    const sorted = [...group].sort((a, b) => getFeatLevel(a) - getFeatLevel(b));
    const levelOne = sorted.find((f) => getFeatLevel(f) === 1);
    const explicitBase = sorted.find((f) => !f.base_feat_id && getFeatLevel(f) <= 1);
    const main = explicitBase ?? levelOne ?? sorted[0];
    return { familyId, main, levels: sorted };
  });
}

export function buildFeatLevelChips<T extends LeveledFeatLike>(
  familyLevels: T[],
  currentId: string | number
): ChipData[] {
  return familyLevels
    .filter((lvl) => String(lvl.id) !== String(currentId))
    .sort((a, b) => getFeatLevel(a) - getFeatLevel(b))
    .map((lvl) => {
      const featLevel = getFeatLevel(lvl);
      const reqLevel = lvl.lvl_req != null && lvl.lvl_req > 0 ? `Req. Character Level ${lvl.lvl_req}` : null;
      const uses = lvl.uses_per_rec != null && lvl.uses_per_rec > 0 ? `Uses: ${lvl.uses_per_rec}${lvl.rec_period ? ` / ${lvl.rec_period}` : ''}` : null;
      const details = [reqLevel, uses, lvl.description].filter(Boolean).join('\n');
      return {
        name: `Level ${featLevel}`,
        description: details || 'No additional details.',
        category: 'default',
      } satisfies ChipData;
    });
}
