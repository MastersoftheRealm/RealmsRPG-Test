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
  normal: {
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
        // 44px on mobile/touch; icon-hugging on desktop (MOBILE_UX.md — do not inflate md+ chrome)
        'touch-target-md-compact inline-flex items-center justify-center',
        'rounded-md p-1 md:p-0.5',
        'duration-base transition-all ease-standard',
        // Grow only on touch viewports; desktop stays icon-dense (MOBILE_UX.md)
        'max-md:hover:scale-110',
        'focus-visible:ring-2 focus-visible:ring-primary-outline-border/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none',
        colors.icon,
        colors.glow,
        isActive && [
          'ring-1',
          colors.activeRing,
          colors.activeGlow,
          // Filled active plate only below md
          'max-md:scale-110',
          colors.activeBg,
          'md:bg-transparent',
        ],
        onClick && 'cursor-pointer',
        !onClick && 'cursor-default',
        className,
      )}
      title={title}
      aria-label={title}
      aria-pressed={isActive}
    >
      <Pencil className="h-4 w-4" />
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
