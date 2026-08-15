'use client';

import { GridListRow } from '@/components/shared';
import type { Feat } from '@/hooks';
import { formatAbilityList, formatListCellLabel } from '@/lib/utils';
import { getFeatFamilyId, getFeatLevel, formatFeatName } from '@/lib/leveled-feats';
import { buildFeatDetailSections } from '@/lib/codex/feat-list';
import { FEAT_GRID_COLUMNS } from './feat-list-columns';
import type { SelectedFeat } from './feat-list-columns';

interface FeatRowProps {
  feat: Feat;
  familyLevels: Feat[];
  isCharacterFeat: boolean;
  selectedArchetypeFeats: SelectedFeat[];
  selectedCharacterFeats: SelectedFeat[];
  maxArchetypeFeats: number;
  maxCharacterFeats: number;
  featById: Map<string, Feat>;
  skillIdToName: Map<string, string>;
  checkRequirements: (feat: Feat) => { met: boolean; reason?: string };
  onToggle: (feat: Feat, isCharacterFeat: boolean) => void;
}

export function FeatRow({
  feat,
  familyLevels,
  isCharacterFeat,
  selectedArchetypeFeats,
  selectedCharacterFeats,
  maxArchetypeFeats,
  maxCharacterFeats,
  featById,
  skillIdToName,
  checkRequirements,
  onToggle,
}: FeatRowProps) {
  const selectedList = isCharacterFeat ? selectedCharacterFeats : selectedArchetypeFeats;
  const maxForType = isCharacterFeat ? maxCharacterFeats : maxArchetypeFeats;

  const isSelected = selectedList.some((f) => f.id === feat.id);
  const requirements = checkRequirements(feat);
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
  const canSelect = (nextWeight <= maxForType || isSelected) && requirements.met;

  // Build detail sections (Type, Category, Tags, Requirements) — shared builder. (DUP-10)
  const detailSections = buildFeatDetailSections(feat, skillIdToName, familyLevels, {
    isCharacterFeat,
    hideTypeSection: true,
  });

  return (
    <GridListRow
      key={feat.id}
      id={feat.id}
      name={formatFeatName(feat)}
      description={feat.description}
      gridColumns={FEAT_GRID_COLUMNS}
      columns={[
        { key: 'Category', value: formatListCellLabel(feat.category) },
        { key: 'Ability', value: formatAbilityList(feat.ability) },
        { key: 'Recovery', value: formatListCellLabel(feat.rec_period) },
        {
          key: 'Uses',
          value:
            feat.uses_per_rec == null || feat.uses_per_rec === 0 ? '-' : String(feat.uses_per_rec),
        },
      ]}
      detailSections={detailSections.length > 0 ? detailSections : undefined}
      selectable
      isSelected={isSelected}
      onSelect={() => canSelect && onToggle(feat, isCharacterFeat)}
      disabled={!canSelect}
      warningMessage={!requirements.met ? requirements.reason : undefined}
    />
  );
}
