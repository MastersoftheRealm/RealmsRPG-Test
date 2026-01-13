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

import { useState, useMemo, useCallback } from 'react';
import { X, Plus, ChevronDown, ChevronUp, Shield, Sword, Target, Info, Coins, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProtectedRoute } from '@/components/layout';
import { useItemProperties, useUserItems, type ItemProperty } from '@/hooks';
import { LoadFromLibraryModal } from '@/components/creator/LoadFromLibraryModal';
import { NumberStepper } from '@/components/creator/number-stepper';
import { useAuthStore } from '@/stores';
import { functions } from '@/lib/firebase/client';
import { httpsCallable } from 'firebase/functions';
import {
  calculateItemCosts,
  calculateCurrencyCostAndRarity,
  isGeneralProperty,
  type ItemPropertyPayload,
  type ItemDamage,
} from '@/lib/calculators';

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

// =============================================================================
// Subcomponents
// =============================================================================

function PropertyCard({
  selectedProperty,
  onRemove,
  onUpdate,
  allProperties,
}: {
  selectedProperty: SelectedProperty;
  onRemove: () => void;
  onUpdate: (updates: Partial<SelectedProperty>) => void;
  allProperties: ItemProperty[];
}) {
  const [expanded, setExpanded] = useState(true);
  const { property } = selectedProperty;

  // Filter to selectable (non-general) properties
  const selectableProperties = useMemo(
    () => allProperties.filter((p) => !isGeneralProperty(p)).sort((a, b) => a.name.localeCompare(b.name)),
    [allProperties]
  );

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
                  variant="item"
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

function ItemCreatorContent() {
  const { user } = useAuthStore();
  
  // State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [armamentType, setArmamentType] = useState<ArmamentType>('Weapon');
  const [selectedProperties, setSelectedProperties] = useState<SelectedProperty[]>([]);
  const [damage, setDamage] = useState<DamageConfig>({ amount: 1, size: 6, type: 'slashing' });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [isTwoHanded, setIsTwoHanded] = useState(false);
  const [rangeLevel, setRangeLevel] = useState(0); // 0 = melee, 1+ = ranged (8 spaces per level)

  // Fetch item properties
  const { data: itemProperties = [], isLoading, error } = useItemProperties();

  // Fetch user's saved items
  const { 
    data: userItems = [], 
    isLoading: loadingUserItems, 
    error: userItemsError 
  } = useUserItems();

  // Range display string
  const rangeDisplay = useMemo(() => {
    if (rangeLevel === 0) return 'Melee';
    return `${rangeLevel * 8} spaces`;
  }, [rangeLevel]);

  // Convert selected properties to payload format for calculator
  // Including auto-generated Range and Two-Handed properties
  const propertiesPayload: ItemPropertyPayload[] = useMemo(() => {
    const baseProps = selectedProperties.map((sp) => ({
      id: Number(sp.property.id),
      name: sp.property.name,
      op_1_lvl: sp.op_1_lvl,
    }));
    
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
    
    return baseProps;
  }, [selectedProperties, armamentType, isTwoHanded, rangeLevel, itemProperties]);

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
    const selectableProps = itemProperties.filter((p) => !isGeneralProperty(p));
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
  }, [itemProperties, selectedProperties]);

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
      setSaveMessage({ type: 'error', text: 'You must be logged in to save' });
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    try {
      const saveItemToLibrary = httpsCallable(functions, 'saveItemToLibrary');
      
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

      await saveItemToLibrary({
        itemName: name.trim(),
        itemDescription: description.trim(),
        armamentType,
        properties: propertiesToSave,
        damage: damageToSave,
      });

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
    setSaveMessage(null);
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
        <button
          type="button"
          onClick={() => setShowLoadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
        >
          <FolderOpen className="w-5 h-5" />
          Load from Library
        </button>
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
        title="Load Item from Library"
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
                  variant="item"
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
                <span className="text-gray-600">Item Power:</span>
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
              {damageDisplay && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Damage:</span>
                  <span className="font-medium">{damageDisplay}</span>
                </div>
              )}
            </div>

            {/* Property Summary */}
            {selectedProperties.length > 0 && (
              <div className="border-t border-gray-100 pt-4 mb-6">
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
                  'mb-4 p-3 rounded-lg text-sm',
                  saveMessage.type === 'success'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                )}
              >
                {saveMessage.text}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !name.trim()}
                className={cn(
                  'w-full py-3 rounded-xl font-bold transition-colors',
                  saving || !name.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                )}
              >
                {saving ? 'Saving...' : 'Save to Library'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="w-full py-2 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ItemCreatorPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <ItemCreatorContent />
      </div>
    </ProtectedRoute>
  );
}
