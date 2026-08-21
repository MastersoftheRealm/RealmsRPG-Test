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
  disabled?: boolean | undefined;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | undefined;
  /** Additional className */
  className?: string | undefined;
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
        'flex min-h-[44px] min-w-[44px] items-center justify-center',
        'rounded-lg transition-all',
        // Size-specific styles for the visual icon
        sizeClasses[size],
        // Innate state
        isInnate
          ? 'text-power-fg hover:bg-power-light hover:text-power-fg active:bg-power-light'
          : 'text-text-muted hover:bg-power-light hover:text-power-fg active:bg-power-light',
        // Disabled state
        disabled && 'cursor-not-allowed opacity-50 hover:bg-transparent',
        className,
      )}
      title={isInnate ? 'Remove from innate' : 'Set as innate'}
      aria-label={isInnate ? 'Remove from innate powers' : 'Mark as innate power'}
      aria-pressed={isInnate}
    >
      {isInnate ? '★' : '☆'}
    </button>
  );
}
