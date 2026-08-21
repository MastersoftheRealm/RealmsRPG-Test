/**
 * Armament Creator — workspace state hook (TASK-381 Phase 3, TASK-616)
 * =====================================================================
 * Owns form state, draft cache, save/load. Cost derivation and property actions
 * are co-located modules; presentational sections stay in the editor facade.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useCreatorSave, type ItemProperty } from '@/hooks';
import type { ItemDamage } from '@/lib/calculators';
import {
  itemLibraryRecordToFormState,
  ITEM_CREATOR_CACHE_KEY,
  type ArmamentType,
  type ItemCreatorCache,
  type ItemCreatorFormState,
  type ItemLibraryRecord,
  type ItemSelectedProperty as SelectedProperty,
  type ItemDamageConfig as DamageConfig,
} from './item-creator-bootstrap';
import { writeCreatorCache, clearCreatorCache } from '@/lib/game/creator-cache';
import { useItemCreatorCostDerivation } from './item-creator-cost-derivation';
import { useItemCreatorPropertyActions } from './item-creator-property-actions';

type UseItemCreatorWorkspaceArgs = {
  initialFormState: ItemCreatorFormState;
  editItemId: string | null;
  itemProperties: ItemProperty[];
  closeLoadModal: () => void;
};

export function useItemCreatorWorkspace({
  initialFormState,
  editItemId,
  itemProperties,
  closeLoadModal,
}: UseItemCreatorWorkspaceArgs) {
  const [name, setName] = useState(initialFormState.name);
  const [description, setDescription] = useState(initialFormState.description);
  const [armamentType, setArmamentType] = useState<ArmamentType>(initialFormState.armamentType);
  const [selectedProperties, setSelectedProperties] = useState<SelectedProperty[]>(
    initialFormState.selectedProperties,
  );
  const [damage, setDamage] = useState<DamageConfig>(initialFormState.damage);
  const [isTwoHanded, setIsTwoHanded] = useState(initialFormState.isTwoHanded);
  const [rangeLevel, setRangeLevel] = useState(initialFormState.rangeLevel);
  const [damageReduction, setDamageReduction] = useState(initialFormState.damageReduction);
  const [agilityReduction, setAgilityReduction] = useState(initialFormState.agilityReduction);
  const [criticalRangeIncrease, setCriticalRangeIncrease] = useState(
    initialFormState.criticalRangeIncrease,
  );
  const [shieldDR, setShieldDR] = useState<{ amount: number; size: number }>(
    initialFormState.shieldDR,
  );
  const [hasShieldDamage, setHasShieldDamage] = useState(initialFormState.hasShieldDamage);
  const [shieldDamage, setShieldDamage] = useState<{ amount: number; size: number }>(
    initialFormState.shieldDamage,
  );
  const [abilityRequirement, setAbilityRequirement] = useState<{
    id: number;
    name: string;
    level: number;
  } | null>(initialFormState.abilityRequirement);
  const [imageId, setImageId] = useState<string | null>(initialFormState.imageId);
  const [imageUrl, setImageUrl] = useState<string | null>(initialFormState.imageUrl);

  const imageCategory = armamentType.toLowerCase() as 'weapon' | 'armor' | 'shield';

  useEffect(() => {
    if (editItemId) clearCreatorCache(ITEM_CREATOR_CACHE_KEY);
  }, [editItemId]);

  useEffect(() => {
    if (editItemId) return;

    const cache: ItemCreatorCache = {
      name,
      description,
      armamentType,
      selectedProperties: selectedProperties.map((sp) => ({
        propertyId: sp.property.id,
        op_1_lvl: sp.op_1_lvl,
      })),
      damage,
      isTwoHanded,
      rangeLevel,
      damageReduction,
      agilityReduction,
      criticalRangeIncrease,
      shieldDR,
      hasShieldDamage,
      shieldDamage,
      abilityRequirement,
      imageId,
      imageUrl,
      timestamp: Date.now(),
    };
    writeCreatorCache(ITEM_CREATOR_CACHE_KEY, cache);
  }, [
    editItemId,
    name,
    description,
    armamentType,
    selectedProperties,
    damage,
    isTwoHanded,
    rangeLevel,
    damageReduction,
    agilityReduction,
    criticalRangeIncrease,
    shieldDR,
    hasShieldDamage,
    shieldDamage,
    abilityRequirement,
    imageId,
    imageUrl,
  ]);

  const changeArmamentType = useCallback((next: ArmamentType) => {
    setArmamentType(next);
    const armamentTypeLower = next.toLowerCase();
    setSelectedProperties((prev) =>
      prev.filter((sp) => {
        const propType = (sp.property.type || '').toLowerCase();
        if (!propType || propType === 'general') return true;
        return propType === armamentTypeLower;
      }),
    );
    setAbilityRequirement(null);
  }, []);

  const {
    rangeDisplay,
    weaponShieldConfigSummary,
    baseDamageSummary,
    armorConfigSummary,
    shieldBlockSummary,
    shieldDamageSummary,
    abilityReqSummary,
    propertiesSummary,
    propertiesPayload,
    costs,
    itemSectionCosts,
    currencyCost,
    rarity,
    advancedCalcRows,
    damageDisplay,
  } = useItemCreatorCostDerivation({
    armamentType,
    selectedProperties,
    itemProperties,
    damage,
    isTwoHanded,
    rangeLevel,
    damageReduction,
    agilityReduction,
    criticalRangeIncrease,
    shieldDR,
    hasShieldDamage,
    shieldDamage,
    abilityRequirement,
  });

  const { addProperty, removeProperty, updateProperty } = useItemCreatorPropertyActions({
    itemProperties,
    armamentType,
    selectedProperties,
    setSelectedProperties,
  });

  const getPayload = useCallback(() => {
    const propertiesToSave = propertiesPayload.map((pp) => ({
      id: pp.id,
      name: pp.name,
      op_1_lvl: pp.op_1_lvl,
    }));
    const damageToSave: ItemDamage[] =
      armamentType === 'Weapon' && damage.type !== 'none' && damage.amount > 0
        ? [{ amount: damage.amount, size: damage.size, type: damage.type }]
        : [];
    const itemData = {
      name: name.trim(),
      description: description.trim(),
      type: armamentType.toLowerCase(),
      properties: propertiesToSave,
      damage: damageToSave,
      costs,
      rarity,
      ...(imageId ? { imageId } : {}),
      ...(imageUrl ? { imageUrl } : {}),
      ...(armamentType === 'Weapon' && {
        isTwoHanded,
        rangeLevel,
        abilityRequirement: abilityRequirement
          ? {
              id: abilityRequirement.id,
              name: abilityRequirement.name,
              level: abilityRequirement.level,
            }
          : null,
      }),
      ...(armamentType === 'Armor' && {
        damageReduction,
        agilityReduction,
        criticalRangeIncrease,
        abilityRequirement: abilityRequirement
          ? {
              id: abilityRequirement.id,
              name: abilityRequirement.name,
              level: abilityRequirement.level,
            }
          : null,
      }),
      ...(armamentType === 'Shield' && {
        isTwoHanded,
        shieldDR: { amount: shieldDR.amount, size: shieldDR.size },
        hasShieldDamage,
        shieldDamage: hasShieldDamage
          ? { amount: shieldDamage.amount, size: shieldDamage.size }
          : null,
      }),
    };
    return { name: name.trim(), data: itemData };
  }, [
    name,
    description,
    armamentType,
    propertiesPayload,
    damage,
    costs,
    rarity,
    imageId,
    imageUrl,
    isTwoHanded,
    rangeLevel,
    abilityRequirement,
    damageReduction,
    agilityReduction,
    criticalRangeIncrease,
    shieldDR,
    hasShieldDamage,
    shieldDamage,
  ]);

  const save = useCreatorSave({
    type: 'items',
    getPayload,
    requirePublishConfirm: true,
    publishConfirmTitle: 'Publish to Realms Library',
    publishConfirmDescription: (n, { existingInPublic }) =>
      existingInPublic
        ? `Are you sure you want to override "${n}" (${armamentType.toLowerCase()})? The existing public ${armamentType.toLowerCase()} with this name will be replaced.`
        : `Are you sure you wish to publish this ${armamentType.toLowerCase()} "${n}" to the Realms Library? All users will be able to see and use it.`,
    successMessage: 'Item saved successfully!',
    publicSuccessMessage: 'Item saved to Realms Library!',
    onSaveSuccess: () => {
      setName('');
      setDescription('');
      setSelectedProperties([]);
      setDamage({ amount: 1, size: 6, type: 'slashing' });
      setImageId(null);
      setImageUrl(null);
    },
  });

  const handleReset = useCallback(() => {
    setName('');
    setDescription('');
    setArmamentType('Weapon');
    setSelectedProperties([]);
    setDamage({ amount: 1, size: 6, type: 'slashing' });
    setIsTwoHanded(false);
    setRangeLevel(0);
    setDamageReduction(0);
    setAgilityReduction(0);
    setCriticalRangeIncrease(0);
    setShieldDR({ amount: 1, size: 4 });
    setHasShieldDamage(false);
    setShieldDamage({ amount: 1, size: 4 });
    setAbilityRequirement(null);
    setImageId(null);
    setImageUrl(null);
    save.setSaveMessage(null);
    clearCreatorCache(ITEM_CREATOR_CACHE_KEY);
  }, [save]);

  const applyFormState = useCallback((next: ItemCreatorFormState) => {
    setName(next.name);
    setDescription(next.description);
    setArmamentType(next.armamentType);
    setSelectedProperties(next.selectedProperties);
    setDamage(next.damage);
    setIsTwoHanded(next.isTwoHanded);
    setRangeLevel(next.rangeLevel);
    setDamageReduction(next.damageReduction);
    setAgilityReduction(next.agilityReduction);
    setCriticalRangeIncrease(next.criticalRangeIncrease);
    setShieldDR(next.shieldDR);
    setHasShieldDamage(next.hasShieldDamage);
    setShieldDamage(next.shieldDamage);
    setAbilityRequirement(next.abilityRequirement);
    setImageId(next.imageId);
    setImageUrl(next.imageUrl);
  }, []);

  const handleLoadItem = useCallback(
    (item: ItemLibraryRecord) => {
      applyFormState(itemLibraryRecordToFormState(item, itemProperties));
      closeLoadModal();
      save.setSaveMessage({ type: 'success', text: 'Armament loaded successfully!' });
      setTimeout(() => save.setSaveMessage(null), 2000);
    },
    [itemProperties, applyFormState, closeLoadModal, save],
  );

  return {
    name,
    setName,
    description,
    setDescription,
    armamentType,
    changeArmamentType,
    selectedProperties,
    damage,
    setDamage,
    isTwoHanded,
    setIsTwoHanded,
    rangeLevel,
    setRangeLevel,
    damageReduction,
    setDamageReduction,
    agilityReduction,
    setAgilityReduction,
    criticalRangeIncrease,
    setCriticalRangeIncrease,
    shieldDR,
    setShieldDR,
    hasShieldDamage,
    setHasShieldDamage,
    shieldDamage,
    setShieldDamage,
    abilityRequirement,
    setAbilityRequirement,
    imageId,
    imageUrl,
    setImageId,
    setImageUrl,
    imageCategory,
    rangeDisplay,
    weaponShieldConfigSummary,
    baseDamageSummary,
    armorConfigSummary,
    shieldBlockSummary,
    shieldDamageSummary,
    abilityReqSummary,
    propertiesSummary,
    costs,
    itemSectionCosts,
    currencyCost,
    rarity,
    advancedCalcRows,
    damageDisplay,
    addProperty,
    removeProperty,
    updateProperty,
    save,
    handleReset,
    handleLoadItem,
  };
}
