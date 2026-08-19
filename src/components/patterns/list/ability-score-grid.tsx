/**
 * AbilityScoreGrid — unified six-ability tile row (character sheet layout).
 * Display mode: name + score (no roll buttons). Edit mode: +/- steppers.
 * Mobile display: full ability names in a 2-col grid (avoids STR/ACU + tall skinny tiles);
 * edit uses a roomier grid so 44px steppers are not forced into narrow phone tiles.
 */

'use client';

import { cn, formatBonus } from '@/lib/utils';
import { DecrementButton, IncrementButton } from '@/components/patterns/select/value-stepper';
import { WordHelpTip } from '@/components/patterns/help/info-tippy';
import { getAbilityHelp } from '../../../../public/tooltip-text';
import type { Abilities, AbilityName } from '@/types';

export const ABILITY_DISPLAY_ORDER: AbilityName[] = [
  'strength',
  'vitality',
  'agility',
  'acuity',
  'intelligence',
  'charisma',
];

/** Display names for the six abilities. `shortName` kept on the exported shape for callers that want abbr; the grid always shows `name` (TASK-566). */
export const ABILITY_DISPLAY_INFO: Record<AbilityName, { name: string; shortName: string }> = {
  strength: { name: 'Strength', shortName: 'STR' },
  vitality: { name: 'Vitality', shortName: 'VIT' },
  agility: { name: 'Agility', shortName: 'AGI' },
  acuity: { name: 'Acuity', shortName: 'ACU' },
  intelligence: { name: 'Intelligence', shortName: 'INT' },
  charisma: { name: 'Charisma', shortName: 'CHA' },
};

export interface AbilityScoreGridProps {
  abilities: Abilities;
  powerAbility?: AbilityName | undefined;
  martialAbility?: AbilityName | undefined;
  /** Path Secondary Ability — UI label for optional recommended ability (pill when distinct from power/martial Archetype Abilities). */
  secondaryAbility?: AbilityName | undefined;
  mode?: 'display' | 'edit' | undefined;
  onAbilityChange?: ((ability: AbilityName, value: number) => void) | undefined;
  canIncrease?: ((ability: AbilityName) => boolean) | undefined;
  canDecrease?: ((ability: AbilityName) => boolean) | undefined;
  /** Show "Next: N Points" under a tile when the next increase costs > 1. */
  getIncreaseCost?: ((ability: AbilityName) => number) | undefined;
  /**
   * Compact tiles for read-only overviews (e.g. Path More details recommended abilities).
   * Edit mode ignores compact (steppers need default space).
   */
  density?: 'default' | 'compact' | undefined;
  /** When set, only render these abilities (order follows ABILITY_DISPLAY_ORDER). */
  onlyAbilities?: AbilityName[] | undefined;
  className?: string | undefined;
}

type PathAbilityRole = 'power' | 'martial' | 'secondary';

function normalizeAbilityKey(value?: AbilityName | null): string | null {
  return value ? value.toLowerCase() : null;
}

/**
 * Secondary Ability for grid pills when distinct from power/martial Primary tiles.
 * Shared by abilities step + reveal (and any other AbilityScoreGrid call sites).
 */
export function resolveDistinctSecondaryAbility(
  secondaryAbility?: AbilityName | null,
  powerAbility?: AbilityName | null,
  martialAbility?: AbilityName | null,
): AbilityName | undefined {
  if (!secondaryAbility) return undefined;
  const key = normalizeAbilityKey(secondaryAbility);
  if (!key) return undefined;
  if (normalizeAbilityKey(powerAbility) === key) return undefined;
  if (normalizeAbilityKey(martialAbility) === key) return undefined;
  return secondaryAbility;
}

function isHybridPath(powerAbility?: AbilityName, martialAbility?: AbilityName): boolean {
  const pow = normalizeAbilityKey(powerAbility);
  const mart = normalizeAbilityKey(martialAbility);
  return Boolean(pow && mart && pow !== mart);
}

/** Tint key abilities on the grid; hybrid paths get both sides when distinct. */
function getPathAbilityHighlight(
  ability: AbilityName,
  powerAbility?: AbilityName,
  martialAbility?: AbilityName,
  secondaryAbility?: AbilityName,
): PathAbilityRole | null {
  const key = ability.toLowerCase();
  const pow = normalizeAbilityKey(powerAbility);
  const mart = normalizeAbilityKey(martialAbility);
  const secondary = normalizeAbilityKey(secondaryAbility);
  if (pow && key === pow) return 'power';
  if (mart && key === mart) return 'martial';
  // Secondary only when it is not already the power/martial Primary Ability.
  if (secondary && key === secondary && secondary !== pow && secondary !== mart) {
    return 'secondary';
  }
  return null;
}

function abilityBorderClass(role: PathAbilityRole | null): string {
  if (role === 'power') return 'border-power dark:border-power-border';
  if (role === 'martial') return 'border-martial dark:border-martial-border';
  if (role === 'secondary') return 'border-primary-subtle-border';
  return 'border-border-light';
}

function abilityGradientClass(role: PathAbilityRole | null): string {
  if (role === 'power') {
    return 'from-power-light via-power-light/60 to-surface-alt dark:from-power-light/35 dark:via-power-light/20 dark:to-surface-alt';
  }
  if (role === 'martial') {
    return 'from-martial-light via-martial-light/60 to-surface-alt dark:from-martial-light/35 dark:via-martial-light/20 dark:to-surface-alt';
  }
  if (role === 'secondary') {
    return 'from-primary-subtle-bg via-primary-subtle-bg/60 to-surface-alt dark:from-primary-900/25 dark:via-primary-900/15 dark:to-surface-alt';
  }
  return 'from-surface to-surface-alt';
}

/**
 * Visible pill copy — keep single-line and short on narrow tiles so wrapping cannot
 * grow the straddling pill into the ability name. Full terms stay on aria-label/title.
 * Guided UX: Primary / Secondary for path archetype vs recommended secondary.
 * Hybrid grid keeps Power / Martial (both are Archetype Abilities — not Primary/Secondary).
 */
function pathAbilityVisibleLabel(role: PathAbilityRole, hybrid: boolean): string {
  if (role === 'secondary') return 'Secondary';
  if (role === 'power') return hybrid ? 'Power' : 'Primary';
  if (role === 'martial') return hybrid ? 'Martial' : 'Primary';
  return 'Primary';
}

/** Full term for screen readers / hover. */
function pathAbilityAccessibleName(role: PathAbilityRole, hybrid: boolean): string {
  if (role === 'secondary') return 'Secondary Ability';
  if (role === 'power') return hybrid ? 'Archetype Power Ability' : 'Primary Ability';
  if (role === 'martial') return hybrid ? 'Archetype Martial Ability' : 'Primary Ability';
  return 'Primary Ability';
}

function PathAbilityLabel({ role, hybrid }: { role: PathAbilityRole; hybrid: boolean }) {
  const accessible = pathAbilityAccessibleName(role, hybrid);
  return (
    <span
      aria-label={accessible}
      title={accessible}
      className={cn(
        'pointer-events-none absolute top-0 left-1/2 z-10 max-w-[calc(100%-0.25rem)] -translate-x-1/2 -translate-y-1/2',
        'truncate rounded-pill border px-1.5 py-0.5 text-center text-[8px] leading-none font-semibold tracking-wide whitespace-nowrap uppercase',
        'font-nunito shadow-sm sm:px-2 sm:text-[9px]',
        role === 'power' && 'border-power-border bg-power-light text-power-fg',
        role === 'martial' && 'border-martial-border bg-martial-light text-martial-fg',
        role === 'secondary' &&
          'border-primary-subtle-border bg-primary-subtle-bg text-primary-subtle-fg dark:bg-primary-900/40',
      )}
    >
      {pathAbilityVisibleLabel(role, hybrid)}
    </span>
  );
}

function abilityValueClass(value: number): string {
  if (value > 0) return 'text-success-fg';
  if (value < 0) return 'text-danger-fg';
  return 'text-text-secondary';
}

export function AbilityScoreGrid({
  abilities,
  powerAbility,
  martialAbility,
  secondaryAbility,
  mode = 'display',
  onAbilityChange,
  canIncrease,
  canDecrease,
  getIncreaseCost,
  density = 'default',
  onlyAbilities,
  className,
}: AbilityScoreGridProps) {
  const isEdit = mode === 'edit';
  const isCompact = density === 'compact' && !isEdit;
  const hybrid = isHybridPath(powerAbility, martialAbility);
  const abilityOrder = onlyAbilities?.length
    ? ABILITY_DISPLAY_ORDER.filter((ability) => onlyAbilities.includes(ability))
    : ABILITY_DISPLAY_ORDER;

  return (
    <div
      className={cn(
        // Only the pill's outer half needs grid clearance; each tile reserves its inner half below.
        'grid',
        isCompact ? 'gap-2 pt-2' : 'gap-2 pt-2 sm:gap-3 md:gap-4',
        // Display: 2-col phone (full names, less elongated), 3-col tablet, 6-col desktop.
        // Edit: wider cells so 44px steppers fit.
        // Compact + filtered: denser auto columns for overview subsets (Path More details).
        isEdit
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
          : isCompact && onlyAbilities?.length
            ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
            : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
        className,
      )}
    >
      {abilityOrder.map((ability) => {
        const value = abilities[ability] ?? 0;
        const info = ABILITY_DISPLAY_INFO[ability];
        const highlight = getPathAbilityHighlight(
          ability,
          powerAbility,
          martialAbility,
          secondaryAbility,
        );
        const canInc = isEdit ? (canIncrease?.(ability) ?? false) : false;
        const canDec = isEdit ? (canDecrease?.(ability) ?? false) : false;
        const increaseCost = getIncreaseCost?.(ability) ?? 1;

        return (
          <div key={ability} className="relative min-w-0">
            {highlight ? <PathAbilityLabel role={highlight} hybrid={hybrid} /> : null}
            <div
              className={cn(
                'flex h-full rounded-xl border-2 bg-gradient-to-b transition-all',
                abilityGradientClass(highlight),
                abilityBorderClass(highlight),
                !isEdit && 'hover:shadow-md',
                isEdit
                  ? 'flex-row items-center justify-between gap-2 px-3 py-2 sm:flex-col sm:justify-center sm:px-2 sm:py-2'
                  : isCompact
                    ? 'flex-col items-center justify-center px-1 py-1 sm:px-1.5 sm:py-1.5'
                    : 'flex-col items-center justify-center px-1.5 py-1.5 sm:px-2 sm:py-2',
                // Reserve the pill's inner half on every tile so highlighted content stays aligned.
                // Keep after py-* so twMerge preserves the top clearance (including sm:py-2).
                isCompact ? 'pt-2.5 sm:pt-2.5' : 'pt-3 sm:pt-3',
              )}
            >
              {/* Name is WordHelpTip (focusable); score carries ability context — no tile aria-label. */}
              <WordHelpTip
                content={getAbilityHelp(ability)}
                label={`About ${info.name}`}
                className={cn(
                  'font-bold text-text-muted uppercase',
                  isEdit
                    ? 'text-xs tracking-wide sm:text-[11px] sm:tracking-wider'
                    : // Full-width label; keep WordHelpTip default 44px touch target (MOBILE_UX).
                      cn(
                        'w-full min-w-0 justify-center px-0.5 text-center leading-tight tracking-wide',
                        isCompact
                          ? 'text-[9px] sm:text-[10px]'
                          : 'text-[10px] sm:text-[11px] sm:tracking-wider',
                      ),
                )}
              >
                {info.name}
              </WordHelpTip>

              <div
                className={cn(
                  'flex items-center justify-center',
                  isEdit ? 'min-h-11 shrink-0' : 'mt-0.5',
                )}
              >
                {isEdit ? (
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="flex items-center gap-1">
                      <DecrementButton
                        onClick={() => onAbilityChange?.(ability, value - 1)}
                        disabled={!canDec}
                        size="sm"
                      />
                      <span
                        className={cn(
                          'min-w-[2.75rem] text-center text-2xl font-bold',
                          abilityValueClass(value),
                        )}
                        aria-label={`${info.name} ${formatBonus(value)}`}
                      >
                        {formatBonus(value)}
                      </span>
                      <IncrementButton
                        onClick={() => onAbilityChange?.(ability, value + 1)}
                        disabled={!canInc}
                        size="sm"
                        title={
                          canInc && increaseCost > 1
                            ? `Cost: ${increaseCost} point${increaseCost > 1 ? 's' : ''}`
                            : undefined
                        }
                      />
                    </div>
                    {getIncreaseCost ? (
                      <span
                        className={cn(
                          'h-3.5 text-[10px] leading-none font-medium',
                          increaseCost > 1 && canInc ? 'text-warning-fg' : 'invisible',
                        )}
                      >
                        Next: {increaseCost} Points
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <span
                    className={cn(
                      'min-w-[2.5rem] text-center font-bold',
                      isCompact
                        ? 'text-lg sm:min-w-[2.5rem] sm:text-xl'
                        : 'text-xl sm:min-w-[2.75rem] sm:text-2xl',
                      abilityValueClass(value),
                    )}
                    aria-label={`${info.name} ${formatBonus(value)}`}
                  >
                    {formatBonus(value)}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
