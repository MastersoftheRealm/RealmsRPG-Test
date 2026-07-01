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

type PathAbilityRole = 'primary' | 'power' | 'martial';

function normalizeAbilityKey(value?: AbilityName | null): string | null {
  return value ? value.toLowerCase() : null;
}

/** Label path key abilities: Power + Martial when both differ; otherwise Primary. */
function getPathAbilityRole(
  ability: AbilityName,
  powerAbility?: AbilityName,
  martialAbility?: AbilityName
): PathAbilityRole | null {
  const key = ability.toLowerCase();
  const pow = normalizeAbilityKey(powerAbility);
  const mart = normalizeAbilityKey(martialAbility);
  const hasPow = Boolean(pow);
  const hasMart = Boolean(mart && mart !== pow);

  if (hasPow && hasMart) {
    if (key === pow) return 'power';
    if (key === mart) return 'martial';
    return null;
  }

  if (hasPow && key === pow) return 'primary';
  if (hasMart && key === mart) return 'primary';
  return null;
}

function pathRoleLabel(role: PathAbilityRole): string {
  if (role === 'power') return 'Power';
  if (role === 'martial') return 'Martial';
  return 'Primary';
}

function abilityBorderClass(role: PathAbilityRole | null): string {
  if (role === 'power') return 'border-power-border';
  if (role === 'martial') return 'border-martial-border';
  if (role === 'primary') return 'border-primary-subtle-border';
  return 'border-border-light';
}

function abilityGradientClass(role: PathAbilityRole | null): string {
  if (role === 'power') return 'from-power-light/50 to-surface-alt';
  if (role === 'martial') return 'from-martial-light/50 to-surface-alt';
  if (role === 'primary') return 'from-primary-subtle-bg/60 to-surface-alt';
  return 'from-surface to-surface-alt';
}

function PathAbilityBadge({ role }: { role: PathAbilityRole }) {
  return (
    <span
      className={cn(
        'rounded-pill border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide leading-none font-nunito',
        role === 'power' &&
          'border-power-border bg-power-light/70 text-power-dark dark:bg-power-light/20 dark:text-power-300',
        role === 'martial' &&
          'border-martial-border bg-martial-light/70 text-martial-dark dark:bg-martial-light/20 dark:text-martial-300',
        role === 'primary' &&
          'border-primary-subtle-border bg-primary-subtle-bg text-primary-subtle-fg'
      )}
    >
      {pathRoleLabel(role)}
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

  return (
    <div className={cn('grid grid-cols-3 sm:grid-cols-6 gap-3 md:gap-4', className)}>
      {ABILITY_DISPLAY_ORDER.map((ability) => {
        const value = abilities[ability] ?? 0;
        const info = ABILITY_DISPLAY_INFO[ability];
        const pathRole = getPathAbilityRole(ability, powerAbility, martialAbility);
        const canInc = isEdit ? (canIncrease?.(ability) ?? false) : false;
        const canDec = isEdit ? (canDecrease?.(ability) ?? false) : false;
        const increaseCost = getIncreaseCost?.(ability) ?? 1;

        return (
          <div
            key={ability}
            className={cn(
              'flex flex-col items-center p-3 bg-gradient-to-b rounded-xl border-2 transition-all',
              abilityGradientClass(pathRole),
              abilityBorderClass(pathRole),
              !isEdit && 'hover:shadow-md'
            )}
          >
            <span className="text-xs font-bold text-text-muted dark:text-text-secondary uppercase tracking-wider mb-1 text-center">
              {info.name}
            </span>
            <div className="mb-1.5 flex min-h-[1.125rem] items-center justify-center">
              {pathRole ? <PathAbilityBadge role={pathRole} /> : null}
            </div>

            {isEdit ? (
              <div className="flex items-center gap-1">
                <DecrementButton
                  onClick={() => onAbilityChange?.(ability, value - 1)}
                  disabled={!canDec}
                  size="sm"
                />
                <span
                  className={cn(
                    'text-2xl font-bold min-w-[56px] text-center',
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
                  'text-2xl font-bold min-w-[56px] text-center',
                  abilityValueClass(value)
                )}
              >
                {formatBonus(value)}
              </span>
            )}

            {isEdit && getIncreaseCost && (
              <span
                className={cn(
                  'text-[10px] font-medium mt-1',
                  increaseCost > 1 && canInc ? 'text-warning-fg' : 'invisible'
                )}
              >
                Next: {increaseCost} Points
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
