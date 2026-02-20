/**
 * Creature Creator - Display Item Transformers
 * =============================================
 * Transform user library data into DisplayItem format for use with
 * ItemSelectionModal and ItemCard components.
 */

import type { DisplayItem, ItemStat } from '@/types/items';
import type { UserPower, UserTechnique, UserItem } from '@/hooks/use-user-library';
import type { CreatureFeat as RTDBCreatureFeat, ItemProperty } from '@/hooks/use-rtdb';
import type { PowerPart, TechniquePart } from '@/hooks';
import { derivePowerDisplay, formatPowerDamage } from '@/lib/calculators/power-calc';
import { deriveTechniqueDisplay } from '@/lib/calculators/technique-calc';
import { deriveItemDisplay, type ItemPropertyPayload } from '@/lib/calculators/item-calc';

// =============================================================================
// Creature Types (for conversion back from DisplayItem)
// =============================================================================

export interface CreaturePower {
  id: string;
  name: string;
  energy: number;
  action: string;
  duration: string;
  range: string;
  area: string;
  damage: string;
}

export interface CreatureTechnique {
  id: string;
  name: string;
  energy: number;
  tp: number;
  action: string;
  weapon: string;
  damage: string;
}

export interface CreatureFeat {
  id: string;
  name: string;
  description?: string;
  points?: number;
}

export interface CreatureArmament {
  id: string;
  name: string;
  type: string;
  tp: number;
  currency: number;
  rarity: string;
}

// =============================================================================
// Power Transformer
// =============================================================================

export function transformUserPowerToDisplayItem(
  power: UserPower,
  partsDb: PowerPart[]
): DisplayItem {
  const display = derivePowerDisplay(
    { 
      name: power.name, 
      description: power.description, 
      parts: power.parts || [], 
      damage: power.damage 
    },
    partsDb
  );
  const damageStr = formatPowerDamage(power.damage);

  const stats: ItemStat[] = [
    { label: 'Action', value: display.actionType },
    { label: 'Damage', value: damageStr || '-' },
    { label: 'Area', value: display.area && display.area !== '-' ? display.area : '-' },
  ];

  return {
    id: power.docId,
    name: power.name,
    description: power.description,
    category: 'power',
    stats,
    details: [
      { label: 'Duration', value: display.duration },
      ...(damageStr ? [{ label: 'Damage', value: damageStr }] : []),
    ],
    badges: [],
    sourceData: {
      id: power.docId,
      name: power.name,
      energy: display.energy,
      action: display.actionType,
      duration: display.duration,
      range: display.range,
      area: display.area,
      damage: damageStr,
    } as unknown as Record<string, unknown>,
  };
}

export function displayItemToCreaturePower(item: DisplayItem): CreaturePower {
  return item.sourceData as unknown as CreaturePower;
}

// =============================================================================
// Technique Transformer
// =============================================================================

export function transformUserTechniqueToDisplayItem(
  technique: UserTechnique,
  partsDb: TechniquePart[]
): DisplayItem {
  const display = deriveTechniqueDisplay(
    { 
      name: technique.name, 
      description: technique.description, 
      parts: technique.parts || [], 
      damage: technique.damage?.[0],
      weapon: technique.weapon 
    },
    partsDb
  );

  const stats: ItemStat[] = [
    { label: 'Energy', value: display.energy },
    { label: 'Weapon', value: display.weaponName || '-' },
    { label: 'Training Pts', value: display.tp },
  ];

  return {
    id: technique.docId,
    name: technique.name,
    description: technique.description,
    category: 'technique',
    stats,
    details: [
      ...(display.damageStr ? [{ label: 'Damage', value: display.damageStr }] : []),
    ],
    badges: [],
    sourceData: {
      id: technique.docId,
      name: technique.name,
      energy: display.energy,
      tp: display.tp,
      action: display.actionType,
      weapon: display.weaponName,
      damage: display.damageStr,
    } as unknown as Record<string, unknown>,
  };
}

export function displayItemToCreatureTechnique(item: DisplayItem): CreatureTechnique {
  return item.sourceData as unknown as CreatureTechnique;
}

// =============================================================================
// Feat Transformer
// =============================================================================

export function transformCreatureFeatToDisplayItem(
  feat: RTDBCreatureFeat,
  selectedIds: Set<string> = new Set(),
  mechanicalFeatIds: Set<number> = new Set()
): DisplayItem | null {
  // Exclude already selected feats and mechanical feats
  if (selectedIds.has(feat.id)) return null;
  
  const numId = parseInt(feat.id, 10);
  if (!isNaN(numId) && mechanicalFeatIds.has(numId)) return null;

  const points = feat.points ?? 1;
  
  return {
    id: feat.id,
    name: feat.name,
    description: feat.description,
    category: 'feat',
    cost: points,
    costLabel: points === 1 ? 'pt' : 'pts',
    stats: [],
    details: [],
    badges: [],
    sourceData: {
      id: feat.id,
      name: feat.name,
      description: feat.description,
      points,
    } as unknown as Record<string, unknown>,
  };
}

export function displayItemToCreatureFeat(item: DisplayItem): CreatureFeat {
  return item.sourceData as unknown as CreatureFeat;
}

// =============================================================================
// Armament (Item) Transformer
// =============================================================================

export function transformUserItemToDisplayItem(
  item: UserItem,
  propertiesDb: ItemProperty[]
): DisplayItem {
  // Convert item to expected format for deriveItemDisplay
  const typeMap: Record<string, 'Armor' | 'Weapon' | 'Shield' | 'Accessory'> = {
    weapon: 'Weapon',
    armor: 'Armor',
    equipment: 'Accessory',
  };
  
  // Convert properties to ItemPropertyPayload format
  const propertyPayloads: ItemPropertyPayload[] = (item.properties || []).map((prop) => ({ 
    name: typeof prop === 'string' ? prop : prop.name || '' 
  }));
  
  const itemDoc = {
    name: item.name,
    description: item.description,
    armamentType: typeMap[item.type] || 'Weapon',
    properties: propertyPayloads,
  };
  
  const display = deriveItemDisplay(itemDoc, propertiesDb);

  const stats: ItemStat[] = [
    { label: 'Type', value: item.type.charAt(0).toUpperCase() + item.type.slice(1) },
    { label: 'TP', value: display.totalTP || 0 },
    { label: 'Cost', value: `${display.currencyCost || 0}c` },
  ];

  return {
    id: item.docId,
    name: item.name,
    description: item.description,
    category: 'item',
    type: item.type,
    stats,
    details: [],
    badges: [
      { label: display.rarity || 'Common', variant: 'default' },
    ],
    sourceData: {
      id: item.docId,
      name: item.name,
      type: item.type || 'equipment',
      tp: display.totalTP || 0,
      currency: display.currencyCost || 0,
      rarity: display.rarity || 'Common',
    } as unknown as Record<string, unknown>,
  };
}

export function displayItemToCreatureArmament(item: DisplayItem): CreatureArmament {
  return item.sourceData as unknown as CreatureArmament;
}

// =============================================================================
// Creature Display Transformers (for displaying existing creature items)
// =============================================================================

export function creaturePowerToDisplayItem(power: CreaturePower): DisplayItem {
  return {
    id: power.id,
    name: power.name,
    category: 'power',
    stats: [
      { label: 'EN', value: power.energy },
      { label: 'Action', value: power.action },
      { label: 'Range', value: power.range },
    ],
    details: [
      { label: 'Duration', value: power.duration },
      { label: 'Area', value: power.area },
      ...(power.damage ? [{ label: 'Damage', value: power.damage }] : []),
    ],
    badges: [],
    sourceData: power as unknown as Record<string, unknown>,
  };
}

export function creatureTechniqueToDisplayItem(technique: CreatureTechnique): DisplayItem {
  return {
    id: technique.id,
    name: technique.name,
    category: 'technique',
    stats: [
      { label: 'EN', value: technique.energy },
      { label: 'TP', value: technique.tp },
      { label: 'Action', value: technique.action },
      ...(technique.weapon ? [{ label: 'Weapon', value: technique.weapon }] : []),
    ],
    details: [
      ...(technique.damage ? [{ label: 'Damage', value: technique.damage }] : []),
    ],
    badges: [],
    sourceData: technique as unknown as Record<string, unknown>,
  };
}

export function creatureFeatToDisplayItem(feat: CreatureFeat): DisplayItem {
  return {
    id: feat.id,
    name: feat.name,
    description: feat.description,
    category: 'feat',
    cost: feat.points ?? 1,
    costLabel: (feat.points ?? 1) === 1 ? 'pt' : 'pts',
    stats: [],
    details: [],
    badges: [],
    sourceData: feat as unknown as Record<string, unknown>,
  };
}

export function creatureArmamentToDisplayItem(armament: CreatureArmament): DisplayItem {
  return {
    id: armament.id,
    name: armament.name,
    category: 'item',
    type: armament.type,
    stats: [
      { label: 'Type', value: armament.type.charAt(0).toUpperCase() + armament.type.slice(1) },
      { label: 'TP', value: armament.tp },
      { label: 'Cost', value: `${armament.currency}c` },
    ],
    details: [],
    badges: [
      { label: armament.rarity, variant: 'default' },
    ],
    sourceData: armament as unknown as Record<string, unknown>,
  };
}
