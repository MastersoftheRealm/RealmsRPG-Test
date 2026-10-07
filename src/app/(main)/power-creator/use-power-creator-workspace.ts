/**
 * Power Creator — workspace state hook (TASK-381 Phase 3, TASK-616)
 * =================================================================
 * Owns form state, draft cache, save/load. Cost derivation and part actions
 * are co-located modules; presentational sections stay in the editor facade.
 * Built-in variants (ADR-0029): the field state below is the open tab; the other
 * tabs live in `usePowerCreatorComposition`.
 */

'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useCreatorSave, type PowerPart } from '@/hooks';
import type { CreatorSaveTarget } from '@/lib/library/catalog-listing';
import {
  useCreatorEditDraftDecision,
  useCreatorEditMissNotice,
} from '@/lib/library/use-creator-edit-draft';
import {
  isPowerCompositionMechanicPart,
  isRandomizeDieComplete,
  powerSpecHasContent,
  resolvePowerComposition,
  type AreaConfig,
  type DurationConfig,
  type PowerDocument,
} from '@/lib/calculators';
import type { AttackMode } from '@/lib/attack-mode';
import type { SelectedPart, AdvancedPart, DamageConfig, RangeConfig } from './power-creator-types';
import { POWER_CREATOR_CACHE_KEY, EXCLUDED_PARTS } from './power-creator-constants';
import {
  emptyPowerCreatorFormState,
  powerLibraryRecordToFormState,
  type PowerCreatorCache,
  type PowerCreatorFormState,
  type PowerLibraryRecord,
} from './power-creator-bootstrap';
import { writeCreatorCache, clearCreatorCache } from '@/lib/game/creator-cache';
import { usePowerCreatorCostDerivation } from './power-creator-cost-derivation';
import { usePowerCreatorPartActions } from './power-creator-part-actions';
import {
  REVERSE_TAB_ID,
  SHARED_TAB_ID,
  pickTabForm,
  tabFormToOverlay,
  tabFormToSpec,
  topLevelForm,
  type PowerTabForm,
} from './power-creator-composition';
import {
  compositionInitFromSaved,
  usePowerCreatorComposition,
} from './use-power-creator-composition';

type UsePowerCreatorWorkspaceArgs = {
  initialFormState: PowerCreatorFormState;
  editPowerId: string | null;
  /** True only when editPowerId matched a loaded library row. */
  editReplacesDraft: boolean;
  powerParts: PowerPart[];
  initialSaveTarget?: CreatorSaveTarget | undefined;
};

export function usePowerCreatorWorkspace({
  initialFormState,
  editPowerId,
  editReplacesDraft,
  powerParts,
  initialSaveTarget,
}: UsePowerCreatorWorkspaceArgs) {
  const [name, setName] = useState(initialFormState.name);
  const [description, setDescription] = useState(initialFormState.description);
  const [selectedParts, setSelectedParts] = useState<SelectedPart[]>(
    initialFormState.selectedParts,
  );
  const [selectedAdvancedParts, setSelectedAdvancedParts] = useState<AdvancedPart[]>(
    initialFormState.selectedAdvancedParts,
  );
  const [actionType, setActionType] = useState(initialFormState.actionType);
  const [isReaction, setIsReaction] = useState(initialFormState.isReaction);
  const [damages, setDamages] = useState<DamageConfig[]>(initialFormState.damages);
  const [range, setRange] = useState<RangeConfig>(initialFormState.range);
  const [area, setArea] = useState<AreaConfig>(initialFormState.area);
  const [duration, setDuration] = useState<DurationConfig>(initialFormState.duration);
  const [attackMode, setAttackMode] = useState<AttackMode>(initialFormState.attackMode);
  const [imageId, setImageId] = useState<string | null>(initialFormState.imageId);
  const [imageUrl, setImageUrl] = useState<string | null>(initialFormState.imageUrl);
  const [targetedDefenses, setTargetedDefenses] = useState<string[]>(
    initialFormState.targetedDefenses,
  );

  const liveForm: PowerTabForm = useMemo(
    () => ({
      selectedParts,
      selectedAdvancedParts,
      actionType,
      isReaction,
      damages,
      range,
      area,
      duration,
      attackMode,
    }),
    [
      selectedParts,
      selectedAdvancedParts,
      actionType,
      isReaction,
      damages,
      range,
      area,
      duration,
      attackMode,
    ],
  );

  const applyTabForm = useCallback((form: PowerTabForm) => {
    setSelectedParts(form.selectedParts);
    setSelectedAdvancedParts(form.selectedAdvancedParts);
    setActionType(form.actionType);
    setIsReaction(form.isReaction);
    setDamages(form.damages);
    setRange(form.range);
    setArea(form.area);
    setDuration(form.duration);
    setAttackMode(form.attackMode);
  }, []);

  const [compositionInit] = useState(() =>
    compositionInitFromSaved(
      initialFormState.composition,
      pickTabForm(initialFormState),
      powerParts,
    ),
  );
  const variants = usePowerCreatorComposition({
    init: compositionInit,
    liveForm,
    applyTabForm,
  });
  const composition = variants.composition;
  const topForm = composition ? topLevelForm(variants.collected) : liveForm;

  const { discardDraft } = useCreatorEditDraftDecision(
    true,
    editPowerId,
    editReplacesDraft,
    POWER_CREATOR_CACHE_KEY,
  );

  useEffect(() => {
    if (discardDraft) return;

    const cache: PowerCreatorCache = {
      name,
      description,
      selectedParts: topForm.selectedParts.map((sp) => ({
        partId: sp.part.id,
        op_1_lvl: sp.op_1_lvl,
        op_2_lvl: sp.op_2_lvl,
        op_3_lvl: sp.op_3_lvl,
        applyDuration: sp.applyDuration,
        selectedCategory: sp.selectedCategory,
      })),
      selectedAdvancedParts: topForm.selectedAdvancedParts.map((ap) => ({
        partId: ap.part.id,
        op_1_lvl: ap.op_1_lvl,
        op_2_lvl: ap.op_2_lvl,
        op_3_lvl: ap.op_3_lvl,
        applyDuration: ap.applyDuration,
      })),
      actionType: topForm.actionType,
      isReaction: topForm.isReaction,
      damage: topForm.damages,
      range: topForm.range,
      area: topForm.area,
      duration: topForm.duration,
      attackMode: topForm.attackMode,
      imageId,
      imageUrl,
      targetedDefenses,
      ...(composition ? { composition } : {}),
      timestamp: Date.now(),
    };
    writeCreatorCache(POWER_CREATOR_CACHE_KEY, cache);
  }, [discardDraft, name, description, topForm, composition, imageId, imageUrl, targetedDefenses]);

  const nonMechanicParts = useMemo(
    () => powerParts.filter((p: PowerPart) => !p.mechanic),
    [powerParts],
  );

  // Choice / Split / Randomize / Reverse Effects are built-in variants now (ADR-0029).
  const mechanicPartsForList = useMemo(
    () =>
      powerParts.filter(
        (p: PowerPart) =>
          p.mechanic && !EXCLUDED_PARTS.has(p.name) && !isPowerCompositionMechanicPart(p),
      ),
    [powerParts],
  );

  const {
    costs,
    advancedCalcGroups,
    actionTypeDisplay,
    attackModeLabel,
    rangeDisplay,
    areaDisplay,
    durationDisplay,
    rangeSummary,
    areaPartInfo,
    damageSummary,
    powerPartsSummary,
    powerMechanicsSummary,
    durationSummary,
    sectionCosts,
  } = usePowerCreatorCostDerivation({
    actionType,
    isReaction,
    damages,
    range,
    area,
    duration,
    attackMode,
    selectedParts,
    selectedAdvancedParts,
    powerParts,
  });

  const {
    addPart,
    removePart,
    updatePart,
    addMechanicPart,
    removeAdvancedPart,
    updateAdvancedPart,
  } = usePowerCreatorPartActions({
    nonMechanicParts,
    mechanicPartsForList,
    selectedAdvancedParts,
    setSelectedParts,
    setSelectedAdvancedParts,
  });

  const suggestionSelectedParts = useMemo(
    () => [...selectedParts.map((sp) => sp.part), ...selectedAdvancedParts.map((ap) => ap.part)],
    [selectedParts, selectedAdvancedParts],
  );

  const powerData = useMemo(
    () => ({
      name: name.trim(),
      description: description.trim(),
      // User + advanced parts only; auto mechanics are derived from action/damage/range/area/duration/attackMode on load.
      ...tabFormToSpec(topForm),
      ...(targetedDefenses.length > 0 ? { targetedDefenses } : {}),
      ...(imageId ? { imageId } : {}),
      ...(imageUrl ? { imageUrl } : {}),
      ...(composition ? { composition } : {}),
    }),
    [name, description, topForm, targetedDefenses, imageId, imageUrl, composition],
  );

  const getPayload = useCallback(() => ({ name: name.trim(), data: powerData }), [name, powerData]);

  /** Composed totals for the summary (open tab drives which variant the stat rows follow). */
  const composedSummary = useMemo(() => {
    if (!composition) return null;
    const res = resolvePowerComposition(powerData as PowerDocument, powerParts, {
      selectedVariantId: variants.activeVariant?.id,
    });
    if (!res) return null;
    const tab =
      variants.activeTabId === REVERSE_TAB_ID
        ? res.reverse?.display
        : variants.activeTabId === SHARED_TAB_ID
          ? res.shared?.display
          : res.variants.find((v) => v.id === variants.activeTabId)?.display;
    return { res, tabDisplay: tab ?? null };
  }, [composition, powerData, powerParts, variants.activeVariant, variants.activeTabId]);

  const dieIncomplete = !!composition && !isRandomizeDieComplete(composition);
  const reverseIncomplete =
    variants.reverseEnabled && !powerSpecHasContent(tabFormToOverlay(variants.collected.reverse));

  const resetFields = useCallback(() => {
    const empty = emptyPowerCreatorFormState();
    setName(empty.name);
    setDescription(empty.description);
    applyTabForm(pickTabForm(empty));
    setImageId(null);
    setImageUrl(null);
    setTargetedDefenses([]);
    variants.reset();
  }, [applyTabForm, variants]);

  const save = useCreatorSave({
    type: 'powers',
    getPayload,
    requirePublishConfirm: true,
    publishConfirmTitle: 'Publish to Realms Library',
    publishConfirmDescription: (n, { existingInPublic }) =>
      existingInPublic
        ? `Are you sure you want to override "${n}" (power)? The existing public power with this name will be replaced.`
        : `Are you sure you wish to publish this power "${n}" to the Realms Library? All users will be able to see and use it.`,
    successMessage: 'Power saved successfully!',
    publicSuccessMessage: 'Power saved to Realms Library!',
    initialSaveTarget,
    onSaveSuccess: resetFields,
  });

  useCreatorEditMissNotice(Boolean(editPowerId) && !discardDraft, 'power', save.setSaveMessage);

  const handleReset = useCallback(() => {
    resetFields();
    save.setSaveMessage(null);
    clearCreatorCache(POWER_CREATOR_CACHE_KEY);
  }, [resetFields, save]);

  const applyFormState = useCallback(
    (next: PowerCreatorFormState) => {
      setName(next.name);
      setDescription(next.description);
      applyTabForm(pickTabForm(next));
      setImageId(next.imageId);
      setImageUrl(next.imageUrl);
      setTargetedDefenses(next.targetedDefenses);
      variants.loadFromSaved(
        compositionInitFromSaved(next.composition, pickTabForm(next), powerParts),
      );
    },
    [applyTabForm, variants, powerParts],
  );

  const handleLoadPower = useCallback(
    (power: PowerLibraryRecord) => {
      applyFormState(powerLibraryRecordToFormState(power, powerParts));
      save.applyLoadedLibraryItem(power);
      save.setSaveMessage({ type: 'success', text: 'Power loaded successfully!' });
      setTimeout(() => save.setSaveMessage(null), 2000);
    },
    [powerParts, applyFormState, save],
  );

  return {
    name,
    setName,
    description,
    setDescription,
    selectedParts,
    selectedAdvancedParts,
    actionType,
    setActionType,
    isReaction,
    setIsReaction,
    damages,
    setDamages,
    range,
    setRange,
    area,
    setArea,
    duration,
    setDuration,
    attackMode,
    setAttackMode,
    imageId,
    imageUrl,
    setImageId,
    setImageUrl,
    targetedDefenses,
    setTargetedDefenses,
    suggestionSelectedParts,
    powerParts,
    nonMechanicParts,
    mechanicPartsForList,
    costs,
    advancedCalcGroups,
    actionTypeDisplay,
    attackModeLabel,
    rangeDisplay,
    areaDisplay,
    durationDisplay,
    rangeSummary,
    areaPartInfo,
    damageSummary,
    powerPartsSummary,
    powerMechanicsSummary,
    durationSummary,
    sectionCosts,
    addPart,
    removePart,
    updatePart,
    addMechanicPart,
    removeAdvancedPart,
    updateAdvancedPart,
    variants,
    composedSummary,
    dieIncomplete,
    reverseIncomplete,
    save,
    handleReset,
    handleLoadPower,
  };
}
