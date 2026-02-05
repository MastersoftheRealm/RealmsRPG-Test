/**
 * Health/Energy Allocator
 * =======================
 * Shared component for allocating HP and Energy points from a shared pool.
 * Used in character creator, character sheet, and creature creator.
 * 
 * Uses the unified ValueStepper component with hold-to-repeat support.
 * 
 * Design Updates:
 * - Health uses GREEN colors (intuitive for HP)
 * - Shows TOTAL value prominently, "points" allocated shown secondary
 * - Renamed "bonus" to "points" for clarity
 * 
 * Variants:
 * - "card": Full card layout with visual pool status (default, for creators)
 * - "inline": Compact horizontal layout with progress bars (for sheet edit mode)
 */

'use client';

import { cn } from '@/lib/utils';
import { ValueStepper } from '@/components/shared';

export interface HealthEnergyAllocatorProps {
  /** Additional HP points allocated beyond base */
  hpBonus: number;
  /** Additional Energy points allocated beyond base */
  energyBonus: number;
  /** Total pool of points available */
  poolTotal: number;
  /** Calculated max HP after bonuses */
  maxHp: number;
  /** Calculated max Energy after bonuses */
  maxEnergy: number;
  /** Callback when HP allocation changes */
  onHpChange: (value: number) => void;
  /** Callback when Energy allocation changes */
  onEnergyChange: (value: number) => void;
  /** Layout variant: 'card' for creators, 'inline' for sheet */
  variant?: 'card' | 'inline';
  /** Whether editing is disabled */
  disabled?: boolean;
  /** Enable hold-to-repeat with exponential acceleration */
  enableHoldRepeat?: boolean;
  /** Allow allocating more points than the pool provides (for manual overrides) */
  allowOverallocation?: boolean;
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
  allowOverallocation = false,
}: HealthEnergyAllocatorProps) {
  const spent = hpBonus + energyBonus;
  const remaining = poolTotal - spent;
  const isOverspent = remaining < 0;
  const isComplete = remaining === 0;
  
  // Max bonus is constrained by remaining pool, unless overallocation is allowed
  const maxHpBonus = allowOverallocation ? Infinity : hpBonus + remaining;
  const maxEnergyBonus = allowOverallocation ? Infinity : energyBonus + remaining;

  // Inline variant for character sheet edit mode
  if (variant === 'inline') {
    return (
      <div className={cn(
        'rounded-xl border',
        isOverspent ? 'border-danger-300 bg-danger-light' : 
        isComplete ? 'border-success-300 bg-success-light' : 
        'border-border-light bg-surface-secondary'
      )}>
        {/* Pool Status Header */}
        <div className={cn(
          'flex items-center justify-between px-4 py-1.5 border-b',
          isOverspent ? 'border-danger-300' : 
          isComplete ? 'border-success-300' : 
          'border-border-light'
        )}>
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
            HP/EN Pool
          </span>
          <span className={cn(
            'text-xs font-bold',
            isOverspent ? 'text-danger-600' : 
            isComplete ? 'text-success-600' : 
            'text-info-600'
          )}>
            {spent} / {poolTotal}
            {isOverspent && <span className="ml-1">({remaining})</span>}
          </span>
        </div>
        
        <div className="flex items-center gap-4 px-4 py-3">
          {/* Health Points - Green colors, show total prominently */}
          <div className="flex-1 flex items-center gap-2">
            <span className="text-lg font-bold text-green-600 min-w-[60px]">{maxHp} HP</span>
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
              decrementTitle="Remove HP points"
              incrementTitle="Add HP points"
            />
            <span className="text-xs text-text-muted whitespace-nowrap">pts</span>
          </div>
          
          {/* Divider */}
          <div className="w-px h-10 bg-border-light" />
          
          {/* Energy Points - Blue colors, show total prominently */}
          <div className="flex-1 flex items-center gap-2">
            <span className="text-lg font-bold text-blue-600 min-w-[60px]">{maxEnergy} EN</span>
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
              decrementTitle="Remove Energy points"
              incrementTitle="Add Energy points"
            />
            <span className="text-xs text-text-muted whitespace-nowrap">pts</span>
          </div>
        </div>
      </div>
    );
  }

  // Card variant (default) for creators
  return (
    <div className={cn(
      'rounded-xl border',
      isOverspent ? 'border-danger-300 bg-danger-light' : 
      isComplete ? 'border-success-300 bg-success-light' : 
      'border-border-light bg-surface-secondary'
    )}>
      {/* Pool Status */}
      <div className={cn(
        'flex items-center justify-between px-4 py-2 border-b',
        isOverspent ? 'border-danger-300' : 
        isComplete ? 'border-success-300' : 
        'border-border-light'
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
        {/* HP Allocator - Show total prominently, points secondary */}
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-green-600 min-w-[70px]">{maxHp} HP</span>
          <ValueStepper
            value={hpBonus}
            onChange={onHpChange}
            min={0}
            max={maxHpBonus}
            size="lg"
            colorVariant="health"
            enableHoldRepeat={enableHoldRepeat}
            disabled={disabled}
            decrementTitle="Remove HP points"
            incrementTitle="Add HP points"
          />
          <span className="text-sm text-text-muted whitespace-nowrap">pts</span>
        </div>

        {/* Energy Allocator - Show total prominently, points secondary */}
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-blue-600 min-w-[70px]">{maxEnergy} EN</span>
          <ValueStepper
            value={energyBonus}
            onChange={onEnergyChange}
            min={0}
            max={maxEnergyBonus}
            size="lg"
            colorVariant="energy"
            enableHoldRepeat={enableHoldRepeat}
            disabled={disabled}
            decrementTitle="Remove Energy points"
            incrementTitle="Add Energy points"
          />
          <span className="text-sm text-text-muted whitespace-nowrap">pts</span>
        </div>
      </div>
    </div>
  );
}
