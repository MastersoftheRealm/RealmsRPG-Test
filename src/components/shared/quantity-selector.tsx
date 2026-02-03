/**
 * QuantitySelector Component
 * ==========================
 * Unified quantity +/- controls for equipment, items, etc.
 * 
 * Used by:
 * - GridListRow (when quantity prop provided)
 * - UnifiedSelectionModal (for equipment selection)
 * - AddLibraryItemModal (for adding equipment)
 * - LibrarySection (for equipment quantity editing)
 */

'use client';

import { cn } from '@/lib/utils';
import { Minus, Plus } from 'lucide-react';

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
}: QuantitySelectorProps) {
  const sizeClasses = {
    sm: {
      button: 'w-5 h-5 text-xs',
      text: 'w-6 text-xs',
      icon: 'w-2.5 h-2.5',
    },
    md: {
      button: 'w-6 h-6 text-sm',
      text: 'w-8 text-sm',
      icon: 'w-3 h-3',
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
    >
      <button
        type="button"
        onClick={(e) => { 
          e.stopPropagation(); 
          onChange(Math.max(min, quantity - 1)); 
        }}
        disabled={disabled || quantity <= min}
        className={cn(
          'rounded-full flex items-center justify-center font-bold transition-colors',
          sizes.button,
          !disabled && quantity > min
            ? 'bg-surface-alt hover:bg-border-light text-text-secondary'
            : 'bg-surface text-text-muted cursor-not-allowed'
        )}
        title="Decrease quantity"
      >
        <Minus className={sizes.icon} />
      </button>
      <span className={cn(
        'text-center font-medium text-text-primary',
        sizes.text
      )}>
        {quantity}
      </span>
      <button
        type="button"
        onClick={(e) => { 
          e.stopPropagation(); 
          onChange(Math.min(max, quantity + 1)); 
        }}
        disabled={disabled || quantity >= max}
        className={cn(
          'rounded-full flex items-center justify-center font-bold transition-colors',
          sizes.button,
          !disabled && quantity < max
            ? 'bg-surface-alt hover:bg-border-light text-text-secondary'
            : 'bg-surface text-text-muted cursor-not-allowed'
        )}
        title="Increase quantity"
      >
        <Plus className={sizes.icon} />
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
    <span className={cn('text-xs text-text-muted', className)}>
      ×{quantity}
    </span>
  );
}

export default QuantitySelector;
