/**
 * PageContainer Component
 * ========================
 * Unified container wrapper for page content with consistent sizing.
 * Replaces inline max-w-7xl patterns across all pages.
 */

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

type ContainerSize = 'xs' | 'sm' | 'prose' | 'md' | 'content' | 'lg' | 'xl' | 'full';

const sizeClasses: Record<ContainerSize, string> = {
  xs: 'max-w-2xl', // For narrow forms like my-account, login
  sm: 'max-w-3xl',
  prose: 'max-w-4xl', // For content-heavy pages like privacy, terms, resources
  md: 'max-w-5xl', 
  content: 'max-w-6xl', // For medium content pages like rules, creators
  lg: 'max-w-7xl',
  xl: 'max-w-[1440px] lg:px-24',
  full: 'max-w-none',
};

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Container max-width size */
  size?: ContainerSize;
  /** Whether to include vertical padding */
  padded?: boolean;
  /** Whether to center the container */
  centered?: boolean;
}

export function PageContainer({
  size = 'lg',
  padded = true,
  centered = true,
  className,
  children,
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn(
        sizeClasses[size],
        'px-4 sm:px-6 lg:px-8',
        padded && 'py-8',
        centered && 'mx-auto',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

PageContainer.displayName = 'PageContainer';

export { type ContainerSize };
