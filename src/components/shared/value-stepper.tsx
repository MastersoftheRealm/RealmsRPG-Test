/**
 * ValueStepper Component
 * ======================
 * Unified increment/decrement control used across the entire site.
 * Replaces various inline +/- button patterns with a consistent component.
 * 
 * Used in:
 * - Character Sheet: ability editing, skill values, defense skills
 * - Character Creator: ability allocation, skill points
 * - Creature Creator: stats, quantities
 * - All creators: level selection, quantities
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
 * // Show only buttons, hide value (for custom display)
 * <ValueStepper value={5} onChange={setValue} hideValue />
 */

'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const stepperButtonVariants = cva(
  // Base button styles
  'flex items-center justify-center font-bold rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      size: {
        sm: 'w-6 h-6 text-sm',
        md: 'w-8 h-8 text-base',
        lg: 'w-10 h-10 text-lg',
        xl: 'w-12 h-12 text-xl',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const valueDisplayVariants = cva(
  'text-center font-semibold tabular-nums',
  {
    variants: {
      size: {
        sm: 'min-w-[24px] text-sm',
        md: 'min-w-[32px] text-base',
        lg: 'min-w-[40px] text-lg',
        xl: 'min-w-[48px] text-xl',
      },
      valueState: {
        positive: 'text-success-700',
        negative: 'text-danger-700',
        neutral: 'text-text-primary',
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
  variant = 'default',
  className,
  decrementTitle = 'Decrease',
  incrementTitle = 'Increase',
}: ValueStepperProps) {
  const canDecrement = !disabled && value > min;
  const canIncrement = !disabled && value < max;

  const handleDecrement = () => {
    if (canDecrement) {
      onChange(Math.max(min, value - step));
    }
  };

  const handleIncrement = () => {
    if (canIncrement) {
      onChange(Math.min(max, value + step));
    }
  };

  // Determine value state for coloring
  const valueState: 'positive' | 'negative' | 'neutral' = 
    colorValue 
      ? value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral'
      : 'neutral';

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
        onClick={handleDecrement}
        disabled={!canDecrement}
        title={decrementTitle}
        aria-label={decrementTitle}
        className={cn(
          stepperButtonVariants({ size }),
          'btn-stepper btn-stepper-danger'
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
        onClick={handleIncrement}
        disabled={!canIncrement}
        title={incrementTitle}
        aria-label={incrementTitle}
        className={cn(
          stepperButtonVariants({ size }),
          'btn-stepper btn-stepper-success'
        )}
      >
        +
      </button>
    </div>
  );
}

ValueStepper.displayName = 'ValueStepper';
