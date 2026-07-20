import type { UserPower, UserTechnique } from '@/hooks/use-user-library';
import type { CharacterPower, CharacterTechnique } from '@/types';

type PathMergeResult = {
  powers: CharacterPower[];
  techniques: CharacterTechnique[];
  changed: boolean;
};

/** Resolve path Level-1 power/technique refs against lookup pools; skip already-selected ids. */
export function applyPathPowerRecommendations(args: {
  currentPowers: CharacterPower[];
  currentTechniques: CharacterTechnique[];
  hasPathPowerRecs: boolean;
  hasPathTechniqueRecs: boolean;
  recommendedPowerRefs: Set<string>;
  recommendedTechniqueRefs: Set<string>;
  allPowersForLookup: UserPower[];
  allTechniquesForLookup: UserTechnique[];
}): PathMergeResult {
  const {
    currentPowers,
    currentTechniques,
    hasPathPowerRecs,
    hasPathTechniqueRecs,
    recommendedPowerRefs,
    recommendedTechniqueRefs,
    allPowersForLookup,
    allTechniquesForLookup,
  } = args;

  const currentPowerIds = new Set(currentPowers.map((p) => String(p.id)));
  const currentTechniqueIds = new Set(currentTechniques.map((t) => String(t.id)));
  let powersUpdated = false;
  let techniquesUpdated = false;
  const newPowers = [...currentPowers];
  const newTechniques = [...currentTechniques];

  if (hasPathPowerRecs && allPowersForLookup.length > 0) {
    for (const power of allPowersForLookup) {
      const id = String(power.docId ?? power.id ?? '');
      if (
        !currentPowerIds.has(id) &&
        (recommendedPowerRefs.has(id.toLowerCase()) ||
          recommendedPowerRefs.has(String(power.name ?? '').toLowerCase()))
      ) {
        newPowers.push({
          id: power.docId ?? power.id,
          name: power.name,
          description: power.description,
          parts: (power.parts ?? []).map((p) => ({
            ...p,
            id: p.id != null ? String(p.id) : undefined,
          })),
        });
        currentPowerIds.add(id);
        powersUpdated = true;
      }
    }
  }

  if (hasPathTechniqueRecs && allTechniquesForLookup.length > 0) {
    for (const tech of allTechniquesForLookup) {
      const id = String(tech.docId ?? tech.id ?? '');
      if (
        !currentTechniqueIds.has(id) &&
        (recommendedTechniqueRefs.has(id.toLowerCase()) ||
          recommendedTechniqueRefs.has(String(tech.name ?? '').toLowerCase()))
      ) {
        newTechniques.push({
          id: tech.docId ?? tech.id,
          name: tech.name,
          description: tech.description,
          parts: (tech.parts ?? []).map((p) => ({
            ...p,
            id: p.id != null ? String(p.id) : undefined,
          })),
        });
        currentTechniqueIds.add(id);
        techniquesUpdated = true;
      }
    }
  }

  return {
    powers: newPowers,
    techniques: newTechniques,
    changed: powersUpdated || techniquesUpdated,
  };
}
