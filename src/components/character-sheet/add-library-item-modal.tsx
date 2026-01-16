/**
 * Add Library Item Modal
 * =======================
 * Modal for adding powers, techniques, or items from the user's library
 * to their character sheet.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Search, Plus, Check, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui';
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

export function AddLibraryItemModal({
  isOpen,
  onClose,
  itemType,
  existingIds,
  onAdd,
}: AddLibraryItemModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Fetch user library based on item type
  const { data: userPowers = [], isLoading: powersLoading } = useUserPowers();
  const { data: userTechniques = [], isLoading: techniquesLoading } = useUserTechniques();
  const { data: userItems = [], isLoading: itemsLoading } = useUserItems();
  
  // Reset selection when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set());
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
      } else {
        newSet.add(id);
      }
      return newSet;
    });
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
        quantity: 1,
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
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search your ${itemType}s...`}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        
        {/* Items List */}
        <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
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
            <ul className="divide-y divide-gray-100">
              {filteredItems.map((item) => (
                <li 
                  key={item.id}
                  onClick={() => toggleSelection(item.id)}
                  className={`
                    flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
                    ${selectedIds.has(item.id) 
                      ? 'bg-primary-50 border-l-4 border-primary-500' 
                      : 'hover:bg-gray-50 border-l-4 border-transparent'
                    }
                  `}
                >
                  <div className={`
                    w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                    ${selectedIds.has(item.id) 
                      ? 'bg-primary-600 border-primary-600' 
                      : 'border-gray-300'
                    }
                  `}>
                    {selectedIds.has(item.id) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.name}</p>
                    {item.description && (
                      <p className="text-sm text-gray-500 truncate">{item.description}</p>
                    )}
                  </div>
                  {renderItemMeta(item, itemType)}
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-4">
          <span className="text-sm text-gray-500">
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedIds.size === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Add Selected
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// Helper to render item-specific metadata
function renderItemMeta(item: UserPower | UserTechnique | UserItem, itemType: ItemType) {
  if (itemType === 'power') {
    return null; // Could add cost display
  }
  if (itemType === 'technique') {
    return null; // Could add energy display
  }
  if (itemType === 'weapon') {
    const weapon = item as UserItem;
    return weapon.damage ? (
      <span className="text-sm text-red-600 font-medium">{formatDamageDisplay(weapon.damage)}</span>
    ) : null;
  }
  if (itemType === 'armor') {
    const armor = item as UserItem;
    return armor.armorValue ? (
      <span className="text-sm text-blue-600 font-medium">+{armor.armorValue} AR</span>
    ) : null;
  }
  return null;
}

export default AddLibraryItemModal;
