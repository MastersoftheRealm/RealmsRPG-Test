/**
 * Equipment Step
 * ===============
 * Select starting equipment with real data from Firebase RTDB
 * Supports quantity selection for equipment items
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { cn, formatDamageDisplay } from '@/lib/utils';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { useEquipment, type EquipmentItem } from '@/hooks';
import { SearchInput } from '@/components/shared';
import { Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import type { Item } from '@/types';

// Starting currency for new characters at level 1 is 200
const STARTING_CURRENCY = 200;

// Selected item type for our internal state with quantity
interface SelectedItem {
  id: string;
  name: string;
  type: string;
  cost: number;
  quantity: number;
  damage?: string;
  armor?: number;
  properties: string[];
}

export function EquipmentStep() {
  const { draft, nextStep, prevStep, updateDraft } = useCharacterCreatorStore();
  const { data: equipment, isLoading, error } = useEquipment();
  const [activeTab, setActiveTab] = useState<'weapon' | 'armor' | 'equipment'>('weapon');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

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
    if (!equipment) return [];
    return equipment.filter(item => {
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
  }, [equipment, activeTab, searchTerm]);

  // Add item to inventory
  const addItem = useCallback((item: EquipmentItem) => {
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

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto text-center py-12">
        <p className="text-red-600 mb-4">Failed to load equipment data.</p>
        <button onClick={prevStep} className="btn-back">← Back</button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Choose Equipment</h1>
          <p className="text-gray-600">
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
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <h3 className="font-medium text-gray-800 mb-2">Selected Equipment ({selectedItems.reduce((sum, i) => sum + i.quantity, 0)} items)</h3>
          <div className="flex flex-wrap gap-2">
            {selectedItems.map(item => (
              <span
                key={item.id}
                className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm flex items-center gap-2"
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
      <div className="flex gap-2 mb-4">
        {(['weapon', 'armor', 'equipment'] as const).map(type => {
          const count = equipment?.filter(e => e.type === type).length || 0;
          return (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={cn(
                'px-4 py-2 rounded-lg font-medium capitalize transition-colors flex items-center gap-2',
                activeTab === type
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {type}s
              <span className={cn(
                'px-1.5 py-0.5 text-xs rounded-full',
                activeTab === type ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600'
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="mb-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder={`Search ${activeTab}s...`}
        />
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-500 mb-2">
        {filteredEquipment.length} {activeTab}{filteredEquipment.length !== 1 ? 's' : ''} found
      </div>

      {/* Equipment List - Codex-like style */}
      <div className="border border-gray-200 rounded-lg mb-8 max-h-[400px] overflow-y-auto divide-y divide-gray-200">
        {filteredEquipment.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No {activeTab}s found.
          </div>
        ) : (
          filteredEquipment.map(item => {
            const cost = item.gold_cost || item.currency || 0;
            const quantity = getItemQuantity(item.id);
            const canAfford = cost <= remainingCurrency;
            const isExpanded = expandedItem === item.id;
            
            return (
              <div key={item.id} className="bg-white">
                {/* Item Row */}
                <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={quantity === 0}
                      className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center transition-colors',
                        quantity > 0
                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                          : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                      )}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className={cn(
                      'w-8 text-center font-bold',
                      quantity > 0 ? 'text-primary-600' : 'text-gray-400'
                    )}>
                      {quantity}
                    </span>
                    <button
                      onClick={() => addItem(item)}
                      disabled={!canAfford}
                      className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center transition-colors',
                        canAfford
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                      )}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Item Info */}
                  <button 
                    onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                    className="flex-1 flex items-center justify-between text-left"
                  >
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">{item.name}</span>
                      <div className="flex items-center gap-2 mt-1">
                        {item.damage && (
                          <span className="px-2 py-0.5 text-xs bg-red-50 text-red-700 rounded">
                            {formatDamageDisplay(item.damage)}
                          </span>
                        )}
                        {item.armor_value && (
                          <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded">
                            +{item.armor_value} Armor
                          </span>
                        )}
                        {item.properties.slice(0, 2).map(prop => (
                          <span key={prop} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                            {prop}
                          </span>
                        ))}
                        {item.properties.length > 2 && (
                          <span className="text-xs text-gray-400">+{item.properties.length - 2}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        'font-bold',
                        canAfford ? 'text-amber-600' : 'text-red-500'
                      )}>
                        {cost}c
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>
                </div>
                
                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-100">
                    {item.description && (
                      <p className="text-gray-700 text-sm mb-2">{item.description}</p>
                    )}
                    {item.properties.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.properties.map(prop => (
                          <span key={prop} className="px-2 py-1 text-xs bg-white border border-gray-200 rounded">
                            {prop}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          className="btn-back"
        >
          ← Back
        </button>
        <button
          onClick={nextStep}
          className="btn-continue"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
