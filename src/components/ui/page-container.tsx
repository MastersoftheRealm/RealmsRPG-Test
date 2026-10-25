/**
 * PageContainer Component
 * ========================
 * Unified container wrapper for page content with consistent sizing.
 * Replaces inline max-w-7xl patterns across all pages.
 */

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Page body is at least one viewport tall, so the site footer starts below the fold.
 * Main is a flex-1 child of a min-h-screen column: a short first paint pins the
 * footer to the bottom of the window. Combat, Codex, and Characters then grow
 * (encounter tracker, feat list, character grid) and that footer jumps.
 * The header is already in the first viewport, so this minimum puts the footer
 * one header-height past the fold. Later growth moves a footer that was not visible.
 * Lab CLS 86e3k9fyg.
 */
export const PAGE_FILLS_VIEWPORT_CLASSNAME = 'min-h-screen';

type ContainerSize = 'xs' | 'sm' | 'prose' | 'md' | 'content' | 'lg' | 'xl' | 'tool' | 'full';

const sizeClasses: Record<ContainerSize, string> = {
  xs: 'max-w-2xl', // For narrow forms like my-account, login
  sm: 'max-w-3xl',
  prose: 'max-w-4xl', // For content-heavy pages like privacy, terms, resources
  md: 'max-w-5xl',
  content: 'max-w-6xl', // For medium content pages like rules, creators
  lg: 'max-w-[var(--container-standard)]',
  xl: 'max-w-[var(--container-wide)]',
  tool: 'max-w-[var(--container-full-tool)]',
  full: 'max-w-none',
};

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Container max-width size */
  size?: ContainerSize | undefined;
  /** Whether to include vertical padding */
  padded?: boolean | undefined;
  /** Whether to center the container */
  centered?: boolean | undefined;
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
        size === 'xl' ? 'min-w-0 px-4 sm:px-6 lg:px-24' : 'min-w-0 px-4 sm:px-6 lg:px-8',
        padded && 'py-8',
        centered && 'mx-auto',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

PageContainer.displayName = 'PageContainer';

export { type ContainerSize };
