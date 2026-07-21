/**
 * Powers OR Techniques — step title depends on archetype (never both).
 * L1: path cards (innate vs regular when Power) + shared Training Points.
 * L2: UnifiedSelectionModal (TASK-463); innate modal (TASK-471/472/573).
 * Innate Energy fill is soft-warn only; innate picks spend TP like regular Powers.
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Spinner } from '@/components/ui';
import { PointStatus } from '@/components/shared';
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
import {
  buildPowerTechniqueCardFacts,
  resolvePowerTechniqueEnergy,
  resolvePowerTechniqueTpCost,
} from '@/lib/guided-creator/power-technique-display';
import { getPowersTechniquesL1Ids } from '@/lib/guided-creator/powers-techniques-l1-candidates';
import {
  buildLookup,
  pickAffordableIds,
  pickInnateFillIds,
  resolveLibraryItem,
  stepCopy,
} from '@/lib/guided-creator/powers-techniques-step-helpers';
import {
  combineGuidedTpBudgets,
  wouldExceedSharedTp,
} from '@/lib/guided-creator/loadout-tp';
import { calculateArchetypeProgression } from '@/lib/game/formulas';
import { ARCHETYPE_CONFIGS } from '@/lib/game/constants';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { LoadoutBudgetBar } from '../loadout-budget-bar';
import { normalizeId } from '@/lib/utils';

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

  const [budgetMessage, setBudgetMessage] = useState<string | null>(null);
  const [l2Modal, setL2Modal] = useState<L2ModalKind>(null);
  const didSeedSelection = useRef(false);
  const didSeedInnate = useRef(false);

  const { data: officialPowers = [], isLoading: powersLoading } = useOfficialLibrary('powers', {
    enabled: !isTechniques,
  });
  const { data: officialTechniques = [], isLoading: techniquesLoading } = useOfficialLibrary(
    'techniques',
    { enabled: isTechniques }
  );
  const { data: officialItems = [] } = useOfficialLibrary('items');
  const { data: codexEquipment = [] } = useEquipment();
  const { tpSummary: loadoutTp } = useGuidedEquipmentCatalog(
    draft,
    officialItems,
    codexEquipment
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
        isTechniques ? g.techniques?.length : g.powers?.length
      ) ?? [],
    [pathData, isTechniques]
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
    [lookup]
  );

  const { displayIds: l1DisplayIds, promotedIds } = useMemo(
    () => getPowersTechniquesL1Ids(allOptionIds, selectedIds, resolveCanonicalId),
    [allOptionIds, selectedIds, resolveCanonicalId]
  );

  const { displayIds: innateDisplayIds, promotedIds: innatePromotedIds } = useMemo(
    () =>
      getPowersTechniquesL1Ids(innateRecommendedIds, selectedInnateIds, resolveCanonicalId),
    [innateRecommendedIds, selectedInnateIds, resolveCanonicalId]
  );

  const showPathDescriptor = promotedIds.length > 0 && groups.length === 0;

  const resolveTpCost = useCallback(
    (id: string): number => {
      const raw = resolveLibraryItem(id, lookup);
      return resolvePowerTechniqueTpCost(
        isTechniques ? 'techniques' : 'powers',
        raw,
        powerPartsDb,
        techniquePartsDb
      );
    },
    [lookup, isTechniques, techniquePartsDb, powerPartsDb]
  );

  const resolveEnergy = useCallback(
    (id: string): number | undefined => {
      const raw = resolveLibraryItem(id, lookup);
      return resolvePowerTechniqueEnergy(
        'powers',
        raw,
        powerPartsDb,
        techniquePartsDb
      );
    },
    [lookup, powerPartsDb, techniquePartsDb]
  );

  const regularTpSpent = useMemo(
    () => selectedIds.reduce((sum, id) => sum + resolveTpCost(id), 0),
    [selectedIds, resolveTpCost]
  );

  const innateTpSpent = useMemo(
    () =>
      showInnateTrack
        ? selectedInnateIds.reduce((sum, id) => sum + resolveTpCost(id), 0)
        : 0,
    [showInnateTrack, selectedInnateIds, resolveTpCost]
  );

  /** Innate + regular powers both spend the shared Training Points budget. */
  const combatTpSpent = regularTpSpent + innateTpSpent;

  const tpBudget = useMemo(
    () => combineGuidedTpBudgets(loadoutTp, combatTpSpent),
    [loadoutTp, combatTpSpent]
  );

  const innateEnergySpent = useMemo(
    () =>
      selectedInnateIds.reduce((sum, id) => {
        const energy = resolveEnergy(id);
        return sum + (energy != null ? energy : 0);
      }, 0),
    [selectedInnateIds, resolveEnergy]
  );

  const innateRemaining = innateEnergyMax - innateEnergySpent;

  /**
   * Soft-seed once: innate first (energy + TP), then regular with remaining TP,
   * so innate recommendations are not starved by regular seed spend.
   */
  useEffect(() => {
    if (isLoading || pathData == null) return;

    if (showInnateTrack && !didSeedInnate.current) {
      if (selectedInnateIds.length > 0) {
        didSeedInnate.current = true;
      } else if (innateRecommendedIds.length === 0 || innateEnergyMax <= 0) {
        didSeedInnate.current = true;
      } else {
        const regularKeys = new Set(selectedIds.map((id) => normalizeId(id)));
        const innatePool = innateRecommendedIds.filter(
          (id) => !regularKeys.has(normalizeId(id))
        );
        const seed = pickInnateFillIds(
          innatePool,
          resolveEnergy,
          resolveTpCost,
          innateThreshold,
          innateEnergyMax,
          loadoutTp.spent + regularTpSpent,
          loadoutTp.limit
        );
        didSeedInnate.current = true;
        if (seed.length > 0) {
          updateDraft({ innatePowerIds: seed });
          // Wait for draft update before seeding regular against remaining TP.
          return;
        }
      }
    }

    if (didSeedSelection.current) return;
    if (selectedIds.length > 0) {
      didSeedSelection.current = true;
      return;
    }
    if (showInnateTrack && !didSeedInnate.current) return;
    if (allOptionIds.length === 0) {
      didSeedSelection.current = true;
      return;
    }
    const innateKeys = new Set(innateRecommendedIds.map((id) => normalizeId(id)));
    const regularPool = allOptionIds.filter((id) => !innateKeys.has(normalizeId(id)));
    const seed = pickAffordableIds(
      regularPool,
      resolveTpCost,
      loadoutTp.spent + innateTpSpent,
      loadoutTp.limit
    );
    didSeedSelection.current = true;
    if (seed.length === 0) return;
    if (isTechniques) {
      updateDraft({ techniqueIds: seed });
    } else {
      updateDraft({ powerIds: seed });
    }
  }, [
    allOptionIds,
    innateRecommendedIds,
    isTechniques,
    showInnateTrack,
    selectedIds,
    selectedInnateIds.length,
    updateDraft,
    isLoading,
    pathData,
    resolveTpCost,
    resolveEnergy,
    loadoutTp.spent,
    loadoutTp.limit,
    innateEnergyMax,
    innateThreshold,
    regularTpSpent,
    innateTpSpent,
  ]);

  const isSelectedId = useCallback(
    (id: string, pool: string[]) => {
      const key = String(id).toLowerCase();
      if (pool.some((x) => String(x).toLowerCase() === key)) return true;
      const resolved = resolveLibraryItem(id, lookup);
      if (!resolved) return false;
      const canonical = String(resolved.id ?? resolved.name ?? '').toLowerCase();
      const nameKey = String(resolved.name ?? '').toLowerCase();
      return pool.some((x) => {
        const sx = String(x).toLowerCase();
        if (sx === canonical || (nameKey && sx === nameKey)) return true;
        const other = resolveLibraryItem(x, lookup);
        return Boolean(other && other === resolved);
      });
    },
    [lookup]
  );

  const removeSelectedAlias = useCallback(
    (ids: string[], id: string) => {
      const resolved = resolveLibraryItem(id, lookup);
      const key = String(id).toLowerCase();
      const canonical = resolved
        ? String(resolved.id ?? resolved.name ?? '').toLowerCase()
        : key;
      const nameKey = resolved ? String(resolved.name ?? '').toLowerCase() : '';
      return ids.filter((x) => {
        const sx = String(x).toLowerCase();
        if (sx === key || sx === canonical || (nameKey && sx === nameKey)) return false;
        const other = resolveLibraryItem(x, lookup);
        return !(resolved && other && other === resolved);
      });
    },
    [lookup]
  );

  /** Keep innate vs regular exclusive if both lists somehow share a pick. */
  useEffect(() => {
    if (!showInnateTrack || draft.innatePowerIds.length === 0 || draft.powerIds.length === 0) {
      return;
    }
    const nextRegular = draft.powerIds.filter(
      (pid) =>
        !draft.innatePowerIds.some(
          (iid) =>
            normalizeId(pid) === normalizeId(iid) ||
            isSelectedId(pid, [iid]) ||
            isSelectedId(iid, [pid])
        )
    );
    if (nextRegular.length === draft.powerIds.length) return;
    updateDraft({ powerIds: nextRegular });
  }, [
    showInnateTrack,
    draft.innatePowerIds,
    draft.powerIds,
    isSelectedId,
    updateDraft,
  ]);

  const toggleRegularId = useCallback(
    (id: string) => {
      const key = String(id);
      setBudgetMessage(null);
      if (isTechniques) {
        if (isSelectedId(key, draft.techniqueIds)) {
          updateDraft({ techniqueIds: removeSelectedAlias(draft.techniqueIds, key) });
          return;
        }
        const addTp = resolveTpCost(key);
        const othersSpent = draft.techniqueIds.reduce((sum, x) => sum + resolveTpCost(x), 0);
        if (wouldExceedSharedTp(loadoutTp.spent + othersSpent, loadoutTp.limit, addTp)) {
          setBudgetMessage(ptCopy.tpBlocked);
          return;
        }
        updateDraft({ techniqueIds: [...draft.techniqueIds, key] });
        return;
      }

      if (isSelectedId(key, draft.powerIds)) {
        updateDraft({ powerIds: removeSelectedAlias(draft.powerIds, key) });
        return;
      }
      const addTp = resolveTpCost(key);
      const othersSpent =
        draft.powerIds.reduce((sum, x) => sum + resolveTpCost(x), 0) +
        draft.innatePowerIds.reduce((sum, x) => sum + resolveTpCost(x), 0);
      if (wouldExceedSharedTp(loadoutTp.spent + othersSpent, loadoutTp.limit, addTp)) {
        setBudgetMessage(ptCopy.tpBlocked);
        return;
      }
      // Keep out of innate list if present
      const nextInnate = isSelectedId(key, draft.innatePowerIds)
        ? removeSelectedAlias(draft.innatePowerIds, key)
        : draft.innatePowerIds;
      updateDraft({ powerIds: [...draft.powerIds, key], innatePowerIds: nextInnate });
    },
    [
      draft.techniqueIds,
      draft.powerIds,
      draft.innatePowerIds,
      isTechniques,
      updateDraft,
      resolveTpCost,
      loadoutTp,
      isSelectedId,
      removeSelectedAlias,
    ]
  );

  const toggleInnateId = useCallback(
    (id: string) => {
      const key = String(id);
      setBudgetMessage(null);
      if (isSelectedId(key, draft.innatePowerIds)) {
        updateDraft({ innatePowerIds: removeSelectedAlias(draft.innatePowerIds, key) });
        return;
      }
      const energy = resolveEnergy(key);
      if (energy == null || energy > innateThreshold) {
        setBudgetMessage(ptCopy.innateThresholdBlocked);
        return;
      }
      const othersEnergy = draft.innatePowerIds.reduce((sum, x) => {
        const e = resolveEnergy(x);
        return sum + (e != null ? e : 0);
      }, 0);
      if (othersEnergy + energy > innateEnergyMax) {
        setBudgetMessage(ptCopy.innateEnergyBlocked);
        return;
      }
      const addTp = resolveTpCost(key);
      const othersTp =
        draft.innatePowerIds.reduce((sum, x) => sum + resolveTpCost(x), 0) +
        draft.powerIds.reduce((sum, x) => sum + resolveTpCost(x), 0);
      if (wouldExceedSharedTp(loadoutTp.spent + othersTp, loadoutTp.limit, addTp)) {
        setBudgetMessage(ptCopy.tpBlocked);
        return;
      }
      const nextRegular = isSelectedId(key, draft.powerIds)
        ? removeSelectedAlias(draft.powerIds, key)
        : draft.powerIds;
      updateDraft({
        innatePowerIds: [...draft.innatePowerIds, key],
        powerIds: nextRegular,
      });
    },
    [
      draft.innatePowerIds,
      draft.powerIds,
      innateThreshold,
      innateEnergyMax,
      resolveEnergy,
      resolveTpCost,
      loadoutTp,
      isSelectedId,
      removeSelectedAlias,
      updateDraft,
    ]
  );

  const isRegularUnavailable = useCallback(
    (id: string) => {
      if (isSelectedId(id, selectedIds)) return false;
      const othersSpent = regularTpSpent + innateTpSpent;
      return wouldExceedSharedTp(loadoutTp.spent + othersSpent, loadoutTp.limit, resolveTpCost(id));
    },
    [
      isSelectedId,
      selectedIds,
      resolveTpCost,
      loadoutTp.spent,
      loadoutTp.limit,
      regularTpSpent,
      innateTpSpent,
    ]
  );

  const isInnateUnavailable = useCallback(
    (id: string) => {
      if (isSelectedId(id, selectedInnateIds)) return false;
      const energy = resolveEnergy(id);
      if (energy == null || energy > innateThreshold) return true;
      const othersEnergy = selectedInnateIds.reduce((sum, x) => {
        const e = resolveEnergy(x);
        return sum + (e != null ? e : 0);
      }, 0);
      if (othersEnergy + energy > innateEnergyMax) return true;
      return wouldExceedSharedTp(
        loadoutTp.spent + regularTpSpent + innateTpSpent,
        loadoutTp.limit,
        resolveTpCost(id)
      );
    },
    [
      isSelectedId,
      selectedInnateIds,
      resolveEnergy,
      resolveTpCost,
      innateThreshold,
      innateEnergyMax,
      loadoutTp.spent,
      loadoutTp.limit,
      regularTpSpent,
      innateTpSpent,
    ]
  );

  const resolveDisplay = useCallback(
    (id: string) => {
      const raw = resolveLibraryItem(id, lookup);
      const facts = buildPowerTechniqueCardFacts(
        isTechniques ? 'techniques' : 'powers',
        raw,
        id,
        powerPartsDb,
        techniquePartsDb
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
    [lookup, isTechniques, techniquePartsDb, powerPartsDb]
  );

  /** Innate Energy under-fill is a soft warning only — never block Continue (TASK-573). */
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

  /** TP spent outside the open L2 modal (loadout + the other powers track). */
  const l2BaseTpSpent =
    loadoutTp.spent + (l2Modal === 'innate' ? regularTpSpent : innateTpSpent);

  const handleL2Confirm = useCallback(
    (ids: string[]) => {
      if (l2Modal === 'innate') {
        const nextRegular = draft.powerIds.filter(
          (pid) => !ids.some((iid) => isSelectedId(iid, [pid]) || isSelectedId(pid, [iid]))
        );
        updateDraft({ innatePowerIds: ids, powerIds: nextRegular });
        return;
      }
      if (isTechniques) {
        updateDraft({ techniqueIds: ids });
        return;
      }
      const nextInnate = draft.innatePowerIds.filter(
        (iid) => !ids.some((pid) => isSelectedId(pid, [iid]) || isSelectedId(iid, [pid]))
      );
      updateDraft({ powerIds: ids, innatePowerIds: nextInnate });
    },
    [l2Modal, isTechniques, draft.powerIds, draft.innatePowerIds, updateDraft, isSelectedId]
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
        onConfirm={handleL2Confirm}
      />
    </GuidedStepLayout>
  );
}
