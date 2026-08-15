/**
 * Add Feat Modal — UnifiedSelectionModal wrapper
 * Adds archetype or character feats from Codex. Used by CharacterSheetModals.
 */

'use client';

import { useState, useMemo, useCallback, useId } from 'react';
import { useCodexFeats, useCodexSkills, usePathListFilter, type Feat } from '@/hooks';
import { checkFeatRequirements } from '@/lib/game/feat-requirements';
import {
  buildFeatDetailSections,
  featFamilyIdsMatchingPath,
  featPathChipNames,
} from '@/lib/codex/feat-list';
import { buildSkillIdToName } from '@/lib/codex/skill-list';
import { normalizeFeatAbilities } from '@/lib/codex/feat-ability';
import {
  getFeatFamilyId,
  getFeatLevel,
  groupFeatFamilies,
  formatFeatName,
} from '@/lib/leveled-feats';
import { Alert } from '@/components/ui';
import {
  UnifiedSelectionModal,
  type SelectableItem,
} from '@/components/shared/unified-selection-modal';
import { ArchetypePathFilter } from '@/components/shared/filters';
import { pathFilterEmptyTitle } from '@/lib/game/path-recommendation-index';
import type { Character } from '@/types';
import { formatListCellLabel } from '@/lib/utils';

interface FeatModal extends Feat {
  effect?: string;
  max_uses?: number;
}

interface AddFeatModalProps {
  isOpen: boolean;
  onClose: () => void;
  featType: 'archetype' | 'character' | 'state';
  character: Character;
  existingFeatIds: (string | number)[];
  onAdd: (feats: FeatModal[]) => void;
}

function featToSelectableItem(
  feat: FeatModal,
  familyLevels: FeatModal[],
  disabled: boolean,
  warningMessage: string | undefined,
  skillIdToName: Map<string, string>,
  nameBadges?: { label: string }[],
  showBadgesInName?: boolean,
): SelectableItem {
  const detailSections = buildFeatDetailSections(feat, skillIdToName, familyLevels, {
    isCharacterFeat: feat.char_feat,
  });

  const usesVal = feat.uses_per_rec ?? (feat as FeatModal).max_uses;
  const usesDisplay = usesVal === 0 || usesVal === undefined ? '-' : String(usesVal);
  return {
    id: String(feat.id),
    name: formatFeatName(feat),
    description: feat.description || (feat as FeatModal).effect,
    columns: [
      { key: 'uses_per_rec', label: 'Uses', value: usesDisplay, align: 'center' as const },
      {
        key: 'rec_period',
        label: 'Recovery',
        value: formatListCellLabel(feat.rec_period),
        align: 'center' as const,
      },
      {
        key: 'category',
        label: 'Category',
        value: formatListCellLabel(feat.category),
        align: 'center' as const,
      },
    ],
    detailSections: detailSections.length > 0 ? detailSections : undefined,
    disabled,
    warningMessage: warningMessage || undefined,
    badges: nameBadges,
    showBadgesInName: Boolean(showBadgesInName && nameBadges?.length),
    data: feat,
  };
}

export function AddFeatModal({
  isOpen,
  onClose,
  featType,
  character,
  existingFeatIds,
  onAdd,
}: AddFeatModalProps) {
  const categorySelectId = useId();
  const abilitySelectId = useId();
  const { data: codexFeats = [], isLoading: loading, error: queryError } = useCodexFeats();
  const { data: codexSkills = [] } = useCodexSkills();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAbility, setSelectedAbility] = useState<string>('');
  const [showStateFeats, setShowStateFeats] = useState(false);
  const [showBlocked, setShowBlocked] = useState(false);
  const [showUpgradeableOnly, setShowUpgradeableOnly] = useState(false);

  const feats = useMemo((): FeatModal[] => {
    if (!codexFeats || !Array.isArray(codexFeats)) return [];
    return codexFeats.map((f) => ({
      ...f,
      id: String(f.id),
      effect: f.description,
      max_uses: f.uses_per_rec,
    }));
  }, [codexFeats]);

  const { selectedPathIds, setSelectedPathIds, pathIndex, pathRecommendedIds, pathFilterActive } =
    usePathListFilter({ entities: feats, kind: 'feats', enabled: isOpen });

  // Filter state seeds empty; parent remounts via key={featType} / conditional open.

  const skillIdToName = useMemo(() => buildSkillIdToName(codexSkills), [codexSkills]);

  const { categories, abilities } = useMemo(() => {
    const cats = new Set<string>();
    const abils = new Set<string>();
    feats.forEach((f) => {
      if (featType === 'character' && !f.char_feat) return;
      if (featType === 'archetype' && f.char_feat) return;
      if (f.category) cats.add(f.category);
      normalizeFeatAbilities(f.ability).forEach((a) => abils.add(a));
    });
    return { categories: Array.from(cats).sort(), abilities: Array.from(abils).sort() };
  }, [feats, featType]);

  const checkRequirements = useCallback(
    (feat: FeatModal): { meets: boolean; warning?: string } => {
      const { met, reason } = checkFeatRequirements(feat, character, codexSkills, feats);
      return { meets: met, warning: reason };
    },
    [character, codexSkills, feats],
  );

  const ownedFamilyIds = useMemo(() => {
    const families = new Set<string>();
    existingFeatIds.forEach((id) => {
      const feat = feats.find((f) => String(f.id) === String(id));
      if (feat) families.add(getFeatFamilyId(feat));
    });
    return families;
  }, [existingFeatIds, feats]);

  const items = useMemo((): SelectableItem[] => {
    const typeFiltered = feats.filter((feat) => {
      if (featType === 'state') return Boolean(feat.state_feat);
      if (featType === 'character') return Boolean(feat.char_feat);
      return !feat.char_feat;
    });
    const pathFamilyIds = featFamilyIdsMatchingPath(typeFiltered, pathRecommendedIds);
    const typedLevelsByFamily = new Map(
      groupFeatFamilies(typeFiltered).map((family) => [family.familyId, family.levels]),
    );

    const baseFiltered = typeFiltered.filter((feat) => {
      if (existingFeatIds.includes(feat.id)) return false;
      if (featType !== 'state' && !showStateFeats && feat.state_feat) return false;
      const { meets } = checkRequirements(feat);
      if (!meets && !showBlocked) return false;
      if (selectedCategory && feat.category !== selectedCategory) return false;
      if (selectedAbility && !normalizeFeatAbilities(feat.ability).includes(selectedAbility)) {
        return false;
      }
      if (pathFamilyIds && !pathFamilyIds.has(getFeatFamilyId(feat))) return false;
      return true;
    });

    const families = groupFeatFamilies(baseFiltered);
    const existingFeatIdSet = new Set(existingFeatIds.map((id) => String(id)));

    return families
      .map(({ familyId, levels }) => {
        if (showUpgradeableOnly && !ownedFamilyIds.has(familyId)) return null;
        const selectableLevels = levels
          .filter((levelFeat) => !existingFeatIdSet.has(String(levelFeat.id)))
          .slice()
          .sort((a, b) => getFeatLevel(b) - getFeatLevel(a));
        if (selectableLevels.length === 0) return null;
        const displayFeat = selectableLevels[0];
        const { meets, warning } = checkRequirements(displayFeat);
        const pathLabels = pathFilterActive
          ? featPathChipNames(pathIndex, displayFeat, selectedPathIds)
          : [];
        return featToSelectableItem(
          displayFeat,
          typedLevelsByFamily.get(familyId) ?? levels,
          !meets && !showBlocked,
          warning,
          skillIdToName,
          pathLabels.map((label) => ({ label })),
          Boolean(pathLabels.length),
        );
      })
      .filter((item): item is SelectableItem => item !== null);
  }, [
    feats,
    featType,
    existingFeatIds,
    showStateFeats,
    showBlocked,
    showUpgradeableOnly,
    ownedFamilyIds,
    selectedCategory,
    selectedAbility,
    checkRequirements,
    skillIdToName,
    pathFilterActive,
    pathIndex,
    selectedPathIds,
    pathRecommendedIds,
  ]);

  const error = queryError ? `Failed to load feats: ${queryError.message}` : null;

  const filterContent = (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor={categorySelectId} className="text-sm text-text-secondary">
            Category:
          </label>
          <select
            id={categorySelectId}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-border-light bg-surface px-2 py-1 text-sm text-text-primary focus:ring-2 focus:ring-primary-outline-border focus:outline-none"
          >
            <option value="">All</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor={abilitySelectId} className="text-sm text-text-secondary">
            Ability:
          </label>
          <select
            id={abilitySelectId}
            value={selectedAbility}
            onChange={(e) => setSelectedAbility(e.target.value)}
            className="rounded-lg border border-border-light bg-surface px-2 py-1 text-sm text-text-primary focus:ring-2 focus:ring-primary-outline-border focus:outline-none"
          >
            <option value="">All</option>
            {abilities.map((abil) => (
              <option key={abil} value={abil}>
                {abil}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={showStateFeats}
            onChange={(e) => setShowStateFeats(e.target.checked)}
            className="rounded border-border-light"
          />
          Show state feats
        </label>
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={showBlocked}
            onChange={(e) => setShowBlocked(e.target.checked)}
            className="rounded border-border-light"
          />
          Show blocked
        </label>
        {featType !== 'state' && (
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={showUpgradeableOnly}
              onChange={(e) => setShowUpgradeableOnly(e.target.checked)}
              className="rounded border-border-light"
            />
            Owned feats (can level up)
          </label>
        )}
      </div>
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <ArchetypePathFilter
          options={pathIndex.options}
          selectedPathIds={selectedPathIds}
          onChange={setSelectedPathIds}
        />
      </div>
    </div>
  );

  return (
    <>
      {error && isOpen && (
        <Alert variant="danger" className="fixed top-4 left-1/2 z-toast max-w-md -translate-x-1/2">
          {error}
        </Alert>
      )}
      <UnifiedSelectionModal
        isOpen={isOpen}
        onClose={onClose}
        title={`Add ${featType === 'state' ? 'State' : featType === 'archetype' ? 'Archetype' : 'Character'} Feat`}
        description="Filtered by your level and requirements."
        items={items}
        isLoading={loading}
        onConfirm={(selected) => onAdd(selected.map((i) => i.data as FeatModal))}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'uses_per_rec', label: 'Uses' },
          { key: 'rec_period', label: 'Recovery' },
          { key: 'category', label: 'Category' },
        ]}
        gridColumns="1.5fr 0.6fr 0.6fr 0.8fr"
        itemLabel="feat"
        emptyMessage={
          error ??
          (pathFilterActive ? pathFilterEmptyTitle('feats') : 'No feats match your filters.')
        }
        searchPlaceholder="Search feats by name, description, or tags..."
        filterContent={filterContent}
        showFilters={true}
        optionsActiveCount={
          (selectedCategory ? 1 : 0) +
          (selectedAbility ? 1 : 0) +
          (showStateFeats ? 1 : 0) +
          (showBlocked ? 1 : 0) +
          (featType !== 'state' && showUpgradeableOnly ? 1 : 0) +
          (pathFilterActive ? 1 : 0)
        }
        optionsSummary={
          [
            selectedCategory && `Category: ${selectedCategory}`,
            selectedAbility && `Ability: ${selectedAbility}`,
          ]
            .filter(Boolean)
            .join(' · ') || undefined
        }
        hideDisabled={false}
        size="xl"
        className="md:max-h-[85vh]"
      />
    </>
  );
}
