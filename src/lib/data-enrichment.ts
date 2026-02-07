/**
 * Data Enrichment Utilities
 * ==========================
 * Pairs raw character data with full objects from user's library
 * Mirrors the vanilla site's data-enrichment.js patterns
 */

import type { CharacterPower, CharacterTechnique, Character } from '@/types';
import type { UserPower, UserTechnique, UserItem, SavedDamage } from '@/hooks/use-user-library';
import type { PowerPart, TechniquePart } from '@/hooks/use-rtdb';
import { derivePowerDisplay, deriveTechniqueDisplay, formatPowerDamage, formatTechniqueDamage } from '@/lib/calculators';

// =============================================================================
// Types for Enriched Data
// =============================================================================

/** Enriched power with full data from user's library */
export interface EnrichedPower extends CharacterPower {
  // Display fields from library
  description: string;
  cost?: number; // Energy cost of the power
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
  cost?: number; // Energy cost of the technique
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
  type: 'weapon' | 'armor' | 'equipment' | 'shield';
  equipped?: boolean;
  // Display fields
  damage?: string | SavedDamage[];
  armorValue?: number;
  properties?: string[];
  displayProperties?: Array<{
    name: string;
    description?: string;
  }>;
  // Armor-specific fields
  critRange?: number;
  agilityReduction?: number;
  abilityRequirement?: {
    name?: string;
    level?: number;
  };
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
      String(item.name ?? '').toLowerCase() === searchName ||
      item.id === reference
    );
  }
  
  // If reference is an object, try ID first, then name
  if (reference.id !== undefined) {
    const found = library.find(item => item.id === String(reference.id));
    if (found) return found;
  }
  
  if (reference.name) {
    const searchName = String(reference.name ?? '').toLowerCase();
    return library.find(item => String(item.name ?? '').toLowerCase() === searchName);
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
 * Uses derivePowerDisplay to calculate energy cost, action type, etc.
 */
export function enrichPowers(
  characterPowers: CharacterPower[] | undefined,
  userPowerLibrary: UserPower[],
  powerPartsDb: PowerPart[] = []
): EnrichedPower[] {
  if (!characterPowers || characterPowers.length === 0) return [];
  
  return characterPowers.map(charPower => {
    const name = typeof charPower === 'string' ? charPower : charPower.name;
    const innate = typeof charPower === 'object' ? !!(charPower as unknown as { innate?: boolean }).innate : false;
    
    const libraryItem = findInLibrary(userPowerLibrary, charPower);
    
    if (libraryItem) {
      // Use derivePowerDisplay to calculate all display values including cost
      const displayData = derivePowerDisplay(
        {
          name: libraryItem.name,
          description: libraryItem.description,
          parts: libraryItem.parts || [],
          actionType: libraryItem.actionType,
          isReaction: libraryItem.isReaction,
          range: libraryItem.range,
          area: libraryItem.area,
          duration: libraryItem.duration,
          damage: libraryItem.damage,
        },
        powerPartsDb
      );
      
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
        // Calculated display fields from derivePowerDisplay
        cost: displayData.energy,
        actionType: displayData.actionType,
        area: displayData.area,
        duration: displayData.duration,
        range: displayData.range,
        damage: formatPowerDamage(libraryItem.damage),
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
 * Uses deriveTechniqueDisplay to calculate stamina cost, action type, etc.
 */
export function enrichTechniques(
  characterTechniques: CharacterTechnique[] | undefined,
  userTechniqueLibrary: UserTechnique[],
  techniquePartsDb: TechniquePart[] = []
): EnrichedTechnique[] {
  if (!characterTechniques || characterTechniques.length === 0) return [];
  
  return characterTechniques.map(charTech => {
    const name = typeof charTech === 'string' ? charTech : charTech.name;
    
    const libraryItem = findInLibrary(userTechniqueLibrary, charTech);
    
    if (libraryItem) {
      // Extract first damage object if damage is an array
      const damageObj = Array.isArray(libraryItem.damage) && libraryItem.damage.length > 0
        ? libraryItem.damage[0]
        : undefined;
      
      // Use deriveTechniqueDisplay to calculate all display values including cost
      const displayData = deriveTechniqueDisplay(
        {
          name: libraryItem.name,
          description: libraryItem.description,
          parts: libraryItem.parts || [],
          weapon: libraryItem.weapon,
          damage: damageObj,
        },
        techniquePartsDb
      );
      
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
        // Calculated display fields from deriveTechniqueDisplay
        cost: displayData.energy,
        actionType: displayData.actionType,
        weaponName: displayData.weaponName,
        damageStr: displayData.damageStr,
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
 * Codex Equipment Item interface (for equipment lookup)
 */
export interface CodexEquipmentItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'equipment';
  subtype?: string;
  category?: string;
  description: string;
  damage?: string;
  armor_value?: number;
  gold_cost?: number;
  currency?: number;
  properties?: string[];
  rarity?: string;
  weight?: number;
}

/**
 * Enrich character equipment with full data from user's item library
 * Falls back to Codex equipment data for general items if not found in user library
 */
export function enrichItems(
  characterItems: Array<{ name: string; equipped?: boolean; type?: string }> | undefined,
  userItemLibrary: UserItem[],
  itemType: 'weapon' | 'armor' | 'equipment',
  codexEquipment?: CodexEquipmentItem[]
): EnrichedItem[] {
  if (!characterItems || characterItems.length === 0) return [];
  
  return characterItems.map(charItem => {
    const name = typeof charItem === 'string' ? charItem : charItem.name;
    const equipped = typeof charItem === 'object' ? !!charItem.equipped : false;
    
    // First try user's library
    const libraryItem = findInLibrary(userItemLibrary, charItem);
    
    if (libraryItem) {
      // Convert properties from SavedProperty objects to string names
      const propertyNames = (libraryItem.properties || [])
        .map(p => typeof p === 'string' ? p : p.name)
        .filter((name): name is string => typeof name === 'string');
      
      return {
        id: libraryItem.id,
        name: libraryItem.name,
        description: libraryItem.description || '',
        type: libraryItem.type || itemType,
        equipped,
        damage: libraryItem.damage,
        armorValue: libraryItem.armorValue,
        properties: propertyNames,
        // Armor-specific fields
        critRange: libraryItem.criticalRangeIncrease,
        agilityReduction: libraryItem.agilityReduction,
        abilityRequirement: libraryItem.abilityRequirement,
        libraryItem,
      };
    }
    
    // For equipment, also check Codex as fallback
    if (codexEquipment && codexEquipment.length > 0) {
      const searchName = name.toLowerCase();
      const codexItem = codexEquipment.find(item => 
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
          damage: codexItem.damage,
          armorValue: codexItem.armor_value,
          properties: codexItem.properties || [],
        };
      }
    }
    
    // Not found in library or Codex - return placeholder
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
  userItems: UserItem[],
  codexEquipment?: CodexEquipmentItem[],
  powerPartsDb?: PowerPart[],
  techniquePartsDb?: TechniquePart[]
): EnrichedCharacterData {
  // Split items by type
  const weaponItems = userItems.filter(i => i.type === 'weapon');
  const armorItems = userItems.filter(i => i.type === 'armor');
  const equipmentItems = userItems.filter(i => i.type === 'equipment');
  
  // Split Codex equipment by type for fallback lookups
  const codexWeapons = codexEquipment?.filter(i => i.type === 'weapon');
  const codexArmor = codexEquipment?.filter(i => i.type === 'armor');
  const codexItems = codexEquipment?.filter(i => i.type === 'equipment');
  
  return {
    powers: enrichPowers(character.powers, userPowers, powerPartsDb || []),
    techniques: enrichTechniques(character.techniques, userTechniques, techniquePartsDb || []),
    weapons: enrichItems(
      toEquipmentArray(character.equipment?.weapons),
      weaponItems,
      'weapon',
      codexWeapons
    ),
    armor: enrichItems(
      toEquipmentArray(character.equipment?.armor),
      armorItems,
      'armor',
      codexArmor
    ),
    equipment: enrichItems(
      toEquipmentArray(character.equipment?.items),
      equipmentItems,
      'equipment',
      codexItems
    ),
  };
}

// =============================================================================
// Data Cleaning for Save
// =============================================================================

/**
 * Fields that should be saved to Prisma (minimal data).
 * Mirrors vanilla site's SAVEABLE_FIELDS in main.js cleanForSave().
 */
const SAVEABLE_FIELDS = [
  // Identity
  'name', 'species', 'gender', 'portrait', 'xp', 'level',
  // Core stats (user-set values only)
  'abilities', 'defenseSkills', 'baseAbilities', 'ancestryAbilities',
  'health', 'energy', 'healthPoints', 'energyPoints', 'innateEnergy',
  'speedBase', 'evasionBase',
  // Skills (user selections)
  'skills',
  // Archetype/Build
  'archetype', 'archetypeName', 'archetypeAbility',
  // Proficiency data
  'mart_prof', 'pow_prof', 'mart_abil', 'pow_abil', 'archetypeChoices',
  // References (names only, not full objects)
  'feats', 'techniques', 'powers', 'traits',
  // Trait uses tracking
  'traitUses',
  // Inventory (names/equipped status only, not full item data)
  'equipment', 'currency',
  // Notes and misc user data
  'notes', 'backstory', 'appearance', 'archetypeDesc', 'allies', 'organizations',
  // Character visibility (who can view sheet)
  'visibility',
  // Ancestry data
  'ancestry', 'ancestryId', 'ancestryTraits',
  // Conditions
  'conditions',
  // Timestamps
  'createdAt', 'updatedAt',
] as const;

/**
 * Helper function to recursively remove undefined values from an object.
 * PostgreSQL JSONB doesn't accept undefined values.
 */
function removeUndefinedValues<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedValues(item)).filter(item => item !== undefined) as T;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedValues(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

/**
 * Removes temporary and computed fields from character data before saving.
 * Only keeps the minimal data needed - everything else is calculated on load.
 * Mirrors the vanilla site's cleanForSave() function.
 */
export function cleanForSave(data: Character): Partial<Character> {
  const cleaned: Record<string, unknown> = {};

  // Only copy saveable fields
  for (const field of SAVEABLE_FIELDS) {
    if (data[field as keyof Character] !== undefined) {
      cleaned[field] = data[field as keyof Character];
    }
  }

  // Clean up skills - ensure no undefined values and proper structure
  if (Array.isArray(cleaned.skills)) {
    cleaned.skills = cleaned.skills.map((s: unknown) => {
      if (typeof s === 'string') return { name: s, skill_val: 0, prof: false };
      if (s && typeof s === 'object' && 'name' in s) {
        const skill = s as { 
          id?: string; 
          name: string; 
          skill_val?: number; 
          prof?: boolean; 
          ability?: string;
          baseSkillId?: number | null; // ID of base skill (0 = any, undefined = not a sub-skill)
          selectedBaseSkillId?: string; // User-selected base skill for "any" sub-skills
        };
        const cleanSkill: Record<string, unknown> = {
          name: skill.name,
          skill_val: skill.skill_val ?? 0,
          prof: skill.prof ?? false,
        };
        // Only add optional fields if they have values (not undefined/null)
        if (skill.id) cleanSkill.id = skill.id;
        if (skill.ability) cleanSkill.ability = skill.ability;
        if (skill.baseSkillId !== undefined) cleanSkill.baseSkillId = skill.baseSkillId;
        if (skill.selectedBaseSkillId) cleanSkill.selectedBaseSkillId = skill.selectedBaseSkillId;
        return cleanSkill;
      }
      return null;
    }).filter(Boolean);
  }

  // Clean up feats - only save name, type, and currentUses
  if (Array.isArray(cleaned.feats)) {
    cleaned.feats = cleaned.feats.map((f: unknown) => {
      if (typeof f === 'string') return { name: f };
      if (f && typeof f === 'object' && 'name' in f) {
        const feat = f as { name: string; type?: string; currentUses?: number };
        const cleanFeat: { name: string; type?: string; currentUses?: number } = { name: feat.name };
        if (feat.type) cleanFeat.type = feat.type;
        if (typeof feat.currentUses === 'number') cleanFeat.currentUses = feat.currentUses;
        return cleanFeat;
      }
      return null;
    }).filter(Boolean);
  }

  // Clean up archetypeFeats similarly
  if (Array.isArray(cleaned.archetypeFeats)) {
    cleaned.archetypeFeats = (cleaned.archetypeFeats as unknown[]).map((f: unknown) => {
      if (typeof f === 'string') return { name: f };
      if (f && typeof f === 'object' && 'name' in f) {
        const feat = f as { id?: string | number; name: string; currentUses?: number; maxUses?: number };
        const cleanFeat: Record<string, unknown> = { name: feat.name };
        if (feat.id) cleanFeat.id = feat.id;
        if (typeof feat.currentUses === 'number') cleanFeat.currentUses = feat.currentUses;
        if (typeof feat.maxUses === 'number') cleanFeat.maxUses = feat.maxUses;
        return cleanFeat;
      }
      return null;
    }).filter(Boolean);
  }

  // Clean up powers - save name and innate flag only
  if (Array.isArray(cleaned.powers)) {
    cleaned.powers = cleaned.powers.map((p: unknown) => {
      if (typeof p === 'string') return { name: p, innate: false };
      if (p && typeof p === 'object' && 'name' in p) {
        const power = p as { name: string; innate?: boolean };
        return { name: power.name, innate: !!power.innate };
      }
      return null;
    }).filter(Boolean);
  }

  // Clean up techniques - save name only
  if (Array.isArray(cleaned.techniques)) {
    cleaned.techniques = cleaned.techniques.map((t: unknown) => {
      if (typeof t === 'string') return t;
      if (t && typeof t === 'object' && 'name' in t) {
        return (t as { name: string }).name;
      }
      return null;
    }).filter(Boolean);
  }

  // Clean up traits - save name only
  if (Array.isArray(cleaned.traits)) {
    cleaned.traits = cleaned.traits.map((t: unknown) => {
      if (typeof t === 'string') return t;
      if (t && typeof t === 'object' && 'name' in t) {
        return (t as { name: string }).name;
      }
      return null;
    }).filter(Boolean);
  }

  // Clean up equipment items - only save name and equipped/quantity status
  if (cleaned.equipment && typeof cleaned.equipment === 'object') {
    const equip = cleaned.equipment as {
      weapons?: unknown[];
      armor?: unknown[];
      items?: unknown[];
    };

    if (Array.isArray(equip.weapons)) {
      equip.weapons = equip.weapons.map((w: unknown) => {
        if (typeof w === 'string') return { name: w };
        if (w && typeof w === 'object' && 'name' in w) {
          const weapon = w as { name: string; equipped?: boolean };
          const clean: { name: string; equipped?: boolean } = { name: weapon.name };
          if (weapon.equipped) clean.equipped = true;
          return clean;
        }
        return null;
      }).filter(Boolean);
    }

    if (Array.isArray(equip.armor)) {
      equip.armor = equip.armor.map((a: unknown) => {
        if (typeof a === 'string') return { name: a };
        if (a && typeof a === 'object' && 'name' in a) {
          const armor = a as { name: string; equipped?: boolean };
          const clean: { name: string; equipped?: boolean } = { name: armor.name };
          if (armor.equipped) clean.equipped = true;
          return clean;
        }
        return null;
      }).filter(Boolean);
    }

    if (Array.isArray(equip.items)) {
      equip.items = equip.items.map((e: unknown) => {
        if (typeof e === 'string') return { name: e };
        if (e && typeof e === 'object' && 'name' in e) {
          const item = e as { name: string; quantity?: number };
          const clean: { name: string; quantity?: number } = { name: item.name };
          if (item.quantity && item.quantity !== 1) clean.quantity = item.quantity;
          return clean;
        }
        return null;
      }).filter(Boolean);
    }

    cleaned.equipment = equip;
  }

  // Final pass: remove any remaining undefined values for JSONB compatibility
  return removeUndefinedValues(cleaned) as Partial<Character>;
}
