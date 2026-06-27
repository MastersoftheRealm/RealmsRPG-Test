/**
 * Card Component
 * ================
 * Container component with header, content, and footer.
 * Variants consolidate legacy `.card`, `.interactive-card`, and `.selection-card` CSS (Phase 2.3).
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

export const cardVariants = cva('rounded-xl bg-surface text-text-primary', {
  variants: {
    variant: {
      default: 'border border-border-light shadow-sm',
      interactive:
        'border border-border-light shadow-sm transition-all duration-base ease-standard cursor-pointer hover:shadow-md hover:border-primary-outline-border hover:-translate-y-0.5',
      selectable:
        'border-2 border-neutral-200 p-4 transition-all duration-base ease-standard cursor-pointer hover:border-primary-outline-border hover:shadow-md hover:-translate-y-0.5',
      selected:
        'border-2 border-primary-outline-border bg-primary-subtle-bg shadow-md ring-2 ring-primary-subtle-border p-4',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ variant }), className)} {...props} />
  )
);
Card.displayName = 'Card';

type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>;

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-xl font-semibold leading-none tracking-tight text-text-primary', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

type CardDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-text-muted dark:text-text-secondary', className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

type CardContentProps = React.HTMLAttributes<HTMLDivElement>;

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

type CardFooterProps = React.HTMLAttributes<HTMLDivElement>;

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
