/**
 * QuantitySelector Component
 * ==========================
 * Thin quantity wrapper over ValueStepper (ADR-0002 / TASK-487).
 * Same chrome as all other ± controls; adds stopPropagation for list-row use
 * and quantity-specific a11y labels.
 *
 * Used by:
 * - GridListRow (when quantity prop provided)
 * - UnifiedSelectionModal (quantity-first selection)
 * - AddLibraryItemModal / LibrarySection equipment quantity
 */

'use client';

import { cn } from '@/lib/utils';
import { ValueStepper } from './value-stepper';

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
  if (!showWhenOne && quantity === 1) {
    return null;
  }

  return (
    <div
      className={cn(className)}
      onClick={(e) => e.stopPropagation()}
      role="group"
      aria-label="Quantity"
    >
      <ValueStepper
        value={quantity}
        onChange={onChange}
        min={min}
        max={max}
        size={size}
        disabled={disabled}
        variant="inline"
        decrementTitle={decrementLabel}
        incrementTitle={incrementLabel}
      />
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

  return <span className={cn('text-xs text-text-muted', className)}>×{quantity}</span>;
}
