/**
 * PageHeader Component
 * =====================
 * Unified page header with title and optional description.
 * Provides consistent spacing and typography across all pages.
 */

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Main page title */
  title: React.ReactNode;
  /** Optional icon to display before the title */
  icon?: React.ReactNode;
  /** Optional description below title */
  description?: React.ReactNode;
  /** Optional action buttons/elements to display on the right */
  actions?: React.ReactNode;
  /** Size variant for the title */
  size?: 'sm' | 'md' | 'lg';
  /** When set, the title is clickable (e.g. inline rename) */
  onTitleClick?: () => void;
  /** Accessible name when title is clickable */
  titleAriaLabel?: string;
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
  onTitleClick,
  titleAriaLabel,
  className,
  ...props
}: PageHeaderProps) {
  const titleClasses = cn(
    'font-bold font-display text-text-primary flex items-center gap-2',
    titleSizeClasses[size],
    onTitleClick && 'cursor-pointer hover:text-primary-link-fg hover:underline text-left'
  );

  return (
    <div className={cn('mb-8', className)} {...props}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          {onTitleClick ? (
            <button
              type="button"
              onClick={onTitleClick}
              className={cn(titleClasses, 'w-full max-w-full')}
              aria-label={titleAriaLabel ?? (typeof title === 'string' ? `Edit ${title}` : 'Edit page title')}
            >
              {icon}
              {title}
            </button>
          ) : (
            <h1 className={titleClasses}>
              {icon}
              {title}
            </h1>
          )}
          {description && (
            <div className="mt-2 text-text-secondary">
              {description}
            </div>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-3 flex-shrink-0 min-w-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

PageHeader.displayName = 'PageHeader';
