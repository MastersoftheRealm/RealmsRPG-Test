/**
 * Vertical pin for the Skills title and filter row (86e3jv3yy).
 * The section tabs stick to the sheet column. The Skills card sits inside the
 * horizontal carousel, whose overflow box is the nearest scroll container, so
 * CSS sticky releases with that carousel instead of staying under the tabs.
 * The caller translates the title and filters together by this many pixels.
 */

export interface SkillsHeaderPinInput {
  /** Header border-box top in the viewport, before the pin translation. */
  naturalTop: number;
  headerHeight: number;
  /** Bottom of the sticky section-tab strip. */
  stickLine: number;
  /** Card border-box bottom in the viewport. */
  cardBottom: number;
}

export function skillsHeaderPinOffset({
  naturalTop,
  headerHeight,
  stickLine,
  cardBottom,
}: SkillsHeaderPinInput): number {
  if (headerHeight <= 0) return 0;
  const delta = stickLine - naturalTop;
  const maxDelta = cardBottom - headerHeight - naturalTop;
  if (maxDelta <= 0) return 0;
  return Math.round(Math.max(0, Math.min(delta, maxDelta)));
}
