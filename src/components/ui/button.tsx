/**
 * Button Component
 * ==================
 * Reusable button with variants using class-variance-authority
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
        primary: 'bg-gradient-to-b from-primary-500 to-primary-700 text-primary-foreground hover:from-primary-400 hover:to-primary-600 hover:shadow-lg focus-visible:ring-primary-accent',
        gradient: 'bg-gradient-to-r from-primary-light to-primary text-primary-foreground hover:from-primary-500 hover:to-primary-600 focus-visible:ring-primary-accent shadow-md',
        secondary: 'bg-neutral-200 text-text-secondary border border-neutral-300 hover:bg-neutral-300 focus-visible:ring-neutral-500',
        danger: 'bg-gradient-to-b from-danger-600 to-danger-dark text-white hover:shadow-lg focus-visible:ring-danger',
        success: 'bg-gradient-to-b from-success-500 to-success-dark text-white hover:shadow-lg focus-visible:ring-success',
        ghost: 'text-text-secondary hover:bg-neutral-100 hover:text-text-primary focus-visible:ring-neutral-500',
        link: 'text-primary-600 underline-offset-4 hover:underline focus-visible:ring-primary-accent',
        outline: 'border-2 border-primary-700 text-primary-700 bg-transparent hover:bg-primary-50 focus-visible:ring-primary-accent',
        utility: 'bg-utility-300 text-white hover:bg-utility-400 focus-visible:ring-utility-300',
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
