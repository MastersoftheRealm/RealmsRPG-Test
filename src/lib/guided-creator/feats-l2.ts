/**
 * Guided feats Layer 2 — UnifiedSelectionModal items (TASK-565).
 * Replaces in-step GuidedFeatsBrowsePanel card dump.
 *
 * Filter set mirrors the Codex Feats browse tab's non-requirement filters (Category,
 * State Feats, Archetype Path) — TASK-684 / TASK-753. Character/level/ability requirement
 * filters are intentionally omitted as controls: unmet feats are filtered out of the list
 * automatically (selected unmet rows stay visible so they can be deselected). Feat Type
 * (archetype vs character) is omitted because each guided step already scopes to one `featType`.
 */

import type { SelectableItem } from '@/components/patterns/select/unified-selection-modal';
import type { Feat, Skill } from '@/hooks';
import { glrSurfaceDetailSections } from '@/lib/chip/list-row-metadata';
import {
  buildFeatDetailSections,
  featSelectableColumns,
  featSelectableHeaderColumns,
  FEAT_CREATOR_GRID_COLUMNS,
} from '@/lib/codex/feat-list';
import { buildSkillIdToName } from '@/lib/codex/skill-list';
import {
  checkFeatRequirements,
  type CharacterForFeatRequirement,
} from '@/lib/game/feat-requirements';
import {
  pathChipLabelsForEntity,
  pathRecommendedEntityIds,
  rowMatchesPathRecommendedIds,
  type PathRecommendationIndex,
} from '@/lib/game/path-recommendation-index';
import {
  formatFeatName,
  getFeatFamilyId,
  getFeatLevel,
  groupFeatFamilies,
} from '@/lib/leveled-feats';

/** Codex-backed feat headers, minus Req. Level because creator eligibility already enforces level 1. */
export const FEATS_L2_HEADER_COLUMNS = featSelectableHeaderColumns({
  omitRequiredLevel: true,
});
export const FEATS_L2_GRID = FEAT_CREATOR_GRID_COLUMNS;

/** Search covers name/description + tags/category (packed into `keywords`) — TASK-684. */
export const FEATS_L2_SEARCH_FIELDS: (keyof SelectableItem)[] = ['name', 'description', 'keywords'];

export type StateFeatFilterMode = 'all' | 'only' | 'hide';

export function selectedIdsFromFeatL2Items(selected: SelectableItem[]): string[] {
  return selected.map((row) => String(row.id));
}

export function buildGuidedFeatsL2FilterOptions(
  feats: Feat[],
  featType: 'archetype' | 'character',
): { categories: string[] } {
  const cats = new Set<string>();
  feats.forEach((f) => {
    if (featType === 'character' && !f.char_feat) return;
    if (featType === 'archetype' && f.char_feat) return;
    if (f.category) cats.add(f.category);
  });
  return { categories: Array.from(cats).sort() };
}

export function buildGuidedFeatsL2Items(opts: {
  featType: 'archetype' | 'character';
  feats: Feat[];
  recommendedIds: string[];
  /** Keep currently selected rows visible even when filters would otherwise hide them. */
  selectedIds?: string[];
  requirementCharacter: CharacterForFeatRequirement;
  codexSkills: Skill[];
  categories?: string[];
  stateFeatMode?: StateFeatFilterMode;
  /** Badge label for path / guidance recommended feats (only when the path filter is off). */
  recommendedBadgeLabel?: string;
  /** Live path index — same collector as Codex (ADR-0014). */
  pathIndex?: PathRecommendationIndex;
  selectedPathIds?: string[];
}): SelectableItem[] {
  const {
    featType,
    feats,
    recommendedIds,
    selectedIds = [],
    requirementCharacter,
    codexSkills,
    categories = [],
    stateFeatMode = 'all',
    recommendedBadgeLabel = 'Recommended',
    pathIndex,
    selectedPathIds = [],
  } = opts;

  const recommendedSet = new Set(recommendedIds.map((id) => String(id)));
  const selectedSet = new Set(selectedIds.map((id) => String(id)));
  const skillIdToName = buildSkillIdToName(codexSkills);
  const pathMatchSet =
    pathIndex && selectedPathIds.length > 0
      ? pathRecommendedEntityIds(pathIndex, selectedPathIds)
      : null;
  const pathFilterActive = pathMatchSet != null;

  const typed = feats.filter((f) =>
    featType === 'character' ? Boolean(f.char_feat) : !f.char_feat,
  );

  // Path match is by family: a recommended rank keeps legal sibling ranks (TASK-753).
  const pathFamilyIds = new Set<string>();
  if (pathMatchSet) {
    for (const feat of typed) {
      const id = String(feat.id);
      if (selectedSet.has(id) || rowMatchesPathRecommendedIds(id, pathMatchSet)) {
        pathFamilyIds.add(getFeatFamilyId(feat));
      }
    }
  }

  // Requirement eligibility: hide unmet feats (keep selected rows so the player can deselect
  // even if they no longer qualify). Category / State Feats remain explicit filters.
  const filtered = typed.filter((feat) => {
    const id = String(feat.id);
    if (selectedSet.has(id)) return true;
    if (pathFilterActive && !pathFamilyIds.has(getFeatFamilyId(feat))) return false;
    if (categories.length > 0 && !categories.includes(feat.category ?? '')) return false;
    if (stateFeatMode === 'only' && !feat.state_feat) return false;
    if (stateFeatMode === 'hide' && feat.state_feat) return false;
    const { met } = checkFeatRequirements(feat, requirementCharacter, codexSkills, feats);
    return met;
  });

  const families = groupFeatFamilies(filtered);
  const typedLevelsByFamily = new Map(
    groupFeatFamilies(typed).map((family) => [family.familyId, family.levels]),
  );

  const items = families
    .map(({ familyId, levels }) => {
      const familyLevels = typedLevelsByFamily.get(familyId) ?? levels;
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
        feats,
      );
      const extra = buildFeatDetailSections(preferred, skillIdToName, familyLevels, {
        isCharacterFeat: preferred.char_feat,
        hideTypeSection: true,
      });
      const detailSections = glrSurfaceDetailSections('guided-feats-l3', {}, extra);
      const id = String(preferred.id);
      const recommended = recommendedSet.has(id);
      const isSelected = selectedSet.has(id);
      const keywords = [preferred.category, ...(preferred.tags ?? [])]
        .filter((v): v is string => Boolean(v))
        .join(' ');
      const pathChipLabels =
        pathFilterActive && pathIndex
          ? pathChipLabelsForEntity(
              pathIndex,
              familyLevels.map((level) => level.id),
              selectedPathIds,
            )
          : undefined;
      const badges = pathChipLabels
        ? pathChipLabels.map((label) => ({ label, color: 'blue' as const }))
        : recommended
          ? [{ label: recommendedBadgeLabel, color: 'blue' as const }]
          : undefined;

      const row: SelectableItem = {
        id,
        name: formatFeatName(preferred),
        description: preferred.description,
        keywords: keywords || undefined,
        columns: featSelectableColumns(preferred, { omitRequiredLevel: true }),
        detailSections: detailSections.length > 0 ? detailSections : undefined,
        // Selected-but-unmet stays visible so the player can deselect; otherwise unmet are hidden above.
        disabled: !met && isSelected,
        warningMessage: !met && isSelected ? reason : undefined,
        badges,
        showBadgesInName: Boolean(pathChipLabels?.length),
        data: preferred,
      };
      return row;
    })
    .filter((item): item is SelectableItem => item !== null);

  items.sort((a, b) => {
    if (!pathFilterActive) {
      const aRec = recommendedSet.has(String(a.id));
      const bRec = recommendedSet.has(String(b.id));
      if (aRec !== bRec) return aRec ? -1 : 1;
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });

  return items;
}
