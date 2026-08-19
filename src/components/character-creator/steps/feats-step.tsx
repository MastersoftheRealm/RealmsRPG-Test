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

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Button, Spinner } from '@/components/ui';
import { GuidedChoiceShell, InfoTippy, PathHelpCard, PathNotes } from '@/components/patterns';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { CreatorStepFooter } from '@/components/character-creator/creator-step-footer';
import {
  useCodexFeats,
  useCodexSkills,
  useMergedSpecies,
  useTraits,
  useCreatorPathData,
  type Feat,
} from '@/hooks';
import { getValidationIssuesForStep, getStepCompletion } from '@/lib/character-creator-validation';
import { calculateMaxArchetypeFeats, calculateMaxCharacterFeats } from '@/lib/game/formulas';
import { filterFeatGuidanceGroups } from '@/lib/game/archetype-path';
import {
  checkFeatRequirements,
  type CharacterForFeatRequirement,
} from '@/lib/game/feat-requirements';
import type { CodexSkillForFeat } from '@/lib/game/formulas';
import { getFeatFamilyId, getFeatLevel, groupFeatFamilies } from '@/lib/leveled-feats';
import { buildSkillIdToName } from '@/lib/codex/skill-list';
import { normalizeFeatAbilities } from '@/lib/codex/feat-ability';
import type { ArchetypeCategory } from '@/types';
import { featSelectionHelp } from '../../../../public/tooltip-text';
import type { FeatFilters, SelectedFeat } from './feats/feat-list-columns';
import { SelectedFeatsSummary } from './feats/selected-feats-summary';
import { PathFeatLists } from './feats/path-feat-lists';
import { FullFeatCatalog } from './feats/full-feat-catalog';
import { buildRecommendedPathFeats } from './feats/apply-recommended-path-feats';
import { buildPathModeFeatFamilies } from './feats/path-mode-feat-families';

export function FeatsStep() {
  const { draft, nextStep, prevStep, updateDraft, getStepLayer, expandLayer, collapseLayer } =
    useCharacterCreatorStore();
  const { data: feats, isLoading } = useCodexFeats();
  const { data: skillsDb = [] } = useCodexSkills();
  const { data: allSpecies = [] } = useMergedSpecies();
  const { data: codexSkills } = useCodexSkills();
  const { data: allTraits } = useTraits();

  const validationContext = useMemo(
    () => ({ allSpecies, codexSkills: codexSkills ?? null, allTraits: allTraits ?? null }),
    [allSpecies, codexSkills, allTraits],
  );
  const stepIssues = useMemo(
    () => getValidationIssuesForStep('feats', draft, validationContext),
    [draft, validationContext],
  );
  const completion = useMemo(
    () => getStepCompletion('feats', draft, validationContext),
    [draft, validationContext],
  );
  const layer = getStepLayer('feats');
  const pathMode = draft.creationMode === 'path';
  const usePathRecommendations = pathMode && layer === 1;
  const canContinue = pathMode && layer === 1 ? completion.done : stepIssues.length === 0;

  const [expandedSelectedId, setExpandedSelectedId] = useState<string | null>(null);
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

  const skillIdToName = useMemo(() => buildSkillIdToName(skillsDb), [skillsDb]);

  // Get feat limits based on archetype type and level
  const archetypeType = (draft.archetype?.type || 'power') as ArchetypeCategory;
  const pathData = useCreatorPathData();
  const recommendedFeatRefs = useMemo(
    () => new Set((pathData?.level1?.feats || []).map((v: string) => String(v).toLowerCase())),
    [pathData?.level1?.feats],
  );
  const level = draft.level || 1;
  const maxArchetypeFeats = calculateMaxArchetypeFeats(
    level,
    archetypeType,
    undefined,
    draft.archetypeChoices,
  );
  const maxCharacterFeats = calculateMaxCharacterFeats(level);

  // Separate selected feats by type
  const { selectedArchetypeFeats, selectedCharacterFeats } = useMemo(() => {
    const archFeats: SelectedFeat[] = [];
    const charFeats: SelectedFeat[] = [];

    draft.feats?.forEach((f) => {
      if (f.type === 'character') {
        charFeats.push(f as SelectedFeat);
      } else {
        archFeats.push(f as SelectedFeat);
      }
    });

    return {
      selectedArchetypeFeats: archFeats,
      selectedCharacterFeats: charFeats,
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
      normalizeFeatAbilities(f.ability).forEach((a) => abils.add(a));
    });
    return Array.from(abils).sort();
  }, [feats]);

  // Check if character meets feat requirements (shared single source of truth)
  const checkRequirements = useCallback(
    (feat: Feat): { met: boolean; reason?: string } => {
      const character: CharacterForFeatRequirement = {
        level: draft.level,
        abilities: draft.abilities,
        skills: draft.skills as CharacterForFeatRequirement['skills'],
        defenseVals: draft.defenseVals,
        defenseSkills: draft.defenseSkills,
        mart_abil: draft.mart_abil,
        archetype: draft.archetype ? { mart_abil: draft.archetype.mart_abil } : undefined,
        speedBase: draft.speedBase,
        feats: draft.feats,
      };
      const { met, reason } = checkFeatRequirements(
        feat,
        character,
        skillsDb as CodexSkillForFeat[],
        feats || [],
      );
      return { met, reason };
    },
    [
      draft.abilities,
      draft.skills,
      draft.level,
      draft.defenseVals,
      draft.defenseSkills,
      draft.mart_abil,
      draft.archetype,
      draft.speedBase,
      draft.feats,
      skillsDb,
      feats,
    ],
  );

  // Filter and sort feats
  const filteredFeats = useMemo(() => {
    if (!feats) return [];

    return feats
      .filter((feat: Feat) => {
        // Search filter
        if (filters.search) {
          const term = filters.search.toLowerCase();
          const matches =
            feat.name.toLowerCase().includes(term) ||
            feat.description?.toLowerCase().includes(term) ||
            feat.tags.some((t) => t.toLowerCase().includes(term));
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
          const featAbilities = normalizeFeatAbilities(feat.ability);
          if (!featAbilities.some((a) => filters.abilityFilter.includes(a))) return false;
        }

        // Hide unqualified filter (auto-filter based on character stats)
        if (filters.hideUnqualified) {
          const reqs = checkRequirements(feat);
          if (!reqs.met) return false;
        }

        return true;
      })
      .sort((a: Feat, b: Feat) => {
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
  }, [
    feats,
    filters,
    checkRequirements,
    draft.creationMode,
    usePathRecommendations,
    recommendedFeatRefs,
  ]);

  const groupedDisplayFeats = useMemo(() => {
    const families = groupFeatFamilies(filteredFeats);
    return families
      .map((family) => {
        const selectableByReq = family.levels.filter(
          (levelFeat) => checkRequirements(levelFeat).met,
        );
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
  const pathModeArchetypeFeats = useMemo(
    () => buildPathModeFeatFamilies(feats, recommendedFeatRefs, false),
    [feats, recommendedFeatRefs],
  );

  // Path-only mode: character feats recommended by the path (same refs as archetype, filtered by char_feat)
  const pathModeCharacterFeats = useMemo(
    () => buildPathModeFeatFamilies(feats, recommendedFeatRefs, true),
    [feats, recommendedFeatRefs],
  );

  /** Layer 1 archetype feat groups (explicit audience; TASK-514). */
  const featGuidanceGroups = useMemo(() => {
    const groups = filterFeatGuidanceGroups(pathData?.level1?.guidance_groups, 'archetype');
    if (groups.length === 0) return null;
    return groups.map((group) => ({
      group,
      archetypeEntries: pathModeArchetypeFeats.filter(({ displayFeat }) => {
        const id = String(displayFeat.id).toLowerCase();
        const name = String(displayFeat.name).toLowerCase();
        return group.feats!.some((ref) => {
          const r = ref.toLowerCase();
          return r === id || r === name;
        });
      }),
    }));
  }, [pathData?.level1?.guidance_groups, pathModeArchetypeFeats]);

  const applyRecommendedPathFeats = useCallback(() => {
    if (!feats || recommendedFeatRefs.size === 0) return;
    const next = buildRecommendedPathFeats({
      currentFeats: draft.feats as SelectedFeat[] | undefined,
      pathModeArchetypeFeats,
      pathModeCharacterFeats,
      maxArchetypeFeats,
      maxCharacterFeats,
      featById,
      checkRequirements,
    });
    if (next) updateDraft({ feats: next });
  }, [
    feats,
    recommendedFeatRefs.size,
    draft.feats,
    pathModeArchetypeFeats,
    pathModeCharacterFeats,
    maxArchetypeFeats,
    maxCharacterFeats,
    featById,
    checkRequirements,
    updateDraft,
  ]);

  const pathFeatMergeKey = draft.creationMode === 'path' ? String(draft.archetypePathId ?? '') : '';
  const hasAppliedPathFeatsRef = useRef('');

  useEffect(() => {
    if (!pathFeatMergeKey || recommendedFeatRefs.size === 0 || isLoading) return;
    if (hasAppliedPathFeatsRef.current === pathFeatMergeKey) return;
    applyRecommendedPathFeats();
    hasAppliedPathFeatsRef.current = pathFeatMergeKey;
  }, [pathFeatMergeKey, recommendedFeatRefs.size, isLoading, applyRecommendedPathFeats]);

  const toggleFeat = useCallback(
    (feat: Feat, isCharacterFeat: boolean) => {
      const featType = isCharacterFeat ? 'character' : 'archetype';
      const selectedList = isCharacterFeat ? selectedCharacterFeats : selectedArchetypeFeats;
      const maxForType = isCharacterFeat ? maxCharacterFeats : maxArchetypeFeats;

      const isSelected = selectedList.some((f) => f.id === feat.id);

      if (isSelected) {
        // Remove feat
        updateDraft({
          feats: draft.feats?.filter((f) => f.id !== feat.id) || [],
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
            ...(draft.feats || []).filter((f) => !replacementIds.has(String(f.id))),
            {
              id: feat.id,
              name: feat.name,
              description: feat.description,
              type: featType,
            },
          ],
        });
      }
    },
    [
      selectedArchetypeFeats,
      selectedCharacterFeats,
      maxArchetypeFeats,
      maxCharacterFeats,
      draft.feats,
      featById,
      updateDraft,
    ],
  );

  const handleSort = useCallback((col: string) => {
    setFilters((prev) => ({
      ...prev,
      sortCol: col,
      sortDir: prev.sortCol === col ? (prev.sortDir === 1 ? -1 : 1) : 1,
    }));
  }, []);

  const pathGuidance =
    pathMode && draft.archetype?.name ? (
      <>
        <PathHelpCard pathName={draft.archetype.name}>
          the recommended feats are shown below. Expand to choose your own from the full catalog.
        </PathHelpCard>
        <PathNotes pathName={draft.archetype.name} notes={pathData?.level1?.notes} />
      </>
    ) : null;

  const catalogProps = {
    filters,
    onFiltersChange: setFilters,
    onSort: handleSort,
    selectedArchetypeFeats,
    selectedCharacterFeats,
    maxArchetypeFeats,
    maxCharacterFeats,
    featById,
    skillIdToName,
    checkRequirements,
    onToggleFeat: toggleFeat,
  };

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center py-12">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-0 max-w-5xl flex-1 flex-col">
      {!pathMode && (
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="mb-2 flex items-center gap-1">
              <h2 className="text-2xl font-bold text-text-primary">Select Feats</h2>
              <InfoTippy
                content={featSelectionHelp}
                allowHTML
                label="Feat selection help"
                size="inline"
              />
            </div>
            <p className="text-text-secondary">
              Choose feats that grant special abilities and bonuses. Your archetype ({archetypeType}
              ) allows {maxArchetypeFeats} archetype feat{maxArchetypeFeats !== 1 ? 's' : ''} and{' '}
              {maxCharacterFeats} character feat.
            </p>
          </div>
        </div>
      )}

      <SelectedFeatsSummary
        selectedArchetypeFeats={selectedArchetypeFeats}
        selectedCharacterFeats={selectedCharacterFeats}
        maxArchetypeFeats={maxArchetypeFeats}
        maxCharacterFeats={maxCharacterFeats}
        featById={featById}
        feats={feats}
        expandedSelectedId={expandedSelectedId}
        onExpandedSelectedIdChange={setExpandedSelectedId}
        onRemoveFeat={(featId) =>
          updateDraft({ feats: draft.feats?.filter((f) => f.id !== featId) })
        }
      />

      {pathMode ? (
        <GuidedChoiceShell
          layer={layer}
          title="Select Feats"
          titleAddon={
            <InfoTippy
              content={featSelectionHelp}
              allowHTML
              label="Feat selection help"
              size="inline"
            />
          }
          description={`Choose feats that grant special abilities and bonuses. Your archetype (${archetypeType}) allows ${maxArchetypeFeats} archetype feat${maxArchetypeFeats !== 1 ? 's' : ''} and ${maxCharacterFeats} character feat.`}
          guidance={pathGuidance}
          completionState={completion}
          onExpandLayer={() => expandLayer('feats')}
          onCollapseLayer={() => collapseLayer('feats')}
          expandLabel="See all feats"
          canExpand={layer === 1}
          primaryAction={
            recommendedFeatRefs.size > 0 && layer === 1 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={applyRecommendedPathFeats}
                className="min-h-11"
                aria-label="Apply recommended path feats"
              >
                Apply recommended feats
              </Button>
            ) : undefined
          }
        >
          {layer === 1 ? (
            <PathFeatLists
              featGuidanceGroups={featGuidanceGroups}
              pathModeArchetypeFeats={pathModeArchetypeFeats}
              pathModeCharacterFeats={pathModeCharacterFeats}
              archetypeName={draft.archetype?.name}
              {...catalogProps}
            />
          ) : (
            <FullFeatCatalog
              categories={categories}
              abilityOptions={abilityOptions}
              groupedDisplayFeats={groupedDisplayFeats}
              {...catalogProps}
            />
          )}
        </GuidedChoiceShell>
      ) : (
        <FullFeatCatalog
          categories={categories}
          abilityOptions={abilityOptions}
          groupedDisplayFeats={groupedDisplayFeats}
          {...catalogProps}
        />
      )}

      <CreatorStepFooter
        onBack={prevStep}
        onContinue={nextStep}
        continueDisabled={!canContinue}
        completionHint={<span>{completion.label}</span>}
      />
    </div>
  );
}
