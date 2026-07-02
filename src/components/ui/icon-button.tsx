/**
 * IconButton Component
 * =====================
 * A button component specifically for icon-only actions.
 * Provides consistent sizing, hover states, and accessibility.
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const iconButtonVariants = cva(
  // Touch devices get a 44px minimum tap target; scoped to coarse pointers so
  // desktop keeps the compact icon sizing (TASK-332).
  'inline-flex items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-outline-border focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed [@media(pointer:coarse)]:min-h-[44px] [@media(pointer:coarse)]:min-w-[44px]',
  {
    variants: {
      variant: {
        default: 'text-text-muted hover:text-text-primary hover:bg-surface-alt',
        ghost: 'text-text-muted hover:text-text-primary hover:bg-transparent',
        primary: 'text-primary-link-fg hover:text-primary-fg-hover hover:bg-primary-subtle-bg',
        danger: 'text-danger-fg hover:text-danger-dark hover:bg-danger-light',
        success: 'text-success hover:text-success-dark hover:bg-success-light',
        muted: 'text-text-muted hover:bg-surface-alt',
      },
      size: {
        sm: 'p-1 h-7 w-7',
        md: 'p-1.5 h-8 w-8',
        lg: 'p-2 h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  /** Accessible label for the button (required for accessibility) */
  label: string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, label, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(iconButtonVariants({ variant, size, className }))}
        aria-label={label}
        title={label}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

export { IconButton, iconButtonVariants };
