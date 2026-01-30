/**
 * Health/Energy Allocator
 * =======================
 * Shared component for allocating HP and Energy points from a shared pool.
 * Used in character creator, character sheet, and creature creator.
 * 
 * Uses the unified ValueStepper component with hold-to-repeat support.
 * 
 * Variants:
 * - "card": Full card layout with visual pool status (default, for creators)
 * - "inline": Compact horizontal layout with progress bars (for sheet edit mode)
 */

'use client';

import { cn } from '@/lib/utils';
import { ValueStepper } from '@/components/shared';

export interface HealthEnergyAllocatorProps {
  /** Bonus HP points added beyond base */
  hpBonus: number;
  /** Bonus Energy points added beyond base */
  energyBonus: number;
  /** Total pool of points available */
  poolTotal: number;
  /** Calculated max HP after bonuses */
  maxHp: number;
  /** Calculated max Energy after bonuses */
  maxEnergy: number;
  /** Callback when HP bonus changes */
  onHpChange: (value: number) => void;
  /** Callback when Energy bonus changes */
  onEnergyChange: (value: number) => void;
  /** Layout variant: 'card' for creators, 'inline' for sheet */
  variant?: 'card' | 'inline';
  /** Whether editing is disabled */
  disabled?: boolean;
  /** Enable hold-to-repeat with exponential acceleration */
  enableHoldRepeat?: boolean;
}

export function HealthEnergyAllocator({
  hpBonus,
  energyBonus,
  poolTotal,
  maxHp,
  maxEnergy,
  onHpChange,
  onEnergyChange,
  variant = 'card',
  disabled = false,
  enableHoldRepeat = false,
}: HealthEnergyAllocatorProps) {
  const spent = hpBonus + energyBonus;
  const remaining = poolTotal - spent;
  const isOverspent = remaining < 0;
  const isComplete = remaining === 0;
  
  // Max bonus is constrained by remaining pool
  const maxHpBonus = hpBonus + remaining;
  const maxEnergyBonus = energyBonus + remaining;

  // Inline variant for character sheet edit mode
  if (variant === 'inline') {
    return (
      <div className="p-3 bg-gradient-to-r from-red-50 to-blue-50 rounded-lg border border-neutral-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
            H/E Pool Allocation
          </span>
          <span className={cn(
            'text-xs font-bold px-2 py-0.5 rounded-full',
            remaining > 0 ? 'bg-green-100 text-green-700' :
            remaining < 0 ? 'bg-red-100 text-red-700' :
            'bg-neutral-100 text-text-secondary'
          )}>
            {remaining} / {poolTotal} remaining
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Health Points */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-red-600 font-medium">Health +</span>
              <span className="text-xs text-text-muted">{hpBonus} pts (Max: {maxHp})</span>
            </div>
            <div className="flex items-center gap-1">
              <ValueStepper
                value={hpBonus}
                onChange={onHpChange}
                min={0}
                max={maxHpBonus}
                size="sm"
                variant="compact"
                colorVariant="health"
                enableHoldRepeat={enableHoldRepeat}
                disabled={disabled}
                hideValue
                decrementTitle="Remove HP bonus"
                incrementTitle="Add HP bonus"
              />
              <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden mx-1">
                <div
                  className="h-full bg-red-500 transition-all duration-200"
                  style={{ width: `${(hpBonus / poolTotal) * 100}%` }}
                />
              </div>
            </div>
          </div>
          
          {/* Divider */}
          <div className="w-px h-10 bg-neutral-300" />
          
          {/* Energy Points */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-blue-600 font-medium">Energy +</span>
              <span className="text-xs text-text-muted">{energyBonus} pts (Max: {maxEnergy})</span>
            </div>
            <div className="flex items-center gap-1">
              <ValueStepper
                value={energyBonus}
                onChange={onEnergyChange}
                min={0}
                max={maxEnergyBonus}
                size="sm"
                variant="compact"
                colorVariant="energy"
                enableHoldRepeat={enableHoldRepeat}
                disabled={disabled}
                hideValue
                decrementTitle="Remove Energy bonus"
                incrementTitle="Add Energy bonus"
              />
              <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden mx-1">
                <div
                  className="h-full bg-blue-500 transition-all duration-200"
                  style={{ width: `${(energyBonus / poolTotal) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-[10px] text-text-muted mt-2 text-center">
          Total pool: 18 + 12 × (level - 1) = {poolTotal}
        </p>
      </div>
    );
  }

  // Card variant (default) for creators
  return (
    <div className={cn(
      'rounded-xl border',
      isOverspent ? 'border-danger-300 bg-danger-light' : 
      isComplete ? 'border-success-300 bg-success-light' : 
      'border-neutral-200 bg-surface-secondary'
    )}>
      {/* Pool Status */}
      <div className={cn(
        'flex items-center justify-between px-4 py-2 border-b',
        isOverspent ? 'border-danger-300' : 
        isComplete ? 'border-success-300' : 
        'border-neutral-200'
      )}>
        <span className="text-sm font-medium text-secondary">HP/EN Pool</span>
        <span className={cn(
          'text-sm font-bold',
          isOverspent ? 'text-danger-600' : 
          isComplete ? 'text-success-600' : 
          'text-info-600'
        )}>
          {spent} / {poolTotal}
          {isOverspent && <span className="ml-1">({remaining})</span>}
        </span>
      </div>

      <div className="grid gap-4 p-4 grid-cols-1 sm:grid-cols-2">
        {/* HP Allocator */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-secondary">Hit Points</span>
            <span className="text-lg font-bold text-danger-600">{maxHp}</span>
          </div>
          <div className="flex items-center gap-2">
            <ValueStepper
              value={hpBonus}
              onChange={onHpChange}
              min={0}
              max={maxHpBonus}
              size="lg"
              colorVariant="health"
              enableHoldRepeat={enableHoldRepeat}
              disabled={disabled}
              hideValue
              decrementTitle="Remove HP bonus"
              incrementTitle="Add HP bonus"
            />
            <div className="flex-1 text-center">
              <span className="text-xl font-bold text-primary">+{hpBonus}</span>
              <span className="text-xs text-tertiary ml-1">bonus</span>
            </div>
          </div>
        </div>

        {/* Energy Allocator */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-secondary">Energy</span>
            <span className="text-lg font-bold text-info-600">{maxEnergy}</span>
          </div>
          <div className="flex items-center gap-2">
            <ValueStepper
              value={energyBonus}
              onChange={onEnergyChange}
              min={0}
              max={maxEnergyBonus}
              size="lg"
              colorVariant="energy"
              enableHoldRepeat={enableHoldRepeat}
              disabled={disabled}
              hideValue
              decrementTitle="Remove Energy bonus"
              incrementTitle="Add Energy bonus"
            />
            <div className="flex-1 text-center">
              <span className="text-xl font-bold text-primary">+{energyBonus}</span>
              <span className="text-xs text-tertiary ml-1">bonus</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
