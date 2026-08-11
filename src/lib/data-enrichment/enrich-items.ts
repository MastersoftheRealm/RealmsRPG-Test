import type { UserItem } from '@/hooks/use-user-library';
import {
  resolveWeaponRangeDisplay,
  deriveShieldAmountFromProperties,
  deriveShieldDamageFromProperties,
} from '@/lib/calculators';
import { resolveArmorDamageReduction } from '@/lib/game/resolve-armor-damage-reduction';
import type { CodexEquipmentItem, EnrichedItem } from './types';
import { deriveAbilityRequirementFromProperties } from '@/lib/game/weapon-attack-ability';
import { findInLibrary } from './find-in-library';

/**
 * Enrich character equipment with full data from user's item library
 * Falls back to Codex equipment data for general items if not found in user library
 */
export function enrichItems(
  characterItems: Array<{
    id?: string | number;
    name?: string;
    description?: string;
    equipped?: boolean;
    type?: string;
    quantity?: number;
  }> | undefined,
  userItemLibrary: UserItem[],
  itemType: 'weapon' | 'armor' | 'equipment' | 'shield',
  codexEquipment?: CodexEquipmentItem[],
  publicItemLibrary?: UserItem[]
): EnrichedItem[] {
  if (!characterItems || characterItems.length === 0) return [];
  
  return characterItems.map(charItem => {
    const name = typeof charItem === 'string' ? charItem : (charItem.name || String(charItem.id || ''));
    const equipped = typeof charItem === 'object' ? !!charItem.equipped : false;
    const quantity = typeof charItem === 'object' ? (charItem.quantity ?? 1) : 1;
    
    // First try user's library, then public library
    let libraryItem = findInLibrary(userItemLibrary, charItem);
    if (!libraryItem && publicItemLibrary?.length) {
      libraryItem = findInLibrary(publicItemLibrary, charItem);
    }
    
    if (libraryItem) {
      // Use character's stored id so equip/remove handlers match (important for public library references)
      const displayId = typeof charItem === 'object' && charItem.id != null ? String(charItem.id) : libraryItem.id;
      // Convert properties from SavedProperty objects to string names
      const props = (libraryItem.properties || []) as Array<{ id?: number; name?: string; op_1_lvl?: number }>;
      const propertyNames = props
        .map(p => typeof p === 'string' ? p : p.name)
        .filter((name): name is string => typeof name === 'string');
      // Use saved abilityRequirement, or derive from properties (e.g. old items that only stored requirement as property)
      const abilityRequirement = libraryItem.abilityRequirement ?? deriveAbilityRequirementFromProperties(props);
      // Shield-specific: block amount and optional damage from properties
      const shieldAmount = itemType === 'shield' ? deriveShieldAmountFromProperties(props) : undefined;
      const shieldDamage = itemType === 'shield' ? deriveShieldDamageFromProperties(props) : undefined;
      const armorValue =
        itemType === 'armor'
          ? resolveArmorDamageReduction({ ...libraryItem, properties: props })
          : undefined;
      return {
        id: displayId,
        name: libraryItem.name,
        description: libraryItem.description ?? '',
        type: libraryItem.type || itemType,
        equipped,
        quantity,
        damage: libraryItem.damage,
        armorValue,
        properties: propertyNames,
        range:
          itemType === 'weapon' || itemType === 'shield'
            ? resolveWeaponRangeDisplay(undefined, props)
            : undefined,
        // Armor-specific fields
        critRange: libraryItem.criticalRangeIncrease,
        agilityReduction: libraryItem.agilityReduction,
        abilityRequirement,
        shieldAmount,
        shieldDamage,
        libraryItem,
      };
    }
    
    // For equipment, also check Codex as fallback (by ID first, then name)
    if (codexEquipment && codexEquipment.length > 0) {
      const searchName = (name || '').toLowerCase();
      const charId = typeof charItem === 'object' ? String(charItem.id || '') : '';
      const codexItem = codexEquipment.find(item => 
        (charId && item.id === charId) ||
        String(item.name ?? '').toLowerCase() === searchName ||
        item.id === name
      );
      
      if (codexItem) {
        return {
          id: codexItem.id,
          name: codexItem.name,
          description: codexItem.description || '',
          type: codexItem.type || itemType,
          equipped,
          quantity,
          damage: codexItem.damage,
          armorValue: resolveArmorDamageReduction({
            armor_value: codexItem.armor_value,
            properties: (codexItem.properties ?? []).map((name) => ({ name })),
          }),
          properties: codexItem.properties || [],
        };
      }
    }
    
    // Not found in library or Codex — keep character-stored fields (custom inventory items).
    const itemId = typeof charItem === 'object' ? String(charItem.id || name) : name;
    const storedDescription =
      typeof charItem === 'object' && typeof charItem.description === 'string'
        ? charItem.description.trim()
        : '';
    const storedType = typeof charItem === 'object' ? String(charItem.type || '').toLowerCase() : '';
    const resolvedType: EnrichedItem['type'] =
      storedType === 'weapon' ||
      storedType === 'armor' ||
      storedType === 'shield' ||
      storedType === 'equipment'
        ? storedType
        : itemType;
    return {
      id: itemId,
      name: name || itemId,
      description: storedDescription || 'Item not found in your library',
      type: resolvedType,
      equipped,
      quantity,
      notInLibrary: true,
    };
  });
}
