/**
 * Empowered Technique Creator — workspace state hook (TASK-601, TASK-610)
 * =======================================================================
 * Owns form state, draft cache, save/load. Cost derivation and part actions
 * are co-located modules; presentational sections stay in the editor facade.
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useCreatorSave, type PowerPart, type TechniquePart } from '@/hooks';
import {
  useCreatorDraftDirty,
  useDiscardableCreatorDraft,
} from '@/hooks/use-creator-unsaved-guard';
import type { CreatorSaveTarget } from '@/lib/library/catalog-listing';
import { dedupeSavedParts } from '@/lib/game/dedupe-saved-parts';
import type { AreaConfig, DurationConfig } from '@/lib/calculators';
import { EXCLUDED_PARTS } from '@/app/(main)/power-creator/power-creator-constants';
import { attackModeColumnLabel, type AttackMode } from '@/lib/attack-mode';
import {
  empoweredLibraryRecordToFormState,
  EMPOWERED_TECHNIQUE_CREATOR_CACHE_KEY as CACHE_KEY,
  type EmpoweredTechniqueCache,
  type EmpoweredTechniqueFormState,
  type EmpoweredDamageConfig as DamageConfig,
  type EmpoweredRangeConfig as RangeConfig,
  type SelectedPowerPart,
  type SelectedTechniquePart,
} from './empowered-technique-bootstrap';
import { persistCreatorDraft, clearCreatorCache } from '@/lib/game/creator-cache';
import { useEmpoweredTechniqueCostDerivation } from './empowered-technique-cost-derivation';
import { useEmpoweredTechniquePartActions } from './empowered-technique-part-actions';

type UseEmpoweredTechniqueCreatorWorkspaceArgs = {
  initialFormState: EmpoweredTechniqueFormState;
  editId: string | null;
  powerParts: PowerPart[];
  techniqueParts: TechniquePart[];
  powerPartsError?: Error | null | undefined;
  techniquePartsError?: Error | null | undefined;
  initialSaveTarget?: CreatorSaveTarget | undefined;
};

export function useEmpoweredTechniqueCreatorWorkspace({
  initialFormState,
  editId,
  powerParts,
  techniqueParts,
  powerPartsError = null,
  techniquePartsError = null,
  initialSaveTarget,
}: UseEmpoweredTechniqueCreatorWorkspaceArgs) {
  const [name, setName] = useState(initialFormState.name);
  const [description, setDescription] = useState(initialFormState.description);
  const [actionType, setActionType] = useState(initialFormState.actionType);
  const [isReaction, setIsReaction] = useState(initialFormState.isReaction);
  const [powerDamages, setPowerDamages] = useState<DamageConfig[]>(initialFormState.powerDamages);
  const [techniqueDamage, setTechniqueDamage] = useState<{ amount: number; size: number }>(
    initialFormState.techniqueDamage,
  );
  const [range, setRange] = useState<RangeConfig>(initialFormState.range);
  const [area, setArea] = useState<AreaConfig>(initialFormState.area);
  const [duration, setDuration] = useState<DurationConfig>(initialFormState.duration);
  const [attackMode, setAttackMode] = useState<AttackMode>(initialFormState.attackMode);
  const [selectedPowerParts, setSelectedPowerParts] = useState<SelectedPowerPart[]>(
    initialFormState.selectedPowerParts,
  );
  const [selectedPowerAdvancedParts, setSelectedPowerAdvancedParts] = useState<SelectedPowerPart[]>(
    initialFormState.selectedPowerAdvancedParts,
  );
  const [selectedTechniqueParts, setSelectedTechniqueParts] = useState<SelectedTechniquePart[]>(
    initialFormState.selectedTechniqueParts,
  );
  const [imageId, setImageId] = useState<string | null>(initialFormState.imageId);
  const [imageUrl, setImageUrl] = useState<string | null>(initialFormState.imageUrl);
  const [targetedDefenses, setTargetedDefenses] = useState<string[]>(
    initialFormState.targetedDefenses,
  );
  const { discardLocalDraft, isLocalDraftDiscarded } = useDiscardableCreatorDraft(CACHE_KEY);

  // ?edit= mode: clear any stale draft once on mount (parity with the old hydrate
  // effect, which removed the cache after loading the edit target).
  useEffect(() => {
    if (editId) clearCreatorCache(CACHE_KEY);
  }, [editId]);

  const nonMechanicPowerParts = useMemo(
    () => powerParts.filter((part: PowerPart) => !part.mechanic),
    [powerParts],
  );
  const nonMechanicTechniqueParts = useMemo(
    () => techniqueParts.filter((part: TechniquePart) => !part.mechanic),
    [techniqueParts],
  );
  const powerMechanicsForList = useMemo(
    () => powerParts.filter((part: PowerPart) => part.mechanic && !EXCLUDED_PARTS.has(part.name)),
    [powerParts],
  );

  const {
    powerMechanicParts,
    techniqueDamageMechanicParts,
    attackModePowerPart,
    attackModeTechniquePart,
    costs,
    advancedCalcGroups,
    sectionCosts,
    actionDisplay,
    rangeDisplay,
    areaDisplay,
    durationDisplay,
    powerDamageSummary,
    techniqueDamageSummary,
  } = useEmpoweredTechniqueCostDerivation({
    actionType,
    isReaction,
    powerDamages,
    techniqueDamage,
    range,
    area,
    duration,
    attackMode,
    selectedPowerParts,
    selectedPowerAdvancedParts,
    selectedTechniqueParts,
    powerParts,
    techniqueParts,
  });

  const {
    addPowerPart,
    addPowerMechanicPart,
    addTechniquePart,
    updatePowerPart,
    updatePowerAdvancedPart,
    updateTechniquePart,
    handleDurationTypeChange,
  } = useEmpoweredTechniquePartActions({
    nonMechanicPowerParts,
    powerMechanicsForList,
    nonMechanicTechniqueParts,
    setSelectedPowerParts,
    setSelectedPowerAdvancedParts,
    setSelectedTechniqueParts,
    setDuration,
  });

  const resetState = useCallback(() => {
    setName('');
    setDescription('');
    setActionType('basic');
    setIsReaction(false);
    setPowerDamages([{ amount: 0, size: 6, type: 'none', applyDuration: false }]);
    setTechniqueDamage({ amount: 0, size: 6 });
    setRange({ steps: 0 });
    setArea({ type: 'none', level: 1, applyDuration: false });
    setDuration({
      type: 'instant',
      value: 1,
      applyDuration: false,
      focus: false,
      noHarm: false,
      endsOnActivation: false,
      sustain: 0,
    });
    setAttackMode('none');
    setSelectedPowerParts([]);
    setSelectedPowerAdvancedParts([]);
    setSelectedTechniqueParts([]);
    setImageId(null);
    setImageUrl(null);
    setTargetedDefenses([]);
    clearCreatorCache(CACHE_KEY);
  }, []);

  const applyFormState = useCallback((next: EmpoweredTechniqueFormState) => {
    setName(next.name);
    setDescription(next.description);
    setActionType(next.actionType);
    setIsReaction(next.isReaction);
    setPowerDamages(next.powerDamages);
    setTechniqueDamage(next.techniqueDamage);
    setRange(next.range);
    setArea(next.area);
    setDuration(next.duration);
    setAttackMode(next.attackMode);
    setSelectedPowerParts(next.selectedPowerParts);
    setSelectedPowerAdvancedParts(next.selectedPowerAdvancedParts);
    setSelectedTechniqueParts(next.selectedTechniqueParts);
    setImageId(next.imageId);
    setImageUrl(next.imageUrl);
    setTargetedDefenses(next.targetedDefenses);
  }, []);

  const suggestionSelectedParts = useMemo(
    () => [
      ...selectedPowerParts.map((row) => row.part),
      ...selectedPowerAdvancedParts.map((row) => row.part),
      ...selectedTechniqueParts.map((row) => row.part),
    ],
    [selectedPowerParts, selectedPowerAdvancedParts, selectedTechniqueParts],
  );

  const getPayload = useCallback(() => {
    const powerPartsToSave = dedupeSavedParts(
      selectedPowerParts.map((selected) => ({
        id: Number(selected.part.id),
        name: selected.part.name,
        op_1_lvl: selected.op_1_lvl,
        op_2_lvl: selected.op_2_lvl,
        op_3_lvl: selected.op_3_lvl,
        applyDuration: selected.applyDuration,
      })),
    );
    const powerAdvancedToSave = dedupeSavedParts(
      selectedPowerAdvancedParts.map((selected) => ({
        id: Number(selected.part.id),
        name: selected.part.name,
        op_1_lvl: selected.op_1_lvl,
        op_2_lvl: selected.op_2_lvl,
        op_3_lvl: selected.op_3_lvl,
        applyDuration: selected.applyDuration,
        isAdvanced: true,
      })),
    );
    const techniquePartsToSave = dedupeSavedParts(
      selectedTechniqueParts.map((selected) => ({
        id: Number(selected.part.id),
        name: selected.part.name,
        op_1_lvl: selected.op_1_lvl,
        op_2_lvl: selected.op_2_lvl,
        op_3_lvl: selected.op_3_lvl,
      })),
    );

    return {
      name: name.trim(),
      data: {
        name: name.trim(),
        description: description.trim(),
        empoweredTechnique: true,
        actionType,
        isReaction,
        attackMode,
        ...(targetedDefenses.length > 0 ? { targetedDefenses } : {}),
        ...(imageId ? { imageId } : {}),
        ...(imageUrl ? { imageUrl } : {}),
        power: {
          parts: powerPartsToSave,
          mechanics: powerAdvancedToSave,
          autoMechanics: dedupeSavedParts(powerMechanicParts),
          damage: powerDamages.filter((damage) => damage.type !== 'none' && damage.amount > 0),
          range,
          area,
          duration,
          addWeaponPowerPart: attackModePowerPart,
        },
        technique: {
          parts: techniquePartsToSave,
          additionalDamage:
            techniqueDamage.amount > 0
              ? [{ amount: techniqueDamage.amount, size: techniqueDamage.size }]
              : [],
          autoMechanics: dedupeSavedParts([
            ...techniqueDamageMechanicParts,
            ...(attackModeTechniquePart ? [attackModeTechniquePart] : []),
          ]),
        },
        totals: {
          energy: costs.totalEnergy,
          trainingPoints: costs.totalTP,
        },
      },
    };
  }, [
    actionType,
    attackModePowerPart,
    attackModeTechniquePart,
    area,
    attackMode,
    targetedDefenses,
    costs.totalEnergy,
    costs.totalTP,
    description,
    duration,
    isReaction,
    imageId,
    imageUrl,
    name,
    powerDamages,
    powerMechanicParts,
    range,
    selectedPowerAdvancedParts,
    selectedPowerParts,
    selectedTechniqueParts,
    techniqueDamage,
    techniqueDamageMechanicParts,
  ]);
  const draftSnapshot = JSON.stringify(getPayload());
  const { isDirty: unsavedDirty, acceptDraft } = useCreatorDraftDirty(draftSnapshot);

  const save = useCreatorSave({
    type: 'empowered-techniques',
    getPayload,
    requirePublishConfirm: true,
    publishConfirmTitle: 'Publish to Realms Library',
    publishConfirmDescription: (itemName, { existingInPublic }) =>
      existingInPublic
        ? `Are you sure you want to override "${itemName}" (empowered technique)? The existing public empowered technique with this name will be replaced.`
        : `Are you sure you wish to publish this empowered technique "${itemName}" to the Realms Library?`,
    successMessage: 'Empowered technique saved successfully!',
    publicSuccessMessage: 'Empowered technique saved to Realms Library!',
    initialSaveTarget,
    editingId: editId,
    onSaveCommitted: acceptDraft,
    onSaveSuccess: () => {
      resetState();
      acceptDraft();
    },
  });

  const handleLoadEmpoweredTechnique = useCallback(
    (doc: unknown) => {
      const next = empoweredLibraryRecordToFormState(doc, powerParts, techniqueParts);
      if (!next) return;
      applyFormState(next);
      save.applyLoadedLibraryItem(doc);
      acceptDraft();
      save.setSaveMessage({ type: 'success', text: 'Empowered technique loaded successfully!' });
      setTimeout(() => save.setSaveMessage(null), 2000);
    },
    [powerParts, techniqueParts, applyFormState, save, acceptDraft],
  );

  // Auto-save draft to localStorage (skip when editing an existing library row via ?edit=)
  useEffect(() => {
    if (editId) return;
    const cache: EmpoweredTechniqueCache = {
      name,
      description,
      actionType,
      isReaction,
      powerDamages,
      techniqueDamage,
      attackMode,
      range,
      area,
      duration,
      selectedPowerParts: selectedPowerParts.map((row) => ({
        partId: row.part.id,
        op_1_lvl: row.op_1_lvl,
        op_2_lvl: row.op_2_lvl,
        op_3_lvl: row.op_3_lvl,
        applyDuration: row.applyDuration,
        selectedCategory: row.selectedCategory,
      })),
      selectedPowerAdvancedParts: selectedPowerAdvancedParts.map((row) => ({
        partId: row.part.id,
        op_1_lvl: row.op_1_lvl,
        op_2_lvl: row.op_2_lvl,
        op_3_lvl: row.op_3_lvl,
        applyDuration: row.applyDuration,
        selectedCategory: row.selectedCategory,
      })),
      selectedTechniqueParts: selectedTechniqueParts.map((row) => ({
        partId: row.part.id,
        op_1_lvl: row.op_1_lvl,
        op_2_lvl: row.op_2_lvl,
        op_3_lvl: row.op_3_lvl,
        selectedCategory: row.selectedCategory,
      })),
      imageId,
      imageUrl,
      targetedDefenses,
      timestamp: Date.now(),
    };
    persistCreatorDraft(CACHE_KEY, cache, isLocalDraftDiscarded());
  }, [
    actionType,
    area,
    description,
    duration,
    editId,
    isReaction,
    imageId,
    imageUrl,
    name,
    powerDamages,
    range,
    selectedPowerAdvancedParts,
    selectedPowerParts,
    selectedTechniqueParts,
    techniqueDamage,
    attackMode,
    targetedDefenses,
    isLocalDraftDiscarded,
  ]);

  const loadError =
    powerPartsError && techniquePartsError
      ? new Error(
          `Failed to load power parts (${powerPartsError.message}) and technique parts (${techniquePartsError.message}).`,
        )
      : powerPartsError
        ? new Error(`Failed to load power parts: ${powerPartsError.message}`)
        : techniquePartsError
          ? new Error(`Failed to load technique parts: ${techniquePartsError.message}`)
          : null;

  const handleReset = useCallback(() => {
    resetState();
    save.forgetLoadedLibraryItem();
    acceptDraft();
  }, [acceptDraft, resetState, save]);

  return {
    name,
    setName,
    description,
    setDescription,
    actionType,
    setActionType,
    isReaction,
    setIsReaction,
    powerDamages,
    setPowerDamages,
    techniqueDamage,
    setTechniqueDamage,
    range,
    setRange,
    area,
    setArea,
    duration,
    setDuration,
    attackMode,
    setAttackMode,
    selectedPowerParts,
    selectedPowerAdvancedParts,
    selectedTechniqueParts,
    imageId,
    imageUrl,
    setImageId,
    setImageUrl,
    targetedDefenses,
    setTargetedDefenses,
    suggestionSelectedParts,
    powerParts,
    techniqueParts,
    nonMechanicPowerParts,
    nonMechanicTechniqueParts,
    powerMechanicsForList,
    costs,
    advancedCalcGroups,
    sectionCosts,
    actionDisplay,
    rangeDisplay,
    areaDisplay,
    durationDisplay,
    powerDamageSummary,
    techniqueDamageSummary,
    loadError,
    resetState: handleReset,
    handleLoadEmpoweredTechnique,
    addPowerPart,
    addPowerMechanicPart,
    addTechniquePart,
    updatePowerPart,
    updatePowerAdvancedPart,
    updateTechniquePart,
    handleDurationTypeChange,
    setSelectedPowerParts,
    setSelectedPowerAdvancedParts,
    setSelectedTechniqueParts,
    save,
    unsavedDirty,
    discardLocalDraft,
    attackModeLabel: attackModeColumnLabel(attackMode),
  };
}
