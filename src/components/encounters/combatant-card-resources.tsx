'use client';

import { cn } from '@/lib/utils';
import { ValueStepper } from '@/components/patterns';
import { resourceCurrentValueClass } from '@/lib/character/resource-value-color';
import type { Combatant } from '@/types/encounter';
import { getHealthBarColor } from './combatant-card-helpers';

/**
 * Four digits (`4ch`) plus the native spinner and horizontal padding (`2rem`).
 * A fixed 40px box clips 3-digit values once the desktop spinner is drawn.
 * `shrink-0` keeps a narrow card from squeezing the digits back out of view.
 */
export const COMBATANT_RESOURCE_NUMBER_INPUT_CLASS = 'w-[calc(4ch+2rem)] shrink-0';

export interface CombatantCardResourcesProps {
  combatant: Combatant;
  variant: 'full' | 'compact';
  linkedResourcesReadOnly: boolean;
  linkedResourcesTitle: string;
  /** Player-linked combatants may track Dying (negative HP); NPCs stay floored at 0. */
  allowNegativeHealth?: boolean | undefined;
  onUpdate: (updates: Partial<Combatant>) => void;
}

export function CombatantCardResources({
  combatant,
  variant,
  linkedResourcesReadOnly,
  linkedResourcesTitle,
  allowNegativeHealth = false,
  onUpdate,
}: CombatantCardResourcesProps) {
  const name = combatant.name;
  const healthMin = allowNegativeHealth ? Number.NEGATIVE_INFINITY : 0;
  const clampHealth = (value: number) => Math.max(healthMin, value);
  const healthPercent =
    combatant.maxHealth > 0 ? (combatant.currentHealth / combatant.maxHealth) * 100 : 0;
  const energyPercent =
    combatant.maxEnergy > 0 ? (combatant.currentEnergy / combatant.maxEnergy) * 100 : 0;

  if (variant === 'compact') {
    return (
      <div className="mb-2 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
        <div
          className={cn(
            'flex min-w-0 flex-col rounded-lg border p-2',
            'border-health-border bg-health-light',
          )}
        >
          <span className="mb-0.5 text-[10px] font-semibold tracking-wide text-health-text uppercase">
            Health
          </span>
          <div className="flex min-w-0 flex-wrap items-center gap-1">
            {linkedResourcesReadOnly ? (
              <span className="text-sm font-bold" title={linkedResourcesTitle}>
                <span
                  className={cn(
                    'text-health-text',
                    resourceCurrentValueClass(
                      'health',
                      combatant.currentHealth,
                      combatant.maxHealth,
                    ),
                  )}
                >
                  {combatant.currentHealth}
                </span>
                <span className="text-health-text"> / {combatant.maxHealth}</span>
              </span>
            ) : (
              <>
                <input
                  type="number"
                  value={combatant.currentHealth}
                  onChange={(e) =>
                    onUpdate({ currentHealth: clampHealth(parseInt(e.target.value, 10) || 0) })
                  }
                  aria-label={`Current health for ${name}`}
                  className={cn(
                    'touch-tier-standard rounded border px-0.5 py-0 text-center text-sm font-bold',
                    COMBATANT_RESOURCE_NUMBER_INPUT_CLASS,
                    'border-health-border text-health-text',
                    resourceCurrentValueClass(
                      'health',
                      combatant.currentHealth,
                      combatant.maxHealth,
                    ),
                  )}
                />
                <span className="text-xs text-health-text">/ {combatant.maxHealth}</span>
                <ValueStepper
                  value={combatant.currentHealth}
                  onChange={(v) => onUpdate({ currentHealth: clampHealth(v) })}
                  min={healthMin}
                  colorVariant="health"
                  size="xs"
                  variant="compact"
                  hideValue
                  enableHoldRepeat
                  decrementTitle={`Decrease ${name} health`}
                  incrementTitle={`Increase ${name} health`}
                />
              </>
            )}
          </div>
          <div className="relative mt-1 h-1.5 min-w-0 overflow-hidden rounded-full bg-surface">
            <div
              className={cn(
                'absolute inset-y-0 left-0 rounded-full transition-all',
                getHealthBarColor(combatant.currentHealth, combatant.maxHealth),
              )}
              style={{ width: `${Math.max(0, Math.min(100, healthPercent))}%` }}
            />
          </div>
        </div>
        <div
          className={cn(
            'flex min-w-0 flex-col rounded-lg border p-2',
            'border-energy-border bg-energy-light',
          )}
        >
          <span className="mb-0.5 text-[10px] font-semibold tracking-wide text-energy-text uppercase">
            Energy
          </span>
          <div className="flex min-w-0 flex-wrap items-center gap-1">
            {linkedResourcesReadOnly ? (
              <span className="text-sm font-bold" title={linkedResourcesTitle}>
                <span
                  className={cn(
                    'text-energy-text',
                    resourceCurrentValueClass(
                      'energy',
                      combatant.currentEnergy,
                      combatant.maxEnergy,
                    ),
                  )}
                >
                  {combatant.currentEnergy}
                </span>
                <span className="text-energy-text"> / {combatant.maxEnergy}</span>
              </span>
            ) : (
              <>
                <input
                  type="number"
                  value={combatant.currentEnergy}
                  onChange={(e) => onUpdate({ currentEnergy: parseInt(e.target.value) || 0 })}
                  aria-label={`Current energy for ${name}`}
                  className={cn(
                    'touch-tier-standard rounded border border-energy-border px-0.5 py-0 text-center text-sm font-bold text-energy-text',
                    COMBATANT_RESOURCE_NUMBER_INPUT_CLASS,
                    resourceCurrentValueClass(
                      'energy',
                      combatant.currentEnergy,
                      combatant.maxEnergy,
                    ),
                  )}
                />
                <span className="text-xs text-energy-text">/ {combatant.maxEnergy}</span>
                <ValueStepper
                  value={combatant.currentEnergy}
                  onChange={(v) => onUpdate({ currentEnergy: Math.max(0, v) })}
                  min={0}
                  colorVariant="energy"
                  size="xs"
                  variant="compact"
                  hideValue
                  enableHoldRepeat
                  decrementTitle={`Decrease ${name} energy`}
                  incrementTitle={`Increase ${name} energy`}
                />
              </>
            )}
          </div>
          <div className="relative mt-1 h-1.5 min-w-0 overflow-hidden rounded-full bg-surface">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-energy transition-all"
              style={{ width: `${Math.max(0, Math.min(100, energyPercent))}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-2 flex flex-wrap items-center gap-3">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
        <span className="shrink-0 text-xs font-medium text-health-text">Health</span>
        {linkedResourcesReadOnly ? (
          <span className="text-xs font-medium" title={linkedResourcesTitle}>
            <span
              className={cn(
                'text-health-text',
                resourceCurrentValueClass('health', combatant.currentHealth, combatant.maxHealth),
              )}
            >
              {combatant.currentHealth}
            </span>
            {` / ${combatant.maxHealth}`}
          </span>
        ) : (
          <>
            <input
              type="number"
              value={combatant.currentHealth}
              onChange={(e) =>
                onUpdate({ currentHealth: clampHealth(parseInt(e.target.value, 10) || 0) })
              }
              aria-label={`Current health for ${name}`}
              className={cn(
                'touch-tier-standard rounded border px-1 py-0.5 text-center text-xs font-medium',
                COMBATANT_RESOURCE_NUMBER_INPUT_CLASS,
                combatant.currentHealth <= 0
                  ? 'border-danger-300 bg-danger-light text-danger-fg'
                  : 'border-border-light text-health-text',
                resourceCurrentValueClass('health', combatant.currentHealth, combatant.maxHealth),
              )}
            />
            <span className="text-xs text-text-muted">/</span>
            <input
              type="number"
              value={combatant.maxHealth}
              onChange={(e) => onUpdate({ maxHealth: parseInt(e.target.value) || 1 })}
              aria-label={`Maximum health for ${name}`}
              className={cn(
                'touch-tier-standard rounded border border-border-light px-1 py-0.5 text-center text-xs',
                COMBATANT_RESOURCE_NUMBER_INPUT_CLASS,
              )}
            />
            <ValueStepper
              value={combatant.currentHealth}
              onChange={(v) => onUpdate({ currentHealth: clampHealth(v) })}
              min={healthMin}
              colorVariant="health"
              size="xs"
              variant="compact"
              hideValue
              enableHoldRepeat
              decrementTitle={`Decrease ${name} health`}
              incrementTitle={`Increase ${name} health`}
            />
          </>
        )}
        <div className="h-2 max-w-20 flex-1 overflow-hidden rounded-full bg-surface-alt">
          <div
            className={cn(
              'h-full transition-all',
              getHealthBarColor(combatant.currentHealth, combatant.maxHealth),
            )}
            style={{ width: `${Math.max(0, Math.min(100, healthPercent))}%` }}
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
        <span className="shrink-0 text-xs font-medium text-energy-text">Energy</span>
        {linkedResourcesReadOnly ? (
          <span className="text-xs font-medium" title={linkedResourcesTitle}>
            <span
              className={cn(
                'text-energy-text',
                resourceCurrentValueClass('energy', combatant.currentEnergy, combatant.maxEnergy),
              )}
            >
              {combatant.currentEnergy}
            </span>
            {` / ${combatant.maxEnergy}`}
          </span>
        ) : (
          <>
            <input
              type="number"
              value={combatant.currentEnergy}
              onChange={(e) => onUpdate({ currentEnergy: parseInt(e.target.value) || 0 })}
              aria-label={`Current energy for ${name}`}
              className={cn(
                'touch-tier-standard rounded border border-border-light px-1 py-0.5 text-center text-xs font-medium text-energy-text',
                COMBATANT_RESOURCE_NUMBER_INPUT_CLASS,
                resourceCurrentValueClass('energy', combatant.currentEnergy, combatant.maxEnergy),
              )}
            />
            <span className="text-xs text-text-muted">/</span>
            <input
              type="number"
              value={combatant.maxEnergy}
              onChange={(e) => onUpdate({ maxEnergy: parseInt(e.target.value) || 0 })}
              aria-label={`Maximum energy for ${name}`}
              className={cn(
                'touch-tier-standard rounded border border-border-light px-1 py-0.5 text-center text-xs',
                COMBATANT_RESOURCE_NUMBER_INPUT_CLASS,
              )}
            />
            <ValueStepper
              value={combatant.currentEnergy}
              onChange={(v) => onUpdate({ currentEnergy: Math.max(0, v) })}
              min={0}
              colorVariant="energy"
              size="xs"
              variant="compact"
              hideValue
              enableHoldRepeat
              decrementTitle={`Decrease ${name} energy`}
              incrementTitle={`Increase ${name} energy`}
            />
          </>
        )}
        <div className="h-2 max-w-20 flex-1 overflow-hidden rounded-full bg-surface-alt">
          <div
            className="h-full bg-energy transition-all"
            style={{ width: `${Math.max(0, Math.min(100, energyPercent))}%` }}
          />
        </div>
      </div>
    </div>
  );
}
