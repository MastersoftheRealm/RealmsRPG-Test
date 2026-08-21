/**
 * Player-facing notices for feat/trait usage restrictions (state feats, uses per recovery).
 */

import type { Feat, Trait } from '@/types/codex';
import { calculateProficiency } from '@/lib/game/formulas';
import { formatListCellLabel } from '@/lib/utils';

/** Default state duration when not overridden by another feat (e.g. Long-Lasting State). */
export const DEFAULT_STATE_DURATION_LABEL = '1 minute';

/** Shared State feat teaching copy for feat notices and list-filter help. */
export const STATE_FEAT_RESTRICTION_NOTICE = `This is a State feat. Activate it with a Quick Action from your character sheet (Enter State); its effects last ${DEFAULT_STATE_DURATION_LABEL}. If you have multiple state feats, you can activate any or all of them with the same action.`;

export type FeatRestrictionNoticeOpts = {
  /** Character level — used for default Enter State uses when the feat has no per-feat limit. */
  level?: number | undefined;
  /**
   * When true, skip the limited-uses sentence (e.g. Path deep-dive already shows a Uses chip).
   * State-feat teaching copy and default Enter State uses still surface.
   */
  omitLimitedUses?: boolean | undefined;
};

export type LimitedUseEntity = 'feat' | 'trait';

function formatUsesCount(uses: number): string {
  return uses === 1 ? 'once' : `${uses} times`;
}

function formatRecoveryPeriod(recPeriod: string | undefined, forceFull = false): string {
  if (forceFull) return 'Full';
  const label = formatListCellLabel(recPeriod);
  return label === '-' ? 'recovery' : label;
}

/**
 * Shared limited-uses copy for feats and traits (guided choice cards, etc.).
 * Returns null when the entity has no limited uses.
 */
export function getLimitedUsesNotice(
  entity: LimitedUseEntity,
  usesPerRec: number | null | undefined,
  recPeriod: string | null | undefined,
  opts?: { forceFullRecovery?: boolean | undefined },
): string | null {
  const uses = usesPerRec;
  if (uses == null || uses <= 0) return null;
  const period = formatRecoveryPeriod(recPeriod?.trim(), opts?.forceFullRecovery === true);
  return `This ${entity} can be used ${formatUsesCount(uses)} per ${period} Recovery.`;
}

/**
 * Returns a brief notice when a feat is a state feat and/or has limited uses per recovery.
 * Returns null when no restriction applies.
 */
export function getFeatRestrictionNotice(
  feat: Pick<Feat, 'state_feat'> & Partial<Pick<Feat, 'uses_per_rec' | 'rec_period'>>,
  opts?: FeatRestrictionNoticeOpts,
): string | null {
  const parts: string[] = [];

  if (feat.state_feat) {
    parts.push(STATE_FEAT_RESTRICTION_NOTICE);
  }

  if (!opts?.omitLimitedUses) {
    const usesNotice = getLimitedUsesNotice('feat', feat.uses_per_rec, feat.rec_period, {
      forceFullRecovery: feat.state_feat === true,
    });
    if (usesNotice) {
      parts.push(usesNotice);
    }
  }

  // Default Enter State uses when state feat has no per-feat limit (chip or sentence may cover limits).
  const hasPerFeatUses = feat.uses_per_rec != null && feat.uses_per_rec > 0;
  if (feat.state_feat && !hasPerFeatUses && opts?.level != null) {
    const enterStateUses = calculateProficiency(opts.level);
    if (enterStateUses > 0) {
      parts.push(`You can enter state ${formatUsesCount(enterStateUses)} per Full Recovery.`);
    }
  }

  return parts.length > 0 ? parts.join(' ') : null;
}

/**
 * Returns a brief notice when a trait has limited uses per recovery.
 * Returns null when no restriction applies.
 */
export function getTraitRestrictionNotice(
  trait: Partial<Pick<Trait, 'uses_per_rec' | 'rec_period'>>,
): string | null {
  return getLimitedUsesNotice('trait', trait.uses_per_rec, trait.rec_period);
}
