import type { Character } from '@/types';
import type { UserPower, UserTechnique, UserItem } from '@/hooks/use-user-library';
import type { PowerPart, TechniquePart } from '@/hooks/codex-types';
import type { CodexEquipmentItem, EnrichedCharacterData } from './types';
import { enrichPowers } from './enrich-powers';
import { enrichTechniques } from './enrich-techniques';
import { enrichItems } from './enrich-items';

/** Helper to safely convert equipment arrays — preserves id, name, description, type, equipped, quantity */
function toEquipmentArray(items: unknown): Array<{
  id?: string | number;
  name?: string;
  description?: string;
  type?: string;
  equipped?: boolean;
  quantity?: number;
}> {
  if (!items) return [];
  if (Array.isArray(items)) {
    return items.map(item => {
      if (typeof item === 'string') return { name: item };
      if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        const result: {
          id?: string | number;
          name?: string;
          description?: string;
          type?: string;
          equipped?: boolean;
          quantity?: number;
        } = {};
        if (obj.id) result.id = obj.id as string | number;
        if (obj.name) result.name = obj.name as string;
        if (typeof obj.description === 'string' && obj.description.trim()) {
          result.description = obj.description.trim();
        }
        if (typeof obj.type === 'string' && obj.type.trim()) {
          result.type = obj.type.trim();
        }
        if (obj.equipped) result.equipped = true;
        if (obj.quantity && obj.quantity !== 1) result.quantity = obj.quantity as number;
        return result;
      }
      return null;
    }).filter((item): item is NonNullable<typeof item> => !!(item && (item.name || item.id)));
  }
  // Single item (e.g., Armor object)
  if (typeof items === 'object' && items !== null) {
    const obj = items as Record<string, unknown>;
    if (obj.name || obj.id) {
      return [{ 
        id: obj.id as string | number | undefined, 
        name: obj.name as string | undefined, 
        equipped: !!obj.equipped,
        quantity: obj.quantity as number | undefined,
      }];
    }
  }
  return [];
}

export function enrichCharacterData(
  character: Character,
  userPowers: UserPower[],
  userTechniques: UserTechnique[],
  userItems: UserItem[],
  codexEquipment?: CodexEquipmentItem[],
  powerPartsDb?: PowerPart[],
  techniquePartsDb?: TechniquePart[],
  publicLibraries?: {
    powers?: UserPower[];
    techniques?: UserTechnique[];
    items?: UserItem[];
  }
): EnrichedCharacterData {
  // Normalize item type for comparison (official/codex may use 'Shield' vs 'shield')
  const itemTypeIs = (i: { type?: string }, t: string) => (i.type || '').toLowerCase() === t;
  // Split items by type
  const weaponItems = userItems.filter(i => itemTypeIs(i, 'weapon'));
  const shieldItems = userItems.filter(i => itemTypeIs(i, 'shield'));
  const armorItems = userItems.filter(i => itemTypeIs(i, 'armor'));
  const equipmentItems = userItems.filter(i => itemTypeIs(i, 'equipment'));
  const codexWeapons = codexEquipment?.filter(i => itemTypeIs(i, 'weapon'));
  const codexShields = codexEquipment?.filter(i => itemTypeIs(i, 'shield'));
  const codexArmor = codexEquipment?.filter(i => itemTypeIs(i, 'armor'));
  const codexItems = codexEquipment?.filter(i => itemTypeIs(i, 'equipment'));
  const publicWeaponItems = publicLibraries?.items?.filter(i => itemTypeIs(i, 'weapon'));
  const publicShieldItems = publicLibraries?.items?.filter(i => itemTypeIs(i, 'shield'));
  const publicArmorItems = publicLibraries?.items?.filter(i => itemTypeIs(i, 'armor'));
  const publicEquipmentItems = publicLibraries?.items?.filter(i => itemTypeIs(i, 'equipment') || !String(i.type || '').trim());

  return {
    powers: enrichPowers(character.powers, userPowers, powerPartsDb || [], publicLibraries?.powers),
    techniques: enrichTechniques(character.techniques, userTechniques, techniquePartsDb || [], publicLibraries?.techniques),
    weapons: enrichItems(
      toEquipmentArray(character.equipment?.weapons),
      weaponItems,
      'weapon',
      codexWeapons,
      publicWeaponItems
    ),
    shields: enrichItems(
      toEquipmentArray(character.equipment?.shields),
      shieldItems,
      'shield',
      codexShields,
      publicShieldItems
    ),
    armor: enrichItems(
      toEquipmentArray(character.equipment?.armor),
      armorItems,
      'armor',
      codexArmor,
      publicArmorItems
    ),
    equipment: enrichItems(
      toEquipmentArray(character.equipment?.items),
      equipmentItems,
      'equipment',
      codexItems,
      publicEquipmentItems
    ),
  };
}
