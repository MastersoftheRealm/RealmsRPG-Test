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
  capitalize,
} from '@/lib/utils';
import { resolveListRowThumbnail } from '@/lib/list-row-image';
import type { ChoiceCardImageKind } from '@/components/guided-creator/guided-choice-image';
import {
  deriveShieldAmountFromProperties,
  deriveShieldDamageFromProperties,
} from '@/lib/calculators';
import { derivePowerDisplay, formatPowerDamage } from '@/lib/calculators/power-calc';
import type { PowerDocument } from '@/lib/calculators/power-calc';
import { deriveTechniqueDisplay } from '@/lib/calculators/technique-calc';
import type { TechniqueDocument } from '@/lib/calculators/technique-calc';
import { attackModeColumnLabel, deriveTechniqueAttackMode } from '@/lib/attack-mode';
import { partChipsFromDisplay } from '@/lib/chip/part-chips-from-display';
import {
  buildPartsAndMetadataDetailSections,
  propertiesProficienciesSection,
} from '@/lib/chip/list-row-metadata';
import {
  actionTypeFactChip,
  energyFactChip,
  formatActionTypeValue,
  namedPropertyDescriptorChips,
  trainingPointsFactChip,
  TRAINING_POINTS_COST_LABEL,
} from '@/lib/detail-option/compact-facts';
import {
  derivePartCategories,
  powerHasDamageCategory,
  withDamageCategory,
} from '@/lib/library/power-technique-categories';
import type { PowerTechniqueFilterableRow } from '@/lib/library/power-technique-filters';
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
  image_id?: string | null;
  image_url?: string | null;
};

function selectableImageKind(itemType: LibraryItemType): ChoiceCardImageKind | null {
  if (itemType === 'power') return 'power';
  if (itemType === 'technique') return 'technique';
  if (
    itemType === 'weapon' ||
    itemType === 'shield' ||
    itemType === 'armor' ||
    itemType === 'equipment' ||
    itemType === 'item'
  ) {
    return 'equipment';
  }
  return null;
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

/**
 * Shared Energy / TP / Action Type from derivePowerDisplay / deriveTechniqueDisplay.
 * Used by Add/Load modals and Guided creator (TASK-687 cleanup) — single derive path.
 */
export type PowerTechniqueBudgetKind = 'power' | 'technique';

export interface PowerTechniqueBudgetFacts {
  energy?: number;
  tp: number;
  actionType: string;
  name: string;
  description?: string;
}

type PowerTechniqueBudgetItem = {
  id?: string | number;
  docId?: string;
  name?: string;
  description?: string;
  parts?: unknown;
  actionType?: string;
  isReaction?: boolean;
  weapon?: { name?: string } | null;
  weaponName?: string;
};

export function derivePowerTechniqueBudgetFacts(
  kind: PowerTechniqueBudgetKind,
  item: PowerTechniqueBudgetItem | undefined,
  powerPartsDb: PowerPart[],
  techniquePartsDb: TechniquePart[]
): PowerTechniqueBudgetFacts {
  const name = item?.name ? String(item.name) : '';
  const description = item?.description ? String(item.description) : undefined;
  if (!item) {
    return { tp: 0, actionType: '—', name, description };
  }
  try {
    if (kind === 'technique') {
      const doc: TechniqueDocument = {
        name: String(item.name ?? ''),
        description: String(item.description ?? ''),
        parts: (item.parts ?? []) as TechniqueDocument['parts'],
        actionType: item.actionType,
        weapon: item.weapon?.name
          ? { name: item.weapon.name }
          : item.weaponName
            ? { name: item.weaponName }
            : undefined,
      };
      const disp = deriveTechniqueDisplay(doc, techniquePartsDb);
      const energy =
        typeof disp.energy === 'number' ? Math.max(0, Math.floor(disp.energy)) : undefined;
      return {
        energy,
        tp: Math.max(0, Math.round(disp.tp ?? 0)),
        actionType: formatActionTypeForDisplay(disp.actionType || item.actionType || ''),
        name: name || String(item.id ?? item.docId ?? ''),
        description,
      };
    }
    const doc: PowerDocument = {
      name: String(item.name ?? ''),
      description: String(item.description ?? ''),
      parts: (item.parts ?? []) as PowerDocument['parts'],
      actionType: item.actionType,
      isReaction: item.isReaction,
    };
    const disp = derivePowerDisplay(doc, powerPartsDb);
    const energy =
      typeof disp.energy === 'number' ? Math.max(0, Math.floor(disp.energy)) : undefined;
    return {
      energy,
      tp: Math.max(0, Math.round(disp.tp ?? 0)),
      actionType:
        disp.actionType ||
        formatSavedActionTypeForDisplay(item.actionType, item.isReaction) ||
        '—',
      name: name || String(item.id ?? item.docId ?? ''),
      description,
    };
  } catch {
    return { tp: 0, actionType: '—', name, description };
  }
}

/** Guided L2/L3 budget columns: Action Type | Energy | Training Points. */
export function getPowerTechniqueBudgetColumns(
  facts: PowerTechniqueBudgetFacts
): ColumnValue[] {
  return [
    { key: 'action', value: facts.actionType || '—', align: 'center' },
    {
      key: 'energy',
      value: facts.energy != null ? String(facts.energy) : '—',
      align: 'center',
    },
    { key: 'tp', value: String(facts.tp), align: 'center' },
  ];
}

/**
 * Guided L1 card + L2/L3 SelectableItem display from the shared budget derive path (TASK-691).
 * Title chips = Training Points; detail chips = Action Type + Energy.
 */
export interface PowerTechniqueBudgetDisplay {
  name: string;
  description?: string;
  energy?: number;
  tp: number;
  /** Display Action Type (for columns). */
  actionType: string;
  /** Capitalized Action Type value for filters (no "Action Type" prefix). */
  actionTypeFilter?: string;
  columns: ColumnValue[];
  titleChips: ChipData[];
  detailChips: ChipData[];
}

export function buildPowerTechniqueBudgetDisplay(
  kind: PowerTechniqueBudgetKind,
  item: PowerTechniqueBudgetItem | undefined,
  fallbackId: string,
  powerPartsDb: PowerPart[],
  techniquePartsDb: TechniquePart[]
): PowerTechniqueBudgetDisplay {
  const titleChips: ChipData[] = [];
  const detailChips: ChipData[] = [];

  if (!item) {
    const tpChip = trainingPointsFactChip(0);
    if (tpChip) titleChips.push(tpChip);
    return {
      name: fallbackId,
      description: undefined,
      tp: 0,
      actionType: '—',
      columns: getPowerTechniqueBudgetColumns({
        tp: 0,
        actionType: '—',
        name: fallbackId,
      }),
      titleChips,
      detailChips,
    };
  }

  const facts = derivePowerTechniqueBudgetFacts(
    kind,
    item,
    powerPartsDb,
    techniquePartsDb
  );
  const name = facts.name || fallbackId;
  const description = facts.description;
  const tp = facts.tp;
  const energy = facts.energy;
  const rawAction = item.actionType ?? facts.actionType;
  const actionChip = actionTypeFactChip(rawAction);
  if (actionChip) detailChips.push(actionChip);
  const tpChip = trainingPointsFactChip(tp);
  if (tpChip) titleChips.push(tpChip);
  const energyChip = energyFactChip(energy);
  if (energyChip) detailChips.push(energyChip);

  return {
    name,
    description,
    energy,
    tp,
    actionType: facts.actionType || '—',
    actionTypeFilter: formatActionTypeValue(rawAction),
    columns: getPowerTechniqueBudgetColumns({
      ...facts,
      name,
      description,
    }),
    titleChips,
    detailChips,
  };
}

/** Build filter-apply row for USM / library PowerTechniqueFilters (TASK-675). */
export function buildPowerTechniqueFilterableRow(
  kind: PowerTechniqueBudgetKind,
  item: PowerTechniqueBudgetItem & {
    parts?: unknown;
    damage?: unknown;
    isReaction?: boolean;
  },
  powerPartsDb: PowerPart[],
  techniquePartsDb: TechniquePart[]
): PowerTechniqueFilterableRow {
  const facts = derivePowerTechniqueBudgetFacts(
    kind,
    item,
    powerPartsDb,
    techniquePartsDb
  );
  const parts = Array.isArray(item.parts) ? item.parts : [];
  const partsDb = kind === 'technique' ? techniquePartsDb : powerPartsDb;
  let categories = derivePartCategories(
    parts as Parameters<typeof derivePartCategories>[0],
    partsDb
  );
  if (kind === 'power') {
    categories = withDamageCategory(categories, powerHasDamageCategory(item.damage));
  }
  return {
    categories,
    energy: facts.energy,
    tp: facts.tp,
    actionTypeRaw: item.actionType ?? facts.actionType,
    action: facts.actionType,
    isReaction: item.isReaction === true,
    partIds: parts
      .map((part) => {
        const p = part as { id?: string | number };
        return p.id != null ? String(p.id) : '';
      })
      .filter(Boolean),
    partNames: parts
      .map((part) => {
        const p = part as { name?: string };
        return p.name != null ? String(p.name) : '';
      })
      .filter(Boolean),
  };
}

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
      { key: 'Attack', value: techniqueDisplay.weaponName || '-', align: 'center' as const },
      { key: 'Training Pts', value: String(techniqueDisplay.tp), align: 'center' as const },
    ];
  }
  if (itemType === 'technique') {
    const technique = item as UserTechnique;
    const attackLabel = attackModeColumnLabel(
      deriveTechniqueAttackMode({
        attackMode: technique.attackMode,
        parts: technique.parts,
        weapon: technique.weapon,
      }),
    );
    return [
      { key: 'Action', value: formatActionTypeForDisplay(technique.actionType ?? ''), align: 'center' as const },
      { key: 'Attack', value: attackLabel, align: 'center' as const },
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
        { key: 'Attack', label: 'Attack', align: 'center' as const },
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
  const costLabel = TRAINING_POINTS_COST_LABEL;
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
    detailSections = buildPartsAndMetadataDetailSections({
      range: display.range,
      partChips,
      partsFamily: 'power',
    });
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
      attackMode: t.attackMode,
      weaponName: t.weaponName,
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
      partsFamily: 'technique',
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
    const propertyChips: ChipData[] = namedPropertyDescriptorChips(props, itemPropertiesDb).map(
      (chip) => {
        const prop = props.find((p) => {
          const n = typeof p === 'string' ? p : String(p?.name ?? '');
          return n.toLowerCase() === chip.name.toLowerCase();
        });
        const lvl = typeof prop === 'object' && prop?.op_1_lvl != null ? Number(prop.op_1_lvl) : 0;
        if (lvl <= 1) return chip;
        const base = chip.description?.trim();
        return {
          ...chip,
          description: base ? `${base}\n\nOption 1: Lv.${lvl}` : `Option 1: Lv.${lvl}`,
          level: lvl,
        };
      }
    );
    const propertyFamily =
      effectiveType === 'armor'
        ? 'armor'
        : effectiveType === 'shield'
          ? 'shield'
          : effectiveType === 'weapon'
            ? 'weapon'
            : 'item';
    const propertySection = propertiesProficienciesSection(propertyChips, propertyFamily);
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

  const name = String(item.name ?? '');
  const imageKind = selectableImageKind(itemType);
  const thumbnail = imageKind
    ? resolveListRowThumbnail(imageKind, item, name)
    : undefined;

  const powerTechniqueFilter =
    itemType === 'power'
      ? buildPowerTechniqueFilterableRow(
          'power',
          item as UserPower,
          powerPartsDb,
          techniquePartsDb
        )
      : itemType === 'technique'
        ? buildPowerTechniqueFilterableRow(
            'technique',
            item as UserTechnique,
            powerPartsDb,
            techniquePartsDb
          )
        : undefined;

  return {
    id: String(item.id),
    name,
    description: String((item as UserPower | UserTechnique | UserItem).description ?? '') || 'No description available.',
    columns,
    detailSections,
    totalCost,
    costLabel: totalCost != null ? costLabel : undefined,
    thumbnail,
    data: item,
    powerTechniqueFilter,
  };
}
