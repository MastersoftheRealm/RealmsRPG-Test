/**
 * Innate Toggle Component
 * =======================
 * A dedicated toggle button for marking powers/techniques as innate.
 * Provides consistent styling, proper hit area (min 44x44px for touch),
 * and accessibility features across the app.
 */

'use client';

import { cn } from '@/lib/utils';

export interface InnateToggleProps {
  /** Whether the item is currently marked as innate */
  isInnate: boolean;
  /** Callback when toggle is clicked */
  onToggle: () => void;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-lg',
  md: 'w-10 h-10 text-xl',
  lg: 'w-12 h-12 text-2xl',
};

export function InnateToggle({
  isInnate,
  onToggle,
  disabled = false,
  size = 'md',
  className,
}: InnateToggleProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) {
          onToggle();
        }
      }}
      disabled={disabled}
      className={cn(
        // Base styles - ensures minimum 44px touch target even for sm size
        'min-w-[44px] min-h-[44px] flex items-center justify-center',
        'rounded-lg transition-all',
        // Size-specific styles for the visual icon
        sizeClasses[size],
        // Innate state
        isInnate
          ? 'text-violet-500 hover:text-violet-600 hover:bg-violet-50 active:bg-violet-100'
          : 'text-text-muted hover:text-violet-500 hover:bg-violet-50 active:bg-violet-100',
        // Disabled state
        disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent',
        className
      )}
      title={isInnate ? 'Remove from innate' : 'Set as innate'}
      aria-label={isInnate ? 'Remove from innate powers' : 'Mark as innate power'}
      aria-pressed={isInnate}
    >
      {isInnate ? '★' : '☆'}
    </button>
  );
}
