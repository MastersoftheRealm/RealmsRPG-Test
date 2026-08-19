'use client';

import { cn } from '@/lib/utils';
import { ValueStepper } from '@/components/patterns';
import type { Combatant } from '@/types/encounter';
import { getHealthBarColor } from './combatant-card-helpers';

export interface CombatantCardResourcesProps {
  combatant: Combatant;
  variant: 'full' | 'compact';
  linkedResourcesReadOnly: boolean;
  linkedResourcesTitle: string;
  onUpdate: (updates: Partial<Combatant>) => void;
}

export function CombatantCardResources({
  combatant,
  variant,
  linkedResourcesReadOnly,
  linkedResourcesTitle,
  onUpdate,
}: CombatantCardResourcesProps) {
  const healthPercent =
    combatant.maxHealth > 0 ? (combatant.currentHealth / combatant.maxHealth) * 100 : 0;
  const energyPercent =
    combatant.maxEnergy > 0 ? (combatant.currentEnergy / combatant.maxEnergy) * 100 : 0;

  if (variant === 'compact') {
    return (
      <div className="mb-2 flex items-center gap-3">
        <div
          className={cn(
            'flex min-w-0 flex-1 flex-col rounded-lg border p-2',
            'border-health-border bg-health-light',
          )}
        >
          <span className="mb-0.5 text-[10px] font-semibold tracking-wide text-health-text uppercase">
            Health
          </span>
          <div className="flex items-center gap-1">
            {linkedResourcesReadOnly ? (
              <span className="text-sm font-bold text-health-text" title={linkedResourcesTitle}>
                {combatant.currentHealth} / {combatant.maxHealth}
              </span>
            ) : (
              <>
                <input
                  type="number"
                  value={combatant.currentHealth}
                  onChange={(e) => onUpdate({ currentHealth: parseInt(e.target.value) || 0 })}
                  className={cn(
                    'min-h-[var(--touch-target-min,44px)] w-10 rounded border px-0.5 py-0 text-center text-sm font-bold md:min-h-0',
                    'border-health-border text-health-text',
                  )}
                />
                <span className="text-xs text-health-text">/ {combatant.maxHealth}</span>
                <ValueStepper
                  value={combatant.currentHealth}
                  onChange={(v) => onUpdate({ currentHealth: Math.max(0, v) })}
                  min={0}
                  colorVariant="health"
                  size="xs"
                  variant="compact"
                  hideValue
                  enableHoldRepeat
                />
              </>
            )}
          </div>
          <div className="relative mt-1 h-1.5 overflow-hidden rounded-full bg-surface">
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
            'flex min-w-0 flex-1 flex-col rounded-lg border p-2',
            'border-energy-border bg-energy-light',
          )}
        >
          <span className="mb-0.5 text-[10px] font-semibold tracking-wide text-energy-text uppercase">
            Energy
          </span>
          <div className="flex items-center gap-1">
            {linkedResourcesReadOnly ? (
              <span className="text-sm font-bold text-energy-text" title={linkedResourcesTitle}>
                {combatant.currentEnergy} / {combatant.maxEnergy}
              </span>
            ) : (
              <>
                <input
                  type="number"
                  value={combatant.currentEnergy}
                  onChange={(e) => onUpdate({ currentEnergy: parseInt(e.target.value) || 0 })}
                  className="min-h-[var(--touch-target-min,44px)] w-10 rounded border border-energy-border px-0.5 py-0 text-center text-sm font-bold text-energy-text md:min-h-0"
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
                />
              </>
            )}
          </div>
          <div className="relative mt-1 h-1.5 overflow-hidden rounded-full bg-surface">
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
    <div className="mb-2 flex items-center gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-1">
        <span className="shrink-0 text-xs font-medium text-health-text">Health</span>
        {linkedResourcesReadOnly ? (
          <span className="text-xs font-medium" title={linkedResourcesTitle}>
            {combatant.currentHealth} / {combatant.maxHealth}
          </span>
        ) : (
          <>
            <input
              type="number"
              value={combatant.currentHealth}
              onChange={(e) => onUpdate({ currentHealth: parseInt(e.target.value) || 0 })}
              className={cn(
                'min-h-[var(--touch-target-min,44px)] w-12 rounded border px-1 py-0.5 text-center text-xs font-medium md:min-h-0',
                combatant.currentHealth <= 0
                  ? 'border-danger-300 bg-danger-light text-danger-fg'
                  : 'border-border-light',
              )}
            />
            <span className="text-xs text-text-muted">/</span>
            <input
              type="number"
              value={combatant.maxHealth}
              onChange={(e) => onUpdate({ maxHealth: parseInt(e.target.value) || 1 })}
              className="min-h-[var(--touch-target-min,44px)] w-12 rounded border border-border-light px-1 py-0.5 text-center text-xs md:min-h-0"
            />
            <ValueStepper
              value={combatant.currentHealth}
              onChange={(v) => onUpdate({ currentHealth: Math.max(0, v) })}
              min={0}
              colorVariant="health"
              size="xs"
              variant="compact"
              hideValue
              enableHoldRepeat
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

      <div className="flex min-w-0 flex-1 items-center gap-1">
        <span className="shrink-0 text-xs font-medium text-energy-text">Energy</span>
        {linkedResourcesReadOnly ? (
          <span className="text-xs font-medium" title={linkedResourcesTitle}>
            {combatant.currentEnergy} / {combatant.maxEnergy}
          </span>
        ) : (
          <>
            <input
              type="number"
              value={combatant.currentEnergy}
              onChange={(e) => onUpdate({ currentEnergy: parseInt(e.target.value) || 0 })}
              className="min-h-[var(--touch-target-min,44px)] w-12 rounded border border-border-light px-1 py-0.5 text-center text-xs font-medium md:min-h-0"
            />
            <span className="text-xs text-text-muted">/</span>
            <input
              type="number"
              value={combatant.maxEnergy}
              onChange={(e) => onUpdate({ maxEnergy: parseInt(e.target.value) || 0 })}
              className="min-h-[var(--touch-target-min,44px)] w-12 rounded border border-border-light px-1 py-0.5 text-center text-xs md:min-h-0"
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
