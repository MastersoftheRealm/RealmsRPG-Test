/**
 * Armament Creator Page
 * =================
 * Tool for creating custom items (weapons, armor, shields) using the property system.
 * 
 * Features:
 * - Select item properties from RTDB database
 * - Configure option levels for each property
 * - Calculate IP, TP, and currency costs
 * - Automatic rarity calculation
 * - Save to user's library via Cloud Functions
 */

'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { X, Plus, ChevronDown, ChevronUp, Shield, Sword, Target, Info, Coins, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useItemProperties, useUserItems, type ItemProperty } from '@/hooks';
import { LoginPromptModal } from '@/components/shared';
import { LoadFromLibraryModal } from '@/components/creator/LoadFromLibraryModal';
import { NumberStepper } from '@/components/creator/number-stepper';
import { useAuthStore } from '@/stores';
import { db } from '@/lib/firebase/client';
import { collection, query, where, getDocs, addDoc, setDoc, doc } from 'firebase/firestore';
import {
  calculateItemCosts,
  calculateCurrencyCostAndRarity,
  isGeneralProperty,
  type ItemPropertyPayload,
  type ItemDamage,
} from '@/lib/calculators';
import { PROPERTY_IDS } from '@/lib/id-constants';

// =============================================================================
// Types
// =============================================================================

type ArmamentType = 'Weapon' | 'Armor' | 'Shield';

interface SelectedProperty {
  property: ItemProperty;
  op_1_lvl: number;
}

interface DamageConfig {
  amount: number;
  size: number;
  type: string;
}

// =============================================================================
// Constants
// =============================================================================

const ARMAMENT_TYPES: { value: ArmamentType; label: string; icon: typeof Sword }[] = [
  { value: 'Weapon', label: 'Weapon', icon: Sword },
  { value: 'Armor', label: 'Armor', icon: Shield },
  { value: 'Shield', label: 'Shield', icon: Shield },
];

const DAMAGE_TYPES = [
  'none', 'slashing', 'piercing', 'bludgeoning', 'fire', 'cold', 
  'lightning', 'acid', 'poison', 'necrotic', 'radiant', 'psychic'
];

const DIE_SIZES = [4, 6, 8, 10, 12];

const RARITY_COLORS: Record<string, string> = {
  Common: 'text-gray-600 bg-gray-100',
  Uncommon: 'text-green-600 bg-green-100',
  Rare: 'text-blue-600 bg-blue-100',
  Epic: 'text-purple-600 bg-purple-100',
  Legendary: 'text-amber-600 bg-amber-100',
  Mythic: 'text-red-600 bg-red-100',
  Ascended: 'text-pink-600 bg-pink-100',
};

// Ability requirement configurations for different armament types
const WEAPON_ABILITY_REQUIREMENTS = [
  { id: PROPERTY_IDS.WEAPON_STRENGTH_REQUIREMENT, name: 'Weapon Strength Requirement', label: 'STR' },
  { id: PROPERTY_IDS.WEAPON_AGILITY_REQUIREMENT, name: 'Weapon Agility Requirement', label: 'AGI' },
  { id: PROPERTY_IDS.WEAPON_VITALITY_REQUIREMENT, name: 'Weapon Vitality Requirement', label: 'VIT' },
  { id: PROPERTY_IDS.WEAPON_ACUITY_REQUIREMENT, name: 'Weapon Acuity Requirement', label: 'ACU' },
  { id: PROPERTY_IDS.WEAPON_INTELLIGENCE_REQUIREMENT, name: 'Weapon Intelligence Requirement', label: 'INT' },
  { id: PROPERTY_IDS.WEAPON_CHARISMA_REQUIREMENT, name: 'Weapon Charisma Requirement', label: 'CHA' },
];

const ARMOR_ABILITY_REQUIREMENTS = [
  { id: PROPERTY_IDS.ARMOR_STRENGTH_REQUIREMENT, name: 'Armor Strength Requirement', label: 'STR' },
  { id: PROPERTY_IDS.ARMOR_AGILITY_REQUIREMENT, name: 'Armor Agility Requirement', label: 'AGI' },
  { id: PROPERTY_IDS.ARMOR_VITALITY_REQUIREMENT, name: 'Armor Vitality Requirement', label: 'VIT' },
];

// LocalStorage key for caching item creator state
const ITEM_CREATOR_CACHE_KEY = 'realms-item-creator-cache';

// =============================================================================
// Subcomponents
// =============================================================================

function PropertyCard({
  selectedProperty,
  onRemove,
  onUpdate,
  allProperties,
  armamentType,
}: {
  selectedProperty: SelectedProperty;
  onRemove: () => void;
  onUpdate: (updates: Partial<SelectedProperty>) => void;
  allProperties: ItemProperty[];
  armamentType: ArmamentType;
}) {
  const [expanded, setExpanded] = useState(true);
  const { property } = selectedProperty;

  // Filter to selectable (non-general) properties that match the armament type
  const selectableProperties = useMemo(() => {
    const armamentTypeLower = armamentType.toLowerCase();
    return allProperties
      .filter((p) => {
        // Exclude general properties
        if (isGeneralProperty(p)) return false;
        // Include properties that match the armament type or have no type specified
        const propType = (p.type || '').toLowerCase();
        if (!propType || propType === 'general') return true;
        return propType === armamentTypeLower;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allProperties, armamentType]);

  // Calculate property's individual contribution
  const propTP =
    (property.base_tp || property.tp_cost || 0) +
    (property.op_1_tp || 0) * selectedProperty.op_1_lvl;

  const hasOption = property.op_1_desc && property.op_1_desc.trim() !== '';

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-gray-500 hover:text-gray-700"
          >
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          <span className="font-medium text-gray-900">{property.name}</span>
          {propTP > 0 && (
            <span className="text-sm text-purple-600 font-medium">TP: {propTP}</span>
          )}
          {(property.base_c || (property.op_1_c && selectedProperty.op_1_lvl > 0)) && (
            <span className="text-sm text-amber-600 font-medium">
              C: {((property.base_c || 0) + (property.op_1_c || 0) * selectedProperty.op_1_lvl).toFixed(2)}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-gray-400 hover:text-red-500"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 py-4 space-y-4">
          {/* Property Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Property
            </label>
            <select
              value={selectableProperties.findIndex((p) => p.id === property.id)}
              onChange={(e) => {
                const idx = parseInt(e.target.value);
                const newProp = selectableProperties[idx];
                if (newProp) {
                  onUpdate({ property: newProp, op_1_lvl: 0 });
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {selectableProperties.map((p, idx) => (
                <option key={p.id} value={idx}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600">{property.description}</p>

          {/* Option Level */}
          {hasOption && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  Option:{' '}
                  {property.op_1_tp && (
                    <span className="text-gray-500">
                      TP +{property.op_1_tp}/level
                    </span>
                  )}
                </span>
                <NumberStepper
                  value={selectedProperty.op_1_lvl}
                  onChange={(v) => onUpdate({ op_1_lvl: v })}
                  label="Level:"
                />
              </div>
              <p className="text-sm text-gray-600">{property.op_1_desc}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

// Cache interface for localStorage
interface ItemCreatorCache {
  name: string;
  description: string;
  armamentType: ArmamentType;
  selectedProperties: Array<{
    propertyId: string | number;
    op_1_lvl: number;
  }>;
  damage: DamageConfig;
  isTwoHanded: boolean;
  rangeLevel: number;
  damageReduction: number;
  agilityReduction: number;
  criticalRangeIncrease: number;
  shieldDR: { amount: number; size: number };
  hasShieldDamage: boolean;
  shieldDamage: { amount: number; size: number };
  abilityRequirement: { id: number; name: string; level: number } | null;
  timestamp: number;
}

function ItemCreatorContent() {
  const { user } = useAuthStore();
  
  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [armamentType, setArmamentType] = useState<ArmamentType>('Weapon');
  const [selectedProperties, setSelectedProperties] = useState<SelectedProperty[]>([]);
  const [damage, setDamage] = useState<DamageConfig>({ amount: 1, size: 4, type: 'slashing' });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [isTwoHanded, setIsTwoHanded] = useState(false);
  const [rangeLevel, setRangeLevel] = useState(0); // 0 = melee, 1+ = ranged (8 spaces per level)
  
  // Armor-specific state
  const [damageReduction, setDamageReduction] = useState(0); // Armor damage reduction (default 0)
  const [agilityReduction, setAgilityReduction] = useState(0); // Armor agility reduction
  const [criticalRangeIncrease, setCriticalRangeIncrease] = useState(0); // Armor critical range increase (default 0)
  
  // Shield-specific state - dice-based like weapon damage
  const [shieldDR, setShieldDR] = useState<{ amount: number; size: number }>({ amount: 1, size: 4 }); // Shield damage reduction (1d4 base)
  const [hasShieldDamage, setHasShieldDamage] = useState(false); // Optional shield damage
  const [shieldDamage, setShieldDamage] = useState<{ amount: number; size: number }>({ amount: 1, size: 4 }); // 1d4 bludgeoning
  
  // Ability requirements state - each armament can have one ability requirement
  const [abilityRequirement, setAbilityRequirement] = useState<{ id: number; name: string; level: number } | null>(null);

  // Fetch item properties
  const { data: itemProperties = [], isLoading, error } = useItemProperties();

  // Fetch user's saved items (only if user is logged in)
  const { 
    data: userItems = [], 
    isLoading: loadingUserItems, 
    error: userItemsError 
  } = useUserItems();

  // Load cached state from localStorage on mount
  useEffect(() => {
    // Prevent re-running after initial load to avoid overwriting user input
    if (isInitialized || itemProperties.length === 0) return;
    
    try {
      const cached = localStorage.getItem(ITEM_CREATOR_CACHE_KEY);
      if (cached) {
        const parsed: ItemCreatorCache = JSON.parse(cached);
        // Only use cache if it's less than 30 days old
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        if (Date.now() - parsed.timestamp < thirtyDays) {
          setName(parsed.name || '');
          setDescription(parsed.description || '');
          setArmamentType(parsed.armamentType || 'Weapon');
          setDamage(parsed.damage || { amount: 1, size: 4, type: 'slashing' });
          setIsTwoHanded(parsed.isTwoHanded || false);
          setRangeLevel(parsed.rangeLevel || 0);
          setDamageReduction(parsed.damageReduction || 0);
          setAgilityReduction(parsed.agilityReduction || 0);
          setCriticalRangeIncrease(parsed.criticalRangeIncrease || 0);
          setShieldDR(parsed.shieldDR || { amount: 1, size: 4 });
          setHasShieldDamage(parsed.hasShieldDamage || false);
          setShieldDamage(parsed.shieldDamage || { amount: 1, size: 4 });
          setAbilityRequirement(parsed.abilityRequirement || null);
          
          // Restore selected properties by finding them in itemProperties
          if (parsed.selectedProperties && parsed.selectedProperties.length > 0) {
            const restoredProps: SelectedProperty[] = [];
            for (const savedProp of parsed.selectedProperties) {
              const foundProp = itemProperties.find(p => String(p.id) === String(savedProp.propertyId));
              if (foundProp) {
                restoredProps.push({
                  property: foundProp,
                  op_1_lvl: savedProp.op_1_lvl,
                });
              }
            }
            setSelectedProperties(restoredProps);
          }
        } else {
          localStorage.removeItem(ITEM_CREATOR_CACHE_KEY);
        }
      }
    } catch (e) {
      console.error('Failed to load item creator cache:', e);
    }
    setIsInitialized(true);
  }, [itemProperties, isInitialized]);

  // Auto-save to localStorage when state changes
  useEffect(() => {
    if (!isInitialized) return;
    
    try {
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
        timestamp: Date.now(),
      };
      localStorage.setItem(ITEM_CREATOR_CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
      console.error('Failed to save item creator cache:', e);
    }
  }, [isInitialized, name, description, armamentType, selectedProperties, damage, isTwoHanded, rangeLevel, damageReduction, agilityReduction, criticalRangeIncrease, shieldDR, hasShieldDamage, shieldDamage, abilityRequirement]);

  // When armament type changes, filter out incompatible properties
  useEffect(() => {
    const armamentTypeLower = armamentType.toLowerCase();
    setSelectedProperties(prev => 
      prev.filter(sp => {
        const propType = (sp.property.type || '').toLowerCase();
        // Keep properties with no type, general type, or matching type
        if (!propType || propType === 'general') return true;
        return propType === armamentTypeLower;
      })
    );
    // Clear ability requirement when armament type changes (different types have different requirements)
    setAbilityRequirement(null);
  }, [armamentType]);

  // Range display string
  const rangeDisplay = useMemo(() => {
    if (rangeLevel === 0) return 'Melee';
    return `${rangeLevel * 8} spaces`;
  }, [rangeLevel]);

  // Convert selected properties to payload format for calculator
  // Including auto-generated properties for Weapon, Armor, and Shield
  const propertiesPayload: ItemPropertyPayload[] = useMemo(() => {
    const baseProps = selectedProperties.map((sp) => ({
      id: Number(sp.property.id),
      name: sp.property.name,
      op_1_lvl: sp.op_1_lvl,
    }));
    
    // === WEAPON PROPERTIES ===
    // Add Two-Handed property if weapon and selected
    if (armamentType === 'Weapon' && isTwoHanded) {
      const twoHandedProp = itemProperties.find(p => p.name === 'Two-Handed');
      if (twoHandedProp) {
        baseProps.push({ id: Number(twoHandedProp.id), name: 'Two-Handed', op_1_lvl: 0 });
      }
    }
    
    // Add Range property if weapon and ranged
    if (armamentType === 'Weapon' && rangeLevel > 0) {
      const rangeProp = itemProperties.find(p => p.name === 'Range');
      if (rangeProp) {
        baseProps.push({ id: Number(rangeProp.id), name: 'Range', op_1_lvl: rangeLevel - 1 });
      }
    }
    
    // Add Weapon Damage property if weapon has valid damage
    if (armamentType === 'Weapon' && damage.type !== 'none' && damage.amount >= 1) {
      const validSizes = [4, 6, 8, 10, 12];
      if (validSizes.includes(damage.size)) {
        const weaponDamageProp = itemProperties.find(p => 
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
            const splitDiceProp = itemProperties.find(p => 
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
      const armorBaseProp = itemProperties.find(p => p.name === 'Armor Base' || Number(p.id) === 16);
      if (armorBaseProp) {
        baseProps.push({ id: Number(armorBaseProp.id), name: armorBaseProp.name, op_1_lvl: 0 });
      }
      
      // Add Damage Reduction property (ID: 1) - armor must have at least 1 DR
      const drProp = itemProperties.find(p => p.name === 'Damage Reduction' || Number(p.id) === 1);
      if (drProp && damageReduction > 0) {
        baseProps.push({ id: Number(drProp.id), name: drProp.name, op_1_lvl: damageReduction - 1 });
      }
      
      // Add Agility Reduction property (ID: 5) if any
      if (agilityReduction > 0) {
        const arProp = itemProperties.find(p => p.name === 'Agility Reduction' || Number(p.id) === 5);
        if (arProp) {
          baseProps.push({ id: Number(arProp.id), name: arProp.name, op_1_lvl: agilityReduction - 1 });
        }
      }
      
      // Add Critical Range Increase property (ID: 22) if any
      if (criticalRangeIncrease > 0) {
        const critProp = itemProperties.find(p => p.name === 'Critical Range +1' || Number(p.id) === PROPERTY_IDS.CRITICAL_RANGE_PLUS_1);
        if (critProp) {
          baseProps.push({ id: Number(critProp.id), name: critProp.name, op_1_lvl: criticalRangeIncrease - 1 });
        }
      }
    }
    
    // === SHIELD PROPERTIES ===
    if (armamentType === 'Shield') {
      // Auto-add Shield Base property (ID: 15)
      const shieldBaseProp = itemProperties.find(p => p.name === 'Shield Base' || Number(p.id) === 15);
      if (shieldBaseProp) {
        baseProps.push({ id: Number(shieldBaseProp.id), name: shieldBaseProp.name, op_1_lvl: 0 });
      }
      
      // Shield Amount (damage reduction) - Property ID 39
      // Uses same formula as weapon damage: ((diceAmount * dieSize) - 4) / 2
      const validSizes = [4, 6, 8, 10, 12];
      if (validSizes.includes(shieldDR.size) && shieldDR.amount >= 1) {
        const shieldAmountProp = itemProperties.find(p => 
          p.name === 'Shield Amount' || Number(p.id) === PROPERTY_IDS.SHIELD_AMOUNT
        );
        if (shieldAmountProp) {
          const shieldDRLevel = Math.max(0, ((shieldDR.amount * shieldDR.size) - 4) / 2);
          baseProps.push({ id: Number(shieldAmountProp.id), name: 'Shield Amount', op_1_lvl: shieldDRLevel });
        }
      }
      
      // Shield Damage (optional) - Property ID 40
      if (hasShieldDamage && validSizes.includes(shieldDamage.size) && shieldDamage.amount >= 1) {
        const shieldDamageProp = itemProperties.find(p => 
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

  // Calculate rarity and currency cost
  const { currencyCost, rarity } = useMemo(
    () => calculateCurrencyCostAndRarity(costs.totalCurrency, costs.totalIP),
    [costs.totalCurrency, costs.totalIP]
  );

  // Format damage for display
  const damageDisplay = useMemo(() => {
    if (armamentType !== 'Weapon' || damage.type === 'none' || damage.amount < 1) return '';
    return `${damage.amount}d${damage.size} ${damage.type}`;
  }, [armamentType, damage]);

  // Actions
  const addProperty = useCallback(() => {
    const armamentTypeLower = armamentType.toLowerCase();
    const selectableProps = itemProperties.filter((p) => {
      // Exclude general properties
      if (isGeneralProperty(p)) return false;
      // Include properties that match the armament type or have no type specified
      const propType = (p.type || '').toLowerCase();
      if (!propType || propType === 'general') return true;
      return propType === armamentTypeLower;
    });
    if (selectableProps.length === 0) return;
    
    // Find a property not already selected
    const available = selectableProps.find(
      (p) => !selectedProperties.some((sp) => sp.property.id === p.id)
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

  const handleSave = async () => {
    if (!name.trim()) {
      setSaveMessage({ type: 'error', text: 'Please enter an item name' });
      return;
    }
    if (!user) {
      // Show login prompt modal instead of error message
      setShowLoginPrompt(true);
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    try {
      // Format properties for saving
      const propertiesToSave = selectedProperties.map((sp) => ({
        id: Number(sp.property.id),
        name: sp.property.name,
        op_1_lvl: sp.op_1_lvl,
      }));

      // Format damage
      const damageToSave: ItemDamage[] =
        armamentType === 'Weapon' && damage.type !== 'none' && damage.amount > 0
          ? [{ amount: damage.amount, size: damage.size, type: damage.type }]
          : [];

      // Prepare item data
      const itemData = {
        name: name.trim(),
        description: description.trim(),
        type: armamentType.toLowerCase(),
        properties: propertiesToSave,
        damage: damageToSave,
        costs: costs,
        rarity: rarity,
        updatedAt: new Date(),
      };

      // Save directly to Firestore - check for existing item with same name
      const libraryRef = collection(db, 'users', user.uid, 'itemLibrary');
      const q = query(libraryRef, where('name', '==', name.trim()));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        // Update existing item
        const docRef = doc(db, 'users', user.uid, 'itemLibrary', snapshot.docs[0].id);
        await setDoc(docRef, itemData);
      } else {
        // Create new item
        await addDoc(libraryRef, { ...itemData, createdAt: new Date() });
      }

      setSaveMessage({ type: 'success', text: 'Item saved successfully!' });
      
      // Reset form after short delay
      setTimeout(() => {
        setName('');
        setDescription('');
        setSelectedProperties([]);
        setDamage({ amount: 1, size: 6, type: 'slashing' });
        setSaveMessage(null);
      }, 2000);
    } catch (err) {
      console.error('Error saving item:', err);
      setSaveMessage({
        type: 'error',
        text: `Failed to save: ${(err as Error).message}`,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
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
    setSaveMessage(null);
    // Clear localStorage cache
    try {
      localStorage.removeItem(ITEM_CREATOR_CACHE_KEY);
    } catch (e) {
      console.error('Failed to clear item creator cache:', e);
    }
  };

  // Load an item from the library
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLoadItem = useCallback((item: any) => {
    // Set basic fields
    setName(item.name || '');
    setDescription(item.description || '');
    
    // Set armament type - map from stored type to ArmamentType
    const typeMap: Record<string, ArmamentType> = {
      'weapon': 'Weapon',
      'armor': 'Armor',
      'shield': 'Shield',
    };
    setArmamentType(typeMap[item.type?.toLowerCase()] || 'Weapon');
    
    // Load properties - match by id or name
    if (item.properties && Array.isArray(item.properties) && itemProperties.length > 0) {
      const loadedProperties: SelectedProperty[] = [];
      
      for (const prop of item.properties) {
        // Find matching property from database
        const matchingProp = itemProperties.find(
          (p) => p.id === String(prop.id) || p.name === prop.name
        );
        
        if (matchingProp) {
          loadedProperties.push({
            property: matchingProp,
            op_1_lvl: prop.op_1_lvl || 0,
          });
        }
      }
      
      setSelectedProperties(loadedProperties);
    } else {
      setSelectedProperties([]);
    }
    
    // Load damage configuration
    if (item.damage && Array.isArray(item.damage) && item.damage.length > 0) {
      const dmg = item.damage[0];
      setDamage({
        amount: dmg.amount || 1,
        size: dmg.size || 6,
        type: dmg.type || 'slashing',
      });
    } else {
      setDamage({ amount: 1, size: 6, type: 'slashing' });
    }
    
    // Close modal
    setShowLoadModal(false);
  }, [itemProperties]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700">Failed to load item properties: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Sword className="w-8 h-8 text-amber-600" />
            Armament Creator
          </h1>
          <p className="text-gray-600">
            Design custom weapons, armor, and shields by combining item properties. 
            Properties determine the item&apos;s rarity and cost.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => user ? setShowLoadModal(true) : setShowLoginPrompt(true)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
              user 
                ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                : "bg-gray-100 text-gray-400 cursor-pointer"
            )}
            title={user ? "Load from library" : "Log in to load from library"}
          >
            <FolderOpen className="w-5 h-5" />
            Load
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 transition-colors"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors',
              saving || !name.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            )}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Load from Library Modal */}
      <LoadFromLibraryModal
        isOpen={showLoadModal}
        onClose={() => setShowLoadModal(false)}
        onSelect={handleLoadItem}
        items={userItems}
        isLoading={loadingUserItems}
        error={userItemsError}
        itemType="item"
        title="Load Armament from Library"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Name & Type */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter item name..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {ARMAMENT_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setArmamentType(type.value)}
                      className={cn(
                        'py-2 px-3 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-1',
                        armamentType === type.value
                          ? 'bg-amber-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      )}
                    >
                      <type.icon className="w-4 h-4" />
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your item..."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Weapon Configuration - Handedness & Range */}
          {armamentType === 'Weapon' && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Weapon Configuration</h3>
              <div className="flex flex-wrap items-center gap-6">
                {/* Handedness Toggle */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">Handedness:</span>
                  <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setIsTwoHanded(false)}
                      className={cn(
                        "px-4 py-2 text-sm font-medium transition-colors",
                        !isTwoHanded
                          ? "bg-amber-600 text-white"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      One-Handed
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsTwoHanded(true)}
                      className={cn(
                        "px-4 py-2 text-sm font-medium transition-colors",
                        isTwoHanded
                          ? "bg-amber-600 text-white"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      Two-Handed
                    </button>
                  </div>
                </div>

                {/* Range Control */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">Range:</span>
                  <span className="font-medium text-amber-600 min-w-[80px]">{rangeDisplay}</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setRangeLevel(prev => Math.max(0, prev - 1))}
                      disabled={rangeLevel === 0}
                      className="w-8 h-8 flex items-center justify-center bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => setRangeLevel(prev => prev + 1)}
                      className="w-8 h-8 flex items-center justify-center bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                    >
                      +
                    </button>
                  </div>
                  {rangeLevel > 0 && (
                    <span className="text-xs text-gray-500">(8 spaces per level)</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Weapon Damage */}
          {armamentType === 'Weapon' && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Base Damage</h3>
              <div className="flex flex-wrap items-center gap-4">
                <NumberStepper
                  value={damage.amount}
                  onChange={(v) => setDamage((d) => ({ ...d, amount: v }))}
                  label="Dice:"
                  min={1}
                  max={10}
                />
                <div className="flex items-center gap-1">
                  <span className="font-bold text-lg">d</span>
                  <select
                    value={damage.size}
                    onChange={(e) => setDamage((d) => ({ ...d, size: parseInt(e.target.value) }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {DIE_SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
                <select
                  value={damage.type}
                  onChange={(e) => setDamage((d) => ({ ...d, type: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {DAMAGE_TYPES.filter((t) => t !== 'none').map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Armor Configuration */}
          {armamentType === 'Armor' && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Armor Configuration</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {/* Damage Reduction */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Damage Reduction
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setDamageReduction(Math.max(0, damageReduction - 1))}
                      className="w-10 h-10 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-bold text-lg transition-colors"
                    >
                      −
                    </button>
                    <span className="w-12 text-center text-2xl font-bold text-gray-900">
                      {damageReduction}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDamageReduction(Math.min(10, damageReduction + 1))}
                      className="w-10 h-10 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 font-bold text-lg transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Reduces physical damage taken</p>
                </div>
                
                {/* Agility Reduction */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agility Reduction
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setAgilityReduction(Math.max(0, agilityReduction - 1))}
                      className="w-10 h-10 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-bold text-lg transition-colors"
                    >
                      −
                    </button>
                    <span className="w-12 text-center text-2xl font-bold text-gray-900">
                      {agilityReduction}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAgilityReduction(Math.min(6, agilityReduction + 1))}
                      className="w-10 h-10 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 font-bold text-lg transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Reduces Agility for wearing this armor</p>
                </div>
                
                {/* Critical Range Increase */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Critical Range Increase
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCriticalRangeIncrease(Math.max(0, criticalRangeIncrease - 1))}
                      className="w-10 h-10 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-bold text-lg transition-colors"
                    >
                      −
                    </button>
                    <span className="w-12 text-center text-2xl font-bold text-gray-900">
                      {criticalRangeIncrease}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCriticalRangeIncrease(Math.min(6, criticalRangeIncrease + 1))}
                      className="w-10 h-10 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 font-bold text-lg transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Increases critical hit range</p>
                </div>
              </div>
            </div>
          )}

          {/* Shield Configuration */}
          {armamentType === 'Shield' && (
            <>
              {/* Shield Damage Reduction */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Shield Block (Damage Reduction)</h3>
                <div className="flex flex-wrap items-center gap-4">
                  <NumberStepper
                    value={shieldDR.amount}
                    onChange={(v) => setShieldDR((d) => ({ ...d, amount: v }))}
                    label="Dice:"
                    min={1}
                    max={10}
                  />
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-lg">d</span>
                    <select
                      value={shieldDR.size}
                      onChange={(e) => setShieldDR((d) => ({ ...d, size: parseInt(e.target.value) }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      {DIE_SIZES.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="text-sm text-gray-600">
                    ({shieldDR.amount}d{shieldDR.size} damage blocked)
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Damage blocked when using Shield reaction</p>
              </div>

              {/* Shield Damage (Optional) */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    id="hasShieldDamage"
                    checked={hasShieldDamage}
                    onChange={(e) => setHasShieldDamage(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <label htmlFor="hasShieldDamage" className="text-lg font-bold text-gray-900">
                    Shield Damage (Optional)
                  </label>
                </div>
                {hasShieldDamage && (
                  <>
                    <div className="flex flex-wrap items-center gap-4">
                      <NumberStepper
                        value={shieldDamage.amount}
                        onChange={(v) => setShieldDamage((d) => ({ ...d, amount: v }))}
                        label="Dice:"
                        min={1}
                        max={10}
                      />
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-lg">d</span>
                        <select
                          value={shieldDamage.size}
                          onChange={(e) => setShieldDamage((d) => ({ ...d, size: parseInt(e.target.value) }))}
                          className="px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          {DIE_SIZES.map((size) => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                        </select>
                      </div>
                      <span className="text-sm text-gray-600">Bludgeoning</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">This shield can deal {shieldDamage.amount}d{shieldDamage.size} bludgeoning damage as a melee weapon attack</p>
                  </>
                )}
                {!hasShieldDamage && (
                  <p className="text-sm text-gray-500">Enable to allow this shield to be used as a weapon</p>
                )}
              </div>
            </>
          )}

          {/* Ability Requirement (Optional) */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ability Requirement</h3>
            <p className="text-sm text-gray-600 mb-4">
              Require a minimum ability score to use this {armamentType.toLowerCase()} effectively.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <select
                  value={abilityRequirement?.id || ''}
                  onChange={(e) => {
                    if (!e.target.value) {
                      setAbilityRequirement(null);
                    } else {
                      const reqs = armamentType === 'Armor' ? ARMOR_ABILITY_REQUIREMENTS : WEAPON_ABILITY_REQUIREMENTS;
                      const req = reqs.find(r => r.id === parseInt(e.target.value));
                      if (req) {
                        setAbilityRequirement({ id: req.id, name: req.name, level: 1 });
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">None</option>
                  {(armamentType === 'Armor' ? ARMOR_ABILITY_REQUIREMENTS : WEAPON_ABILITY_REQUIREMENTS).map((req) => (
                    <option key={req.id} value={req.id}>
                      {req.label} ({req.name.replace(/Weapon |Armor /g, '').replace(' Requirement', '')})
                    </option>
                  ))}
                </select>
              </div>
              {abilityRequirement && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Level:</span>
                  <NumberStepper
                    value={abilityRequirement.level}
                    onChange={(v) => setAbilityRequirement(prev => prev ? { ...prev, level: v } : null)}
                    min={1}
                    max={6}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Item Properties */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Properties ({selectedProperties.length})
              </h3>
              <button
                type="button"
                onClick={addProperty}
                className="flex items-center gap-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Property
              </button>
            </div>

            {selectedProperties.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Info className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No properties added yet. Click &quot;Add Property&quot; to enhance your item.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedProperties.map((sp, idx) => (
                  <PropertyCard
                    key={idx}
                    selectedProperty={sp}
                    onRemove={() => removeProperty(idx)}
                    onUpdate={(updates) => updateProperty(idx, updates)}
                    allProperties={itemProperties}
                    armamentType={armamentType}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Cost Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Item Summary</h3>

            {/* Rarity Badge */}
            <div className="text-center mb-6">
              <span className={cn(
                'inline-block px-4 py-1 rounded-full font-bold text-lg',
                RARITY_COLORS[rarity] || RARITY_COLORS.Common
              )}>
                {rarity}
              </span>
            </div>

            {/* Cost Display */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-amber-50 rounded-lg p-4 text-center">
                <Coins className="w-6 h-6 mx-auto text-amber-600 mb-1" />
                <div className="text-2xl font-bold text-amber-600">{currencyCost.toLocaleString()}</div>
                <div className="text-xs text-amber-600">Currency Cost</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <Target className="w-6 h-6 mx-auto text-purple-600 mb-1" />
                <div className="text-2xl font-bold text-purple-600">{costs.totalTP}</div>
                <div className="text-xs text-purple-600">Training Points</div>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-2 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium">{armamentType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Item Points:</span>
                <span className="font-medium">{costs.totalIP} IP</span>
              </div>
              {armamentType === 'Weapon' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Handedness:</span>
                    <span className="font-medium">{isTwoHanded ? 'Two-Handed' : 'One-Handed'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Range:</span>
                    <span className="font-medium">{rangeDisplay}</span>
                  </div>
                </>
              )}
              {armamentType === 'Armor' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Damage Reduction:</span>
                    <span className="font-medium">{damageReduction}</span>
                  </div>
                  {agilityReduction > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Agility Reduction:</span>
                      <span className="font-medium text-red-600">-{agilityReduction}</span>
                    </div>
                  )}
                </>
              )}
              {armamentType === 'Shield' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shield Block:</span>
                    <span className="font-medium">{shieldDR.amount}d{shieldDR.size}</span>
                  </div>
                  {hasShieldDamage && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shield Damage:</span>
                      <span className="font-medium">{shieldDamage.amount}d{shieldDamage.size}</span>
                    </div>
                  )}
                </>
              )}
              {damageDisplay && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Damage:</span>
                  <span className="font-medium">{damageDisplay}</span>
                </div>
              )}
            </div>

            {/* Property Summary */}
            {selectedProperties.length > 0 && (
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Properties</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  {selectedProperties.map((sp, i) => (
                    <li key={i}>
                      • {sp.property.name}
                      {sp.op_1_lvl > 0 && ` (Lvl ${sp.op_1_lvl})`}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Save Message */}
            {saveMessage && (
              <div
                className={cn(
                  'mt-4 p-3 rounded-lg text-sm',
                  saveMessage.type === 'success'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                )}
              >
                {saveMessage.text}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Login Prompt Modal */}
      <LoginPromptModal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        returnPath="/item-creator"
        contentType="armament"
      />
    </div>
  );
}

export default function ItemCreatorPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <ItemCreatorContent />
    </div>
  );
}
