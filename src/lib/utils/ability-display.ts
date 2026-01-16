/**
 * Ability Display Utilities
 * =========================
 * Helper functions to transform power/technique/armament data into
 * the unified AbilityCard format.
 */

import type { PartChip, AbilityStat } from '@/components/shared/ability-card';
import type { PartChipData, PowerDisplayData } from '@/lib/calculators/power-calc';
import type { TechniqueDisplayData, TechniqueChipData } from '@/lib/calculators/technique-calc';

// =============================================================================
// Power Transformation
// =============================================================================

export interface PowerCardData {
  id: string;
  name: string;
  description: string;
  stats: AbilityStat[];
  parts: PartChip[];
  totalTP: number;
  damage: string;
}

/**
 * Transform power display data to AbilityCard format
 */
export function transformPowerToCardData(
  id: string,
  display: PowerDisplayData,
  damageStr?: string
): PowerCardData {
  const stats: AbilityStat[] = [
    { label: 'Energy', value: display.energy, highlight: true },
    { label: 'Action', value: display.actionType },
    { label: 'Duration', value: display.duration },
    { label: 'Range', value: display.range },
    { label: 'Area', value: display.area },
  ];

  const parts = transformPartChips(display.partChips);

  return {
    id,
    name: display.name,
    description: display.description,
    stats,
    parts,
    totalTP: display.tp,
    damage: damageStr || '',
  };
}

// =============================================================================
// Technique Transformation
// =============================================================================

export interface TechniqueCardData {
  id: string;
  name: string;
  description: string;
  stats: AbilityStat[];
  parts: PartChip[];
  totalTP: number;
  damage: string;
}

/**
 * Transform technique display data to AbilityCard format
 */
export function transformTechniqueToCardData(
  id: string,
  display: TechniqueDisplayData
): TechniqueCardData {
  const stats: AbilityStat[] = [
    { label: 'Energy', value: display.energy, highlight: true },
    { label: 'TP', value: display.tp },
    { label: 'Action', value: display.actionType },
    { label: 'Weapon', value: display.weaponName },
  ];

  const parts = transformTechniqueChips(display.partChips);

  return {
    id,
    name: display.name,
    description: display.description,
    stats,
    parts,
    totalTP: display.tp,
    damage: display.damageStr,
  };
}

// =============================================================================
// Armament Transformation
// =============================================================================

export interface ArmamentProperty {
  id?: number | string;
  name: string;
  description?: string;
  tpCost?: number;
  optionLevels?: {
    opt1?: number;
    opt2?: number;
    opt3?: number;
  };
}

export interface ArmamentCardData {
  id: string;
  name: string;
  description: string;
  stats: AbilityStat[];
  parts: PartChip[];
  totalTP: number;
  damage: string;
}

/**
 * Transform armament data to AbilityCard format
 */
export function transformArmamentToCardData(
  id: string,
  name: string,
  description: string,
  properties: ArmamentProperty[],
  stats: { damage?: string; defense?: number; type: string },
  totalTP: number = 0
): ArmamentCardData {
  const statList: AbilityStat[] = [];
  
  if (stats.damage) {
    statList.push({ label: 'Damage', value: stats.damage, highlight: true });
  }
  if (stats.defense !== undefined) {
    statList.push({ label: 'Defense', value: `+${stats.defense}` });
  }
  statList.push({ label: 'Type', value: stats.type });

  const parts: PartChip[] = properties.map(prop => ({
    name: prop.name,
    text: prop.name,
    description: prop.description || '',
    tpCost: prop.tpCost || 0,
    optionLevels: prop.optionLevels,
  }));

  return {
    id,
    name,
    description,
    stats: statList,
    parts,
    totalTP,
    damage: stats.damage || '',
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Transform PartChipData array to PartChip array
 */
function transformPartChips(chips: PartChipData[]): PartChip[] {
  return chips.map(chip => {
    // Parse the text to extract name and option levels
    // Format: "Part Name (Opt1 3) (Opt2 1) | TP: 2"
    const baseText = chip.text.split(' | TP:')[0].trim();
    
    // Extract option levels from text
    const opt1Match = baseText.match(/\(Opt1 (\d+)\)/);
    const opt2Match = baseText.match(/\(Opt2 (\d+)\)/);
    const opt3Match = baseText.match(/\(Opt3 (\d+)\)/);
    
    // Get clean name without option suffixes
    const name = baseText
      .replace(/\s*\(Opt\d+ \d+\)/g, '')
      .trim();

    return {
      name,
      text: chip.text,
      description: chip.description,
      tpCost: chip.finalTP,
      optionLevels: {
        opt1: opt1Match ? parseInt(opt1Match[1]) : undefined,
        opt2: opt2Match ? parseInt(opt2Match[1]) : undefined,
        opt3: opt3Match ? parseInt(opt3Match[1]) : undefined,
      },
    };
  });
}

/**
 * Transform TechniqueChipData array to PartChip array
 */
function transformTechniqueChips(chips: TechniqueChipData[]): PartChip[] {
  return chips.map(chip => {
    const baseText = chip.text.split(' | TP:')[0].trim();
    const opt1Match = baseText.match(/\(Opt1 (\d+)\)/);
    const opt2Match = baseText.match(/\(Opt2 (\d+)\)/);
    const opt3Match = baseText.match(/\(Opt3 (\d+)\)/);
    const name = baseText.replace(/\s*\(Opt\d+ \d+\)/g, '').trim();

    return {
      name,
      text: chip.text,
      description: chip.description,
      tpCost: chip.finalTP,
      optionLevels: {
        opt1: opt1Match ? parseInt(opt1Match[1]) : undefined,
        opt2: opt2Match ? parseInt(opt2Match[1]) : undefined,
        opt3: opt3Match ? parseInt(opt3Match[1]) : undefined,
      },
    };
  });
}
