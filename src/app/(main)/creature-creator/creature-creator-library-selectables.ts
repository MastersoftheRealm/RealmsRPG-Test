/**
 * Creature Creator — library modal selectable builders (TASK-610 / TASK-712)
 * Co-located extract from use-creature-creator-workspace.
 */

import type { SelectableItem } from '@/components/patterns';
import { buildEmpoweredPowerSelectableItem } from '@/hooks/add-library-item/build-empowered-selectable-item';
import type { ItemProperty, UserPower, UserTechnique, UserItem } from '@/hooks';
import { equipmentCurrency } from '@/lib/codex/equipment-list';
import { buildSelectableItem } from '@/lib/library-selectable-builders';
import { mergeLibraryBySource, type LibrarySourceScope } from '@/lib/library/source-scope';
import {
  collectCreatureInventoryItems,
  normalizeCreatureInventoryType,
  type CreatureInventoryKind,
} from '@/lib/game/creature-inventory';
import {
  transformUserPowerToDisplayItem,
  transformUserTechniqueToDisplayItem,
  transformUserItemToDisplayItem,
} from './transformers';
import type { CreatureState } from './creature-creator-types';

export type CreatureInventoryTab = CreatureInventoryKind;

export function buildEmpoweredTechniqueLibraryList(
  librarySource: LibrarySourceScope,
  userEmpoweredTechniques: UserTechnique[],
  publicEmpoweredTechniques: UserTechnique[],
): UserTechnique[] {
  const merged = mergeLibraryBySource(
    librarySource,
    publicEmpoweredTechniques,
    userEmpoweredTechniques,
  );
  const seen = new Set<string>();
  return merged.filter((technique) => {
    const id = String(technique.docId ?? technique.id ?? '');
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export function buildArmamentLibraryList(
  librarySource: LibrarySourceScope,
  userItems: UserItem[],
  publicItems: UserItem[],
  selectedArmamentIds: string[],
): UserItem[] {
  const selectedIds = new Set(selectedArmamentIds.filter((id) => id.length > 0));
  return mergeLibraryBySource(librarySource, publicItems, userItems).filter(
    (item) => !selectedIds.has(item.docId),
  );
}

/** Codex equipment row the creature Equipment tab can turn into a library item. */
export type CreatureCodexEquipmentRow = {
  id: string;
  name?: string | undefined;
  description?: string | undefined;
  type?: string | undefined;
  category?: string | undefined;
  rarity?: string | undefined;
  currency?: number | undefined;
  gold_cost?: number | undefined;
  properties?: string[] | undefined;
  image_id?: string | null | undefined;
  image_url?: string | null | undefined;
};

/** Library item plus catalog price fields the equipment columns already read. */
export type CreatureEquipmentLibraryItem = UserItem & {
  currency?: number | undefined;
  gold_cost?: number | undefined;
  category?: string | undefined;
};

function isCreatureEquipmentType(type: string | undefined): boolean {
  return normalizeCreatureInventoryType(type) === 'equipment';
}

/** Catalog Currency stays on the row so add-to-creature does not reprice from properties. */
export function codexEquipmentAsLibraryItem(
  row: CreatureCodexEquipmentRow,
): CreatureEquipmentLibraryItem {
  const currency = equipmentCurrency(row);
  return {
    id: row.id,
    docId: row.id,
    name: String(row.name ?? ''),
    description: row.description,
    type: 'equipment',
    category: row.category,
    properties: (row.properties ?? []).map((name) => ({ name })),
    rarity: row.rarity,
    image_id: row.image_id ?? null,
    image_url: row.image_url ?? null,
    currency,
    gold_cost: row.gold_cost ?? currency,
  };
}

/**
 * Equipment tab: user items, public library items, and codex gear.
 * Codex is the Realms catalog (public side). Weapon, armor, and shield rows stay out.
 */
export function buildCreatureEquipmentLibraryList(
  librarySource: LibrarySourceScope,
  userItems: UserItem[],
  publicItems: UserItem[],
  codexEquipment: CreatureCodexEquipmentRow[],
  selectedArmamentIds: string[],
): UserItem[] {
  const mine = userItems.filter((item) => isCreatureEquipmentType(item.type));
  const officialLibrary = publicItems.filter((item) => isCreatureEquipmentType(item.type));
  const catalog = codexEquipment
    .filter((row) => isCreatureEquipmentType(row.type ?? 'equipment'))
    .map(codexEquipmentAsLibraryItem);
  return buildArmamentLibraryList(
    librarySource,
    mine,
    [...officialLibrary, ...catalog],
    selectedArmamentIds,
  );
}

function catalogEquipmentPrice(item: UserItem): number | undefined {
  const row = item as CreatureEquipmentLibraryItem;
  if (typeof row.currency === 'number' && !Number.isNaN(row.currency)) return row.currency;
  if (typeof row.gold_cost === 'number' && !Number.isNaN(row.gold_cost)) return row.gold_cost;
  return undefined;
}

function withCatalogEquipmentPrice(
  displayItem: ReturnType<typeof transformUserItemToDisplayItem>,
  item: UserItem,
): ReturnType<typeof transformUserItemToDisplayItem> {
  const catalog = catalogEquipmentPrice(item);
  if (catalog == null) return displayItem;
  const source = (displayItem.sourceData ?? {}) as Record<string, unknown>;
  const rarity = item.rarity?.trim() ? item.rarity : source.rarity;
  return {
    ...displayItem,
    stats: (displayItem.stats ?? []).map((stat) =>
      stat.label === 'Cost' ? { ...stat, value: `${catalog}c` } : stat,
    ),
    sourceData: {
      ...source,
      currency: catalog,
      ...(rarity != null && rarity !== '' ? { rarity } : {}),
    },
  };
}

export function buildPowerSelectableItems(
  powerList: UserPower[],
  powerPartsDb: Parameters<typeof transformUserPowerToDisplayItem>[1],
): SelectableItem[] {
  const codex = {
    powerPartsDb,
    techniquePartsDb: [],
    itemPropertiesDb: [],
  };
  return powerList.map((power) => {
    const displayItem = transformUserPowerToDisplayItem(power, powerPartsDb);
    const selectable = buildSelectableItem(power, 'power', codex);
    return { ...selectable, data: displayItem };
  });
}

export function buildEmpoweredTechniqueSelectableItems(
  empoweredTechniqueList: UserTechnique[],
  powerPartsDb: Parameters<typeof transformUserPowerToDisplayItem>[1],
  techniquePartsDb: Parameters<typeof buildTechniqueSelectableItems>[1],
): SelectableItem[] {
  return empoweredTechniqueList.map((technique) => {
    const empowered = buildEmpoweredPowerSelectableItem(technique, {
      powerPartsDb: powerPartsDb ?? [],
      techniquePartsDb: techniquePartsDb ?? [],
    });
    const powerData = technique.power ?? {};
    const totals = technique.totals ?? {};
    const energy = totals.energy ?? 0;
    const tp = totals.trainingPoints ?? 0;
    const actionCol = empowered.columns?.find((c) => c.key === 'Action');
    const damageCol = empowered.columns?.find((c) => c.key === 'Damage');
    const areaCol = empowered.columns?.find((c) => c.key === 'Area');
    const displayItem = transformUserPowerToDisplayItem(
      {
        id: technique.id,
        docId: technique.docId,
        name: technique.name,
        description: technique.description,
        parts: [],
        actionType: String(technique.actionType ?? ''),
        isReaction: technique.isReaction === true,
        area: powerData.area as UserPower['area'],
        range: powerData.range as UserPower['range'],
        duration: powerData.duration as UserPower['duration'],
        damage: powerData.damage as UserPower['damage'],
      },
      powerPartsDb,
    );
    return {
      ...empowered,
      data: {
        ...displayItem,
        sourceData: {
          id: technique.docId,
          name: technique.name,
          energy,
          tp,
          action: actionCol?.value ?? '-',
          duration: String(
            (powerData.duration as Record<string, unknown> | undefined)?.type ?? '-',
          ),
          range: String((powerData.range as Record<string, unknown> | undefined)?.steps ?? '-'),
          area: areaCol?.value ?? '-',
          damage: damageCol?.value ?? '-',
          innate: false,
          image_id: technique.image_id ?? null,
          image_url: technique.image_url ?? null,
        },
      },
    };
  });
}

export function buildTechniqueSelectableItems(
  techniqueList: UserTechnique[],
  techniquePartsDb: Parameters<typeof transformUserTechniqueToDisplayItem>[1],
): SelectableItem[] {
  const codex = {
    powerPartsDb: [],
    techniquePartsDb,
    itemPropertiesDb: [],
  };
  return techniqueList.map((technique) => {
    const displayItem = transformUserTechniqueToDisplayItem(technique, techniquePartsDb);
    const selectable = buildSelectableItem(technique, 'technique', codex);
    return { ...selectable, data: displayItem };
  });
}

export function buildArmamentSelectableItems(
  armamentList: UserItem[],
  itemPropertiesDb: ItemProperty[],
  kind: CreatureInventoryTab,
): SelectableItem[] {
  const codex = {
    powerPartsDb: [],
    techniquePartsDb: [],
    itemPropertiesDb,
  };
  return armamentList.map((item) => {
    const transformed = transformUserItemToDisplayItem(item, itemPropertiesDb);
    const displayItem =
      kind === 'equipment' ? withCatalogEquipmentPrice(transformed, item) : transformed;
    const selectable = buildSelectableItem(item, kind, codex);
    return { ...selectable, data: displayItem };
  });
}

export function selectedArmamentIdsFromCreature(creature: CreatureState): string[] {
  return collectCreatureInventoryItems(creature).map((a) => String(a.id));
}
