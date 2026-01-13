/**
 * Equipment Step
 * ===============
 * Select starting equipment with real data from Firebase RTDB
 */

'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { useEquipment, type EquipmentItem } from '@/hooks';
import { calculateTrainingPoints } from '@/lib/game/formulas';
import type { Item } from '@/types';

// Selected item type for our internal state
interface SelectedItem {
  id: string;
  name: string;
  type: string;
  cost: number;
  damage?: string;
  armor?: number;
  properties: string[];
}

export function EquipmentStep() {
  const { draft, nextStep, prevStep, updateDraft } = useCharacterCreatorStore();
  const { data: equipment, isLoading } = useEquipment();
  const [activeTab, setActiveTab] = useState<'weapon' | 'armor' | 'equipment'>('weapon');
  const [searchTerm, setSearchTerm] = useState('');

  // Get highest archetype ability for TP calculation
  const highestAbility = useMemo(() => {
    const abilities = draft.abilities || {};
    // Try to get archetype-related ability, fallback to highest
    const abilityValues = Object.values(abilities).filter((v): v is number => typeof v === 'number');
    return Math.max(...abilityValues, 0);
  }, [draft.abilities]);

  // Calculate starting currency
  const startingCurrency = calculateTrainingPoints(draft.level || 1, highestAbility) * 10;
  
  // Get selected equipment from draft - use inventory array
  const selectedItems = useMemo((): SelectedItem[] => {
    const inv = draft.equipment?.inventory || [];
    return inv.map(item => ({
      id: String(item.id),
      name: item.name,
      type: 'equipment',
      cost: item.cost || 0,
      damage: item.damage,
      armor: item.armor,
      properties: Array.isArray(item.properties) 
        ? item.properties.map(p => typeof p === 'string' ? p : p.name) 
        : [],
    }));
  }, [draft.equipment?.inventory]);

  const spentCurrency = useMemo(() => {
    return selectedItems.reduce((sum: number, item) => sum + (item.cost || 0), 0);
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
    });
  }, [equipment, activeTab, searchTerm]);

  const toggleItem = (item: EquipmentItem) => {
    const isSelected = selectedItems.some(i => i.id === item.id);
    
    // Current inventory
    const currentInventory: Item[] = draft.equipment?.inventory || [];
    
    if (isSelected) {
      // Remove item
      updateDraft({
        equipment: {
          ...draft.equipment,
          inventory: currentInventory.filter(i => String(i.id) !== item.id),
        }
      });
    } else {
      // Add item if we have enough currency
      if (item.gold_cost > remainingCurrency) return;
      
      const newItem: Item = {
        id: item.id,
        name: item.name,
        cost: item.gold_cost,
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
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Choose Equipment</h1>
          <p className="text-gray-600">
            Select your starting weapons, armor, and gear.
          </p>
        </div>
        
        <div className={cn(
          'px-4 py-2 rounded-xl font-bold text-lg',
          remainingCurrency > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
        )}>
          {remainingCurrency} / {startingCurrency}c
        </div>
      </div>

      {/* Selected Items Summary */}
      {selectedItems.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <h3 className="font-medium text-gray-800 mb-2">Selected Equipment</h3>
          <div className="flex flex-wrap gap-2">
            {selectedItems.map(item => (
              <span
                key={item.id}
                className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm flex items-center gap-2"
              >
                {item.name}
                <span className="text-amber-600 text-xs">{item.cost}c</span>
                <button
                  onClick={() => toggleItem({ id: item.id, name: item.name, gold_cost: item.cost, currency: item.cost, type: 'equipment', properties: [], description: '' } as EquipmentItem)}
                  className="hover:text-red-500"
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
        {(['weapon', 'armor', 'equipment'] as const).map(type => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={cn(
              'px-4 py-2 rounded-lg font-medium capitalize transition-colors',
              activeTab === type
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {type}s
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={`Search ${activeTab}s...`}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
      />

      {/* Equipment Grid */}
      <div className="grid md:grid-cols-2 gap-3 mb-8 max-h-[400px] overflow-y-auto">
        {filteredEquipment.map(item => {
          const isSelected = selectedItems.some(i => i.id === item.id);
          const canAfford = item.gold_cost <= remainingCurrency || isSelected;
          
          return (
            <button
              key={item.id}
              onClick={() => canAfford && toggleItem(item)}
              disabled={!canAfford}
              className={cn(
                'p-4 rounded-lg border text-left transition-all',
                isSelected
                  ? 'border-primary-400 bg-primary-50'
                  : canAfford
                    ? 'border-gray-200 bg-white hover:border-gray-300'
                    : 'border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed'
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-primary-600 text-white text-xs flex items-center justify-center">
                      ✓
                    </span>
                  )}
                  <span className="font-medium text-gray-900">{item.name}</span>
                </div>
                <span className={cn(
                  'font-bold',
                  canAfford ? 'text-amber-600' : 'text-red-500'
                )}>
                  {item.gold_cost}c
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                {item.damage && (
                  <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded">
                    {item.damage}
                  </span>
                )}
                {item.armor_value && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                    +{item.armor_value} Armor
                  </span>
                )}
              </div>
              
              {item.description && (
                <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
              )}
              
              {item.properties.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.properties.slice(0, 3).map(prop => (
                    <span key={prop} className="px-1.5 py-0.5 text-xs bg-gray-100 rounded">
                      {prop}
                    </span>
                  ))}
                  {item.properties.length > 3 && (
                    <span className="text-xs text-gray-400">
                      +{item.properties.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
        
        {filteredEquipment.length === 0 && (
          <div className="col-span-2 text-center py-8 text-gray-500">
            No {activeTab}s found.
          </div>
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
