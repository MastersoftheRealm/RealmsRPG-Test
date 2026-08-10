/**
 * Guided character preview — ability chip summary (TASK-686).
 * Shows all six abilities in canonical order with signed values (+N / 0 / −N).
 */

import type { Abilities, AbilityName } from '@/types';

export const PREVIEW_ABILITY_ORDER: AbilityName[] = [
  'strength',
  'vitality',
  'agility',
  'acuity',
  'intelligence',
  'charisma',
];

export const PREVIEW_ABILITY_ABBR: Record<AbilityName, string> = {
  strength: 'STR',
  vitality: 'VIT',
  agility: 'AGI',
  acuity: 'ACU',
  intelligence: 'INT',
  charisma: 'CHA',
};

/** Signed ability value for preview chips (+2, 0, −1). Uses Unicode minus. */
export function formatPreviewAbilityValue(value: number): string {
  const n = Number(value) || 0;
  if (n > 0) return `+${n}`;
  if (n < 0) return `−${Math.abs(n)}`;
  return '0';
}

export interface PreviewAbilityChip {
  ability: AbilityName;
  abbr: string;
  value: number;
  display: string;
}

/** All six abilities in STR→CHA order for strip + panel. */
export function buildPreviewAbilityChips(
  abilities: Partial<Abilities> | null | undefined
): PreviewAbilityChip[] {
  return PREVIEW_ABILITY_ORDER.map((ability) => {
    const value = Number(abilities?.[ability] ?? 0) || 0;
    return {
      ability,
      abbr: PREVIEW_ABILITY_ABBR[ability],
      value,
      display: formatPreviewAbilityValue(value),
    };
  });
}
