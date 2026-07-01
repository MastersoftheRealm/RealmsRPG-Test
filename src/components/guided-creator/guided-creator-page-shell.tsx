/**
 * GuidedCreatorPageShell
 * ======================
 * Landing-cohesive page chrome for the guided creator funnel (REALMS §5.0).
 */

'use client';

import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { CreatorFunnelHero } from '@/components/landing';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const shellCopy = GUIDED_CREATOR_COPY.shell;

export interface GuidedCreatorPageShellProps {
  title?: string;
  subtitle?: ReactNode;
  /** Tighter gradient header inside the creator flow. */
  compact?: boolean;
  /** Right-side header actions (e.g. Restart). */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function GuidedCreatorPageShell({
  title = shellCopy.title,
  subtitle,
  compact = false,
  actions,
  children,
  className,
}: GuidedCreatorPageShellProps) {
  return (
    <div className={cn('min-h-screen bg-background', className)}>
      <CreatorFunnelHero
        compact={compact}
        eyebrow={shellCopy.eyebrow}
        title={title}
        subtitle={subtitle}
        actions={actions}
      />

      <div className={cn('layout-shell-wide px-4', compact ? 'py-4 sm:py-5' : 'py-6 sm:py-8')}>
        <Link
          href="/characters/new"
          className={cn(
            'inline-flex items-center gap-1.5 min-h-11 font-nunito text-sm font-medium',
            'text-primary-link-fg hover:text-primary-fg-hover transition-colors',
            'mb-4 -mt-1'
          )}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {shellCopy.changeModeLink}
        </Link>
        {children}
      </div>
    </div>
  );
}
