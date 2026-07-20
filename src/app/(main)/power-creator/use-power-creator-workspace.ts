/**
 * Power Creator — workspace state hook (TASK-381 Phase 3)
 * ========================================================
 * Owns form state, draft cache, cost derivation, part actions, and save/load
 * for PowerCreatorWorkspace. Presentational sections stay in power-creator-editor.
 */

'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  useCreatorSave,
  type PowerPart,
} from '@/hooks';
import {
  calculatePowerCosts,
  computePowerActionTypeFromSelection,
  buildMechanicParts,
  deriveRange,
  deriveArea,
  deriveDuration,
  formatPowerRangeFromSteps,
  getAreaPartForDisplay,
  type PowerPartPayload,
  type AreaConfig,
  type DurationConfig,
} from '@/lib/calculators';
import { PART_IDS, findByIdOrName } from '@/lib/id-constants';
import { dedupeSavedParts } from '@/lib/library/dedupe-saved-parts';
import { formatDurationFromTypeAndValue } from '@/lib/utils/duration';
import type {
  SelectedPart,
  AdvancedPart,
  DamageConfig,
  RangeConfig,
} from './power-creator-types';
import { POWER_CREATOR_CACHE_KEY, EXCLUDED_PARTS } from './power-creator-constants';
import {
  powerLibraryRecordToFormState,
  type PowerCreatorCache,
  type PowerCreatorFormState,
  type PowerLibraryRecord,
} from './power-creator-bootstrap';
import { writeCreatorCache, clearCreatorCache } from '@/lib/game/creator-cache';
import { attackModeColumnLabel, type AttackMode } from '@/lib/attack-mode';

export type UsePowerCreatorWorkspaceArgs = {
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

  // ?edit= mode: clear any stale draft once on mount (parity with the old hydrate
  // effect, which removed the cache after loading the edit target).
  useEffect(() => {
    if (editPowerId) clearCreatorCache(POWER_CREATOR_CACHE_KEY);
  }, [editPowerId]);

  // Auto-save draft to localStorage (skip when editing an existing library row via ?edit=)
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

  // Filter out mechanic parts for the "Add Part" dropdown
  // Mechanic parts are handled by basic mechanics UI (action, damage, range, area, duration)
  // or the Power Mechanics section
  const nonMechanicParts = useMemo(
    () => powerParts.filter((p: PowerPart) => !p.mechanic),
    [powerParts]
  );

  // Mechanic parts for Power Mechanics section (same parts as old Advanced Mechanics, excluded from hardcoded UI)
  const mechanicPartsForList = useMemo(
    () => powerParts.filter((p: PowerPart) => p.mechanic && !EXCLUDED_PARTS.has(p.name)),
    [powerParts]
  );

  // Build mechanic parts using unified builder (powerDamage array supports applyDuration per row)
  const mechanicParts = useMemo(
    () => buildMechanicParts({
      creatorType: 'power',
      partsDb: powerParts,
      action: { type: actionType, isReaction },
      powerDamage: damages.map((d) => ({
        type: d.type,
        diceAmount: d.amount,
        dieSize: d.size,
        applyDuration: d.applyDuration ?? false,
      })),
      range: { steps: range.steps },
      area: area.type !== 'none' ? { type: area.type, level: area.level, applyDuration: area.applyDuration ?? false } : undefined,
      duration: duration.type !== 'instant' ? {
        type: duration.type,
        value: duration.value,
        applyDuration: duration.applyDuration ?? false,
        focus: duration.focus,
        noHarm: duration.noHarm,
        endsOnActivation: duration.endsOnActivation,
        sustain: duration.sustain,
      } : undefined,
    }),
    [actionType, isReaction, damages, range, area, duration, powerParts]
  );

  // Weapon Attack adds a flat-cost "Add Weapon to Power" part (no options, no
  // weapon id). No Weapon/Attack (default) and Unarmed add nothing on powers.
  const addWeaponToPowerPart = useMemo(() => {
    if (attackMode !== 'weapon') return null;
    const part = findByIdOrName(powerParts, {
      id: PART_IDS.ADD_WEAPON_TO_POWER,
      name: 'Add Weapon to Power',
    });
    if (!part) return null;
    return {
      id: part.id,
      name: part.name,
      op_1_lvl: 0,
      op_2_lvl: 0,
      op_3_lvl: 0,
      applyDuration: false,
    };
  }, [attackMode, powerParts]);

  const attackModeLabel = useMemo(() => attackModeColumnLabel(attackMode), [attackMode]);

  // Convert selected parts to payload format for calculator
  const partsPayload: PowerPartPayload[] = useMemo(
    () => [
      // Regular parts
      ...selectedParts.map((sp) => ({
        part: sp.part,
        op_1_lvl: sp.op_1_lvl,
        op_2_lvl: sp.op_2_lvl,
        op_3_lvl: sp.op_3_lvl,
        applyDuration: sp.applyDuration,
      })),
      // Advanced mechanic parts
      ...selectedAdvancedParts.map((ap) => ({
        part: ap.part,
        op_1_lvl: ap.op_1_lvl,
        op_2_lvl: ap.op_2_lvl,
        op_3_lvl: ap.op_3_lvl,
        applyDuration: ap.applyDuration,
      })),
      // Auto-generated mechanic parts from action type / damage selections
      ...mechanicParts,
      ...(addWeaponToPowerPart ? [addWeaponToPowerPart] : []),
    ],
    [selectedParts, selectedAdvancedParts, mechanicParts, addWeaponToPowerPart]
  );

  // Calculate costs
  const costs = useMemo(
    () => calculatePowerCosts(partsPayload, powerParts),
    [partsPayload, powerParts]
  );
  const advancedCalcRows = useMemo(
    () => [
      { label: 'Energy (raw)', value: costs.energyRaw.toFixed(2) },
      { label: 'Energy (final)', value: `ceil(${costs.energyRaw.toFixed(2)}) = ${costs.totalEnergy}` },
      { label: 'Training points (raw)', value: costs.tpRaw.toFixed(2) },
      { label: 'Training points (final)', value: `floor per part → ${costs.totalTP}` },
    ],
    [costs.energyRaw, costs.totalEnergy, costs.totalTP, costs.tpRaw]
  );

  // Derived display values
  const actionTypeDisplay = useMemo(
    () => computePowerActionTypeFromSelection(actionType, isReaction),
    [actionType, isReaction]
  );

  const rangeDisplay = useMemo(() => deriveRange(partsPayload), [partsPayload]);
  const areaDisplay = useMemo(() => deriveArea(partsPayload), [partsPayload]);
  const durationDisplay = useMemo(() => deriveDuration(partsPayload), [partsPayload]);

  // Format range for collapsed summary (from UI state)
  const rangeSummary = useMemo(() => {
    if (range.steps === 0) return '1 Space / Melee';
    const formatted = formatPowerRangeFromSteps(range.steps);
    return formatted.replace(/\bspaces\b/, 'Spaces').replace(/\bspace\b/, 'Space');
  }, [range.steps]);

  // Area part for description display when area is selected
  const areaPartInfo = useMemo(
    () => (area.type !== 'none' ? getAreaPartForDisplay(area.type, area.level, powerParts) : null),
    [area.type, area.level, powerParts]
  );

  // Format damage for collapsed summary
  const damageSummary = useMemo(() => {
    const valid = damages.filter((d) => d.type !== 'none' && d.amount > 0);
    if (valid.length === 0) return 'No damage';
    return valid.map((d) => `${d.amount}d${d.size} ${d.type}`).join(', ');
  }, [damages]);

  // Power parts summary (first few part names + EN/TP)
  const powerPartsSummary = useMemo(() => {
    if (selectedParts.length === 0) return 'No parts';
    const names = selectedParts.slice(0, 5).map((sp) => sp.part.name);
    const more = selectedParts.length > 5 ? ` +${selectedParts.length - 5} more` : '';
    return `${names.join(', ')}${more}`;
  }, [selectedParts]);

  // Power mechanics summary
  const powerMechanicsSummary = useMemo(() => {
    if (selectedAdvancedParts.length === 0) return 'No mechanics';
    const names = selectedAdvancedParts.slice(0, 5).map((ap) => ap.part.name);
    const more = selectedAdvancedParts.length > 5 ? ` +${selectedAdvancedParts.length - 5} more` : '';
    return `${names.join(', ')}${more}`;
  }, [selectedAdvancedParts]);

  // Duration summary for collapsed state
  const durationSummary = useMemo(() => {
    if (duration.type === 'instant') return 'Instant';
    if (duration.type === 'permanent') return 'Permanent';
    return formatDurationFromTypeAndValue(duration.type, duration.value);
  }, [duration.type, duration.value]);

  // Section costs for display (EN/TP contribution per section)
  const sectionCosts = useMemo(() => {
    const toPayload = (mp: { id: number | string; name: string; op_1_lvl: number; op_2_lvl: number; op_3_lvl: number }) =>
      ({ id: mp.id, name: mp.name, op_1_lvl: mp.op_1_lvl, op_2_lvl: mp.op_2_lvl, op_3_lvl: mp.op_3_lvl });
    const rangeParts = mechanicParts.filter((mp) => mp.name === 'Power Range').map(toPayload);
    const areaNames = ['Sphere of Effect', 'Cylinder of Effect', 'Cone of Effect', 'Line of Effect', 'Trail of Effect'];
    const areaParts = mechanicParts.filter((mp) => areaNames.includes(mp.name)).map(toPayload);
    const durationNames = ['Duration (Round)', 'Duration (Minute)', 'Duration (Hour)', 'Duration (Days)', 'Duration (Permanent)', 'Focus for Duration', 'No Harm or Adaptation for Duration', 'Duration Ends On Activation', 'Sustain for Duration'];
    const durationParts = mechanicParts.filter((mp) => durationNames.includes(mp.name)).map(toPayload);
    const damageNames = ['Magic Damage', 'Light Damage', 'Elemental Damage', 'Poison or Necrotic Damage', 'Sonic Damage', 'Spiritual Damage', 'Psychic Damage', 'Physical Damage', 'Power Split Damage Dice'];
    const damageParts = mechanicParts.filter((mp) => damageNames.includes(mp.name)).map(toPayload);
    const actionNames = ['Power Reaction', 'Power Quick or Free Action', 'Power Long Action'];
    const actionParts = mechanicParts.filter((mp) => actionNames.includes(mp.name)).map(toPayload);
    const partsPayload = selectedParts.map((sp) => ({
      part: sp.part,
      op_1_lvl: sp.op_1_lvl,
      op_2_lvl: sp.op_2_lvl,
      op_3_lvl: sp.op_3_lvl,
    }));
    const mechanicPayload = selectedAdvancedParts.map((ap) => ({
      part: ap.part,
      op_1_lvl: ap.op_1_lvl,
      op_2_lvl: ap.op_2_lvl,
      op_3_lvl: ap.op_3_lvl,
    }));
    return {
      action: calculatePowerCosts(actionParts, powerParts),
      weapon: calculatePowerCosts(addWeaponToPowerPart ? [addWeaponToPowerPart] : [], powerParts),
      range: calculatePowerCosts(rangeParts, powerParts),
      area: calculatePowerCosts(areaParts, powerParts),
      duration: calculatePowerCosts(durationParts, powerParts),
      damage: calculatePowerCosts(damageParts, powerParts),
      powerParts: calculatePowerCosts(partsPayload, powerParts),
      powerMechanics: calculatePowerCosts(mechanicPayload, powerParts),
    };
  }, [mechanicParts, powerParts, selectedParts, selectedAdvancedParts, addWeaponToPowerPart]);

  // Actions
  const addPart = useCallback(() => {
    if (nonMechanicParts.length === 0) return;
    setSelectedParts((prev) => [
      ...prev,
      {
        part: nonMechanicParts[0],
        op_1_lvl: 0,
        op_2_lvl: 0,
        op_3_lvl: 0,
        applyDuration: false,
        selectedCategory: 'any',
      },
    ]);
  }, [nonMechanicParts]);

  const removePart = useCallback((index: number) => {
    setSelectedParts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updatePart = useCallback((index: number, updates: Partial<SelectedPart>) => {
    setSelectedParts((prev) =>
      prev.map((sp, i) => (i === index ? { ...sp, ...updates } : sp))
    );
  }, []);

  // Advanced part actions
  const addMechanicPart = useCallback(() => {
    if (mechanicPartsForList.length === 0) return;
    const first = mechanicPartsForList[0];
    if (selectedAdvancedParts.some((ap) => ap.part.id === first.id)) return;
    setSelectedAdvancedParts((prev) => [
      ...prev,
      {
        part: first,
        op_1_lvl: 0,
        op_2_lvl: 0,
        op_3_lvl: 0,
        applyDuration: false,
        selectedCategory: 'any',
      },
    ]);
  }, [mechanicPartsForList, selectedAdvancedParts]);

  const removeAdvancedPart = useCallback((index: number) => {
    setSelectedAdvancedParts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateAdvancedPart = useCallback((index: number, updates: Partial<AdvancedPart>) => {
    setSelectedAdvancedParts((prev) =>
      prev.map((ap, i) => (i === index ? { ...ap, ...updates } : ap))
    );
  }, []);

  const getPayload = useCallback(() => {
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
      ...mechanicParts.map((mp) => ({
        id: mp.id,
        name: mp.name,
        op_1_lvl: mp.op_1_lvl,
        op_2_lvl: mp.op_2_lvl,
        op_3_lvl: mp.op_3_lvl,
        applyDuration: mp.applyDuration,
        isMechanic: true,
      })),
      ...(addWeaponToPowerPart
        ? [{
            id: addWeaponToPowerPart.id,
            name: addWeaponToPowerPart.name,
            op_1_lvl: addWeaponToPowerPart.op_1_lvl,
            op_2_lvl: addWeaponToPowerPart.op_2_lvl,
            op_3_lvl: addWeaponToPowerPart.op_3_lvl,
            applyDuration: false,
            isMechanic: true,
          }]
        : []),
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
  }, [name, description, selectedParts, selectedAdvancedParts, mechanicParts, addWeaponToPowerPart, damages, actionType, isReaction, range, area, duration, attackMode, imageId, imageUrl]);

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

  const handleLoadPower = useCallback((power: PowerLibraryRecord) => {
    applyFormState(powerLibraryRecordToFormState(power, powerParts));
    save.setSaveMessage({ type: 'success', text: 'Power loaded successfully!' });
    setTimeout(() => save.setSaveMessage(null), 2000);
  }, [powerParts, applyFormState, save]);


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
