/**
 * Character Sheet - Utility Functions
 */

import type { Character, DefenseSkills, Item } from '@/types';
import type { AbilityName } from '@/types';
import { DEFAULT_DEFENSE_SKILLS } from '@/types/skills';

export interface CharacterSheetStats {
  maxHealth: number;
  maxEnergy: number;
  terminal: number;
  speed: number;
  evasion: number;
  armor: number;
  defenseBonuses: Record<string, number>;
  defenseScores: Record<string, number>;
}

export function calculateStats(character: Character): CharacterSheetStats {
  const abilities = character.abilities || {
    strength: 0,
    vitality: 0,
    agility: 0,
    acuity: 0,
    intelligence: 0,
    charisma: 0,
  };

  const defenseVals: DefenseSkills = character.defenseSkills
    ? { ...DEFAULT_DEFENSE_SKILLS, ...character.defenseSkills }
    : DEFAULT_DEFENSE_SKILLS;

  const defenseBonuses = {
    might: (abilities.strength || 0) + (defenseVals.might || 0),
    fortitude: (abilities.vitality || 0) + (defenseVals.fortitude || 0),
    reflex: (abilities.agility || 0) + (defenseVals.reflex || 0),
    discernment: (abilities.acuity || 0) + (defenseVals.discernment || 0),
    mentalFortitude: (abilities.intelligence || 0) + (defenseVals.mentalFortitude || 0),
    resolve: (abilities.charisma || 0) + (defenseVals.resolve || 0),
  };

  const defenseScores = Object.entries(defenseBonuses).reduce(
    (acc, [key, val]) => {
      acc[key] = 10 + val;
      return acc;
    },
    {} as Record<string, number>
  );

  const speedBase = character.speedBase ?? 6;
  const speed = speedBase + Math.ceil((abilities.agility || 0) / 2);

  const evasionBase = character.evasionBase ?? 10;
  const evasion = evasionBase + (abilities.agility || 0);

  const armorItems = (character.equipment?.armor || []) as Item[];
  const armor = armorItems
    .filter(item => item.equipped)
    .reduce((sum, item) => sum + (item.armor || 0), 0);

  const level = character.level || 1;
  const vitality = abilities.vitality || 0;
  const healthPoints = character.healthPoints || 0;
  const maxHealth =
    vitality < 0
      ? 8 + vitality + healthPoints
      : 8 + vitality * level + healthPoints;

  const powerAbil = character.pow_abil?.toLowerCase() as AbilityName | undefined;
  const powerAbilityValue = powerAbil ? abilities[powerAbil] || 0 : 0;
  const energyPoints = character.energyPoints || 0;
  const maxEnergy = powerAbilityValue * level + energyPoints;

  const terminal = Math.ceil(maxHealth / 4);

  return {
    maxHealth,
    maxEnergy,
    terminal,
    speed,
    evasion,
    armor,
    defenseBonuses,
    defenseScores,
  };
}
