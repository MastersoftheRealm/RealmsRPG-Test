'use client';

/**
 * Temp Modifier Toggle
 * ====================
 * SlidersHorizontal control to open/close Temp adjust chrome on a section or
 * header stat (ADR-0006 / TASK-782). Sibling to EditSectionToggle — sheet-level
 * Edit vs Temp stays exclusive; do not pair them on the same section.
 * Tint matches the value: none = blue, positive = gold, negative = danger.
 * UI convenience label; not a GAME_RULES term.
 */

import { SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { TempModifierTint } from '@/lib/character/temp-modifiers';

export interface TempModifierToggleProps {
  onClick?: (() => void) | undefined;
  isActive?: boolean | undefined;
  /** Signed tint for persisted temps on this control (none = blue). */
  tint?: TempModifierTint | undefined;
  title?: string | undefined;
  className?: string | undefined;
}

const TINT_COLORS: Record<
  TempModifierTint,
  {
    icon: string;
    glow?: string | undefined;
    activeBg: string;
    activeRing: string;
    activeGlow?: string | undefined;
  }
> = {
  none: {
    icon: 'text-primary-fg hover:text-primary-fg-hover',
    activeBg: 'bg-primary-subtle-bg',
    activeRing: 'ring-primary-subtle-border dark:ring-primary-subtle-border',
  },
  positive: {
    icon: 'text-warning-fg hover:opacity-90',
    glow: 'drop-shadow-[0_0_3px_rgba(245,158,11,0.45)]',
    activeBg: 'bg-warning-50 dark:bg-warning-900/25',
    activeRing: 'ring-warning-200 dark:ring-warning-800/50',
    activeGlow: 'drop-shadow-[0_0_6px_rgba(245,158,11,0.35)]',
  },
  negative: {
    icon: 'text-danger-fg hover:opacity-90',
    glow: 'drop-shadow-[0_0_3px_rgba(239,68,68,0.5)]',
    activeBg: 'bg-danger-50 dark:bg-danger-900/25',
    activeRing: 'ring-danger-200 dark:ring-danger-800/50',
    activeGlow: 'drop-shadow-[0_0_6px_rgba(239,68,68,0.35)]',
  },
};

export function TempModifierToggle({
  onClick,
  isActive = false,
  tint = 'none',
  title = 'Temp Modifier',
  className,
}: TempModifierToggleProps) {
  const colors = TINT_COLORS[tint];

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={cn(
        'touch-target-md-compact inline-flex items-center justify-center',
        'rounded-md p-1 md:p-0.5',
        'duration-base transition-all ease-standard',
        'max-md:hover:scale-110',
        'focus-visible:ring-2 focus-visible:ring-primary-outline-border/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none',
        colors.icon,
        !isActive && colors.glow,
        isActive && [
          'ring-1',
          colors.activeRing,
          colors.activeGlow,
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
      <SlidersHorizontal className="h-4 w-4" />
    </button>
  );
}
