/**
 * QuantitySelector Component
 * ==========================
 * Unified quantity +/- controls for equipment, items, etc.
 * Uses the same `.btn-stepper` chrome as ValueStepper (TASK-468).
 *
 * Used by:
 * - GridListRow (when quantity prop provided)
 * - UnifiedSelectionModal (for equipment selection — quantity-first)
 * - AddLibraryItemModal (for adding equipment)
 * - LibrarySection (for equipment quantity editing)
 */

'use client';

import { cn } from '@/lib/utils';

export interface QuantitySelectorProps {
  /** Current quantity value */
  quantity: number;
  /** Called when quantity changes */
  onChange: (value: number) => void;
  /** Minimum allowed value (default: 1) */
  min?: number;
  /** Maximum allowed value (default: 99) */
  max?: number;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Whether to show the quantity even when it's 1 */
  showWhenOne?: boolean;
  /** Additional class names */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Accessible name for decrement (default: Decrease quantity) */
  decrementLabel?: string;
  /** Accessible name for increment (default: Increase quantity) */
  incrementLabel?: string;
}

export function QuantitySelector({
  quantity,
  onChange,
  min = 1,
  max = 99,
  size = 'md',
  showWhenOne = true,
  className,
  disabled = false,
  decrementLabel = 'Decrease quantity',
  incrementLabel = 'Increase quantity',
}: QuantitySelectorProps) {
  // Touch targets min 44px on mobile (below md), compact on desktop per MOBILE_UX.md
  const sizeClasses = {
    sm: {
      button: 'min-w-[var(--touch-target-min,44px)] min-h-[var(--touch-target-min,44px)] w-11 h-11 md:min-w-0 md:min-h-0 md:w-5 md:h-5 text-xs',
      text: 'w-6 text-xs',
    },
    md: {
      button: 'min-w-[var(--touch-target-min,44px)] min-h-[var(--touch-target-min,44px)] w-11 h-11 md:min-w-0 md:min-h-0 md:w-6 md:h-6 text-sm',
      text: 'w-8 text-sm',
    },
  };

  const sizes = sizeClasses[size];

  // Don't render if quantity is 1 and showWhenOne is false
  if (!showWhenOne && quantity === 1) {
    return null;
  }

  return (
    <div
      className={cn('flex items-center gap-1', className)}
      onClick={(e) => e.stopPropagation()}
      role="group"
      aria-label="Quantity"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onChange(Math.max(min, quantity - 1));
        }}
        disabled={disabled || quantity <= min}
        className={cn('btn-stepper', sizes.button)}
        title={decrementLabel}
        aria-label={decrementLabel}
      >
        −
      </button>
      <span
        className={cn(
          'text-center font-medium text-text-primary tabular-nums',
          sizes.text
        )}
        aria-live="polite"
      >
        {quantity}
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onChange(Math.min(max, quantity + 1));
        }}
        disabled={disabled || quantity >= max}
        className={cn('btn-stepper', sizes.button)}
        title={incrementLabel}
        aria-label={incrementLabel}
      >
        +
      </button>
    </div>
  );
}

/**
 * QuantityBadge - Display-only quantity indicator
 * Shows "×N" format, hidden when quantity is 1
 */
export interface QuantityBadgeProps {
  quantity: number;
  className?: string;
}

export function QuantityBadge({ quantity, className }: QuantityBadgeProps) {
  if (quantity <= 1) return null;

  return (
    <span className={cn('text-xs text-text-muted dark:text-text-secondary', className)}>
      ×{quantity}
    </span>
  );
}

export default QuantitySelector;
