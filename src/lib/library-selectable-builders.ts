/**
 * Shared builders for SelectableItem[] used by Add Library Item modal and Load From Library modal.
 * Single source of truth for columns, grid, and mapping raw library items to SelectableItem (with chips, detailSections).
 */

import type { ColumnValue, ChipData } from '@/components/shared/grid-list-row';
import type { SelectableItem } from '@/components/shared/unified-selection-modal';
import { formatDamageDisplay } from '@/lib/utils';
import { deriveShieldAmountFromProperties, deriveShieldDamageFromProperties } from '@/lib/calculators';
import { derivePowerDisplay } from '@/lib/calculators/power-calc';
import type { PowerDocument } from '@/lib/calculators/power-calc';
import { deriveTechniqueDisplay } from '@/lib/calculators/technique-calc';
import type { TechniqueDocument } from '@/lib/calculators/technique-calc';
import type { PowerPart, TechniquePart } from '@/hooks/use-rtdb';
import type { UserPower, UserTechnique, UserItem } from '@/hooks/use-user-library';

export type LibraryItemType =
  | 'power'
  | 'technique'
  | 'weapon'
  | 'shield'
  | 'armor'
  | 'equipment'
  | 'item'; // 'item' = all armaments (load modal)

export type EqItem = {
  id: string;
  name?: string;
  description?: string;
  damage?: unknown;
  armorValue?: number;
  properties?: string[] | Array<{ id?: string | number; name?: string; op_1_lvl?: number }>;
  type?: string;
};

function capitalize(s: string | undefined): string {
  if (!s) return '-';
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getItemColumns(
  item: UserPower | UserTechnique | UserItem | EqItem,
  itemType: LibraryItemType,
  techniqueDisplay?: { energy: number; weaponName: string; tp: number }
): ColumnValue[] {
  if (itemType === 'power') {
    const power = item as UserPower;
    const damageStr = power.damage?.length ? power.damage.map((d) => capitalize(d.type)).join(', ') : '-';
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
  if (itemType === 'weapon' || (itemType === 'item' && (item as EqItem).type === 'weapon')) {
    const weapon = item as UserItem | EqItem;
    const val = weapon.damage ? formatDamageDisplay(weapon.damage) : null;
    return itemType === 'item' && val
      ? [{ key: 'stat', value: val, highlight: true }]
      : val
        ? [{ key: 'Damage', value: val, highlight: true }]
        : [];
  }
  if (itemType === 'armor' || (itemType === 'item' && (item as EqItem).type === 'armor')) {
    const armor = item as UserItem | EqItem;
    const val = armor.armorValue ? `+${armor.armorValue}` : null;
    return itemType === 'item' && val
      ? [{ key: 'stat', value: val, highlight: true }]
      : val
        ? [{ key: 'Armor', value: val, highlight: true }]
        : [];
  }
  if (itemType === 'shield' || (itemType === 'item' && (item as EqItem).type === 'shield')) {
    const shield = item as UserItem | EqItem;
    const props = (shield.properties || []) as Array<{ id?: number; name?: string; op_1_lvl?: number }>;
    const block = deriveShieldAmountFromProperties(props);
    const dmg =
      deriveShieldDamageFromProperties(props) ??
      (shield.damage ? formatDamageDisplay(shield.damage) : null);
    if (itemType === 'item') {
      const parts = [block !== '-' ? `Block ${block}` : null, dmg].filter(Boolean);
      return [{ key: 'stat', value: parts.join(' · ') || '-', highlight: true }];
    }
    const cols: ColumnValue[] = [];
    if (block !== '-') cols.push({ key: 'Block', value: block, highlight: true });
    if (dmg) cols.push({ key: 'Damage', value: dmg, highlight: true });
    return cols;
  }
  return [];
}

export function getModalGridColumns(itemType: LibraryItemType): string {
  switch (itemType) {
    case 'power':
      return '1.4fr 0.8fr 0.8fr 0.7fr';
    case 'technique':
      return '1.4fr 0.7fr 1fr 0.8fr';
    case 'weapon':
    case 'shield':
    case 'armor':
      return '1.5fr 1fr';
    case 'item':
      return '1.2fr 0.6fr 1fr'; // Name, Type, Stat
    case 'equipment':
    default:
      return '1.5fr';
  }
}

export function getListHeaderColumns(
  itemType: LibraryItemType
): { key: string; label: string; sortable?: boolean }[] {
  const base = [{ key: 'name', label: 'Name' }];
  switch (itemType) {
    case 'power':
      return [...base, { key: 'Action', label: 'Action' }, { key: 'Damage', label: 'Damage' }, { key: 'Area', label: 'Area' }];
    case 'technique':
      return [...base, { key: 'Energy', label: 'Energy' }, { key: 'Weapon', label: 'Weapon' }, { key: 'Training Pts', label: 'Training Pts' }];
    case 'weapon':
      return [...base, { key: 'damage', label: 'Damage' }];
    case 'shield':
      return [...base, { key: 'Block', label: 'Block' }, { key: 'Damage', label: 'Damage' }];
    case 'armor':
      return [...base, { key: 'armor', label: 'Armor' }];
    case 'item':
      return [...base, { key: 'type', label: 'Type' }, { key: 'stat', label: 'Damage / Armor / Block' }];
    case 'equipment':
    default:
      return base;
  }
}

export interface BuildSelectableItemCodex {
  powerPartsDb: PowerPart[];
  techniquePartsDb: TechniquePart[];
  itemPropertiesDb: Array<{ name?: string; base_tp?: number; tp_cost?: number; description?: string; [k: string]: unknown }>;
}

/** Build one SelectableItem from a raw library item (user or public). Used by add and load modals. */
export function buildSelectableItem(
  item: UserPower | UserTechnique | UserItem | EqItem,
  itemType: LibraryItemType,
  codex: BuildSelectableItemCodex
): SelectableItem {
  let techniqueDisplay: { energy: number; weaponName: string; tp: number } | undefined;
  let detailSections: SelectableItem['detailSections'];
  let totalCost: number | undefined;
  const costLabel = 'TP';
  const { powerPartsDb, techniquePartsDb, itemPropertiesDb } = codex;

  const effectiveType: LibraryItemType =
    itemType === 'item' ? ((item as UserItem | EqItem).type?.toLowerCase() as 'weapon' | 'armor' | 'shield') || 'weapon' : itemType;

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
      category: (chip.finalTP && chip.finalTP > 0 ? 'cost' : 'default') as 'cost' | 'default',
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
      category: (chip.finalTP && chip.finalTP > 0 ? 'cost' : 'default') as 'cost' | 'default',
    }));
    detailSections = partChips.length > 0 ? [{ label: 'Parts & Proficiencies', chips: partChips }] : undefined;
    totalCost = typeof display.tp === 'number' && display.tp > 0 ? display.tp : undefined;
  } else if (
    itemType === 'weapon' ||
    itemType === 'shield' ||
    itemType === 'armor' ||
    itemType === 'equipment' ||
    itemType === 'item'
  ) {
    const it = item as UserItem | EqItem;
    const props = (Array.isArray(it.properties) ? it.properties : []) as Array<{
      id?: string | number;
      name?: string;
      op_1_lvl?: number;
    }>;
    const propertyChips: ChipData[] = props.map((prop) => {
      const propName = typeof prop === 'string' ? prop : prop?.name ?? '';
      const dbProp = itemPropertiesDb.find((p) => p.name?.toLowerCase() === String(propName).toLowerCase());
      const baseTp = dbProp?.base_tp ?? (dbProp as { tp_cost?: number })?.tp_cost ?? 0;
      const optLevel = typeof prop === 'object' && prop?.op_1_lvl != null ? prop.op_1_lvl : 1;
      const cost = baseTp * optLevel;
      const baseDesc = dbProp?.description;
      const descWithOpt = baseDesc?.trim()
        ? optLevel > 1
          ? `${baseDesc.trim()}\n\nOption 1: Lv.${optLevel}`
          : baseDesc.trim()
        : optLevel > 1
          ? `Option 1: Lv.${optLevel}`
          : undefined;
      return {
        name: dbProp?.name || propName,
        description: descWithOpt,
        cost: cost > 0 ? cost : undefined,
        costLabel: 'TP',
        category: (cost > 0 ? 'cost' : 'default') as 'cost' | 'default',
        level: optLevel > 1 ? optLevel : undefined,
      };
    });
    detailSections =
      propertyChips.length > 0 ? [{ label: 'Properties & Proficiencies', chips: propertyChips }] : undefined;
    totalCost = propertyChips.reduce((sum, c) => sum + (c.cost ?? 0), 0) || undefined;
  }

  const columns = getItemColumns(item, itemType === 'item' ? effectiveType : itemType, techniqueDisplay);
  if (itemType === 'item') {
    const typeLabel = capitalize((item as EqItem).type);
    columns.unshift({ key: 'type', value: typeLabel, align: 'center' as const });
  }

  return {
    id: String(item.id),
    name: String(item.name ?? ''),
    description: String((item as UserPower | UserTechnique | UserItem).description ?? '') || 'No description available.',
    columns,
    detailSections,
    totalCost,
    costLabel: totalCost != null ? costLabel : undefined,
    data: item,
  };
}
