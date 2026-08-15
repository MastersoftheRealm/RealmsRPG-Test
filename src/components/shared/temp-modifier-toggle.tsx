'use client';

/**
 * Temp Modifier Toggle
 * ====================
 * SlidersHorizontal control for Temp Modifier mode (ADR-0006 / TASK-585).
 * Sibling to EditSectionToggle — use SectionDualModeToggles for the dual pattern.
 * UI convenience label; not a GAME_RULES term.
 * (Lucide PlusMinus not in current package — SlidersHorizontal is the approved family.)
 */

import { SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface TempModifierToggleProps {
  /** Click handler */
  onClick?: () => void;
  /** Whether Temp Modifier adjust mode is active */
  isActive?: boolean;
  /** True when this section has any non-zero persisted temp deltas */
  hasModifiers?: boolean;
  /** Tooltip / accessible name */
  title?: string;
  className?: string;
}

export function TempModifierToggle({
  onClick,
  isActive = false,
  hasModifiers = false,
  title = 'Temp Modifier',
  className,
}: TempModifierToggleProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={cn(
        // 44px on mobile/touch; icon-hugging on desktop (MOBILE_UX.md)
        'touch-target-md-compact inline-flex items-center justify-center',
        'rounded-md p-1 md:p-0.5',
        'duration-base transition-all ease-standard',
        'max-md:hover:scale-110',
        'focus-visible:ring-2 focus-visible:ring-primary-outline-border/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none',
        hasModifiers || isActive
          ? 'text-warning-fg hover:opacity-90'
          : 'text-primary-fg hover:text-primary-fg-hover',
        hasModifiers && !isActive && 'drop-shadow-[0_0_3px_rgba(245,158,11,0.45)]',
        isActive && [
          'ring-1 ring-warning-200 dark:ring-warning-800/50',
          'drop-shadow-[0_0_6px_rgba(245,158,11,0.35)]',
          'max-md:scale-110',
          'max-md:bg-warning-50 dark:max-md:bg-warning-900/25',
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
