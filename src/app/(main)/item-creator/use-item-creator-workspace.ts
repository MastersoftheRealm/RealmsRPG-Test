/**
 * Armament Creator — workspace state hook (TASK-381 Phase 3)
 * ==========================================================
 * Owns form state, draft cache, cost/rarity derivation, property actions, and
 * save/load for ItemCreatorWorkspace. Presentational sections stay in editor.
 */

'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  useCreatorSave,
  type ItemProperty,
} from '@/hooks';
import {
  calculateItemCosts,
  calculateCurrencyCostAndRarity,
  isGeneralProperty,
  isMechanicProperty,
  type ItemPropertyPayload,
  type ItemDamage,
} from '@/lib/calculators';
import { PROPERTY_IDS } from '@/lib/id-constants';
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
import {
  WEAPON_ABILITY_REQUIREMENTS,
  ARMOR_ABILITY_REQUIREMENTS,
} from './item-creator-helpers';
import { writeCreatorCache, clearCreatorCache } from '@/lib/game/creator-cache';
import { formatCost } from '@/lib/game/creator-constants';

export type UseItemCreatorWorkspaceArgs = {
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
  const [rangeLevel, setRangeLevel] = useState(initialFormState.rangeLevel); // 0 = melee, 1+ = ranged (8 spaces per level)

  // Armor-specific state
  const [damageReduction, setDamageReduction] = useState(initialFormState.damageReduction);
  const [agilityReduction, setAgilityReduction] = useState(initialFormState.agilityReduction);
  const [criticalRangeIncrease, setCriticalRangeIncrease] = useState(
    initialFormState.criticalRangeIncrease,
  );

  // Shield-specific state - dice-based like weapon damage
  const [shieldDR, setShieldDR] = useState<{ amount: number; size: number }>(
    initialFormState.shieldDR,
  );
  const [hasShieldDamage, setHasShieldDamage] = useState(initialFormState.hasShieldDamage);
  const [shieldDamage, setShieldDamage] = useState<{ amount: number; size: number }>(
    initialFormState.shieldDamage,
  );

  // Ability requirements state - each armament can have one ability requirement
  const [abilityRequirement, setAbilityRequirement] = useState<{ id: number; name: string; level: number } | null>(
    initialFormState.abilityRequirement,
  );
  const [imageId, setImageId] = useState<string | null>(initialFormState.imageId);
  const [imageUrl, setImageUrl] = useState<string | null>(initialFormState.imageUrl);

  const imageCategory = armamentType.toLowerCase() as 'weapon' | 'armor' | 'shield';

  // ?edit= mode: clear any stale draft once on mount (parity with the old hydrate
  // effect, which removed the cache after loading the edit target).
  useEffect(() => {
    if (editItemId) clearCreatorCache(ITEM_CREATOR_CACHE_KEY);
  }, [editItemId]);

  // Auto-save draft to localStorage (skip when editing an existing library row via ?edit=)
  useEffect(() => {
    if (editItemId) return;

    {
      const cache: ItemCreatorCache = {
        name,
        description,
        armamentType,
        selectedProperties: selectedProperties.map(sp => ({
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
    }
  }, [editItemId, name, description, armamentType, selectedProperties, damage, isTwoHanded, rangeLevel, damageReduction, agilityReduction, criticalRangeIncrease, shieldDR, hasShieldDamage, shieldDamage, abilityRequirement, imageId, imageUrl]);

  // Change armament type: filter out incompatible properties and clear the
  // ability requirement (different types have different requirements). Event
  // handler instead of a reactive effect — bootstrap/load paths already set
  // consistent property lists.
  const changeArmamentType = useCallback((next: ArmamentType) => {
    setArmamentType(next);
    const armamentTypeLower = next.toLowerCase();
    setSelectedProperties(prev =>
      prev.filter(sp => {
        const propType = (sp.property.type || '').toLowerCase();
        // Keep properties with no type, general type, or matching type
        if (!propType || propType === 'general') return true;
        return propType === armamentTypeLower;
      })
    );
    setAbilityRequirement(null);
  }, []);

  // Range display string
  const rangeDisplay = useMemo(() => {
    if (rangeLevel === 0) return 'Melee';
    return `${rangeLevel * 8} spaces`;
  }, [rangeLevel]);

  // Collapsed summaries for collapsible sections
  const weaponShieldConfigSummary = useMemo(() => {
    const handed = isTwoHanded ? 'Two-Handed' : 'One-Handed';
    if (armamentType === 'Weapon') return `${handed} • ${rangeDisplay}`;
    return handed;
  }, [armamentType, isTwoHanded, rangeDisplay]);
  const baseDamageSummary = useMemo(
    () => `${damage.amount}d${damage.size} ${damage.type}`,
    [damage.amount, damage.size, damage.type]
  );
  const armorConfigSummary = useMemo(
    () => `DR ${damageReduction}, AGI -${agilityReduction}, Crit +${criticalRangeIncrease}`,
    [damageReduction, agilityReduction, criticalRangeIncrease]
  );
  const shieldBlockSummary = useMemo(
    () => `${shieldDR.amount}d${shieldDR.size} blocked`,
    [shieldDR.amount, shieldDR.size]
  );
  const shieldDamageSummary = useMemo(
    () => (hasShieldDamage ? `${shieldDamage.amount}d${shieldDamage.size} bludgeoning` : 'None'),
    [hasShieldDamage, shieldDamage.amount, shieldDamage.size]
  );
  const abilityReqSummary = useMemo(() => {
    if (!abilityRequirement) return 'None';
    const reqs = armamentType === 'Armor' ? ARMOR_ABILITY_REQUIREMENTS : WEAPON_ABILITY_REQUIREMENTS;
    const req = reqs.find((r) => r.id === abilityRequirement.id);
    return req ? `${req.label} ${abilityRequirement.level}` : 'None';
  }, [abilityRequirement, armamentType]);
  const propertiesSummary = useMemo(() => {
    if (selectedProperties.length === 0) return 'No properties';
    const names = selectedProperties.slice(0, 5).map((sp) => sp.property.name);
    const more = selectedProperties.length > 5 ? ` +${selectedProperties.length - 5} more` : '';
    return `${names.join(', ')}${more}`;
  }, [selectedProperties]);

  // Convert selected properties to payload format for calculator
  // Including auto-generated properties for Weapon, Armor, and Shield
  // Exclude Range from selectedProperties so it is driven only by rangeLevel (avoids acuity when ticked down to melee)
  const propertiesPayload: ItemPropertyPayload[] = useMemo(() => {
    const rangeId = Number(PROPERTY_IDS.RANGE);
    const baseProps = selectedProperties
      .filter((sp) => Number(sp.property.id) !== rangeId && sp.property.name?.toLowerCase() !== 'range')
      .map((sp) => ({
        id: Number(sp.property.id),
        name: sp.property.name,
        op_1_lvl: sp.op_1_lvl,
      }));
    
    // === WEAPON / SHIELD PROPERTIES ===
    // Add Two-Handed property if weapon/shield and selected
    if ((armamentType === 'Weapon' || armamentType === 'Shield') && isTwoHanded) {
      const twoHandedProp = itemProperties.find((p: ItemProperty) => p.name === 'Two-Handed');
      if (twoHandedProp) {
        baseProps.push({ id: Number(twoHandedProp.id), name: 'Two-Handed', op_1_lvl: 0 });
      }
    }
    
    // Add Range property if weapon and ranged
    if (armamentType === 'Weapon' && rangeLevel > 0) {
      const rangeProp = itemProperties.find((p: ItemProperty) => p.name === 'Range');
      if (rangeProp) {
        baseProps.push({ id: Number(rangeProp.id), name: 'Range', op_1_lvl: rangeLevel - 1 });
      }
    }
    
    // Add Weapon Damage property if weapon has valid damage
    if (armamentType === 'Weapon' && damage.type !== 'none' && damage.amount >= 1) {
      const validSizes = [4, 6, 8, 10, 12];
      if (validSizes.includes(damage.size)) {
        const weaponDamageProp = itemProperties.find((p: ItemProperty) => 
          p.name === 'Weapon Damage' || Number(p.id) === PROPERTY_IDS.WEAPON_DAMAGE
        );
        if (weaponDamageProp) {
          // Formula: ((dieAmount * dieSize) - 4) / 2, min 0
          const weaponDamageLevel = Math.max(0, ((damage.amount * damage.size) - 4) / 2);
          baseProps.push({ id: Number(weaponDamageProp.id), name: 'Weapon Damage', op_1_lvl: weaponDamageLevel });
        }
        
        // Add Split Damage Dice property if multiple dice
        if (damage.amount > 1) {
          const total = damage.amount * damage.size;
          const minDiceUsingD12 = Math.ceil(total / 12);
          const splits = Math.max(0, damage.amount - minDiceUsingD12);
          if (splits > 0) {
            const splitDiceProp = itemProperties.find((p: ItemProperty) => 
              p.name === 'Split Damage Dice' || Number(p.id) === PROPERTY_IDS.SPLIT_DAMAGE_DICE
            );
            if (splitDiceProp) {
              baseProps.push({ id: Number(splitDiceProp.id), name: 'Split Damage Dice', op_1_lvl: splits - 1 });
            }
          }
        }
      }
    }
    
    // === ARMOR PROPERTIES ===
    if (armamentType === 'Armor') {
      // Auto-add Armor Base property (ID: 16)
      const armorBaseProp = itemProperties.find((p: ItemProperty) => p.name === 'Armor Base' || Number(p.id) === 16);
      if (armorBaseProp) {
        baseProps.push({ id: Number(armorBaseProp.id), name: armorBaseProp.name, op_1_lvl: 0 });
      }
      
      // Add Damage Reduction property (ID: 1) - armor must have at least 1 DR
      const drProp = itemProperties.find((p: ItemProperty) => p.name === 'Damage Reduction' || Number(p.id) === 1);
      if (drProp && damageReduction > 0) {
        baseProps.push({ id: Number(drProp.id), name: drProp.name, op_1_lvl: damageReduction - 1 });
      }
      
      // Add Agility Reduction property (ID: 5) if any
      if (agilityReduction > 0) {
        const arProp = itemProperties.find((p: ItemProperty) => p.name === 'Agility Reduction' || Number(p.id) === 5);
        if (arProp) {
          baseProps.push({ id: Number(arProp.id), name: arProp.name, op_1_lvl: agilityReduction - 1 });
        }
      }
      
      // Add Critical Range Increase property (ID: 22) if any
      if (criticalRangeIncrease > 0) {
        const critProp = itemProperties.find((p: ItemProperty) => p.name === 'Critical Range +1' || Number(p.id) === PROPERTY_IDS.CRITICAL_RANGE_PLUS_1);
        if (critProp) {
          baseProps.push({ id: Number(critProp.id), name: critProp.name, op_1_lvl: criticalRangeIncrease - 1 });
        }
      }
    }
    
    // === SHIELD PROPERTIES ===
    if (armamentType === 'Shield') {
      // Auto-add Shield Base property (ID: 15)
      const shieldBaseProp = itemProperties.find((p: ItemProperty) => p.name === 'Shield Base' || Number(p.id) === 15);
      if (shieldBaseProp) {
        baseProps.push({ id: Number(shieldBaseProp.id), name: shieldBaseProp.name, op_1_lvl: 0 });
      }
      
      // Shield Amount (damage reduction) - Property ID 39
      // Uses same formula as weapon damage: ((diceAmount * dieSize) - 4) / 2
      const validSizes = [4, 6, 8, 10, 12];
      if (validSizes.includes(shieldDR.size) && shieldDR.amount >= 1) {
        const shieldAmountProp = itemProperties.find((p: ItemProperty) => 
          p.name === 'Shield Amount' || Number(p.id) === PROPERTY_IDS.SHIELD_AMOUNT
        );
        if (shieldAmountProp) {
          const shieldDRLevel = Math.max(0, ((shieldDR.amount * shieldDR.size) - 4) / 2);
          baseProps.push({ id: Number(shieldAmountProp.id), name: 'Shield Amount', op_1_lvl: shieldDRLevel });
        }
      }
      
      // Shield Damage (optional) - Property ID 40
      if (hasShieldDamage && validSizes.includes(shieldDamage.size) && shieldDamage.amount >= 1) {
        const shieldDamageProp = itemProperties.find((p: ItemProperty) => 
          p.name === 'Shield Damage' || Number(p.id) === PROPERTY_IDS.SHIELD_DAMAGE
        );
        if (shieldDamageProp) {
          const shieldDamageLevel = Math.max(0, ((shieldDamage.amount * shieldDamage.size) - 4) / 2);
          baseProps.push({ id: Number(shieldDamageProp.id), name: 'Shield Damage', op_1_lvl: shieldDamageLevel });
        }
      }
    }
    
    // === ABILITY REQUIREMENTS ===
    if (abilityRequirement && abilityRequirement.level > 0) {
      baseProps.push({
        id: abilityRequirement.id,
        name: abilityRequirement.name,
        op_1_lvl: abilityRequirement.level - 1,
      });
    }
    
    return baseProps;
  }, [selectedProperties, armamentType, isTwoHanded, rangeLevel, itemProperties, damageReduction, agilityReduction, criticalRangeIncrease, shieldDR, hasShieldDamage, shieldDamage, abilityRequirement, damage]);

  // Calculate costs
  const costs = useMemo(
    () => calculateItemCosts(propertiesPayload, itemProperties),
    [propertiesPayload, itemProperties]
  );

  // Section costs for display (IP/TP/C contribution per section)
  const itemSectionCosts = useMemo(() => {
    const byId = (id: number) => propertiesPayload.filter((p) => Number(p.id) === id);
    return {
      handedness: calculateItemCosts(byId(PROPERTY_IDS.TWO_HANDED), itemProperties),
      range: calculateItemCosts(byId(PROPERTY_IDS.RANGE), itemProperties),
      damage: calculateItemCosts(
        [...byId(PROPERTY_IDS.WEAPON_DAMAGE), ...byId(PROPERTY_IDS.SPLIT_DAMAGE_DICE)],
        itemProperties
      ),
      abilityReq: calculateItemCosts(
        abilityRequirement
          ? [
              {
                id: abilityRequirement.id,
                name: abilityRequirement.name,
                op_1_lvl: (abilityRequirement.level || 1) - 1,
              },
            ]
          : [],
        itemProperties
      ),
      criticalRange: calculateItemCosts(byId(PROPERTY_IDS.CRITICAL_RANGE_PLUS_1), itemProperties),
      damageReduction: calculateItemCosts(byId(PROPERTY_IDS.DAMAGE_REDUCTION), itemProperties),
      agilityReduction: calculateItemCosts(byId(PROPERTY_IDS.AGILITY_REDUCTION), itemProperties),
      shieldDR: calculateItemCosts(byId(PROPERTY_IDS.SHIELD_AMOUNT), itemProperties),
      shieldDamage: calculateItemCosts(byId(PROPERTY_IDS.SHIELD_DAMAGE), itemProperties),
    };
  }, [propertiesPayload, itemProperties, abilityRequirement]);

  // Calculate rarity and currency cost
  const { currencyCost, rarity } = useMemo(
    () => calculateCurrencyCostAndRarity(costs.totalCurrency, costs.totalIP),
    [costs.totalCurrency, costs.totalIP]
  );
  const advancedCalcRows = useMemo(
    () => [
      { label: 'Item points (IP)', value: formatCost(costs.totalIP) },
      { label: 'Training points (TP)', value: formatCost(costs.totalTP) },
      { label: 'Currency sum (C)', value: formatCost(costs.totalCurrency) },
      { label: 'Rarity', value: rarity },
      { label: 'Currency cost (final)', value: currencyCost.toLocaleString() },
    ],
    [costs.totalCurrency, costs.totalIP, costs.totalTP, currencyCost, rarity]
  );

  // Format damage for display
  const damageDisplay = useMemo(() => {
    if (armamentType !== 'Weapon' || damage.type === 'none' || damage.amount < 1) return '';
    return `${damage.amount}d${damage.size} ${damage.type}`;
  }, [armamentType, damage]);

  // Actions
  const addProperty = useCallback(() => {
    const armamentTypeLower = armamentType.toLowerCase();
    const selectableProps = itemProperties.filter((p: ItemProperty) => {
      // Exclude general properties
      if (isGeneralProperty(p)) return false;
      // Exclude mechanic properties; these are handled by dedicated UI (damage, DR, range, etc.)
      if (isMechanicProperty(p)) return false;
      // Include properties that match the armament type or have no type specified
      const propType = (p.type || '').toLowerCase();
      if (!propType || propType === 'general') return true;
      return propType === armamentTypeLower;
    });
    if (selectableProps.length === 0) return;
    
    // Find a property not already selected
    const available = selectableProps.find(
      (p: ItemProperty) => !selectedProperties.some((sp: SelectedProperty) => sp.property.id === p.id)
    ) || selectableProps[0];
    
    setSelectedProperties((prev) => [
      ...prev,
      {
        property: available,
        op_1_lvl: 0,
      },
    ]);
  }, [itemProperties, selectedProperties, armamentType]);

  const removeProperty = useCallback((index: number) => {
    setSelectedProperties((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateProperty = useCallback((index: number, updates: Partial<SelectedProperty>) => {
    setSelectedProperties((prev) =>
      prev.map((sp, i) => (i === index ? { ...sp, ...updates } : sp))
    );
  }, []);

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
          ? { id: abilityRequirement.id, name: abilityRequirement.name, level: abilityRequirement.level }
          : null,
      }),
      ...(armamentType === 'Armor' && {
        damageReduction,
        agilityReduction,
        criticalRangeIncrease,
        abilityRequirement: abilityRequirement
          ? { id: abilityRequirement.id, name: abilityRequirement.name, level: abilityRequirement.level }
          : null,
      }),
      ...(armamentType === 'Shield' && {
        isTwoHanded,
        shieldDR: { amount: shieldDR.amount, size: shieldDR.size },
        hasShieldDamage,
        shieldDamage: hasShieldDamage ? { amount: shieldDamage.amount, size: shieldDamage.size } : null,
      }),
    };
    return { name: name.trim(), data: itemData };
  }, [name, description, armamentType, propertiesPayload, damage, costs, rarity, imageId, imageUrl, isTwoHanded, rangeLevel, abilityRequirement, damageReduction, agilityReduction, criticalRangeIncrease, shieldDR, hasShieldDamage, shieldDamage]);

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

  const handleLoadItem = useCallback((item: ItemLibraryRecord) => {
    applyFormState(itemLibraryRecordToFormState(item, itemProperties));
    closeLoadModal();
    save.setSaveMessage({ type: 'success', text: 'Armament loaded successfully!' });
    setTimeout(() => save.setSaveMessage(null), 2000);
  }, [itemProperties, applyFormState, closeLoadModal, save]);


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
