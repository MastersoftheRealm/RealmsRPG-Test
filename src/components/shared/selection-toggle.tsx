'use client';

/**
 * SelectionToggle - Unified Add/Select Button
 * ============================================
 * A consistent selection toggle used across the entire site:
 * - Character sheet modals (add feats, skills, powers, etc.)
 * - Character creator (select ancestry traits, equipment, etc.)
 * - Creature creator (select abilities, powers, etc.)
 * 
 * Design: Light blue + icon → Light green check when selected
 * Smooth animation between states for polished feel
 */

import { Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectionToggleProps {
  /** Whether the item is currently selected */
  isSelected: boolean;
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
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

const ICON_SIZES = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function SelectionToggle({
  isSelected,
  onToggle,
  disabled = false,
  size = 'md',
  className,
  label,
}: SelectionToggleProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onToggle();
      }}
      disabled={disabled}
      aria-label={label || (isSelected ? 'Remove selection' : 'Add selection')}
      aria-pressed={isSelected}
      className={cn(
        'rounded-full flex items-center justify-center transition-all duration-200 ease-out',
        SIZE_STYLES[size],
        isSelected
          ? 'bg-success-500 text-white shadow-sm scale-105'
          : 'bg-primary-100 text-primary-600 hover:bg-primary-200 hover:scale-105',
        disabled && 'opacity-50 cursor-not-allowed hover:scale-100',
        className
      )}
    >
      <span
        className={cn(
          'transition-transform duration-200',
          isSelected ? 'rotate-0' : 'rotate-0'
        )}
      >
        {isSelected ? (
          <Check className={cn(ICON_SIZES[size], 'stroke-[3]')} />
        ) : (
          <Plus className={cn(ICON_SIZES[size], 'stroke-[2.5]')} />
        )}
      </span>
    </button>
  );
}

export default SelectionToggle;
