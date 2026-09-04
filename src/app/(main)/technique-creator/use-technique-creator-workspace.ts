/**
 * Technique Creator — workspace state hook (TASK-601)
 * ===================================================
 * Owns form state, draft cache, cost derivation, part actions, and save/load
 * for TechniqueCreatorWorkspace. Presentational sections stay in the editor.
 */

'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useCreatorSave, type TechniquePart } from '@/hooks';
import {
  calculateTechniqueCosts,
  computeTechniqueActionTypeFromSelection,
  buildMechanicParts,
  formatTechniqueDamage,
  analyzeTechniqueEnergy,
  buildTechniqueAdvancedCalculationGroups,
  TECHNIQUE_CALC_SECTION_BY_NAME,
  type TechniquePartPayload,
} from '@/lib/calculators';
import { attackModeColumnLabel, type AttackMode } from '@/lib/attack-mode';
import { dedupeSavedParts } from '@/lib/game/dedupe-saved-parts';
import {
  techniqueLibraryRecordToFormState,
  TECHNIQUE_CREATOR_CACHE_KEY,
  type TechniqueCreatorCache,
  type TechniqueCreatorFormState,
  type TechniqueLibraryRecord,
  type TechniqueSelectedPart as SelectedPart,
  type TechniqueDamageConfig as DamageConfig,
} from './technique-creator-bootstrap';
import { writeCreatorCache, clearCreatorCache } from '@/lib/game/creator-cache';

function toTechniquePartPayload(part: {
  id: string | number;
  name: string;
  op_1_lvl: number;
  op_2_lvl: number;
  op_3_lvl: number;
}): TechniquePartPayload {
  return {
    id: Number(part.id),
    name: part.name,
    op_1_lvl: part.op_1_lvl,
    op_2_lvl: part.op_2_lvl,
    op_3_lvl: part.op_3_lvl,
  };
}

type UseTechniqueCreatorWorkspaceArgs = {
  initialFormState: TechniqueCreatorFormState;
  editTechniqueId: string | null;
  techniqueParts: TechniquePart[];
};

export function useTechniqueCreatorWorkspace({
  initialFormState,
  editTechniqueId,
  techniqueParts,
}: UseTechniqueCreatorWorkspaceArgs) {
  const [name, setName] = useState(initialFormState.name);
  const [description, setDescription] = useState(initialFormState.description);
  const [selectedParts, setSelectedParts] = useState<SelectedPart[]>(
    initialFormState.selectedParts,
  );
  const [actionType, setActionType] = useState(initialFormState.actionType);
  const [isReaction, setIsReaction] = useState(initialFormState.isReaction);
  const [damage, setDamage] = useState<DamageConfig>(initialFormState.damage);
  const [attackMode, setAttackMode] = useState<AttackMode>(initialFormState.attackMode);
  const [imageId, setImageId] = useState<string | null>(initialFormState.imageId);
  const [imageUrl, setImageUrl] = useState<string | null>(initialFormState.imageUrl);
  const [targetedDefenses, setTargetedDefenses] = useState<string[]>(
    initialFormState.targetedDefenses,
  );

  // ?edit= mode: clear any stale draft once on mount (parity with the old hydrate
  // effect, which removed the cache after loading the edit target).
  useEffect(() => {
    if (editTechniqueId) clearCreatorCache(TECHNIQUE_CREATOR_CACHE_KEY);
  }, [editTechniqueId]);

  // Auto-save draft to localStorage (skip when editing an existing library row via ?edit=)
  useEffect(() => {
    if (editTechniqueId) return;

    const cache: TechniqueCreatorCache = {
      name,
      description,
      selectedParts: selectedParts.map((sp) => ({
        partId: sp.part.id,
        op_1_lvl: sp.op_1_lvl,
        op_2_lvl: sp.op_2_lvl,
        op_3_lvl: sp.op_3_lvl,
        selectedCategory: sp.selectedCategory,
      })),
      actionType,
      isReaction,
      damage,
      attackMode,
      imageId,
      imageUrl,
      targetedDefenses,
      timestamp: Date.now(),
    };
    writeCreatorCache(TECHNIQUE_CREATOR_CACHE_KEY, cache);
  }, [
    editTechniqueId,
    name,
    description,
    selectedParts,
    actionType,
    isReaction,
    damage,
    attackMode,
    imageId,
    imageUrl,
    targetedDefenses,
  ]);

  // Build mechanic parts from action type, damage, and attack mode.
  const mechanicParts = useMemo(
    () =>
      buildMechanicParts({
        creatorType: 'technique',
        partsDb: techniqueParts,
        action: { type: actionType, isReaction },
        techniqueDamage: { diceAmount: damage.amount, dieSize: damage.size },
        attackMode,
      }),
    [actionType, isReaction, damage.amount, damage.size, attackMode, techniqueParts],
  );

  // Convert selected parts to payload format for calculator
  const partsPayload: TechniquePartPayload[] = useMemo(() => {
    const selected: TechniquePartPayload[] = selectedParts.map((sp) => ({
      id: Number(sp.part.id),
      name: sp.part.name,
      part: sp.part,
      op_1_lvl: sp.op_1_lvl,
      op_2_lvl: sp.op_2_lvl,
      op_3_lvl: sp.op_3_lvl,
      calcSection: 'parts' as const,
    }));

    const mechanics: TechniquePartPayload[] = mechanicParts.map((mp) => {
      const section = TECHNIQUE_CALC_SECTION_BY_NAME[mp.name];
      let displayLabel: string | undefined;
      if (mp.name === 'Quick or Free Action') {
        displayLabel = actionType === 'free' ? 'Free Action' : 'Quick Action';
      } else if (mp.name === 'Long Action') {
        displayLabel = actionType === 'long4' ? 'Long Action (4 AP)' : 'Long Action (3 AP)';
      } else if (mp.name === 'Reaction') {
        displayLabel = 'Reaction';
      } else if (mp.name === 'Additional Damage' && damage.amount > 0) {
        displayLabel =
          formatTechniqueDamage({ amount: damage.amount, size: damage.size }) ||
          'Additional Damage';
      } else if (mp.name === 'Add Weapon to Technique' || mp.name === 'Add Weapon Attack') {
        displayLabel = 'Weapon Attack';
      } else if (mp.name === 'No Attack') {
        displayLabel = 'No Attack';
      } else if (mp.name === 'Split Damage Dice') {
        displayLabel = 'Split damage dice';
      }
      return {
        id: Number(mp.id),
        name: mp.name,
        op_1_lvl: mp.op_1_lvl,
        op_2_lvl: mp.op_2_lvl,
        op_3_lvl: mp.op_3_lvl,
        calcSection: section,
        displayLabel,
      };
    });

    return [...selected, ...mechanics];
  }, [selectedParts, mechanicParts, actionType, damage.amount, damage.size]);

  // Calculate costs - using technique parts as the database
  const costs = useMemo(
    () => calculateTechniqueCosts(partsPayload, techniqueParts),
    [partsPayload, techniqueParts],
  );
  const advancedCalcGroups = useMemo(
    () =>
      buildTechniqueAdvancedCalculationGroups(analyzeTechniqueEnergy(partsPayload, techniqueParts)),
    [partsPayload, techniqueParts],
  );

  // Derived display values
  const actionTypeDisplay = useMemo(
    () => computeTechniqueActionTypeFromSelection(actionType, isReaction),
    [actionType, isReaction],
  );

  const damageDisplay = useMemo(
    () => formatTechniqueDamage(damage.amount > 0 ? damage : undefined),
    [damage],
  );

  // Collapsed summaries for collapsible sections
  const attackModeLabel = useMemo(() => attackModeColumnLabel(attackMode), [attackMode]);
  const combatConfigSummary = useMemo(
    () => `${attackModeLabel} • ${actionTypeDisplay}`,
    [attackModeLabel, actionTypeDisplay],
  );
  const techniquePartsSummary = useMemo(() => {
    if (selectedParts.length === 0) return 'No parts';
    const names = selectedParts.slice(0, 5).map((sp) => sp.part.name);
    const more = selectedParts.length > 5 ? ` +${selectedParts.length - 5} more` : '';
    return `${names.join(', ')}${more}`;
  }, [selectedParts]);
  const damageSummary = useMemo(
    () => (damage.amount > 0 ? `+${damage.amount}d${damage.size}` : 'None'),
    [damage.amount, damage.size],
  );

  // Section cost for Additional Damage
  const damageSectionCost = useMemo(() => {
    const damageParts = mechanicParts.filter(
      (mp) => mp.name === 'Additional Damage' || mp.name === 'Split Damage Dice',
    );
    return calculateTechniqueCosts(damageParts.map(toTechniquePartPayload), techniqueParts);
  }, [mechanicParts, techniqueParts]);

  // Section cost for Combat Configuration (weapon + action type + reaction)
  const combatConfigCost = useMemo(() => {
    const combatParts = mechanicParts.filter(
      (mp) => mp.name !== 'Additional Damage' && mp.name !== 'Split Damage Dice',
    );
    return calculateTechniqueCosts(combatParts.map(toTechniquePartPayload), techniqueParts);
  }, [mechanicParts, techniqueParts]);

  const weaponCost = useMemo(() => {
    const weaponParts = mechanicParts.filter(
      (mp) =>
        mp.name === 'Add Weapon to Technique' ||
        mp.name === 'Add Weapon Attack' ||
        mp.name === 'No Attack',
    );
    return calculateTechniqueCosts(weaponParts.map(toTechniquePartPayload), techniqueParts);
  }, [mechanicParts, techniqueParts]);

  const actionTypeCost = useMemo(() => {
    const actionParts = mechanicParts.filter(
      (mp) => mp.name === 'Quick or Free Action' || mp.name === 'Long Action',
    );
    return calculateTechniqueCosts(actionParts.map(toTechniquePartPayload), techniqueParts);
  }, [mechanicParts, techniqueParts]);

  const reactionCost = useMemo(() => {
    const reactionParts = mechanicParts.filter((mp) => mp.name === 'Reaction');
    return calculateTechniqueCosts(reactionParts.map(toTechniquePartPayload), techniqueParts);
  }, [mechanicParts, techniqueParts]);

  // Actions
  const addPart = useCallback(() => {
    // Seed from the first selectable (non-mechanic) part; mechanic parts are
    // auto-generated from action/damage/weapon and must not appear as editable rows.
    const firstSelectable = techniqueParts.find((p) => !p.mechanic);
    if (!firstSelectable) return;
    setSelectedParts((prev) => [
      ...prev,
      {
        part: firstSelectable,
        op_1_lvl: 0,
        op_2_lvl: 0,
        op_3_lvl: 0,
        selectedCategory: firstSelectable.category || 'any',
      },
    ]);
  }, [techniqueParts]);

  const removePart = useCallback((index: number) => {
    setSelectedParts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updatePart = useCallback((index: number, updates: Partial<SelectedPart>) => {
    setSelectedParts((prev) => prev.map((sp, i) => (i === index ? { ...sp, ...updates } : sp)));
  }, []);

  const getPayload = useCallback(() => {
    const partsToSave = dedupeSavedParts([
      ...selectedParts.map((sp) => ({
        id: Number(sp.part.id),
        name: sp.part.name,
        op_1_lvl: sp.op_1_lvl,
        op_2_lvl: sp.op_2_lvl,
        op_3_lvl: sp.op_3_lvl,
      })),
      ...mechanicParts.map((mp) => ({
        id: mp.id,
        name: mp.name,
        op_1_lvl: mp.op_1_lvl,
        op_2_lvl: mp.op_2_lvl,
        op_3_lvl: mp.op_3_lvl,
      })),
    ]);
    const damageToSave = damage.amount > 0 ? [{ amount: damage.amount, size: damage.size }] : [];
    return {
      name: name.trim(),
      data: {
        name: name.trim(),
        description: description.trim(),
        parts: partsToSave,
        damage: damageToSave,
        attackMode,
        actionType,
        isReaction,
        ...(targetedDefenses.length > 0 ? { targetedDefenses } : {}),
        ...(imageId ? { imageId } : {}),
        ...(imageUrl ? { imageUrl } : {}),
      },
    };
  }, [
    name,
    description,
    selectedParts,
    mechanicParts,
    damage,
    attackMode,
    actionType,
    isReaction,
    targetedDefenses,
    imageId,
    imageUrl,
  ]);

  const save = useCreatorSave({
    type: 'techniques',
    getPayload,
    requirePublishConfirm: true,
    publishConfirmTitle: 'Publish to Realms Library',
    publishConfirmDescription: (n, { existingInPublic }) =>
      existingInPublic
        ? `Are you sure you want to override "${n}" (technique)? The existing public technique with this name will be replaced.`
        : `Are you sure you wish to publish this technique "${n}" to the Realms Library? All users will be able to see and use it.`,
    successMessage: 'Technique saved successfully!',
    publicSuccessMessage: 'Technique saved to Realms Library!',
    onSaveSuccess: () => {
      setName('');
      setDescription('');
      setSelectedParts([]);
      setActionType('basic');
      setIsReaction(false);
      setDamage({ amount: 0, size: 6, type: 'none' });
      setAttackMode('unarmed');
      setImageId(null);
      setImageUrl(null);
      setTargetedDefenses([]);
    },
  });

  const handleReset = useCallback(() => {
    setName('');
    setDescription('');
    setSelectedParts([]);
    setActionType('basic');
    setIsReaction(false);
    setDamage({ amount: 0, size: 6, type: 'none' });
    setAttackMode('unarmed');
    setImageId(null);
    setImageUrl(null);
    setTargetedDefenses([]);
    save.setSaveMessage(null);
    clearCreatorCache(TECHNIQUE_CREATOR_CACHE_KEY);
  }, [save]);

  const applyFormState = useCallback((next: TechniqueCreatorFormState) => {
    setName(next.name);
    setDescription(next.description);
    setSelectedParts(next.selectedParts);
    setActionType(next.actionType);
    setIsReaction(next.isReaction);
    setDamage(next.damage);
    setAttackMode(next.attackMode);
    setImageId(next.imageId);
    setImageUrl(next.imageUrl);
    setTargetedDefenses(next.targetedDefenses);
  }, []);

  const suggestionSelectedParts = useMemo(
    () => selectedParts.map((sp) => sp.part),
    [selectedParts],
  );

  const handleLoadTechnique = useCallback(
    (technique: TechniqueLibraryRecord) => {
      applyFormState(techniqueLibraryRecordToFormState(technique, techniqueParts));
      save.setSaveMessage({ type: 'success', text: 'Technique loaded successfully!' });
      setTimeout(() => save.setSaveMessage(null), 2000);
    },
    [techniqueParts, applyFormState, save],
  );

  return {
    name,
    setName,
    description,
    setDescription,
    selectedParts,
    actionType,
    setActionType,
    isReaction,
    setIsReaction,
    damage,
    setDamage,
    attackMode,
    setAttackMode,
    imageId,
    imageUrl,
    setImageId,
    setImageUrl,
    targetedDefenses,
    setTargetedDefenses,
    suggestionSelectedParts,
    costs,
    advancedCalcGroups,
    actionTypeDisplay,
    damageDisplay,
    attackModeLabel,
    combatConfigSummary,
    techniquePartsSummary,
    damageSummary,
    damageSectionCost,
    combatConfigCost,
    weaponCost,
    actionTypeCost,
    reactionCost,
    addPart,
    removePart,
    updatePart,
    save,
    handleReset,
    handleLoadTechnique,
  };
}
