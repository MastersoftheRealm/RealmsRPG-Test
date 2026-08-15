/**
 * Shared codex feat list helpers (Codex feats tab + Admin feats tab).
 */

import type { AbilityRequirement } from '@/components/shared/filters';
import type { ChipData, ColumnValue } from '@/components/shared/grid-list-row';
import type { Feat } from '@/hooks';
import { buildFeatLevelChips, getFeatFamilyId } from '@/lib/leveled-feats';
import { checkFeatRequirements } from '@/lib/game/feat-requirements';
import type { CodexSkillForFeat } from '@/lib/game/formulas';
import {
  pathNamesForEntity,
  rowMatchesPathRecommendedIds,
  type PathRecommendationIndex,
} from '@/lib/game/path-recommendation-index';
import { normalizeFeatAbilities } from '@/lib/codex/feat-ability';
import { formatAbilityList, formatListCellLabel } from '@/lib/utils';
import { descriptorChipData, tagDescriptorChip } from '@/lib/chip/chip-data-helpers';
import type { Character } from '@/types';

/** Data columns only — admin action chrome uses CodexBrowseListShell `rowChrome`. */
export const FEAT_GRID_COLUMNS = '1.5fr 0.8fr 1fr 0.8fr 0.8fr 1fr';

export const CODEX_FEAT_HEADER_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'lvl_req', label: 'REQ. LEVEL' },
  { key: 'category', label: 'CATEGORY' },
  { key: 'ability', label: 'ABILITY' },
  { key: 'uses_per_rec', label: 'USES' },
  { key: 'rec_period', label: 'RECOVERY' },
];

export const ADMIN_FEAT_HEADER_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'lvl_req', label: 'REQ. LEVEL' },
  { key: 'category', label: 'CATEGORY' },
  { key: 'ability', label: 'ABILITY' },
  { key: 'rec_period', label: 'RECOVERY' },
  { key: 'uses_per_rec', label: 'USES' },
];

/** Codex browse headers with USM/L3 sortable + align (TASK-709). */
export const FEAT_SELECTABLE_HEADER_COLUMNS = CODEX_FEAT_HEADER_COLUMNS.map((h) => ({
  key: h.key,
  label: h.label,
  align: (h.key === 'name' ? 'left' : 'center') as 'left' | 'center',
  sortable: true,
}));

export interface FeatSelectableColumnOptions {
  /** Creator eligibility already hides feats above level 1, so its catalog can omit this column. */
  omitRequiredLevel?: boolean;
}

/** Compose selectable feat headers without forking the Codex column definitions. */
export function featSelectableHeaderColumns(
  options: FeatSelectableColumnOptions = {},
): typeof FEAT_SELECTABLE_HEADER_COLUMNS {
  return options.omitRequiredLevel
    ? FEAT_SELECTABLE_HEADER_COLUMNS.filter((header) => header.key !== 'lvl_req')
    : FEAT_SELECTABLE_HEADER_COLUMNS;
}

/**
 * Same cells as Codex `buildFeatGridColumns('codex')`, keyed to `CODEX_FEAT_HEADER_COLUMNS`
 * so Guided L2/L3 sort matches Library/Codex (TASK-709).
 */
export function featSelectableColumns(
  feat: Feat,
  options: FeatSelectableColumnOptions = {},
): ColumnValue[] {
  const values = buildFeatGridColumns(feat, 'codex');
  const headers = CODEX_FEAT_HEADER_COLUMNS.filter((h) => h.key !== 'name');
  const columns = headers.map((h, i) => ({
    key: h.key,
    label: h.label,
    value: values[i]?.value ?? '-',
    align: 'center' as const,
  }));
  return options.omitRequiredLevel ? columns.filter((column) => column.key !== 'lvl_req') : columns;
}

export interface FeatFilterOptions {
  levels: number[];
  abilities: string[];
  categories: string[];
  tags: string[];
  abilReqAbilities: string[];
}

export interface FeatListFilters {
  search: string;
  maxLevel: number | null;
  abilityRequirements: AbilityRequirement[];
  categories: string[];
  abilities: string[];
  tags: string[];
  tagMode: 'any' | 'all';
  featTypeMode: 'all' | 'archetype' | 'character' | '';
  stateFeatMode: 'all' | 'only' | 'hide' | '';
}

export interface FilterFeatsOptions {
  character?: Character;
  showUnqualified?: boolean;
  skills?: CodexSkillForFeat[];
  allFeats?: Feat[];
  /**
   * Archetype Path filter (ADR-0014): normalized ids the selected paths recommend, from
   * `pathRecommendedEntityIds`. `null` / omitted = no path filter. A feat matches when the path
   * recommends the row itself or its feat-family base, so higher ranks stay with their family.
   */
  pathRecommendedIds?: ReadonlySet<string> | null;
}

type FeatPathRow = Pick<Feat, 'id'> & { base_feat_id?: string | number | null };

function featPathFamilyId(feat: FeatPathRow): string {
  return feat.base_feat_id ? String(feat.base_feat_id) : String(feat.id);
}

/** Path filter match: the row itself or its feat-family base (higher ranks stay). */
export function featMatchesPathRecommendedIds(
  feat: FeatPathRow,
  pathRecommendedIds: ReadonlySet<string> | null | undefined,
): boolean {
  if (!pathRecommendedIds) return true;
  return (
    rowMatchesPathRecommendedIds(feat.id, pathRecommendedIds) ||
    rowMatchesPathRecommendedIds(featPathFamilyId(feat), pathRecommendedIds)
  );
}

/** Families that have at least one path-recommended rank — keep sibling ranks listed. */
export function featFamilyIdsMatchingPath(
  feats: readonly FeatPathRow[],
  pathRecommendedIds: ReadonlySet<string> | null | undefined,
): Set<string> | null {
  if (!pathRecommendedIds) return null;
  const families = new Set<string>();
  for (const feat of feats) {
    if (featMatchesPathRecommendedIds(feat, pathRecommendedIds)) {
      families.add(featPathFamilyId(feat));
    }
  }
  return families;
}

/** Selected paths that recommend this feat (or its family base) — row chips while filtering. */
export function featPathChipNames(
  index: PathRecommendationIndex,
  feat: Feat,
  selectedPathIds: readonly string[],
): string[] {
  const names = [
    ...pathNamesForEntity(index, feat.id, selectedPathIds),
    ...pathNamesForEntity(index, getFeatFamilyId(feat), selectedPathIds),
  ];
  return Array.from(new Set(names));
}

export function buildFeatFilterOptions(feats: Feat[] | undefined): FeatFilterOptions {
  if (!feats) return { levels: [], abilities: [], categories: [], tags: [], abilReqAbilities: [] };

  const levels = new Set<number>();
  const abilities = new Set<string>();
  const categories = new Set<string>();
  const tags = new Set<string>();
  const abilReqAbilities = new Set<string>();

  feats.forEach((f) => {
    if (f.lvl_req > 0) levels.add(f.lvl_req);
    normalizeFeatAbilities(f.ability).forEach((a) => abilities.add(a));
    if (f.category) categories.add(f.category);
    f.tags?.forEach((t) => tags.add(t));
    f.ability_req?.forEach((a) => abilReqAbilities.add(a));
  });

  return {
    levels: Array.from(levels).sort((a, b) => a - b),
    abilities: Array.from(abilities).sort(),
    categories: Array.from(categories).sort(),
    tags: Array.from(tags).sort(),
    abilReqAbilities: Array.from(abilReqAbilities).sort(),
  };
}

export function filterFeats(
  feats: Feat[],
  filters: FeatListFilters,
  options?: FilterFeatsOptions,
): Feat[] {
  const { character, showUnqualified, skills, allFeats, pathRecommendedIds } = options ?? {};

  return feats.filter((f) => {
    if (!featMatchesPathRecommendedIds(f, pathRecommendedIds)) return false;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        f.name.toLowerCase().includes(searchLower) ||
        f.description?.toLowerCase().includes(searchLower) ||
        f.tags?.some((t) => t.toLowerCase().includes(searchLower));
      if (!matchesSearch) return false;
    }

    if (filters.maxLevel !== null && (f.lvl_req ?? 0) > filters.maxLevel) return false;

    if (filters.featTypeMode === 'archetype' && f.char_feat) return false;
    if (filters.featTypeMode === 'character' && !f.char_feat) return false;

    if (filters.stateFeatMode === 'only' && !f.state_feat) return false;
    if (filters.stateFeatMode === 'hide' && f.state_feat) return false;

    for (const req of filters.abilityRequirements) {
      const index = f.ability_req?.indexOf(req.ability) ?? -1;
      if (index !== -1) {
        const val = f.abil_req_val?.[index];
        if (typeof val === 'number' && val > req.maxValue) return false;
      }
    }

    if (filters.categories.length > 0 && !filters.categories.includes(f.category || ''))
      return false;

    if (filters.abilities.length > 0) {
      const featAbilities = normalizeFeatAbilities(f.ability);
      if (!featAbilities.some((a) => filters.abilities.includes(a))) return false;
    }

    if (filters.tags.length > 0) {
      if (filters.tagMode === 'all') {
        if (!filters.tags.every((t) => f.tags?.includes(t))) return false;
      } else if (!filters.tags.some((t) => f.tags?.includes(t))) {
        return false;
      }
    }

    if (character && !showUnqualified && skills && allFeats) {
      const { met } = checkFeatRequirements(f, character, skills, allFeats);
      if (!met) return false;
    }

    return true;
  });
}

export function buildFeatDetailSections(
  feat: Feat,
  skillIdToName: Map<string, string>,
  familyLevels: Feat[] = [],
  /**
   * Optional overrides. `isCharacterFeat` lets selection UIs (character creator)
   * drive the Type chip from their own character/archetype split instead of
   * `feat.char_feat`. `hideTypeSection` omits Type chips when the list context
   * already separates archetype vs character feats (no column duplication).
   */
  opts?: { isCharacterFeat?: boolean; hideTypeSection?: boolean },
): Array<{ label: string; chips: ChipData[]; hideLabelIfSingle?: boolean }> {
  const detailSections: Array<{ label: string; chips: ChipData[]; hideLabelIfSingle?: boolean }> =
    [];

  const isCharacterFeat = opts?.isCharacterFeat ?? feat.char_feat;
  if (!opts?.hideTypeSection) {
    const typeChips: ChipData[] = [];
    if (isCharacterFeat) typeChips.push(descriptorChipData('Character Feat', 'skill'));
    else typeChips.push(descriptorChipData('Archetype Feat', 'archetype'));
    if (feat.state_feat) typeChips.push(descriptorChipData('State Feat', 'archetype'));
    if (typeChips.length > 0) {
      detailSections.push({ label: 'Type', chips: typeChips, hideLabelIfSingle: true });
    }
  }

  // Category omitted — already shown in collapsed row columns (redundancy rule).

  const abilityReqChips = (feat.ability_req || []).map((a, i) => {
    const val = feat.abil_req_val?.[i];
    return descriptorChipData(`${a}${typeof val === 'number' ? ` ${val}+` : ''}`, 'default');
  });
  if (abilityReqChips.length > 0) {
    detailSections.push({ label: 'Ability Requirements', chips: abilityReqChips });
  }

  const skillReqChips = (feat.skill_req || []).map((id, i) => {
    const label = skillIdToName.get(String(id)) || String(id);
    const val = feat.skill_req_val?.[i];
    return descriptorChipData(`${label}${typeof val === 'number' ? ` ${val}+` : ''}`, 'skill');
  });
  if (skillReqChips.length > 0) {
    detailSections.push({ label: 'Skill Requirements', chips: skillReqChips });
  }

  const levelChips = buildFeatLevelChips(familyLevels, feat.id);
  if (levelChips.length > 0) {
    detailSections.push({ label: 'Feat Levels', chips: levelChips });
  }

  const tagChips = feat.tags?.map((tag) => tagDescriptorChip(tag)) || [];
  if (tagChips.length > 0) {
    detailSections.push({ label: 'Tags', chips: tagChips });
  }

  return detailSections;
}

export function buildFeatGridColumns(
  feat: Feat,
  variant: 'codex' | 'admin',
): Array<{ key: string; value: string }> {
  const reqLevel =
    variant === 'admin' && (feat.lvl_req === 0 || feat.lvl_req == null) ? '-' : feat.lvl_req || '-';
  const uses =
    variant === 'admin' && (feat.uses_per_rec === 0 || feat.uses_per_rec == null)
      ? '-'
      : feat.uses_per_rec != null && feat.uses_per_rec > 0
        ? String(feat.uses_per_rec)
        : '-';

  const codexColumns = [
    { key: 'Req. Level', value: String(reqLevel) },
    { key: 'Category', value: formatListCellLabel(feat.category) },
    { key: 'Ability', value: formatAbilityList(feat.ability) },
    { key: 'Uses', value: uses },
    { key: 'Recovery', value: formatListCellLabel(feat.rec_period) },
  ];

  if (variant === 'codex') return codexColumns;

  return [
    { key: 'Req. Level', value: String(reqLevel) },
    { key: 'Category', value: formatListCellLabel(feat.category) },
    { key: 'Ability', value: formatAbilityList(feat.ability) },
    { key: 'Recovery', value: formatListCellLabel(feat.rec_period) },
    { key: 'Uses', value: uses },
  ];
}
