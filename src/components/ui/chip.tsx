/**
 * Chip Component
 * ===============
 * Small tag/badge for displaying labels
 * Uses design system colors from globals.css
 * 
 * RECOMMENDED VARIANTS:
 * - default: Neutral chips, general purpose
 * - primary: Emphasized/highlighted chips
 * - Category-based (action, activation, area, duration, target, special, restriction):
 *   Semantic colors for power/technique parts - these are domain-specific and necessary
 * - Status (success, warning, danger): For validation/feedback states
 * 
 * DEPRECATED VARIANTS (avoid, will be removed):
 * - secondary, outline, accent: Use 'default' instead
 * - weapon, armor, shield: Use 'default' - context provides meaning
 * - feat, proficiency, weakness, power, technique: Use 'default' - let context provide meaning
 * - info: Use 'default' or 'primary' instead
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import { X } from 'lucide-react';

const chipVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium border transition-colors duration-base ease-standard',
  {
    variants: {
      variant: {
        // RECOMMENDED VARIANTS
        default: 'bg-surface-alt text-text-secondary border-border-light',
        primary: 'bg-primary-chip-bg text-primary-chip-fg border-primary-chip-border',
        
        // Category-based colors for power/technique parts (KEEP - domain-specific)
        action: 'bg-category-action text-category-action-text border-category-action-border',
        activation: 'bg-category-activation text-category-activation-text border-category-activation-border',
        area: 'bg-category-area text-category-area-text border-category-area-border',
        duration: 'bg-category-duration text-category-duration-text border-category-duration-border',
        target: 'bg-category-target text-category-target-text border-category-target-border',
        special: 'bg-category-special text-category-special-text border-category-special-border',
        restriction: 'bg-category-restriction text-category-restriction-text border-category-restriction-border',
        
        // Status colors (KEEP - semantic feedback)
        success: 'bg-success-light text-success-fg border-success-border',
        danger: 'bg-danger-light text-danger-fg border-danger-border',
        warning: 'bg-warning-light text-warning-fg border-warning-border',

        // GridListRow expandable list chips (Phase 2.2 — unified from CHIP_STYLES)
        list: 'bg-surface-alt border-border-light text-text-secondary hover:bg-surface',
        listCost: 'bg-info-light text-info-fg border-info-border hover:opacity-90',
        listWarning: 'bg-warning-light text-warning-fg border-warning-border',
        listSuccess: 'bg-success-light text-success-fg border-success-border',

        /** Proficiency / training-point (TP) domain chip — creator + sheet summaries */
        tp: 'bg-tp-light text-tp-text border-tp-border',

        /** Item rarity badges (Phase 4 — theme-aware semantic tokens) */
        rarityCommon: 'bg-surface-alt text-text-primary border-border-light',
        rarityUncommon: 'bg-success-light text-success-fg border-success-300',
        rarityRare: 'bg-info-light text-info-fg border-info-border',
        rarityEpic: 'bg-power-light text-power-fg border-power-border',
        rarityLegendary: 'bg-warning-light text-warning-fg border-warning-border',
        rarityMythic: 'bg-danger-light text-danger-fg border-danger-border',
        rarityAscended: 'bg-accent-light text-accent-fg border-accent-border',
        
        // DEPRECATED VARIANTS (kept for backwards compatibility)
        /** @deprecated Use 'default' instead */
        secondary: 'bg-surface text-text-secondary border-border-light',
        /** @deprecated Use 'default' instead */
        outline: 'border-border-light bg-transparent text-text-secondary hover:bg-surface-alt',
        /** @deprecated Use 'primary' instead */
        accent: 'bg-accent-chip text-primary-subtle-fg border-accent-200',
        /** @deprecated Use 'default' instead */
        info: 'bg-info-light text-info-fg border-info-border',
        
        // Equipment types - DEPRECATED (context provides meaning)
        /** @deprecated Use 'default' - context provides meaning */
        weapon: 'bg-warning-light text-warning-fg border-warning-border',
        /** @deprecated Use 'default' - context provides meaning */
        armor: 'bg-info-light text-info-fg border-info-border',
        /** @deprecated Use 'default' - context provides meaning */
        shield: 'bg-success-light text-success-fg border-success-border',
        
        // Character content types - DEPRECATED (context provides meaning)
        /** @deprecated Use 'default' - context provides meaning */
        feat: 'bg-surface-alt text-text-secondary border-border-light',
        /** @deprecated Use 'default' - context provides meaning */
        proficiency: 'bg-info-light text-info-fg border-info-border',
        /** @deprecated Use 'default' - context provides meaning */
        weakness: 'bg-danger-light text-danger-fg border-danger-border',
        /** @deprecated Use 'default' - context provides meaning */
        power: 'bg-power-light text-power-fg border-power-border',
        /** @deprecated Use 'default' - context provides meaning */
        technique: 'bg-martial-light text-martial-fg border-martial-border',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-1.5 text-base',
      },
      interactive: {
        true: 'cursor-pointer hover:opacity-80',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      interactive: false,
    },
  }
);

export interface ChipProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof chipVariants> {
  onRemove?: () => void;
}

const Chip = React.forwardRef<HTMLSpanElement, ChipProps>(
  ({ className, variant, size, interactive, onRemove, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(chipVariants({ variant, size, interactive, className }))}
        {...props}
      >
        {children}
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="ml-0.5 -mr-1 rounded-full p-0.5 hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-outline-border transition-colors touch-target-md-compact inline-flex items-center justify-center"
            aria-label="Remove"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </span>
    );
  }
);
Chip.displayName = 'Chip';

export { Chip, chipVariants };
