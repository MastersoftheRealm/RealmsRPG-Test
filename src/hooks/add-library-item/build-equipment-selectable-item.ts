import type { SelectableItem } from '@/components/shared/unified-selection-modal';
import type { ChipData } from '@/components/shared/grid-list-row';
import type { UserItem, UserPower, UserTechnique } from '../use-user-library';
import { trainingPointsForItemPropertyRef } from '@/lib/calculators';
import { getItemColumns } from './get-item-columns';
import type { AddLibraryItemType, CodexDbRefs, EqItem } from './types';

export function buildEquipmentSelectableItem(
  item: UserItem | EqItem,
  itemType: Extract<AddLibraryItemType, 'weapon' | 'shield' | 'armor' | 'equipment'>,
  dbs: CodexDbRefs
): SelectableItem {
  const props = (Array.isArray(item.properties) ? item.properties : []) as Array<{ id?: string | number; name?: string; op_1_lvl?: number }>;
  const propertyChips: ChipData[] = props.map((prop) => {
    const propName = typeof prop === 'string' ? prop : (prop?.name ?? '');
    const dbProp = dbs.itemPropertiesDb.find(
      (p) => (p as { name?: string }).name?.toLowerCase() === String(propName).toLowerCase()
    ) as { name?: string; description?: string } | undefined;
    const cost = trainingPointsForItemPropertyRef(prop, dbs.itemPropertiesDb as Parameters<typeof trainingPointsForItemPropertyRef>[1]);
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
      category: cost > 0 ? ('cost' as const) : ('default' as const),
      level: lvl > 1 ? lvl : undefined,
    };
  });
  const detailSections =
    propertyChips.length > 0 ? [{ label: 'Properties & Proficiencies', chips: propertyChips }] : undefined;
  const totalCost = propertyChips.reduce((sum, c) => sum + (c.cost ?? 0), 0) || undefined;

  return {
    id: String(item.id),
    name: String(item.name ?? ''),
    description: String((item as UserPower | UserTechnique | UserItem).description ?? '') || 'No description available.',
    columns: getItemColumns(item, itemType),
    detailSections,
    totalCost,
    costLabel: totalCost != null ? 'TP' : undefined,
    data: item,
  };
}
