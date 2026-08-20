/**
 * Sequential innate → powers → techniques screens (TASK-756).
 * Inner-phase pattern like loadout `equipmentPhase`. Shared Training Points
 * still counts innate + powers + techniques. Innate Energy fill is soft-warn.
 * L3 innate catalog stays populated at energy cap and swaps last-selected (TASK-727).
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Spinner } from '@/components/ui';
import { LoadoutBudgetBar, GuidedInlineCatalogList } from '@/components/patterns';
import { PowerTechniqueFilters, FilterSection } from '@/components/patterns/filters';
import { SourceFilter, type SourceFilterValue } from '@/components/patterns/filters/source-filter';
import {
  useEquipment,
  useOfficialLibrary,
  usePowerParts,
  useTechniqueParts,
  useGuidedEquipmentCatalog,
  useUserPowers,
  useUserTechniques,
  useGameRules,
  usePathListFilter,
} from '@/hooks';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';
import { useGuidedPathData } from '../use-guided-path-data';
import {
  GuidedPowersTechniquesL2Modal,
  InnateEnergyPointStatus,
  InnatePowersHelpTip,
} from '../guided-powers-techniques-l2-modal';
import { GuidedStepLayout } from '../guided-step-layout';
import { GuidedPowersTechniquesL1Content } from '../guided-powers-techniques-l1-content';
import { usePowersTechniquesSelection } from './use-powers-techniques-selection';
import {
  buildPowerTechniqueCardFacts,
  resolvePowerTechniqueEnergy,
  resolvePowerTechniqueTpCost,
} from '@/lib/guided-creator/power-technique-display';
import {
  buildPowersTechniquesL2Items,
  filterPowersTechniquesL2ByPtFilters,
  pathRecommendationKindForL2,
  powersTechniquesL2Grid,
  powersTechniquesL2Headers,
} from '@/lib/guided-creator/powers-techniques-l2';
import { getPowersTechniquesL1Ids } from '@/lib/guided-creator/powers-techniques-l1-candidates';
import {
  buildLookup,
  resolveLibraryItem,
} from '@/lib/guided-creator/powers-techniques-step-helpers';
import { combineGuidedTpBudgets } from '@/lib/guided-creator/loadout-tp';
import {
  calculateGuidedL1TheoreticalMaxEnergy,
  GUIDED_L2_ENERGY_FALLBACK_MAX,
} from '@/lib/guided-creator/powers-techniques-energy-filter';
import {
  nextPowersPhase,
  powersPhaseIndex,
  prevPowersPhase,
  resolvePowersPhaseVisibility,
  visiblePowersPhases,
} from '@/lib/guided-creator/powers-phase-nav';
import { landsOnFirstInnerScreen } from '@/lib/guided-creator/guided-substep-nav';
import { calculateArchetypeProgression } from '@/lib/game/formulas';
import { ARCHETYPE_CONFIGS } from '@/lib/game/constants';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { useGuidedDeepEntryOnArrival } from '@/lib/guided-creator/use-guided-deep-entry-on-arrival';
import { prefersDeepCatalogEntry } from '@/lib/guided-creator/creator-entry-mode';
import { mergeLibraryBySource } from '@/lib/library/source-scope';
import { collectCategoryOptionsFromItems } from '@/lib/library/power-technique-categories';
import {
  EMPTY_POWER_TECHNIQUE_FILTERS,
  countActivePowerTechniqueFilters,
  type PowerTechniqueFilterState,
} from '@/lib/library/power-technique-filters';
import { listInnateThresholdFilterOptions } from '@/lib/game/innate-eligibility';
import {
  applyLivePathFilter,
  pathFilterEmptyTitle,
  selectableItemPathIds,
} from '@/lib/game/path-recommendation-index';

const ptCopy = GUIDED_CREATOR_COPY.steps.powersTechniques;

type L2ModalKind = 'regular' | 'innate' | null;

export function PowersTechniquesStep() {
  const { draft, updateDraft, navigationIntent, entryNonce, nextSubStep, prevSubStep } =
    useGuidedCreatorStore();
  const { pathData } = useGuidedPathData();

  const visibility = useMemo(
    () => resolvePowersPhaseVisibility(draft.archetypeType),
    [draft.archetypeType],
  );
  const visiblePhases = useMemo(() => visiblePowersPhases(visibility), [visibility]);
  const powersPhase = visiblePhases.includes(draft.powersPhase)
    ? draft.powersPhase
    : (visiblePhases[0] ?? 'powers');
  const needsPowers = visibility.includeInnate || visibility.includePowers;
  const needsTechniques = visibility.includeTechniques;
  const isTechniques = powersPhase === 'techniques';
  const isInnatePhase = powersPhase === 'innate';
  const showInnateTrack = visibility.includeInnate;
  const kind = isTechniques ? 'techniques' : 'powers';

  const [l2Modal, setL2Modal] = useState<L2ModalKind>(null);
  const [ptFilters, setPtFilters] = useState<PowerTechniqueFilterState>(
    EMPTY_POWER_TECHNIQUE_FILTERS,
  );
  const [ptFiltersExpanded, setPtFiltersExpanded] = useState(false);

  const isInlineCatalog = prefersDeepCatalogEntry(draft);
  const [librarySource, setLibrarySource] = useState<SourceFilterValue>(
    isInlineCatalog ? 'all' : 'public',
  );

  const { data: officialPowers = [], isLoading: powersLoading } = useOfficialLibrary('powers', {
    enabled: needsPowers,
  });
  const { data: officialTechniques = [], isLoading: techniquesLoading } = useOfficialLibrary(
    'techniques',
    { enabled: needsTechniques },
  );
  const { data: userPowers = [], isLoading: userPowersLoading } = useUserPowers({
    enabled: needsPowers,
  });
  const { data: userTechniques = [], isLoading: userTechniquesLoading } = useUserTechniques({
    enabled: needsTechniques,
  });
  const { data: officialItems = [] } = useOfficialLibrary('items');
  const { data: codexEquipment = [] } = useEquipment();
  const { tpSummary: loadoutTp } = useGuidedEquipmentCatalog(draft, officialItems, codexEquipment);
  const { data: powerPartsDb = [] } = usePowerParts();
  const { data: techniquePartsDb = [] } = useTechniqueParts();

  const isLoading =
    (needsPowers && (powersLoading || userPowersLoading)) ||
    (needsTechniques && (techniquesLoading || userTechniquesLoading));

  const powerLibraryItems = useMemo(
    () =>
      mergeLibraryBySource(librarySource, officialPowers, userPowers, [
        ...draft.powerIds,
        ...draft.innatePowerIds,
      ]),
    [librarySource, officialPowers, userPowers, draft.powerIds, draft.innatePowerIds],
  );
  const techniqueLibraryItems = useMemo(
    () =>
      mergeLibraryBySource(librarySource, officialTechniques, userTechniques, draft.techniqueIds),
    [librarySource, officialTechniques, userTechniques, draft.techniqueIds],
  );
  const libraryItems = isTechniques ? techniqueLibraryItems : powerLibraryItems;

  const {
    selectedPathIds: inlineSelectedPathIds,
    setSelectedPathIds: setInlineSelectedPathIds,
    pathIndex: inlinePathIndex,
    pathRecommendedIds: inlinePathMatchIds,
    pathFilterActive: inlinePathFilterActive,
  } = usePathListFilter({
    entities: isInnatePhase ? powerLibraryItems : libraryItems,
    kind: pathRecommendationKindForL2(kind, isInnatePhase ? 'innate' : 'regular'),
    enabled: isInlineCatalog,
  });

  const openDeepBrowse = useCallback(() => {
    setL2Modal(isInnatePhase ? 'innate' : 'regular');
  }, [isInnatePhase]);
  useGuidedDeepEntryOnArrival({
    draft,
    navigationIntent,
    entryNonce,
    enabled: !isLoading && !isInlineCatalog,
    onDeepEntry: openDeepBrowse,
  });

  useEffect(() => {
    if (isLoading) return;
    if (!visiblePhases.includes(draft.powersPhase)) {
      updateDraft({ powersPhase: visiblePhases[0] ?? 'powers' });
    }
  }, [isLoading, visiblePhases, draft.powersPhase, updateDraft]);

  const lastPowersJumpNonce = useRef<number | null>(null);
  useEffect(() => {
    if (isLoading) return;
    if (!landsOnFirstInnerScreen(navigationIntent)) return;
    if (lastPowersJumpNonce.current === entryNonce) return;
    lastPowersJumpNonce.current = entryNonce;
    const first = visiblePhases[0] ?? 'powers';
    updateDraft({ powersPhase: first });
  }, [isLoading, navigationIntent, entryNonce, visiblePhases, updateDraft]);

  const { rules } = useGameRules();
  const ptCategoryOptions = useMemo(
    () =>
      collectCategoryOptionsFromItems(
        libraryItems,
        isTechniques ? techniquePartsDb : powerPartsDb,
        {
          includeDamageCategory: !isTechniques,
        },
      ),
    [libraryItems, isTechniques, techniquePartsDb, powerPartsDb],
  );
  const innateThresholdOptions = useMemo(() => listInnateThresholdFilterOptions(rules), [rules]);
  const ptFilterActiveCount =
    countActivePowerTechniqueFilters(ptFilters, isTechniques ? 'technique' : 'power', false) +
    (inlinePathFilterActive ? 1 : 0);

  const powerLookup = useMemo(() => buildLookup(powerLibraryItems), [powerLibraryItems]);
  const techniqueLookup = useMemo(
    () => buildLookup(techniqueLibraryItems),
    [techniqueLibraryItems],
  );
  const lookup = isTechniques ? techniqueLookup : powerLookup;

  const innateProgression = useMemo(() => {
    const type = draft.archetypeType;
    const cfg = type ? ARCHETYPE_CONFIGS[type] : null;
    const martProf = cfg?.proficiency.martial ?? 0;
    const powProf = cfg?.proficiency.power ?? 0;
    return calculateArchetypeProgression(1, martProf, powProf);
  }, [draft.archetypeType]);

  const innateEnergyMax = showInnateTrack ? innateProgression.innateEnergy : 0;
  const innateThreshold = showInnateTrack ? innateProgression.innateThreshold : 0;

  const recommendedIds = useMemo(() => {
    const fromPath = isTechniques
      ? (pathData?.level1?.techniques ?? [])
      : (pathData?.level1?.powers ?? []);
    return fromPath.map(String);
  }, [isTechniques, pathData]);

  const innateRecommendedIds = useMemo(() => {
    if (!showInnateTrack) return [];
    return (pathData?.level1?.innatePowers ?? []).map(String);
  }, [showInnateTrack, pathData]);

  const groups = useMemo(
    () =>
      pathData?.level1?.guidance_groups?.filter((g) =>
        isTechniques ? g.techniques?.length : g.powers?.length,
      ) ?? [],
    [pathData, isTechniques],
  );

  const allOptionIds = useMemo(() => {
    const ids = new Set<string>();
    recommendedIds.forEach((id) => ids.add(String(id)));
    groups.forEach((group) => {
      const list = isTechniques ? group.techniques : group.powers;
      list?.forEach((id) => ids.add(String(id)));
    });
    return Array.from(ids);
  }, [recommendedIds, groups, isTechniques]);

  const selectedIds = isTechniques ? draft.techniqueIds : draft.powerIds;
  const selectedInnateIds = draft.innatePowerIds;

  const resolveCanonicalId = useCallback(
    (id: string): string | undefined => {
      const raw = resolveLibraryItem(id, lookup);
      if (!raw) return undefined;
      const canonical = String(raw.id ?? raw.name ?? '').trim();
      return canonical || undefined;
    },
    [lookup],
  );

  const { displayIds: l1DisplayIds, promotedIds } = useMemo(
    () => getPowersTechniquesL1Ids(allOptionIds, selectedIds, resolveCanonicalId),
    [allOptionIds, selectedIds, resolveCanonicalId],
  );

  const { displayIds: innateDisplayIds, promotedIds: innatePromotedIds } = useMemo(
    () => getPowersTechniquesL1Ids(innateRecommendedIds, selectedInnateIds, resolveCanonicalId),
    [innateRecommendedIds, selectedInnateIds, resolveCanonicalId],
  );

  const showPathDescriptor = promotedIds.length > 0 && groups.length === 0;

  const resolveTpCost = useCallback(
    (id: string): number => {
      const raw = resolveLibraryItem(id, lookup);
      return resolvePowerTechniqueTpCost(kind, raw, powerPartsDb, techniquePartsDb);
    },
    [lookup, kind, techniquePartsDb, powerPartsDb],
  );

  const resolveEnergy = useCallback(
    (id: string): number | undefined => {
      const raw = resolveLibraryItem(id, powerLookup);
      return resolvePowerTechniqueEnergy('powers', raw, powerPartsDb, techniquePartsDb);
    },
    [powerLookup, powerPartsDb, techniquePartsDb],
  );

  const powerTpSpent = useMemo(
    () =>
      draft.powerIds.reduce((sum, id) => {
        const raw = resolveLibraryItem(id, powerLookup);
        return sum + resolvePowerTechniqueTpCost('powers', raw, powerPartsDb, techniquePartsDb);
      }, 0),
    [draft.powerIds, powerLookup, powerPartsDb, techniquePartsDb],
  );

  const techniqueTpSpent = useMemo(
    () =>
      draft.techniqueIds.reduce((sum, id) => {
        const raw = resolveLibraryItem(id, techniqueLookup);
        return sum + resolvePowerTechniqueTpCost('techniques', raw, powerPartsDb, techniquePartsDb);
      }, 0),
    [draft.techniqueIds, techniqueLookup, powerPartsDb, techniquePartsDb],
  );

  const innateTpSpent = useMemo(
    () =>
      showInnateTrack
        ? selectedInnateIds.reduce((sum, id) => {
            const raw = resolveLibraryItem(id, powerLookup);
            return sum + resolvePowerTechniqueTpCost('powers', raw, powerPartsDb, techniquePartsDb);
          }, 0)
        : 0,
    [showInnateTrack, selectedInnateIds, powerLookup, powerPartsDb, techniquePartsDb],
  );

  const regularTpSpent = isTechniques ? techniqueTpSpent : powerTpSpent;
  const siblingTpSpent = isTechniques ? powerTpSpent + innateTpSpent : techniqueTpSpent;

  const combatTpSpent = powerTpSpent + techniqueTpSpent + innateTpSpent;

  const tpBudget = useMemo(
    () => combineGuidedTpBudgets(loadoutTp, combatTpSpent),
    [loadoutTp, combatTpSpent],
  );

  const innateEnergySpent = useMemo(
    () =>
      selectedInnateIds.reduce((sum, id) => {
        const energy = resolveEnergy(id);
        return sum + (energy != null ? energy : 0);
      }, 0),
    [selectedInnateIds, resolveEnergy],
  );

  const innateRemaining = innateEnergyMax - innateEnergySpent;

  const {
    budgetMessage,
    isSelectedId,
    toggleRegularId,
    toggleInnateId,
    isRegularUnavailable,
    isInnateUnavailable,
    handleL2Confirm: confirmL2Selection,
  } = usePowersTechniquesSelection({
    draft,
    updateDraft,
    isTechniques,
    showInnateTrack,
    isLoading,
    pathData,
    lookup,
    allOptionIds,
    innateRecommendedIds,
    selectedIds,
    selectedInnateIds,
    loadoutTpSpent: loadoutTp.spent,
    loadoutTpLimit: loadoutTp.limit,
    regularTpSpent,
    innateTpSpent: isTechniques ? 0 : innateTpSpent,
    siblingTpSpent,
    innateEnergyMax,
    innateThreshold,
    resolveTpCost,
    resolveEnergy,
  });

  const resolveDisplay = useCallback(
    (id: string) => {
      const raw = resolveLibraryItem(id, lookup);
      const facts = buildPowerTechniqueCardFacts(kind, raw, id, powerPartsDb, techniquePartsDb);
      return {
        id: String(id),
        name: facts.name,
        description: facts.description ?? '',
        titleChips: facts.titleChips,
        detailChips: facts.detailChips,
        tpCost: facts.tpCost,
      };
    },
    [lookup, kind, techniquePartsDb, powerPartsDb],
  );

  const innateSoftWarn = isInnatePhase && innateEnergyMax > 0 && innateRemaining !== 0;

  const regularUnavailableReason = useCallback(
    (id: string): string | undefined => (isRegularUnavailable(id) ? ptCopy.tpBlocked : undefined),
    [isRegularUnavailable],
  );

  const energyInput = useMemo(
    () => ({
      archetypeAbility: isTechniques
        ? (draft.mart_abil ?? draft.pow_abil)
        : (draft.pow_abil ?? draft.mart_abil),
      abilities: draft.abilities,
      level: 1,
    }),
    [isTechniques, draft.pow_abil, draft.mart_abil, draft.abilities],
  );

  const theoreticalMaxEnergy = useMemo(
    () => calculateGuidedL1TheoreticalMaxEnergy(energyInput),
    [energyInput],
  );

  const catalogMaxEnergy = theoreticalMaxEnergy ?? GUIDED_L2_ENERGY_FALLBACK_MAX;

  const inlineRegularItems = useMemo(() => {
    if (isInnatePhase) return [];
    const built = buildPowersTechniquesL2Items({
      kind,
      mode: 'regular',
      items: libraryItems,
      powerPartsDb,
      techniquePartsDb,
      energyInput,
    });
    const filtered = built.filter((item) => {
      const idStr = String(item.id);
      if (isSelectedId(idStr, selectedIds)) return true;
      if (regularUnavailableReason(idStr)) return false;
      return filterPowersTechniquesL2ByPtFilters([item], ptFilters, kind).length > 0;
    });
    return applyLivePathFilter(filtered, {
      pathMatchIds: inlinePathMatchIds,
      pathIndex: inlinePathIndex,
      selectedPathIds: inlineSelectedPathIds,
      keepIds: new Set(selectedIds.map(String)),
      idsForItem: selectableItemPathIds,
    });
  }, [
    isInnatePhase,
    kind,
    libraryItems,
    powerPartsDb,
    techniquePartsDb,
    energyInput,
    isSelectedId,
    selectedIds,
    regularUnavailableReason,
    ptFilters,
    inlinePathMatchIds,
    inlinePathIndex,
    inlineSelectedPathIds,
  ]);

  const inlineInnateItems = useMemo(() => {
    if (!isInnatePhase) return [];
    const built = buildPowersTechniquesL2Items({
      kind: 'powers',
      mode: 'innate',
      items: powerLibraryItems,
      powerPartsDb,
      techniquePartsDb,
      energyInput,
      innateThreshold,
    });
    const filtered = built.filter((item) => {
      const idStr = String(item.id);
      if (isSelectedId(idStr, selectedInnateIds)) return true;
      if (isInnateUnavailable(idStr)) return false;
      return filterPowersTechniquesL2ByPtFilters([item], ptFilters, 'powers').length > 0;
    });
    return applyLivePathFilter(filtered, {
      pathMatchIds: inlinePathMatchIds,
      pathIndex: inlinePathIndex,
      selectedPathIds: inlineSelectedPathIds,
      keepIds: new Set(selectedInnateIds.map(String)),
      idsForItem: selectableItemPathIds,
    });
  }, [
    isInnatePhase,
    powerLibraryItems,
    powerPartsDb,
    techniquePartsDb,
    energyInput,
    innateThreshold,
    isSelectedId,
    selectedInnateIds,
    isInnateUnavailable,
    ptFilters,
    inlinePathMatchIds,
    inlinePathIndex,
    inlineSelectedPathIds,
  ]);

  const inlineSelectedIdSet = useMemo(() => new Set(selectedIds.map(String)), [selectedIds]);
  const inlineSelectedInnateIdSet = useMemo(
    () => new Set(selectedInnateIds.map(String)),
    [selectedInnateIds],
  );

  const showInnateEnergyBar = isInnatePhase && innateEnergyMax > 0;

  const budgetBar = (
    <LoadoutBudgetBar
      tpTotal={tpBudget.limit}
      tpSpent={tpBudget.spent}
      leading={
        showInnateEnergyBar ? (
          <InnateEnergyPointStatus total={innateEnergyMax} spent={innateEnergySpent} />
        ) : null
      }
    />
  );

  const archetypeAbility = isTechniques
    ? (draft.mart_abil ?? draft.pow_abil)
    : (draft.pow_abil ?? draft.mart_abil);

  const l2BaseTpSpent =
    loadoutTp.spent +
    (l2Modal === 'innate'
      ? powerTpSpent + techniqueTpSpent
      : isTechniques
        ? powerTpSpent + innateTpSpent
        : innateTpSpent + techniqueTpSpent);

  const onL2Confirm = useCallback(
    (ids: string[]) => {
      confirmL2Selection(ids, l2Modal);
    },
    [confirmL2Selection, l2Modal],
  );

  const handleBack = useCallback(() => {
    const prev = prevPowersPhase(powersPhase, visibility);
    if (prev) {
      updateDraft({ powersPhase: prev });
      return;
    }
    prevSubStep();
  }, [powersPhase, visibility, updateDraft, prevSubStep]);

  const handleContinue = useCallback(() => {
    const next = nextPowersPhase(powersPhase, visibility);
    if (next) {
      updateDraft({ powersPhase: next });
      return;
    }
    nextSubStep();
  }, [powersPhase, visibility, updateDraft, nextSubStep]);

  const nextPhase = nextPowersPhase(powersPhase, visibility);
  const continueLabel =
    nextPhase === 'powers'
      ? ptCopy.continueToPowers
      : nextPhase === 'techniques'
        ? ptCopy.continueToTechniques
        : GUIDED_CREATOR_COPY.steps.skills.continueLabel;

  const phaseIdx = powersPhaseIndex(powersPhase, visibility);
  const phaseTitle =
    powersPhase === 'innate'
      ? ptCopy.innateTitle
      : powersPhase === 'techniques'
        ? ptCopy.martial.title
        : draft.archetypeType === 'powered-martial'
          ? ptCopy.poweredMartial.title
          : ptCopy.power.title;
  const phaseDescription =
    powersPhase === 'innate'
      ? ptCopy.innateDescription
      : powersPhase === 'techniques'
        ? ptCopy.martial.description
        : draft.archetypeType === 'powered-martial'
          ? ptCopy.poweredMartial.description
          : ptCopy.power.description;

  const completionHint = (
    <span className={innateSoftWarn ? 'font-nunito text-warning-fg' : 'font-nunito'}>
      {innateSoftWarn
        ? ptCopy.innateSoftWarn
        : visiblePhases.length > 1
          ? `${phaseIdx + 1} / ${visiblePhases.length}`
          : `${selectedIds.length}${allOptionIds.length ? ` / ${allOptionIds.length}` : ''}`}
    </span>
  );

  return (
    <GuidedStepLayout
      subStep="powers-techniques"
      title={phaseTitle}
      titleAddon={isInnatePhase ? <InnatePowersHelpTip /> : undefined}
      description={phaseDescription}
      continueLabel={continueLabel}
      footerBack={handleBack}
      footerContinue={handleContinue}
      completionHint={completionHint}
    >
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : isInlineCatalog ? (
        <div className="space-y-6">
          {budgetBar}

          {budgetMessage ? (
            <p className="text-center font-nunito text-sm text-warning-fg" role="status">
              {budgetMessage}
            </p>
          ) : null}

          <p className="text-center font-nunito text-sm text-text-secondary">
            {ptCopy.maxEnergyHint(catalogMaxEnergy)}
          </p>

          {isInnatePhase ? (
            <p className="font-nunito text-sm text-text-secondary">{ptCopy.innateIntroL3}</p>
          ) : null}

          <div className="space-y-2">
            <SourceFilter value={librarySource} onChange={setLibrarySource} />
            <FilterSection
              label="Filters"
              expanded={ptFiltersExpanded}
              onExpandedChange={setPtFiltersExpanded}
              activeCount={ptFilterActiveCount}
            >
              <PowerTechniqueFilters
                kind={isTechniques ? 'technique' : 'power'}
                value={ptFilters}
                onChange={setPtFilters}
                categoryOptions={ptCategoryOptions}
                innateThresholdOptions={innateThresholdOptions}
                persistCharacter={false}
                showCharacterFilter={false}
                pathFilter={{
                  options: inlinePathIndex.options,
                  selectedPathIds: inlineSelectedPathIds,
                  onChange: setInlineSelectedPathIds,
                }}
              />
            </FilterSection>
          </div>

          {isInnatePhase ? (
            <GuidedInlineCatalogList
              items={inlineInnateItems}
              selectedIds={inlineSelectedInnateIdSet}
              onToggleSelection={toggleInnateId}
              columns={powersTechniquesL2Headers('powers')}
              gridColumns={powersTechniquesL2Grid('powers')}
              itemLabel="innate power"
              emptyMessage={
                inlinePathFilterActive
                  ? pathFilterEmptyTitle('innate powers')
                  : ptCopy.l2.emptyMessage('powers', 'innate')
              }
              searchPlaceholder={ptCopy.l2.searchPlaceholder('powers')}
              selectedTitle={ptCopy.l2.innateSelectedTitle}
            />
          ) : (
            <GuidedInlineCatalogList
              items={inlineRegularItems}
              selectedIds={inlineSelectedIdSet}
              onToggleSelection={toggleRegularId}
              columns={powersTechniquesL2Headers(kind)}
              gridColumns={powersTechniquesL2Grid(kind)}
              itemLabel={isTechniques ? 'technique' : 'power'}
              emptyMessage={
                inlinePathFilterActive
                  ? pathFilterEmptyTitle(kind)
                  : ptCopy.l2.emptyMessage(kind, 'regular')
              }
              searchPlaceholder={ptCopy.l2.searchPlaceholder(kind)}
              selectedTitle={ptCopy.l2.selectedTitle(kind)}
            />
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {budgetBar}

          {budgetMessage ? (
            <p className="text-center font-nunito text-sm text-warning-fg" role="status">
              {budgetMessage}
            </p>
          ) : null}

          <GuidedPowersTechniquesL1Content
            phase={powersPhase}
            kind={kind}
            budgetMessage={budgetMessage}
            innateThreshold={innateThreshold}
            innateDisplayIds={innateDisplayIds}
            selectedInnateIds={selectedInnateIds}
            innatePromotedIds={innatePromotedIds}
            innateRecommendedIds={innateRecommendedIds}
            resolveCanonicalId={resolveCanonicalId}
            allOptionIds={allOptionIds}
            groups={groups}
            l1DisplayIds={l1DisplayIds}
            promotedIds={promotedIds}
            selectedIds={selectedIds}
            showPathDescriptor={showPathDescriptor}
            libraryItemsCount={libraryItems.length}
            isSelectedId={isSelectedId}
            isRegularUnavailable={isRegularUnavailable}
            isInnateUnavailable={isInnateUnavailable}
            toggleRegularId={toggleRegularId}
            toggleInnateId={toggleInnateId}
            resolveDisplay={resolveDisplay}
            onExpandInnate={() => setL2Modal('innate')}
            onExpandRegular={() => setL2Modal('regular')}
          />
        </div>
      )}

      {!isInlineCatalog ? (
        <GuidedPowersTechniquesL2Modal
          isOpen={l2Modal != null}
          kind={kind}
          mode={l2Modal === 'innate' ? 'innate' : 'regular'}
          items={libraryItems}
          powerPartsDb={powerPartsDb}
          techniquePartsDb={techniquePartsDb}
          initialSelectedIds={l2Modal === 'innate' ? selectedInnateIds : selectedIds}
          loadoutTpSpent={l2BaseTpSpent}
          tpLimit={loadoutTp.limit}
          archetypeAbility={archetypeAbility}
          abilities={draft.abilities}
          innateThreshold={innateThreshold}
          innateEnergyMax={innateEnergyMax}
          autoSelectPathType={draft.archetypeType}
          onClose={() => setL2Modal(null)}
          onConfirm={onL2Confirm}
          scopeExtra={<SourceFilter value={librarySource} onChange={setLibrarySource} />}
        />
      ) : null}
    </GuidedStepLayout>
  );
}
