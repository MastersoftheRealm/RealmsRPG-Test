'use client';

/**
 * SectionHeader - Unified Section Header Component
 * =================================================
 * Minimal, sleek header pattern for ALL section lists across the site.
 * Title on left (optional inline collapse chevron beside the name — ListHeader /
 * ExpandableChip style, no circle chrome); optional + button on far right.
 * NO counts, NO backgrounds - just clean text and functionality.
 * 
 * Based on Equipment tab design (the cleanest current implementation).
 * 
 * Part of Phase 1 UI Unification: "Learn it once, learn it forever"
 * 
 * Usage:
 * - Character sheet sections (Powers, Techniques, Weapons, Armor, Equipment, Feats)
 * - Library page sections
 * - Creator page sections
 * - Any collapsible/expandable section with add functionality
 */

import { ReactNode } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { IconButton } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { LibrarySectionCollapseHeaderProps } from '@/hooks/use-library-section-collapse';

interface SectionHeaderBaseProps {
  /** Section title */
  title: string;
  /** Callback for add button - if provided, shows + button on far right */
  onAdd?: () => void;
  /** Accessibility label for add button (defaults to "Add {title}") */
  addLabel?: string;
  /** Additional content to render on the right side (before add button) */
  rightContent?: ReactNode;
  /** Optional className for the add button (e.g. text-danger-700 when over budget) */
  addButtonClassName?: string;
  /** Custom className for container */
  className?: string;
  /**
   * Size variant - controls text size and spacing.
   * DESIGN_INTENT: default `md` sitewide; character Library list subsections pass `lg` explicitly.
   */
  size?: 'sm' | 'md' | 'lg';
}

export type SectionHeaderProps = SectionHeaderBaseProps & LibrarySectionCollapseHeaderProps;

/** Text size on the title itself (not only the row) so collapse buttons cannot shrink it. */
const sizeTextStyles = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

const sizePadStyles = {
  sm: 'py-1.5',
  md: 'py-2',
  lg: 'py-2.5',
};

export function SectionHeader({
  title,
  onAdd,
  addLabel,
  rightContent,
  addButtonClassName,
  className,
  size = 'md',
  collapsible = false,
  expanded = true,
  onExpandedChange,
}: SectionHeaderProps) {
  const titleClassName = cn(
    'font-semibold text-text-muted dark:text-text-secondary uppercase tracking-wide',
    sizeTextStyles[size]
  );
  const canCollapse = collapsible && typeof onExpandedChange === 'function';

  return (
    <div
      className={cn(
        'flex items-center justify-between',
        // Collapsible: modest pb under the title (not full size pad) so stacks stay compact.
        canCollapse ? 'pb-1.5' : sizePadStyles[size],
        className
      )}
    >
      {/* Left: title with inline chevron (matches ListHeader / ExpandableChip — no circle chrome) */}
      <h2 className={cn(titleClassName, canCollapse && 'm-0')}>
        {canCollapse ? (
          <button
            type="button"
            onClick={() => onExpandedChange(!expanded)}
            className={cn(
              // Match Button/IconButton: 44px min only on touch; desktop stays compact when collapsed.
              'inline-flex items-center gap-1.5 text-left hover:text-text-primary transition-colors [@media(pointer:coarse)]:min-h-[44px]',
              sizeTextStyles[size]
            )}
            aria-expanded={expanded}
            aria-label={expanded ? `Collapse ${title}` : `Expand ${title}`}
          >
            <span>{title}</span>
            <ChevronDown
              className={cn(
                'w-4 h-4 shrink-0 transition-transform duration-base ease-standard',
                expanded && 'rotate-180'
              )}
              aria-hidden
            />
          </button>
        ) : (
          title
        )}
      </h2>

      {/* Right: custom content and/or add button */}
      <div className="flex items-center gap-2">
        {rightContent}
        {onAdd && (
          <IconButton
            variant="ghost"
            size="sm"
            onClick={onAdd}
            label={addLabel || `Add ${title.toLowerCase()}`}
            className={cn(
              'text-primary-link-fg hover:text-primary-fg-hover hover:bg-primary-subtle-bg',
              addButtonClassName
            )}
          >
            <Plus className="w-4 h-4" />
          </IconButton>
        )}
      </div>
    </div>
  );
}

export default SectionHeader;
