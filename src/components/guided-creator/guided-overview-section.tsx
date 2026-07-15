/**
 * Shared overview subsection for guided deep-dive / reveal panels.
 */

'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { GUIDED_OVERVIEW_STYLES as o } from './guided-choice-styles';

export function GuidedOverviewSection({
  title,
  hint,
  children,
  className,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className={o.sectionTitle}>{title}</div>
      {hint ? <p className={o.sectionHint}>{hint}</p> : null}
      <div className={cn(hint ? 'mt-3' : 'mt-2')}>{children}</div>
    </section>
  );
}
