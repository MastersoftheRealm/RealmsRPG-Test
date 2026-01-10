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
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-on-primary hover:bg-primary/90 focus-visible:ring-primary',
        gradient: 'bg-gradient-to-r from-[#1a5c94] to-[#0a4a7a] text-white hover:from-[#1a6aa8] hover:to-[#0d5a94] focus-visible:ring-primary shadow-md',
        secondary: 'bg-secondary text-on-secondary hover:bg-secondary/80',
        danger: 'bg-danger text-white hover:bg-danger/90 focus-visible:ring-danger',
        success: 'bg-success text-white hover:bg-success/90 focus-visible:ring-success',
        ghost: 'hover:bg-surface-alt hover:text-on-surface',
        link: 'text-primary underline-offset-4 hover:underline',
        outline: 'border border-border bg-transparent hover:bg-surface-alt hover:text-on-surface',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 py-2',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
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
