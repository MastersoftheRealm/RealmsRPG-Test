/**
 * Shared codex feat list helpers (Codex feats tab + Admin feats tab).
 */

import type { AbilityRequirement } from '@/components/codex';
import type { ChipData } from '@/components/shared/grid-list-row';
import type { Feat, Skill } from '@/hooks';
import { buildFeatLevelChips } from '@/lib/leveled-feats';
import { checkFeatRequirements } from '@/lib/game/feat-requirements';
import type { CodexSkillForFeat } from '@/lib/game/formulas';
import { formatAbilityList, formatListCellLabel } from '@/lib/utils';
import type { Character } from '@/types';

export const FEAT_GRID_COLUMNS = '1.5fr 0.8fr 1fr 0.8fr 0.8fr 1fr 40px';

export const CODEX_FEAT_HEADER_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'lvl_req', label: 'REQ. LEVEL' },
  { key: 'category', label: 'CATEGORY' },
  { key: 'ability', label: 'ABILITY' },
  { key: 'uses_per_rec', label: 'USES' },
  { key: 'rec_period', label: 'RECOVERY' },
  { key: '_actions', label: '', sortable: false as const },
];

export const ADMIN_FEAT_HEADER_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'lvl_req', label: 'REQ. LEVEL' },
  { key: 'category', label: 'CATEGORY' },
  { key: 'ability', label: 'ABILITY' },
  { key: 'rec_period', label: 'RECOVERY' },
  { key: 'uses_per_rec', label: 'USES' },
  { key: '_actions', label: '', sortable: false as const },
];

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
    if (Array.isArray(f.ability)) {
      f.ability.forEach((a) => abilities.add(a));
    } else if (f.ability) {
      abilities.add(f.ability);
    }
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

export function buildSkillIdToName(skills: Skill[]): Map<string, string> {
  const map = new Map<string, string>();
  skills.forEach((s) => map.set(String(s.id), s.name));
  return map;
}

export function filterFeats(feats: Feat[], filters: FeatListFilters, options?: FilterFeatsOptions): Feat[] {
  const { character, showUnqualified, skills, allFeats } = options ?? {};

  return feats.filter((f) => {
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

    if (filters.categories.length > 0 && !filters.categories.includes(f.category || '')) return false;

    if (filters.abilities.length > 0) {
      const featAbilities = Array.isArray(f.ability) ? f.ability : f.ability ? [f.ability] : [];
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
   * `feat.char_feat`.
   */
  opts?: { isCharacterFeat?: boolean }
): Array<{ label: string; chips: ChipData[]; hideLabelIfSingle?: boolean }> {
  const detailSections: Array<{ label: string; chips: ChipData[]; hideLabelIfSingle?: boolean }> = [];

  const isCharacterFeat = opts?.isCharacterFeat ?? feat.char_feat;
  const typeChips: ChipData[] = [];
  if (isCharacterFeat) typeChips.push({ name: 'Character Feat', category: 'skill' });
  else typeChips.push({ name: 'Archetype Feat', category: 'archetype' });
  if (feat.state_feat) typeChips.push({ name: 'State Feat', category: 'archetype' });
  if (typeChips.length > 0) {
    detailSections.push({ label: 'Type', chips: typeChips, hideLabelIfSingle: true });
  }

  if (feat.category) {
    detailSections.push({
      label: 'Category',
      chips: [{ name: formatListCellLabel(feat.category), category: 'default' }],
      hideLabelIfSingle: true,
    });
  }

  const tagChips = feat.tags?.map((tag) => ({ name: tag, category: 'tag' as const })) || [];
  if (tagChips.length > 0) {
    detailSections.push({ label: 'Tags', chips: tagChips, hideLabelIfSingle: true });
  }

  const abilityReqChips = (feat.ability_req || []).map((a, i) => {
    const val = feat.abil_req_val?.[i];
    return { name: `${a}${typeof val === 'number' ? ` ${val}+` : ''}`, category: 'default' as const };
  });
  if (abilityReqChips.length > 0) {
    detailSections.push({ label: 'Ability Requirements', chips: abilityReqChips });
  }

  const skillReqChips = (feat.skill_req || []).map((id, i) => {
    const label = skillIdToName.get(String(id)) || String(id);
    const val = feat.skill_req_val?.[i];
    return { name: `${label}${typeof val === 'number' ? ` ${val}+` : ''}`, category: 'skill' as const };
  });
  if (skillReqChips.length > 0) {
    detailSections.push({ label: 'Skill Requirements', chips: skillReqChips });
  }

  const levelChips = buildFeatLevelChips(familyLevels, feat.id);
  if (levelChips.length > 0) {
    detailSections.push({ label: 'Feat Levels', chips: levelChips });
  }

  return detailSections;
}

export function buildFeatGridColumns(
  feat: Feat,
  variant: 'codex' | 'admin'
): Array<{ key: string; value: string }> {
  const reqLevel =
    variant === 'admin' && (feat.lvl_req === 0 || feat.lvl_req == null)
      ? '-'
      : feat.lvl_req || '-';
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
