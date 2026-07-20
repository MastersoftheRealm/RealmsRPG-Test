/**
 * Powers Step
 * ===========
 * Allow users to select powers and techniques for their character.
 * Uses powers from user's library with UnifiedSelectionModal.
 */

'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import type { SelectableItem } from '@/components/shared/unified-selection-modal';
import { calculateArchetypeProgression } from '@/lib/game/formulas';
import {
  useUserPowers,
  useUserTechniques,
  useUserEmpoweredTechniques,
  usePowerParts,
  useTechniqueParts,
  useOfficialLibrary,
  useItemProperties,
  useMergedSpecies,
  useCodexSkills,
  useTraits,
  useCreatorPathData,
} from '@/hooks';
import { getValidationIssuesForStep, getStepCompletion } from '@/lib/character-creator-validation';
import type { SourceFilterValue } from '@/components/shared';
import { CreatorStepFooter } from '@/components/character-creator/creator-step-footer';
import type { CharacterPower, CharacterTechnique } from '@/types';
import type { PowerModalTab } from './powers/modal-columns';
import { PowersSelectedSection } from './powers/powers-selected-section';
import { TechniquesSelectedSection } from './powers/techniques-selected-section';
import { PowersSelectionModals } from './powers/powers-selection-modals';
import { PowersStepChrome } from './powers/powers-step-chrome';
import { applyPathPowerRecommendations } from './powers/apply-path-power-recommendations';
import {
  mergeEmpoweredPowerModalSelection,
  mergePowerModalSelection,
  mergeTechniqueModalSelection,
} from './powers/draft-power-selection';
import { powerModalEmptyCopy, techniqueModalEmptyCopy } from './powers/modal-empty-messages';
import { computePowersStepProficiencyTp } from './powers/powers-step-proficiency-tp';
import { usePowersStepSelectables } from './powers/use-powers-step-selectables';

const EMPTY_POWERS: CharacterPower[] = [];
const EMPTY_TECHNIQUES: CharacterTechnique[] = [];

export function PowersStep() {
  const { draft, updateDraft, nextStep, prevStep, getStepLayer, expandLayer, collapseLayer } =
    useCharacterCreatorStore();
  const [showPowerModal, setShowPowerModal] = useState(false);
  const [showTechniqueModal, setShowTechniqueModal] = useState(false);
  const [powerModalTab, setPowerModalTab] = useState<PowerModalTab>('powers');
  const [source, setSource] = useState<SourceFilterValue>('all');

  const { data: userPowers = [], isLoading: powersLoading } = useUserPowers();
  const { data: allSpecies = [] } = useMergedSpecies();
  const { data: codexSkills } = useCodexSkills();
  const { data: allTraits } = useTraits();
  const validationContext = useMemo(
    () => ({ allSpecies, codexSkills: codexSkills ?? null, allTraits: allTraits ?? null }),
    [allSpecies, codexSkills, allTraits]
  );
  const stepIssues = useMemo(
    () => getValidationIssuesForStep('powers', draft, validationContext),
    [draft, validationContext]
  );
  const completion = useMemo(
    () => getStepCompletion('powers', draft, validationContext),
    [draft, validationContext]
  );
  const canContinue = stepIssues.length === 0;
  const { data: userTechniques = [], isLoading: techniquesLoading } = useUserTechniques();
  const { data: userEmpoweredTechniques = [], isLoading: empoweredTechniquesLoading } =
    useUserEmpoweredTechniques();
  const {
    data: publicPowers = [],
    isLoading: publicPowersLoading,
    isError: publicPowersError,
  } = useOfficialLibrary('powers');
  const {
    data: publicTechniques = [],
    isLoading: publicTechniquesLoading,
    isError: publicTechniquesError,
  } = useOfficialLibrary('techniques');
  const {
    data: publicEmpoweredTechniques = [],
    isLoading: publicEmpoweredTechniquesLoading,
    isError: publicEmpoweredTechniquesError,
  } = useOfficialLibrary('empowered-techniques');
  const { data: powerParts } = usePowerParts();
  const { data: techniqueParts } = useTechniqueParts();
  const { data: itemPropertiesDb = [] } = useItemProperties();

  const selectedPowers = draft.powers ?? EMPTY_POWERS;
  const selectedTechniques = draft.techniques ?? EMPTY_TECHNIQUES;

  const archetypeProgression = useMemo(() => {
    const archType = draft.archetype?.type;
    const martProf =
      draft.mart_prof ??
      (archType === 'martial' ? 2 : archType === 'powered-martial' ? 1 : 0);
    const powProf =
      draft.pow_prof ??
      (archType === 'power' ? 2 : archType === 'powered-martial' ? 1 : 0);
    return calculateArchetypeProgression(
      draft.level || 1,
      martProf,
      powProf,
      draft.archetypeChoices ?? {}
    );
  }, [draft.level, draft.mart_prof, draft.pow_prof, draft.archetype?.type, draft.archetypeChoices]);
  const showInnateControls = archetypeProgression.innateEnergy > 0;

  const proficiencyTpSummary = useMemo(
    () => computePowersStepProficiencyTp(draft, powerParts, techniqueParts, itemPropertiesDb),
    [draft, powerParts, techniqueParts, itemPropertiesDb]
  );

  const selectedPowerIds = useMemo(
    () => new Set(selectedPowers.map((p) => String(p.id))),
    [selectedPowers]
  );
  const selectedTechniqueIds = useMemo(
    () => new Set(selectedTechniques.map((t) => String(t.id))),
    [selectedTechniques]
  );
  const pathData = useCreatorPathData();
  const recommendedPowerRefs = useMemo(
    () => new Set((pathData?.level1?.powers || []).map((v: string) => String(v).toLowerCase())),
    [pathData?.level1?.powers]
  );
  const recommendedTechniqueRefs = useMemo(
    () =>
      new Set((pathData?.level1?.techniques || []).map((v: string) => String(v).toLowerCase())),
    [pathData?.level1?.techniques]
  );
  const pathName = draft.archetype?.name ?? 'Path';
  const layer = getStepLayer('powers');
  const pathMode = draft.creationMode === 'path';
  const showFullCatalog = !pathMode || layer >= 2;
  const minimizeTechniques = pathMode && layer === 1 && draft.archetype?.type === 'power';
  const hasPathPowerRecs = recommendedPowerRefs.size > 0;
  const hasPathTechniqueRecs = recommendedTechniqueRefs.size > 0;
  const pathMergeKey = draft.creationMode === 'path' ? (draft.archetype?.id ?? 'path') : '';
  const hasMergedPathRef = useRef<string | null>(null);

  const {
    allPowersRaw,
    allTechniquesRaw,
    allEmpoweredTechniquesRaw,
    allPowersForLookup,
    allTechniquesForLookup,
    allPowerSelectableItems,
    allEmpoweredSelectableItems,
    allTechniqueSelectableItems,
    selectedPowerItems,
    selectedTechniqueItems,
  } = usePowersStepSelectables({
    userPowers,
    publicPowers,
    userTechniques,
    publicTechniques,
    userEmpoweredTechniques,
    publicEmpoweredTechniques,
    powerParts,
    techniqueParts,
    selectedPowers,
    selectedTechniques,
    recommendedPowerRefs,
    recommendedTechniqueRefs,
    pathName,
  });

  const displayFilterFn = useMemo(
    () => (item: SelectableItem) =>
      source === 'all' || (item.data as { _source?: 'my' | 'public' })?._source === source,
    [source]
  );

  const powersModalLoading =
    (source !== 'public' && powersLoading) || (source !== 'my' && publicPowersLoading);
  const techniquesModalLoading =
    (source !== 'public' && techniquesLoading) || (source !== 'my' && publicTechniquesLoading);
  const empoweredModalLoading =
    (source !== 'public' && empoweredTechniquesLoading) ||
    (source !== 'my' && publicEmpoweredTechniquesLoading);

  const pathRecommendationsLoading =
    draft.creationMode === 'path' &&
    ((hasPathPowerRecs && allPowersForLookup.length === 0 && publicPowersLoading) ||
      (hasPathTechniqueRecs && allTechniquesForLookup.length === 0 && publicTechniquesLoading));

  // Path Layer 1: auto-add recommended powers/techniques once per path
  useEffect(() => {
    if (!pathMergeKey || (!hasPathPowerRecs && !hasPathTechniqueRecs)) return;
    if (hasMergedPathRef.current === pathMergeKey) return;
    if (hasPathPowerRecs && allPowersForLookup.length === 0) return;
    if (hasPathTechniqueRecs && allTechniquesForLookup.length === 0) return;
    const result = applyPathPowerRecommendations({
      currentPowers: draft.powers || [],
      currentTechniques: draft.techniques || [],
      hasPathPowerRecs,
      hasPathTechniqueRecs,
      recommendedPowerRefs,
      recommendedTechniqueRefs,
      allPowersForLookup,
      allTechniquesForLookup,
    });
    if (result.changed) {
      updateDraft({ powers: result.powers, techniques: result.techniques });
    }
    hasMergedPathRef.current = pathMergeKey;
  }, [
    pathMergeKey,
    hasPathPowerRecs,
    hasPathTechniqueRecs,
    draft.powers,
    draft.techniques,
    recommendedPowerRefs,
    recommendedTechniqueRefs,
    allPowersForLookup,
    allTechniquesForLookup,
    updateDraft,
  ]);

  const availablePowerIds = useMemo(
    () => new Set(allPowerSelectableItems.filter(displayFilterFn).map((p) => p.id)),
    [allPowerSelectableItems, displayFilterFn]
  );
  const availableEmpoweredIds = useMemo(
    () => new Set(allEmpoweredSelectableItems.filter(displayFilterFn).map((p) => p.id)),
    [allEmpoweredSelectableItems, displayFilterFn]
  );
  const availableTechniqueIds = useMemo(
    () => new Set(allTechniqueSelectableItems.filter(displayFilterFn).map((t) => t.id)),
    [allTechniqueSelectableItems, displayFilterFn]
  );

  const { emptyMessage: powerModalEmptyMessage, emptySubMessage: powerModalEmptySubMessage } =
    useMemo(
      () =>
        powerModalEmptyCopy({
          items: allPowerSelectableItems,
          displayFilterFn,
          source,
          publicPowersError,
        }),
      [allPowerSelectableItems, displayFilterFn, source, publicPowersError]
    );
  const {
    emptyMessage: techniqueModalEmptyMessage,
    emptySubMessage: techniqueModalEmptySubMessage,
  } = useMemo(
    () =>
      techniqueModalEmptyCopy({
        items: allTechniqueSelectableItems,
        displayFilterFn,
        source,
        publicTechniquesError,
      }),
    [allTechniqueSelectableItems, displayFilterFn, source, publicTechniquesError]
  );

  const handlePowerSelect = useCallback(
    (selectedItems: SelectableItem[]) => {
      updateDraft({
        powers: mergePowerModalSelection({
          draftPowers: draft.powers || [],
          selectedItems,
          availablePowerIds,
          userPowers,
          publicPowers,
          powerParts,
        }),
      });
      setShowPowerModal(false);
    },
    [draft.powers, availablePowerIds, updateDraft, userPowers, publicPowers, powerParts]
  );
  const handleEmpoweredPowerSelect = useCallback(
    (selectedItems: SelectableItem[]) => {
      updateDraft({
        powers: mergeEmpoweredPowerModalSelection({
          draftPowers: draft.powers || [],
          selectedItems,
          availableEmpoweredIds,
        }),
      });
      setShowPowerModal(false);
    },
    [draft.powers, availableEmpoweredIds, updateDraft]
  );
  const handleTechniqueSelect = useCallback(
    (selectedItems: SelectableItem[]) => {
      updateDraft({
        techniques: mergeTechniqueModalSelection({
          draftTechniques: draft.techniques || [],
          selectedItems,
          availableTechniqueIds,
          userTechniques,
          publicTechniques,
          techniqueParts,
        }),
      });
      setShowTechniqueModal(false);
    },
    [
      draft.techniques,
      availableTechniqueIds,
      updateDraft,
      userTechniques,
      publicTechniques,
      techniqueParts,
    ]
  );

  const togglePowerInnate = useCallback(
    (powerId: string, isInnate: boolean) => {
      updateDraft({
        powers: (draft.powers || []).map((p) =>
          String(p.id) === powerId ? { ...p, innate: isInnate } : p
        ) as CharacterPower[],
      });
    },
    [draft.powers, updateDraft]
  );
  const removePower = useCallback(
    (powerId: string) => {
      updateDraft({
        powers: selectedPowers.filter((p) => String(p.id) !== powerId),
      });
    },
    [selectedPowers, updateDraft]
  );
  const removeTechnique = useCallback(
    (techniqueId: string) => {
      updateDraft({
        techniques: selectedTechniques.filter((t) => String(t.id) !== techniqueId),
      });
    },
    [selectedTechniques, updateDraft]
  );

  const hasPowersAvailable = allPowersRaw.length > 0 || allEmpoweredTechniquesRaw.length > 0;
  const hasTechniquesAvailable = allTechniquesRaw.length > 0;
  const hasContent = hasPowersAvailable || hasTechniquesAvailable;
  const showPowersSection = draft.creationMode !== 'path' || hasPathPowerRecs;
  const showTechniquesSection =
    (draft.creationMode !== 'path' || hasPathTechniqueRecs) &&
    !(minimizeTechniques && !showFullCatalog);

  return (
    <div className="max-w-4xl mx-auto flex flex-col flex-1 min-h-0">
      <PowersStepChrome
        pathMode={pathMode}
        layer={layer}
        creationMode={draft.creationMode}
        proficiencySpent={proficiencyTpSummary.spent}
        proficiencyLimit={proficiencyTpSummary.limit}
        proficiencyRemaining={proficiencyTpSummary.remaining}
        onExpandLayer={() => expandLayer('powers')}
        onCollapseLayer={() => collapseLayer('powers')}
        pathRecommendationsLoading={pathRecommendationsLoading}
        pathName={draft.archetype?.name}
        hasPathPowerRecs={hasPathPowerRecs}
        hasPathTechniqueRecs={hasPathTechniqueRecs}
        minimizeTechniques={minimizeTechniques}
        pathNotes={pathData?.level1?.notes}
        guidanceGroups={pathData?.level1?.guidance_groups}
        powersLoading={powersLoading}
        techniquesLoading={techniquesLoading}
        hasContent={hasContent}
        isPathMode={draft.creationMode === 'path'}
      />

      {showPowersSection && (
        <PowersSelectedSection
          selectedPowers={selectedPowers}
          selectedPowerItems={selectedPowerItems}
          userPowersCount={userPowers.length}
          showInnateControls={showInnateControls}
          innateThreshold={archetypeProgression.innateThreshold}
          innatePools={archetypeProgression.innatePools}
          recommendedPowerRefs={recommendedPowerRefs}
          pathName={pathName}
          addDisabled={
            (!hasPowersAvailable && !powersLoading && !publicPowersLoading) ||
            (pathMode && !showFullCatalog)
          }
          powersLoading={powersLoading}
          hasContent={hasContent}
          onAddClick={() => setShowPowerModal(true)}
          onToggleInnate={togglePowerInnate}
          onRemove={removePower}
        />
      )}

      {showTechniquesSection && (
        <TechniquesSelectedSection
          selectedTechniques={selectedTechniques}
          selectedTechniqueItems={selectedTechniqueItems}
          userTechniquesCount={userTechniques.length}
          recommendedTechniqueRefs={recommendedTechniqueRefs}
          pathName={pathName}
          addDisabled={
            (pathMode && !showFullCatalog) ||
            (!hasTechniquesAvailable && !techniquesLoading && !publicTechniquesLoading)
          }
          techniquesLoading={techniquesLoading}
          hasContent={hasContent}
          onAddClick={() => setShowTechniqueModal(true)}
          onRemove={removeTechnique}
        />
      )}

      <CreatorStepFooter
        onBack={prevStep}
        onContinue={nextStep}
        continueDisabled={!canContinue}
        completionHint={<span>{completion.label}</span>}
      />

      <PowersSelectionModals
        showPowerModal={showPowerModal}
        showTechniqueModal={showTechniqueModal}
        onClosePowerModal={() => setShowPowerModal(false)}
        onCloseTechniqueModal={() => setShowTechniqueModal(false)}
        powerModalTab={powerModalTab}
        onPowerModalTabChange={setPowerModalTab}
        source={source}
        onSourceChange={setSource}
        displayFilterFn={displayFilterFn}
        onPowerConfirm={handlePowerSelect}
        onEmpoweredConfirm={handleEmpoweredPowerSelect}
        onTechniqueConfirm={handleTechniqueSelect}
        allPowerSelectableItems={allPowerSelectableItems}
        allEmpoweredSelectableItems={allEmpoweredSelectableItems}
        allTechniqueSelectableItems={allTechniqueSelectableItems}
        selectedPowerIds={selectedPowerIds}
        selectedTechniqueIds={selectedTechniqueIds}
        powersModalLoading={powersModalLoading}
        empoweredModalLoading={empoweredModalLoading}
        techniquesModalLoading={techniquesModalLoading}
        powerModalEmptyMessage={powerModalEmptyMessage}
        powerModalEmptySubMessage={powerModalEmptySubMessage}
        techniqueModalEmptyMessage={techniqueModalEmptyMessage}
        techniqueModalEmptySubMessage={techniqueModalEmptySubMessage}
        publicEmpoweredTechniquesError={publicEmpoweredTechniquesError}
      />
    </div>
  );
}
