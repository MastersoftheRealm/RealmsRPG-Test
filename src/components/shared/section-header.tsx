'use client';

/**
 * SectionHeader - Unified Section Header Component
 * =================================================
 * Minimal, sleek header pattern for ALL section lists across the site.
 * Simple title on left, optional + button on far right.
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
  /** Size variant - controls text size and spacing */
  size?: 'sm' | 'md' | 'lg';
}

export type SectionHeaderProps = SectionHeaderBaseProps & LibrarySectionCollapseHeaderProps;

const sizeStyles = {
  sm: 'text-xs py-1.5',
  md: 'text-sm py-2',
  lg: 'text-base py-2.5',
};

export function SectionHeader({
  title,
  onAdd,
  addLabel,
  rightContent,
  addButtonClassName,
  className,
  size = 'sm',
  collapsible = false,
  expanded = true,
  onExpandedChange,
}: SectionHeaderProps) {
  const collapseToggle =
    collapsible && onExpandedChange ? (
      <button
        type="button"
        onClick={() => onExpandedChange(!expanded)}
        className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full border border-border-light text-text-muted hover:bg-surface-alt hover:text-text-primary transition-colors"
        aria-expanded={expanded}
        aria-label={expanded ? `Collapse ${title}` : `Expand ${title}`}
      >
        <ChevronDown
          className={cn('w-4 h-4 transition-transform', expanded ? 'rotate-180' : 'rotate-0')}
        />
      </button>
    ) : null;

  return (
    <div 
      className={cn(
        'flex items-center justify-between',
        sizeStyles[size],
        className
      )}
    >
      {/* Left: Title only - clean, minimal */}
      <h2 className="font-semibold text-text-muted dark:text-text-secondary uppercase tracking-wide">
        {title}
      </h2>
      
      {/* Right: Collapse, custom content, and/or add button */}
      <div className="flex items-center gap-2">
        {rightContent}
        {collapseToggle}
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
