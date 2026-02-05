'use client';

/**
 * EquipToggle - Equipment Equipped State Toggle
 * =============================================
 * A visual toggle for equipping/unequipping armor and weapons.
 * Uses a circle icon: unfilled when unequipped, filled when equipped.
 * 
 * Design: Clean circle indicator that fills to show equipped state
 * Smooth animation between states
 */

import { Circle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EquipToggleProps {
  /** Whether the item is currently equipped */
  isEquipped: boolean;
  /** Callback when toggle is clicked */
  onToggle: () => void;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
  /** Accessible label */
  label?: string;
}

const SIZE_STYLES = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
};

const ICON_SIZES = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export function EquipToggle({
  isEquipped,
  onToggle,
  disabled = false,
  size = 'md',
  className,
  label,
}: EquipToggleProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onToggle();
      }}
      disabled={disabled}
      aria-label={label || (isEquipped ? 'Unequip' : 'Equip')}
      aria-pressed={isEquipped}
      className={cn(
        'flex items-center justify-center transition-all duration-200 ease-out',
        SIZE_STYLES[size],
        isEquipped
          ? 'text-success-600'
          : 'text-text-muted hover:text-primary-600',
        disabled && 'opacity-40 cursor-not-allowed',
        className
      )}
    >
      <span
        className={cn(
          'transition-all duration-200 ease-out',
          isEquipped ? 'scale-110' : 'scale-100 hover:scale-110'
        )}
      >
        {isEquipped ? (
          <CheckCircle2 className={cn(ICON_SIZES[size], 'fill-current')} />
        ) : (
          <Circle className={cn(ICON_SIZES[size], 'stroke-[1.5]')} />
        )}
      </span>
    </button>
  );
}

export default EquipToggle;
