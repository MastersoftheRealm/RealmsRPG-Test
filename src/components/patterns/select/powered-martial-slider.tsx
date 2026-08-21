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
  disabled?: boolean | undefined;
  /** Compact mode for character sheet use */
  compact?: boolean | undefined;
  /** Hide the labels above the slider */
  hideLabels?: boolean | undefined;
  /** Allow 0 at either end (for character sheet pure martial/power). When false, powered-martial requires min 1 each. */
  allowZeroEnds?: boolean | undefined;
  /** Additional className */
  className?: string | undefined;
}

export function PoweredMartialSlider({
  martialValue,
  maxPoints,
  onChange,
  disabled = false,
  compact = false,
  hideLabels = false,
  allowZeroEnds = false,
  className,
}: PoweredMartialSliderProps) {
  // Slider value = martial (left = 0 martial = all power, right = max martial = no power)
  const minMartial = allowZeroEnds ? 0 : maxPoints > 1 ? 1 : 0;
  const maxMartial = allowZeroEnds ? maxPoints : maxPoints > 1 ? maxPoints - 1 : maxPoints;
  const sliderValue = Math.max(minMartial, Math.min(maxMartial, martialValue));

  const handleSliderChange = (newMartialValue: number) => {
    const clamped = Math.max(minMartial, Math.min(maxMartial, newMartialValue));
    onChange(maxPoints - clamped, clamped);
  };

  const powerDisplay = maxPoints - sliderValue;
  const martialDisplay = sliderValue;

  return (
    <div
      className={cn(
        'rounded-xl border border-border-light bg-surface-secondary',
        compact ? 'p-2' : 'p-4',
        className,
      )}
    >
      {/* Header with total info */}
      {!compact && (
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-text-secondary dark:text-text-primary">
            Proficiency Allocation
          </span>
          <span className="text-sm text-text-muted">Total: {maxPoints} points</span>
        </div>
      )}

      {/* Slider Labels: Left = Power, Right = Martial (slide left = more power, right = more martial) */}
      {!hideLabels && (
        <div className={cn('flex justify-between', compact ? 'mb-1' : 'mb-2')}>
          <div className="text-center">
            <span className={cn('block text-text-muted', compact ? 'text-[10px]' : 'text-xs')}>
              Power
            </span>
            <span className={cn('font-bold text-power-fg', compact ? 'text-sm' : 'text-lg')}>
              {powerDisplay}
            </span>
          </div>
          <div className="text-center">
            <span className={cn('block text-text-muted', compact ? 'text-[10px]' : 'text-xs')}>
              Martial
            </span>
            <span className={cn('font-bold text-martial-fg', compact ? 'text-sm' : 'text-lg')}>
              {martialDisplay}
            </span>
          </div>
        </div>
      )}

      {/* Custom Slider: left = 0 martial (all power), right = max martial. touch-action: pan-y so horizontal drag doesn't trigger section swipe on mobile. */}
      <div className="relative touch-pan-y py-2" style={{ touchAction: 'pan-y' }}>
        <div
          className={cn(
            'absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-power-dark to-martial-dark',
            compact ? 'h-1.5' : 'h-2',
          )}
        />
        <input
          type="range"
          min={minMartial}
          max={maxMartial}
          value={sliderValue}
          onChange={(e) => handleSliderChange(parseInt(e.target.value))}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          disabled={disabled}
          aria-label="Power-Martial proficiency allocation"
          className={cn(
            'relative w-full cursor-pointer appearance-none bg-transparent',
            'range-slider',
            compact ? 'h-4' : 'h-6',
            disabled && 'cursor-not-allowed opacity-50',
          )}
          style={{
            WebkitAppearance: 'none',
            touchAction: 'none',
          }}
        />
      </div>

      {/* Tick marks */}
      {!compact && maxMartial - minMartial + 1 <= 20 && (
        <div className="mt-1 flex justify-between px-1">
          {Array.from({ length: maxMartial - minMartial + 1 }).map((_, i) => {
            const tickValue = minMartial + i;
            return (
              <div
                key={i}
                className={cn(
                  'h-1 w-1 rounded-full',
                  tickValue === sliderValue ? 'bg-primary-button' : 'bg-border-light',
                )}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
