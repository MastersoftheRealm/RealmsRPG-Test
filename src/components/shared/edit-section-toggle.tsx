'use client';

/**
 * Edit Section Toggle Component
 * ==============================
 * Blue pencil icon indicator for editable sections in edit mode.
 * Matches vanilla site behavior with color-coded states.
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
  /** Whether the section is actively being edited */
  isActive?: boolean;
}

const STATE_COLORS: Record<EditState, { icon: string; glow?: string }> = {
  'normal': {
    icon: 'text-blue-500',
  },
  'has-points': {
    icon: 'text-green-500',
    glow: 'drop-shadow-[0_0_3px_rgba(34,197,94,0.5)]',
  },
  'over-budget': {
    icon: 'text-red-500',
    glow: 'drop-shadow-[0_0_3px_rgba(239,68,68,0.5)]',
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
        'p-1 rounded-full transition-all duration-200 hover:scale-110',
        colors.icon,
        colors.glow,
        isActive && 'bg-blue-100 ring-2 ring-blue-300',
        onClick && 'cursor-pointer hover:bg-blue-50',
        !onClick && 'cursor-default',
        className
      )}
      title={title}
      aria-label={title}
    >
      <Pencil className="w-5 h-5" />
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
