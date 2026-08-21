/**
 * ValueStepper Component
 * ======================
 * Unified increment/decrement control used across the entire site (ADR-0002).
 * Visual chrome matches guided creator skills bonus steppers: soft surface-alt,
 * no invasive border, rounded-lg, bold ± glyphs.
 *
 * Features:
 * - Hold-to-repeat with exponential acceleration (Pointer Events; touch-safe)
 * - Size / layout variants only — button chrome is always neutral
 * - Optional value coloring (health / energy / signed bonus) — not button tints
 *
 * Prefer this + DecrementButton / IncrementButton. For quantities in list rows,
 * use QuantitySelector (thin wrapper). Do not hand-roll ± buttons.
 *
 * @example
 * <ValueStepper value={5} onChange={setValue} />
 * <ValueStepper value={3} onChange={setValue} formatValue={v => v >= 0 ? `+${v}` : `${v}`} colorValue />
 * <ValueStepper value={hp} onChange={setHp} colorVariant="health" enableHoldRepeat />
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
 * Hold-to-repeat with exponential acceleration.
 * Single tap = one step (initial delay before repeat). Hold = repeat after delay, then accelerating intervals.
 */
function useHoldRepeat(
  callback: () => void,
  enabled: boolean = true,
  /** Fastest interval between repeats (ms). Kept ≥80 so mobile hold stays one step at a time. */
  minDelay = 80,
  maxDelay = 220,
  /** Delay (ms) before first repeat so a quick tap only fires once. Default 450ms. */
  initialDelay = 450,
) {
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const delayRef = useRef(maxDelay);
  const isHoldingRef = useRef(false);
  const hasRepeatedRef = useRef(false);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const start = useCallback(() => {
    if (!enabled || isHoldingRef.current) return;
    isHoldingRef.current = true;
    hasRepeatedRef.current = false;
    delayRef.current = maxDelay;

    initialTimeoutRef.current = setTimeout(() => {
      initialTimeoutRef.current = null;
      hasRepeatedRef.current = true;
      callbackRef.current();
      const repeat = () => {
        if (!isHoldingRef.current) return;
        callbackRef.current();
        delayRef.current = Math.max(minDelay, delayRef.current * 0.88);
        intervalRef.current = setTimeout(repeat, delayRef.current);
      };
      intervalRef.current = setTimeout(repeat, maxDelay);
    }, initialDelay);
  }, [enabled, minDelay, maxDelay, initialDelay]);

  const stop = useCallback(() => {
    if (initialTimeoutRef.current) {
      clearTimeout(initialTimeoutRef.current);
      initialTimeoutRef.current = null;
      if (!hasRepeatedRef.current) callbackRef.current();
    }
    isHoldingRef.current = false;
    hasRepeatedRef.current = false;
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (initialTimeoutRef.current) clearTimeout(initialTimeoutRef.current);
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, []);

  return { start, stop };
}

// =============================================================================
// Variants
// =============================================================================

const stepperButtonVariants = cva(
  // ADR-0023 Dense: compact painted box always; coarse pointer expands hit
  // height (not width) so creature/skill cells are not forced to 44×44 slabs.
  // Chrome comes from `.btn-stepper` (ADR-0002) — keep sizing here only.
  'btn-stepper hit-area-dense shrink-0 touch-manipulation select-none',
  {
    variants: {
      size: {
        xs: 'h-5 w-5 text-sm',
        sm: 'h-6 w-6 text-base',
        md: 'h-8 w-8 text-lg',
        lg: 'h-10 w-10 text-xl',
        xl: 'h-12 w-12 text-2xl',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const valueDisplayVariants = cva('text-center font-semibold tabular-nums', {
  variants: {
    size: {
      xs: 'min-w-[20px] text-xs',
      sm: 'min-w-[24px] text-sm',
      md: 'min-w-[32px] text-base',
      lg: 'min-w-[40px] text-lg',
      xl: 'min-w-[48px] text-xl',
    },
    valueState: {
      positive: 'text-success-fg',
      negative: 'text-danger-fg',
      neutral: 'text-text-primary',
      health: 'text-success-fg',
      energy: 'text-info-fg',
    },
  },
  defaultVariants: {
    size: 'md',
    valueState: 'neutral',
  },
});

type StepperHold = { start: () => void; stop: () => void };

function StepperGlyphButton({
  glyph,
  onActivate,
  disabled,
  size,
  title,
  enableHoldRepeat,
  hold,
  className,
}: {
  glyph: string;
  onActivate: () => void;
  disabled: boolean;
  size?: VariantProps<typeof stepperButtonVariants>['size'] | undefined;
  title: string;
  enableHoldRepeat: boolean;
  hold: StepperHold;
  className?: string | undefined;
}) {
  return (
    <button
      type="button"
      onClick={enableHoldRepeat ? undefined : onActivate}
      onPointerDown={
        enableHoldRepeat
          ? (e) => {
              if (disabled) return;
              if (e.pointerType === 'mouse' && e.button !== 0) return;
              e.currentTarget.setPointerCapture(e.pointerId);
              hold.start();
            }
          : undefined
      }
      onPointerUp={
        enableHoldRepeat
          ? (e) => {
              try {
                e.currentTarget.releasePointerCapture(e.pointerId);
              } catch {
                /* not captured */
              }
              hold.stop();
            }
          : undefined
      }
      onPointerCancel={
        enableHoldRepeat
          ? (e) => {
              try {
                e.currentTarget.releasePointerCapture(e.pointerId);
              } catch {
                /* not captured */
              }
              hold.stop();
            }
          : undefined
      }
      onLostPointerCapture={enableHoldRepeat ? () => hold.stop() : undefined}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={cn(stepperButtonVariants({ size }), className)}
    >
      {glyph}
    </button>
  );
}

export interface ValueStepperProps extends VariantProps<typeof stepperButtonVariants> {
  /** Current value */
  value: number;
  /** Change handler */
  onChange: (value: number) => void;
  /** Minimum allowed value */
  min?: number | undefined;
  /** Maximum allowed value */
  max?: number | undefined;
  /** Step amount per increment/decrement */
  step?: number | undefined;
  /** Optional label displayed before the stepper */
  label?: string | undefined;
  /** Whether to disable the stepper */
  disabled?: boolean | undefined;
  /** Whether to hide the value display (for custom layouts) */
  hideValue?: boolean | undefined;
  /** Custom value formatter (e.g., for +/- display) */
  formatValue?: ((value: number) => string) | undefined;
  /** Color the value based on positive/negative */
  colorValue?: boolean | undefined;
  /**
   * Colors the **value** text for health/energy contexts.
   * Buttons always use neutral `.btn-stepper` chrome (ADR-0002).
   */
  colorVariant?: 'default' | 'health' | 'energy' | undefined;
  /** Enable hold-to-repeat with exponential acceleration (HP/EN pools only) */
  enableHoldRepeat?: boolean | undefined;
  /** Layout density */
  variant?: 'default' | 'inline' | 'compact' | undefined;
  /** Additional class name */
  className?: string | undefined;
  /** Title for decrement button */
  decrementTitle?: string | undefined;
  /** Title for increment button */
  incrementTitle?: string | undefined;
}

/**
 * Unified value stepper. Buttons always use shared neutral chrome.
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

  const decrementHold = useHoldRepeat(handleDecrement, enableHoldRepeat && canDecrement);
  const incrementHold = useHoldRepeat(handleIncrement, enableHoldRepeat && canIncrement);

  const valueState: 'positive' | 'negative' | 'neutral' | 'health' | 'energy' =
    colorVariant === 'health'
      ? 'health'
      : colorVariant === 'energy'
        ? 'energy'
        : colorValue
          ? value > 0
            ? 'positive'
            : value < 0
              ? 'negative'
              : 'neutral'
          : 'neutral';

  const displayValue = formatValue ? formatValue(value) : String(value);

  const containerClasses = cn(
    'flex items-center',
    variant === 'default' && 'gap-2',
    variant === 'inline' && 'gap-1',
    variant === 'compact' && 'gap-0.5',
    className,
  );

  const labelClasses = cn(
    'font-medium text-text-secondary',
    size === 'sm' && 'text-xs',
    size === 'md' && 'text-sm',
    size === 'lg' && 'text-base',
    size === 'xl' && 'text-lg',
  );

  return (
    <div className={containerClasses}>
      {label && <span className={labelClasses}>{label}</span>}

      <StepperGlyphButton
        glyph="−"
        onActivate={handleDecrement}
        disabled={!canDecrement}
        size={size}
        title={decrementTitle}
        enableHoldRepeat={enableHoldRepeat}
        hold={decrementHold}
      />

      {!hideValue && (
        <span className={valueDisplayVariants({ size, valueState })} aria-live="polite">
          {displayValue}
        </span>
      )}

      <StepperGlyphButton
        glyph="+"
        onActivate={handleIncrement}
        disabled={!canIncrement}
        size={size}
        title={incrementTitle}
        enableHoldRepeat={enableHoldRepeat}
        hold={incrementHold}
      />
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
  disabled?: boolean | undefined;
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | undefined;
  /** Button title for accessibility */
  title?: string | undefined;
  /** Enable hold-to-repeat (HP/EN pools only) */
  enableHoldRepeat?: boolean | undefined;
  /** Additional className */
  className?: string | undefined;
}

/**
 * Standalone decrement button for custom layouts (e.g. bonus display between ±).
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
    <StepperGlyphButton
      glyph="−"
      onActivate={onClick}
      disabled={disabled}
      size={size}
      title={title}
      enableHoldRepeat={enableHoldRepeat}
      hold={holdRepeat}
      className={className}
    />
  );
}

/**
 * Standalone increment button for custom layouts (e.g. bonus display between ±).
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
    <StepperGlyphButton
      glyph="+"
      onActivate={onClick}
      disabled={disabled}
      size={size}
      title={title}
      enableHoldRepeat={enableHoldRepeat}
      hold={holdRepeat}
      className={className}
    />
  );
}
