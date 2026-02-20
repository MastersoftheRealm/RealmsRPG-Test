/**
 * Add Library Item Modal — UnifiedSelectionModal wrapper
 * Adds powers, techniques, or items from the user's library to the character sheet.
 */

'use client';

import { useMemo } from 'react';
import { useUserPowers, useUserTechniques, useUserItems } from '@/hooks/use-user-library';
import { useEquipment, useTechniqueParts } from '@/hooks';
import { UnifiedSelectionModal, type SelectableItem } from '@/components/shared/unified-selection-modal';
import type { ColumnValue } from '@/components/shared/grid-list-row';
import { formatDamageDisplay } from '@/lib/utils';
import { deriveTechniqueDisplay } from '@/lib/calculators/technique-calc';
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

function capitalize(s: string | undefined): string {
  if (!s) return '-';
  return s.replace(/\b\w/g, c => c.toUpperCase());
}

function getItemColumns(
  item: UserPower | UserTechnique | UserItem | { id: string; name?: string; description?: string; damage?: unknown; armorValue?: number; properties?: string[] },
  itemType: ItemType,
  techniqueDisplay?: { energy: number; weaponName: string; tp: number }
): ColumnValue[] {
  if (itemType === 'power') {
    const power = item as UserPower;
    const damageStr = power.damage?.length ? power.damage.map(d => capitalize(d.type)).join(', ') : '-';
    const areaStr = power.area?.type ? capitalize(power.area.type) : '-';
    return [
      { key: 'Action', value: capitalize(power.actionType), align: 'center' as const },
      { key: 'Damage', value: damageStr, align: 'center' as const },
      { key: 'Area', value: areaStr, align: 'center' as const },
    ];
  }
  if (itemType === 'technique' && techniqueDisplay) {
    return [
      { key: 'Energy', value: String(techniqueDisplay.energy), align: 'center' as const },
      { key: 'Weapon', value: techniqueDisplay.weaponName || '-', align: 'center' as const },
      { key: 'Training Pts', value: String(techniqueDisplay.tp), align: 'center' as const },
    ];
  }
  if (itemType === 'technique') {
    const technique = item as UserTechnique;
    return [
      { key: 'Weapon', value: technique.weapon?.name || '-', align: 'center' as const },
      { key: 'Training Pts', value: '-', align: 'center' as const },
    ];
  }
  if (itemType === 'weapon') {
    const weapon = item as UserItem;
    return weapon.damage ? [{ key: 'Damage', value: formatDamageDisplay(weapon.damage), highlight: true }] : [];
  }
  if (itemType === 'armor') {
    const armor = item as UserItem;
    return armor.armorValue ? [{ key: 'Armor', value: `+${armor.armorValue}`, highlight: true }] : [];
  }
  return [];
}

function getModalGridColumns(itemType: ItemType): string {
  switch (itemType) {
    case 'power': return '1.4fr 0.8fr 0.8fr 0.7fr';
    case 'technique': return '1.4fr 0.7fr 1fr 0.8fr';
    case 'weapon':
    case 'armor': return '1.5fr 1fr';
    case 'equipment': return '1.5fr';
    default: return '1.5fr';
  }
}

function getListHeaderColumns(itemType: ItemType): { key: string; label: string; sortable?: boolean }[] {
  const base = [{ key: 'name', label: 'Name' }];
  switch (itemType) {
    case 'power': return [...base, { key: 'Action', label: 'Action' }, { key: 'Damage', label: 'Damage' }, { key: 'Area', label: 'Area' }];
    case 'technique': return [...base, { key: 'Energy', label: 'Energy' }, { key: 'Weapon', label: 'Weapon' }, { key: 'Training Pts', label: 'Training Pts' }];
    case 'weapon': return [...base, { key: 'damage', label: 'Damage' }];
    case 'armor': return [...base, { key: 'armor', label: 'Armor' }];
    case 'equipment': return base;
    default: return base;
  }
}

function getTitle(itemType: ItemType): string {
  switch (itemType) {
    case 'power': return 'Add Power from Library';
    case 'technique': return 'Add Technique from Library';
    case 'weapon': return 'Add Weapon from Library';
    case 'armor': return 'Add Armor from Library';
    case 'equipment': return 'Add Equipment from Library';
    default: return 'Add Item';
  }
}

type EqItem = { id: string; name?: string; description?: string; damage?: unknown; armorValue?: number; properties?: string[] };

export function AddLibraryItemModal({
  isOpen,
  onClose,
  itemType,
  existingIds,
  onAdd,
}: AddLibraryItemModalProps) {
  const { data: userPowers = [], isLoading: powersLoading } = useUserPowers();
  const { data: userTechniques = [], isLoading: techniquesLoading } = useUserTechniques();
  const { data: userItems = [], isLoading: itemsLoading } = useUserItems();
  const { data: codexEquipment = [], isLoading: equipmentLoading } = useEquipment();
  const { data: techniquePartsDb = [] } = useTechniqueParts();

  const { rawItems, isLoading } = useMemo(() => {
    switch (itemType) {
      case 'power':
        return { rawItems: userPowers as (UserPower | UserTechnique | UserItem | EqItem)[], isLoading: powersLoading };
      case 'technique':
        return { rawItems: userTechniques as (UserPower | UserTechnique | UserItem | EqItem)[], isLoading: techniquesLoading };
      case 'weapon':
        return { rawItems: userItems.filter((i: UserItem) => i.type === 'weapon'), isLoading: itemsLoading };
      case 'armor':
        return { rawItems: userItems.filter((i: UserItem) => i.type === 'armor'), isLoading: itemsLoading };
      case 'equipment': {
        const codexEquip = codexEquipment.filter((e: { type?: string }) => (e.type || 'equipment') === 'equipment');
        const userEquip = userItems.filter((i: UserItem) => (i.type || '').toLowerCase() === 'equipment');
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
            properties: (i.properties || []).map((p: { name?: string } | string) => typeof p === 'string' ? p : (p as { name?: string }).name).filter(Boolean) as string[],
          })),
        ];
        return { rawItems: merged, isLoading: itemsLoading || equipmentLoading };
      }
      default:
        return { rawItems: [], isLoading: false };
    }
  }, [itemType, userPowers, userTechniques, userItems, codexEquipment, powersLoading, techniquesLoading, itemsLoading, equipmentLoading]);

  const items: SelectableItem[] = useMemo(() => {
    return rawItems
      .filter((item: { id: string }) => !existingIds.has(String(item.id)))
      .map((item: UserPower | UserTechnique | UserItem | EqItem) => {
        let techniqueDisplay: { energy: number; weaponName: string; tp: number } | undefined;
        if (itemType === 'technique') {
          const t = item as UserTechnique;
          const display = deriveTechniqueDisplay(
            {
              name: t.name,
              description: t.description,
              parts: t.parts || [],
              damage: Array.isArray(t.damage) && t.damage[0] ? t.damage[0] : undefined,
              weapon: t.weapon,
            },
            techniquePartsDb
          );
          techniqueDisplay = { energy: display.energy, weaponName: display.weaponName, tp: display.tp };
        }
        return {
          id: String(item.id),
          name: String(item.name ?? ''),
          description: String((item as UserPower | UserTechnique | UserItem).description ?? '') || 'No description available.',
          columns: getItemColumns(item, itemType, techniqueDisplay),
          data: item,
        };
      });
  }, [rawItems, existingIds, itemType, techniquePartsDb]);

  const emptyTitle = items.length === 0 ? `No ${itemType}s available` : 'All already added or no matches';
  const emptyDesc = items.length === 0
    ? (itemType === 'equipment'
      ? 'Equipment is loaded from the Codex. Add equipment via the Admin Codex if needed.'
      : `Create some in the ${itemType === 'power' ? 'Power' : itemType === 'technique' ? 'Technique' : 'Item'} Creator first!`)
    : undefined;

  const handleConfirm = (selected: SelectableItem[]) => {
    const selectedRaw = selected.map(s => s.data as UserPower | UserTechnique | UserItem | EqItem);
    const quantities = selected.reduce((acc, s) => {
      const q = (s as SelectableItem & { quantity?: number }).quantity;
      if (q != null) acc[s.id] = q;
      return acc;
    }, {} as Record<string, number>);

    if (itemType === 'power') {
      const powers: CharacterPower[] = (selectedRaw as UserPower[]).map(p => ({
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
        cost: 0,
        level: 1,
      }));
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
      }));
      onAdd(techniques);
    } else {
      const equipmentItems: Item[] = (selectedRaw as EqItem[]).map(i => {
        let damageStr = '';
        if (Array.isArray(i.damage) && i.damage.length > 0) {
          const d = i.damage[0] as { amount?: number; size?: number; type?: string };
          if (d?.amount && d?.size && d?.type && d.type !== 'none') damageStr = `${d.amount}d${d.size} ${d.type}`;
        } else if (typeof i.damage === 'string') damageStr = i.damage;
        const props = (i.properties || []).map(p => typeof p === 'string' ? p : (p as { name?: string }).name).filter((n): n is string => typeof n === 'string');
        return {
          id: i.id,
          name: String(i.name ?? ''),
          description: String(i.description ?? ''),
          properties: props,
          damage: damageStr,
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
      items={items}
      isLoading={isLoading}
      onConfirm={handleConfirm}
      columns={getListHeaderColumns(itemType)}
      gridColumns={getModalGridColumns(itemType)}
      itemLabel={itemType}
      emptyMessage={emptyTitle}
      emptySubMessage={emptyDesc}
      searchPlaceholder={`Search your ${itemType}s...`}
      showQuantity={itemType === 'equipment'}
      size="lg"
      className="max-h-[60vh]"
    />
  );
}

export default AddLibraryItemModal;
