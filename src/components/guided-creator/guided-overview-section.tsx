/**
 * Shared overview subsection for guided deep-dive / reveal panels.
 */

'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { GUIDED_OVERVIEW_STYLES as o } from './guided-choice-styles';
import { GuidedSectionTitle } from './guided-section-title';

export function GuidedOverviewSection({
  title,
  titleAddon,
  hint,
  children,
  className,
}: {
  title: string;
  /** Optional help beside the title (e.g. InfoTippy). */
  titleAddon?: ReactNode;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <GuidedSectionTitle titleAddon={titleAddon}>{title}</GuidedSectionTitle>
      {hint ? <p className={o.sectionHint}>{hint}</p> : null}
      <div className={cn(hint ? 'mt-3' : 'mt-2')}>{children}</div>
    </section>
  );
}
