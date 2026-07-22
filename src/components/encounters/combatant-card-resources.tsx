'use client';

import { cn } from '@/lib/utils';
import { ValueStepper } from '@/components/shared';
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
  const healthPercent = combatant.maxHealth > 0 ? (combatant.currentHealth / combatant.maxHealth) * 100 : 0;
  const energyPercent = combatant.maxEnergy > 0 ? (combatant.currentEnergy / combatant.maxEnergy) * 100 : 0;

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 mb-2">
        <div className={cn('flex flex-col flex-1 min-w-0 p-2 rounded-lg border', 'bg-health-light border-health-border')}>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-health-text mb-0.5">Health</span>
          <div className="flex items-center gap-1">
            {linkedResourcesReadOnly ? (
              <span className="text-sm font-bold text-health-text" title={linkedResourcesTitle}>{combatant.currentHealth} / {combatant.maxHealth}</span>
            ) : (
              <>
                <input
                  type="number"
                  value={combatant.currentHealth}
                  onChange={(e) => onUpdate({ currentHealth: parseInt(e.target.value) || 0 })}
                  className={cn(
                    'w-10 px-0.5 py-0 text-sm font-bold rounded border text-center min-h-[var(--touch-target-min,44px)] md:min-h-0',
                    'border-health-border text-health-text'
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
          <div className="relative h-1.5 mt-1 bg-surface rounded-full overflow-hidden">
            <div
              className={cn('absolute inset-y-0 left-0 transition-all rounded-full', getHealthBarColor(combatant.currentHealth, combatant.maxHealth))}
              style={{ width: `${Math.max(0, Math.min(100, healthPercent))}%` }}
            />
          </div>
        </div>
        <div className={cn('flex flex-col flex-1 min-w-0 p-2 rounded-lg border', 'bg-energy-light border-energy-border')}>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-energy-text mb-0.5">Energy</span>
          <div className="flex items-center gap-1">
            {linkedResourcesReadOnly ? (
              <span className="text-sm font-bold text-energy-text" title={linkedResourcesTitle}>{combatant.currentEnergy} / {combatant.maxEnergy}</span>
            ) : (
              <>
                <input
                  type="number"
                  value={combatant.currentEnergy}
                  onChange={(e) => onUpdate({ currentEnergy: parseInt(e.target.value) || 0 })}
                  className="w-10 px-0.5 py-0 text-sm font-bold rounded border border-energy-border text-energy-text text-center min-h-[var(--touch-target-min,44px)] md:min-h-0"
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
          <div className="relative h-1.5 mt-1 bg-surface rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-energy transition-all rounded-full"
              style={{ width: `${Math.max(0, Math.min(100, energyPercent))}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 mb-2">
      <div className="flex items-center gap-1 flex-1">
        <span className="text-xs text-health-text font-medium shrink-0">Health</span>
        {linkedResourcesReadOnly ? (
          <span className="text-xs font-medium" title={linkedResourcesTitle}>{combatant.currentHealth} / {combatant.maxHealth}</span>
        ) : (
          <>
            <input
              type="number"
              value={combatant.currentHealth}
              onChange={(e) => onUpdate({ currentHealth: parseInt(e.target.value) || 0 })}
              className={cn(
                'w-12 px-1 py-0.5 text-xs border rounded text-center font-medium min-h-[var(--touch-target-min,44px)] md:min-h-0',
                combatant.currentHealth <= 0 ? 'border-danger-300 bg-danger-light text-danger-fg' : 'border-border-light'
              )}
            />
            <span className="text-text-muted dark:text-text-secondary text-xs">/</span>
            <input
              type="number"
              value={combatant.maxHealth}
              onChange={(e) => onUpdate({ maxHealth: parseInt(e.target.value) || 1 })}
              className="w-12 px-1 py-0.5 text-xs border border-border-light rounded text-center min-h-[var(--touch-target-min,44px)] md:min-h-0"
            />
          </>
        )}
        <div className="flex-1 h-2 bg-surface-alt rounded-full overflow-hidden max-w-20">
          <div
            className={cn('h-full transition-all', getHealthBarColor(combatant.currentHealth, combatant.maxHealth))}
            style={{ width: `${Math.max(0, Math.min(100, healthPercent))}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-1 flex-1">
        <span className="text-xs text-energy-text font-medium shrink-0">Energy</span>
        {linkedResourcesReadOnly ? (
          <span className="text-xs font-medium" title={linkedResourcesTitle}>{combatant.currentEnergy} / {combatant.maxEnergy}</span>
        ) : (
          <>
            <input
              type="number"
              value={combatant.currentEnergy}
              onChange={(e) => onUpdate({ currentEnergy: parseInt(e.target.value) || 0 })}
              className="w-12 px-1 py-0.5 text-xs border border-border-light rounded text-center font-medium min-h-[var(--touch-target-min,44px)] md:min-h-0"
            />
            <span className="text-text-muted dark:text-text-secondary text-xs">/</span>
            <input
              type="number"
              value={combatant.maxEnergy}
              onChange={(e) => onUpdate({ maxEnergy: parseInt(e.target.value) || 0 })}
              className="w-12 px-1 py-0.5 text-xs border border-border-light rounded text-center min-h-[var(--touch-target-min,44px)] md:min-h-0"
            />
          </>
        )}
        <div className="flex-1 h-2 bg-surface-alt rounded-full overflow-hidden max-w-20">
          <div
            className="h-full bg-energy transition-all"
            style={{ width: `${Math.max(0, Math.min(100, energyPercent))}%` }}
          />
        </div>
      </div>
    </div>
  );
}
