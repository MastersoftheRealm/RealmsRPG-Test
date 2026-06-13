/**
 * Add Library Item Modal — UnifiedSelectionModal wrapper
 * Adds powers, techniques, or items from the user's library or Realms Library to the character sheet.
 * Source filter: All sources / Public library / My library (same as Library page). References only — no copy to user library.
 */

'use client';

import { SourceFilter } from '@/components/shared/filters/source-filter';
import { UnifiedSelectionModal, type SelectableItem } from '@/components/shared/unified-selection-modal';
import { SegmentedControl } from '@/components/shared';
import type { UserPower, UserTechnique } from '@/hooks/use-user-library';
import {
  useAddLibraryItemData,
  type AddLibraryItemType,
  type EqItem,
  type PowerSelectionMode,
} from '@/hooks/use-add-library-item-data';
import type { CharacterPower, CharacterTechnique, Item } from '@/types';

interface AddLibraryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: AddLibraryItemType;
  existingIds: Set<string>;
  onAdd: (items: CharacterPower[] | CharacterTechnique[] | Item[]) => void;
}

function getModalGridColumns(itemType: AddLibraryItemType): string {
  switch (itemType) {
    case 'power': return '1.4fr 0.8fr 0.8fr 0.7fr';
    case 'technique': return '1.4fr 1fr 0.7fr 1fr 0.8fr';
    case 'weapon':
    case 'shield':
    case 'armor': return '1.5fr 1fr';
    case 'equipment': return '1.5fr';
    default: return '1.5fr';
  }
}

function getListHeaderColumns(itemType: AddLibraryItemType): { key: string; label: string; sortable?: boolean }[] {
  const base = [{ key: 'name', label: 'Name' }];
  switch (itemType) {
    case 'power': return [...base, { key: 'Action', label: 'Action' }, { key: 'Damage', label: 'Damage' }, { key: 'Area', label: 'Area' }];
    case 'technique': return [...base, { key: 'Action', label: 'Action' }, { key: 'Energy', label: 'Energy' }, { key: 'Weapon', label: 'Weapon' }, { key: 'Training Pts', label: 'Training Pts' }];
    case 'weapon': return [...base, { key: 'damage', label: 'Damage' }];
    case 'shield': return [...base, { key: 'Block', label: 'Block' }, { key: 'Damage', label: 'Damage' }];
    case 'armor': return [...base, { key: 'armor', label: 'Armor' }];
    case 'equipment': return base;
    default: return base;
  }
}

function getTitle(itemType: AddLibraryItemType): string {
  switch (itemType) {
    case 'power': return 'Add Power from Library';
    case 'technique': return 'Add Technique from Library';
    case 'weapon': return 'Add Weapon from Library';
    case 'shield': return 'Add Shield from Library';
    case 'armor': return 'Add Armor from Library';
    case 'equipment': return 'Add Equipment from Library';
    default: return 'Add Item';
  }
}

export function AddLibraryItemModal({
  isOpen,
  onClose,
  itemType,
  existingIds,
  onAdd,
}: AddLibraryItemModalProps) {
  const {
    source,
    setSource,
    powerSelectionMode,
    setPowerSelectionMode,
    items,
    isLoading,
    displayFilterFn,
    emptyTitle,
    emptyDesc,
  } = useAddLibraryItemData({ itemType, existingIds });

  const handleConfirm = (selected: SelectableItem[]) => {
    const selectedRaw = selected.map(s => s.data as UserPower | UserTechnique | EqItem);
    const quantities = selected.reduce((acc, s) => {
      const q = (s as SelectableItem & { quantity?: number }).quantity;
      if (q != null) acc[s.id] = q;
      return acc;
    }, {} as Record<string, number>);

    if (itemType === 'power') {
      const powers: CharacterPower[] = (selectedRaw as Array<UserPower | UserTechnique>).map((entry) => {
        const raw = entry as unknown as Record<string, unknown>;
        if (powerSelectionMode === 'empowered') {
          const powerData = (raw.power as Record<string, unknown> | undefined) ?? {};
          const savedParts = (Array.isArray(powerData.parts) ? powerData.parts : []) as Array<{ id?: string | number; name?: string; op_1_lvl?: number; op_2_lvl?: number; op_3_lvl?: number }>;
          return {
            id: entry.id,
            name: entry.name,
            description: entry.description || '',
            parts: savedParts.map((part) => ({
              id: String(part.id || ''),
              name: part.name || '',
              op_1_lvl: part.op_1_lvl,
              op_2_lvl: part.op_2_lvl,
              op_3_lvl: part.op_3_lvl,
            })),
            cost: 0,
            level: 1,
          };
        }
        const power = entry as UserPower;
        return {
          id: power.id,
          name: power.name,
          description: power.description || '',
          parts: (power.parts || []).map(part => ({
            id: String(part.id || ''),
            name: part.name || '',
            op_1_lvl: part.op_1_lvl,
            op_2_lvl: part.op_2_lvl,
            op_3_lvl: part.op_3_lvl,
          })),
          cost: 0,
          level: 1,
        };
      });
      onAdd(powers);
    } else if (itemType === 'technique') {
      const techniques: CharacterTechnique[] = (selectedRaw as UserTechnique[]).map(t => ({
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
        cost: 0,
        actionType: t.actionType,
        isReaction: t.isReaction,
      }));
      onAdd(techniques);
    } else {
      const equipmentItems: Item[] = (selectedRaw as EqItem[]).map(i => {
        const props = (i.properties || []) as EqItem['properties'];
        return {
          id: i.id,
          name: String(i.name ?? ''),
          description: String(i.description ?? ''),
          properties: props as unknown as Item['properties'],
          damage: i.damage as Item['damage'],
          armor: i.armorValue ?? 0,
          equipped: false,
          quantity: itemType === 'equipment' ? (quantities[i.id] ?? 1) : 1,
          cost: 0,
        };
      });
      onAdd(equipmentItems);
    }
  };

  return (
    <UnifiedSelectionModal
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle(itemType)}
      description="Click a row (or the + button) to select, then click Add Selected."
      headerExtra={
        <div className="space-y-3">
          <SourceFilter value={source} onChange={setSource} />
          {itemType === 'power' && (
            <SegmentedControl<PowerSelectionMode>
              value={powerSelectionMode}
              onChange={setPowerSelectionMode}
              aria-label="Power selection type"
              tabs
              options={[
                { value: 'powers', label: 'Powers' },
                { value: 'empowered', label: 'Empowered Techniques' },
              ]}
            />
          )}
        </div>
      }
      items={items}
      isLoading={isLoading}
      onConfirm={handleConfirm}
      displayFilter={displayFilterFn}
      columns={itemType === 'power' && powerSelectionMode === 'empowered'
        ? [{ key: 'name', label: 'Name' }, { key: 'Action', label: 'Action' }, { key: 'Damage', label: 'Damage' }, { key: 'Area', label: 'Area' }]
        : getListHeaderColumns(itemType)}
      gridColumns={getModalGridColumns(itemType)}
      itemLabel={itemType}
      emptyMessage={emptyTitle}
      emptySubMessage={emptyDesc}
      searchPlaceholder={itemType === 'power' && powerSelectionMode === 'empowered' ? 'Search empowered techniques...' : `Search ${itemType}s...`}
      showQuantity={itemType === 'equipment'}
      size="lg"
      className="max-h-[60vh]"
    />
  );
}

export default AddLibraryItemModal;
