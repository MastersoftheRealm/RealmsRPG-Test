/**
 * Loadout — phased weapon → armor → Equipment (internal phase id `gear`; no quick kits).
 */

'use client';

import { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import { Spinner } from '@/components/ui';
import { GuidedInlineCatalogList, GuidedLayerNav, LoadoutBudgetBar } from '@/components/shared';
import { SourceFilter, type SourceFilterValue } from '@/components/shared/filters/source-filter';
import {
  useEquipment,
  useOfficialLibrary,
  useGuidedEquipmentCatalog,
  useGuidedEquipmentL2Catalog,
  useUserItems,
} from '@/hooks';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';
import { useGuidedPathData } from '../use-guided-path-data';
import { GuidedStepLayout } from '../guided-step-layout';
import { GuidedUnarmedProwessPanel } from '../guided-unarmed-prowess-panel';
import { GuidedEquipmentPhaseLayout } from '../guided-equipment-phase-layout';
import { GuidedEquipmentL1Phase } from '../guided-equipment-l1-phase';
import { GuidedEquipmentL2Modal } from '../guided-equipment-l2-modal';
import {
  l2GridColumnsForPhase,
  l2HeaderColumnsForPhase,
} from '../guided-equipment-l2-grid';
import {
  buildEquipmentLookup,
  pruneUnresolvedLoadoutRefs,
  rebucketLoadoutByLookup,
} from '@/lib/guided-creator/resolve-loadout-items';
import { buildPathLoadoutPool } from '@/lib/guided-creator/loadout-pool';
import { resolveArmorStepMode } from '@/lib/guided-creator/equipment-eligibility';
import { filterPoolToPhase } from '@/lib/guided-creator/equipment-phase-candidates';
import {
  changeGuidedEquipmentL2Quantity,
  initialSelectedIdsForPhase,
  toggleGuidedEquipmentL2Ref,
} from '@/lib/guided-creator/guided-equipment-l2';
import {
  equipmentPhaseIndex,
  isLastEquipmentPhase,
  nextEquipmentPhase,
  prevEquipmentPhase,
  resolveEquipmentPhaseVisibility,
  shouldShowPowerWeaponsHatch,
  visibleEquipmentPhases,
  type EquipmentPhaseVisibility,
} from '@/lib/guided-creator/equipment-phase-nav';
import { landsOnFirstInnerScreen } from '@/lib/guided-creator/guided-substep-nav';
import { prefersDeepCatalogEntry } from '@/lib/guided-creator/creator-entry-mode';
import {
  computeRemainingCurrency,
  computeSpentCurrency,
  computeStartingCurrency,
  resolveCatalogRowUnitCost,
  resolveRefUnitCost,
} from '@/lib/guided-creator/equipment-currency';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const stepCopy = GUIDED_CREATOR_COPY.steps.loadout;
const phaseCopy = stepCopy.phases;

function normalizeEqId(id: string): string {
  return String(id).trim().toLowerCase();
}

export function LoadoutStep() {
  const {
    draft,
    updateDraft,
    prevSubStep,
    nextSubStep,
    navigationIntent,
    entryNonce,
  } = useGuidedCreatorStore();
  const { pathData, archetype, isLoading: pathLoading } = useGuidedPathData();
  const { data: officialItems = [], isLoading: officialLoading } = useOfficialLibrary('items');
  const { data: userItems = [], isLoading: userItemsLoading } = useUserItems();
  const { data: codexEquipment = [], isLoading: codexLoading } = useEquipment();
  const [l2Open, setL2Open] = useState(false);
  const [weaponsL2Open, setWeaponsL2Open] = useState(false);
  const [inlineErrorState, setInlineErrorState] = useState<{
    phase: string;
    message: string;
  } | null>(null);

  // L3 — no archetype path: inline full catalog per phase, no L2 modal (TASK-684).
  const isInlineCatalog = prefersDeepCatalogEntry(draft);
  const [librarySource, setLibrarySource] = useState<SourceFilterValue>(
    isInlineCatalog ? 'all' : 'public'
  );

  const { catalog, itemProperties, tpSummary, allOfficial } = useGuidedEquipmentCatalog(
    draft,
    officialItems,
    codexEquipment,
    { userItems, source: librarySource }
  );

  /**
   * Phase visibility uses catalog classification. While catalogs/path are empty,
   * unresolved pool refs default to "equipment" and weapon/armor look absent —
   * so do not commit equipmentPhase jumps until ready (TASK-527).
   */
  const isLoading = officialLoading || codexLoading || pathLoading || userItemsLoading;
  const recommendUnarmed = pathData?.level1?.recommendUnarmedProwess === true;
  // Power always skips armor (draft type or path.type) — path armorStep cannot override (TASK-689).
  const armorMode = resolveArmorStepMode(
    pathData?.level1?.armorStep,
    draft.archetypeType ?? archetype?.type ?? null
  );

  const equipmentPhase = draft.equipmentPhase ?? 'weapon';

  const equipmentLookup = useMemo(
    () => buildEquipmentLookup(allOfficial, codexEquipment),
    [allOfficial, codexEquipment]
  );

  /**
   * Recommendation pool from flat path columns only (quick kits removed from DB).
   * L2 modal still accepts an empty loadouts array for API compatibility.
   */
  const itemPool = useMemo(
    () => buildPathLoadoutPool(pathData?.level1),
    [pathData?.level1]
  );

  const hasWeaponOptions = useMemo(
    () => filterPoolToPhase(itemPool, 'weapon', officialItems, codexEquipment).length > 0,
    [itemPool, officialItems, codexEquipment]
  );
  const hasArmorOptions = useMemo(
    () => filterPoolToPhase(itemPool, 'armor', officialItems, codexEquipment).length > 0,
    [itemPool, officialItems, codexEquipment]
  );

  const phaseVisibility: EquipmentPhaseVisibility = useMemo(
    () =>
      resolveEquipmentPhaseVisibility(armorMode, {
        hasWeaponOptions,
        hasArmorOptions,
        recommendUnarmed,
        // Custom / no path: weapons for every archetype; armor only when mode ≠ none (Power).
        fullCatalog: isInlineCatalog,
      }),
    [armorMode, hasWeaponOptions, hasArmorOptions, recommendUnarmed, isInlineCatalog]
  );

  const showWeaponsHatch = shouldShowPowerWeaponsHatch({
    archetypeType: draft.archetypeType,
    includeWeapon: phaseVisibility.includeWeapon,
    phase: equipmentPhase,
    fullCatalog: isInlineCatalog,
  });
  const l2Phase = weaponsL2Open ? 'weapon' : equipmentPhase;
  const modalOpen = l2Open || weaponsL2Open;

  const visiblePhases = visibleEquipmentPhases(armorMode, phaseVisibility);

  const onLastPhase = isLastEquipmentPhase(equipmentPhase, armorMode, phaseVisibility);

  const resolveSpendCost = useCallback(
    (ref: { id: string }) => {
      const row = catalog.get(normalizeEqId(ref.id));
      if (row) return resolveCatalogRowUnitCost(row);
      return resolveRefUnitCost(ref, officialItems, codexEquipment, itemProperties);
    },
    [catalog, officialItems, codexEquipment, itemProperties]
  );

  const armsSpent = useMemo(() => {
    const refs = [...draft.loadoutWeapons, ...draft.loadoutArmor];
    return refs.reduce(
      (sum, ref) => sum + resolveSpendCost(ref) * Math.max(1, ref.quantity),
      0
    );
  }, [draft.loadoutWeapons, draft.loadoutArmor, resolveSpendCost]);

  const gearSpent = useMemo(
    () =>
      computeSpentCurrency(
        draft.equipment.map((ref) => ({
          ...ref,
          cost: resolveSpendCost(ref),
        }))
      ),
    [draft.equipment, resolveSpendCost]
  );

  const currencyStarting = useMemo(() => computeStartingCurrency(1), []);

  const currencySpent = useMemo(() => armsSpent + gearSpent, [armsSpent, gearSpent]);

  const currencyRemaining = useMemo(
    () => computeRemainingCurrency(currencyStarting, currencySpent),
    [currencyStarting, currencySpent]
  );

  /**
   * Weapon / armor / gear picks are all optional (TASK-456), so the only phase blocker is an
   * overspent budget — which a draft written before the ceiling was enforced can still carry.
   */
  const currencyOverspend = Math.max(0, -currencyRemaining);
  const phaseComplete = currencyOverspend === 0;

  // Signed remainder drives loadout satisfaction / Reveal save. Persist clamps
  // at 0 in `build-character` (`clampSavedCurrency`) — do not clamp here or the
  // rail would treat an overspent kit as complete.
  useEffect(() => {
    if (draft.currency === currencyRemaining) return;
    updateDraft({ currency: currencyRemaining });
  }, [currencyRemaining, draft.currency, updateDraft]);

  // L3 / L2 modal catalog — reuse the step's base catalog (no second build) (TASK-684).
  const {
    catalog: l2Catalog,
    tpSummary: l2TpSummary,
    items: inlineItems,
  } = useGuidedEquipmentL2Catalog(
    l2Phase,
    draft,
    pathData?.level1,
    allOfficial,
    librarySource === 'my' ? [] : codexEquipment,
    currencyStarting,
    armsSpent,
    { catalog, tpSummary, itemProperties }
  );

  const inlineSelectedIds = useMemo(
    () => initialSelectedIdsForPhase(equipmentPhase, draft),
    [equipmentPhase, draft]
  );

  const inlineQuantities = useMemo(() => {
    if (equipmentPhase !== 'gear') return {};
    const next: Record<string, number> = {};
    for (const row of draft.equipment) {
      next[String(row.id)] = Math.max(1, Math.floor(Number(row.quantity)) || 1);
    }
    return next;
  }, [equipmentPhase, draft.equipment]);

  // Scope the error to the phase it was raised on — switching phases clears it
  // without a state-reset effect (react-hooks/set-state-in-effect).
  const inlineError =
    inlineErrorState?.phase === equipmentPhase ? inlineErrorState.message : null;

  const handleInlineToggle = useCallback(
    (id: string) => {
      const result = toggleGuidedEquipmentL2Ref(
        equipmentPhase,
        draft,
        id,
        l2Catalog,
        l2TpSummary.limit,
        currencyStarting
      );
      if (!result.ok) {
        setInlineErrorState({
          phase: equipmentPhase,
          message: result.message ?? phaseCopy.l2.confirmError,
        });
        return;
      }
      setInlineErrorState(null);
      if (result.partial) updateDraft(result.partial);
    },
    [equipmentPhase, draft, l2Catalog, l2TpSummary.limit, currencyStarting, updateDraft]
  );

  const handleInlineQuantityChange = useCallback(
    (itemIdStr: string, delta: number) => {
      const result = changeGuidedEquipmentL2Quantity(
        equipmentPhase,
        draft,
        itemIdStr,
        delta,
        l2Catalog,
        l2TpSummary.limit,
        currencyStarting
      );
      if (!result.ok) {
        setInlineErrorState({
          phase: equipmentPhase,
          message: result.message ?? phaseCopy.l2.confirmError,
        });
        return;
      }
      setInlineErrorState(null);
      if (result.partial) updateDraft(result.partial);
    },
    [equipmentPhase, draft, l2Catalog, l2TpSummary.limit, currencyStarting, updateDraft]
  );

  const openItemCreator = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.open('/item-creator', '_blank', 'noopener,noreferrer');
    }
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!visiblePhases.includes(equipmentPhase)) {
      updateDraft({ equipmentPhase: visiblePhases[0] ?? 'gear' });
    }
  }, [isLoading, visiblePhases, equipmentPhase, updateDraft]);

  // Chapter rail / Continue onto loadout: first equipment phase (never jump to furthest).
  // Footer Back keeps the draft phase (last screen before leaving loadout).
  // Wait for catalogs before consuming entryNonce — otherwise a cold cache makes
  // visiblePhases === ['gear'] and locks the user onto Equipment (TASK-527).
  const lastLoadoutJumpNonce = useRef<number | null>(null);
  useEffect(() => {
    if (isLoading) return;
    if (!landsOnFirstInnerScreen(navigationIntent)) return;
    if (lastLoadoutJumpNonce.current === entryNonce) return;
    lastLoadoutJumpNonce.current = entryNonce;
    const first = visiblePhases[0] ?? 'weapon';
    updateDraft({ equipmentPhase: first });
  }, [isLoading, navigationIntent, entryNonce, visiblePhases, updateDraft]);

  /** Re-bucket weapons/armor and drop unresolved (stale) refs once lookup is ready. */
  useEffect(() => {
    if (isLoading || equipmentLookup.size === 0) return;
    if (
      draft.loadoutWeapons.length === 0 &&
      draft.loadoutArmor.length === 0 &&
      draft.equipment.length === 0
    ) {
      return;
    }

    const prunedWeapons = pruneUnresolvedLoadoutRefs(draft.loadoutWeapons, equipmentLookup);
    const prunedArmor = pruneUnresolvedLoadoutRefs(draft.loadoutArmor, equipmentLookup);
    const prunedGear = pruneUnresolvedLoadoutRefs(draft.equipment, equipmentLookup);
    const next = rebucketLoadoutByLookup(prunedWeapons, prunedArmor, equipmentLookup);
    const gearChanged =
      JSON.stringify(prunedGear) !== JSON.stringify(draft.equipment);
    if (
      JSON.stringify(next.loadoutWeapons) === JSON.stringify(draft.loadoutWeapons) &&
      JSON.stringify(next.loadoutArmor) === JSON.stringify(draft.loadoutArmor) &&
      !gearChanged
    ) {
      return;
    }
    updateDraft({
      ...next,
      equipment: prunedGear,
    });
  }, [
    isLoading,
    draft.loadoutWeapons,
    draft.loadoutArmor,
    draft.equipment,
    equipmentLookup,
    updateDraft,
  ]);

  const handleUnarmedChange = useCallback(
    (level: number) => {
      updateDraft({ unarmedProwess: level });
    },
    [updateDraft]
  );

  const closeL2Modal = useCallback(() => {
    setL2Open(false);
    setWeaponsL2Open(false);
  }, []);

  const handleLoadoutBack = useCallback(() => {
    if (modalOpen) {
      closeL2Modal();
      return;
    }
    const prev = prevEquipmentPhase(equipmentPhase, armorMode, phaseVisibility);
    if (prev) {
      updateDraft({ equipmentPhase: prev });
      return;
    }
    prevSubStep();
  }, [
    modalOpen,
    closeL2Modal,
    equipmentPhase,
    armorMode,
    phaseVisibility,
    updateDraft,
    prevSubStep,
  ]);

  const handleLoadoutContinue = useCallback(() => {
    if (modalOpen) {
      closeL2Modal();
      return;
    }
    if (currencyOverspend > 0) {
      setInlineErrorState({
        phase: equipmentPhase,
        message: stepCopy.overspent(currencyOverspend),
      });
      return;
    }
    const next = nextEquipmentPhase(equipmentPhase, armorMode, phaseVisibility);
    if (next) {
      updateDraft({ equipmentPhase: next });
      return;
    }
    nextSubStep();
  }, [
    modalOpen,
    closeL2Modal,
    currencyOverspend,
    equipmentPhase,
    armorMode,
    phaseVisibility,
    updateDraft,
    nextSubStep,
  ]);

  const continueLabel = modalOpen
    ? phaseCopy.seeRecommendations
    : onLastPhase
      ? stepCopy.continueLabel
      : nextEquipmentPhase(equipmentPhase, armorMode, phaseVisibility) === 'armor'
        ? phaseCopy.continueWeapon
        : phaseCopy.continueToGear;

  const phaseIdx = equipmentPhaseIndex(equipmentPhase, armorMode, phaseVisibility);
  const completionHint =
    visiblePhases.length > 1 ? (
      <span className="font-nunito">
        {phaseIdx + 1} / {visiblePhases.length}
      </span>
    ) : undefined;

  const footerCanContinue = modalOpen ? true : phaseComplete;

  const phaseTitleCopy = phaseCopy[equipmentPhase];

  const overspendNotice =
    currencyOverspend > 0 ? (
      <p className="font-nunito text-sm text-warning-fg" role="alert">
        {stepCopy.overspent(currencyOverspend)}
      </p>
    ) : null;

  return (
    <GuidedStepLayout
      subStep="loadout"
      title={phaseTitleCopy.title}
      description={phaseTitleCopy.description}
      canContinue={footerCanContinue}
      continueLabel={continueLabel}
      continueTone={modalOpen ? 'previous' : 'progress'}
      footerBack={handleLoadoutBack}
      footerContinue={handleLoadoutContinue}
      completionHint={completionHint}
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-text-secondary">
          <Spinner className="h-5 w-5" />
          <span>{stepCopy.loadingItems}</span>
        </div>
      ) : isInlineCatalog ? (
        <div className="space-y-5">
          {overspendNotice}
          <LoadoutBudgetBar
            currencyTotal={currencyStarting}
            currencySpent={currencySpent}
            tpTotal={tpSummary.limit}
            tpSpent={tpSummary.spent}
          >
            {inlineError ? (
              <p className="font-nunito text-sm text-warning-fg text-center" role="alert">
                {inlineError}
              </p>
            ) : null}
          </LoadoutBudgetBar>

          <GuidedInlineCatalogList
            items={inlineItems}
            selectedIds={inlineSelectedIds}
            onToggleSelection={equipmentPhase === 'gear' ? undefined : handleInlineToggle}
            columns={l2HeaderColumnsForPhase(equipmentPhase)}
            gridColumns={l2GridColumnsForPhase(equipmentPhase)}
            itemLabel={equipmentPhase === 'gear' ? 'item' : equipmentPhase}
            emptyMessage={phaseCopy.l2.emptyMessage(equipmentPhase)}
            searchPlaceholder={phaseCopy.l2.searchPlaceholder(equipmentPhase)}
            showQuantity={equipmentPhase === 'gear'}
            quantities={inlineQuantities}
            onQuantityChange={
              equipmentPhase === 'gear' ? handleInlineQuantityChange : undefined
            }
            maxSelections={equipmentPhase === 'armor' ? 1 : undefined}
            selectedTitle={phaseCopy.l2.selectedTitle(equipmentPhase)}
            scopeExtra={
              <SourceFilter value={librarySource} onChange={setLibrarySource} />
            }
          />

          {equipmentPhase !== 'gear' ? (
            <GuidedLayerNav
              expandLabel={phaseCopy.createArmament}
              onExpand={openItemCreator}
            />
          ) : null}

          {equipmentPhase === 'weapon' && recommendUnarmed ? (
            <GuidedUnarmedProwessPanel
              level={draft.unarmedProwess ?? 0}
              onChange={handleUnarmedChange}
            />
          ) : null}
        </div>
      ) : (
        <div className="space-y-5">
          {overspendNotice}
          <GuidedEquipmentPhaseLayout
            currencyTotal={currencyStarting}
            currencySpent={currencySpent}
            tpTotal={tpSummary.limit}
            tpSpent={tpSummary.spent}
            expandLabel={phaseCopy.seeMoreLabel}
            onExpand={() => setL2Open(true)}
          >
            <GuidedEquipmentL1Phase
              phase={equipmentPhase}
              draft={draft}
              pool={itemPool}
              officialItems={officialItems}
              codexEquipment={codexEquipment}
              armorOptional={armorMode === 'optional' || !phaseVisibility.includeArmor}
              currencyRemaining={currencyRemaining}
              onDraftChange={updateDraft}
            />
          </GuidedEquipmentPhaseLayout>

          {showWeaponsHatch ? (
            <GuidedLayerNav
              className="justify-end"
              expandLabel={stepCopy.seeWeapons}
              onExpand={() => setWeaponsL2Open(true)}
            />
          ) : null}

          {equipmentPhase === 'weapon' && recommendUnarmed ? (
            <GuidedUnarmedProwessPanel
              level={draft.unarmedProwess ?? 0}
              onChange={handleUnarmedChange}
            />
          ) : null}

          <GuidedEquipmentL2Modal
            isOpen={modalOpen}
            phase={l2Phase}
            draft={draft}
            catalog={l2Catalog}
            items={inlineItems}
            tpLimit={l2TpSummary.limit}
            currencyStarting={currencyStarting}
            scopeExtra={
              <SourceFilter value={librarySource} onChange={setLibrarySource} />
            }
            onClose={closeL2Modal}
            onDraftChange={updateDraft}
          />
        </div>
      )}
    </GuidedStepLayout>
  );
}
