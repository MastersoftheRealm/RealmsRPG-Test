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
  capitalize,
  formatListCellLabel,
} from '@/lib/utils';
import { resolveListRowThumbnail } from '@/lib/list-row-image';
import type { ChoiceCardImageKind } from '@/components/guided-creator/guided-choice-image';
import {
  deriveAgilityReductionFromProperties,
  deriveCriticalRangeIncreaseFromProperties,
  deriveShieldAmountFromProperties,
  deriveShieldDamageFromProperties,
  resolveWeaponRangeDisplay,
  calculateItemCosts,
  type ItemPropertyPayload,
} from '@/lib/calculators';
import { deriveAbilityRequirementFromProperties } from '@/lib/game/weapon-attack-ability';
import { derivePowerDisplay, formatPowerDamage } from '@/lib/calculators/power-calc';
import type { PowerDocument } from '@/lib/calculators/power-calc';
import { deriveTechniqueDisplay } from '@/lib/calculators/technique-calc';
import type { TechniqueDocument } from '@/lib/calculators/technique-calc';
import {
  attackModeColumnLabel,
  deriveTechniqueAttackMode,
  type AttackMode,
} from '@/lib/attack-mode';
import { partChipsFromDisplay } from '@/lib/chip/part-chips-from-display';
import {
  buildGlrFactDetailSections,
  partsProficienciesSection,
  propertiesProficienciesSection,
} from '@/lib/chip/list-row-metadata';
import {
  actionTypeFactChip,
  energyFactChip,
  formatActionTypeValue,
  namedPropertyDescriptorChips,
  trainingPointsFactChip,
} from '@/lib/detail-option/compact-facts';
import { glrColumnKeyFor, glrListChrome } from '@/lib/glr';
import {
  derivePartCategories,
  formatPartCategoriesColumn,
  powerHasDamageCategory,
  withDamageCategory,
} from '@/lib/library/power-technique-categories';
import type { PowerTechniqueFilterableRow } from '@/lib/library/power-technique-filters';
import type { PowerPart, TechniquePart, ItemProperty } from '@/hooks/codex-types';
import type { UserPower, UserTechnique, UserItem } from '@/hooks/use-user-library';

const selectPowerChrome = glrListChrome(
  { entityType: 'power', mode: 'select' },
  { labelStyle: 'title', keyStyle: 'usm' },
);
const selectTechniqueChrome = glrListChrome(
  { entityType: 'technique', mode: 'select' },
  { labelStyle: 'title', keyStyle: 'usm' },
);
const selectWeaponChrome = glrListChrome(
  { entityType: 'weapon', mode: 'select' },
  { labelStyle: 'title', keyStyle: 'usm' },
);
const selectArmorChrome = glrListChrome(
  { entityType: 'armor', mode: 'select' },
  { labelStyle: 'title', keyStyle: 'usm' },
);
const selectShieldChrome = glrListChrome(
  { entityType: 'shield', mode: 'select' },
  { labelStyle: 'title', keyStyle: 'usm' },
);

const selectGearChrome = glrListChrome(
  { entityType: 'gear', mode: 'select' },
  { labelStyle: 'title', keyStyle: 'usm' },
);

function selectChromeFor(
  type: 'power' | 'technique' | 'weapon' | 'armor' | 'shield' | 'equipment',
) {
  switch (type) {
    case 'power':
      return selectPowerChrome;
    case 'technique':
      return selectTechniqueChrome;
    case 'weapon':
      return selectWeaponChrome;
    case 'armor':
      return selectArmorChrome;
    case 'shield':
      return selectShieldChrome;
    case 'equipment':
      return selectGearChrome;
  }
}

export type LibraryItemType = 'power' | 'technique' | 'weapon' | 'shield' | 'armor' | 'equipment';

export type EqItem = {
  id: string;
  name?: string;
  description?: string;
  damage?: unknown;
  armorValue?: number;
  range?: string | number | null;
  abilityRequirement?: { name?: string; level?: number } | null;
  agilityReduction?: number | null;
  properties?: Array<
    | string
    | { id?: string | number; name?: string; op_1_lvl?: number; base_tp?: number; op_1_tp?: number }
  >;
  type?: string;
  rarity?: string;
  category?: string;
  cost?: number;
  costs?: { totalTP?: number; totalCurrency?: number; totalIP?: number };
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
    itemType === 'equipment'
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

/** Collapsed power columns for add/load modals (Range is a chipFact at select density). */
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
  damage?: unknown;
  actionType?: string;
  isReaction?: boolean;
  range?: PowerDocument['range'];
  area?: PowerDocument['area'];
  duration?: PowerDocument['duration'];
  attackMode?: AttackMode;
  weapon?: TechniqueDocument['weapon'];
  weaponName?: string;
};

/** Match `buildOfficialPowerRows` / `buildSelectableItem` PowerDocument shape (TASK-708). */
export function libraryItemToPowerDocument(item: PowerTechniqueBudgetItem): PowerDocument {
  const savedParts: NonNullable<PowerDocument['parts']> = Array.isArray(item.parts)
    ? (item.parts as NonNullable<PowerDocument['parts']>)
    : [];
  return {
    name: String(item.name ?? ''),
    description: String(item.description ?? ''),
    parts: savedParts,
    damage: item.damage as PowerDocument['damage'],
    actionType: item.actionType,
    isReaction: item.isReaction,
    range: item.range,
    area: item.area,
    duration: item.duration,
  };
}

/** Match `buildOfficialTechniqueRows` / `buildSelectableItem` TechniqueDocument shape (TASK-708). */
export function libraryItemToTechniqueDocument(item: PowerTechniqueBudgetItem): TechniqueDocument {
  const savedParts: NonNullable<TechniqueDocument['parts']> = Array.isArray(item.parts)
    ? (item.parts as NonNullable<TechniqueDocument['parts']>)
    : [];
  return {
    name: String(item.name ?? ''),
    description: String(item.description ?? ''),
    parts: savedParts,
    damage: Array.isArray(item.damage)
      ? (item.damage[0] as TechniqueDocument['damage'])
      : (item.damage as TechniqueDocument['damage']),
    attackMode: item.attackMode,
    weaponName: item.weaponName,
    weapon: item.weapon,
    actionType: item.actionType,
    isReaction: item.isReaction,
  };
}

export function derivePowerTechniqueBudgetFacts(
  kind: PowerTechniqueBudgetKind,
  item: PowerTechniqueBudgetItem | undefined,
  powerPartsDb: PowerPart[],
  techniquePartsDb: TechniquePart[],
): PowerTechniqueBudgetFacts {
  const name = item?.name ? String(item.name) : '';
  const description = item?.description ? String(item.description) : undefined;
  if (!item) {
    return { tp: 0, actionType: '—', name, description };
  }
  try {
    if (kind === 'technique') {
      const disp = deriveTechniqueDisplay(libraryItemToTechniqueDocument(item), techniquePartsDb);
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
    const disp = derivePowerDisplay(libraryItemToPowerDocument(item), powerPartsDb);
    const energy =
      typeof disp.energy === 'number' ? Math.max(0, Math.floor(disp.energy)) : undefined;
    return {
      energy,
      tp: Math.max(0, Math.round(disp.tp ?? 0)),
      actionType:
        disp.actionType || formatSavedActionTypeForDisplay(item.actionType, item.isReaction) || '—',
      name: name || String(item.id ?? item.docId ?? ''),
      description,
    };
  } catch {
    return { tp: 0, actionType: '—', name, description };
  }
}

/** Guided L2/L3 budget columns: Action Type | Energy | Training Points. */
export function getPowerTechniqueBudgetColumns(facts: PowerTechniqueBudgetFacts): ColumnValue[] {
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
  techniquePartsDb: TechniquePart[],
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

  const facts = derivePowerTechniqueBudgetFacts(kind, item, powerPartsDb, techniquePartsDb);
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
  techniquePartsDb: TechniquePart[],
): PowerTechniqueFilterableRow {
  const facts = derivePowerTechniqueBudgetFacts(kind, item, powerPartsDb, techniquePartsDb);
  const parts = Array.isArray(item.parts) ? item.parts : [];
  const partsDb = kind === 'technique' ? techniquePartsDb : powerPartsDb;
  let categories = derivePartCategories(
    parts as Parameters<typeof derivePartCategories>[0],
    partsDb,
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
  powerDisplay?: PowerColumnDisplay,
): ColumnValue[] {
  if (itemType === 'power') {
    const values: Record<string, string> = powerDisplay
      ? {
          Energy: String(powerDisplay.energy ?? '-'),
          Action: powerDisplay.actionType || '-',
          Duration: powerDisplay.duration || '-',
          Damage: powerDisplay.damage || '-',
          Area: powerDisplay.area || '-',
        }
      : (() => {
          const power = item as UserPower;
          return {
            Energy: '-',
            Action: formatSavedActionTypeForDisplay(power.actionType, power.isReaction),
            Duration: '-',
            Area: power.area?.type ? capitalize(power.area.type) : '-',
            Damage: formatPowerDamage(power.damage) || '-',
          };
        })();
    return selectPowerChrome.layout.columnFacts.map((id) => {
      const key = glrColumnKeyFor(id, 'power', 'select', 'usm');
      return { key, value: values[key] ?? '-', align: 'center' as const };
    });
  }
  if (itemType === 'technique') {
    const technique = item as UserTechnique;
    const values: Record<string, string> = techniqueDisplay
      ? {
          Action: techniqueDisplay.actionType || '-',
          Energy: String(techniqueDisplay.energy),
          Attack: techniqueDisplay.weaponName || '-',
          'Training Pts': String(techniqueDisplay.tp),
        }
      : {
          Action: formatActionTypeForDisplay(technique.actionType ?? ''),
          Energy: '-',
          Attack: attackModeColumnLabel(
            deriveTechniqueAttackMode({
              attackMode: technique.attackMode,
              parts: technique.parts,
              weapon: technique.weapon,
            }),
          ),
          'Training Pts': '-',
        };
    return selectTechniqueChrome.layout.columnFacts.map((id) => {
      const key = glrColumnKeyFor(id, 'technique', 'select', 'usm');
      return { key, value: values[key] ?? '-', align: 'center' as const };
    });
  }
  if (itemType === 'weapon') {
    const weapon = item as UserItem | EqItem;
    const val = weapon.damage ? formatDamageDisplay(weapon.damage) : '-';
    const values: Record<string, string> = { Damage: val };
    return selectWeaponChrome.layout.columnFacts.map((id) => {
      const key = glrColumnKeyFor(id, 'weapon', 'select', 'usm');
      return { key, value: values[key] ?? '-', align: 'center' as const, highlight: true };
    });
  }
  if (itemType === 'armor') {
    const armor = item as UserItem | EqItem;
    const val = armor.armorValue != null ? String(armor.armorValue) : '-';
    const values: Record<string, string> = { armor: val };
    return selectArmorChrome.layout.columnFacts.map((id) => {
      const key = glrColumnKeyFor(id, 'armor', 'select', 'usm');
      return { key, value: values[key] ?? '-', align: 'center' as const, highlight: true };
    });
  }
  if (itemType === 'shield') {
    const shield = item as UserItem | EqItem;
    const props = (shield.properties || []) as Array<{
      id?: number;
      name?: string;
      op_1_lvl?: number;
    }>;
    const block = deriveShieldAmountFromProperties(props);
    const dmg =
      deriveShieldDamageFromProperties(props) ??
      (shield.damage ? formatDamageDisplay(shield.damage) : null);
    const values: Record<string, string> = {
      Block: block !== '-' ? block : '-',
      Damage: dmg ? String(dmg) : '-',
    };
    return selectShieldChrome.layout.columnFacts.map((id) => {
      const key = glrColumnKeyFor(id, 'shield', 'select', 'usm');
      return { key, value: values[key] ?? '-', align: 'center' as const, highlight: true };
    });
  }
  const gear = item as UserItem | EqItem;
  const storedCurrency = gear.costs?.totalCurrency;
  const fallbackCost = 'cost' in gear ? gear.cost : undefined;
  const currency =
    storedCurrency != null
      ? Math.round(storedCurrency)
      : fallbackCost != null
        ? fallbackCost
        : undefined;
  const values: Record<string, string> = {
    category: formatListCellLabel(('category' in gear ? gear.category : undefined) || gear.type),
    currency: currency != null ? String(currency) : '-',
    rarity: formatListCellLabel(gear.rarity),
  };
  return selectGearChrome.layout.columnFacts.map((id) => {
    const key = glrColumnKeyFor(id, 'gear', 'select', 'usm');
    return { key, value: values[key] ?? '-', align: 'center' as const };
  });
}

export function getModalGridColumns(itemType: LibraryItemType): string {
  switch (itemType) {
    case 'power':
      return selectPowerChrome.grid;
    case 'technique':
      return selectTechniqueChrome.grid;
    case 'weapon':
      return selectWeaponChrome.grid;
    case 'shield':
      return selectShieldChrome.grid;
    case 'armor':
      return selectArmorChrome.grid;
    case 'equipment':
      return selectGearChrome.grid;
    default:
      return '1.5fr';
  }
}

export function getListHeaderColumns(
  itemType: LibraryItemType,
): { key: string; label: string; sortable?: boolean; align?: 'left' | 'center' | 'right' }[] {
  const base = [{ key: 'name', label: 'Name', align: 'left' as const }];
  switch (itemType) {
    case 'power':
      return selectPowerChrome.headers.map(({ key, label, align }) => ({
        key,
        label,
        align,
      }));
    case 'technique':
      return selectTechniqueChrome.headers.map(({ key, label, align }) => ({
        key,
        label,
        align,
      }));
    case 'weapon':
      return selectWeaponChrome.headers.map(({ key, label, align }) => ({
        key,
        label,
        align,
      }));
    case 'shield':
      return selectShieldChrome.headers.map(({ key, label, align }) => ({
        key,
        label,
        align,
      }));
    case 'armor':
      return selectArmorChrome.headers.map(({ key, label, align }) => ({
        key,
        label,
        align,
      }));
    case 'equipment':
      return selectGearChrome.headers.map(({ key, label, align }) => ({
        key,
        label,
        align,
      }));
    default:
      return base;
  }
}

/** Columns for empowered technique rows (sheet add + creator load). */
export const EMPOWERED_POWER_COLUMNS = selectPowerChrome.headers.map(({ key, label }) => ({
  key,
  label,
}));

export interface BuildSelectableItemCodex {
  powerPartsDb: PowerPart[];
  techniquePartsDb: TechniquePart[];
  itemPropertiesDb: ItemProperty[];
}

/** Build one SelectableItem from a raw library item (user or public). Used by add and load modals. */
export function buildSelectableItem(
  item: UserPower | UserTechnique | UserItem | EqItem,
  itemType: LibraryItemType,
  codex: BuildSelectableItemCodex,
): SelectableItem {
  let techniqueDisplay: TechniqueColumnDisplay | undefined;
  let detailSections: SelectableItem['detailSections'];
  const { powerPartsDb, techniquePartsDb, itemPropertiesDb } = codex;

  const effectiveType = itemType;

  let powerDisplay: PowerColumnDisplay | undefined;
  if (itemType === 'power') {
    const p = item as UserPower;
    const doc = libraryItemToPowerDocument(p);
    const display = derivePowerDisplay(doc, powerPartsDb);
    const partChips = partChipsFromDisplay(display.partChips);
    const parts = partsProficienciesSection(partChips, 'power');
    const categories = withDamageCategory(
      derivePartCategories(doc.parts, powerPartsDb),
      powerHasDamageCategory(doc.damage),
    );
    const categoryText = formatPartCategoriesColumn(categories);
    const sections = buildGlrFactDetailSections({
      chipFacts: selectPowerChrome.layout.chipFacts,
      facts: {
        range: display.range,
        category: categoryText && categoryText !== '—' ? categoryText : undefined,
        trainingPoints: display.tp > 0 ? display.tp : undefined,
      },
      extraSections: parts ? [parts] : undefined,
    });
    detailSections = sections.length > 0 ? sections : undefined;
    powerDisplay = {
      energy: display.energy,
      actionType: display.actionType || formatSavedActionTypeForDisplay(p.actionType, p.isReaction),
      duration: display.duration || '-',
      damage: formatPowerDamage(doc.damage) || '-',
      area: display.area || '-',
    };
  } else if (itemType === 'technique') {
    const t = item as UserTechnique;
    const doc = libraryItemToTechniqueDocument(t);
    const display = deriveTechniqueDisplay(doc, techniquePartsDb);
    techniqueDisplay = {
      energy: display.energy,
      weaponName: display.weaponName,
      tp: display.tp,
      actionType: display.actionType,
    };
    const partChips = partChipsFromDisplay(display.partChips);
    const parts = partsProficienciesSection(partChips, 'technique');
    const categories = derivePartCategories(doc.parts, techniquePartsDb);
    const categoryText = formatPartCategoriesColumn(categories);
    const sections = buildGlrFactDetailSections({
      chipFacts: selectTechniqueChrome.layout.chipFacts,
      facts: {
        category: categoryText && categoryText !== '—' ? categoryText : undefined,
        damage: display.damageStr && display.damageStr !== '-' ? display.damageStr : undefined,
      },
      extraSections: parts ? [parts] : undefined,
    });
    detailSections = sections.length > 0 ? sections : undefined;
  } else if (
    itemType === 'weapon' ||
    itemType === 'shield' ||
    itemType === 'armor' ||
    itemType === 'equipment'
  ) {
    const it = item as UserItem | EqItem;
    const props = (Array.isArray(it.properties) ? it.properties : []) as Array<{
      id?: string | number;
      name?: string;
      op_1_lvl?: number;
    }>;
    const payload = props as ItemPropertyPayload[];
    const costs = calculateItemCosts(payload, itemPropertiesDb);
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
      },
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
    const storedCurrency = it.costs?.totalCurrency;
    const fallbackCost = 'cost' in it ? it.cost : undefined;
    const currency =
      storedCurrency != null && storedCurrency > 0
        ? Math.round(storedCurrency)
        : fallbackCost != null && fallbackCost > 0
          ? fallbackCost
          : Math.round(costs.totalCurrency) || undefined;
    const trainingPoints =
      it.costs?.totalTP != null && it.costs.totalTP > 0
        ? Math.round(it.costs.totalTP)
        : Math.round(costs.totalTP) || undefined;
    const sections = buildGlrFactDetailSections({
      chipFacts: selectChromeFor(effectiveType).layout.chipFacts,
      facts: {
        rarity: it.rarity,
        currency,
        trainingPoints,
        range: resolveWeaponRangeDisplay((it as EqItem).range, payload),
        abilityRequirement:
          it.abilityRequirement ?? deriveAbilityRequirementFromProperties(payload),
        agilityReduction: it.agilityReduction ?? deriveAgilityReductionFromProperties(payload),
        criticalRangeIncrease: deriveCriticalRangeIncreaseFromProperties(payload),
        damageReduction: typeof it.armorValue === 'number' ? it.armorValue : undefined,
        category: formatListCellLabel(
          ('category' in it ? it.category : undefined) ||
            (effectiveType === 'equipment' ? it.type : undefined),
        ),
      },
      extraSections: propertySection ? [propertySection] : undefined,
    });
    detailSections = sections.length > 0 ? sections : undefined;
  }

  const columns = getItemColumns(item, itemType, techniqueDisplay, powerDisplay);

  const name = String(item.name ?? '');
  const imageKind = selectableImageKind(itemType);
  const thumbnail = imageKind ? resolveListRowThumbnail(imageKind, item, name) : undefined;

  const powerTechniqueFilter =
    itemType === 'power'
      ? buildPowerTechniqueFilterableRow('power', item as UserPower, powerPartsDb, techniquePartsDb)
      : itemType === 'technique'
        ? buildPowerTechniqueFilterableRow(
            'technique',
            item as UserTechnique,
            powerPartsDb,
            techniquePartsDb,
          )
        : undefined;

  return {
    id: String(item.id),
    name,
    description:
      String((item as UserPower | UserTechnique | UserItem).description ?? '') ||
      'No description available.',
    columns,
    detailSections,
    thumbnail,
    data: item,
    powerTechniqueFilter,
  };
}
