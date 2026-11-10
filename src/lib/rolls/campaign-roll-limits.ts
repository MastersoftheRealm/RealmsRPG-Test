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

/** Middle segment of sheet Randomize titles: `: 1d${sides} → `. */
function randomizeRollTitleMiddle(sides: number): string {
  return `: 1d${sides} → `;
}

/**
 * `${powerName}: 1d${sides} → ${label}` capped to {@link CAMPAIGN_ROLL_TITLE_MAX_LENGTH}.
 * Truncates the variant label first, then the power name, so API validation always passes.
 */
export function formatRandomizeRollTitle(powerName: string, sides: number, label: string): string {
  const middle = randomizeRollTitleMiddle(sides);
  let power = powerName.slice(0, CREATOR_NAME_MAX_LENGTH);
  let variantLabel = label.slice(0, CREATOR_NAME_MAX_LENGTH);
  const compose = () => `${power}${middle}${variantLabel}`;

  if (compose().length <= CAMPAIGN_ROLL_TITLE_MAX_LENGTH) {
    return compose();
  }

  const labelBudget = Math.max(0, CAMPAIGN_ROLL_TITLE_MAX_LENGTH - power.length - middle.length);
  variantLabel = variantLabel.slice(0, labelBudget);
  if (compose().length <= CAMPAIGN_ROLL_TITLE_MAX_LENGTH) {
    return compose();
  }

  const powerBudget = Math.max(
    0,
    CAMPAIGN_ROLL_TITLE_MAX_LENGTH - middle.length - variantLabel.length,
  );
  power = power.slice(0, powerBudget);
  return compose();
}
