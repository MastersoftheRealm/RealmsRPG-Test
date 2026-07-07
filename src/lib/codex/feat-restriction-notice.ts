/**
 * Player-facing notices for feat usage restrictions (state feats, uses per recovery).
 */

import type { Feat } from '@/types/codex';
import { calculateProficiency } from '@/lib/game/formulas';
import { formatListCellLabel } from '@/lib/utils';

/** Default state duration when not overridden by another feat (e.g. Long-Lasting State). */
export const DEFAULT_STATE_DURATION_LABEL = '1 minute';

export type FeatRestrictionNoticeOpts = {
  /** Character level — used for default Enter State uses when the feat has no per-feat limit. */
  level?: number;
};

function formatUsesCount(uses: number): string {
  return uses === 1 ? 'once' : `${uses} times`;
}

function formatRecoveryPeriod(recPeriod: string | undefined, forceFull = false): string {
  if (forceFull) return 'Full';
  const label = formatListCellLabel(recPeriod);
  return label === '-' ? 'recovery' : label;
}

/**
 * Returns a brief notice when a feat is a state feat and/or has limited uses per recovery.
 * Returns null when no restriction applies.
 */
export function getFeatRestrictionNotice(
  feat: Pick<Feat, 'state_feat' | 'uses_per_rec' | 'rec_period'>,
  opts?: FeatRestrictionNoticeOpts
): string | null {
  const parts: string[] = [];
  const uses = feat.uses_per_rec;
  const hasFeatUses = uses != null && uses > 0;
  const recPeriod = feat.rec_period?.trim();

  if (feat.state_feat) {
    parts.push(
      `This is a State feat. Activate it with a Quick Action from your character sheet (Enter State); its effects last ${DEFAULT_STATE_DURATION_LABEL}. If you have multiple state feats, you can activate any or all of them with the same action.`
    );
  }

  if (hasFeatUses) {
    const period = formatRecoveryPeriod(recPeriod, feat.state_feat === true);
    parts.push(
      `This feat can be used ${formatUsesCount(uses)} per ${period} Recovery.`
    );
  } else if (feat.state_feat && opts?.level != null) {
    const enterStateUses = calculateProficiency(opts.level);
    if (enterStateUses > 0) {
      parts.push(
        `You can enter state ${formatUsesCount(enterStateUses)} per Full Recovery.`
      );
    }
  }

  return parts.length > 0 ? parts.join(' ') : null;
}
