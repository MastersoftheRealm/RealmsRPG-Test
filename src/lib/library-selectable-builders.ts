/**
 * Shared builders for SelectableItem[] used by Add Library Item modal and Load From Library modal.
 * Single source of truth for columns, grid, and mapping raw library items to SelectableItem (with chips, detailSections).
 */

import type { ColumnValue, ChipData } from '@/components/shared/grid-list-row';
import type { SelectableItem } from '@/components/shared/unified-selection-modal';
import {
  formatDamageDisplay,
  formatSavedActionTypeForDisplay,
  formatActionTypeForDisplay,
  formatListCellLabel,
} from '@/lib/utils';
import {
  deriveShieldAmountFromProperties,
  deriveShieldDamageFromProperties,
  trainingPointsForItemPropertyRef,
} from '@/lib/calculators';
import { derivePowerDisplay, formatPowerDamage } from '@/lib/calculators/power-calc';
import type { PowerDocument } from '@/lib/calculators/power-calc';
import { deriveTechniqueDisplay } from '@/lib/calculators/technique-calc';
import type { TechniqueDocument } from '@/lib/calculators/technique-calc';
import { partChipsFromDisplay } from '@/lib/chip/part-chips-from-display';
import {
  buildPartsAndMetadataDetailSections,
  propertiesProficienciesSection,
} from '@/lib/chip/list-row-metadata';
import type { PowerPart, TechniquePart, ItemProperty } from '@/hooks/codex-types';
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
  properties?: Array<
    string | { id?: string | number; name?: string; op_1_lvl?: number; base_tp?: number; op_1_tp?: number }
  >;
  type?: string;
};

function capitalize(s: string | undefined): string {
  if (!s) return '-';
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export type TechniqueColumnDisplay = {
  energy: number;
  weaponName: string;
  tp: number;
  actionType: string;
};

/** Collapsed power columns for add/load modals (Range stays a labeled expanded chip). */
export type PowerColumnDisplay = {
  energy: number | string;
  actionType: string;
  duration: string;
  damage: string;
  area: string;
};

export function getItemColumns(
  item: UserPower | UserTechnique | UserItem | EqItem,
  itemType: LibraryItemType,
  techniqueDisplay?: TechniqueColumnDisplay,
  powerDisplay?: PowerColumnDisplay
): ColumnValue[] {
  if (itemType === 'power') {
    if (powerDisplay) {
      return [
        { key: 'Energy', value: String(powerDisplay.energy ?? '-'), align: 'center' as const },
        { key: 'Action', value: powerDisplay.actionType || '-', align: 'center' as const },
        { key: 'Duration', value: powerDisplay.duration || '-', align: 'center' as const },
        { key: 'Area', value: powerDisplay.area || '-', align: 'center' as const },
        { key: 'Damage', value: powerDisplay.damage || '-', align: 'center' as const },
      ];
    }
    const power = item as UserPower;
    const damageStr = formatPowerDamage(power.damage) || '-';
    const areaStr = power.area?.type ? capitalize(power.area.type) : '-';
    return [
      { key: 'Energy', value: '-', align: 'center' as const },
      {
        key: 'Action',
        value: formatSavedActionTypeForDisplay(power.actionType, power.isReaction),
        align: 'center' as const,
      },
      { key: 'Duration', value: '-', align: 'center' as const },
      { key: 'Area', value: areaStr, align: 'center' as const },
      { key: 'Damage', value: damageStr, align: 'center' as const },
    ];
  }
  if (itemType === 'technique' && techniqueDisplay) {
    return [
      { key: 'Action', value: techniqueDisplay.actionType || '-', align: 'center' as const },
      { key: 'Energy', value: String(techniqueDisplay.energy), align: 'center' as const },
      { key: 'Weapon', value: techniqueDisplay.weaponName || '-', align: 'center' as const },
      { key: 'Training Pts', value: String(techniqueDisplay.tp), align: 'center' as const },
    ];
  }
  if (itemType === 'technique') {
    const technique = item as UserTechnique;
    return [
      { key: 'Action', value: formatActionTypeForDisplay(technique.actionType ?? ''), align: 'center' as const },
      { key: 'Weapon', value: technique.weapon?.name || '-', align: 'center' as const },
      { key: 'Training Pts', value: '-', align: 'center' as const },
    ];
  }
  if (itemType === 'weapon' || (itemType === 'item' && (item as EqItem).type?.toLowerCase() === 'weapon')) {
    const weapon = item as UserItem | EqItem;
    const val = weapon.damage ? formatDamageDisplay(weapon.damage) : null;
    return itemType === 'item' && val
      ? [{ key: 'stat', value: val, highlight: true }]
      : val
        ? [{ key: 'Damage', value: val, highlight: true }]
        : [];
  }
  if (itemType === 'armor' || (itemType === 'item' && (item as EqItem).type?.toLowerCase() === 'armor')) {
    const armor = item as UserItem | EqItem;
    const val = armor.armorValue != null ? String(armor.armorValue) : null;
    return itemType === 'item' && val
      ? [{ key: 'stat', value: `Damage Reduction ${val}`, highlight: true }]
      : val
        ? [{ key: 'Armor', value: val, highlight: true }]
        : [];
  }
  if (itemType === 'shield' || (itemType === 'item' && (item as EqItem).type?.toLowerCase() === 'shield')) {
    const shield = item as UserItem | EqItem;
    const props = (shield.properties || []) as Array<{ id?: number; name?: string; op_1_lvl?: number }>;
    const block = deriveShieldAmountFromProperties(props);
    const dmg =
      deriveShieldDamageFromProperties(props) ??
      (shield.damage ? formatDamageDisplay(shield.damage) : null);
    if (itemType === 'item') {
      const parts = [
        block !== '-' ? `Block ${block}` : null,
        dmg ? (String(dmg).toLowerCase().startsWith('damage') ? dmg : `Damage ${dmg}`) : null,
      ].filter(Boolean);
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
      // Name, Energy, Action, Duration, Area, Damage — Range is a labeled expanded chip
      return '1.2fr 0.55fr 0.75fr 0.75fr 0.65fr 1fr';
    case 'technique':
      return '1.4fr 1fr 0.7fr 1fr 0.8fr';
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
): { key: string; label: string; sortable?: boolean; align?: 'left' | 'center' | 'right' }[] {
  const base = [{ key: 'name', label: 'Name', align: 'left' as const }];
  switch (itemType) {
    case 'power':
      return [
        ...base,
        { key: 'Energy', label: 'Energy', align: 'center' as const },
        { key: 'Action', label: 'Action', align: 'center' as const },
        { key: 'Duration', label: 'Duration', align: 'center' as const },
        { key: 'Area', label: 'Area', align: 'center' as const },
        { key: 'Damage', label: 'Damage', align: 'center' as const },
      ];
    case 'technique':
      return [
        ...base,
        { key: 'Action', label: 'Action', align: 'center' as const },
        { key: 'Energy', label: 'Energy', align: 'center' as const },
        { key: 'Weapon', label: 'Weapon', align: 'center' as const },
        { key: 'Training Pts', label: 'Training Pts', align: 'center' as const },
      ];
    case 'weapon':
      return [...base, { key: 'damage', label: 'Damage', align: 'center' as const }];
    case 'shield':
      return [
        ...base,
        { key: 'Block', label: 'Block', align: 'center' as const },
        { key: 'Damage', label: 'Damage', align: 'center' as const },
      ];
    case 'armor':
      return [...base, { key: 'armor', label: 'Dmg. Red.', align: 'center' as const }];
    case 'item':
      return [
        ...base,
        { key: 'type', label: 'Type', align: 'center' as const },
        { key: 'stat', label: 'Damage / Damage Reduction / Block', align: 'center' as const },
      ];
    case 'equipment':
    default:
      return base;
  }
}

/** Columns for empowered technique rows (sheet add + creator load). */
export const EMPOWERED_POWER_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'Energy', label: 'Energy' },
  { key: 'Action', label: 'Action' },
  { key: 'Duration', label: 'Duration' },
  { key: 'Area', label: 'Area' },
  { key: 'Damage', label: 'Damage' },
];

export interface BuildSelectableItemCodex {
  powerPartsDb: PowerPart[];
  techniquePartsDb: TechniquePart[];
  itemPropertiesDb: ItemProperty[];
}

/** Build one SelectableItem from a raw library item (user or public). Used by add and load modals. */
export function buildSelectableItem(
  item: UserPower | UserTechnique | UserItem | EqItem,
  itemType: LibraryItemType,
  codex: BuildSelectableItemCodex
): SelectableItem {
  let techniqueDisplay: TechniqueColumnDisplay | undefined;
  let detailSections: SelectableItem['detailSections'];
  let totalCost: number | undefined;
  const costLabel = 'TP';
  const { powerPartsDb, techniquePartsDb, itemPropertiesDb } = codex;

  const effectiveType: LibraryItemType =
    itemType === 'item'
      ? ((item as UserItem | EqItem).type?.toLowerCase() as 'weapon' | 'armor' | 'shield') || 'weapon'
      : itemType;

  let powerDisplay: PowerColumnDisplay | undefined;
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
    const partChips = partChipsFromDisplay(display.partChips);
    // Range omitted from dense modal columns → labeled expanded chip (TASK-437)
    detailSections = buildPartsAndMetadataDetailSections({ range: display.range, partChips });
    totalCost = display.tp > 0 ? display.tp : undefined;
    powerDisplay = {
      energy: display.energy,
      actionType: display.actionType || formatSavedActionTypeForDisplay(p.actionType, p.isReaction),
      duration: display.duration || '-',
      damage: formatPowerDamage(doc.damage) || '-',
      area: display.area || '-',
    };
  } else if (itemType === 'technique') {
    const t = item as UserTechnique;
    const doc: TechniqueDocument = {
      name: String(t.name ?? ''),
      description: String(t.description ?? ''),
      parts: Array.isArray(t.parts) ? (t.parts as TechniqueDocument['parts']) : [],
      damage: Array.isArray(t.damage) && t.damage[0] ? t.damage[0] : (t.damage as TechniqueDocument['damage']),
      weapon: t.weapon as TechniqueDocument['weapon'],
      actionType: t.actionType,
      isReaction: t.isReaction,
    };
    const display = deriveTechniqueDisplay(doc, techniquePartsDb);
    techniqueDisplay = {
      energy: display.energy,
      weaponName: display.weaponName,
      tp: display.tp,
      actionType: display.actionType,
    };
    const partChips = partChipsFromDisplay(display.partChips);
    detailSections = buildPartsAndMetadataDetailSections({
      damage: display.damageStr !== '-' ? display.damageStr : undefined,
      partChips,
    });
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
      const cost = trainingPointsForItemPropertyRef(prop, itemPropertiesDb);
      const lvl = typeof prop === 'object' && prop?.op_1_lvl != null ? prop.op_1_lvl : 0;
      const baseDesc = dbProp?.description;
      const descWithOpt = baseDesc?.trim()
        ? lvl > 1
          ? `${baseDesc.trim()}\n\nOption 1: Lv.${lvl}`
          : baseDesc.trim()
        : lvl > 1
          ? `Option 1: Lv.${lvl}`
          : undefined;
      return {
        name: dbProp?.name || propName,
        description: descWithOpt,
        cost: cost > 0 ? cost : undefined,
        costLabel: 'TP',
        category: (cost > 0 ? 'cost' : 'default') as 'cost' | 'default',
        level: lvl > 1 ? lvl : undefined,
      };
    });
    const propertySection = propertiesProficienciesSection(propertyChips);
    detailSections = propertySection ? [propertySection] : undefined;
    totalCost = propertyChips.reduce((sum, c) => sum + (c.cost ?? 0), 0) || undefined;
  }

  const columns = getItemColumns(
    item,
    itemType === 'item' ? effectiveType : itemType,
    techniqueDisplay,
    powerDisplay
  );
  if (itemType === 'item') {
    const typeLabel = formatListCellLabel((item as EqItem).type);
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
