/**
 * Feats Step - Codex-Style
 * =========================
 * Select character feats with Codex-style filtering and GridListRow cards.
 * Features auto-filters based on character stats to hide unqualified feats.
 * 
 * Character feats: always 1 per level (= level).
 * Archetype feats: varies by archetype (see calculateMaxArchetypeFeats).
 * At level 1: Power=1, Powered-Martial=2, Martial=3.
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Spinner, Button } from '@/components/ui';
import { 
  GridListRow, 
  SearchInput, 
  ListHeader,
  type ChipData 
} from '@/components/shared';
import { 
  FilterSection, 
  ChipSelect,
} from '@/components/codex';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { PathHelpCard } from '@/components/character-creator/PathHelpCard';
import { useCodexFeats, useCodexSkills, type Feat, type Skill } from '@/hooks';
import { calculateMaxArchetypeFeats, calculateMaxCharacterFeats, getSkillBonusForFeatRequirement } from '@/lib/game/formulas';
import { formatAbilityList } from '@/lib/utils';
import { buildFeatLevelChips, getFeatFamilyId, getFeatLevel, groupFeatFamilies, formatFeatName } from '@/lib/leveled-feats';
import type { ArchetypeCategory } from '@/types';
import { parseArchetypePathData } from '@/lib/game/archetype-path';

function getPreviousLevelFeatId(feat: Feat, allFeats: Feat[]): string | null {
  const level = getFeatLevel(feat);
  if (level <= 1) return null;
  if (feat.base_feat_id && level === 2) return String(feat.base_feat_id);
  if (feat.base_feat_id && level >= 3) {
    const prev = allFeats.find(
      (f) => f.base_feat_id === feat.base_feat_id && getFeatLevel(f) === level - 1
    );
    return prev ? String(prev.id) : null;
  }
  return null;
}

// Grid columns for feat display (Name, Category, Ability, Recovery, Uses, Add) — match Codex
const FEAT_GRID_COLUMNS = '1.5fr 1fr 0.8fr 0.8fr 0.8fr 44px';
const FEAT_HEADER_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'category', label: 'CATEGORY' },
  { key: 'ability', label: 'ABILITY' },
  { key: 'rec_period', label: 'RECOVERY', sortable: false as const },
  { key: 'uses_per_rec', label: 'USES', sortable: false as const },
  { key: '_actions', label: '', sortable: false as const },
];

interface SelectedFeat {
  id: string;
  name: string;
  description?: string;
  type: 'archetype' | 'character';
}

interface FeatFilters {
  search: string;
  categories: string[];
  abilityFilter: string[];
  /** Either archetype feats or character feats (no "all" in creator) */
  featType: 'archetype' | 'character';
  hideUnqualified: boolean;
  sortCol: string;
  sortDir: 1 | -1;
}

export function FeatsStep() {
  const { draft, nextStep, prevStep, updateDraft } = useCharacterCreatorStore();
  const { data: feats, isLoading } = useCodexFeats();
  const { data: skillsDb = [] } = useCodexSkills();
  
  const [expandedSelectedId, setExpandedSelectedId] = useState<string | null>(null);
  const [usePathRecommendations, setUsePathRecommendations] = useState(draft.creationMode === 'path');
  const [filters, setFilters] = useState<FeatFilters>({
    search: '',
    categories: [],
    abilityFilter: [],
    featType: 'archetype', // Either/or: picking archetype or character feats
    hideUnqualified: true,
    sortCol: 'name',
    sortDir: 1,
  });

  const featById = useMemo(() => {
    const map = new Map<string, Feat>();
    (feats || []).forEach((f: Feat) => map.set(String(f.id), f));
    return map;
  }, [feats]);

  // Build skill ID -> name map for requirements and display
  const skillIdToName = useMemo(() => {
    const map = new Map<string, string>();
    (skillsDb as Skill[]).forEach((s) => {
      map.set(String(s.id), s.name);
    });
    return map;
  }, [skillsDb]);

  // Get feat limits based on archetype type and level
  const archetypeType = (draft.archetype?.type || 'power') as ArchetypeCategory;
  const pathData = useMemo(() => parseArchetypePathData(draft.archetype?.path_data), [draft.archetype?.path_data]);
  const recommendedFeatRefs = useMemo(() => new Set((pathData?.level1?.feats || []).map((v: string) => String(v).toLowerCase())), [pathData?.level1?.feats]);
  const level = draft.level || 1;
  const maxArchetypeFeats = calculateMaxArchetypeFeats(level, archetypeType);
  const maxCharacterFeats = calculateMaxCharacterFeats(level);
  
  // Separate selected feats by type
  const { selectedArchetypeFeats, selectedCharacterFeats } = useMemo(() => {
    const archFeats: SelectedFeat[] = [];
    const charFeats: SelectedFeat[] = [];
    
    draft.feats?.forEach(f => {
      if (f.type === 'character') {
        charFeats.push(f as SelectedFeat);
      } else {
        archFeats.push(f as SelectedFeat);
      }
    });
    
    return { 
      selectedArchetypeFeats: archFeats, 
      selectedCharacterFeats: charFeats 
    };
  }, [draft.feats]);

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    if (!feats) return [];
    const cats = new Set<string>();
    feats.forEach((f: Feat) => f.category && cats.add(f.category));
    return Array.from(cats).sort();
  }, [feats]);

  // Get unique abilities for filter dropdown
  const abilityOptions = useMemo(() => {
    if (!feats) return [];
    const abils = new Set<string>();
    feats.forEach((f: Feat) => {
      if (!f.ability) return;
      if (Array.isArray(f.ability)) f.ability.forEach(a => abils.add(a));
      else abils.add(f.ability);
    });
    return Array.from(abils).sort();
  }, [feats]);

  // Check if character meets feat requirements
  const checkRequirements = useCallback((feat: Feat): { met: boolean; reason?: string } => {
    const abilities = draft.abilities || {};
    const skills = draft.skills || {};
    
    // Check level requirement
    if (feat.lvl_req > (draft.level || 1)) {
      return { met: false, reason: `Requires level ${feat.lvl_req}` };
    }
    
    // Check ability requirements
    for (let i = 0; i < feat.ability_req.length; i++) {
      const reqAbility = feat.ability_req[i].toLowerCase() as keyof typeof abilities;
      const reqValue = feat.abil_req_val[i] || 0;
      const charValue = abilities[reqAbility] || 0;
      
      if (charValue < reqValue) {
        return { met: false, reason: `Requires ${feat.ability_req[i]} ${reqValue}+` };
      }
    }
    
    // Skill requirements: skill_req_val = required SKILL BONUS (not value). Proficiency required for all.
    for (let i = 0; i < feat.skill_req.length; i++) {
      const skillId = String(feat.skill_req[i]);
      const reqSkillName = skillIdToName.get(skillId) || skillId;
      const requiredBonus = feat.skill_req_val?.[i] ?? 1;
      const { bonus, proficient } = getSkillBonusForFeatRequirement(
        skillId,
        abilities,
        skills as Record<string, number>,
        skillsDb as import('@/lib/game/formulas').CodexSkillForFeat[]
      );
      if (!proficient) {
        return { met: false, reason: `Requires proficiency in ${reqSkillName}` };
      }
      if (bonus < requiredBonus) {
        return { met: false, reason: `Requires ${reqSkillName} bonus ${requiredBonus}+ (yours: ${bonus})` };
      }
    }
    
    // Check martial ability requirement
    if (feat.mart_abil_req && draft.archetype?.mart_abil !== feat.mart_abil_req) {
      return { met: false, reason: `Requires ${feat.mart_abil_req} martial ability` };
    }

    // Leveled feat prerequisite: requires previous level by id.
    const prevLevelId = getPreviousLevelFeatId(feat, feats || []);
    if (prevLevelId) {
      const hasPrevious = (draft.feats || []).some((f) => String(f.id) === prevLevelId);
      if (!hasPrevious) {
        const prevFeat = (feats || []).find((f) => String(f.id) === prevLevelId);
        const prevLevel = getFeatLevel(prevFeat);
        return { met: false, reason: `Requires ${prevFeat?.name ?? 'previous level'} (Level ${prevLevel})` };
      }
    }
    
    return { met: true };
  }, [draft.abilities, draft.skills, draft.level, draft.archetype?.mart_abil, draft.feats, skillIdToName, skillsDb, feats]);

  // Filter and sort feats
  const filteredFeats = useMemo(() => {
    if (!feats) return [];
    
    return feats.filter((feat: Feat) => {
      // Search filter
      if (filters.search) {
        const term = filters.search.toLowerCase();
        const matches = 
          feat.name.toLowerCase().includes(term) ||
          feat.description?.toLowerCase().includes(term) ||
          feat.tags.some(t => t.toLowerCase().includes(term));
        if (!matches) return false;
      }
      
      // Feat type: either archetype or character (no "all" in creator)
      if (filters.featType === 'archetype' && feat.char_feat) return false;
      if (filters.featType === 'character' && !feat.char_feat) return false;

      if (
        draft.creationMode === 'path' &&
        usePathRecommendations &&
        filters.featType === 'archetype' &&
        recommendedFeatRefs.size > 0
      ) {
        const featId = String(feat.id).toLowerCase();
        const featName = String(feat.name).toLowerCase();
        if (!recommendedFeatRefs.has(featId) && !recommendedFeatRefs.has(featName)) return false;
      }
      
      // Category filter (multi-select)
      if (filters.categories.length > 0 && !filters.categories.includes(feat.category)) {
        return false;
      }
      
      // Ability filter (multi-select)
      if (filters.abilityFilter.length > 0) {
        if (!feat.ability) return false;
        const featAbilities = Array.isArray(feat.ability) ? feat.ability : [feat.ability];
        if (!featAbilities.some(a => filters.abilityFilter.includes(a))) return false;
      }
      
      // Hide unqualified filter (auto-filter based on character stats)
      if (filters.hideUnqualified) {
        const reqs = checkRequirements(feat);
        if (!reqs.met) return false;
      }
      
      return true;
    }).sort((a: Feat, b: Feat) => {
      const col = filters.sortCol as keyof Feat;
      const aVal = a[col] as string | number | undefined;
      const bVal = b[col] as string | number | undefined;
      const aStr = aVal != null ? String(aVal) : '';
      const bStr = bVal != null ? String(bVal) : '';
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return filters.sortDir * (aVal - bVal);
      }
      return filters.sortDir * aStr.localeCompare(bStr);
    });
  }, [feats, filters, checkRequirements, draft.creationMode, usePathRecommendations, recommendedFeatRefs]);

  const groupedDisplayFeats = useMemo(() => {
    const families = groupFeatFamilies(filteredFeats);
    return families
      .map((family) => {
        const selectableByReq = family.levels.filter((levelFeat) => checkRequirements(levelFeat).met);
        const levelsByPriority = (filters.hideUnqualified ? selectableByReq : family.levels)
          .slice()
          .sort((a, b) => getFeatLevel(b) - getFeatLevel(a));
        const displayFeat = levelsByPriority[0];
        if (!displayFeat) return null;
        return {
          displayFeat,
          familyLevels: family.levels,
        };
      })
      .filter((entry): entry is { displayFeat: Feat; familyLevels: Feat[] } => entry !== null);
  }, [filteredFeats, checkRequirements, filters.hideUnqualified]);

  // Path-only mode: archetype feats (recommended) and character feats in separate lists
  const pathModeArchetypeFeats = useMemo(() => {
    if (!feats || recommendedFeatRefs.size === 0) return [];
    const archetypeOnly = feats.filter((f: Feat) => !f.char_feat);
    const recommended = archetypeOnly.filter(
      (f: Feat) =>
        recommendedFeatRefs.has(String(f.id).toLowerCase()) ||
        recommendedFeatRefs.has(String(f.name).toLowerCase())
    );
    const families = groupFeatFamilies(recommended);
    return families
      .map((family) => {
        const levelsByPriority = family.levels.slice().sort((a, b) => getFeatLevel(b) - getFeatLevel(a));
        const displayFeat = levelsByPriority[0];
        if (!displayFeat) return null;
        return { displayFeat, familyLevels: family.levels };
      })
      .filter((entry): entry is { displayFeat: Feat; familyLevels: Feat[] } => entry !== null);
  }, [feats, recommendedFeatRefs]);

  // Path-only mode: character feats recommended by the path (same refs as archetype, filtered by char_feat)
  const pathModeCharacterFeats = useMemo(() => {
    if (!feats || recommendedFeatRefs.size === 0) return [];
    const charOnly = feats.filter((f: Feat) => !!f.char_feat);
    const recommended = charOnly.filter(
      (f: Feat) =>
        recommendedFeatRefs.has(String(f.id).toLowerCase()) ||
        recommendedFeatRefs.has(String(f.name).toLowerCase())
    );
    const families = groupFeatFamilies(recommended);
    return families
      .map((family) => {
        const levelsByPriority = family.levels.slice().sort((a, b) => getFeatLevel(b) - getFeatLevel(a));
        const displayFeat = levelsByPriority[0];
        if (!displayFeat) return null;
        return { displayFeat, familyLevels: family.levels };
      })
      .filter((entry): entry is { displayFeat: Feat; familyLevels: Feat[] } => entry !== null);
  }, [feats, recommendedFeatRefs]);

  const toggleFeat = useCallback((feat: Feat, isCharacterFeat: boolean) => {
    const featType = isCharacterFeat ? 'character' : 'archetype';
    const selectedList = isCharacterFeat ? selectedCharacterFeats : selectedArchetypeFeats;
    const maxForType = isCharacterFeat ? maxCharacterFeats : maxArchetypeFeats;
    
    const isSelected = selectedList.some(f => f.id === feat.id);
    
    if (isSelected) {
      // Remove feat
      updateDraft({
        feats: draft.feats?.filter(f => f.id !== feat.id) || []
      });
    } else {
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

      // Add feat (and replace lower levels in same family)
      updateDraft({
        feats: [
          ...((draft.feats || []).filter((f) => !replacementIds.has(String(f.id)))),
          {
            id: feat.id,
            name: feat.name,
            description: feat.description,
            type: featType,
          }
        ]
      });
    }
  }, [selectedArchetypeFeats, selectedCharacterFeats, maxArchetypeFeats, maxCharacterFeats, draft.feats, featById, updateDraft]);

  const handleSort = useCallback((col: string) => {
    setFilters(prev => ({
      ...prev,
      sortCol: col,
      sortDir: prev.sortCol === col ? (prev.sortDir === 1 ? -1 : 1) : 1,
    }));
  }, []);

  // Build GridListRow for a feat family display item
  const renderFeatRow = useCallback((feat: Feat, familyLevels: Feat[], isCharacterFeat: boolean) => {
    const selectedList = isCharacterFeat ? selectedCharacterFeats : selectedArchetypeFeats;
    const maxForType = isCharacterFeat ? maxCharacterFeats : maxArchetypeFeats;
    
    const isSelected = selectedList.some(f => f.id === feat.id);
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
    
    // Build detail sections (Type, Category, Tags, Requirements) - consistent header+chips format
    const detailSections: Array<{ label: string; chips: ChipData[]; hideLabelIfSingle?: boolean }> = [];
    
    // Type: Character/Archetype, State
    const typeChips: ChipData[] = [];
    if (isCharacterFeat) typeChips.push({ name: 'Character Feat', category: 'skill' });
    else typeChips.push({ name: 'Archetype Feat', category: 'archetype' });
    if (feat.state_feat) typeChips.push({ name: 'State Feat', category: 'archetype' });
    if (typeChips.length > 0) {
      detailSections.push({ label: 'Type', chips: typeChips, hideLabelIfSingle: true });
    }
    
    // Category
    if (feat.category) {
      detailSections.push({ label: 'Category', chips: [{ name: feat.category, category: 'default' }], hideLabelIfSingle: true });
    }
    
    // Tags
    const tagChips: ChipData[] = feat.tags?.map(tag => ({ name: tag, category: 'tag' as const })) || [];
    if (tagChips.length > 0) {
      detailSections.push({ label: 'Tags', chips: tagChips, hideLabelIfSingle: true });
    }
    
    // Ability Requirements
    const abilityReqChips: ChipData[] = (feat.ability_req || []).map((a, i) => {
      const val = feat.abil_req_val?.[i];
      return { name: `${a}${typeof val === 'number' ? ` ${val}+` : ''}`, category: 'default' as const };
    });
    if (abilityReqChips.length > 0) {
      detailSections.push({ label: 'Ability Requirements', chips: abilityReqChips });
    }
    
    // Skill Requirements
    const skillReqChips: ChipData[] = (feat.skill_req || []).map((id, i) => {
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

    return (
      <GridListRow
        key={feat.id}
        id={feat.id}
        name={formatFeatName(feat)}
        description={feat.description}
        gridColumns={FEAT_GRID_COLUMNS}
        columns={[
          { key: 'Category', value: feat.category || '-' },
          { key: 'Ability', value: formatAbilityList(feat.ability) },
          { key: 'Recovery', value: feat.rec_period || '-' },
          { key: 'Uses', value: (feat.uses_per_rec == null || feat.uses_per_rec === 0) ? '-' : String(feat.uses_per_rec) },
        ]}
        detailSections={detailSections.length > 0 ? detailSections : undefined}
        selectable
        isSelected={isSelected}
        onSelect={() => canSelect && toggleFeat(feat, isCharacterFeat)}
        disabled={!canSelect}
        warningMessage={!requirements.met ? requirements.reason : undefined}
      />
    );
  }, [selectedArchetypeFeats, selectedCharacterFeats, maxArchetypeFeats, maxCharacterFeats, checkRequirements, toggleFeat, featById, skillIdToName]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto flex items-center justify-center py-12">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Select Feats</h2>
          <p className="text-text-secondary">
            Choose feats that grant special abilities and bonuses. Your archetype 
            ({archetypeType}) allows {maxArchetypeFeats} archetype feat{maxArchetypeFeats !== 1 ? 's' : ''} 
            {' '}and {maxCharacterFeats} character feat.
          </p>
        </div>
      </div>

      {draft.creationMode === 'path' && draft.archetype?.name && (
        <PathHelpCard pathName={draft.archetype.name}>
          the recommended feats are shown below. You can switch to choose your own if you prefer.
        </PathHelpCard>
      )}

      {/* Selected Feats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Archetype Feats Selected */}
        <div className={cn(
          'p-4 rounded-xl border-2',
          selectedArchetypeFeats.length === maxArchetypeFeats
            ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-600/50'
            : 'bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-600/50'
        )}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-text-primary">Archetype Feats</h3>
            <span className={cn(
              'px-3 py-1 rounded-full text-sm font-bold',
              selectedArchetypeFeats.reduce((sum, f) => sum + getFeatLevel(featById.get(String(f.id))), 0) === maxArchetypeFeats
                ? 'bg-green-200 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                : 'bg-amber-200 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
            )}>
              {selectedArchetypeFeats.reduce((sum, f) => sum + getFeatLevel(featById.get(String(f.id))), 0)} / {maxArchetypeFeats}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedArchetypeFeats.length === 0 ? (
              <span className="text-sm text-text-muted dark:text-text-secondary italic">None selected</span>
            ) : (
              selectedArchetypeFeats.map(feat => {
                const key = `arch-${feat.id}`;
                const isExpanded = expandedSelectedId === key;
                const fullFeat = feats?.find(f => String(f.id) === String(feat.id));
                const displayName = fullFeat ? formatFeatName(fullFeat) : feat.name;
                return (
                  <div key={feat.id} className="rounded-lg border border-amber-200 bg-white overflow-hidden max-w-md">
                    <div className="px-3 py-1.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setExpandedSelectedId(isExpanded ? null : key)}
                        className="text-amber-700 font-medium text-sm text-left flex-1 truncate"
                      >
                        {displayName}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); updateDraft({ feats: draft.feats?.filter(f => f.id !== feat.id) }); }}
                        className="text-danger dark:text-danger-400 hover:text-danger-600 dark:hover:text-danger-300 font-bold flex-shrink-0 min-w-[var(--touch-target-min,44px)] min-h-[var(--touch-target-min,44px)]"
                      >
                        ×
                      </button>
                    </div>
                    {isExpanded && feat.description && (
                      <div className="px-3 pb-2 pt-0 text-xs text-text-secondary border-t border-amber-100">
                        {feat.description}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Character Feats Selected */}
        <div className={cn(
          'p-4 rounded-xl border-2',
          selectedCharacterFeats.length === maxCharacterFeats
            ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-600/50'
            : 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600/50'
        )}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-text-primary">Character Feats</h3>
            <span className={cn(
              'px-3 py-1 rounded-full text-sm font-bold',
              selectedCharacterFeats.reduce((sum, f) => sum + getFeatLevel(featById.get(String(f.id))), 0) === maxCharacterFeats
                ? 'bg-green-200 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                : 'bg-blue-200 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'
            )}>
              {selectedCharacterFeats.reduce((sum, f) => sum + getFeatLevel(featById.get(String(f.id))), 0)} / {maxCharacterFeats}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedCharacterFeats.length === 0 ? (
              <span className="text-sm text-text-muted dark:text-text-secondary italic">None selected</span>
            ) : (
              selectedCharacterFeats.map(feat => {
                const key = `char-${feat.id}`;
                const isExpanded = expandedSelectedId === key;
                const fullFeat = feats?.find(f => String(f.id) === String(feat.id));
                const displayName = fullFeat ? formatFeatName(fullFeat) : feat.name;
                return (
                  <div key={feat.id} className="rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-surface-alt overflow-hidden max-w-md">
                    <div className="px-3 py-1.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setExpandedSelectedId(isExpanded ? null : key)}
                        className="text-blue-700 dark:text-blue-300 font-medium text-sm text-left flex-1 truncate"
                      >
                        {displayName}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); updateDraft({ feats: draft.feats?.filter(f => f.id !== feat.id) }); }}
                        className="text-danger dark:text-danger-400 hover:text-danger-600 dark:hover:text-danger-300 font-bold flex-shrink-0 min-w-[var(--touch-target-min,44px)] min-h-[var(--touch-target-min,44px)]"
                      >
                        ×
                      </button>
                    </div>
                    {isExpanded && feat.description && (
                      <div className="px-3 pb-2 pt-0 text-xs text-text-secondary border-t border-blue-100 dark:border-blue-800">
                        {feat.description}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Toggle row: path toggle (left), archetype/character toggle (right, only when showing all feats) */}
      <div className="flex flex-wrap items-center gap-3 gap-y-1 mb-4">
        {draft.creationMode === 'path' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setUsePathRecommendations((value) => !value)}
              className={cn(
                'px-4 py-2 rounded-lg border text-sm font-semibold transition-colors',
                usePathRecommendations
                  ? 'bg-success-50 dark:bg-success-900/30 border-success-300 dark:border-success-600/50 text-success-700 dark:text-success-300'
                  : 'bg-surface border-border-light text-text-secondary hover:bg-surface-alt'
              )}
            >
              {usePathRecommendations
                ? `Showing ${draft.archetype?.name ?? 'Path'} Feats`
                : 'Choose My Own Feats'}
            </button>
            <span className="text-xs text-text-muted dark:text-text-secondary">
              {usePathRecommendations ? 'Click to show all feats' : 'Click to show path feats'}
            </span>
          </div>
        )}
        {draft.creationMode === 'path' && !usePathRecommendations && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilters(f => ({ ...f, featType: f.featType === 'archetype' ? 'character' : 'archetype' }))}
              className={cn(
                'px-4 py-2 rounded-lg border text-sm font-semibold transition-colors',
                filters.featType === 'archetype'
                  ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-400 dark:border-amber-600 text-amber-800 dark:text-amber-200'
                  : 'bg-blue-100 dark:bg-blue-900/40 border-blue-400 dark:border-blue-600 text-blue-800 dark:text-blue-200'
              )}
            >
              {filters.featType === 'archetype' ? 'Showing Archetype Feats' : 'Showing Character Feats'}
            </button>
            <span className="text-xs text-text-muted dark:text-text-secondary">Click to switch</span>
          </div>
        )}
        {draft.creationMode !== 'path' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilters(f => ({ ...f, featType: f.featType === 'archetype' ? 'character' : 'archetype' }))}
              className={cn(
                'px-4 py-2 rounded-lg border text-sm font-semibold transition-colors',
                filters.featType === 'archetype'
                  ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-400 dark:border-amber-600 text-amber-800 dark:text-amber-200'
                  : 'bg-blue-100 dark:bg-blue-900/40 border-blue-400 dark:border-blue-600 text-blue-800 dark:text-blue-200'
              )}
            >
              {filters.featType === 'archetype' ? 'Showing Archetype Feats' : 'Showing Character Feats'}
            </button>
            <span className="text-xs text-text-muted dark:text-text-secondary">Click to switch</span>
          </div>
        )}
      </div>

      {usePathRecommendations && draft.creationMode === 'path' ? (
        /* Path mode: path-recommended archetype feats and path-recommended character feats only */
        <div className="space-y-8 mb-8">
          <section>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              {draft.archetype?.name ?? 'Path'} Archetype Feats
            </h3>
            <p className="text-sm text-text-secondary mb-3">
              Choose from the recommended archetype feats for this path.
            </p>
            <ListHeader
              columns={FEAT_HEADER_COLUMNS}
              gridColumns={FEAT_GRID_COLUMNS}
              sortState={{ col: filters.sortCol, dir: filters.sortDir }}
              onSort={handleSort}
            />
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 mt-2">
              {pathModeArchetypeFeats.map(({ displayFeat, familyLevels }) =>
                renderFeatRow(displayFeat, familyLevels, false)
              )}
              {pathModeArchetypeFeats.length === 0 && (
                <div className="text-center py-4 text-text-muted dark:text-text-secondary bg-surface-alt rounded-lg">
                  No recommended archetype feats for this path in codex.
                </div>
              )}
            </div>
          </section>
          <section>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              {draft.archetype?.name ?? 'Path'} Character Feats
            </h3>
            <p className="text-sm text-text-secondary mb-3">
              Choose from the recommended character feats for this path.
            </p>
            <ListHeader
              columns={FEAT_HEADER_COLUMNS}
              gridColumns={FEAT_GRID_COLUMNS}
              sortState={{ col: filters.sortCol, dir: filters.sortDir }}
              onSort={handleSort}
            />
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 mt-2">
              {pathModeCharacterFeats.map(({ displayFeat, familyLevels }) =>
                renderFeatRow(displayFeat, familyLevels, true)
              )}
              {pathModeCharacterFeats.length === 0 && (
                <div className="text-center py-4 text-text-muted dark:text-text-secondary bg-surface-alt rounded-lg">
                  No recommended character feats for this path in codex.
                </div>
              )}
            </div>
          </section>
        </div>
      ) : (
        <>
          {/* Search Bar */}
          <div className="mb-4">
            <SearchInput
              value={filters.search}
              onChange={(v) => setFilters(f => ({ ...f, search: v }))}
              placeholder="Search feats by name, description, or tags..."
            />
          </div>

          {/* Filters Panel - Codex Style */}
          <FilterSection>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ChipSelect
                label="Category"
                placeholder="All categories"
                options={categories.map(c => ({ value: c, label: c }))}
                selectedValues={filters.categories}
                onSelect={(v) => setFilters(f => ({ ...f, categories: [...f.categories, v] }))}
                onRemove={(v) => setFilters(f => ({ ...f, categories: f.categories.filter(c => c !== v) }))}
              />
              <ChipSelect
                label="Ability"
                placeholder="All abilities"
                options={abilityOptions.map(a => ({ value: a, label: a }))}
                selectedValues={filters.abilityFilter}
                onSelect={(v) => setFilters(f => ({ ...f, abilityFilter: [...f.abilityFilter, v] }))}
                onRemove={(v) => setFilters(f => ({ ...f, abilityFilter: f.abilityFilter.filter(a => a !== v) }))}
              />
              <div className="filter-group">
                <label className="block text-sm font-medium text-text-secondary mb-1">Qualification</label>
                <button
                  type="button"
                  onClick={() => setFilters(f => ({ ...f, hideUnqualified: !f.hideUnqualified }))}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg border text-sm font-medium transition-colors text-left',
                    filters.hideUnqualified
                      ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-600/50 text-green-700 dark:text-green-300'
                      : 'bg-surface border-border-light text-text-secondary hover:bg-surface-alt'
                  )}
                >
                  {filters.hideUnqualified ? '✓ Hiding unqualified' : 'Showing all feats'}
                </button>
                <p className="text-xs text-text-muted mt-1">
                  {filters.hideUnqualified ? 'Only feats you qualify for' : 'Including unqualified'}
                </p>
              </div>
            </div>
          </FilterSection>

          <ListHeader
            columns={FEAT_HEADER_COLUMNS}
            gridColumns={FEAT_GRID_COLUMNS}
            sortState={{ col: filters.sortCol, dir: filters.sortDir }}
            onSort={handleSort}
          />

          <div className="mb-8 mt-4">
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {groupedDisplayFeats.map(({ displayFeat, familyLevels }) =>
                renderFeatRow(displayFeat, familyLevels, !!displayFeat.char_feat)
              )}
              {groupedDisplayFeats.length === 0 && (
                <div className="text-center py-4 text-text-muted bg-surface-alt rounded-lg">
                  No feats match your filters.
                  {filters.hideUnqualified && (
                    <button
                      onClick={() => setFilters(f => ({ ...f, hideUnqualified: false }))}
                      className="block mx-auto mt-2 text-primary-600 hover:underline"
                    >
                      Show unqualified feats
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
      
      <div className="flex justify-between">
        <Button
          variant="secondary"
          onClick={prevStep}
        >
          ← Back
        </Button>
        <Button
          onClick={nextStep}
        >
          Continue →
        </Button>
      </div>
    </div>
  );
}
