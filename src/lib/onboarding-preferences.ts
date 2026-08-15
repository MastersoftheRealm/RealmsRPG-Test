/**
 * Post-activation onboarding prefs (TASK-388 / REALMS_PRODUCT_OVERVIEW §11).
 * localStorage — no schema migration. Survives refresh; per-browser.
 */

export const PLAY_TOGETHER_KEY = 'realms_seen_play_together_prompt';
export const TUTORIALS_ENABLED_KEY = 'realms_tutorials_enabled';
export const SHEET_TOUR_KEY = 'realms_sheet_tour_status';
export const TUTORIAL_MILESTONES_KEY = 'realms_tutorial_milestones';

export type SheetTourStatus = 'pending' | 'completed' | 'dismissed_forever';

export type TutorialMilestoneId = 'first_level_up' | 'first_ability_point' | 'first_library_slot';

export type TutorialMilestones = Partial<Record<TutorialMilestoneId, true>>;

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

export function hasSeenPlayTogether(): boolean {
  if (!canUseStorage()) return false;
  return localStorage.getItem(PLAY_TOGETHER_KEY) === '1';
}

export function markPlayTogetherSeen(): void {
  if (!canUseStorage()) return;
  localStorage.setItem(PLAY_TOGETHER_KEY, '1');
}

/** Default on. Stored as '0' when user disables tutorials. */
export function areTutorialsEnabled(): boolean {
  if (!canUseStorage()) return true;
  return localStorage.getItem(TUTORIALS_ENABLED_KEY) !== '0';
}

export function setTutorialsEnabled(enabled: boolean): void {
  if (!canUseStorage()) return;
  if (enabled) {
    localStorage.removeItem(TUTORIALS_ENABLED_KEY);
  } else {
    localStorage.setItem(TUTORIALS_ENABLED_KEY, '0');
  }
}

export function getSheetTourStatus(): SheetTourStatus | null {
  if (!canUseStorage()) return null;
  const raw = localStorage.getItem(SHEET_TOUR_KEY);
  if (raw === 'completed' || raw === 'dismissed_forever' || raw === 'pending') return raw;
  return null;
}

export function setSheetTourStatus(status: SheetTourStatus): void {
  if (!canUseStorage()) return;
  localStorage.setItem(SHEET_TOUR_KEY, status);
}

export function shouldOfferSheetTour(): boolean {
  if (!areTutorialsEnabled()) return false;
  const status = getSheetTourStatus();
  return status !== 'completed' && status !== 'dismissed_forever';
}

export function getTutorialMilestones(): TutorialMilestones {
  if (!canUseStorage()) return {};
  try {
    const raw = localStorage.getItem(TUTORIAL_MILESTONES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as TutorialMilestones;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function markTutorialMilestone(id: TutorialMilestoneId): void {
  if (!canUseStorage()) return;
  const next = { ...getTutorialMilestones(), [id]: true as const };
  localStorage.setItem(TUTORIAL_MILESTONES_KEY, JSON.stringify(next));
}

export function hasSeenTutorialMilestone(id: TutorialMilestoneId): boolean {
  return getTutorialMilestones()[id] === true;
}

/** Append ?offerTour=1 for post-save sheet tour offer (stripped after consume). */
export function characterSheetUrlWithTourOffer(characterId: string): string {
  return `/characters/${characterId}?offerTour=1`;
}
