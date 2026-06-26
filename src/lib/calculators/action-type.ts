/**
 * Shared action-type derivation for powers and techniques.
 *
 * Powers and techniques use different Codex part IDs (e.g. POWER_REACTION vs
 * REACTION) and different payload shapes, but the label logic (Basic/Quick/Free/
 * Long + Reaction suffix) is identical. The callers normalise their payload into
 * `{ partId, level }` and pass their own action IDs. (DUP-02)
 */

export interface ActionPartIds {
  reaction: number;
  quickOrFree: number;
  longAction: number;
}

export interface ResolvedActionPart {
  partId: number | undefined;
  /** op_1 level (0 or 1) controlling the Quick/Free and Long(3)/Long(4) split. */
  level: number;
}

/**
 * Derive the action-type label from already-resolved parts and a set of action
 * part IDs. Shared by power and technique `computeActionType`.
 */
export function deriveActionType(parts: ResolvedActionPart[], ids: ActionPartIds): string {
  let actionType = 'Basic';
  let isReaction = false;

  for (const { partId, level } of parts) {
    if (partId === ids.reaction) {
      isReaction = true;
    } else if (partId === ids.quickOrFree) {
      if (level === 0) actionType = 'Quick';
      else if (level === 1) actionType = 'Free';
    } else if (partId === ids.longAction) {
      if (level === 0) actionType = 'Long (3)';
      else if (level === 1) actionType = 'Long (4)';
    }
  }

  return isReaction ? `${actionType} Reaction` : `${actionType} Action`;
}

/**
 * Derive the action-type label from a UI selector value
 * (`quick|free|long3|long4|basic`) plus a reaction flag. Identical for powers
 * and techniques.
 */
export function actionTypeFromSelection(selection: string, reactionFlag: boolean): string {
  let base = 'Basic';
  if (selection === 'quick') base = 'Quick';
  else if (selection === 'free') base = 'Free';
  else if (selection === 'long3') base = 'Long (3)';
  else if (selection === 'long4') base = 'Long (4)';
  return reactionFlag ? `${base} Reaction` : `${base} Action`;
}
