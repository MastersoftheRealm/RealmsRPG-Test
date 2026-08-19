/**
 * Creature Creator — library modal selectable builders (TASK-610 / TASK-712)
 * Co-located extract from use-creature-creator-workspace.
 */

import type { SelectableItem } from '@/components/patterns';
import { buildEmpoweredPowerSelectableItem } from '@/hooks/add-library-item/build-empowered-selectable-item';
import type { ItemProperty, UserPower, UserTechnique, UserItem } from '@/hooks';
import { buildSelectableItem } from '@/lib/library-selectable-builders';
import { mergeLibraryBySource, type LibrarySourceScope } from '@/lib/library/source-scope';
import {
  collectCreatureInventoryItems,
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
    const displayItem = transformUserItemToDisplayItem(item, itemPropertiesDb);
    const selectable = buildSelectableItem(item, kind, codex);
    return { ...selectable, data: displayItem };
  });
}

export function selectedArmamentIdsFromCreature(creature: CreatureState): string[] {
  return collectCreatureInventoryItems(creature).map((a) => String(a.id));
}
