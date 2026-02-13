/**
 * PoweredMartialSlider Component
 * ==============================
 * A reusable slider for allocating points between Power and Martial proficiency.
 * Used in both Creature Creator and Character Sheet edit mode for powered-martial characters.
 * 
 * Features:
 * - Visual gradient slider from Power (violet) to Martial (red)
 * - Tick marks for each point
 * - Responsive labels showing current allocation
 * - Compact variant for character sheet use
 */

'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface PoweredMartialSliderProps {
  /** Power proficiency value */
  powerValue: number;
  /** Martial proficiency value */
  martialValue: number;
  /** Total points to allocate (powerValue + martialValue) */
  maxPoints: number;
  /** Callback when allocation changes */
  onChange: (powerValue: number, martialValue: number) => void;
  /** Whether the slider is disabled */
  disabled?: boolean;
  /** Compact mode for character sheet use */
  compact?: boolean;
  /** Hide the labels above the slider */
  hideLabels?: boolean;
  /** Allow 0 at either end (for character sheet pure martial/power). When false, powered-martial requires min 1 each. */
  allowZeroEnds?: boolean;
  /** Additional className */
  className?: string;
}

export function PoweredMartialSlider({
  powerValue,
  martialValue,
  maxPoints,
  onChange,
  disabled = false,
  compact = false,
  hideLabels = false,
  allowZeroEnds = false,
  className,
}: PoweredMartialSliderProps) {
  // Internal state to handle slider value
  const [sliderValue, setSliderValue] = useState(powerValue);
  
  // allowZeroEnds: character sheet (pure martial/power). !allowZeroEnds: creature creator (powered-martial min 1 each)
  const minPower = allowZeroEnds ? 0 : (maxPoints > 1 ? 1 : 0);
  const maxPower = allowZeroEnds ? maxPoints : (maxPoints > 1 ? maxPoints - 1 : maxPoints);
  
  // Sync internal state when props change (clamp if out of bounds)
  useEffect(() => {
    setSliderValue(Math.max(minPower, Math.min(maxPower, powerValue)));
  }, [powerValue, minPower, maxPower]);

  const handleSliderChange = (newPowerValue: number) => {
    const clamped = Math.max(minPower, Math.min(maxPower, newPowerValue));
    setSliderValue(clamped);
    onChange(clamped, maxPoints - clamped);
  };
  
  return (
    <div className={cn(
      'rounded-xl bg-surface-secondary border border-border-light',
      compact ? 'p-2' : 'p-4',
      className
    )}>
      {/* Header with total info */}
      {!compact && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-secondary">Proficiency Allocation</span>
          <span className="text-sm text-tertiary">
            Total: {maxPoints} points
          </span>
        </div>
      )}

      {/* Slider Labels */}
      {!hideLabels && (
        <div className={cn(
          'flex justify-between',
          compact ? 'mb-1' : 'mb-2'
        )}>
          <div className="text-center">
            <span className={cn(
              'text-tertiary block',
              compact ? 'text-[10px]' : 'text-xs'
            )}>Power</span>
            <span className={cn(
              'font-bold text-violet-500',
              compact ? 'text-sm' : 'text-lg'
            )}>{sliderValue}</span>
          </div>
          <div className="text-center">
            <span className={cn(
              'text-tertiary block',
              compact ? 'text-[10px]' : 'text-xs'
            )}>Martial</span>
            <span className={cn(
              'font-bold text-martial-dark',
              compact ? 'text-sm' : 'text-lg'
            )}>{maxPoints - sliderValue}</span>
          </div>
        </div>
      )}

      {/* Custom Slider */}
      <div className="relative py-2">
        <div className={cn(
          'absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-power-dark to-martial-dark',
          compact ? 'h-1.5' : 'h-2'
        )} />
        <input
          type="range"
          min={minPower}
          max={maxPower}
          value={sliderValue}
          onChange={(e) => handleSliderChange(parseInt(e.target.value))}
          disabled={disabled}
          className={cn(
            'relative w-full appearance-none bg-transparent cursor-pointer',
            'range-slider',
            compact ? 'h-4' : 'h-6',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          style={{
            WebkitAppearance: 'none',
          }}
        />
      </div>

      {/* Tick marks */}
      {!compact && (maxPower - minPower + 1) <= 20 && (
        <div className="flex justify-between px-1 mt-1">
          {Array.from({ length: maxPower - minPower + 1 }).map((_, i) => {
            const tickValue = minPower + i;
            return (
              <div
                key={i}
                className={cn(
                  'w-1 h-1 rounded-full',
                  tickValue === sliderValue ? 'bg-primary-600' : 'bg-border-light'
                )}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
