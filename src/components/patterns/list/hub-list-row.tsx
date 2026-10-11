'use client';

/**
 * HubListRow — Unified list row for hub pages (Encounters, Crafting, etc.)
 * ==========================================================================
 * Single source of truth for the "icon + title + badge + subtitle + actions" row pattern.
 * The title is the button. Delete and other actions are siblings above its hit area.
 */

import { type CSSProperties, type ReactNode } from 'react';
import { ChevronRight, Trash2 } from 'lucide-react';
import type { VariantProps } from 'class-variance-authority';
import { IconButton, Card, DescriptorChip, type chipVariants } from '@/components/ui';
import { cn } from '@/lib/utils';
import { hubListRowMobileChromeEnd } from './hub-list-row-chrome';

type DescriptorVariant = NonNullable<VariantProps<typeof chipVariants>['variant']>;

const ROW_BASE_CLASS =
  'relative isolate flex items-center gap-4 p-4 hover:border-primary-outline-border transition-colors cursor-pointer group shadow-none';

/** Name is the row button. Actions stay above its stretched hit area. */
const ROW_NAME_BUTTON_CLASS =
  "block max-w-full cursor-pointer overflow-visible border-0 bg-transparent p-0 text-left font-[inherit] text-text-primary focus-visible:ring-2 focus-visible:ring-primary-outline-border focus-visible:ring-offset-2 focus-visible:outline-none after:absolute after:inset-0 after:z-0 after:cursor-pointer after:content-['']";

const ROW_ACTIONS_CLASS =
  'pointer-events-none relative z-10 flex flex-shrink-0 items-center gap-2 [&_a]:pointer-events-auto [&_button]:pointer-events-auto [&_input]:pointer-events-auto [&_select]:pointer-events-auto [&_textarea]:pointer-events-auto';

export interface HubListRowProps {
  /** Icon (e.g. Hammer, Brain). Rendered in iconContainerClassName box. */
  icon: ReactNode;
  /** Container for icon (e.g. bg-warning-light text-warning-fg) */
  iconContainerClassName?: string | undefined;
  /** Row title */
  title: string;
  /** Optional badge text (e.g. status) */
  badge?: string | undefined;
  /** Semantic badge variant (preferred over badgeClassName) */
  badgeVariant?: DescriptorVariant | undefined;
  /** @deprecated Prefer badgeVariant */
  badgeClassName?: string | undefined;
  /** Subtitle / meta line (e.g. "100 currency · Mar 10, 2026") */
  subtitle?: ReactNode | undefined;
  /** Optional extra line below subtitle */
  description?: ReactNode | undefined;
  /** Called when row is clicked. If undefined, row is not clickable. */
  onClick?: (() => void) | undefined;
  /** Delete button: aria-label and onClick. If provided, delete button is shown. */
  onDelete?: (() => void) | undefined;
  deleteAriaLabel?: string | undefined;
  /** Show trailing chevron (default true when onClick) */
  showChevron?: boolean | undefined;
  /** Optional right-side content instead of default delete + chevron */
  rightSlot?: ReactNode | undefined;
  className?: string | undefined;
}

export function HubListRow({
  icon,
  iconContainerClassName = 'bg-surface-alt text-text-secondary',
  title,
  badge,
  badgeVariant = 'descriptor',
  badgeClassName,
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
  const showDefaultChrome = !rightSlot && (onDelete != null || showChevron);
  const mobileChromeEnd = hubListRowMobileChromeEnd({
    rightSlot: rightSlot != null,
    showDefaultChrome,
  });
  return (
    <Card className={cn(ROW_BASE_CLASS, !clickable && 'cursor-default', className)}>
      <div
        className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
          iconContainerClassName,
        )}
      >
        {icon}
      </div>
      <div
        className={cn(
          'min-w-0 flex-1',
          mobileChromeEnd != null && 'max-lg:pe-[var(--hub-row-chrome-end)]',
        )}
        style={
          mobileChromeEnd != null
            ? ({ '--hub-row-chrome-end': mobileChromeEnd } as CSSProperties)
            : undefined
        }
      >
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="min-w-0 flex-1 font-semibold text-text-primary">
            {onClick ? (
              <button type="button" onClick={() => onClick()} className={ROW_NAME_BUTTON_CLASS}>
                <span className="block truncate" title={title}>
                  {title}
                </span>
              </button>
            ) : (
              <span className="block truncate" title={title}>
                {title}
              </span>
            )}
          </h2>
          {badge != null && badge !== '' && (
            <DescriptorChip
              variant={badgeVariant}
              size="sm"
              className={cn('shrink-0', badgeClassName)}
            >
              {badge}
            </DescriptorChip>
          )}
        </div>
        {subtitle != null && <p className="mt-0.5 text-sm text-text-muted">{subtitle}</p>}
        {description != null && (
          <p className="mt-0.5 truncate text-xs text-text-muted">{description}</p>
        )}
      </div>
      <div
        className={cn(
          ROW_ACTIONS_CLASS,
          mobileChromeEnd != null &&
            'max-lg:absolute max-lg:inset-y-0 max-lg:right-4 max-lg:flex max-lg:items-center',
        )}
      >
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
                // Hover-reveal is desktop-only chrome: coarse pointers never fire
                // :hover, and a zero-opacity control cannot show a focus ring.
                className="min-h-[44px] min-w-[44px] text-text-muted opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-danger-light hover:text-danger-fg focus-visible:opacity-100 [@media(pointer:coarse)]:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </IconButton>
            )}
            {showChevron && (
              <ChevronRight className="h-5 w-5 shrink-0 text-text-muted" aria-hidden />
            )}
          </>
        )}
      </div>
    </Card>
  );
}
