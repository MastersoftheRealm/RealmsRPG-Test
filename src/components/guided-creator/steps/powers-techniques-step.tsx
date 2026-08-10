/**
 * Powers OR Techniques — step title depends on archetype (never both).
 * L1: path cards (innate vs regular when Power) + shared Training Points.
 * L2: UnifiedSelectionModal (TASK-463); innate modal (TASK-471/472/573).
 * Innate Energy fill is soft-warn only; innate picks spend TP like regular Powers.
 */

'use client';

import { useCallback, useMemo, useState } from 'react';
import { Spinner } from '@/components/ui';
import { PointStatus, LoadoutBudgetBar, GuidedInlineCatalogList } from '@/components/shared';
import { SelectFilter } from '@/components/shared/filters';
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
import { GuidedSectionTitle } from '../guided-section-title';
import { usePowersTechniquesSelection } from './use-powers-techniques-selection';
import {
  buildPowerTechniqueCardFacts,
  resolvePowerTechniqueEnergy,
  resolvePowerTechniqueTpCost,
} from '@/lib/guided-creator/power-technique-display';
import {
  buildPowersTechniquesL2Items,
  POWERS_TECHNIQUES_L2_GRID,
  POWERS_TECHNIQUES_L2_HEADER_COLUMNS,
} from '@/lib/guided-creator/powers-techniques-l2';
import { getPowersTechniquesL1Ids } from '@/lib/guided-creator/powers-techniques-l1-candidates';
import { buildLookup, resolveLibraryItem, stepCopy } from '@/lib/guided-creator/powers-techniques-step-helpers';
import { combineGuidedTpBudgets } from '@/lib/guided-creator/loadout-tp';
import {
  calculateGuidedL1TheoreticalMaxEnergy,
  GUIDED_L2_ENERGY_FALLBACK_MAX,
} from '@/lib/guided-creator/powers-techniques-energy-filter';
import { calculateArchetypeProgression } from '@/lib/game/formulas';
import { ARCHETYPE_CONFIGS } from '@/lib/game/constants';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { useGuidedDeepEntryOnArrival } from '@/lib/guided-creator/use-guided-deep-entry-on-arrival';
import { prefersDeepCatalogEntry } from '@/lib/guided-creator/creator-entry-mode';

const ptCopy = GUIDED_CREATOR_COPY.steps.powersTechniques;

type L2ModalKind = 'regular' | 'innate' | null;
type InnateScopeFilter = 'all' | 'innate' | 'regular';

export function PowersTechniquesStep() {
  const { draft, updateDraft, navigationIntent, entryNonce } = useGuidedCreatorStore();
  const { pathData } = useGuidedPathData();
  const copy = stepCopy(draft.archetypeType);
  const isTechniques = copy.kind === 'techniques';
  const showInnateTrack =
    !isTechniques &&
    (draft.archetypeType === 'power' || draft.archetypeType === 'powered-martial');

  const [l2Modal, setL2Modal] = useState<L2ModalKind>(null);
  /** L3 — which track(s) to show when innate applies (TASK-685). */
  const [innateScope, setInnateScope] = useState<InnateScopeFilter>('all');

  // L3 — no archetype path: inline full catalog per track, no L2 modal (TASK-684).
  const isInlineCatalog = prefersDeepCatalogEntry(draft);

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

  const openDeepBrowse = useCallback(() => {
    setL2Modal(showInnateTrack ? 'innate' : 'regular');
  }, [showInnateTrack]);
  useGuidedDeepEntryOnArrival({
    draft,
    navigationIntent,
    entryNonce,
    enabled: !isLoading && !isInlineCatalog,
    onDeepEntry: openDeepBrowse,
  });

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
      return resolvePowerTechniqueEnergy(
        isTechniques ? 'techniques' : 'powers',
        raw,
        powerPartsDb,
        techniquePartsDb,
      );
    },
    [lookup, isTechniques, powerPartsDb, techniquePartsDb],
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

  // L3 inline catalog — same builder as GuidedPowersTechniquesL2Modal so ranking/columns
  // stay identical; toggle handlers are the same immediate `toggleRegularId`/`toggleInnateId`
  // used by L1 cards, so budget rules never diverge modal vs. inline (TASK-684).
  const regularUnavailableReason = useCallback(
    (id: string): string | undefined => (isRegularUnavailable(id) ? ptCopy.tpBlocked : undefined),
    [isRegularUnavailable],
  );

  const innateUnavailableReason = useCallback(
    (id: string): string | undefined => {
      if (!isInnateUnavailable(id)) return undefined;
      const energy = resolveEnergy(id);
      if (energy == null || energy > innateThreshold) return ptCopy.innateThresholdBlocked;
      const othersEnergy = selectedInnateIds.reduce((sum, x) => {
        const e = resolveEnergy(x);
        return sum + (e != null ? e : 0);
      }, 0);
      if (othersEnergy + energy > innateEnergyMax) return ptCopy.innateEnergyBlocked;
      return ptCopy.tpBlocked;
    },
    [isInnateUnavailable, resolveEnergy, innateThreshold, selectedInnateIds, innateEnergyMax],
  );

  /**
   * Theoretical max EN for catalog filter (TASK-687):
   * Power track → pow_abil; Techniques / Martial track → mart_abil (GAME_RULES Energy).
   */
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
    const built = buildPowersTechniquesL2Items({
      kind: copy.kind,
      mode: 'regular',
      items: libraryItems,
      powerPartsDb,
      techniquePartsDb,
      pathRecommendedIds: allOptionIds,
      energyInput,
    });
    // Hide TP-blocked rows (max EN already filtered by the builder). Keep selected.
    return built.filter((item) => {
      const idStr = String(item.id);
      if (isSelectedId(idStr, selectedIds)) return true;
      return !regularUnavailableReason(idStr);
    });
  }, [
    copy.kind,
    libraryItems,
    powerPartsDb,
    techniquePartsDb,
    allOptionIds,
    energyInput,
    isSelectedId,
    selectedIds,
    regularUnavailableReason,
  ]);

  const inlineInnateItems = useMemo(() => {
    if (!showInnateTrack) return [];
    const built = buildPowersTechniquesL2Items({
      kind: copy.kind,
      mode: 'innate',
      items: libraryItems,
      powerPartsDb,
      techniquePartsDb,
      pathRecommendedIds: innateRecommendedIds,
      energyInput,
      innateThreshold,
    });
    return built.filter((item) => {
      const idStr = String(item.id);
      if (isSelectedId(idStr, selectedInnateIds)) return true;
      return !innateUnavailableReason(idStr);
    });
  }, [
    showInnateTrack,
    copy.kind,
    libraryItems,
    powerPartsDb,
    techniquePartsDb,
    innateRecommendedIds,
    energyInput,
    innateThreshold,
    isSelectedId,
    selectedInnateIds,
    innateUnavailableReason,
  ]);

  const inlineSelectedIdSet = useMemo(() => new Set(selectedIds.map(String)), [selectedIds]);
  const inlineSelectedInnateIdSet = useMemo(
    () => new Set(selectedInnateIds.map(String)),
    [selectedInnateIds],
  );

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
      ) : isInlineCatalog ? (
        <div className="space-y-6">
          {budgetBar}

          {budgetMessage ? (
            <p className="font-nunito text-sm text-warning-fg text-center" role="status">
              {budgetMessage}
            </p>
          ) : null}

          <p className="font-nunito text-sm text-text-secondary text-center">
            {ptCopy.maxEnergyHint(catalogMaxEnergy)}
          </p>

          {showInnateTrack ? (
            <SelectFilter
              label={ptCopy.innateScopeLabel}
              value={innateScope}
              options={[
                { value: 'all', label: ptCopy.innateScopeAll },
                { value: 'innate', label: ptCopy.innateScopeInnate },
                { value: 'regular', label: ptCopy.innateScopeRegular },
              ]}
              onChange={(v) => setInnateScope(v as InnateScopeFilter)}
              placeholder={null}
            />
          ) : null}

          {showInnateTrack && (innateScope === 'all' || innateScope === 'innate') ? (
            <section className="space-y-3">
              <GuidedSectionTitle>{ptCopy.innateHeading}</GuidedSectionTitle>
              <p className="font-nunito text-sm text-text-secondary">{ptCopy.innateIntroL3}</p>
              <p className="font-nunito text-xs text-text-secondary dark:text-text-secondary">
                {ptCopy.innateThresholdHint(innateThreshold)}
              </p>
              <GuidedInlineCatalogList
                items={inlineInnateItems}
                selectedIds={inlineSelectedInnateIdSet}
                onToggleSelection={toggleInnateId}
                columns={POWERS_TECHNIQUES_L2_HEADER_COLUMNS}
                gridColumns={POWERS_TECHNIQUES_L2_GRID}
                itemLabel="innate power"
                emptyMessage={ptCopy.l2.emptyMessage(copy.kind, 'innate')}
                searchPlaceholder={ptCopy.l2.searchPlaceholder(copy.kind)}
                selectedTitle={ptCopy.l2.innateSelectedTitle}
              />
            </section>
          ) : null}

          {!showInnateTrack || innateScope === 'all' || innateScope === 'regular' ? (
            <section className="space-y-3">
              {showInnateTrack ? (
                <GuidedSectionTitle>
                  {isTechniques ? ptCopy.techniquesHeading : ptCopy.powersHeading}
                </GuidedSectionTitle>
              ) : null}
              <GuidedInlineCatalogList
                items={inlineRegularItems}
                selectedIds={inlineSelectedIdSet}
                onToggleSelection={toggleRegularId}
                columns={POWERS_TECHNIQUES_L2_HEADER_COLUMNS}
                gridColumns={POWERS_TECHNIQUES_L2_GRID}
                itemLabel={isTechniques ? 'technique' : 'power'}
                emptyMessage={ptCopy.l2.emptyMessage(copy.kind, 'regular')}
                searchPlaceholder={ptCopy.l2.searchPlaceholder(copy.kind)}
                selectedTitle={ptCopy.l2.selectedTitle(copy.kind)}
              />
            </section>
          ) : null}
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

      {!isInlineCatalog ? (
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
      ) : null}
    </GuidedStepLayout>
  );
}
