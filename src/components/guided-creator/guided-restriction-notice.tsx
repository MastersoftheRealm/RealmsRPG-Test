'use client';

import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Feat, Trait } from '@/types/codex';
import {
  getFeatRestrictionNotice,
  getTraitRestrictionNotice,
} from '@/lib/codex/feat-restriction-notice';

export interface GuidedRestrictionNoticeProps {
  notice: string;
  className?: string | undefined;
}

/** Shared info callout for guided choice-card restriction / uses notices. */
export function GuidedRestrictionNotice({ notice, className }: GuidedRestrictionNoticeProps) {
  return (
    <div
      className={cn(
        'flex gap-2 rounded-lg border border-border-light bg-primary-subtle-bg/30 px-3 py-2',
        className,
      )}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary-fg" aria-hidden="true" />
      <p className="font-nunito text-sm leading-snug text-text-secondary">{notice}</p>
    </div>
  );
}

export interface GuidedFeatRestrictionNoticeProps {
  feat: Pick<Feat, 'state_feat'> & Partial<Pick<Feat, 'uses_per_rec' | 'rec_period'>>;
  /** Guided creator builds level-1 characters by default. */
  level?: number | undefined;
  /**
   * Skip limited-uses sentence when a Uses DescriptorChip already states the same fact
   * (Path deep-dive feat rows — TASK-579).
   */
  omitLimitedUses?: boolean | undefined;
  className?: string | undefined;
}

export function GuidedFeatRestrictionNotice({
  feat,
  level = 1,
  omitLimitedUses = false,
  className,
}: GuidedFeatRestrictionNoticeProps) {
  const notice = getFeatRestrictionNotice(feat, { level, omitLimitedUses });
  if (!notice) return null;
  return <GuidedRestrictionNotice notice={notice} className={className} />;
}

export interface GuidedTraitRestrictionNoticeProps {
  trait: Pick<Trait, 'uses_per_rec' | 'rec_period'>;
  className?: string | undefined;
}

export function GuidedTraitRestrictionNotice({
  trait,
  className,
}: GuidedTraitRestrictionNoticeProps) {
  const notice = getTraitRestrictionNotice(trait);
  if (!notice) return null;
  return <GuidedRestrictionNotice notice={notice} className={className} />;
}
