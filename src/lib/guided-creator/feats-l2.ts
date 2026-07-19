/**
 * Guided feats Layer 2 — UnifiedSelectionModal items (TASK-565).
 * Replaces in-step GuidedFeatsBrowsePanel card dump.
 */

import type { SelectableItem } from '@/components/shared/unified-selection-modal';
import type { Feat, Skill } from '@/hooks';
import { buildFeatDetailSections } from '@/lib/codex/feat-list';
import { normalizeFeatAbilities } from '@/lib/codex/feat-ability';
import {
  checkFeatRequirements,
  type CharacterForFeatRequirement,
} from '@/lib/game/feat-requirements';
import { formatFeatName, getFeatLevel, groupFeatFamilies } from '@/lib/leveled-feats';
import { formatListCellLabel } from '@/lib/utils';

export const FEATS_L2_HEADER_COLUMNS = [
  { key: 'name', label: 'Name', align: 'left' as const, sortable: true },
  { key: 'uses_per_rec', label: 'Uses', align: 'center' as const, sortable: true },
  { key: 'rec_period', label: 'Recovery', align: 'center' as const, sortable: true },
  { key: 'category', label: 'Category', align: 'center' as const, sortable: true },
];

export const FEATS_L2_GRID = '1.5fr 0.6fr 0.6fr 0.8fr';

export function selectedIdsFromFeatL2Items(selected: SelectableItem[]): string[] {
  return selected.map((row) => String(row.id));
}

export function buildGuidedFeatsL2FilterOptions(
  feats: Feat[],
  featType: 'archetype' | 'character'
): { categories: string[]; abilities: string[] } {
  const cats = new Set<string>();
  const abils = new Set<string>();
  feats.forEach((f) => {
    if (featType === 'character' && !f.char_feat) return;
    if (featType === 'archetype' && f.char_feat) return;
    if (f.category) cats.add(f.category);
    normalizeFeatAbilities(f.ability).forEach((a) => abils.add(a));
  });
  return {
    categories: Array.from(cats).sort(),
    abilities: Array.from(abils).sort(),
  };
}

export function buildGuidedFeatsL2Items(opts: {
  featType: 'archetype' | 'character';
  feats: Feat[];
  recommendedIds: string[];
  /** Keep currently selected rows visible even when requirements are not met. */
  selectedIds?: string[];
  requirementCharacter: CharacterForFeatRequirement;
  codexSkills: Skill[];
  showBlocked: boolean;
  category?: string;
  ability?: string;
  /** Badge label for path / guidance recommended feats. */
  recommendedBadgeLabel?: string;
}): SelectableItem[] {
  const {
    featType,
    feats,
    recommendedIds,
    selectedIds = [],
    requirementCharacter,
    codexSkills,
    showBlocked,
    category = '',
    ability = '',
    recommendedBadgeLabel = 'Recommended',
  } = opts;

  const recommendedSet = new Set(recommendedIds.map((id) => String(id)));
  const selectedSet = new Set(selectedIds.map((id) => String(id)));
  const skillIdToName = new Map<string, string>();
  codexSkills.forEach((s) => skillIdToName.set(String(s.id), s.name));

  const typed = feats.filter((f) =>
    featType === 'character' ? Boolean(f.char_feat) : !f.char_feat
  );

  const filtered = typed.filter((feat) => {
    if (category && feat.category !== category) return false;
    if (ability && !normalizeFeatAbilities(feat.ability).includes(ability)) return false;
    const id = String(feat.id);
    if (selectedSet.has(id)) return true;
    const { met } = checkFeatRequirements(feat, requirementCharacter, codexSkills, feats);
    if (!met && !showBlocked) return false;
    return true;
  });

  const families = groupFeatFamilies(filtered);

  const items = families
    .map(({ levels }) => {
      const sorted = levels.slice().sort((a, b) => getFeatLevel(b) - getFeatLevel(a));
      const preferred =
        sorted.find((f) => selectedSet.has(String(f.id))) ??
        sorted.find((f) => {
          const { met } = checkFeatRequirements(f, requirementCharacter, codexSkills, feats);
          return met;
        }) ??
        sorted[0];
      if (!preferred) return null;

      const { met, reason } = checkFeatRequirements(
        preferred,
        requirementCharacter,
        codexSkills,
        feats
      );
      const detailSections = buildFeatDetailSections(preferred, skillIdToName, levels, {
        isCharacterFeat: preferred.char_feat,
      });
      const usesVal = preferred.uses_per_rec;
      const usesDisplay = usesVal === 0 || usesVal === undefined ? '-' : String(usesVal);
      const id = String(preferred.id);
      const recommended = recommendedSet.has(id);
      const isSelected = selectedSet.has(id);

      const row: SelectableItem = {
        id,
        name: formatFeatName(preferred),
        description: preferred.description,
        columns: [
          { key: 'uses_per_rec', label: 'Uses', value: usesDisplay, align: 'center' as const },
          {
            key: 'rec_period',
            label: 'Recovery',
            value: formatListCellLabel(preferred.rec_period),
            align: 'center' as const,
          },
          {
            key: 'category',
            label: 'Category',
            value: formatListCellLabel(preferred.category),
            align: 'center' as const,
          },
        ],
        detailSections: detailSections.length > 0 ? detailSections : undefined,
        // Keep selected rows interactive so the player can deselect; grey only unselected locked rows.
        disabled: !met && showBlocked && !isSelected,
        warningMessage: !met ? reason : undefined,
        badges: recommended
          ? [{ label: recommendedBadgeLabel, color: 'blue' as const }]
          : undefined,
        data: preferred,
      };
      return row;
    })
    .filter((item): item is SelectableItem => item !== null);

  items.sort((a, b) => {
    const aRec = recommendedSet.has(String(a.id));
    const bRec = recommendedSet.has(String(b.id));
    if (aRec !== bRec) return aRec ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });

  return items;
}
