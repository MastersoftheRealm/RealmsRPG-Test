/**
 * PageHeader Component
 * =====================
 * Unified page header with title and optional description.
 * Provides consistent spacing and typography across all pages.
 */

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Main page title */
  title: string;
  /** Optional icon to display before the title */
  icon?: React.ReactNode;
  /** Optional description below title */
  description?: string;
  /** Optional action buttons/elements to display on the right */
  actions?: React.ReactNode;
  /** Size variant for the title */
  size?: 'sm' | 'md' | 'lg';
}

const titleSizeClasses = {
  sm: 'text-2xl',
  md: 'text-3xl',
  lg: 'text-4xl',
};

export function PageHeader({
  title,
  icon,
  description,
  actions,
  size = 'md',
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div className={cn('mb-8', className)} {...props}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className={cn('font-bold text-text-primary flex items-center gap-2', titleSizeClasses[size])}>
            {icon}
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-text-secondary">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

PageHeader.displayName = 'PageHeader';
