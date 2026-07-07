/**
 * Equipment loadout — phased weapon → armor → gear (TASK-424).
 */

'use client';

import { useEffect, useMemo, useCallback, useState } from 'react';
import { Spinner, EmptyState } from '@/components/ui';
import { useEquipment, useOfficialLibrary } from '@/hooks';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';
import { useGuidedPathData } from '../use-guided-path-data';
import { GuidedStepLayout } from '../guided-step-layout';
import { GuidedUnarmedProwessPanel } from '../guided-unarmed-prowess-panel';
import { GuidedEquipmentPhaseProgress } from '../guided-equipment-phase-progress';
import { GuidedEquipmentPhaseLayout } from '../guided-equipment-phase-layout';
import { GuidedEquipmentL1Phase } from '../guided-equipment-l1-phase';
import { GuidedEquipmentPhaseSelection } from '../guided-equipment-phase-selection';
import { GuidedLoadoutKitPresets } from '../guided-loadout-kit-presets';
import { GuidedEquipmentL2Modal } from '../guided-equipment-l2-modal';
import type { PathItemRecommendation, PathLoadout } from '@/types/archetype';
import {
  buildEquipmentLookup,
  loadoutDraftFromSelection,
  resolveLoadoutItems,
} from '@/lib/guided-creator/resolve-loadout-items';
import { buildPathLoadoutPool } from '@/lib/guided-creator/loadout-pool';
import { resolveArmorStepMode } from '@/lib/guided-creator/equipment-eligibility';
import {
  canCompleteEquipmentPhase,
  equipmentPhaseIndex,
  isLastEquipmentPhase,
  nextEquipmentPhase,
  prevEquipmentPhase,
  visibleEquipmentPhases,
} from '@/lib/guided-creator/equipment-phase-nav';
import {
  computeRemainingCurrency,
  computeSpentCurrency,
  computeStartingCurrency,
  resolveRefUnitCost,
} from '@/lib/guided-creator/equipment-currency';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const stepCopy = GUIDED_CREATOR_COPY.steps.loadout;
const phaseCopy = stepCopy.phases;

function mergeSharedEquipment(
  equipment: PathItemRecommendation[],
  shared: PathItemRecommendation[] | undefined
): PathItemRecommendation[] {
  if (!shared?.length) return equipment;
  const seen = new Set(equipment.map((e) => String(e.id).trim().toLowerCase()));
  const merged = [...equipment];
  for (const ref of shared) {
    const key = String(ref.id).trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(ref);
  }
  return merged;
}

export function LoadoutStep() {
  const { draft, updateDraft, prevSubStep, nextSubStep } = useGuidedCreatorStore();
  const { pathData, archetype } = useGuidedPathData();
  const { data: officialItems = [], isLoading: officialLoading } = useOfficialLibrary('items');
  const { data: codexEquipment = [], isLoading: codexLoading } = useEquipment();
  const [l2Open, setL2Open] = useState(false);

  const isLoading = officialLoading || codexLoading;
  const recommendUnarmed = pathData?.level1?.recommendUnarmedProwess === true;
  const armorMode = resolveArmorStepMode(pathData?.level1?.armorStep, draft.archetypeType);
  const sharedEquipment = pathData?.level1?.sharedEquipment;

  const equipmentPhase = draft.equipmentPhase ?? 'weapon';
  const visiblePhases = visibleEquipmentPhases(armorMode);

  const equipmentLookup = useMemo(
    () => buildEquipmentLookup(officialItems, codexEquipment),
    [officialItems, codexEquipment]
  );

  const loadouts: PathLoadout[] = useMemo(() => {
    const fromPath = pathData?.level1?.loadouts ?? [];
    if (fromPath.length > 0) return fromPath;

    const armaments = pathData?.level1?.armamentRecommendations ?? [];
    const equipment = pathData?.level1?.equipmentRecommendations ?? [];
    if (armaments.length === 0 && equipment.length === 0) return [];

    return [
      {
        id: 'path-default',
        title: stepCopy.pathDefaultTitle(archetype?.name ?? 'Path'),
        why: stepCopy.pathDefaultWhy,
        armaments,
        equipment,
      },
    ];
  }, [pathData, archetype?.name]);

  const itemPool = useMemo(
    () => buildPathLoadoutPool(loadouts, pathData?.level1),
    [loadouts, pathData?.level1]
  );

  const resolvedByLoadoutId = useMemo(() => {
    const map = new Map<string, ReturnType<typeof resolveLoadoutItems>>();
    for (const loadout of loadouts) {
      map.set(
        loadout.id,
        resolveLoadoutItems(loadout, equipmentLookup, stepCopy.unresolvedItem)
      );
    }
    return map;
  }, [loadouts, equipmentLookup]);

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
  const onLastPhase = isLastEquipmentPhase(equipmentPhase, armorMode);

  const armsSpent = useMemo(() => {
    const refs = [...draft.loadoutWeapons, ...draft.loadoutArmor];
    return refs.reduce(
      (sum, ref) =>
        sum + resolveRefUnitCost(ref, officialItems, codexEquipment) * Math.max(1, ref.quantity),
      0
    );
  }, [draft.loadoutWeapons, draft.loadoutArmor, officialItems, codexEquipment]);

  const gearSpent = useMemo(
    () =>
      computeSpentCurrency(
        draft.equipment.map((ref) => ({
          ...ref,
          cost: resolveRefUnitCost(ref, officialItems, codexEquipment),
        }))
      ),
    [draft.equipment, officialItems, codexEquipment]
  );

  const currencyRemaining = useMemo(() => {
    const starting = computeStartingCurrency(1);
    return computeRemainingCurrency(starting, armsSpent + gearSpent);
  }, [armsSpent, gearSpent]);

  useEffect(() => {
    if (armorMode === 'none' && equipmentPhase === 'armor') {
      updateDraft({ equipmentPhase: 'gear' });
    }
  }, [armorMode, equipmentPhase, updateDraft]);

  useEffect(() => {
    if (draft.loadoutId || loadouts.length === 0) return;
    const first = loadouts[0];
    const fromKit = loadoutDraftFromSelection(first);
    updateDraft({
      loadoutId: first.id,
      equipmentPhase: 'weapon',
      ...fromKit,
      equipment: mergeSharedEquipment(fromKit.equipment, sharedEquipment),
    });
  }, [loadouts, draft.loadoutId, updateDraft, sharedEquipment]);

  const selectLoadout = useCallback(
    (loadout: PathLoadout) => {
      const fromKit = loadoutDraftFromSelection(loadout);
      setL2Open(false);
      updateDraft({
        loadoutId: loadout.id,
        equipmentPhase: 'weapon',
        ...fromKit,
        equipment: mergeSharedEquipment(fromKit.equipment, sharedEquipment),
      });
    },
    [updateDraft, sharedEquipment]
  );

  const handleUnarmedChange = useCallback(
    (level: number) => {
      updateDraft({ unarmedProwess: level });
    },
    [updateDraft]
  );

  const handlePhaseChange = useCallback(
    (phase: typeof equipmentPhase) => {
      setL2Open(false);
      updateDraft({ equipmentPhase: phase });
    },
    [updateDraft]
  );

  const handleLoadoutBack = useCallback(() => {
    if (l2Open) {
      setL2Open(false);
      return;
    }
    const prev = prevEquipmentPhase(equipmentPhase, armorMode);
    if (prev) {
      updateDraft({ equipmentPhase: prev });
      return;
    }
    prevSubStep();
  }, [l2Open, equipmentPhase, armorMode, updateDraft, prevSubStep]);

  const handleLoadoutContinue = useCallback(() => {
    if (l2Open) {
      setL2Open(false);
      return;
    }
    if (!phaseComplete) return;
    const next = nextEquipmentPhase(equipmentPhase, armorMode);
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
    updateDraft,
    currencyRemaining,
    nextSubStep,
  ]);

  const continueLabel = l2Open
    ? phaseCopy.backToPhase
    : onLastPhase
      ? stepCopy.continueLabel
      : equipmentPhase === 'weapon'
        ? armorMode === 'none'
          ? phaseCopy.continueArmor
          : phaseCopy.continueWeapon
        : phaseCopy.continueArmor;

  const phaseIdx = equipmentPhaseIndex(equipmentPhase, armorMode);
  const completionHint =
    visiblePhases.length > 1 ? (
      <span className="font-nunito">
        {phaseIdx + 1} / {visiblePhases.length}
      </span>
    ) : undefined;

  const hasStepSelection =
    draft.loadoutWeapons.length + draft.loadoutArmor.length + draft.equipment.length > 0 ||
    (recommendUnarmed && (draft.unarmedProwess ?? 0) > 0);

  const footerCanContinue = l2Open ? true : onLastPhase ? phaseComplete && hasStepSelection : phaseComplete;

  return (
    <GuidedStepLayout
      subStep="loadout"
      title={stepCopy.title}
      description={stepCopy.description}
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
      ) : loadouts.length === 0 ? (
        <EmptyState title={stepCopy.emptyTitle} description={stepCopy.emptyDescription} />
      ) : (
        <div className="space-y-8">
          <GuidedEquipmentPhaseProgress
            value={equipmentPhase}
            armorMode={armorMode}
            completion={phaseCompletion}
            onChange={handlePhaseChange}
          />

          {!l2Open ? (
            <GuidedLoadoutKitPresets
              loadouts={loadouts}
              resolvedByLoadoutId={resolvedByLoadoutId}
              selectedLoadoutId={draft.loadoutId}
              onSelect={selectLoadout}
            />
          ) : null}

          <GuidedEquipmentPhaseLayout
            phase={equipmentPhase}
            currencyRemaining={equipmentPhase === 'gear' ? currencyRemaining : undefined}
            expandLabel={phaseCopy.seeMoreLabel}
            onExpand={() => setL2Open(true)}
          >
            {!l2Open ? (
              <GuidedEquipmentPhaseSelection
                phase={equipmentPhase}
                draft={draft}
                officialItems={officialItems}
                codexEquipment={codexEquipment}
              />
            ) : null}
            <GuidedEquipmentL1Phase
              phase={equipmentPhase}
              draft={draft}
              pool={itemPool}
              officialItems={officialItems}
              codexEquipment={codexEquipment}
              armorOptional={armorMode === 'optional'}
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
            loadouts={loadouts}
            pathLevel1={pathData?.level1}
            officialItems={officialItems}
            codexEquipment={codexEquipment}
            currencyRemaining={currencyRemaining}
            onClose={() => setL2Open(false)}
            onDraftChange={updateDraft}
          />
        </div>
      )}
    </GuidedStepLayout>
  );
}
