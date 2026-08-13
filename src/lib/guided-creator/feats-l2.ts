/**
 * Guided feats Layer 2 — UnifiedSelectionModal items (TASK-565).
 * Replaces in-step GuidedFeatsBrowsePanel card dump.
 *
 * Filter set mirrors the Codex Feats browse tab's non-requirement filters (Category,
 * State Feats) — TASK-684. Character/level/ability requirement filters are intentionally
 * omitted as controls: unmet feats are filtered out of the list automatically (selected
 * unmet rows stay visible so they can be deselected). Feat Type (archetype vs character)
 * is omitted because each guided step already scopes to one `featType`.
 */

import type { SelectableItem } from '@/components/shared/unified-selection-modal';
import type { Feat, Skill } from '@/hooks';
import {
  buildFeatDetailSections,
  FEAT_GRID_COLUMNS,
  FEAT_SELECTABLE_HEADER_COLUMNS,
  featSelectableColumns,
} from '@/lib/codex/feat-list';
import { buildSkillIdToName } from '@/lib/codex/skill-list';
import {
  checkFeatRequirements,
  type CharacterForFeatRequirement,
} from '@/lib/game/feat-requirements';
import { formatFeatName, getFeatLevel, groupFeatFamilies } from '@/lib/leveled-feats';

/** Codex feat headers — Guided L2/L3 reuses the same columns as Codex browse (TASK-709). */
export const FEATS_L2_HEADER_COLUMNS = FEAT_SELECTABLE_HEADER_COLUMNS;
export const FEATS_L2_GRID = FEAT_GRID_COLUMNS;

/** Search covers name/description + tags/category (packed into `keywords`) — TASK-684. */
export const FEATS_L2_SEARCH_FIELDS: (keyof SelectableItem)[] = ['name', 'description', 'keywords'];

export type StateFeatFilterMode = 'all' | 'only' | 'hide';

export function selectedIdsFromFeatL2Items(selected: SelectableItem[]): string[] {
  return selected.map((row) => String(row.id));
}

export function buildGuidedFeatsL2FilterOptions(
  feats: Feat[],
  featType: 'archetype' | 'character'
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
    categories = [],
    stateFeatMode = 'all',
    recommendedBadgeLabel = 'Recommended',
  } = opts;

  const recommendedSet = new Set(recommendedIds.map((id) => String(id)));
  const selectedSet = new Set(selectedIds.map((id) => String(id)));
  const skillIdToName = buildSkillIdToName(codexSkills);

  const typed = feats.filter((f) =>
    featType === 'character' ? Boolean(f.char_feat) : !f.char_feat
  );

  // Requirement eligibility: hide unmet feats (keep selected rows so the player can deselect
  // even if they no longer qualify). Category / State Feats remain explicit filters.
  const filtered = typed.filter((feat) => {
    const id = String(feat.id);
    if (selectedSet.has(id)) return true;
    if (categories.length > 0 && !categories.includes(feat.category ?? '')) return false;
    if (stateFeatMode === 'only' && !feat.state_feat) return false;
    if (stateFeatMode === 'hide' && feat.state_feat) return false;
    const { met } = checkFeatRequirements(feat, requirementCharacter, codexSkills, feats);
    return met;
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
        hideTypeSection: true,
      });
      const id = String(preferred.id);
      const recommended = recommendedSet.has(id);
      const isSelected = selectedSet.has(id);
      const keywords = [preferred.category, ...(preferred.tags ?? [])]
        .filter((v): v is string => Boolean(v))
        .join(' ');

      const row: SelectableItem = {
        id,
        name: formatFeatName(preferred),
        description: preferred.description,
        keywords: keywords || undefined,
        columns: featSelectableColumns(preferred),
        detailSections: detailSections.length > 0 ? detailSections : undefined,
        // Selected-but-unmet stays visible so the player can deselect; otherwise unmet are hidden above.
        disabled: !met && isSelected,
        warningMessage: !met && isSelected ? reason : undefined,
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
