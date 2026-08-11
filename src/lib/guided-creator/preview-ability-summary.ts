/**
 * Guided character preview — ability chip summary (TASK-686, TASK-694).
 * Shows all six abilities in canonical order with signed values (+N / 0 / −N).
 */

import type { DescriptorChipVariant } from '@/lib/chip/descriptor-chip-variants';
import type { Abilities, AbilityName, ArchetypeCategory } from '@/types';
import { cn } from '@/lib/utils';

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

export type PreviewAbilityHighlight = 'power' | 'martial' | null;

export interface PreviewArchetypeAbilityContext {
  draftPowAbil?: AbilityName | null;
  draftMartAbil?: AbilityName | null;
  archetypePowAbil?: AbilityName | null;
  archetypeMartAbil?: AbilityName | null;
  archetypePrimary?: AbilityName | null;
  archetypeType?: ArchetypeCategory | null;
}

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
  highlight: PreviewAbilityHighlight;
  chipVariant: DescriptorChipVariant;
}

/** Show ability chips only after the player selects abilities or completes the Abilities step. */
export function shouldShowPreviewAbilityChips(args: {
  abilitiesMode: 'recommended' | 'custom' | null;
  abilitiesStepCompleted: boolean;
}): boolean {
  return args.abilitiesStepCompleted || args.abilitiesMode !== null;
}

/** Resolve pow/mart archetype abilities from draft with codex path fallbacks. */
export function resolvePreviewArchetypeAbilities(
  context: PreviewArchetypeAbilityContext
): { powAbil: AbilityName | null; martAbil: AbilityName | null } {
  let powAbil = context.draftPowAbil ?? context.archetypePowAbil ?? null;
  let martAbil = context.draftMartAbil ?? context.archetypeMartAbil ?? null;

  if (!powAbil && !martAbil && context.archetypePrimary) {
    if (context.archetypeType === 'martial') {
      martAbil = context.archetypePrimary;
    } else if (context.archetypeType === 'power' || context.archetypeType === 'powered-martial') {
      powAbil = context.archetypePrimary;
    }
  }

  return { powAbil, martAbil };
}

function resolvePreviewAbilityHighlight(
  ability: AbilityName,
  powAbil: AbilityName | null,
  martAbil: AbilityName | null
): PreviewAbilityHighlight {
  if (powAbil && ability === powAbil) return 'power';
  if (martAbil && ability === martAbil) return 'martial';
  return null;
}

function previewAbilityChipVariant(highlight: PreviewAbilityHighlight): DescriptorChipVariant {
  if (highlight === 'power') return 'power';
  if (highlight === 'martial') return 'technique';
  return 'descriptor';
}

/** Panel tile border/bg classes aligned with AbilityScoreGrid path highlights. */
export function previewAbilityTileClass(highlight: PreviewAbilityHighlight): string {
  return cn(
    'rounded-card px-2.5 py-1.5 border',
    highlight === 'power' &&
      'border-power dark:border-power-border bg-power-light/40 dark:bg-power-light/20',
    highlight === 'martial' &&
      'border-martial dark:border-martial-border bg-martial-light/40 dark:bg-martial-light/20',
    !highlight && 'bg-surface border-border-light dark:border-border'
  );
}

/** All six abilities in STR→CHA order for strip + panel. */
export function buildPreviewAbilityChips(
  abilities: Partial<Abilities> | null | undefined,
  archetypeContext?: PreviewArchetypeAbilityContext
): PreviewAbilityChip[] {
  const { powAbil, martAbil } = resolvePreviewArchetypeAbilities(archetypeContext ?? {});

  return PREVIEW_ABILITY_ORDER.map((ability) => {
    const value = Number(abilities?.[ability] ?? 0) || 0;
    const highlight = resolvePreviewAbilityHighlight(ability, powAbil, martAbil);
    return {
      ability,
      abbr: PREVIEW_ABILITY_ABBR[ability],
      value,
      display: formatPreviewAbilityValue(value),
      highlight,
      chipVariant: previewAbilityChipVariant(highlight),
    };
  });
}
