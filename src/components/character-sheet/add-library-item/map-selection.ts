import type { SelectableItem } from '@/components/shared/unified-selection-modal';
import type { UserPower, UserTechnique } from '@/hooks/use-user-library';
import type { AddLibraryItemType, EqItem, PowerSelectionMode } from '@/hooks/add-library-item/types';
import type { CharacterPower, CharacterTechnique, Item } from '@/types';

function mapPartLevels(part: { id?: string | number; name?: string; op_1_lvl?: number; op_2_lvl?: number; op_3_lvl?: number }) {
  return {
    id: String(part.id || ''),
    name: part.name || '',
    op_1_lvl: part.op_1_lvl,
    op_2_lvl: part.op_2_lvl,
    op_3_lvl: part.op_3_lvl,
  };
}

export function mapSelectedToCharacterItems(
  itemType: AddLibraryItemType,
  selected: SelectableItem[],
  powerSelectionMode: PowerSelectionMode
): CharacterPower[] | CharacterTechnique[] | Item[] {
  const selectedRaw = selected.map((s) => s.data as UserPower | UserTechnique | EqItem);
  const quantities = selected.reduce(
    (acc, s) => {
      const q = (s as SelectableItem & { quantity?: number }).quantity;
      if (q != null) acc[s.id] = q;
      return acc;
    },
    {} as Record<string, number>
  );

  if (itemType === 'power') {
    return (selectedRaw as Array<UserPower | UserTechnique>).map((entry) => {
      if (powerSelectionMode === 'empowered') {
        const raw = entry as unknown as Record<string, unknown>;
        const powerData = (raw.power as Record<string, unknown> | undefined) ?? {};
        const savedParts = (Array.isArray(powerData.parts) ? powerData.parts : []) as Array<{
          id?: string | number;
          name?: string;
          op_1_lvl?: number;
          op_2_lvl?: number;
          op_3_lvl?: number;
        }>;
        return {
          id: entry.id,
          name: entry.name,
          description: entry.description || '',
          parts: savedParts.map(mapPartLevels),
          cost: 0,
          level: 1,
        };
      }
      const power = entry as UserPower;
      return {
        id: power.id,
        name: power.name,
        description: power.description || '',
        parts: (power.parts || []).map(mapPartLevels),
        cost: 0,
        level: 1,
      };
    });
  }

  if (itemType === 'technique') {
    return (selectedRaw as UserTechnique[]).map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description || '',
      parts: (t.parts || []).map(mapPartLevels),
      cost: 0,
      actionType: t.actionType,
      isReaction: t.isReaction,
    }));
  }

  return (selectedRaw as EqItem[]).map((i) => {
    const props = (i.properties || []) as EqItem['properties'];
    return {
      id: i.id,
      name: String(i.name ?? ''),
      description: String(i.description ?? ''),
      properties: props as unknown as Item['properties'],
      damage: i.damage as Item['damage'],
      armor: i.armorValue ?? 0,
      equipped: false,
      quantity: itemType === 'equipment' ? (quantities[i.id] ?? 1) : 1,
      cost: 0,
    };
  });
}
