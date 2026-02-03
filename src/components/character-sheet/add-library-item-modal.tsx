/**
 * Add Library Item Modal
 * =======================
 * Modal for adding powers, techniques, or items from the user's library
 * to their character sheet. Uses GridListRow for consistent styling.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Minus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Modal, SearchInput, Button } from '@/components/ui';
import { GridListRow } from '@/components/shared';
import { formatDamageDisplay } from '@/lib/utils';
import { useUserPowers, useUserTechniques, useUserItems } from '@/hooks/use-user-library';
import type { UserPower, UserTechnique, UserItem } from '@/hooks/use-user-library';
import type { CharacterPower, CharacterTechnique, Item } from '@/types';

type ItemType = 'power' | 'technique' | 'weapon' | 'armor' | 'equipment';

interface AddLibraryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: ItemType;
  existingIds: Set<string>;
  onAdd: (items: CharacterPower[] | CharacterTechnique[] | Item[]) => void;
}

// Quantity selector component for equipment items
function QuantitySelector({
  quantity,
  onChange,
  min = 1,
  max = 99,
}: {
  quantity: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div 
      className="flex items-center gap-1" 
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onChange(Math.max(min, quantity - 1)); }}
        disabled={quantity <= min}
        className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
          quantity > min
            ? 'bg-surface-alt hover:bg-border-light text-text-secondary'
            : 'bg-surface text-text-muted cursor-not-allowed'
        )}
      >
        <Minus className="w-3 h-3" />
      </button>
      <span className="w-8 text-center text-sm font-medium text-text-primary">{quantity}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onChange(Math.min(max, quantity + 1)); }}
        disabled={quantity >= max}
        className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
          quantity < max
            ? 'bg-surface-alt hover:bg-border-light text-text-secondary'
            : 'bg-surface text-text-muted cursor-not-allowed'
        )}
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

export function AddLibraryItemModal({
  isOpen,
  onClose,
  itemType,
  existingIds,
  onAdd,
}: AddLibraryItemModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Track quantities for equipment items (id -> quantity)
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  
  // Fetch user library based on item type
  const { data: userPowers = [], isLoading: powersLoading } = useUserPowers();
  const { data: userTechniques = [], isLoading: techniquesLoading } = useUserTechniques();
  const { data: userItems = [], isLoading: itemsLoading } = useUserItems();
  
  // Reset selection when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set());
      setQuantities({});
      setSearchQuery('');
    }
  }, [isOpen]);
  
  // Get the appropriate items based on type
  const { items, isLoading } = useMemo(() => {
    switch (itemType) {
      case 'power':
        return { items: userPowers, isLoading: powersLoading };
      case 'technique':
        return { items: userTechniques, isLoading: techniquesLoading };
      case 'weapon':
        return { 
          items: userItems.filter(i => i.type === 'weapon'), 
          isLoading: itemsLoading 
        };
      case 'armor':
        return { 
          items: userItems.filter(i => i.type === 'armor'), 
          isLoading: itemsLoading 
        };
      case 'equipment':
        return { 
          items: userItems.filter(i => i.type === 'equipment'), 
          isLoading: itemsLoading 
        };
      default:
        return { items: [], isLoading: false };
    }
  }, [itemType, userPowers, userTechniques, userItems, powersLoading, techniquesLoading, itemsLoading]);
  
  // Filter by search query and exclude already added items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Exclude already added
      if (existingIds.has(item.id)) return false;
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return item.name.toLowerCase().includes(query) ||
               (item.description?.toLowerCase().includes(query));
      }
      return true;
    });
  }, [items, existingIds, searchQuery]);
  
  // Toggle selection
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
        // Also remove quantity tracking when deselected
        setQuantities(q => {
          const newQ = { ...q };
          delete newQ[id];
          return newQ;
        });
      } else {
        newSet.add(id);
        // Initialize quantity to 1 for equipment
        if (itemType === 'equipment') {
          setQuantities(q => ({ ...q, [id]: 1 }));
        }
      }
      return newSet;
    });
  };
  
  // Update quantity for an item
  const updateQuantity = (id: string, quantity: number) => {
    setQuantities(prev => ({ ...prev, [id]: quantity }));
  };
  
  // Handle confirm
  const handleConfirm = () => {
    const selectedItems = items.filter(item => selectedIds.has(item.id));
    
    // Transform to character format based on type
    if (itemType === 'power') {
      const powers: CharacterPower[] = (selectedItems as UserPower[]).map(p => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        parts: (p.parts || []).map(part => ({
          id: String(part.id || ''),
          name: part.name || '',
          op_1_lvl: part.op_1_lvl,
          op_2_lvl: part.op_2_lvl,
          op_3_lvl: part.op_3_lvl,
        })),
        cost: 0, // Will be calculated
        level: 1,
      }));
      onAdd(powers);
    } else if (itemType === 'technique') {
      const techniques: CharacterTechnique[] = (selectedItems as UserTechnique[]).map(t => ({
        id: t.id,
        name: t.name,
        description: t.description || '',
        parts: (t.parts || []).map(part => ({
          id: String(part.id || ''),
          name: part.name || '',
          op_1_lvl: part.op_1_lvl,
          op_2_lvl: part.op_2_lvl,
          op_3_lvl: part.op_3_lvl,
        })),
        cost: 0, // Will be calculated
      }));
      onAdd(techniques);
    } else {
      const equipmentItems: Item[] = (selectedItems as UserItem[]).map(i => ({
        id: i.id,
        name: i.name,
        description: i.description || '',
        // Convert properties to string names for Item type compatibility
        properties: (i.properties || [])
          .map(p => typeof p === 'string' ? p : p.name)
          .filter((name): name is string => typeof name === 'string'),
        damage: i.damage || '',
        armor: i.armorValue || 0,
        equipped: false,
        // Use selected quantity for equipment, default to 1 for weapons/armor
        quantity: itemType === 'equipment' ? (quantities[i.id] || 1) : 1,
      }));
      onAdd(equipmentItems);
    }
    
    onClose();
  };
  
  // Get title based on item type
  const getTitle = () => {
    switch (itemType) {
      case 'power': return 'Add Power from Library';
      case 'technique': return 'Add Technique from Library';
      case 'weapon': return 'Add Weapon from Library';
      case 'armor': return 'Add Armor from Library';
      case 'equipment': return 'Add Equipment from Library';
      default: return 'Add Item';
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()}>
      <div className="flex flex-col h-[60vh]">
        {/* Search */}
        <div className="mb-4">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={`Search your ${itemType}s...`}
            size="sm"
          />
        </div>
        
        {/* Items List */}
        <div className="flex-1 overflow-y-auto border border-border-light rounded-lg">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-text-muted">
              {items.length === 0 ? (
                <>
                  <p className="text-lg font-medium">No {itemType}s in your library</p>
                  <p className="text-sm mt-1">Create some in the {itemType === 'power' ? 'Power' : itemType === 'technique' ? 'Technique' : 'Item'} Creator first!</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium">All {itemType}s already added</p>
                  <p className="text-sm mt-1">or no matches for &quot;{searchQuery}&quot;</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {filteredItems.map((item) => {
                const isSelected = selectedIds.has(item.id);
                const showQuantity = itemType === 'equipment' && isSelected;
                
                return (
                  <div key={item.id} className="flex items-center gap-2">
                    <div className="flex-1">
                      <GridListRow
                        id={item.id}
                        name={item.name}
                        description={item.description || 'No description available.'}
                        columns={getItemColumns(item, itemType)}
                        selectable
                        isSelected={isSelected}
                        onSelect={() => toggleSelection(item.id)}
                        compact
                      />
                    </div>
                    {/* Quantity selector for selected equipment items */}
                    {showQuantity && (
                      <div className="flex-shrink-0 px-2">
                        <QuantitySelector
                          quantity={quantities[item.id] || 1}
                          onChange={(qty) => updateQuantity(item.id, qty)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border-light mt-4">
          <span className="text-sm text-text-muted">
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedIds.size === 0}
            >
              <Plus className="w-4 h-4" />
              Add Selected
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// Helper to get item-specific columns for GridListRow
function getItemColumns(item: UserPower | UserTechnique | UserItem, itemType: ItemType) {
  if (itemType === 'power') {
    const power = item as UserPower;
    return [
      { key: 'Level', value: power.parts?.length || '-' },
    ];
  }
  if (itemType === 'technique') {
    const technique = item as UserTechnique;
    return [
      { key: 'Parts', value: technique.parts?.length || '-' },
    ];
  }
  if (itemType === 'weapon') {
    const weapon = item as UserItem;
    return weapon.damage ? [
      { key: 'Damage', value: formatDamageDisplay(weapon.damage), highlight: true },
    ] : [];
  }
  if (itemType === 'armor') {
    const armor = item as UserItem;
    return armor.armorValue ? [
      { key: 'Armor', value: `+${armor.armorValue}`, highlight: true },
    ] : [];
  }
  return [];
}

export default AddLibraryItemModal;
