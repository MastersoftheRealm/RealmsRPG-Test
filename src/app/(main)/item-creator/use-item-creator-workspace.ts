/**
 * Armament Creator — workspace state hook (TASK-381 Phase 3, TASK-616)
 * =====================================================================
 * Owns form state, draft cache, save/load. Cost derivation and property actions
 * are co-located modules; presentational sections stay in the editor facade.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCreatorSave, type ItemProperty } from '@/hooks';
import type { CreatorSaveTarget } from '@/lib/library/catalog-listing';
import {
  weaponRangeLegacyLevel,
  weaponRangeSpaceLadder,
  type ItemDamage,
  type WeaponRangeType,
} from '@/lib/calculators';
import {
  clampWeaponAbilityUtilized,
  defaultWeaponAbilityUtilized,
  type WeaponAttackAbility,
} from '@/lib/game/weapon-attack-ability';
import {
  emptyItemCreatorFormState,
  itemCreatorHrefForArmamentType,
  itemCreatorTypeQueryConflict,
  itemLibraryRecordToFormState,
  ITEM_CREATOR_CACHE_KEY,
  shouldWriteItemCreatorDraft,
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
  /** Live `?type=` value. Edit mode passes null. */
  requestedType: ArmamentType | null;
  itemProperties: ItemProperty[];
  closeLoadModal: () => void;
  initialSaveTarget?: CreatorSaveTarget | undefined;
};

function toItemCreatorCache(form: ItemCreatorFormState, rangeLevel: number): ItemCreatorCache {
  return {
    name: form.name,
    description: form.description,
    armamentType: form.armamentType,
    selectedProperties: form.selectedProperties.map((sp) => ({
      propertyId: sp.property.id,
      op_1_lvl: sp.op_1_lvl,
    })),
    damage: form.damage,
    isTwoHanded: form.isTwoHanded,
    rangeType: form.rangeType,
    rangeSpaces: form.rangeSpaces,
    rangeLevel,
    attackAbility: form.attackAbility,
    damageReduction: form.damageReduction,
    agilityReduction: form.agilityReduction,
    criticalRangeIncrease: form.criticalRangeIncrease,
    shieldDR: form.shieldDR,
    hasShieldDamage: form.hasShieldDamage,
    shieldDamage: form.shieldDamage,
    abilityRequirement: form.abilityRequirement,
    imageId: form.imageId,
    imageUrl: form.imageUrl,
    timestamp: Date.now(),
  };
}

function propertiesForArmament(
  properties: SelectedProperty[],
  armamentType: ArmamentType,
): SelectedProperty[] {
  const armamentTypeLower = armamentType.toLowerCase();
  return properties.filter((sp) => {
    const propType = (sp.property.type || '').toLowerCase();
    if (!propType || propType === 'general') return true;
    return propType === armamentTypeLower;
  });
}

export function useItemCreatorWorkspace({
  initialFormState,
  editItemId,
  requestedType,
  itemProperties,
  closeLoadModal,
  initialSaveTarget,
}: UseItemCreatorWorkspaceArgs) {
  const router = useRouter();
  /** Stale `?type=` this session has already answered, until `requestedType` moves on. */
  const [ignoredRequestedType, setIgnoredRequestedType] = useState<ArmamentType | null>(null);
  const [name, setName] = useState(initialFormState.name);
  const [description, setDescription] = useState(initialFormState.description);
  const [armamentType, setArmamentType] = useState<ArmamentType>(initialFormState.armamentType);
  const [selectedProperties, setSelectedProperties] = useState<SelectedProperty[]>(
    initialFormState.selectedProperties,
  );
  const [damage, setDamage] = useState<DamageConfig>(initialFormState.damage);
  const [isTwoHanded, setIsTwoHanded] = useState(initialFormState.isTwoHanded);
  const [rangeType, setRangeTypeState] = useState<WeaponRangeType>(initialFormState.rangeType);
  const [rangeSpaces, setRangeSpaces] = useState(initialFormState.rangeSpaces);
  const [attackAbility, setAttackAbility] = useState<WeaponAttackAbility>(
    initialFormState.attackAbility,
  );
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
  if (
    ignoredRequestedType &&
    (requestedType !== ignoredRequestedType || requestedType === armamentType)
  ) {
    setIgnoredRequestedType(null);
  }
  const typeQueryConflict = editItemId
    ? null
    : itemCreatorTypeQueryConflict(
        armamentType,
        requestedType,
        ignoredRequestedType &&
          requestedType === ignoredRequestedType &&
          requestedType !== armamentType
          ? ignoredRequestedType
          : null,
      );

  const formSnapshot = useCallback(
    (overrides?: Partial<ItemCreatorFormState>): ItemCreatorFormState => ({
      name,
      description,
      armamentType,
      selectedProperties,
      damage,
      isTwoHanded,
      rangeType,
      rangeSpaces,
      attackAbility,
      damageReduction,
      agilityReduction,
      criticalRangeIncrease,
      shieldDR,
      hasShieldDamage,
      shieldDamage,
      abilityRequirement,
      imageId,
      imageUrl,
      ...overrides,
    }),
    [
      name,
      description,
      armamentType,
      selectedProperties,
      damage,
      isTwoHanded,
      rangeType,
      rangeSpaces,
      attackAbility,
      damageReduction,
      agilityReduction,
      criticalRangeIncrease,
      shieldDR,
      hasShieldDamage,
      shieldDamage,
      abilityRequirement,
      imageId,
      imageUrl,
    ],
  );

  const alignTypeQuery = useCallback(
    (next: ArmamentType) => {
      if (editItemId || requestedType === next) return;
      if (requestedType) setIgnoredRequestedType(requestedType);
      router.replace(itemCreatorHrefForArmamentType(next), { scroll: false });
    },
    [editItemId, requestedType, router],
  );

  useEffect(() => {
    if (editItemId) clearCreatorCache(ITEM_CREATOR_CACHE_KEY);
  }, [editItemId]);

  useEffect(() => {
    if (!shouldWriteItemCreatorDraft(editItemId != null, typeQueryConflict != null)) return;

    writeCreatorCache(
      ITEM_CREATOR_CACHE_KEY,
      toItemCreatorCache(
        formSnapshot(),
        weaponRangeLegacyLevel({ type: rangeType, spaces: rangeSpaces }),
      ),
    );
  }, [editItemId, formSnapshot, rangeSpaces, rangeType, typeQueryConflict]);

  const changeRangeType = useCallback((next: WeaponRangeType) => {
    setRangeTypeState(next);
    setAttackAbility((prev) =>
      prev === 'agility' ? 'agility' : defaultWeaponAbilityUtilized(next),
    );
    if (next === 'melee') {
      setRangeSpaces(0);
      return;
    }
    setRangeSpaces(weaponRangeSpaceLadder(next)[0] ?? 0);
  }, []);

  const changeAttackAbility = useCallback(
    (next: WeaponAttackAbility) => {
      setAttackAbility(clampWeaponAbilityUtilized(next, rangeType));
    },
    [rangeType],
  );

  const changeArmamentType = useCallback(
    (next: ArmamentType) => {
      const nextProperties = propertiesForArmament(selectedProperties, next);
      setArmamentType(next);
      setSelectedProperties(nextProperties);
      setAbilityRequirement(null);
      if (editItemId) return;
      const nextForm = formSnapshot({
        armamentType: next,
        selectedProperties: nextProperties,
        abilityRequirement: null,
      });
      writeCreatorCache(
        ITEM_CREATOR_CACHE_KEY,
        toItemCreatorCache(
          nextForm,
          weaponRangeLegacyLevel({ type: rangeType, spaces: rangeSpaces }),
        ),
      );
      alignTypeQuery(next);
    },
    [alignTypeQuery, editItemId, formSnapshot, rangeSpaces, rangeType, selectedProperties],
  );

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
    advancedCalcGroups,
    damageDisplay,
  } = useItemCreatorCostDerivation({
    armamentType,
    selectedProperties,
    itemProperties,
    damage,
    isTwoHanded,
    rangeType,
    rangeSpaces,
    attackAbility,
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
        rangeLevel: weaponRangeLegacyLevel({ type: rangeType, spaces: rangeSpaces }),
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
    rangeType,
    rangeSpaces,
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
    initialSaveTarget,
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
    setRangeTypeState('melee');
    setRangeSpaces(0);
    setAttackAbility('strength');
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
    alignTypeQuery('Weapon');
  }, [alignTypeQuery, save]);

  const applyFormState = useCallback((next: ItemCreatorFormState) => {
    setName(next.name);
    setDescription(next.description);
    setArmamentType(next.armamentType);
    setSelectedProperties(next.selectedProperties);
    setDamage(next.damage);
    setIsTwoHanded(next.isTwoHanded);
    setRangeTypeState(next.rangeType);
    setRangeSpaces(next.rangeSpaces);
    setAttackAbility(next.attackAbility);
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

  const keepDraft = useCallback(() => {
    alignTypeQuery(armamentType);
  }, [alignTypeQuery, armamentType]);

  const discardDraft = useCallback(() => {
    if (!typeQueryConflict) return;
    applyFormState({ ...emptyItemCreatorFormState(), armamentType: typeQueryConflict });
  }, [applyFormState, typeQueryConflict]);

  const handleLoadItem = useCallback(
    (item: ItemLibraryRecord) => {
      const next = itemLibraryRecordToFormState(item, itemProperties);
      applyFormState(next);
      if (!editItemId) {
        writeCreatorCache(
          ITEM_CREATOR_CACHE_KEY,
          toItemCreatorCache(
            next,
            weaponRangeLegacyLevel({ type: next.rangeType, spaces: next.rangeSpaces }),
          ),
        );
        alignTypeQuery(next.armamentType);
      }
      save.applyLoadedLibraryItem(item);
      closeLoadModal();
      save.setSaveMessage({ type: 'success', text: 'Armament loaded successfully!' });
      setTimeout(() => save.setSaveMessage(null), 2000);
    },
    [alignTypeQuery, applyFormState, closeLoadModal, editItemId, itemProperties, save],
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
    rangeType,
    changeRangeType,
    rangeSpaces,
    setRangeSpaces,
    attackAbility,
    changeAttackAbility,
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
    advancedCalcGroups,
    damageDisplay,
    addProperty,
    removeProperty,
    updateProperty,
    save,
    handleReset,
    handleLoadItem,
    typeQueryConflict,
    keepDraft,
    discardDraft,
  };
}
