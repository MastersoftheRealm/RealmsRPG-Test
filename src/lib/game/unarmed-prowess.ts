/**
 * Unarmed Prowess levels and Training Point cost (GAME_RULES).
 * Used by sheet / library TP remaining; not creator-UI-specific.
 */

export const UNARMED_PROWESS_BASE_TP = 10;
export const UNARMED_PROWESS_UPGRADE_TP = 6;

const UNARMED_PROWESS_LEVELS = [
  {
    level: 1,
    charLevel: 1,
    name: 'Unarmed Prowess',
    description:
      'Your unarmed strikes deal damage equal to your Attack Bonus (Ability + Martial Proficiency). Use Strength or Agility (whichever is higher) for attack and damage.',
  },
  {
    level: 2,
    charLevel: 4,
    name: 'Unarmed Prowess II',
    description:
      'Your unarmed damage increases to 1d2 + Attack Bonus (Ability + Martial Proficiency).',
  },
  {
    level: 3,
    charLevel: 8,
    name: 'Unarmed Prowess III',
    description:
      'Your unarmed damage increases to 1d4 + Attack Bonus (Ability + Martial Proficiency).',
  },
  {
    level: 4,
    charLevel: 12,
    name: 'Unarmed Prowess IV',
    description:
      'Your unarmed damage increases to 1d6 + Attack Bonus (Ability + Martial Proficiency).',
  },
  {
    level: 5,
    charLevel: 16,
    name: 'Unarmed Prowess V',
    description:
      'Your unarmed damage increases to 1d8 + Attack Bonus (Ability + Martial Proficiency).',
  },
] as const;

export type UnarmedProwessLevel = (typeof UNARMED_PROWESS_LEVELS)[number];

export function computeUnarmedProwessTpCost(level: number): number {
  if (level <= 0) return 0;
  return UNARMED_PROWESS_BASE_TP + (level - 1) * UNARMED_PROWESS_UPGRADE_TP;
}

export function availableUnarmedProwessLevels(charLevel = 1): UnarmedProwessLevel[] {
  return UNARMED_PROWESS_LEVELS.filter((up) => up.charLevel <= charLevel);
}
