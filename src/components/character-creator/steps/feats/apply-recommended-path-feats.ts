import type { Feat } from '@/hooks';
import { getFeatFamilyId, getFeatLevel } from '@/lib/leveled-feats';
import type { SelectedFeat } from './feat-list-columns';
import type { FeatFamilyEntry } from './path-mode-feat-families';

interface ApplyRecommendedPathFeatsArgs {
  currentFeats: SelectedFeat[] | undefined;
  pathModeArchetypeFeats: FeatFamilyEntry[];
  pathModeCharacterFeats: FeatFamilyEntry[];
  maxArchetypeFeats: number;
  maxCharacterFeats: number;
  featById: Map<string, Feat>;
  checkRequirements: (feat: Feat) => { met: boolean; reason?: string | undefined };
}

/** Merge recommended path feats into the working selection (Layer 1 auto-apply / button). */
export function buildRecommendedPathFeats({
  currentFeats,
  pathModeArchetypeFeats,
  pathModeCharacterFeats,
  maxArchetypeFeats,
  maxCharacterFeats,
  featById,
  checkRequirements,
}: ApplyRecommendedPathFeatsArgs): SelectedFeat[] | null {
  let workingFeats = [...(currentFeats || [])];

  const addFeatIfPossible = (feat: Feat, isCharacterFeat: boolean) => {
    const featType = isCharacterFeat ? 'character' : 'archetype';
    if (workingFeats.some((f) => f.id === feat.id)) return;

    const selectedList = workingFeats.filter((f) =>
      isCharacterFeat ? f.type === 'character' : f.type !== 'character',
    );
    const maxForType = isCharacterFeat ? maxCharacterFeats : maxArchetypeFeats;
    const requirements = checkRequirements(feat);
    if (!requirements.met) return;

    const selectedWeight = selectedList.reduce((sum, selected) => {
      const selectedFeat = featById.get(String(selected.id));
      return sum + getFeatLevel(selectedFeat);
    }, 0);
    const targetFamily = getFeatFamilyId(feat);
    const targetLevel = getFeatLevel(feat);
    const sameFamilyToReplace = selectedList.filter((selected) => {
      const selectedFeat = featById.get(String(selected.id));
      if (!selectedFeat) return false;
      if (getFeatFamilyId(selectedFeat) !== targetFamily) return false;
      return getFeatLevel(selectedFeat) < targetLevel;
    });
    const replacedWeight = sameFamilyToReplace.reduce((sum, selected) => {
      const selectedFeat = featById.get(String(selected.id));
      return sum + getFeatLevel(selectedFeat);
    }, 0);
    const nextWeight = selectedWeight - replacedWeight + targetLevel;
    if (nextWeight > maxForType) return;

    const replacementIds = new Set(sameFamilyToReplace.map((f) => String(f.id)));
    workingFeats = [
      ...workingFeats.filter((f) => !replacementIds.has(String(f.id))),
      {
        id: feat.id,
        name: feat.name,
        description: feat.description,
        type: featType,
      },
    ];
  };

  for (const { displayFeat } of pathModeArchetypeFeats) {
    addFeatIfPossible(displayFeat, false);
  }
  for (const { displayFeat } of pathModeCharacterFeats) {
    addFeatIfPossible(displayFeat, true);
  }

  const prevIds = (currentFeats ?? [])
    .map((f) => String(f.id))
    .sort()
    .join(',');
  const nextIds = workingFeats
    .map((f) => String(f.id))
    .sort()
    .join(',');
  if (prevIds === nextIds) return null;
  return workingFeats;
}
