'use client';

/**
 * SelectionToggle - Unified Add/Select Button
 * ============================================
 * A consistent selection toggle used across the entire site:
 * - Character sheet modals (add feats, skills, powers, etc.)
 * - Character creator (select ancestry traits, equipment, etc.)
 * - Creature creator (select abilities, powers, etc.)
 * 
 * Design: Sleek backgroundless + icon → Green check when selected
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
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
};

const ICON_SIZES = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
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
        'flex items-center justify-center transition-all duration-200 ease-out',
        SIZE_STYLES[size],
        isSelected
          ? 'text-success-600'
          : 'text-text-muted hover:text-primary-600',
        disabled && 'opacity-40 cursor-not-allowed',
        className
      )}
    >
      <span
        className={cn(
          'transition-all duration-200 ease-out',
          isSelected ? 'scale-110' : 'scale-100 hover:scale-110'
        )}
      >
        {isSelected ? (
          <Check className={cn(ICON_SIZES[size], 'stroke-[2.5]')} />
        ) : (
          <Plus className={cn(ICON_SIZES[size], 'stroke-[2]')} />
        )}
      </span>
    </button>
  );
}

export default SelectionToggle;
