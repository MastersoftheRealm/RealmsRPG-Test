/**
 * ValueStepper Component
 * ======================
 * Unified increment/decrement control used across the entire site.
 * Replaces various inline +/- button patterns with a consistent component.
 * 
 * Features:
 * - Hold-to-repeat with exponential acceleration (200ms → 50ms)
 * - Touch support for mobile devices
 * - Color variants for different contexts (health, energy, neutral)
 * - Consistent styling across all pages
 * 
 * Used in:
 * - Character Sheet: ability editing, skill values, defense skills, health/energy
 * - Character Creator: ability allocation, skill points, health/energy allocation
 * - Creature Creator: stats, quantities
 * - All creators: level selection, quantities
 * - Encounter Tracker: combatant stats
 * 
 * @example
 * // Basic usage
 * <ValueStepper value={5} onChange={setValue} />
 * 
 * // With formatted display (+/- for bonuses)
 * <ValueStepper value={3} onChange={setValue} formatValue={v => v >= 0 ? `+${v}` : `${v}`} />
 * 
 * // Compact inline style
 * <ValueStepper value={2} onChange={setValue} variant="inline" size="sm" />
 * 
 * // Health/Energy with hold-to-repeat and color
 * <ValueStepper value={hp} onChange={setHp} max={maxHp} colorVariant="health" enableHoldRepeat />
 */

'use client';

import * as React from 'react';
import { useRef, useCallback, useEffect } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

// =============================================================================
// Hold-to-Repeat Hook
// =============================================================================

/**
 * Hook for handling hold-to-repeat with exponential acceleration.
 * Starts at maxDelay (default 200ms), decreases to minDelay (default 50ms) as you hold.
 */
function useHoldRepeat(
  callback: () => void,
  enabled: boolean = true,
  minDelay = 50,
  maxDelay = 200
) {
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const delayRef = useRef(maxDelay);
  const isHoldingRef = useRef(false);
  const callbackRef = useRef(callback);
  
  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const start = useCallback(() => {
    if (!enabled || isHoldingRef.current) return;
    isHoldingRef.current = true;
    delayRef.current = maxDelay;
    
    // Execute immediately
    callbackRef.current();
    
    // Start repeating
    const repeat = () => {
      if (!isHoldingRef.current) return;
      callbackRef.current();
      // Decrease delay exponentially (faster as you hold)
      delayRef.current = Math.max(minDelay, delayRef.current * 0.85);
      intervalRef.current = setTimeout(repeat, delayRef.current);
    };
    
    intervalRef.current = setTimeout(repeat, maxDelay);
  }, [enabled, minDelay, maxDelay]);

  const stop = useCallback(() => {
    isHoldingRef.current = false;
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, []);

  return { start, stop };
}

// =============================================================================
// Variants
// =============================================================================

const stepperButtonVariants = cva(
  // Base button styles
  'flex items-center justify-center font-bold rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed select-none',
  {
    variants: {
      size: {
        xs: 'w-5 h-5 text-xs',
        sm: 'w-6 h-6 text-sm',
        md: 'w-8 h-8 text-base',
        lg: 'w-10 h-10 text-lg',
        xl: 'w-12 h-12 text-xl',
      },
      colorVariant: {
        default: '',
        health: '',
        energy: '',
      },
    },
    defaultVariants: {
      size: 'md',
      colorVariant: 'default',
    },
  }
);

const valueDisplayVariants = cva(
  'text-center font-semibold tabular-nums',
  {
    variants: {
      size: {
        xs: 'min-w-[20px] text-xs',
        sm: 'min-w-[24px] text-sm',
        md: 'min-w-[32px] text-base',
        lg: 'min-w-[40px] text-lg',
        xl: 'min-w-[48px] text-xl',
      },
      valueState: {
        positive: 'text-success-700',
        negative: 'text-danger-700',
        neutral: 'text-text-primary',
        health: 'text-red-600',
        energy: 'text-blue-600',
      },
    },
    defaultVariants: {
      size: 'md',
      valueState: 'neutral',
    },
  }
);

export interface ValueStepperProps extends VariantProps<typeof stepperButtonVariants> {
  /** Current value */
  value: number;
  /** Change handler */
  onChange: (value: number) => void;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Step amount per increment/decrement */
  step?: number;
  /** Optional label displayed before the stepper */
  label?: string;
  /** Whether to disable the stepper */
  disabled?: boolean;
  /** Whether to hide the value display (for custom layouts) */
  hideValue?: boolean;
  /** Custom value formatter (e.g., for +/- display) */
  formatValue?: (value: number) => string;
  /** Color the value based on positive/negative */
  colorValue?: boolean;
  /** Color variant for health/energy contexts */
  colorVariant?: 'default' | 'health' | 'energy';
  /** Enable hold-to-repeat with exponential acceleration */
  enableHoldRepeat?: boolean;
  /** Style variant */
  variant?: 'default' | 'inline' | 'compact';
  /** Additional class name */
  className?: string;
  /** Title for decrement button */
  decrementTitle?: string;
  /** Title for increment button */
  incrementTitle?: string;
}

/**
 * Unified value stepper component.
 * Provides consistent +/- controls across the entire site.
 * Supports hold-to-repeat with exponential acceleration for health/energy.
 */
export function ValueStepper({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  label,
  size = 'md',
  disabled = false,
  hideValue = false,
  formatValue,
  colorValue = false,
  colorVariant = 'default',
  enableHoldRepeat = false,
  variant = 'default',
  className,
  decrementTitle = 'Decrease',
  incrementTitle = 'Increase',
}: ValueStepperProps) {
  const canDecrement = !disabled && value > min;
  const canIncrement = !disabled && value < max;

  const handleDecrement = useCallback(() => {
    if (!disabled && value > min) {
      onChange(Math.max(min, value - step));
    }
  }, [disabled, value, min, step, onChange]);

  const handleIncrement = useCallback(() => {
    if (!disabled && value < max) {
      onChange(Math.min(max, value + step));
    }
  }, [disabled, value, max, step, onChange]);

  // Hold-to-repeat handlers
  const decrementHold = useHoldRepeat(handleDecrement, enableHoldRepeat && canDecrement);
  const incrementHold = useHoldRepeat(handleIncrement, enableHoldRepeat && canIncrement);

  // Determine value state for coloring
  const valueState: 'positive' | 'negative' | 'neutral' | 'health' | 'energy' = 
    colorVariant === 'health' ? 'health' :
    colorVariant === 'energy' ? 'energy' :
    colorValue 
      ? value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral'
      : 'neutral';

  // Button color classes based on colorVariant
  const getDecrementButtonClass = () => {
    if (colorVariant === 'health') return 'bg-red-200 hover:bg-red-300 text-red-700';
    if (colorVariant === 'energy') return 'bg-blue-200 hover:bg-blue-300 text-blue-700';
    return 'btn-stepper btn-stepper-danger';
  };

  const getIncrementButtonClass = () => {
    if (colorVariant === 'health') return 'bg-red-200 hover:bg-red-300 text-red-700';
    if (colorVariant === 'energy') return 'bg-blue-200 hover:bg-blue-300 text-blue-700';
    return 'btn-stepper btn-stepper-success';
  };

  // Format the display value
  const displayValue = formatValue ? formatValue(value) : String(value);

  // Container classes based on variant
  const containerClasses = cn(
    'flex items-center',
    variant === 'default' && 'gap-2',
    variant === 'inline' && 'gap-1',
    variant === 'compact' && 'gap-0.5',
    className
  );

  // Label size classes
  const labelClasses = cn(
    'font-medium text-text-secondary',
    size === 'sm' && 'text-xs',
    size === 'md' && 'text-sm',
    size === 'lg' && 'text-base',
    size === 'xl' && 'text-lg'
  );

  return (
    <div className={containerClasses}>
      {label && <span className={labelClasses}>{label}</span>}
      
      {/* Decrement button */}
      <button
        type="button"
        onClick={enableHoldRepeat ? undefined : handleDecrement}
        onMouseDown={enableHoldRepeat ? decrementHold.start : undefined}
        onMouseUp={enableHoldRepeat ? decrementHold.stop : undefined}
        onMouseLeave={enableHoldRepeat ? decrementHold.stop : undefined}
        onTouchStart={enableHoldRepeat ? decrementHold.start : undefined}
        onTouchEnd={enableHoldRepeat ? decrementHold.stop : undefined}
        disabled={!canDecrement}
        title={decrementTitle}
        aria-label={decrementTitle}
        className={cn(
          stepperButtonVariants({ size }),
          getDecrementButtonClass()
        )}
      >
        −
      </button>

      {/* Value display */}
      {!hideValue && (
        <span className={valueDisplayVariants({ size, valueState })}>
          {displayValue}
        </span>
      )}

      {/* Increment button */}
      <button
        type="button"
        onClick={enableHoldRepeat ? undefined : handleIncrement}
        onMouseDown={enableHoldRepeat ? incrementHold.start : undefined}
        onMouseUp={enableHoldRepeat ? incrementHold.stop : undefined}
        onMouseLeave={enableHoldRepeat ? incrementHold.stop : undefined}
        onTouchStart={enableHoldRepeat ? incrementHold.start : undefined}
        onTouchEnd={enableHoldRepeat ? incrementHold.stop : undefined}
        disabled={!canIncrement}
        title={incrementTitle}
        aria-label={incrementTitle}
        className={cn(
          stepperButtonVariants({ size }),
          getIncrementButtonClass()
        )}
      >
        +
      </button>
    </div>
  );
}

ValueStepper.displayName = 'ValueStepper';

// =============================================================================
// Standalone Stepper Buttons for Custom Layouts
// =============================================================================

export interface StepperButtonProps {
  /** Click handler */
  onClick: () => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Button title for accessibility */
  title?: string;
  /** Enable hold-to-repeat */
  enableHoldRepeat?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Standalone decrement button for custom layouts.
 * Use when you need the stepper buttons but want custom value display between them.
 */
export function DecrementButton({
  onClick,
  disabled = false,
  size = 'md',
  title = 'Decrease',
  enableHoldRepeat = false,
  className,
}: StepperButtonProps) {
  const holdRepeat = useHoldRepeat(onClick, enableHoldRepeat && !disabled);

  return (
    <button
      type="button"
      onClick={enableHoldRepeat ? undefined : onClick}
      onMouseDown={enableHoldRepeat ? holdRepeat.start : undefined}
      onMouseUp={enableHoldRepeat ? holdRepeat.stop : undefined}
      onMouseLeave={enableHoldRepeat ? holdRepeat.stop : undefined}
      onTouchStart={enableHoldRepeat ? holdRepeat.start : undefined}
      onTouchEnd={enableHoldRepeat ? holdRepeat.stop : undefined}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={cn(
        stepperButtonVariants({ size }),
        'btn-stepper btn-stepper-danger',
        className
      )}
    >
      −
    </button>
  );
}

/**
 * Standalone increment button for custom layouts.
 * Use when you need the stepper buttons but want custom value display between them.
 */
export function IncrementButton({
  onClick,
  disabled = false,
  size = 'md',
  title = 'Increase',
  enableHoldRepeat = false,
  className,
}: StepperButtonProps) {
  const holdRepeat = useHoldRepeat(onClick, enableHoldRepeat && !disabled);

  return (
    <button
      type="button"
      onClick={enableHoldRepeat ? undefined : onClick}
      onMouseDown={enableHoldRepeat ? holdRepeat.start : undefined}
      onMouseUp={enableHoldRepeat ? holdRepeat.stop : undefined}
      onMouseLeave={enableHoldRepeat ? holdRepeat.stop : undefined}
      onTouchStart={enableHoldRepeat ? holdRepeat.start : undefined}
      onTouchEnd={enableHoldRepeat ? holdRepeat.stop : undefined}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={cn(
        stepperButtonVariants({ size }),
        'btn-stepper btn-stepper-success',
        className
      )}
    >
      +
    </button>
  );
}
