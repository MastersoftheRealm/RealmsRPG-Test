/**
 * Data Enrichment Utilities
 * ==========================
 * Pairs raw character data with full objects from user's library
 * Mirrors the vanilla site's data-enrichment.js patterns
 */

import type { CharacterPower, CharacterTechnique, Character } from '@/types';
import type { UserPower, UserTechnique, UserItem, SavedDamage } from '@/hooks/use-user-library';
import type { PowerPart, TechniquePart } from '@/hooks/use-rtdb';
import { derivePowerDisplay, deriveTechniqueDisplay, formatPowerDamage, formatTechniqueDamage, formatRange, deriveShieldAmountFromProperties, deriveShieldDamageFromProperties } from '@/lib/calculators';

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
  tp?: number; // Training points cost of the technique
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
  quantity?: number;
  // Display fields
  damage?: string | SavedDamage[];
  range?: string;
  armorValue?: number;
  armor?: number;
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
  // Shield-specific (block amount and optional damage)
  shieldAmount?: string;
  shieldDamage?: string | null;
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
 * Derive ability requirement from item properties when not stored as abilityRequirement.
 * Handles older saves or items where requirement was only in the properties list.
 */
function deriveAbilityRequirementFromProperties(
  properties: Array<{ id?: number; name?: string; op_1_lvl?: number }>
): { name: string; level: number } | undefined {
  for (const p of properties || []) {
    const name = typeof p === 'string' ? '' : (p.name || '');
    const op1 = typeof p === 'object' && p != null ? (p.op_1_lvl ?? 0) : 0;
    const level = 1 + (Number(op1) || 0);
    if (level < 1) continue;
    if (name.includes('Strength Requirement')) return { name: 'Strength', level };
    if (name.includes('Agility Requirement')) return { name: 'Agility', level };
    if (name.includes('Vitality Requirement')) return { name: 'Vitality', level };
    if (name.includes('Acuity Requirement')) return { name: 'Acuity', level };
    if (name.includes('Intelligence Requirement')) return { name: 'Intelligence', level };
    if (name.includes('Charisma Requirement')) return { name: 'Charisma', level };
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
  powerPartsDb: PowerPart[] = [],
  publicPowerLibrary?: UserPower[]
): EnrichedPower[] {
  if (!characterPowers || characterPowers.length === 0) return [];
  
  return characterPowers.map(charPower => {
    const name = typeof charPower === 'string' ? charPower : charPower.name;
    const innate = typeof charPower === 'object' ? !!(charPower as unknown as { innate?: boolean }).innate : false;
    
    let libraryItem = findInLibrary(userPowerLibrary, charPower);
    if (!libraryItem && publicPowerLibrary?.length) {
      libraryItem = findInLibrary(publicPowerLibrary, charPower);
    }
    
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
  techniquePartsDb: TechniquePart[] = [],
  publicTechniqueLibrary?: UserTechnique[]
): EnrichedTechnique[] {
  if (!characterTechniques || characterTechniques.length === 0) return [];
  
  return characterTechniques.map(charTech => {
    const name = typeof charTech === 'string' ? charTech : charTech.name;
    
    let libraryItem = findInLibrary(userTechniqueLibrary, charTech);
    if (!libraryItem && publicTechniqueLibrary?.length) {
      libraryItem = findInLibrary(publicTechniqueLibrary, charTech);
    }
    
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
        tp: displayData.tp,
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
  type: 'weapon' | 'armor' | 'equipment' | 'shield';
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
  characterItems: Array<{ id?: string | number; name?: string; equipped?: boolean; type?: string; quantity?: number }> | undefined,
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
      return {
        id: displayId,
        name: libraryItem.name,
        description: libraryItem.description ?? '',
        type: libraryItem.type || itemType,
        equipped,
        quantity,
        damage: libraryItem.damage,
        armorValue: libraryItem.armorValue,
        properties: propertyNames,
        range: (itemType === 'weapon' || itemType === 'shield') ? formatRange(props) : undefined,
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
          armorValue: codexItem.armor_value,
          properties: codexItem.properties || [],
        };
      }
    }
    
    // Not found in library or Codex - return placeholder
    const itemId = typeof charItem === 'object' ? String(charItem.id || name) : name;
    return {
      id: itemId,
      name: name || itemId,
      description: 'Item not found in your library',
      type: itemType,
      equipped,
      quantity,
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
  shields: EnrichedItem[];
  armor: EnrichedItem[];
  equipment: EnrichedItem[];
}

/** Helper to safely convert equipment arrays — preserves id, name, equipped, quantity */
function toEquipmentArray(items: unknown): Array<{ id?: string | number; name?: string; equipped?: boolean; quantity?: number }> {
  if (!items) return [];
  if (Array.isArray(items)) {
    return items.map(item => {
      if (typeof item === 'string') return { name: item };
      if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        const result: { id?: string | number; name?: string; equipped?: boolean; quantity?: number } = {};
        if (obj.id) result.id = obj.id as string | number;
        if (obj.name) result.name = obj.name as string;
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
  // Split items by type
  const weaponItems = userItems.filter(i => i.type === 'weapon');
  const shieldItems = userItems.filter(i => i.type === 'shield');
  const armorItems = userItems.filter(i => i.type === 'armor');
  const equipmentItems = userItems.filter(i => i.type === 'equipment');
  const codexWeapons = codexEquipment?.filter(i => i.type === 'weapon');
  const codexShields = codexEquipment?.filter(i => i.type === 'shield');
  const codexArmor = codexEquipment?.filter(i => i.type === 'armor');
  const codexItems = codexEquipment?.filter(i => i.type === 'equipment');
  const publicWeaponItems = publicLibraries?.items?.filter(i => i.type === 'weapon');
  const publicShieldItems = publicLibraries?.items?.filter(i => i.type === 'shield');
  const publicArmorItems = publicLibraries?.items?.filter(i => i.type === 'armor');
  const publicEquipmentItems = publicLibraries?.items?.filter(i => (i.type || 'equipment') === 'equipment');

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

// =============================================================================
// Data Cleaning for Save
// =============================================================================

/**
 * Fields that should be saved to Prisma (minimal data).
 * Mirrors vanilla site's SAVEABLE_FIELDS in main.js cleanForSave().
 */
const SAVEABLE_FIELDS = [
  // Identity (species derived from ancestry.id via codex)
  'name', 'gender', 'portrait', 'xp', 'experience', 'level',
  'status', 'description',
  // Core stats (user-set values only)
  'abilities', 'defenseVals', 'baseAbilities', 'ancestryAbilities',
  'healthPoints', 'energyPoints', 'innateEnergy',
  'currentHealth', 'currentEnergy', 'actionPoints',
  'speedBase', 'evasionBase',
  // Skills (user selections)
  'skills',
  // Archetype/Build (lean: { id, type } only — name/description derived from codex)
  'archetype',
  // Proficiency data
  'mart_prof', 'pow_prof', 'mart_abil', 'pow_abil', 'archetypeChoices',
  // References (IDs or minimal data — not full objects)
  'feats', 'archetypeFeats', 'techniques', 'powers', 'traits',
  // Trait uses tracking
  'traitUses',
  // State uses (per recovery, max = proficiency)
  'stateUsesCurrent',
  // Unarmed prowess (allocated by player)
  'unarmedProwess',
  // Inventory (names/equipped status only, not full item data)
  'equipment', 'currency',
  // Notes and misc user data
  'notes', 'namedNotes', 'backstory', 'appearance', 'archetypeDesc', 'allies', 'organizations',
  // Physical attributes
  'weight', 'height',
  // Character visibility (who can view sheet)
  'visibility',
  // Display preferences (speed shown as spaces, feet, or meters)
  'speedDisplayUnit',
  // Ancestry/Species data (lean: { id, name, selectedTraits, selectedFlaw, selectedCharacteristic })
  'ancestry',
  // Conditions
  'conditions',
  // Training points tracking
  'trainingPointsSpent',
  // Timestamps
  'createdAt', 'updatedAt', 'lastPlayedAt',
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

  // Migrate defenseSkills → defenseVals (backward compat for old saves)
  if (!cleaned.defenseVals && data.defenseSkills) {
    cleaned.defenseVals = data.defenseSkills;
  }

  // Migrate health/energy ResourcePool → currentHealth/currentEnergy
  if (cleaned.currentHealth === undefined && data.health?.current !== undefined) {
    cleaned.currentHealth = data.health.current;
  }
  if (cleaned.currentEnergy === undefined && data.energy?.current !== undefined) {
    cleaned.currentEnergy = data.energy.current;
  }

  // Persist health/energy { current, max } for realtime sync to encounter tracker (current + max so encounter gets both)
  const dataHealth = data.health as { current?: number; max?: number } | undefined;
  const dataEnergy = data.energy as { current?: number; max?: number } | undefined;
  const healthCurrent = (cleaned.currentHealth as number) ?? dataHealth?.current;
  const energyCurrent = (cleaned.currentEnergy as number) ?? dataEnergy?.current;
  if (typeof healthCurrent === 'number') {
    cleaned.health = {
      current: healthCurrent,
      max: typeof dataHealth?.max === 'number' ? dataHealth.max : (data as Character).health?.max ?? healthCurrent,
    };
  }
  if (typeof energyCurrent === 'number') {
    cleaned.energy = {
      current: energyCurrent,
      max: typeof dataEnergy?.max === 'number' ? dataEnergy.max : (data as Character).energy?.max ?? energyCurrent,
    };
  }

  // Strip ancestry to lean { id, name, selectedTraits, selectedFlaw, selectedCharacteristic }
  // size/speed/abilities are derived from codex; name kept for server-side listing.
  if (cleaned.ancestry && typeof cleaned.ancestry === 'object') {
    const anc = cleaned.ancestry as Record<string, unknown>;
    const leanAnc: Record<string, unknown> = {};
    if (anc.id) leanAnc.id = anc.id;
    if (anc.name) leanAnc.name = anc.name; // Kept for server-side listing
    if (anc.selectedTraits) leanAnc.selectedTraits = anc.selectedTraits;
    if (anc.selectedFlaw !== undefined) leanAnc.selectedFlaw = anc.selectedFlaw;
    if (anc.selectedCharacteristic !== undefined) leanAnc.selectedCharacteristic = anc.selectedCharacteristic;
    cleaned.ancestry = leanAnc;
  }

  // Migrate legacy species string → ancestry.name if ancestry is missing
  if (!cleaned.ancestry && data.species) {
    cleaned.ancestry = { name: data.species };
  }

  // Strip archetype to lean { id, type } — name/description/ability derived from codex
  if (cleaned.archetype && typeof cleaned.archetype === 'object') {
    const arch = cleaned.archetype as Record<string, unknown>;
    const leanArch: Record<string, unknown> = {};
    if (arch.id) leanArch.id = arch.id;
    if (arch.type) leanArch.type = arch.type;
    cleaned.archetype = leanArch;
  }

  // Clean up skills — save { id, name, skill_val, prof, selectedBaseSkillId?, ability? }.
  // ability: when a skill has multiple governing abilities in codex (e.g. Lockpick: Agility or Intelligence),
  // the player's selected ability must be saved so bonus calculations use the right one. Omit when only one option.
  // baseSkillId, category, description derived from codex_skills on load.
  // Handle both Array<SkillObject> and Record<skillId, number> formats.
  if (cleaned.skills && typeof cleaned.skills === 'object' && !Array.isArray(cleaned.skills)) {
    // Record<skillId, number> format — convert to lean array
    const record = cleaned.skills as Record<string, number>;
    cleaned.skills = Object.entries(record)
      .filter(([, val]) => typeof val === 'number' && val > 0)
      .map(([id, val]) => ({ id, skill_val: val, prof: true }));
  }
  if (Array.isArray(cleaned.skills)) {
    cleaned.skills = cleaned.skills.map((s: unknown) => {
      if (typeof s === 'string') return { name: s, skill_val: 0, prof: false };
      if (s && typeof s === 'object') {
        const skill = s as Record<string, unknown>;
        const cleanSkill: Record<string, unknown> = {};
        if (skill.id) cleanSkill.id = skill.id;
        if (skill.name) cleanSkill.name = skill.name; // Backward compat lookup key
        cleanSkill.skill_val = (skill.skill_val as number) ?? 0;
        cleanSkill.prof = !!(skill.prof);
        if (skill.selectedBaseSkillId) cleanSkill.selectedBaseSkillId = skill.selectedBaseSkillId;
        // Persist player's selected ability for skills with multiple options (e.g. Lockpick → Agility or Intelligence)
        if (skill.ability && typeof skill.ability === 'string') cleanSkill.ability = skill.ability;
        return cleanSkill;
      }
      return null;
    }).filter(Boolean);
  }

  // Clean up feats — save id + name (compat fallback) + currentUses only.
  // name/description/maxUses/recovery are derived from codex on load.
  if (Array.isArray(cleaned.feats)) {
    cleaned.feats = cleaned.feats.map((f: unknown) => {
      if (typeof f === 'string') return { name: f };
      if (f && typeof f === 'object') {
        const feat = f as { id?: string | number; name?: string; currentUses?: number };
        const cleanFeat: Record<string, unknown> = {};
        if (feat.id) cleanFeat.id = feat.id;
        if (feat.name) cleanFeat.name = feat.name; // Backward compat lookup key
        if (typeof feat.currentUses === 'number') cleanFeat.currentUses = feat.currentUses;
        return Object.keys(cleanFeat).length > 0 ? cleanFeat : null;
      }
      return null;
    }).filter(Boolean);
  }

  // Clean up archetypeFeats — same lean format
  if (Array.isArray(cleaned.archetypeFeats)) {
    cleaned.archetypeFeats = (cleaned.archetypeFeats as unknown[]).map((f: unknown) => {
      if (typeof f === 'string') return { name: f };
      if (f && typeof f === 'object') {
        const feat = f as { id?: string | number; name?: string; currentUses?: number };
        const cleanFeat: Record<string, unknown> = {};
        if (feat.id) cleanFeat.id = feat.id;
        if (feat.name) cleanFeat.name = feat.name; // Backward compat lookup key
        if (typeof feat.currentUses === 'number') cleanFeat.currentUses = feat.currentUses;
        return Object.keys(cleanFeat).length > 0 ? cleanFeat : null;
      }
      return null;
    }).filter(Boolean);
  }

  // Clean up powers — save id + name (compat) + innate flag only.
  // description, parts, cost, damage, etc. derived from library enrichment on load.
  if (Array.isArray(cleaned.powers)) {
    cleaned.powers = cleaned.powers.map((p: unknown) => {
      if (typeof p === 'string') return { name: p, innate: false };
      if (p && typeof p === 'object') {
        const power = p as { id?: string | number; name?: string; innate?: boolean };
        const clean: Record<string, unknown> = {};
        if (power.id) clean.id = power.id;
        if (power.name) clean.name = power.name; // Backward compat lookup key
        clean.innate = !!power.innate;
        return clean;
      }
      return null;
    }).filter(Boolean);
  }

  // Clean up techniques — save id + name (compat) only.
  // description, parts, cost, damage, etc. derived from library enrichment on load.
  if (Array.isArray(cleaned.techniques)) {
    cleaned.techniques = cleaned.techniques.map((t: unknown) => {
      if (typeof t === 'string') return { name: t };
      if (t && typeof t === 'object') {
        const tech = t as { id?: string | number; name?: string };
        const clean: Record<string, unknown> = {};
        if (tech.id) clean.id = tech.id;
        if (tech.name) clean.name = tech.name; // Backward compat lookup key
        return Object.keys(clean).length > 0 ? clean : null;
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

  // Clean up equipment — save { id, name, equipped?, quantity? } per item.
  // description/damage/properties/cost/etc derived from codex/library on load.
  // name kept as backward compat lookup key; id is primary lookup.
  if (cleaned.equipment && typeof cleaned.equipment === 'object') {
    const equip = cleaned.equipment as {
      weapons?: unknown[];
      shields?: unknown[];
      armor?: unknown[];
      items?: unknown[];
      inventory?: unknown[]; // Remove redundant inventory array
    };

    const cleanItem = (item: unknown): Record<string, unknown> | null => {
      if (typeof item === 'string') return { name: item };
      if (item && typeof item === 'object') {
        const i = item as Record<string, unknown>;
        const clean: Record<string, unknown> = {};
        if (i.id) clean.id = i.id;
        if (i.name) clean.name = i.name;
        if (i.equipped) clean.equipped = true;
        if (i.quantity && i.quantity !== 1) clean.quantity = i.quantity;
        return Object.keys(clean).length > 0 ? clean : null;
      }
      return null;
    };

    if (Array.isArray(equip.weapons)) {
      equip.weapons = equip.weapons.map(cleanItem).filter(Boolean) as unknown[];
    }
    if (Array.isArray(equip.shields)) {
      equip.shields = equip.shields.map(cleanItem).filter(Boolean) as unknown[];
    }
    if (Array.isArray(equip.armor)) {
      equip.armor = equip.armor.map(cleanItem).filter(Boolean) as unknown[];
    }
    if (Array.isArray(equip.items)) {
      equip.items = equip.items.map(cleanItem).filter(Boolean) as unknown[];
    }
    // Remove redundant inventory array (weapons/armor/items are the source of truth)
    delete equip.inventory;

    cleaned.equipment = equip;
  }

  // Final pass: remove any remaining undefined values for JSONB compatibility
  return removeUndefinedValues(cleaned) as Partial<Character>;
}
