/**
 * Add Library Item Modal
 * =======================
 * Modal for adding powers, techniques, or items from the user's library
 * to their character sheet. Uses GridListRow for consistent styling.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Modal, SearchInput, Button, Spinner } from '@/components/ui';
import { GridListRow, QuantitySelector, ListHeader } from '@/components/shared';
import { useSort } from '@/hooks/use-sort';
import { formatDamageDisplay } from '@/lib/utils';
import { useUserPowers, useUserTechniques, useUserItems } from '@/hooks/use-user-library';
import { useEquipment } from '@/hooks';
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
  // Track quantities for equipment items (id -> quantity)
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  // Sort state for list (custom sort logic for level/damage/armor columns)
  const { sortState, handleSort } = useSort('name');
  
  // Fetch user library and codex equipment
  const { data: userPowers = [], isLoading: powersLoading } = useUserPowers();
  const { data: userTechniques = [], isLoading: techniquesLoading } = useUserTechniques();
  const { data: userItems = [], isLoading: itemsLoading } = useUserItems();
  const { data: codexEquipment = [], isLoading: equipmentLoading } = useEquipment();
  
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
      case 'equipment': {
        // Pull equipment from codex + user items (item creator supports weapons/armor/shields; equipment comes from codex)
        const codexEquip = codexEquipment.filter((e: { type?: string }) => (e.type || 'equipment') === 'equipment');
        const userEquip = userItems.filter(i => (i.type || '').toLowerCase() === 'equipment');
        type EqItem = { id: string; name: string; description: string; damage?: unknown; armorValue?: number; properties?: string[] };
        const merged: EqItem[] = [
          ...codexEquip.map((e: { id: string; name?: string; description?: string; damage?: unknown; armor_value?: number; properties?: string[] }) => ({
            id: e.id,
            name: String(e.name ?? ''),
            description: String(e.description ?? ''),
            damage: e.damage,
            armorValue: e.armor_value,
            properties: e.properties ?? [],
          })),
          ...userEquip.map((i: UserItem) => ({
            id: i.id,
            name: String(i.name ?? ''),
            description: String(i.description ?? ''),
            damage: i.damage,
            armorValue: i.armorValue,
            properties: (i.properties || []).map((p: { name?: string } | string) => typeof p === 'string' ? p : p.name).filter(Boolean) as string[],
          })),
        ];
        return { items: merged, isLoading: itemsLoading || equipmentLoading };
      }
      default:
        return { items: [], isLoading: false };
    }
  }, [itemType, userPowers, userTechniques, userItems, codexEquipment, powersLoading, techniquesLoading, itemsLoading, equipmentLoading]);
  
  // Filter by search query and exclude already added items, then sort
  const filteredItems = useMemo(() => {
    let result = items.filter(item => {
      // Exclude already added
      if (existingIds.has(item.id)) return false;
      
      // Search filter (null-safe for name/description)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const name = String(item.name ?? '');
        const desc = String(item.description ?? '');
        return name.toLowerCase().includes(query) || desc.toLowerCase().includes(query);
      }
      return true;
    });
    
    // Sort by current sort state (null-safe for name)
    result.sort((a, b) => {
      let cmp = 0;
      if (sortState.col === 'name') {
        cmp = String(a.name ?? '').localeCompare(String(b.name ?? ''));
      } else if (sortState.col === 'level') {
        // For powers/techniques - parts count
        const aVal = (a as UserPower | UserTechnique).parts?.length || 0;
        const bVal = (b as UserPower | UserTechnique).parts?.length || 0;
        cmp = aVal - bVal;
      } else if (sortState.col === 'damage') {
        // For weapons
        const aVal = formatDamageForSort((a as UserItem).damage);
        const bVal = formatDamageForSort((b as UserItem).damage);
        cmp = aVal.localeCompare(bVal);
      } else if (sortState.col === 'armor') {
        // For armor
        const aVal = (a as UserItem).armorValue || 0;
        const bVal = (b as UserItem).armorValue || 0;
        cmp = aVal - bVal;
      }
      return cmp * sortState.dir;
    });
    
    return result;
  }, [items, existingIds, searchQuery, sortState]);
  
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
      const equipmentItems: Item[] = (selectedItems as Array<{ id: string; name?: string; description?: string; damage?: unknown; armorValue?: number; properties?: string[] }>).map(i => {
        // Convert SavedDamage[] to string format for Item type
        let damageStr = '';
        if (Array.isArray(i.damage) && i.damage.length > 0) {
          const dmg = i.damage[0] as { amount?: number; size?: number; type?: string };
          if (dmg.amount && dmg.size && dmg.type && dmg.type !== 'none') {
            damageStr = `${dmg.amount}d${dmg.size} ${dmg.type}`;
          }
        } else if (typeof i.damage === 'string') {
          damageStr = i.damage;
        }

        const props = (i.properties || []).map(p => typeof p === 'string' ? p : (p as { name?: string }).name).filter((n): n is string => typeof n === 'string');

        return {
          id: i.id,
          name: String(i.name ?? ''),
          description: String(i.description ?? ''),
          properties: props,
          damage: damageStr,
          armor: i.armorValue ?? 0,
          equipped: false,
          quantity: itemType === 'equipment' ? (quantities[i.id] || 1) : 1,
          cost: 0,
        };
      });
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
              <Spinner size="md" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-text-muted">
              {items.length === 0 ? (
                <>
                  <p className="text-lg font-medium">No {itemType}s available</p>
                  <p className="text-sm mt-1">
                    {itemType === 'equipment'
                      ? 'Equipment is loaded from the Codex. Add equipment via the Admin Codex if needed.'
                      : `Create some in the ${itemType === 'power' ? 'Power' : itemType === 'technique' ? 'Technique' : 'Item'} Creator first!`}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium">All {itemType}s already added</p>
                  <p className="text-sm mt-1">or no matches for &quot;{searchQuery}&quot;</p>
                </>
              )}
            </div>
          ) : (
            <div className="p-2">
              {/* List Header with sorting */}
              <ListHeader
                columns={getListHeaderColumns(itemType)}
                sortState={sortState}
                onSort={handleSort}
                hasSelectionColumn
              />
              
              <div className="space-y-2">
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
function getItemColumns(item: UserPower | UserTechnique | UserItem | { id: string; name?: string; description?: string; damage?: unknown; armorValue?: number }, itemType: ItemType) {
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

// Helper to format damage for sorting
function formatDamageForSort(damage: unknown): string {
  if (!damage) return '';
  if (typeof damage === 'string') return damage;
  if (Array.isArray(damage) && damage.length > 0) {
    const d = damage[0];
    return `${d.amount || 0}d${d.size || 0} ${d.type || ''}`;
  }
  return '';
}

// Get ListHeader columns based on item type
function getListHeaderColumns(itemType: ItemType) {
  const baseColumns = [
    { key: 'name', label: 'Name', sortable: true },
  ];
  
  switch (itemType) {
    case 'power':
      return [...baseColumns, { key: 'level', label: 'Level', sortable: true, align: 'center' as const }];
    case 'technique':
      return [...baseColumns, { key: 'level', label: 'Parts', sortable: true, align: 'center' as const }];
    case 'weapon':
      return [...baseColumns, { key: 'damage', label: 'Damage', sortable: true, align: 'center' as const }];
    case 'armor':
      return [...baseColumns, { key: 'armor', label: 'Armor', sortable: true, align: 'center' as const }];
    case 'equipment':
      return baseColumns;
    default:
      return baseColumns;
  }
}

export default AddLibraryItemModal;
