'use client';

/**
 * Edit Section Toggle Component
 * ==============================
 * Simple pencil icon indicator for editable sections.
 * Matches vanilla site behavior with color-coded states.
 * Subtle active-state styling so it's obvious when a section is being edited.
 * 
 * States:
 * - normal (blue): Standard editable section
 * - has-points (green): Has remaining points to spend
 * - over-budget (red): Over budget
 */

import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type EditState = 'normal' | 'has-points' | 'over-budget';

interface EditSectionToggleProps {
  /** Click handler for the pencil icon */
  onClick?: () => void;
  /** Current edit state determines color */
  state?: EditState;
  /** Tooltip/title text */
  title?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether the section is actively being edited (adds subtle glow) */
  isActive?: boolean;
}

const STATE_COLORS: Record<
  EditState,
  { icon: string; glow?: string; activeBg: string; activeRing: string; activeGlow?: string }
> = {
  'normal': {
    icon: 'text-primary-fg hover:text-primary-fg-hover',
    activeBg: 'bg-primary-subtle-bg',
    activeRing: 'ring-primary-subtle-border dark:ring-primary-subtle-border',
  },
  'has-points': {
    icon: 'text-success-fg hover:opacity-90',
    glow: 'drop-shadow-[0_0_3px_rgba(34,197,94,0.5)]',
    activeBg: 'bg-success-50 dark:bg-success-900/25',
    activeRing: 'ring-success-200 dark:ring-success-800/50',
    activeGlow: 'drop-shadow-[0_0_6px_rgba(34,197,94,0.35)]',
  },
  'over-budget': {
    icon: 'text-danger-fg hover:opacity-90',
    glow: 'drop-shadow-[0_0_3px_rgba(239,68,68,0.5)]',
    activeBg: 'bg-danger-50 dark:bg-danger-900/25',
    activeRing: 'ring-danger-200 dark:ring-danger-800/50',
    activeGlow: 'drop-shadow-[0_0_6px_rgba(239,68,68,0.35)]',
  },
};

export function EditSectionToggle({
  onClick,
  state = 'normal',
  title = 'Edit this section',
  className,
  isActive = false,
}: EditSectionToggleProps) {
  const colors = STATE_COLORS[state];
  
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={cn(
        'min-w-[var(--touch-target-min,44px)] min-h-[var(--touch-target-min,44px)]',
        'flex items-center justify-center p-2 rounded-md',
        'transition-all duration-base ease-standard',
        'hover:scale-110',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-outline-border/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
        colors.icon,
        colors.glow,
        isActive && [
          'scale-110',
          'ring-1',
          colors.activeRing,
          colors.activeBg,
          colors.activeGlow,
        ],
        onClick && 'cursor-pointer',
        !onClick && 'cursor-default',
        className
      )}
      title={title}
      aria-label={title}
      aria-pressed={isActive}
    >
      <Pencil className="w-4 h-4" />
    </button>
  );
}

/**
 * Helper function to determine edit state based on points
 */
export function getEditState(spent: number, total: number): EditState {
  const remaining = total - spent;
  if (remaining < 0) return 'over-budget';
  if (remaining > 0) return 'has-points';
  return 'normal';
}
