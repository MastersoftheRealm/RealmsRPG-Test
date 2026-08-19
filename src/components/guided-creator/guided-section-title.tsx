/**
 * Shared subsection heading for guided creator steps and overview panels.
 */

'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { GUIDED_SECTION_TITLE_CLASS } from './guided-choice-styles';

export type GuidedSectionTitleLevel = 'h3' | 'h4' | 'div';

export interface GuidedSectionTitleProps {
  children: ReactNode;
  /** Optional help beside the title (e.g. InfoTippy). */
  titleAddon?: ReactNode | undefined;
  className?: string | undefined;
  /** Heading level for in-step sections. Use `div` when heading hierarchy is managed elsewhere. */
  as?: GuidedSectionTitleLevel | undefined;
  id?: string | undefined;
}

export function GuidedSectionTitle({
  children,
  titleAddon,
  className,
  as: Tag = 'h3',
  id,
}: GuidedSectionTitleProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <Tag id={id} className={GUIDED_SECTION_TITLE_CLASS}>
        {children}
      </Tag>
      {titleAddon ? (
        <span className="inline-flex shrink-0 items-center self-center leading-none">
          {titleAddon}
        </span>
      ) : null}
    </div>
  );
}
