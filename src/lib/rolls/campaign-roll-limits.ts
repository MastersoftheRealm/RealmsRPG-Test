/**
 * Campaign roll API string limits — match roll-log / sheet call sites.
 */
import { CREATOR_NAME_MAX_LENGTH } from '@/lib/creator/creator-text-limits';

/** Middle of Randomize titles: `: 1d${sides} → ` with max `d100`. */
const RANDOMIZE_TITLE_MIDDLE_MAX = ': 1d'.length + String(100).length + ' → '.length;

/** `${powerName}: 1d${sides} → ${label}` in library-entity-rows `buildRandomizeRollEntry`. */
export const CAMPAIGN_ROLL_TITLE_MAX_LENGTH =
  CREATOR_NAME_MAX_LENGTH * 2 + RANDOMIZE_TITLE_MIDDLE_MAX;

/** `${item.name} damage` — suffix after a max-length library item name. */
export const CAMPAIGN_ROLL_DAMAGE_TITLE_SUFFIX = ' damage';

/** `resolveRollModifierLabel` defense branch: `${title} bonus`. */
const CAMPAIGN_ROLL_DEFENSE_MODIFIER_LABEL_SUFFIX = ' bonus';

export const CAMPAIGN_ROLL_MODIFIER_LABEL_MAX_LENGTH =
  CREATOR_NAME_MAX_LENGTH + CAMPAIGN_ROLL_DEFENSE_MODIFIER_LABEL_SUFFIX.length;

export const CAMPAIGN_ROLL_TITLE_TOO_LONG_MESSAGE = `Title must be ${CAMPAIGN_ROLL_TITLE_MAX_LENGTH} characters or fewer.`;

export const CAMPAIGN_ROLL_MODIFIER_LABEL_TOO_LONG_MESSAGE = `Modifier label must be ${CAMPAIGN_ROLL_MODIFIER_LABEL_MAX_LENGTH} characters or fewer.`;
