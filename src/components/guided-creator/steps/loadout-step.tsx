/**
 * Loadout — phased weapon → armor → Equipment (internal phase id `gear`; no quick kits).
 */

'use client';

import { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import { Spinner } from '@/components/ui';
import { useEquipment, useOfficialLibrary, useGuidedEquipmentCatalog } from '@/hooks';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';
import { useGuidedPathData } from '../use-guided-path-data';
import { GuidedStepLayout } from '../guided-step-layout';
import { GuidedUnarmedProwessPanel } from '../guided-unarmed-prowess-panel';
import { GuidedEquipmentPhaseLayout } from '../guided-equipment-phase-layout';
import { GuidedEquipmentL1Phase } from '../guided-equipment-l1-phase';
import { GuidedEquipmentL2Modal } from '../guided-equipment-l2-modal';
import {
  buildEquipmentLookup,
  pruneUnresolvedLoadoutRefs,
  rebucketLoadoutByLookup,
} from '@/lib/guided-creator/resolve-loadout-items';
import { buildPathLoadoutPool } from '@/lib/guided-creator/loadout-pool';
import { resolveArmorStepMode } from '@/lib/guided-creator/equipment-eligibility';
import { filterPoolToPhase } from '@/lib/guided-creator/equipment-phase-candidates';
import {
  canCompleteEquipmentPhase,
  equipmentPhaseIndex,
  isLastEquipmentPhase,
  nextEquipmentPhase,
  prevEquipmentPhase,
  resolveEquipmentPhaseVisibility,
  visibleEquipmentPhases,
  type EquipmentPhaseVisibility,
} from '@/lib/guided-creator/equipment-phase-nav';
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
  const { pathData } = useGuidedPathData();
  const { data: officialItems = [], isLoading: officialLoading } = useOfficialLibrary('items');
  const { data: codexEquipment = [], isLoading: codexLoading } = useEquipment();
  const { catalog, itemProperties, tpSummary } = useGuidedEquipmentCatalog(
    draft,
    officialItems,
    codexEquipment
  );
  const [l2Open, setL2Open] = useState(false);

  const isLoading = officialLoading || codexLoading;
  const recommendUnarmed = pathData?.level1?.recommendUnarmedProwess === true;
  const armorMode = resolveArmorStepMode(pathData?.level1?.armorStep, draft.archetypeType);

  const equipmentPhase = draft.equipmentPhase ?? 'weapon';

  const equipmentLookup = useMemo(
    () => buildEquipmentLookup(officialItems, codexEquipment),
    [officialItems, codexEquipment]
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
      }),
    [armorMode, hasWeaponOptions, hasArmorOptions, recommendUnarmed]
  );

  const visiblePhases = visibleEquipmentPhases(armorMode, phaseVisibility);

  const phaseCompletion = useMemo(
    () => ({
      loadoutWeapons: draft.loadoutWeapons,
      loadoutArmor: draft.loadoutArmor,
      recommendUnarmed,
      unarmedProwess: draft.unarmedProwess ?? 0,
      armorMode,
    }),
    [
      draft.loadoutWeapons,
      draft.loadoutArmor,
      recommendUnarmed,
      draft.unarmedProwess,
      armorMode,
    ]
  );

  const phaseComplete = canCompleteEquipmentPhase(equipmentPhase, phaseCompletion);
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

  useEffect(() => {
    if (!visiblePhases.includes(equipmentPhase)) {
      updateDraft({ equipmentPhase: visiblePhases[0] ?? 'gear' });
    }
  }, [visiblePhases, equipmentPhase, updateDraft]);

  // Chapter rail / edit jump onto loadout: land on first equipment phase (weapon…).
  const lastLoadoutJumpNonce = useRef<number | null>(null);
  useEffect(() => {
    if (navigationIntent !== 'first') return;
    if (lastLoadoutJumpNonce.current === entryNonce) return;
    lastLoadoutJumpNonce.current = entryNonce;
    const first = visiblePhases[0] ?? 'weapon';
    updateDraft({ equipmentPhase: first });
    setL2Open(false);
  }, [navigationIntent, entryNonce, visiblePhases, updateDraft]);

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

  const handleLoadoutBack = useCallback(() => {
    if (l2Open) {
      setL2Open(false);
      return;
    }
    const prev = prevEquipmentPhase(equipmentPhase, armorMode, phaseVisibility);
    if (prev) {
      updateDraft({ equipmentPhase: prev });
      return;
    }
    prevSubStep();
  }, [l2Open, equipmentPhase, armorMode, phaseVisibility, updateDraft, prevSubStep]);

  const handleLoadoutContinue = useCallback(() => {
    if (l2Open) {
      setL2Open(false);
      return;
    }
    if (!phaseComplete) return;
    const next = nextEquipmentPhase(equipmentPhase, armorMode, phaseVisibility);
    if (next) {
      updateDraft({ equipmentPhase: next });
      return;
    }
    updateDraft({ currency: currencyRemaining });
    nextSubStep();
  }, [
    l2Open,
    phaseComplete,
    equipmentPhase,
    armorMode,
    phaseVisibility,
    updateDraft,
    currencyRemaining,
    nextSubStep,
  ]);

  const continueLabel = l2Open
    ? phaseCopy.backToPhase
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

  const footerCanContinue = l2Open ? true : phaseComplete;

  const phaseTitleCopy = phaseCopy[equipmentPhase];

  return (
    <GuidedStepLayout
      subStep="loadout"
      title={phaseTitleCopy.title}
      description={phaseTitleCopy.description}
      canContinue={footerCanContinue}
      continueLabel={continueLabel}
      footerBack={handleLoadoutBack}
      footerContinue={handleLoadoutContinue}
      completionHint={completionHint}
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-text-secondary">
          <Spinner className="h-5 w-5" />
          <span>{stepCopy.loadingItems}</span>
        </div>
      ) : (
        <div className="space-y-5">
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

          {equipmentPhase === 'weapon' && recommendUnarmed ? (
            <GuidedUnarmedProwessPanel
              level={draft.unarmedProwess ?? 0}
              onChange={handleUnarmedChange}
            />
          ) : null}

          <GuidedEquipmentL2Modal
            isOpen={l2Open}
            phase={equipmentPhase}
            draft={draft}
            pathLevel1={pathData?.level1}
            officialItems={officialItems}
            codexEquipment={codexEquipment}
            currencyStarting={currencyStarting}
            armsSpent={armsSpent}
            onClose={() => setL2Open(false)}
            onDraftChange={updateDraft}
          />
        </div>
      )}
    </GuidedStepLayout>
  );
}
