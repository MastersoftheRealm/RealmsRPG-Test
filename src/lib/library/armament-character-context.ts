/**
 * Character-derived caps for Library armament filters (TASK-680).
 * Armament proficiency matches sheet Inventory summary (martial prof → table).
 */

import type { Abilities, Character } from '@/types';
import type { CoreRulesMap } from '@/types/core-rules';
import { calculateArmamentProficiency } from '@/lib/game/formulas';

export interface ArmamentCharacterContext {
  abilities: Abilities;
  /** Max TP an armament may cost given martial proficiency. */
  armamentMax: number;
  /** Current currency on the character sheet. */
  currency: number;
  /** Character level for GAME_RULES Levels-by-Rarity filters. */
  level: number;
}

type Rules = Partial<CoreRulesMap>;

/**
 * Derive ability scores, armament proficiency max, and currency from a loaded character.
 */
export function deriveArmamentCharacterContext(
  character: Character,
  rules?: Rules,
): ArmamentCharacterContext {
  const abilities: Abilities = {
    strength: character.abilities?.strength ?? 0,
    agility: character.abilities?.agility ?? 0,
    vitality: character.abilities?.vitality ?? 0,
    acuity: character.abilities?.acuity ?? 0,
    intelligence: character.abilities?.intelligence ?? 0,
    charisma: character.abilities?.charisma ?? 0,
  };
  return {
    abilities,
    armamentMax: calculateArmamentProficiency(character.mart_prof || 0, rules),
    currency: Math.max(0, Math.round(Number(character.currency) || 0)),
    level: Math.max(1, Math.floor(Number(character.level) || 1)),
  };
}
