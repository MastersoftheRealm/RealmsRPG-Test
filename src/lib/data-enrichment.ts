/**
 * Data Enrichment Utilities
 * ==========================
 * Pairs raw character data with full objects from user's library
 * Mirrors the vanilla site's data-enrichment.js patterns
 */

import type { CharacterPower, CharacterTechnique, Character } from '@/types';
import type { UserPower, UserTechnique, UserItem } from '@/hooks/use-user-library';

// =============================================================================
// Types for Enriched Data
// =============================================================================

/** Enriched power with full data from user's library */
export interface EnrichedPower extends CharacterPower {
  // Display fields from library
  description: string;
  energy?: number;
  actionType?: string;
  area?: string;
  duration?: string;
  damageStr?: string;
  range?: string | number;
  targets?: string;
  // Full parts data for display
  displayParts?: Array<{
    name: string;
    description?: string;
    base_en?: number;
    base_tp?: number;
  }>;
  // Original library item for reference
  libraryItem?: UserPower;
  // Innate power flag
  innate?: boolean;
  // Flag if not found in library
  notInLibrary?: boolean;
}

/** Enriched technique with full data from user's library */
export interface EnrichedTechnique extends CharacterTechnique {
  // Display fields from library
  description: string;
  energyCost?: number;
  actionType?: string;
  weaponName?: string;
  damageStr?: string;
  // Full parts data for display
  displayParts?: Array<{
    name: string;
    description?: string;
    base_tp?: number;
    base_stam?: number;
  }>;
  // Original library item for reference
  libraryItem?: UserTechnique;
  // Flag if not found in library
  notInLibrary?: boolean;
}

/** Enriched item/armament with full data from user's library */
export interface EnrichedItem {
  id: string;
  name: string;
  description?: string;
  type: 'weapon' | 'armor' | 'equipment';
  equipped?: boolean;
  // Display fields
  damage?: string;
  armorValue?: number;
  properties?: string[];
  displayProperties?: Array<{
    name: string;
    description?: string;
  }>;
  // Original library item for reference
  libraryItem?: UserItem;
  // Flag if not found in library
  notInLibrary?: boolean;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Find an item in a library by ID or name (case-insensitive)
 */
function findInLibrary<T extends { id: string; name: string }>(
  library: T[],
  reference: string | { id?: string | number; name?: string }
): T | undefined {
  if (!library || library.length === 0) return undefined;
  
  // If reference is a string, treat as name
  if (typeof reference === 'string') {
    const searchName = reference.toLowerCase();
    return library.find(item => 
      item.name.toLowerCase() === searchName ||
      item.id === reference
    );
  }
  
  // If reference is an object, try ID first, then name
  if (reference.id !== undefined) {
    const found = library.find(item => item.id === String(reference.id));
    if (found) return found;
  }
  
  if (reference.name) {
    const searchName = reference.name.toLowerCase();
    return library.find(item => item.name.toLowerCase() === searchName);
  }
  
  return undefined;
}

/**
 * Get the name from a power/technique reference
 */
function getReferenceName(ref: string | { name?: string; id?: string | number }): string {
  if (typeof ref === 'string') return ref;
  return ref?.name || String(ref?.id || '');
}

// =============================================================================
// Enrichment Functions
// =============================================================================

/**
 * Enrich character powers with full data from user's power library
 */
export function enrichPowers(
  characterPowers: CharacterPower[] | undefined,
  userPowerLibrary: UserPower[]
): EnrichedPower[] {
  if (!characterPowers || characterPowers.length === 0) return [];
  
  return characterPowers.map(charPower => {
    const name = typeof charPower === 'string' ? charPower : charPower.name;
    const innate = typeof charPower === 'object' ? !!(charPower as unknown as { innate?: boolean }).innate : false;
    
    const libraryItem = findInLibrary(userPowerLibrary, charPower);
    
    if (libraryItem) {
      return {
        id: libraryItem.id,
        name: libraryItem.name,
        description: libraryItem.description || '',
        parts: (libraryItem.parts || []).map(part => ({
          id: String(part.id || ''),
          name: part.name || '',
          op_1_lvl: part.op_1_lvl,
          op_2_lvl: part.op_2_lvl,
          op_3_lvl: part.op_3_lvl,
        })),
        innate,
        libraryItem,
        // Additional display fields can be calculated/derived here
      };
    }
    
    // Not found in library - return placeholder
    return {
      id: typeof charPower === 'object' ? String(charPower.id || '') : name,
      name,
      description: 'Power not found in your library',
      innate,
      notInLibrary: true,
    };
  });
}

/**
 * Enrich character techniques with full data from user's technique library
 */
export function enrichTechniques(
  characterTechniques: CharacterTechnique[] | undefined,
  userTechniqueLibrary: UserTechnique[]
): EnrichedTechnique[] {
  if (!characterTechniques || characterTechniques.length === 0) return [];
  
  return characterTechniques.map(charTech => {
    const name = typeof charTech === 'string' ? charTech : charTech.name;
    
    const libraryItem = findInLibrary(userTechniqueLibrary, charTech);
    
    if (libraryItem) {
      return {
        id: libraryItem.id,
        name: libraryItem.name,
        description: libraryItem.description || '',
        parts: (libraryItem.parts || []).map(part => ({
          id: String(part.id || ''),
          name: part.name || '',
          op_1_lvl: part.op_1_lvl,
          op_2_lvl: part.op_2_lvl,
          op_3_lvl: part.op_3_lvl,
        })),
        libraryItem,
        // Additional display fields can be calculated/derived here
      };
    }
    
    // Not found in library - return placeholder
    return {
      id: typeof charTech === 'object' ? String(charTech.id || '') : name,
      name,
      description: 'Technique not found in your library',
      notInLibrary: true,
    };
  });
}

/**
 * Enrich character equipment with full data from user's item library
 */
export function enrichItems(
  characterItems: Array<{ name: string; equipped?: boolean; type?: string }> | undefined,
  userItemLibrary: UserItem[],
  itemType: 'weapon' | 'armor' | 'equipment'
): EnrichedItem[] {
  if (!characterItems || characterItems.length === 0) return [];
  
  return characterItems.map(charItem => {
    const name = typeof charItem === 'string' ? charItem : charItem.name;
    const equipped = typeof charItem === 'object' ? !!charItem.equipped : false;
    
    const libraryItem = findInLibrary(userItemLibrary, charItem);
    
    if (libraryItem) {
      return {
        id: libraryItem.id,
        name: libraryItem.name,
        description: libraryItem.description || '',
        type: libraryItem.type || itemType,
        equipped,
        damage: libraryItem.damage,
        armorValue: libraryItem.armorValue,
        properties: libraryItem.properties || [],
        libraryItem,
      };
    }
    
    // Not found in library - return placeholder
    return {
      id: name,
      name,
      description: 'Item not found in your library',
      type: itemType,
      equipped,
      notInLibrary: true,
    };
  });
}

/**
 * Enrich all character data at once
 * Returns enriched data alongside the original character
 */
export interface EnrichedCharacterData {
  powers: EnrichedPower[];
  techniques: EnrichedTechnique[];
  weapons: EnrichedItem[];
  armor: EnrichedItem[];
  equipment: EnrichedItem[];
}

/** Helper to safely convert equipment arrays */
function toEquipmentArray(items: unknown): Array<{ name: string; equipped?: boolean }> {
  if (!items) return [];
  if (Array.isArray(items)) {
    return items.map(item => ({
      name: typeof item === 'string' ? item : (item?.name || ''),
      equipped: typeof item === 'object' ? !!item?.equipped : false,
    })).filter(item => item.name);
  }
  // Single item (e.g., Armor object)
  if (typeof items === 'object' && 'name' in items) {
    const obj = items as { name?: string; equipped?: boolean };
    return obj.name ? [{ name: obj.name, equipped: !!obj.equipped }] : [];
  }
  return [];
}

export function enrichCharacterData(
  character: Character,
  userPowers: UserPower[],
  userTechniques: UserTechnique[],
  userItems: UserItem[]
): EnrichedCharacterData {
  // Split items by type
  const weaponItems = userItems.filter(i => i.type === 'weapon');
  const armorItems = userItems.filter(i => i.type === 'armor');
  const equipmentItems = userItems.filter(i => i.type === 'equipment');
  
  return {
    powers: enrichPowers(character.powers, userPowers),
    techniques: enrichTechniques(character.techniques, userTechniques),
    weapons: enrichItems(
      toEquipmentArray(character.equipment?.weapons),
      weaponItems,
      'weapon'
    ),
    armor: enrichItems(
      toEquipmentArray(character.equipment?.armor),
      armorItems,
      'armor'
    ),
    equipment: enrichItems(
      toEquipmentArray(character.equipment?.items),
      equipmentItems,
      'equipment'
    ),
  };
}
