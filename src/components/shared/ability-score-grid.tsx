/**
 * AbilityScoreGrid — unified six-ability tile row (character sheet layout).
 * Display mode: name + score (no roll buttons). Edit mode: +/- steppers.
 */

'use client';

import { cn, formatBonus } from '@/lib/utils';
import { DecrementButton, IncrementButton } from '@/components/shared/value-stepper';
import type { Abilities, AbilityName } from '@/types';

export const ABILITY_DISPLAY_ORDER: AbilityName[] = [
  'strength',
  'vitality',
  'agility',
  'acuity',
  'intelligence',
  'charisma',
];

export const ABILITY_DISPLAY_INFO: Record<
  AbilityName,
  { name: string; shortName: string }
> = {
  strength: { name: 'Strength', shortName: 'STR' },
  vitality: { name: 'Vitality', shortName: 'VIT' },
  agility: { name: 'Agility', shortName: 'AGI' },
  acuity: { name: 'Acuity', shortName: 'ACU' },
  intelligence: { name: 'Intelligence', shortName: 'INT' },
  charisma: { name: 'Charisma', shortName: 'CHA' },
};

export interface AbilityScoreGridProps {
  abilities: Abilities;
  powerAbility?: AbilityName;
  martialAbility?: AbilityName;
  mode?: 'display' | 'edit';
  onAbilityChange?: (ability: AbilityName, value: number) => void;
  canIncrease?: (ability: AbilityName) => boolean;
  canDecrease?: (ability: AbilityName) => boolean;
  /** Show "Next: N Points" under a tile when the next increase costs > 1. */
  getIncreaseCost?: (ability: AbilityName) => number;
  className?: string;
}

type PathAbilityRole = 'power' | 'martial';

function normalizeAbilityKey(value?: AbilityName | null): string | null {
  return value ? value.toLowerCase() : null;
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
  martialAbility?: AbilityName
): PathAbilityRole | null {
  const key = ability.toLowerCase();
  const pow = normalizeAbilityKey(powerAbility);
  const mart = normalizeAbilityKey(martialAbility);
  if (pow && key === pow) return 'power';
  if (mart && key === mart) return 'martial';
  return null;
}

function abilityBorderClass(role: PathAbilityRole | null): string {
  if (role === 'power') return 'border-power dark:border-power-border';
  if (role === 'martial') return 'border-martial dark:border-martial-border';
  return 'border-border-light';
}

function abilityGradientClass(role: PathAbilityRole | null): string {
  if (role === 'power') {
    return 'from-power-light via-power-light/60 to-surface-alt dark:from-power-light/35 dark:via-power-light/20 dark:to-surface-alt';
  }
  if (role === 'martial') {
    return 'from-martial-light via-martial-light/60 to-surface-alt dark:from-martial-light/35 dark:via-martial-light/20 dark:to-surface-alt';
  }
  return 'from-surface to-surface-alt';
}

function pathRoleLabel(role: PathAbilityRole): string {
  return role === 'power' ? 'Power' : 'Martial';
}

function pathAbilityLabel(role: PathAbilityRole, hybrid: boolean): string {
  return hybrid ? pathRoleLabel(role) : 'Archetype Ability';
}

function PathAbilityLabel({ role, hybrid }: { role: PathAbilityRole; hybrid: boolean }) {
  return (
    <span
      className={cn(
        'pointer-events-none absolute left-1/2 top-0 z-10 max-w-[calc(100%+0.5rem)] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-pill border px-2 py-px text-[9px] font-semibold uppercase tracking-wide leading-tight font-nunito shadow-sm',
        role === 'power' &&
          'border-power bg-power-light text-power-dark dark:border-power-border dark:bg-power-light/40 dark:text-power-300',
        role === 'martial' &&
          'border-martial bg-martial-light text-martial-dark dark:border-martial-border dark:bg-martial-light/40 dark:text-martial-300'
      )}
    >
      {pathAbilityLabel(role, hybrid)}
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
  mode = 'display',
  onAbilityChange,
  canIncrease,
  canDecrease,
  getIncreaseCost,
  className,
}: AbilityScoreGridProps) {
  const isEdit = mode === 'edit';
  const hybrid = isHybridPath(powerAbility, martialAbility);

  return (
    <div className={cn('grid grid-cols-3 sm:grid-cols-6 gap-3 pt-3 md:gap-4', className)}>
      {ABILITY_DISPLAY_ORDER.map((ability) => {
        const value = abilities[ability] ?? 0;
        const info = ABILITY_DISPLAY_INFO[ability];
        const highlight = getPathAbilityHighlight(ability, powerAbility, martialAbility);
        const canInc = isEdit ? (canIncrease?.(ability) ?? false) : false;
        const canDec = isEdit ? (canDecrease?.(ability) ?? false) : false;
        const increaseCost = getIncreaseCost?.(ability) ?? 1;

        return (
          <div key={ability} className="relative">
            {highlight ? <PathAbilityLabel role={highlight} hybrid={hybrid} /> : null}
            <div
              className={cn(
                'flex h-full flex-col items-center rounded-xl border-2 bg-gradient-to-b px-2 py-2 transition-all',
                abilityGradientClass(highlight),
                abilityBorderClass(highlight),
                !isEdit && 'hover:shadow-md'
              )}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted dark:text-text-secondary">
                {info.name}
              </span>

              <div className="mt-1 flex min-h-[2.25rem] items-center justify-center">
                {isEdit ? (
                  <div className="flex items-center gap-1">
                    <DecrementButton
                      onClick={() => onAbilityChange?.(ability, value - 1)}
                      disabled={!canDec}
                      size="sm"
                    />
                    <span
                      className={cn(
                        'min-w-[2.75rem] text-center text-2xl font-bold',
                        abilityValueClass(value)
                      )}
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
                ) : (
                  <span
                    className={cn(
                      'min-w-[2.75rem] text-center text-2xl font-bold',
                      abilityValueClass(value)
                    )}
                  >
                    {formatBonus(value)}
                  </span>
                )}
              </div>

              {isEdit && getIncreaseCost ? (
                <span
                  className={cn(
                    'mt-0.5 h-3.5 text-[10px] font-medium leading-none',
                    increaseCost > 1 && canInc ? 'text-warning-fg' : 'invisible'
                  )}
                >
                  Next: {increaseCost} Points
                </span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
