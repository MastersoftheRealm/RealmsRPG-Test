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

import { useState, useMemo, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, Plus, ChevronDown, ChevronUp, Shield, Sword, Target, Info, Coins, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useItemProperties, useUserItems, type ItemProperty } from '@/hooks';
import { LoginPromptModal } from '@/components/shared';
import { LoadingState, IconButton, Checkbox, Button, Alert, PageContainer, PageHeader } from '@/components/ui';
import { LoadFromLibraryModal } from '@/components/creator/LoadFromLibraryModal';
import { NumberStepper } from '@/components/creator/number-stepper';
import { CreatorSummaryPanel } from '@/components/creator';
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
// Shared Constants (imported from central location)
// =============================================================================

import {
  ALL_DAMAGE_TYPES as DAMAGE_TYPES,
  WEAPON_DAMAGE_TYPES,
  DIE_SIZES,
  RARITY_COLORS,
  CREATOR_CACHE_KEYS,
  formatCost,
} from '@/lib/game/creator-constants';

// LocalStorage key for caching item creator state
const ITEM_CREATOR_CACHE_KEY = CREATOR_CACHE_KEYS.ITEM;

// =============================================================================
// Item-specific Constants
// =============================================================================

const ARMAMENT_TYPES: { value: ArmamentType; label: string; icon: typeof Sword }[] = [
  { value: 'Weapon', label: 'Weapon', icon: Sword },
  { value: 'Armor', label: 'Armor', icon: Shield },
  { value: 'Shield', label: 'Shield', icon: Shield },
];

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
    <div className="bg-surface rounded-lg border border-border-light shadow-sm overflow-hidden">
      {/* Header - entire header clickable except X button */}
      <div className="bg-surface-alt px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left hover:bg-surface-alt/80 -ml-2 pl-2 py-1 rounded transition-colors"
        >
          <span className="text-text-muted">
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </span>
          <span className="font-medium text-text-primary truncate">{property.name}</span>
          <span className="flex items-center gap-2 text-sm font-semibold flex-shrink-0">
            {propTP > 0 && (
              <span className="text-tp">TP: {formatCost(propTP)}</span>
            )}
            {(property.base_c || (property.op_1_c && selectedProperty.op_1_lvl > 0)) && (
              <span className="text-amber-600">
                C: {formatCost((property.base_c || 0) + (property.op_1_c || 0) * selectedProperty.op_1_lvl)}
              </span>
            )}
          </span>
        </button>
        <IconButton
          onClick={onRemove}
          label="Remove property"
          variant="danger"
          size="sm"
        >
          <X className="w-5 h-5" />
        </IconButton>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 py-4 space-y-4">
          {/* Property Selection */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
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
              className="w-full px-3 py-2 border border-border-light rounded-lg text-sm"
            >
              {selectableProperties.map((p, idx) => (
                <option key={p.id} value={idx}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <p className="text-base text-text-primary leading-relaxed">{property.description}</p>

          {/* Option Level */}
          {hasOption && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-amber-800">Option</span>
                  {property.op_1_tp && (
                    <span className="text-sm font-medium text-tp">
                      TP +{formatCost(property.op_1_tp)}/level
                    </span>
                  )}
                  {property.op_1_c && (
                    <span className="text-sm font-medium text-amber-600">
                      C +{formatCost(property.op_1_c)}/level
                    </span>
                  )}
                </div>
                <NumberStepper
                  value={selectedProperty.op_1_lvl}
                  onChange={(v) => onUpdate({ op_1_lvl: v })}
                  label="Level:"
                />
              </div>
              <p className="text-sm text-text-primary">{property.op_1_desc}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Rarity Reference Table Component
// =============================================================================

const RARITY_REFERENCE = [
  { name: 'Common', ipRange: '0 – 4', baseCost: 25, color: 'text-text-secondary bg-neutral-100' },
  { name: 'Uncommon', ipRange: '4.01 – 6', baseCost: 100, color: 'text-green-700 bg-green-100' },
  { name: 'Rare', ipRange: '6.01 – 8', baseCost: 500, color: 'text-blue-700 bg-blue-100' },
  { name: 'Epic', ipRange: '8.01 – 11', baseCost: 2500, color: 'text-power-text bg-power-light' },
  { name: 'Legendary', ipRange: '11.01 – 14', baseCost: 10000, color: 'text-amber-700 bg-amber-100' },
  { name: 'Mythic', ipRange: '14.01 – 16', baseCost: 50000, color: 'text-red-700 bg-red-100' },
  { name: 'Ascended', ipRange: '16.01+', baseCost: 100000, color: 'text-pink-700 bg-pink-100' },
];

function RarityReferenceTable({ currentIP }: { currentIP: number }) {
  const [expanded, setExpanded] = useState(false);
  
  // Find current rarity based on IP
  const getCurrentRarity = () => {
    if (currentIP <= 4) return 'Common';
    if (currentIP <= 6) return 'Uncommon';
    if (currentIP <= 8) return 'Rare';
    if (currentIP <= 11) return 'Epic';
    if (currentIP <= 14) return 'Legendary';
    if (currentIP <= 16) return 'Mythic';
    return 'Ascended';
  };
  const currentRarity = getCurrentRarity();

  return (
    <div className="bg-surface rounded-xl shadow-md overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-surface-alt hover:bg-surface-alt/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-600" />
          <span className="font-medium text-text-primary">Rarity Reference</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      
      {expanded && (
        <div className="p-4">
          <p className="text-xs text-text-muted mb-3">
            IP (Item Power) determines rarity. Currency cost = Base Cost × (1 + 0.125 × C multiplier)
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light">
                <th className="text-left py-1 font-medium text-text-secondary">Rarity</th>
                <th className="text-right py-1 font-medium text-text-secondary">IP Range</th>
                <th className="text-right py-1 font-medium text-text-secondary">Base Gold</th>
              </tr>
            </thead>
            <tbody>
              {RARITY_REFERENCE.map((r) => (
                <tr 
                  key={r.name} 
                  className={cn(
                    'border-b border-border-light last:border-0',
                    currentRarity === r.name && 'font-semibold'
                  )}
                >
                  <td className="py-1.5">
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', r.color)}>
                      {r.name}
                    </span>
                    {currentRarity === r.name && (
                      <span className="ml-1 text-xs text-amber-600">← Current</span>
                    )}
                  </td>
                  <td className="text-right py-1.5 text-text-secondary">{r.ipRange}</td>
                  <td className="text-right py-1.5 text-amber-600">{r.baseCost.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
  const searchParams = useSearchParams();
  const editItemId = searchParams.get('edit');
  
  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
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

  // Load item for editing from URL parameter
  useEffect(() => {
    if (!editItemId || !userItems.length || !itemProperties.length || isInitialized) return;
    
    // Find the item to edit
    const itemToEdit = userItems.find(item => item.docId === editItemId || item.id === editItemId);
    if (!itemToEdit) {
      console.warn(`Item with ID ${editItemId} not found in library`);
      setIsInitialized(true);
      return;
    }
    
    // Populate form with item data
    setIsEditMode(true);
    setName(itemToEdit.name);
    setDescription(itemToEdit.description || '');
    
    // Set armament type
    const itemType = itemToEdit.type?.charAt(0).toUpperCase() + itemToEdit.type?.slice(1).toLowerCase();
    if (itemType === 'Weapon' || itemType === 'Armor' || itemType === 'Shield') {
      setArmamentType(itemType as ArmamentType);
    }
    
    // Restore damage config (for weapons)
    if (itemToEdit.damage && Array.isArray(itemToEdit.damage) && itemToEdit.damage.length > 0) {
      const dmg = itemToEdit.damage[0];
      setDamage({
        amount: Number(dmg.amount) || 1,
        size: Number(dmg.size) || 4,
        type: dmg.type || 'slashing',
      });
    }
    
    // Restore two-handed
    setIsTwoHanded(itemToEdit.isTwoHanded || false);
    
    // Restore range
    setRangeLevel(itemToEdit.rangeLevel || 0);
    
    // Restore armor-specific fields
    if (itemToEdit.armorValue !== undefined) {
      setDamageReduction(itemToEdit.armorValue);
    }
    if (itemToEdit.agilityReduction !== undefined) {
      setAgilityReduction(itemToEdit.agilityReduction);
    }
    if (itemToEdit.criticalRangeIncrease !== undefined) {
      setCriticalRangeIncrease(itemToEdit.criticalRangeIncrease);
    }
    
    // Restore ability requirement
    if (itemToEdit.abilityRequirement) {
      setAbilityRequirement({
        id: 0, // Will need to find the right property ID
        name: itemToEdit.abilityRequirement.name || '',
        level: itemToEdit.abilityRequirement.level || 0,
      });
    }
    
    // Restore properties
    if (itemToEdit.properties && itemToEdit.properties.length > 0) {
      const restoredProps: SelectedProperty[] = [];
      for (const savedProp of itemToEdit.properties) {
        const propId = typeof savedProp === 'string' ? null : savedProp.id;
        const propName = typeof savedProp === 'string' ? savedProp : savedProp.name;
        
        const foundProp = propId
          ? itemProperties.find(p => String(p.id) === String(propId))
          : itemProperties.find(p => p.name?.toLowerCase() === propName?.toLowerCase());
        
        if (foundProp) {
          restoredProps.push({
            property: foundProp,
            op_1_lvl: typeof savedProp === 'object' ? (savedProp.op_1_lvl || 0) : 0,
          });
        }
      }
      setSelectedProperties(restoredProps);
    }
    
    // Clear localStorage cache when loading for edit (don't want to mix with cached data)
    localStorage.removeItem(ITEM_CREATOR_CACHE_KEY);
    
    setIsInitialized(true);
  }, [editItemId, userItems, itemProperties, isInitialized]);

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

      // Prepare item data - include ALL configuration fields
      const itemData = {
        name: name.trim(),
        description: description.trim(),
        type: armamentType.toLowerCase(),
        properties: propertiesToSave,
        damage: damageToSave,
        costs: costs,
        rarity: rarity,
        updatedAt: new Date(),
        // Weapon-specific fields
        ...(armamentType === 'Weapon' && {
          isTwoHanded,
          rangeLevel,
          abilityRequirement: abilityRequirement ? {
            id: abilityRequirement.id,
            name: abilityRequirement.name,
            level: abilityRequirement.level,
          } : null,
        }),
        // Armor-specific fields
        ...(armamentType === 'Armor' && {
          damageReduction,
          agilityReduction,
          criticalRangeIncrease,
          abilityRequirement: abilityRequirement ? {
            id: abilityRequirement.id,
            name: abilityRequirement.name,
            level: abilityRequirement.level,
          } : null,
        }),
        // Shield-specific fields
        ...(armamentType === 'Shield' && {
          shieldDR: { amount: shieldDR.amount, size: shieldDR.size },
          hasShieldDamage,
          shieldDamage: hasShieldDamage ? { amount: shieldDamage.amount, size: shieldDamage.size } : null,
        }),
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
    const loadedType = typeMap[item.type?.toLowerCase()] || 'Weapon';
    setArmamentType(loadedType);
    
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
    
    // Load weapon-specific fields
    if (loadedType === 'Weapon') {
      setIsTwoHanded(item.isTwoHanded || false);
      setRangeLevel(item.rangeLevel || 0);
      if (item.abilityRequirement) {
        setAbilityRequirement({
          id: item.abilityRequirement.id,
          name: item.abilityRequirement.name,
          level: item.abilityRequirement.level || 0,
        });
      } else {
        setAbilityRequirement(null);
      }
    }
    
    // Load armor-specific fields
    if (loadedType === 'Armor') {
      setDamageReduction(item.damageReduction || 0);
      setAgilityReduction(item.agilityReduction || 0);
      setCriticalRangeIncrease(item.criticalRangeIncrease || 0);
      if (item.abilityRequirement) {
        setAbilityRequirement({
          id: item.abilityRequirement.id,
          name: item.abilityRequirement.name,
          level: item.abilityRequirement.level || 0,
        });
      } else {
        setAbilityRequirement(null);
      }
    }
    
    // Load shield-specific fields
    if (loadedType === 'Shield') {
      if (item.shieldDR) {
        setShieldDR({
          amount: item.shieldDR.amount || 1,
          size: item.shieldDR.size || 4,
        });
      }
      setHasShieldDamage(item.hasShieldDamage || false);
      if (item.shieldDamage) {
        setShieldDamage({
          amount: item.shieldDamage.amount || 1,
          size: item.shieldDamage.size || 4,
        });
      }
    }
    
    // Close modal
    setShowLoadModal(false);
  }, [itemProperties]);

  if (isLoading) {
    return (
      <PageContainer size="xl">
        <LoadingState message="Loading item properties..." />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer size="xl">
        <Alert variant="danger">
          Failed to load item properties: {error.message}
        </Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="xl">
      <PageHeader
        icon={<Sword className="w-8 h-8 text-amber-600" />}
        title="Armament Creator"
        description="Design custom weapons, armor, and shields by combining item properties. Properties determine the item's rarity and cost."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => user ? setShowLoadModal(true) : setShowLoginPrompt(true)}
              title={user ? "Load from library" : "Log in to load from library"}
            >
              <FolderOpen className="w-5 h-5" />
              Load
            </Button>
            <Button
              variant="secondary"
              onClick={handleReset}
            >
              Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              isLoading={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </>
        }
        className="mb-6"
      />

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
          <div className="bg-surface rounded-xl shadow-md p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter item name..."
                  className="w-full px-4 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
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
                          : 'bg-surface-alt hover:bg-surface text-text-secondary'
                      )}
                    >
                      <type.icon className="w-4 h-4" />
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your item..."
                  rows={2}
                  className="w-full px-4 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Weapon Configuration - Handedness & Range */}
          {armamentType === 'Weapon' && (
            <div className="bg-surface rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-text-primary mb-4">Weapon Configuration</h3>
              <div className="flex flex-wrap items-center gap-6">
                {/* Handedness Toggle */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-text-secondary">Handedness:</span>
                  <div className="flex rounded-lg border border-border-light overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setIsTwoHanded(false)}
                      className={cn(
                        "px-4 py-2 text-sm font-medium transition-colors",
                        !isTwoHanded
                          ? "bg-amber-600 text-white"
                          : "bg-surface-alt text-text-secondary hover:bg-surface"
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
                          : "bg-surface-alt text-text-secondary hover:bg-surface"
                      )}
                    >
                      Two-Handed
                    </button>
                  </div>
                </div>

                {/* Range Control */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-text-secondary">Range:</span>
                  <span className="font-medium text-amber-600 min-w-[80px]">{rangeDisplay}</span>
                  <NumberStepper
                    value={rangeLevel}
                    onChange={setRangeLevel}
                    min={0}
                    max={20}
                    size="sm"
                  />
                  {rangeLevel > 0 && (
                    <span className="text-xs text-text-muted">(8 spaces per level)</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Weapon Damage */}
          {armamentType === 'Weapon' && (
            <div className="bg-surface rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-text-primary mb-4">Base Damage</h3>
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
                    className="px-3 py-2 border border-border-light rounded-lg"
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
                  className="px-3 py-2 border border-border-light rounded-lg"
                >
                  {WEAPON_DAMAGE_TYPES.map((type) => (
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
            <div className="bg-surface rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-text-primary mb-4">Armor Configuration</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {/* Damage Reduction */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Damage Reduction
                  </label>
                  <NumberStepper
                    value={damageReduction}
                    onChange={setDamageReduction}
                    min={0}
                    max={10}
                    size="lg"
                  />
                  <p className="text-xs text-text-muted mt-1">Reduces physical damage taken</p>
                </div>
                
                {/* Agility Reduction */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Agility Reduction
                  </label>
                  <NumberStepper
                    value={agilityReduction}
                    onChange={setAgilityReduction}
                    min={0}
                    max={6}
                    size="lg"
                  />
                  <p className="text-xs text-text-muted mt-1">Reduces Agility for wearing this armor</p>
                </div>
                
                {/* Critical Range Increase */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Critical Range Increase
                  </label>
                  <NumberStepper
                    value={criticalRangeIncrease}
                    onChange={setCriticalRangeIncrease}
                    min={0}
                    max={6}
                    size="lg"
                  />
                  <p className="text-xs text-text-muted mt-1">Increases critical hit range</p>
                </div>
              </div>
            </div>
          )}

          {/* Shield Configuration */}
          {armamentType === 'Shield' && (
            <>
              {/* Shield Damage Reduction */}
              <div className="bg-surface rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-text-primary mb-4">Shield Block (Damage Reduction)</h3>
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
                      className="px-3 py-2 border border-border-light rounded-lg"
                    >
                      {DIE_SIZES.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="text-sm text-text-secondary">
                    ({shieldDR.amount}d{shieldDR.size} damage blocked)
                  </span>
                </div>
                <p className="text-xs text-text-muted mt-2">Damage blocked when using Shield reaction</p>
              </div>

              {/* Shield Damage (Optional) */}
              <div className="bg-surface rounded-xl shadow-md p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Checkbox
                    id="hasShieldDamage"
                    checked={hasShieldDamage}
                    onChange={(e) => setHasShieldDamage(e.target.checked)}
                    label="Shield Damage (Optional)"
                    className="text-lg font-bold"
                  />
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
                          className="px-3 py-2 border border-border-light rounded-lg"
                        >
                          {DIE_SIZES.map((size) => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                        </select>
                      </div>
                      <span className="text-sm text-text-secondary">Bludgeoning</span>
                    </div>
                    <p className="text-xs text-text-muted mt-2">This shield can deal {shieldDamage.amount}d{shieldDamage.size} bludgeoning damage as a melee weapon attack</p>
                  </>
                )}
                {!hasShieldDamage && (
                  <p className="text-sm text-text-muted">Enable to allow this shield to be used as a weapon</p>
                )}
              </div>
            </>
          )}

          {/* Ability Requirement (Optional) */}
          <div className="bg-surface rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Ability Requirement</h3>
            <p className="text-sm text-text-secondary mb-4">
              Require a minimum Ability to use this {armamentType.toLowerCase()} effectively.
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
                  className="w-full px-3 py-2 border border-border-light rounded-lg"
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
                  <span className="text-sm font-medium text-text-secondary">Level:</span>
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
          <div className="bg-surface rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text-primary">
                Properties ({selectedProperties.length})
              </h3>
              <Button
                type="button"
                variant="primary"
                className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700"
                onClick={addProperty}
              >
                <Plus className="w-4 h-4" />
                Add Property
              </Button>
            </div>

            {selectedProperties.length === 0 ? (
              <div className="text-center py-8 text-text-muted">
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

        {/* Sidebar - Cost Summary (sticky to match creature creator) */}
        <div className="self-start sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto space-y-6">
          <CreatorSummaryPanel
            title="Item Summary"
            badge={{
              label: rarity,
              className: RARITY_COLORS[rarity] || RARITY_COLORS.Common,
            }}
            costStats={[
              { label: 'Currency Cost', value: currencyCost, icon: <Coins className="w-6 h-6" />, color: 'currency' },
              { label: 'Training Points', value: costs.totalTP, icon: <Target className="w-6 h-6" />, color: 'tp' },
            ]}
            statRows={[
              { label: 'Type', value: armamentType },
              { label: 'Item Points', value: `${formatCost(costs.totalIP)} IP` },
              ...(armamentType === 'Weapon' ? [
                { label: 'Handedness', value: isTwoHanded ? 'Two-Handed' : 'One-Handed' },
                { label: 'Range', value: rangeDisplay },
              ] : []),
              ...(armamentType === 'Armor' ? [
                { label: 'Damage Reduction', value: String(damageReduction) },
                ...(agilityReduction > 0 ? [{ label: 'Agility Reduction', value: `-${agilityReduction}`, valueColor: 'text-red-600' }] : []),
              ] : []),
              ...(armamentType === 'Shield' ? [
                { label: 'Shield Block', value: `${shieldDR.amount}d${shieldDR.size}` },
                ...(hasShieldDamage ? [{ label: 'Shield Damage', value: `${shieldDamage.amount}d${shieldDamage.size}` }] : []),
              ] : []),
              ...(damageDisplay ? [{ label: 'Damage', value: damageDisplay }] : []),
            ]}
            breakdowns={selectedProperties.length > 0 ? [
              { 
                title: 'Properties', 
                items: selectedProperties.map(sp => ({
                  label: sp.property.name,
                  detail: sp.op_1_lvl > 0 ? `Lvl ${sp.op_1_lvl}` : undefined,
                }))
              }
            ] : undefined}
          >
            {/* Save Message */}
            {saveMessage && (
              <Alert 
                variant={saveMessage.type === 'success' ? 'success' : 'danger'}
              >
                {saveMessage.text}
              </Alert>
            )}
          </CreatorSummaryPanel>
          
          {/* Rarity Reference Table */}
          <RarityReferenceTable currentIP={costs.totalIP} />
        </div>
      </div>

      {/* Login Prompt Modal */}
      <LoginPromptModal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        returnPath="/item-creator"
        contentType="armament"
      />
    </PageContainer>
  );
}

export default function ItemCreatorPage() {
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
        <ItemCreatorContent />
      </Suspense>
    </div>
  );
}
