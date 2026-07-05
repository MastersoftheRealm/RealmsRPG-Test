'use client';

import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Feat } from '@/types/codex';
import { getFeatRestrictionNotice } from '@/lib/codex/feat-restriction-notice';

export interface GuidedFeatRestrictionNoticeProps {
  feat: Pick<Feat, 'state_feat' | 'uses_per_rec' | 'rec_period'>;
  /** Guided creator builds level-1 characters by default. */
  level?: number;
  className?: string;
}

export function GuidedFeatRestrictionNotice({
  feat,
  level = 1,
  className,
}: GuidedFeatRestrictionNoticeProps) {
  const notice = getFeatRestrictionNotice(feat, { level });
  if (!notice) return null;

  return (
    <div
      className={cn(
        'flex gap-2 rounded-lg border border-border-light bg-primary-subtle-bg/30 px-3 py-2',
        className
      )}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <Info
        className="mt-0.5 h-4 w-4 shrink-0 text-primary-fg"
        aria-hidden="true"
      />
      <p className="font-nunito text-sm leading-snug text-text-secondary">{notice}</p>
    </div>
  );
}
