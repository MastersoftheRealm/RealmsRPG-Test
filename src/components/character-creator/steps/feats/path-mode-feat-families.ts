import type { Feat } from '@/hooks';
import { getFeatLevel, groupFeatFamilies } from '@/lib/leveled-feats';

export type FeatFamilyEntry = { displayFeat: Feat; familyLevels: Feat[] };

/** Path Layer 1: recommended archetype or character feat families (highest level display). */
export function buildPathModeFeatFamilies(
  feats: Feat[] | undefined,
  recommendedFeatRefs: Set<string>,
  characterFeats: boolean,
): FeatFamilyEntry[] {
  if (!feats || recommendedFeatRefs.size === 0) return [];
  const typed = feats.filter((f: Feat) => (characterFeats ? !!f.char_feat : !f.char_feat));
  const recommended = typed.filter(
    (f: Feat) =>
      recommendedFeatRefs.has(String(f.id).toLowerCase()) ||
      recommendedFeatRefs.has(String(f.name).toLowerCase()),
  );
  const families = groupFeatFamilies(recommended);
  return families
    .map((family) => {
      const levelsByPriority = family.levels
        .slice()
        .sort((a, b) => getFeatLevel(b) - getFeatLevel(a));
      const displayFeat = levelsByPriority[0];
      if (!displayFeat) return null;
      return { displayFeat, familyLevels: family.levels };
    })
    .filter((entry): entry is FeatFamilyEntry => entry !== null);
}
