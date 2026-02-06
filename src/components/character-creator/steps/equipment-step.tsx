/**
 * Equipment Step - Codex-Style
 * =============================
 * Select starting equipment with real data from Firebase.
 * Uses Codex-style filtering and list presentation.
 * - Weapons and Armor come from user's Firestore item library
 * - General equipment comes from RTDB items
 * Supports quantity selection for equipment items
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { cn, formatDamageDisplay } from '@/lib/utils';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { useEquipment, useUserItems, useItemProperties, type EquipmentItem } from '@/hooks';
import { deriveItemDisplay } from '@/lib/calculators/item-calc';
import { SearchInput, GridListRow, type ChipData } from '@/components/shared';
import { FilterSection, SelectFilter } from '@/components/codex';
import { Spinner, Button } from '@/components/ui';
import { TabNavigation } from '@/components/ui/tab-navigation';
import { AlertCircle, Swords, Check, Minus, Plus } from 'lucide-react';
import type { Item } from '@/types';

// Unarmed Prowess constants
const UNARMED_PROWESS_BASE_TP = 10;
const UNARMED_PROWESS_UPGRADE_TP = 6;
const UNARMED_PROWESS_LEVELS = [
  { level: 1, charLevel: 1, name: 'Unarmed Prowess', description: 'Your unarmed strikes deal damage equal to your Ability (STR or AGI, whichever is higher) and can use Strength or Agility for attack rolls.' },
  { level: 2, charLevel: 4, name: 'Unarmed Prowess II', description: 'Your unarmed damage increases to 1d2 + Ability.' },
  { level: 3, charLevel: 8, name: 'Unarmed Prowess III', description: 'Your unarmed damage increases to 1d4 + Ability.' },
  { level: 4, charLevel: 12, name: 'Unarmed Prowess IV', description: 'Your unarmed damage increases to 1d6 + Ability.' },
  { level: 5, charLevel: 16, name: 'Unarmed Prowess V', description: 'Your unarmed damage increases to 1d8 + Ability.' },
];

type EquipmentTabId = 'weapon' | 'armor' | 'equipment' | 'unarmed';

// Unified item type for display in equipment step
interface UnifiedEquipmentItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'equipment';
  description: string;
  damage?: string;
  armor_value?: number;
  gold_cost: number;
  currency: number;
  properties: string[];
  rarity?: string;
  source: 'library' | 'rtdb'; // Track where item came from
}

// Starting currency for new characters at level 1 is 200
const STARTING_CURRENCY = 200;

// Selected item type for our internal state with quantity
interface SelectedItem {
  id: string;
  name: string;
  type: string;
  cost: number;
  quantity: number;
  damage?: string | Array<{ amount?: number | string; size?: number | string; type?: string }>;
  armor?: number;
  properties: string[];
}

export function EquipmentStep() {
  const { draft, nextStep, prevStep, updateDraft } = useCharacterCreatorStore();
  // Fetch user's item library (weapons/armor) from Firestore
  const { data: userItems, isLoading: userItemsLoading } = useUserItems();
  // Fetch general equipment from RTDB
  const { data: rtdbEquipment, isLoading: rtdbLoading, error: rtdbError } = useEquipment();
  // Fetch item properties for deriving display data from user items
  const { data: itemProperties } = useItemProperties();
  
  const [activeTab, setActiveTab] = useState<EquipmentTabId>('weapon');
  const [searchTerm, setSearchTerm] = useState('');

  const isLoading = userItemsLoading || rtdbLoading;
  const error = rtdbError;

  // Current unarmed prowess level from draft (0 = not selected)
  const currentUnarmedProwess = draft.unarmedProwess || 0;
  
  // Calculate TP cost for unarmed prowess
  const unarmedProwessTPCost = useMemo(() => {
    if (currentUnarmedProwess === 0) return 0;
    return UNARMED_PROWESS_BASE_TP + (currentUnarmedProwess - 1) * UNARMED_PROWESS_UPGRADE_TP;
  }, [currentUnarmedProwess]);

  // Get available unarmed prowess levels based on character level
  // In character creator, only show levels that are actually available (filter out future levels)
  const availableUnarmedLevels = useMemo(() => {
    const charLevel = draft.level || 1;
    // Only show levels the character can actually select - hide higher levels entirely
    return UNARMED_PROWESS_LEVELS.filter(up => up.charLevel <= charLevel);
  }, [draft.level]);
  
  // Toggle unarmed prowess selection
  const toggleUnarmedProwess = useCallback(() => {
    const newLevel = currentUnarmedProwess === 0 ? 1 : 0;
    updateDraft({ unarmedProwess: newLevel });
  }, [currentUnarmedProwess, updateDraft]);

  // Upgrade unarmed prowess to a specific level
  const setUnarmedProwessLevel = useCallback((level: number) => {
    updateDraft({ unarmedProwess: level });
  }, [updateDraft]);

  // Combine user library items (weapons/armor) with RTDB general equipment
  const allEquipment = useMemo((): UnifiedEquipmentItem[] => {
    const items: UnifiedEquipmentItem[] = [];
    
    // Add weapons and armor from user's item library
    if (userItems && itemProperties) {
      for (const userItem of userItems) {
        // Get the raw data to access armamentType or type field
        const rawData = userItem as unknown as Record<string, unknown>;
        // Check both armamentType (old format) and type (new format from item creator)
        const armamentType = rawData.armamentType as string || '';
        const itemType = rawData.type as string || '';
        
        // Normalize to title case for comparison
        const normalizedType = armamentType || 
          (itemType.charAt(0).toUpperCase() + itemType.slice(1).toLowerCase());
        
        // Skip items that aren't weapons, shields, or armor
        if (!normalizedType || !['Weapon', 'Shield', 'Armor'].includes(normalizedType)) {
          continue;
        }
        
        // Derive display data using item-calc
        const display = deriveItemDisplay(
          {
            name: userItem.name,
            description: userItem.description,
            armamentType: normalizedType as 'Weapon' | 'Armor' | 'Shield',
            properties: userItem.properties?.map(p => ({
              id: p.id,
              name: p.name,
              op_1_lvl: p.op_1_lvl,
            })),
            damage: rawData.damage as { amount: number; size: number; type: string }[] | undefined,
          },
          itemProperties
        );
        
        // Map armamentType to our tab types
        let type: 'weapon' | 'armor' | 'equipment';
        if (normalizedType === 'Weapon' || normalizedType === 'Shield') {
          type = 'weapon';
        } else if (normalizedType === 'Armor') {
          type = 'armor';
        } else {
          type = 'equipment';
        }
        
        items.push({
          id: userItem.id,
          name: display.name,
          type,
          description: display.description,
          damage: display.damage || undefined,
          armor_value: display.damageReduction || undefined,
          gold_cost: display.currencyCost,
          currency: display.currencyCost,
          properties: display.proficiencies.map(p => p.name),
          rarity: display.rarity,
          source: 'library',
        });
      }
    }
    
    // Add all equipment from RTDB (weapons, armor, and general equipment)
    if (rtdbEquipment) {
      for (const item of rtdbEquipment) {
        // Use the actual type from RTDB (weapon, armor, or equipment)
        items.push({
          id: item.id,
          name: item.name,
          type: item.type, // Preserve the actual type from RTDB
          description: item.description || '',
          damage: item.damage,
          armor_value: item.armor_value,
          gold_cost: item.gold_cost || 0,
          currency: item.currency || item.gold_cost || 0,
          properties: item.properties || [],
          rarity: item.rarity,
          source: 'rtdb',
        });
      }
    }
    
    return items;
  }, [userItems, rtdbEquipment, itemProperties]);

  // Calculate starting currency - base 200 for level 1
  // For higher levels: 200 * 1.45^(level-1)
  const startingCurrency = useMemo(() => {
    const level = draft.level || 1;
    if (level <= 1) return STARTING_CURRENCY;
    return Math.round(STARTING_CURRENCY * Math.pow(1.45, level - 1));
  }, [draft.level]);
  
  // Get selected equipment from draft - use inventory array with quantity support
  const selectedItems = useMemo((): SelectedItem[] => {
    const inv = draft.equipment?.inventory || [];
    return inv.map(item => ({
      id: String(item.id),
      name: item.name,
      type: item.type || 'equipment',
      cost: item.cost || 0,
      quantity: item.quantity || 1,
      damage: item.damage,
      armor: item.armor,
      properties: Array.isArray(item.properties) 
        ? item.properties.map(p => typeof p === 'string' ? p : p.name) 
        : [],
    }));
  }, [draft.equipment?.inventory]);

  const spentCurrency = useMemo(() => {
    return selectedItems.reduce((sum: number, item) => sum + ((item.cost || 0) * (item.quantity || 1)), 0);
  }, [selectedItems]);

  const remainingCurrency = startingCurrency - spentCurrency;

  // Filter equipment by type and search
  const filteredEquipment = useMemo(() => {
    return allEquipment.filter(item => {
      if (item.type !== activeTab) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!item.name.toLowerCase().includes(term) &&
            !item.description?.toLowerCase().includes(term)) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [allEquipment, activeTab, searchTerm]);

  // Add item to inventory
  const addItem = useCallback((item: UnifiedEquipmentItem) => {
    const cost = item.gold_cost || item.currency || 0;
    if (cost > remainingCurrency) return;
    
    const currentInventory: Item[] = draft.equipment?.inventory || [];
    const existingIndex = currentInventory.findIndex(i => String(i.id) === item.id);
    
    if (existingIndex >= 0) {
      // Increase quantity
      const updated = [...currentInventory];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: (updated[existingIndex].quantity || 1) + 1,
      };
      updateDraft({
        equipment: {
          ...draft.equipment,
          inventory: updated,
        }
      });
    } else {
      // Add new item with quantity 1
      const newItem: Item = {
        id: item.id,
        name: item.name,
        type: item.type,
        cost: cost,
        quantity: 1,
        damage: item.damage,
        armor: item.armor_value,
        properties: item.properties,
      };
      
      updateDraft({
        equipment: {
          ...draft.equipment,
          inventory: [...currentInventory, newItem],
        }
      });
    }
  }, [draft.equipment, remainingCurrency, updateDraft]);

  // Remove item from inventory (decrease quantity or remove)
  const removeItem = useCallback((itemId: string) => {
    const currentInventory: Item[] = draft.equipment?.inventory || [];
    const existingIndex = currentInventory.findIndex(i => String(i.id) === itemId);
    
    if (existingIndex < 0) return;
    
    const existing = currentInventory[existingIndex];
    const currentQty = existing.quantity || 1;
    
    if (currentQty <= 1) {
      // Remove entirely
      updateDraft({
        equipment: {
          ...draft.equipment,
          inventory: currentInventory.filter(i => String(i.id) !== itemId),
        }
      });
    } else {
      // Decrease quantity
      const updated = [...currentInventory];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: currentQty - 1,
      };
      updateDraft({
        equipment: {
          ...draft.equipment,
          inventory: updated,
        }
      });
    }
  }, [draft.equipment, updateDraft]);

  // Get quantity of item in cart
  const getItemQuantity = useCallback((itemId: string): number => {
    const item = selectedItems.find(i => i.id === itemId);
    return item?.quantity || 0;
  }, [selectedItems]);

  // Save currency and proceed to next step
  const handleContinue = useCallback(() => {
    // Save the remaining currency to the draft
    updateDraft({
      currency: remainingCurrency,
    });
    nextStep();
  }, [remainingCurrency, updateDraft, nextStep]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto flex items-center justify-center py-12">
        <Spinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto text-center py-12">
        <p className="text-red-600 mb-4">Failed to load equipment data.</p>
        <Button variant="secondary" onClick={prevStep}>← Back</Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Choose Equipment</h1>
          <p className="text-text-secondary">
            Select your starting weapons, armor, and gear. Use + and - to adjust quantities.
          </p>
        </div>
        
        <div className={cn(
          'px-4 py-2 rounded-xl font-bold text-lg',
          remainingCurrency >= 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
        )}>
          {remainingCurrency} / {startingCurrency}c
        </div>
      </div>

      {/* Selected Items Summary */}
      {selectedItems.length > 0 && (
        <div className="bg-surface-alt rounded-xl p-4 mb-6">
          <h3 className="font-medium text-text-primary mb-2">Selected Equipment ({selectedItems.reduce((sum, i) => sum + i.quantity, 0)} items)</h3>
          <div className="flex flex-wrap gap-2">
            {selectedItems.map(item => (
              <span
                key={item.id}
                className="px-3 py-1 bg-surface border border-border-light rounded-full text-sm flex items-center gap-2"
              >
                {item.quantity > 1 && <span className="font-bold text-primary-600">{item.quantity}×</span>}
                {item.name}
                <span className="text-amber-600 text-xs">{item.cost * item.quantity}c</span>
                <button
                  onClick={() => removeItem(item.id)}
                  className="hover:text-red-500 ml-1"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Type Tabs */}
      <TabNavigation
        tabs={[
          { id: 'weapon', label: 'Weapons', count: allEquipment.filter(e => e.type === 'weapon').length },
          { id: 'armor', label: 'Armor', count: allEquipment.filter(e => e.type === 'armor').length },
          { id: 'equipment', label: 'Equipment', count: allEquipment.filter(e => e.type === 'equipment').length },
          { id: 'unarmed', label: currentUnarmedProwess > 0 ? `Unarmed Prowess (Lv ${currentUnarmedProwess})` : 'Unarmed Prowess' },
        ]}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as EquipmentTabId)}
        variant="pill"
        className="mb-4"
      />

      {/* Unarmed Prowess Tab Content */}
      {activeTab === 'unarmed' ? (
        <div className="border border-border-light rounded-lg mb-8 p-6 bg-surface">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-full bg-amber-100">
              <Swords className="w-8 h-8 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-text-primary mb-1">Unarmed Prowess</h3>
              <p className="text-text-secondary text-sm">
                Master the art of unarmed combat. Your fists become deadly weapons, 
                dealing increasing damage as you train. Upgrades become available at higher character levels.
              </p>
            </div>
          </div>

          {/* Prowess Levels - only show level 1 for character creation */}
          <div className="space-y-3">
            {availableUnarmedLevels.map((prowessLevel, idx) => {
              const isAvailable = prowessLevel.charLevel <= (draft.level || 1);
              const isSelected = currentUnarmedProwess >= prowessLevel.level;
              const tpCost = prowessLevel.level === 1 ? UNARMED_PROWESS_BASE_TP : UNARMED_PROWESS_UPGRADE_TP;
              const canSelect = isAvailable && (currentUnarmedProwess === prowessLevel.level - 1 || isSelected);
              
              return (
                <div
                  key={prowessLevel.level}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-lg border transition-all',
                    isSelected ? 'bg-primary-50 border-primary-300' : 'bg-surface border-border-light',
                    !isAvailable && 'opacity-50',
                    canSelect && !isSelected && 'hover:border-primary-300 cursor-pointer'
                  )}
                  onClick={() => {
                    if (!isAvailable) return;
                    if (isSelected) {
                      // Deselect - set to previous level
                      setUnarmedProwessLevel(prowessLevel.level - 1);
                    } else if (currentUnarmedProwess === prowessLevel.level - 1) {
                      // Select this level
                      setUnarmedProwessLevel(prowessLevel.level);
                    }
                  }}
                >
                  {/* Selection indicator */}
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                    isSelected ? 'bg-primary-600 text-white' : 'bg-surface-alt border border-border-light'
                  )}>
                    {isSelected && <Check className="w-4 h-4" />}
                  </div>

                  {/* Level info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary">{prowessLevel.name}</span>
                      {!isAvailable && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-surface-alt text-text-secondary">
                          Requires Level {prowessLevel.charLevel}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary mt-1">{prowessLevel.description}</p>
                  </div>

                  {/* TP Cost */}
                  <div className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-bold flex-shrink-0',
                    isSelected ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                  )}>
                    {tpCost} TP
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total TP Cost */}
          {currentUnarmedProwess > 0 && (
            <div className="mt-6 pt-4 border-t border-border-light flex items-center justify-between">
              <span className="text-text-secondary">Total Unarmed Prowess Cost:</span>
              <span className="text-lg font-bold text-primary-600">{unarmedProwessTPCost} TP</span>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="mb-4">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder={`Search ${activeTab}s by name or description...`}
            />
          </div>

          {/* Filters */}
          <FilterSection>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SelectFilter
                label="Source"
                value=""
                options={[
                  { value: '', label: 'All Sources' },
                  { value: 'library', label: 'My Library' },
                  { value: 'rtdb', label: 'Standard Equipment' },
                ]}
                onChange={() => {}}
                placeholder="All Sources"
              />
              
              <div className="filter-group">
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Budget Filter
                </label>
                <div className={cn(
                  'px-3 py-2 rounded-lg border text-sm',
                  remainingCurrency >= 0 
                    ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-600/50 text-green-700 dark:text-green-300'
                    : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-600/50 text-red-700 dark:text-red-300'
                )}>
                  {remainingCurrency}c remaining of {startingCurrency}c
                </div>
              </div>
            </div>
          </FilterSection>

          {/* Equipment List - Using GridListRow */}
          <div className="space-y-2 mb-8 max-h-[400px] overflow-y-auto pr-1">
            {filteredEquipment.length === 0 ? (
              <div className="text-center py-8 text-text-muted border border-border-light rounded-lg">
                {activeTab === 'weapon' || activeTab === 'armor' ? (
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="w-8 h-8 text-text-muted" />
                    <p>No {activeTab}s found in your library.</p>
                    <p className="text-sm">
                      Create {activeTab}s using the{' '}
                      <a href="/item-creator" className="text-primary-600 hover:underline">
                        Item Creator
                      </a>{' '}
                      to add them here.
                    </p>
                  </div>
                ) : (
                  <p>No {activeTab}s found.</p>
                )}
              </div>
            ) : (
              filteredEquipment.map(item => {
                const cost = item.gold_cost || item.currency || 0;
                const quantity = getItemQuantity(item.id);
                const canAfford = cost <= remainingCurrency;
                
                // Build badges for display
                const badges: Array<{ label: string; color: 'amber' | 'blue' | 'red' | 'gray' }> = [];
                if (item.damage) badges.push({ label: formatDamageDisplay(item.damage), color: 'red' });
                if (item.armor_value) badges.push({ label: `+${item.armor_value} DR`, color: 'blue' });
                if (item.rarity && item.rarity !== 'Common') badges.push({ label: item.rarity, color: 'amber' });
                
                // Build property chips
                const chips: ChipData[] = item.properties.map(prop => ({
                  name: prop,
                  category: 'tag' as const,
                }));
                
                // Quantity controls as left slot
                const quantityControls = (
                  <div className="flex items-center gap-1 px-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                      disabled={quantity === 0}
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center transition-colors',
                        quantity > 0
                          ? 'bg-surface-alt hover:bg-border-light text-text-secondary'
                          : 'bg-surface text-text-muted cursor-not-allowed'
                      )}
                      title="Remove one"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className={cn(
                      'w-6 text-center font-bold text-sm',
                      quantity > 0 ? 'text-primary-600' : 'text-text-muted'
                    )}>
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); addItem(item); }}
                      disabled={!canAfford}
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center transition-colors',
                        canAfford
                          ? 'bg-primary-100 text-primary-600 hover:bg-primary-200'
                          : 'bg-surface text-text-muted cursor-not-allowed'
                      )}
                      title={canAfford ? 'Add one' : 'Cannot afford'}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                );
                
                return (
                  <GridListRow
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    description={item.description}
                    leftSlot={quantityControls}
                    columns={[
                      { key: 'Cost', value: `${cost}c`, highlight: !canAfford, className: canAfford ? 'text-amber-600 font-bold' : 'text-red-500 font-bold' },
                      { key: 'Source', value: item.source === 'library' ? 'Library' : 'Standard', hideOnMobile: true },
                    ]}
                    badges={badges}
                    detailSections={chips.length > 0 ? [{ label: 'Properties', chips, hideLabelIfSingle: true }] : undefined}
                    compact
                  />
                );
              })
            )}
          </div>
        </>
      )}
      
      <div className="flex justify-between">
        <Button
          variant="secondary"
          onClick={prevStep}
        >
          ← Back
        </Button>
        <Button
          onClick={handleContinue}
        >
          Continue →
        </Button>
      </div>
    </div>
  );
}
