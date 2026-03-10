'use client';

/**
 * HubListRow — Unified list row for hub pages (Encounters, Crafting, etc.)
 * ==========================================================================
 * Single source of truth for the "icon + title + badge + subtitle + actions" row pattern.
 * Use for any clickable list row with optional delete and consistent styling.
 */

import { type ReactNode } from 'react';
import { ChevronRight, Trash2 } from 'lucide-react';
import { IconButton } from '@/components/ui';
import { cn } from '@/lib/utils';

const ROW_BASE_CLASS =
  'flex items-center gap-4 p-4 bg-surface rounded-xl border border-border-light hover:border-primary-300 transition-colors cursor-pointer group';

export interface HubListRowProps {
  /** Icon (e.g. Hammer, Brain). Rendered in iconContainerClassName box. */
  icon: ReactNode;
  /** Container for icon (e.g. bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300) */
  iconContainerClassName?: string;
  /** Row title */
  title: string;
  /** Optional badge text (e.g. status) */
  badge?: string;
  /** Badge container class (e.g. status colors) */
  badgeClassName?: string;
  /** Subtitle / meta line (e.g. "100 currency · Mar 10, 2026") */
  subtitle?: ReactNode;
  /** Optional extra line below subtitle */
  description?: ReactNode;
  /** Called when row is clicked. If undefined, row is not clickable. */
  onClick?: () => void;
  /** Delete button: aria-label and onClick. If provided, delete button is shown. */
  onDelete?: () => void;
  deleteAriaLabel?: string;
  /** Show trailing chevron (default true when onClick) */
  showChevron?: boolean;
  /** Optional right-side content instead of default delete + chevron */
  rightSlot?: ReactNode;
  className?: string;
}

export function HubListRow({
  icon,
  iconContainerClassName = 'bg-surface-alt text-text-secondary',
  title,
  badge,
  badgeClassName = 'bg-surface-alt text-text-secondary',
  subtitle,
  description,
  onClick,
  onDelete,
  deleteAriaLabel = 'Delete',
  showChevron = !!onClick,
  rightSlot,
  className,
}: HubListRowProps) {
  const clickable = typeof onClick === 'function';
  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? onClick : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={cn(ROW_BASE_CLASS, !clickable && 'cursor-default', className)}
    >
      <div
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0',
          iconContainerClassName
        )}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-text-primary truncate">{title}</h2>
          {badge != null && badge !== '' && (
            <span
              className={cn(
                'px-2 py-0.5 text-xs rounded-full font-medium',
                badgeClassName
              )}
            >
              {badge}
            </span>
          )}
        </div>
        {subtitle != null && (
          <p className="text-sm text-text-muted dark:text-text-secondary mt-0.5">
            {subtitle}
          </p>
        )}
        {description != null && (
          <p className="text-xs text-text-muted dark:text-text-secondary mt-0.5 truncate">
            {description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {rightSlot ?? (
          <>
            {onDelete && (
              <IconButton
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                label={deleteAriaLabel}
                className="opacity-0 group-hover:opacity-100 text-text-muted dark:text-text-secondary hover:text-danger-600 dark:hover:text-danger-400 hover:bg-red-50 dark:hover:bg-danger-900/20 min-w-[44px] min-h-[44px]"
              >
                <Trash2 className="w-4 h-4" />
              </IconButton>
            )}
            {showChevron && (
              <ChevronRight
                className="w-5 h-5 text-text-muted shrink-0"
                aria-hidden
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
