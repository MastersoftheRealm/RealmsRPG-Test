/**
 * Button Component
 * ==================
 * Reusable button with variants using class-variance-authority
 * 
 * RECOMMENDED VARIANTS (use these):
 * - primary: Main CTA, solid bg (clean, no gradient)
 * - outline: Secondary CTA, border only (clean outline style)
 * - secondary: Alternative actions, cancel buttons
 * - danger: Destructive actions (delete, remove)
 * - ghost: Minimal emphasis, inline actions
 * - link: Text link styling
 * 
 * DEPRECATED VARIANTS (avoid, will be removed):
 * - gradient: Use 'primary' instead
 * - success: Use 'primary' instead (context provides meaning)
 * - utility: Use 'secondary' or 'ghost' instead
 */

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // RECOMMENDED VARIANTS - clean solid/outline preferred over gradients
        primary: 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-accent',
        secondary: 'bg-surface text-text-secondary border border-border-light hover:bg-surface-alt focus-visible:ring-border',
        danger: 'bg-danger-600 text-white hover:bg-danger-700 focus-visible:ring-danger',
        ghost: 'text-text-secondary hover:bg-surface-alt hover:text-text-primary focus-visible:ring-border',
        link: 'text-primary-600 underline-offset-4 hover:underline focus-visible:ring-primary-accent',
        outline: 'border-2 border-primary-600 text-primary-700 bg-transparent hover:bg-primary-50 focus-visible:ring-primary-accent',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 py-2',
        lg: 'h-12 px-6 text-base',
        xl: 'h-14 px-8 text-lg',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, asChild = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
