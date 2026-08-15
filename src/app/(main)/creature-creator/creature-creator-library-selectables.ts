/**
 * Creature Creator — library modal selectable builders (TASK-610 / TASK-712)
 * Co-located extract from use-creature-creator-workspace.
 */

import type { SelectableItem } from '@/components/shared';
import type { ChipData } from '@/components/shared/grid-list-row';
import { partChipsFromDisplay } from '@/lib/chip/part-chips-from-display';
import {
  buildEntityMetadataDetailSections,
  buildPartsAndMetadataDetailSections,
  mergeDetailSections,
  metadataDescriptorChip,
  metadataDetailSection,
  propertiesProficienciesSection,
} from '@/lib/chip/list-row-metadata';
import { derivePowerDisplay, type PowerDocument } from '@/lib/calculators/power-calc';
import { deriveTechniqueDisplay, type TechniqueDocument } from '@/lib/calculators/technique-calc';
import { trainingPointsForItemPropertyRef } from '@/lib/calculators';
import { buildEmpoweredPowerSelectableItem } from '@/hooks/add-library-item/build-empowered-selectable-item';
import type { ItemProperty, UserPower, UserTechnique, UserItem } from '@/hooks';
import { mergeLibraryBySource, type LibrarySourceScope } from '@/lib/library/source-scope';
import { normalizeRangeDisplay } from '@/lib/utils';
import type { DisplayItem } from '@/types/items';
import {
  transformUserPowerToDisplayItem,
  transformUserTechniqueToDisplayItem,
  transformUserItemToDisplayItem,
} from './transformers';
import { displayItemToSelectableItem } from './CreatureCreatorHelpers';
import type { CreatureState } from './creature-creator-types';

export type CreatureInventoryTab = 'all' | 'weapon' | 'armor' | 'shield' | 'equipment';

export function normalizeCreatureInventoryType(
  type: string | undefined,
): Exclude<CreatureInventoryTab, 'all'> {
  const normalized = String(type ?? '')
    .toLowerCase()
    .trim();
  if (normalized === 'weapon' || normalized === 'armor' || normalized === 'shield') {
    return normalized;
  }
  return 'equipment';
}

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

export function buildPowerSelectableItems(
  powerList: UserPower[],
  powerPartsDb: Parameters<typeof transformUserPowerToDisplayItem>[1],
): SelectableItem[] {
  return powerList.map((power) => {
    const displayItem = transformUserPowerToDisplayItem(power, powerPartsDb);
    const doc: PowerDocument = {
      name: String(power.name ?? ''),
      description: String(power.description ?? ''),
      parts: Array.isArray(power.parts) ? (power.parts as PowerDocument['parts']) : [],
      damage: power.damage as PowerDocument['damage'],
      actionType: power.actionType,
      isReaction: power.isReaction,
      range: power.range as PowerDocument['range'],
      area: power.area as PowerDocument['area'],
      duration: power.duration as PowerDocument['duration'],
    };
    const display = derivePowerDisplay(doc, powerPartsDb);
    const partChips = partChipsFromDisplay(display.partChips);
    const base = displayItemToSelectableItem(displayItem, ['Energy', 'Action', 'Damage', 'Area']);
    const detailSections = buildPartsAndMetadataDetailSections({
      range: display.range,
      duration: display.duration,
      partChips,
      partsFamily: 'power',
    });
    return {
      ...base,
      detailSections: detailSections.length > 0 ? detailSections : undefined,
      totalCost: display.tp > 0 ? display.tp : undefined,
      costLabel: display.tp > 0 ? 'Training Points' : undefined,
      data: displayItem,
    };
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
    const durationCol = empowered.columns?.find((c) => c.key === 'Duration');
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
    const base = displayItemToSelectableItem(displayItem, ['Energy', 'Action', 'Damage', 'Area']);
    const durationFacts = buildEntityMetadataDetailSections({
      duration: durationCol?.value != null ? String(durationCol.value) : undefined,
    });
    return {
      ...empowered,
      ...base,
      columns: [
        { key: 'Energy', value: energy || '-', align: 'center' as const },
        { key: 'Action', value: actionCol?.value ?? '-', align: 'center' as const },
        { key: 'Damage', value: damageCol?.value ?? '-', align: 'center' as const },
        { key: 'Area', value: areaCol?.value ?? '-', align: 'center' as const },
      ],
      detailSections: mergeDetailSections(durationFacts, empowered.detailSections),
      totalCost: tp > 0 ? tp : undefined,
      costLabel: tp > 0 ? 'Training Points' : undefined,
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
  return techniqueList.map((technique) => {
    const displayItem = transformUserTechniqueToDisplayItem(technique, techniquePartsDb);
    const doc: TechniqueDocument = {
      name: String(technique.name ?? ''),
      description: String(technique.description ?? ''),
      parts: Array.isArray(technique.parts) ? (technique.parts as TechniqueDocument['parts']) : [],
      damage:
        Array.isArray(technique.damage) && technique.damage[0]
          ? technique.damage[0]
          : (technique.damage as TechniqueDocument['damage']),
      weapon: technique.weapon as TechniqueDocument['weapon'],
    };
    const display = deriveTechniqueDisplay(doc, techniquePartsDb);
    const partChips = partChipsFromDisplay(display.partChips);
    const base = displayItemToSelectableItem(displayItem, [
      'Energy',
      'Action',
      'Weapon',
      'Training Pts',
    ]);
    const detailSections = buildPartsAndMetadataDetailSections({
      damage: display.damageStr !== '-' ? display.damageStr : undefined,
      partChips,
      partsFamily: 'technique',
    });
    return {
      ...base,
      detailSections: detailSections.length > 0 ? detailSections : undefined,
      totalCost: typeof display.tp === 'number' && display.tp > 0 ? display.tp : undefined,
      costLabel: typeof display.tp === 'number' && display.tp > 0 ? 'Training Points' : undefined,
      data: displayItem,
    };
  });
}

export function buildArmamentSelectableItems(
  armamentList: UserItem[],
  itemPropertiesDb: ItemProperty[],
): SelectableItem[] {
  return armamentList.map((item) => {
    const displayItem = transformUserItemToDisplayItem(item, itemPropertiesDb);
    const props = (Array.isArray(item.properties) ? item.properties : []) as Array<{
      id?: string | number;
      name?: string;
      op_1_lvl?: number;
    }>;
    const propertyChips: ChipData[] = props.map((prop) => {
      const propName = typeof prop === 'string' ? prop : (prop?.name ?? '');
      const dbProp = itemPropertiesDb.find(
        (p: { name?: string }) => p.name?.toLowerCase() === String(propName).toLowerCase(),
      );
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
        costLabel: 'Training Points',
        category: cost > 0 ? ('cost' as const) : ('default' as const),
        level: lvl > 1 ? lvl : undefined,
      };
    });
    const totalCost = propertyChips.reduce((sum, c) => sum + (c.cost ?? 0), 0) || undefined;
    const base = displayItemToSelectableItem(displayItem, ['Type', 'TP', 'Cost']);
    const source = displayItem.sourceData as
      | {
          type?: string;
          damage?: string;
          range?: string;
          damageReduction?: number;
          armorValue?: number;
        }
      | undefined;
    const type = String(source?.type ?? '').toLowerCase();
    const propertyFamily =
      type === 'armor'
        ? 'armor'
        : type === 'shield'
          ? 'shield'
          : type === 'weapon'
            ? 'weapon'
            : 'item';
    const propertySection = propertiesProficienciesSection(propertyChips, propertyFamily);
    const dr = source?.damageReduction ?? source?.armorValue;
    const factChips: ChipData[] = [];
    if ((type === 'weapon' || type === 'shield') && source?.damage) {
      factChips.push(metadataDescriptorChip(`Damage: ${source.damage}`));
    }
    if ((type === 'weapon' || type === 'shield') && source?.range) {
      const rangeStr = normalizeRangeDisplay(source.range);
      if (rangeStr) factChips.push(metadataDescriptorChip(`Range: ${rangeStr}`));
    }
    if (type === 'armor' && dr != null) {
      factChips.push(metadataDescriptorChip(`Damage Reduction ${dr}`));
    }
    const factSection = metadataDetailSection(factChips);
    return {
      ...base,
      detailSections: mergeDetailSections(factSection, propertySection),
      totalCost: totalCost ?? undefined,
      costLabel: totalCost != null ? 'Training Points' : undefined,
      data: displayItem,
    };
  });
}

export function filterCreatureInventorySelectable(
  inventoryTab: CreatureInventoryTab,
  item: SelectableItem,
): boolean {
  if (inventoryTab === 'all') return true;
  const sourceData = (item.data as DisplayItem | undefined)?.sourceData as
    | { type?: string }
    | undefined;
  return normalizeCreatureInventoryType(sourceData?.type) === inventoryTab;
}

export function selectedArmamentIdsFromCreature(creature: CreatureState): string[] {
  return creature.armaments.map((a) => String(a.id));
}
