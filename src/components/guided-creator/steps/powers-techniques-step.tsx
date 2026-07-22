/**
 * Powers OR Techniques — step title depends on archetype (never both).
 * L1: path cards (innate vs regular when Power) + shared Training Points.
 * L2: UnifiedSelectionModal (TASK-463); innate modal (TASK-471/472/573).
 * Innate Energy fill is soft-warn only; innate picks spend TP like regular Powers.
 */

'use client';

import { useCallback, useMemo, useState } from 'react';
import { Spinner } from '@/components/ui';
import { PointStatus, LoadoutBudgetBar } from '@/components/shared';
import {
  useEquipment,
  useOfficialLibrary,
  usePowerParts,
  useTechniqueParts,
  useGuidedEquipmentCatalog,
} from '@/hooks';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';
import { useGuidedPathData } from '../use-guided-path-data';
import { GuidedPowersTechniquesL2Modal } from '../guided-powers-techniques-l2-modal';
import { GuidedStepLayout } from '../guided-step-layout';
import { GuidedPowersTechniquesL1Content } from '../guided-powers-techniques-l1-content';
import { usePowersTechniquesSelection } from './use-powers-techniques-selection';
import {
  buildPowerTechniqueCardFacts,
  resolvePowerTechniqueEnergy,
  resolvePowerTechniqueTpCost,
} from '@/lib/guided-creator/power-technique-display';
import { getPowersTechniquesL1Ids } from '@/lib/guided-creator/powers-techniques-l1-candidates';
import { buildLookup, resolveLibraryItem, stepCopy } from '@/lib/guided-creator/powers-techniques-step-helpers';
import { combineGuidedTpBudgets } from '@/lib/guided-creator/loadout-tp';
import { calculateArchetypeProgression } from '@/lib/game/formulas';
import { ARCHETYPE_CONFIGS } from '@/lib/game/constants';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const ptCopy = GUIDED_CREATOR_COPY.steps.powersTechniques;

type L2ModalKind = 'regular' | 'innate' | null;

export function PowersTechniquesStep() {
  const { draft, updateDraft } = useGuidedCreatorStore();
  const { pathData } = useGuidedPathData();
  const copy = stepCopy(draft.archetypeType);
  const isTechniques = copy.kind === 'techniques';
  const showInnateTrack =
    !isTechniques &&
    (draft.archetypeType === 'power' || draft.archetypeType === 'powered-martial');

  const [l2Modal, setL2Modal] = useState<L2ModalKind>(null);

  const { data: officialPowers = [], isLoading: powersLoading } = useOfficialLibrary('powers', {
    enabled: !isTechniques,
  });
  const { data: officialTechniques = [], isLoading: techniquesLoading } = useOfficialLibrary(
    'techniques',
    { enabled: isTechniques },
  );
  const { data: officialItems = [] } = useOfficialLibrary('items');
  const { data: codexEquipment = [] } = useEquipment();
  const { tpSummary: loadoutTp } = useGuidedEquipmentCatalog(
    draft,
    officialItems,
    codexEquipment,
  );
  const { data: powerPartsDb = [] } = usePowerParts();
  const { data: techniquePartsDb = [] } = useTechniqueParts();

  const isLoading = isTechniques ? techniquesLoading : powersLoading;
  const libraryItems = isTechniques ? officialTechniques : officialPowers;
  const lookup = useMemo(() => buildLookup(libraryItems), [libraryItems]);

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
    () =>
      getPowersTechniquesL1Ids(innateRecommendedIds, selectedInnateIds, resolveCanonicalId),
    [innateRecommendedIds, selectedInnateIds, resolveCanonicalId],
  );

  const showPathDescriptor = promotedIds.length > 0 && groups.length === 0;

  const resolveTpCost = useCallback(
    (id: string): number => {
      const raw = resolveLibraryItem(id, lookup);
      return resolvePowerTechniqueTpCost(
        isTechniques ? 'techniques' : 'powers',
        raw,
        powerPartsDb,
        techniquePartsDb,
      );
    },
    [lookup, isTechniques, techniquePartsDb, powerPartsDb],
  );

  const resolveEnergy = useCallback(
    (id: string): number | undefined => {
      const raw = resolveLibraryItem(id, lookup);
      return resolvePowerTechniqueEnergy('powers', raw, powerPartsDb, techniquePartsDb);
    },
    [lookup, powerPartsDb, techniquePartsDb],
  );

  const regularTpSpent = useMemo(
    () => selectedIds.reduce((sum, id) => sum + resolveTpCost(id), 0),
    [selectedIds, resolveTpCost],
  );

  const innateTpSpent = useMemo(
    () =>
      showInnateTrack
        ? selectedInnateIds.reduce((sum, id) => sum + resolveTpCost(id), 0)
        : 0,
    [showInnateTrack, selectedInnateIds, resolveTpCost],
  );

  const combatTpSpent = regularTpSpent + innateTpSpent;

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
    innateTpSpent,
    innateEnergyMax,
    innateThreshold,
    resolveTpCost,
    resolveEnergy,
  });

  const resolveDisplay = useCallback(
    (id: string) => {
      const raw = resolveLibraryItem(id, lookup);
      const facts = buildPowerTechniqueCardFacts(
        isTechniques ? 'techniques' : 'powers',
        raw,
        id,
        powerPartsDb,
        techniquePartsDb,
      );
      return {
        id: String(id),
        name: facts.name,
        description: facts.description ?? '',
        titleChips: facts.titleChips,
        detailChips: facts.detailChips,
        tpCost: facts.tpCost,
      };
    },
    [lookup, isTechniques, techniquePartsDb, powerPartsDb],
  );

  const innateSoftWarn =
    showInnateTrack && innateEnergyMax > 0 && innateRemaining !== 0;

  const budgetBar = (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
      {showInnateTrack && innateEnergyMax > 0 ? (
        <PointStatus
          total={innateEnergyMax}
          spent={innateEnergySpent}
          label={ptCopy.innateEnergyLabel}
          variant="inline"
        />
      ) : null}
      <LoadoutBudgetBar tpTotal={tpBudget.limit} tpSpent={tpBudget.spent} />
    </div>
  );

  const archetypeAbility = draft.pow_abil ?? draft.mart_abil;

  const l2BaseTpSpent =
    loadoutTp.spent + (l2Modal === 'innate' ? regularTpSpent : innateTpSpent);

  const onL2Confirm = useCallback(
    (ids: string[]) => {
      confirmL2Selection(ids, l2Modal);
    },
    [confirmL2Selection, l2Modal],
  );

  return (
    <GuidedStepLayout
      subStep="powers-techniques"
      title={copy.title}
      description={copy.description}
      continueLabel={GUIDED_CREATOR_COPY.steps.skills.continueLabel}
      completionHint={
        <span
          className={innateSoftWarn ? 'font-nunito text-warning-fg' : 'font-nunito'}
        >
          {innateSoftWarn
            ? ptCopy.innateSoftWarn
            : `${selectedIds.length}${allOptionIds.length ? ` / ${allOptionIds.length}` : ''}`}
        </span>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-6">
          {budgetBar}

          {budgetMessage ? (
            <p className="font-nunito text-sm text-warning-fg text-center" role="status">
              {budgetMessage}
            </p>
          ) : null}

          <GuidedPowersTechniquesL1Content
            showInnateTrack={showInnateTrack}
            isTechniques={isTechniques}
            kind={copy.kind}
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

      <GuidedPowersTechniquesL2Modal
        isOpen={l2Modal != null}
        kind={copy.kind}
        mode={l2Modal === 'innate' ? 'innate' : 'regular'}
        items={libraryItems}
        powerPartsDb={powerPartsDb}
        techniquePartsDb={techniquePartsDb}
        pathRecommendedIds={l2Modal === 'innate' ? innateRecommendedIds : allOptionIds}
        initialSelectedIds={l2Modal === 'innate' ? selectedInnateIds : selectedIds}
        loadoutTpSpent={l2BaseTpSpent}
        tpLimit={loadoutTp.limit}
        archetypeAbility={archetypeAbility}
        abilities={draft.abilities}
        innateThreshold={innateThreshold}
        innateEnergyMax={innateEnergyMax}
        onClose={() => setL2Modal(null)}
        onConfirm={onL2Confirm}
      />
    </GuidedStepLayout>
  );
}
