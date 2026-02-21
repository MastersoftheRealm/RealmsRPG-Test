/**
 * Equipment Step - Unified List Style
 * ===================================
 * Select starting equipment with real data from Codex.
 * Uses ListHeader, GridListRow, design tokens, and steppers on the right
 * to match Library/Codex and the rest of the site.
 * - Weapons and Armor come from user's item library (Prisma)
 * - General equipment comes from Codex items
 * Supports quantity selection for equipment items
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { cn, formatDamageDisplay } from '@/lib/utils';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { useEquipment, useUserItems, useItemProperties, usePublicLibrary } from '@/hooks';
import { deriveItemDisplay } from '@/lib/calculators/item-calc';
import { toggleSort, sortByColumn } from '@/hooks/use-sort';
import {
  SearchInput,
  GridListRow,
  QuantitySelector,
  ListHeader,
  SourceFilter,
  type ChipData,
  type ListColumn,
  type SortState,
} from '@/components/shared';
import type { SourceFilterValue } from '@/components/shared/filters/source-filter';
import { FilterSection } from '@/components/codex';
import { Spinner, Button, EmptyState } from '@/components/ui';
import { TabNavigation } from '@/components/ui/tab-navigation';
import { AlertCircle, Swords, Check } from 'lucide-react';
import type { Item } from '@/types';

// List column definitions and grid (unified with Library/Codex)
const WEAPON_LIST_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: '1.2fr' },
  { key: 'damage', label: 'Damage', width: '0.9fr', align: 'center' },
  { key: 'gold_cost', label: 'Cost', width: '0.6fr', align: 'right' },
  { key: 'source', label: 'Source', width: '0.6fr', align: 'center' },
];
const WEAPON_LIST_GRID = '1.2fr 0.9fr 0.6fr 0.6fr';

const ARMOR_LIST_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: '1.2fr' },
  { key: 'armor_value', label: 'DR', width: '0.9fr', align: 'center' },
  { key: 'gold_cost', label: 'Cost', width: '0.6fr', align: 'right' },
  { key: 'source', label: 'Source', width: '0.6fr', align: 'center' },
];
const ARMOR_LIST_GRID = '1.2fr 0.9fr 0.6fr 0.6fr';

const EQUIPMENT_LIST_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: '1.2fr' },
  { key: 'gold_cost', label: 'Cost', width: '0.6fr', align: 'right' },
  { key: 'source', label: 'Source', width: '0.6fr', align: 'center' },
];
const EQUIPMENT_LIST_GRID = '1.2fr 0.6fr 0.6fr';

// Unarmed Prowess constants
const UNARMED_PROWESS_BASE_TP = 10;
const UNARMED_PROWESS_UPGRADE_TP = 6;
const UNARMED_PROWESS_LEVELS = [
  { level: 1, charLevel: 1, name: 'Unarmed Prowess', description: 'Your unarmed strikes deal damage equal to your Attack Bonus (Ability + Martial Proficiency). Use Strength or Agility (whichever is higher) for attack and damage.' },
  { level: 2, charLevel: 4, name: 'Unarmed Prowess II', description: 'Your unarmed damage increases to 1d2 + Attack Bonus (Ability + Martial Proficiency).' },
  { level: 3, charLevel: 8, name: 'Unarmed Prowess III', description: 'Your unarmed damage increases to 1d4 + Attack Bonus (Ability + Martial Proficiency).' },
  { level: 4, charLevel: 12, name: 'Unarmed Prowess IV', description: 'Your unarmed damage increases to 1d6 + Attack Bonus (Ability + Martial Proficiency).' },
  { level: 5, charLevel: 16, name: 'Unarmed Prowess V', description: 'Your unarmed damage increases to 1d8 + Attack Bonus (Ability + Martial Proficiency).' },
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
  source: 'library' | 'codex' | 'public'; // Track where item came from
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
  // Fetch user's item library (weapons/armor) from API
  const { data: userItems, isLoading: userItemsLoading } = useUserItems();
  // Fetch general equipment from Codex
  const { data: codexEquipment, isLoading: codexLoading, error: codexError } = useEquipment();
  // Fetch item properties for deriving display data from user items
  const { data: itemProperties } = useItemProperties();
  
  const [activeTab, setActiveTab] = useState<EquipmentTabId>('weapon');
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilterValue>('all');
  const [equipmentSort, setEquipmentSort] = useState<SortState>({ col: 'name', dir: 1 });

  const { data: publicItems = [], isLoading: publicItemsLoading } = usePublicLibrary('items');

  const isLoading = userItemsLoading || codexLoading || publicItemsLoading;
  const error = codexError;

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

  // Combine user library items (weapons/armor) with Codex general equipment
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
    if (codexEquipment) {
      for (const item of codexEquipment) {
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
          source: 'codex',
        });
      }
    }

    // Add public library items (weapons, armor, equipment) — same shape as user library
    if (publicItems.length > 0 && itemProperties) {
      for (const pub of publicItems as Array<Record<string, unknown>>) {
        const rawType = (pub.type || pub.armamentType || '') as string;
        const normalizedType = rawType ? rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase() : '';
        let type: 'weapon' | 'armor' | 'equipment';
        if (normalizedType === 'Weapon' || normalizedType === 'Shield') {
          type = 'weapon';
        } else if (normalizedType === 'Armor') {
          type = 'armor';
        } else {
          type = 'equipment';
        }
        const display = deriveItemDisplay(
          {
            name: String(pub.name ?? ''),
            description: String(pub.description ?? ''),
            armamentType: (normalizedType || 'Weapon') as 'Weapon' | 'Armor' | 'Shield',
            properties: (Array.isArray(pub.properties) ? pub.properties : []).map((p: unknown) => {
              const q = p as { id?: number | string; name?: string; op_1_lvl?: number };
              const id = q.id != null ? (typeof q.id === 'number' ? q.id : parseInt(String(q.id), 10)) : undefined;
              return { id: Number.isNaN(id as number) ? undefined : id, name: q.name, op_1_lvl: q.op_1_lvl };
            }),
            damage: pub.damage as { amount: number; size: number; type: string }[] | undefined,
          },
          itemProperties
        );
        items.push({
          id: String(pub.id ?? pub.docId ?? ''),
          name: display.name,
          type,
          description: display.description,
          damage: display.damage || undefined,
          armor_value: display.damageReduction || undefined,
          gold_cost: display.currencyCost,
          currency: display.currencyCost,
          properties: display.proficiencies.map(p => p.name),
          rarity: display.rarity,
          source: 'public',
        });
      }
    }

    return items;
  }, [userItems, codexEquipment, publicItems, itemProperties]);

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

  // Filter equipment by type, search, and source (All / Public / My — My = library only)
  const filteredEquipment = useMemo(() => {
    return allEquipment.filter(item => {
      if (item.type !== activeTab) return false;
      if (sourceFilter === 'my' && item.source !== 'library') return false;
      if (sourceFilter === 'public' && item.source !== 'public') return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const name = String(item.name ?? '');
        const desc = String(item.description ?? '');
        if (!name.toLowerCase().includes(term) && !desc.toLowerCase().includes(term)) {
          return false;
        }
      }
      return true;
    });
  }, [allEquipment, activeTab, searchTerm, sourceFilter]);

  // Sorted list (unified sort via ListHeader)
  const sortedEquipment = useMemo(
    () => sortByColumn(filteredEquipment, equipmentSort),
    [filteredEquipment, equipmentSort]
  );

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
          'px-4 py-2 rounded-xl font-bold text-lg border',
          remainingCurrency >= 0
            ? 'bg-tp-light dark:bg-warning-900/30 border-tp-border text-tp-text dark:text-warning-300'
            : 'bg-danger-50 dark:bg-danger-900/30 border-danger-200 dark:border-danger-600/50 text-danger-700 dark:text-danger-300'
        )}>
          {remainingCurrency} / {startingCurrency}c
        </div>
      </div>

      {/* Selected Items Summary */}
      {selectedItems.length > 0 && (
        <div className="bg-surface-alt dark:bg-surface rounded-xl border border-border-light p-4 mb-6">
          <h3 className="font-medium text-text-primary mb-2">Selected Equipment ({selectedItems.reduce((sum, i) => sum + i.quantity, 0)} items)</h3>
          <div className="flex flex-wrap gap-2">
            {selectedItems.map(item => (
              <span
                key={item.id}
                className="px-3 py-1 bg-surface dark:bg-surface-alt border border-border-light rounded-full text-sm flex items-center gap-2 text-text-primary"
              >
                {item.quantity > 1 && <span className="font-bold text-primary-600 dark:text-primary-400">{item.quantity}×</span>}
                {item.name}
                <span className="text-tp-text dark:text-warning-400 text-xs">{item.cost * item.quantity}c</span>
                <button
                  onClick={() => removeItem(item.id)}
                  className="hover:text-danger-500 dark:hover:text-danger-400 ml-1"
                  aria-label={`Remove ${item.name}`}
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
            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
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
                    isSelected ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-300 dark:border-primary-600/50' : 'bg-surface border-border-light',
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
              <SourceFilter value={sourceFilter} onChange={setSourceFilter} />
              
              <div className="filter-group">
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Budget
                </label>
                <div className={cn(
                  'px-3 py-2 rounded-lg border text-sm',
                  remainingCurrency >= 0
                    ? 'bg-success-50 dark:bg-success-900/30 border-success-200 dark:border-success-600/50 text-success-700 dark:text-success-400'
                    : 'bg-danger-50 dark:bg-danger-900/30 border-danger-200 dark:border-danger-600/50 text-danger-700 dark:text-danger-300'
                )}>
                  {remainingCurrency}c remaining of {startingCurrency}c
                </div>
              </div>
            </div>
          </FilterSection>

          {/* Equipment List - ListHeader + GridListRow (unified with Library/Codex) */}
          <div className="border border-border-light rounded-lg overflow-hidden bg-surface mb-8">
            {activeTab === 'weapon' && sortedEquipment.length > 0 && (
              <ListHeader
                columns={WEAPON_LIST_COLUMNS}
                gridColumns={WEAPON_LIST_GRID}
                sortState={equipmentSort}
                onSort={(col) => setEquipmentSort(toggleSort(equipmentSort, col))}
              />
            )}
            {activeTab === 'armor' && sortedEquipment.length > 0 && (
              <ListHeader
                columns={ARMOR_LIST_COLUMNS}
                gridColumns={ARMOR_LIST_GRID}
                sortState={equipmentSort}
                onSort={(col) => setEquipmentSort(toggleSort(equipmentSort, col))}
              />
            )}
            {activeTab === 'equipment' && sortedEquipment.length > 0 && (
              <ListHeader
                columns={EQUIPMENT_LIST_COLUMNS}
                gridColumns={EQUIPMENT_LIST_GRID}
                sortState={equipmentSort}
                onSort={(col) => setEquipmentSort(toggleSort(equipmentSort, col))}
              />
            )}
            <div className="space-y-1 max-h-[400px] overflow-y-auto p-1">
              {sortedEquipment.length === 0 ? (
                <EmptyState
                  size="md"
                  title={activeTab === 'weapon' || activeTab === 'armor' ? `No ${activeTab}s found` : 'No equipment found'}
                  description={
                    activeTab === 'weapon' || activeTab === 'armor'
                      ? `Create ${activeTab}s in the Item Creator to add them here.`
                      : undefined
                  }
                  icon={<AlertCircle className="w-8 h-8 text-text-muted" />}
                  action={
                    activeTab === 'weapon' || activeTab === 'armor'
                      ? { label: 'Open Item Creator', onClick: () => window.open('/item-creator', '_blank'), variant: 'secondary' as const }
                      : undefined
                  }
                />
              ) : (
                sortedEquipment.map(item => {
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

                  // Stepper on the right (unified with Library)
                  const maxAffordable = cost > 0 ? quantity + Math.floor(remainingCurrency / cost) : 99;
                  const rightSlotContent = (
                    <QuantitySelector
                      quantity={quantity}
                      onChange={(newVal) => {
                        const diff = newVal - quantity;
                        if (diff > 0) {
                          for (let i = 0; i < diff; i++) addItem(item);
                        } else {
                          for (let i = 0; i < -diff; i++) removeItem(item.id);
                        }
                      }}
                      min={0}
                      max={Math.min(99, maxAffordable)}
                      size="sm"
                    />
                  );

                  const sourceValue = item.source === 'library' ? 'Library' : item.source === 'public' ? 'Public' : 'Standard';
                  const costColumn = {
                    key: 'gold_cost',
                    value: `${cost}c`,
                    highlight: !canAfford,
                    className: canAfford ? 'text-tp-text dark:text-warning-400 font-bold' : 'text-danger-600 dark:text-danger-400 font-bold',
                    align: 'right' as const,
                  };
                  const sourceColumn = {
                    key: 'source',
                    value: sourceValue,
                    hideOnMobile: true,
                    align: 'center' as const,
                  };

                  if (activeTab === 'weapon') {
                    return (
                      <GridListRow
                        key={item.id}
                        id={item.id}
                        name={item.name}
                        description={item.description}
                        columns={[
                          { key: 'damage', value: item.damage ? formatDamageDisplay(item.damage) : '-', align: 'center' },
                          costColumn,
                          sourceColumn,
                        ]}
                        gridColumns={WEAPON_LIST_GRID}
                        badges={badges}
                        detailSections={chips.length > 0 ? [{ label: 'Properties', chips, hideLabelIfSingle: true }] : undefined}
                        rightSlot={rightSlotContent}
                        compact
                      />
                    );
                  }
                  if (activeTab === 'armor') {
                    return (
                      <GridListRow
                        key={item.id}
                        id={item.id}
                        name={item.name}
                        description={item.description}
                        columns={[
                          { key: 'armor_value', value: item.armor_value != null ? `+${item.armor_value}` : '-', align: 'center' },
                          costColumn,
                          sourceColumn,
                        ]}
                        gridColumns={ARMOR_LIST_GRID}
                        badges={badges}
                        detailSections={chips.length > 0 ? [{ label: 'Properties', chips, hideLabelIfSingle: true }] : undefined}
                        rightSlot={rightSlotContent}
                        compact
                      />
                    );
                  }
                  return (
                    <GridListRow
                      key={item.id}
                      id={item.id}
                      name={item.name}
                      description={item.description}
                      columns={[costColumn, sourceColumn]}
                      gridColumns={EQUIPMENT_LIST_GRID}
                      badges={badges}
                      detailSections={chips.length > 0 ? [{ label: 'Properties', chips, hideLabelIfSingle: true }] : undefined}
                      rightSlot={rightSlotContent}
                      compact
                    />
                  );
                })
              )}
            </div>
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
