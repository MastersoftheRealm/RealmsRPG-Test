/**
 * Add Library Item Modal — UnifiedSelectionModal wrapper
 * Adds powers, techniques, or items from the user's library or public library to the character sheet.
 * Source filter: All sources / Public library / My library (same as Library page). References only — no copy to user library.
 */

'use client';

import { useMemo, useState } from 'react';
import { useUserPowers, useUserTechniques, useUserItems } from '@/hooks/use-user-library';
import { useEquipment, useTechniqueParts, usePowerParts, useItemProperties, usePublicLibrary } from '@/hooks';
import { SourceFilter, type SourceFilterValue } from '@/components/shared/filters/source-filter';
import { UnifiedSelectionModal, type SelectableItem } from '@/components/shared/unified-selection-modal';
import type { ColumnValue, ChipData } from '@/components/shared/grid-list-row';
import { formatDamageDisplay } from '@/lib/utils';
import { derivePowerDisplay } from '@/lib/calculators/power-calc';
import type { PowerDocument } from '@/lib/calculators/power-calc';
import { deriveTechniqueDisplay } from '@/lib/calculators/technique-calc';
import type { TechniqueDocument } from '@/lib/calculators/technique-calc';
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
  const [source, setSource] = useState<SourceFilterValue>('all');
  const { data: userPowers = [], isLoading: powersLoading } = useUserPowers();
  const { data: userTechniques = [], isLoading: techniquesLoading } = useUserTechniques();
  const { data: userItems = [], isLoading: itemsLoading } = useUserItems();
  const { data: codexEquipment = [], isLoading: equipmentLoading } = useEquipment();
  const { data: techniquePartsDb = [] } = useTechniqueParts();
  const { data: powerPartsDb = [] } = usePowerParts();
  const { data: itemPropertiesDb = [] } = useItemProperties();
  const { data: publicPowers = [], isLoading: publicPowersLoading } = usePublicLibrary('powers');
  const { data: publicTechniques = [], isLoading: publicTechniquesLoading } = usePublicLibrary('techniques');
  const { data: publicItems = [], isLoading: publicItemsLoading } = usePublicLibrary('items');

  const { rawItems, isLoading } = useMemo(() => {
    const normalizePublicPower = (p: Record<string, unknown>): UserPower => {
      const id = String(p.id ?? p.docId ?? '');
      return { id, docId: id, name: String(p.name ?? ''), description: String(p.description ?? ''), parts: (p.parts ?? []) as UserPower['parts'], actionType: p.actionType, isReaction: !!p.isReaction, range: p.range, area: p.area, duration: p.duration, damage: p.damage } as UserPower;
    };
    const normalizePublicTechnique = (t: Record<string, unknown>): UserTechnique => {
      const id = String(t.id ?? t.docId ?? '');
      return { id, docId: id, name: String(t.name ?? ''), description: String(t.description ?? ''), parts: (t.parts ?? []) as UserTechnique['parts'], weapon: t.weapon, damage: t.damage } as UserTechnique;
    };
    const normalizePublicItem = (i: Record<string, unknown>): UserItem | EqItem => {
      const id = String(i.id ?? i.docId ?? '');
      return { id, docId: id, name: String(i.name ?? ''), description: String(i.description ?? ''), type: ((i.type as string) || 'equipment') as UserItem['type'], properties: (i.properties ?? []) as UserItem['properties'], damage: i.damage, armorValue: i.armorValue as number | undefined } as UserItem;
    };

    switch (itemType) {
      case 'power': {
        const my = (source === 'my' || source === 'all') ? (userPowers as (UserPower | UserTechnique | UserItem | EqItem)[]) : [];
        const pub = (source === 'public' || source === 'all') ? (publicPowers as Record<string, unknown>[]).map(normalizePublicPower) : [];
        const merged = [...my, ...pub];
        return { rawItems: merged, isLoading: (source !== 'public' && powersLoading) || (source !== 'my' && publicPowersLoading) };
      }
      case 'technique': {
        const my = (source === 'my' || source === 'all') ? (userTechniques as (UserPower | UserTechnique | UserItem | EqItem)[]) : [];
        const pub = (source === 'public' || source === 'all') ? (publicTechniques as Record<string, unknown>[]).map(normalizePublicTechnique) : [];
        const merged = [...my, ...pub];
        return { rawItems: merged, isLoading: (source !== 'public' && techniquesLoading) || (source !== 'my' && publicTechniquesLoading) };
      }
      case 'weapon': {
        const my = (source === 'my' || source === 'all') ? userItems.filter((i: UserItem) => i.type === 'weapon') : [];
        const pub = (source === 'public' || source === 'all') ? (publicItems as Record<string, unknown>[]).filter((i: Record<string, unknown>) => (i.type || '').toString().toLowerCase() === 'weapon').map(normalizePublicItem) : [];
        const merged = [...my, ...pub];
        return { rawItems: merged, isLoading: (source !== 'public' && itemsLoading) || (source !== 'my' && publicItemsLoading) };
      }
      case 'armor': {
        const my = (source === 'my' || source === 'all') ? userItems.filter((i: UserItem) => i.type === 'armor') : [];
        const pub = (source === 'public' || source === 'all') ? (publicItems as Record<string, unknown>[]).filter((i: Record<string, unknown>) => (i.type || '').toString().toLowerCase() === 'armor').map(normalizePublicItem) : [];
        const merged = [...my, ...pub];
        return { rawItems: merged, isLoading: (source !== 'public' && itemsLoading) || (source !== 'my' && publicItemsLoading) };
      }
      case 'equipment': {
        const codexEquip = codexEquipment.filter((e: { type?: string }) => (e.type || 'equipment') === 'equipment');
        const userEquip = (source === 'my' || source === 'all') ? userItems.filter((i: UserItem) => (i.type || '').toLowerCase() === 'equipment') : [];
        const publicEquip = (source === 'public' || source === 'all') ? (publicItems as Record<string, unknown>[]).filter((i: Record<string, unknown>) => (i.type || 'equipment').toString().toLowerCase() === 'equipment').map(normalizePublicItem) : [];
        const merged: EqItem[] = [
          ...(source === 'my' || source === 'all' ? codexEquip.map((e: { id: string; name?: string; description?: string; damage?: unknown; armor_value?: number; properties?: string[] }) => ({
            id: e.id,
            name: String(e.name ?? ''),
            description: String(e.description ?? ''),
            damage: e.damage,
            armorValue: e.armor_value,
            properties: e.properties ?? [],
          })) : []),
          ...userEquip.map((i: UserItem) => ({
            id: i.id,
            name: String(i.name ?? ''),
            description: String(i.description ?? ''),
            damage: i.damage,
            armorValue: i.armorValue,
            properties: (i.properties || []).map((p: { name?: string } | string) => typeof p === 'string' ? p : (p as { name?: string }).name).filter(Boolean) as string[],
          })),
          ...publicEquip.map((i: UserItem | EqItem) => ({
            id: i.id,
            name: String(i.name ?? ''),
            description: String(i.description ?? ''),
            damage: (i as UserItem).damage,
            armorValue: (i as UserItem).armorValue,
            properties: ((i as UserItem).properties || []).map((p: { name?: string } | string) => typeof p === 'string' ? p : (p as { name?: string }).name).filter(Boolean) as string[],
          })),
        ];
        return { rawItems: merged, isLoading: (source !== 'public' && (itemsLoading || equipmentLoading)) || (source !== 'my' && publicItemsLoading) };
      }
      default:
        return { rawItems: [], isLoading: false };
    }
  }, [itemType, source, userPowers, userTechniques, userItems, codexEquipment, publicPowers, publicTechniques, publicItems, powersLoading, techniquesLoading, itemsLoading, equipmentLoading, publicPowersLoading, publicTechniquesLoading, publicItemsLoading]);

  const items: SelectableItem[] = useMemo(() => {
    return rawItems
      .filter((item: { id: string }) => !existingIds.has(String(item.id)))
      .map((item: UserPower | UserTechnique | UserItem | EqItem) => {
        let techniqueDisplay: { energy: number; weaponName: string; tp: number } | undefined;
        let detailSections: SelectableItem['detailSections'];
        let totalCost: number | undefined;
        const costLabel = 'TP';

        if (itemType === 'power') {
          const p = item as UserPower;
          const doc: PowerDocument = {
            name: String(p.name ?? ''),
            description: String(p.description ?? ''),
            parts: Array.isArray(p.parts) ? (p.parts as PowerDocument['parts']) : [],
            damage: p.damage as PowerDocument['damage'],
            actionType: p.actionType,
            isReaction: p.isReaction,
            range: p.range as PowerDocument['range'],
            area: p.area as PowerDocument['area'],
            duration: p.duration as PowerDocument['duration'],
          };
          const display = derivePowerDisplay(doc, powerPartsDb);
          const partChips: ChipData[] = display.partChips.map((chip) => ({
            name: chip.text.split(' | TP:')[0].trim(),
            description: chip.description,
            cost: chip.finalTP,
            costLabel: 'TP',
          }));
          detailSections = partChips.length > 0 ? [{ label: 'Parts & Proficiencies', chips: partChips }] : undefined;
          totalCost = display.tp > 0 ? display.tp : undefined;
        } else if (itemType === 'technique') {
          const t = item as UserTechnique;
          const doc: TechniqueDocument = {
            name: String(t.name ?? ''),
            description: String(t.description ?? ''),
            parts: Array.isArray(t.parts) ? (t.parts as TechniqueDocument['parts']) : [],
            damage: Array.isArray(t.damage) && t.damage[0] ? t.damage[0] : (t.damage as TechniqueDocument['damage']),
            weapon: t.weapon as TechniqueDocument['weapon'],
          };
          const display = deriveTechniqueDisplay(doc, techniquePartsDb);
          techniqueDisplay = { energy: display.energy, weaponName: display.weaponName, tp: display.tp };
          const partChips: ChipData[] = display.partChips.map((chip) => ({
            name: chip.text.split(' | TP:')[0].trim(),
            description: chip.description,
            cost: chip.finalTP,
            costLabel: 'TP',
          }));
          detailSections = partChips.length > 0 ? [{ label: 'Parts & Proficiencies', chips: partChips }] : undefined;
          totalCost = typeof display.tp === 'number' && display.tp > 0 ? display.tp : undefined;
        } else if (itemType === 'weapon' || itemType === 'armor' || itemType === 'equipment') {
          const it = item as UserItem | EqItem;
          const props = (Array.isArray(it.properties) ? it.properties : []) as Array<{ id?: string | number; name?: string; op_1_lvl?: number }>;
          const propertyChips: ChipData[] = props.map((prop) => {
            const propName = typeof prop === 'string' ? prop : (prop?.name ?? '');
            const dbProp = itemPropertiesDb.find((p: { name?: string }) => p.name?.toLowerCase() === String(propName).toLowerCase());
            const baseTp = dbProp?.base_tp ?? (dbProp as { tp_cost?: number })?.tp_cost ?? 0;
            const optLevel = typeof prop === 'object' && prop?.op_1_lvl != null ? prop.op_1_lvl : 1;
            return {
              name: dbProp?.name || propName,
              description: dbProp?.description,
              cost: baseTp * optLevel,
              costLabel: 'TP',
              level: optLevel > 1 ? optLevel : undefined,
            };
          });
          detailSections = propertyChips.length > 0 ? [{ label: 'Properties & Proficiencies', chips: propertyChips }] : undefined;
          totalCost = propertyChips.reduce((sum, c) => sum + (c.cost ?? 0), 0) || undefined;
        }

        return {
          id: String(item.id),
          name: String(item.name ?? ''),
          description: String((item as UserPower | UserTechnique | UserItem).description ?? '') || 'No description available.',
          columns: getItemColumns(item, itemType, techniqueDisplay),
          detailSections,
          totalCost,
          costLabel: totalCost != null ? costLabel : undefined,
          data: item,
        };
      });
  }, [rawItems, existingIds, itemType, techniquePartsDb, powerPartsDb, itemPropertiesDb]);

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
      description="Click a row (or the + button) to select, then click Add Selected."
      headerExtra={<SourceFilter value={source} onChange={setSource} />}
      items={items}
      isLoading={isLoading}
      onConfirm={handleConfirm}
      columns={getListHeaderColumns(itemType)}
      gridColumns={getModalGridColumns(itemType)}
      itemLabel={itemType}
      emptyMessage={emptyTitle}
      emptySubMessage={emptyDesc}
      searchPlaceholder={`Search ${itemType}s...`}
      showQuantity={itemType === 'equipment'}
      size="lg"
      className="max-h-[60vh]"
    />
  );
}

export default AddLibraryItemModal;
