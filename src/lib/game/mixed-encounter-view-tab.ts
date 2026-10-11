/**
 * Mixed encounter Combat / Skill segmented control — persists across refresh (86e3jrra8).
 */

export type MixedEncounterViewTab = 'combat' | 'skill';

const STORAGE_PREFIX = 'realms-mixed-encounter-view:';

export function mixedEncounterViewStorageKey(encounterId: string): string {
  return `${STORAGE_PREFIX}${encounterId}`;
}

export function parseMixedEncounterViewTab(raw: string | null | undefined): MixedEncounterViewTab {
  return raw === 'skill' ? 'skill' : 'combat';
}

export function readMixedEncounterViewTab(encounterId: string): MixedEncounterViewTab {
  if (typeof window === 'undefined') return 'combat';
  try {
    return parseMixedEncounterViewTab(
      sessionStorage.getItem(mixedEncounterViewStorageKey(encounterId)),
    );
  } catch {
    return 'combat';
  }
}

export function writeMixedEncounterViewTab(encounterId: string, tab: MixedEncounterViewTab): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(mixedEncounterViewStorageKey(encounterId), tab);
  } catch {
    // Private mode / quota — view still works until refresh.
  }
}
