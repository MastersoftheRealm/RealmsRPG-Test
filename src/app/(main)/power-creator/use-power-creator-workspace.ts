/**
 * Power Creator — workspace state hook (TASK-381 Phase 3, TASK-616)
 * =================================================================
 * Owns form state, draft cache, save/load. Cost derivation and part actions
 * are co-located modules; presentational sections stay in the editor facade.
 */

'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useCreatorSave, type PowerPart } from '@/hooks';
import type { AreaConfig, DurationConfig } from '@/lib/calculators';
import { dedupeSavedParts } from '@/lib/game/dedupe-saved-parts';
import type { AttackMode } from '@/lib/attack-mode';
import type { SelectedPart, AdvancedPart, DamageConfig, RangeConfig } from './power-creator-types';
import { POWER_CREATOR_CACHE_KEY, EXCLUDED_PARTS } from './power-creator-constants';
import {
  powerLibraryRecordToFormState,
  type PowerCreatorCache,
  type PowerCreatorFormState,
  type PowerLibraryRecord,
} from './power-creator-bootstrap';
import { writeCreatorCache, clearCreatorCache } from '@/lib/game/creator-cache';
import { usePowerCreatorCostDerivation } from './power-creator-cost-derivation';
import { usePowerCreatorPartActions } from './power-creator-part-actions';

type UsePowerCreatorWorkspaceArgs = {
  initialFormState: PowerCreatorFormState;
  editPowerId: string | null;
  powerParts: PowerPart[];
};

export function usePowerCreatorWorkspace({
  initialFormState,
  editPowerId,
  powerParts,
}: UsePowerCreatorWorkspaceArgs) {
  const [name, setName] = useState(initialFormState.name);
  const [description, setDescription] = useState(initialFormState.description);
  const [selectedParts, setSelectedParts] = useState<SelectedPart[]>(initialFormState.selectedParts);
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

  useEffect(() => {
    if (editPowerId) clearCreatorCache(POWER_CREATOR_CACHE_KEY);
  }, [editPowerId]);

  useEffect(() => {
    if (editPowerId) return;

    const cache: PowerCreatorCache = {
      name,
      description,
      selectedParts: selectedParts.map((sp) => ({
        partId: sp.part.id,
        op_1_lvl: sp.op_1_lvl,
        op_2_lvl: sp.op_2_lvl,
        op_3_lvl: sp.op_3_lvl,
        applyDuration: sp.applyDuration,
        selectedCategory: sp.selectedCategory,
      })),
      selectedAdvancedParts: selectedAdvancedParts.map((ap) => ({
        partId: ap.part.id,
        op_1_lvl: ap.op_1_lvl,
        op_2_lvl: ap.op_2_lvl,
        op_3_lvl: ap.op_3_lvl,
        applyDuration: ap.applyDuration,
      })),
      actionType,
      isReaction,
      damage: damages,
      range,
      area,
      duration,
      attackMode,
      imageId,
      imageUrl,
      timestamp: Date.now(),
    };
    writeCreatorCache(POWER_CREATOR_CACHE_KEY, cache);
  }, [
    editPowerId,
    name,
    description,
    selectedParts,
    selectedAdvancedParts,
    actionType,
    isReaction,
    damages,
    range,
    area,
    duration,
    attackMode,
    imageId,
    imageUrl,
  ]);

  const nonMechanicParts = useMemo(
    () => powerParts.filter((p: PowerPart) => !p.mechanic),
    [powerParts],
  );

  const mechanicPartsForList = useMemo(
    () => powerParts.filter((p: PowerPart) => p.mechanic && !EXCLUDED_PARTS.has(p.name)),
    [powerParts],
  );

  const {
    costs,
    advancedCalcRows,
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

  const getPayload = useCallback(() => {
    // User + advanced parts only; auto mechanics are derived from action/damage/range/area/duration/attackMode on load.
    const partsToSave = dedupeSavedParts([
      ...selectedParts.map((sp) => ({
        id: Number(sp.part.id),
        name: sp.part.name,
        op_1_lvl: sp.op_1_lvl,
        op_2_lvl: sp.op_2_lvl,
        op_3_lvl: sp.op_3_lvl,
        applyDuration: sp.applyDuration,
      })),
      ...selectedAdvancedParts.map((ap) => ({
        id: Number(ap.part.id),
        name: ap.part.name,
        op_1_lvl: ap.op_1_lvl,
        op_2_lvl: ap.op_2_lvl,
        op_3_lvl: ap.op_3_lvl,
        applyDuration: ap.applyDuration,
        isAdvanced: true,
      })),
    ]);
    const damageToSave = damages
      .filter((d) => d.type !== 'none' && d.amount > 0)
      .map((d) => ({ amount: d.amount, size: d.size, type: d.type, applyDuration: d.applyDuration ?? false }));
    return {
      name: name.trim(),
      data: {
        name: name.trim(),
        description: description.trim(),
        parts: partsToSave,
        damage: damageToSave,
        actionType,
        isReaction,
        range,
        area,
        duration,
        attackMode,
        ...(imageId ? { imageId } : {}),
        ...(imageUrl ? { imageUrl } : {}),
      },
    };
  }, [
    name,
    description,
    selectedParts,
    selectedAdvancedParts,
    damages,
    actionType,
    isReaction,
    range,
    area,
    duration,
    attackMode,
    imageId,
    imageUrl,
  ]);

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
    onSaveSuccess: () => {
      setName('');
      setDescription('');
      setSelectedParts([]);
      setSelectedAdvancedParts([]);
      setActionType('basic');
      setIsReaction(false);
      setDamages([{ amount: 0, size: 6, type: 'none', applyDuration: false }]);
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
      setImageId(null);
      setImageUrl(null);
    },
  });

  const handleReset = useCallback(() => {
    setName('');
    setDescription('');
    setSelectedParts([]);
    setSelectedAdvancedParts([]);
    setActionType('basic');
    setIsReaction(false);
    setDamages([{ amount: 0, size: 6, type: 'none', applyDuration: false }]);
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
    setImageId(null);
    setImageUrl(null);
    save.setSaveMessage(null);
    clearCreatorCache(POWER_CREATOR_CACHE_KEY);
  }, [save]);

  const applyFormState = useCallback((next: PowerCreatorFormState) => {
    setName(next.name);
    setDescription(next.description);
    setSelectedParts(next.selectedParts);
    setSelectedAdvancedParts(next.selectedAdvancedParts);
    setActionType(next.actionType);
    setIsReaction(next.isReaction);
    setDamages(next.damages);
    setRange(next.range);
    setArea(next.area);
    setDuration(next.duration);
    setAttackMode(next.attackMode);
    setImageId(next.imageId);
    setImageUrl(next.imageUrl);
  }, []);

  const handleLoadPower = useCallback(
    (power: PowerLibraryRecord) => {
      applyFormState(powerLibraryRecordToFormState(power, powerParts));
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
    nonMechanicParts,
    mechanicPartsForList,
    costs,
    advancedCalcRows,
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
    save,
    handleReset,
    handleLoadPower,
  };
}
