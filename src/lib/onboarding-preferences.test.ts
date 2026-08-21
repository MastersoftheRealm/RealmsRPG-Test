import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  PLAY_TOGETHER_KEY,
  SHEET_TOUR_KEY,
  TUTORIALS_ENABLED_KEY,
  TUTORIAL_MILESTONES_KEY,
  areTutorialsEnabled,
  characterSheetUrlWithTourOffer,
  getSheetTourStatus,
  hasSeenPlayTogether,
  hasSeenTutorialMilestone,
  markPlayTogetherSeen,
  markTutorialMilestone,
  setSheetTourStatus,
  setTutorialsEnabled,
  shouldOfferSheetTour,
} from './onboarding-preferences';

function installMemoryStorage() {
  const store = new Map<string, string>();
  const memory: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key) => (store.has(key) ? store.get(key)! : null),
    key: (index) => Array.from(store.keys())[index] ?? null,
    removeItem: (key) => {
      store.delete(key);
    },
    setItem: (key, value) => {
      store.set(key, String(value));
    },
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: memory,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, 'window', {
    value: globalThis,
    configurable: true,
    writable: true,
  });
}

describe('onboarding-preferences', () => {
  beforeEach(() => {
    installMemoryStorage();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('tracks play-together dismiss', () => {
    expect(hasSeenPlayTogether()).toBe(false);
    markPlayTogetherSeen();
    expect(hasSeenPlayTogether()).toBe(true);
    expect(localStorage.getItem(PLAY_TOGETHER_KEY)).toBe('1');
  });

  it('defaults tutorials on and persists off', () => {
    expect(areTutorialsEnabled()).toBe(true);
    setTutorialsEnabled(false);
    expect(areTutorialsEnabled()).toBe(false);
    expect(localStorage.getItem(TUTORIALS_ENABLED_KEY)).toBe('0');
    setTutorialsEnabled(true);
    expect(areTutorialsEnabled()).toBe(true);
  });

  it('offers sheet tour until completed or dismissed forever', () => {
    expect(shouldOfferSheetTour()).toBe(true);
    setSheetTourStatus('completed');
    expect(getSheetTourStatus()).toBe('completed');
    expect(shouldOfferSheetTour()).toBe(false);
    localStorage.removeItem(SHEET_TOUR_KEY);
    setSheetTourStatus('dismissed_forever');
    expect(shouldOfferSheetTour()).toBe(false);
  });

  it('respects tutorials-off for sheet tour offer', () => {
    setTutorialsEnabled(false);
    expect(shouldOfferSheetTour()).toBe(false);
  });

  it('stores tutorial milestones without repeat', () => {
    expect(hasSeenTutorialMilestone('first_level_up')).toBe(false);
    markTutorialMilestone('first_level_up');
    expect(hasSeenTutorialMilestone('first_level_up')).toBe(true);
    expect(JSON.parse(localStorage.getItem(TUTORIAL_MILESTONES_KEY) || '{}')).toEqual({
      first_level_up: true,
    });
  });

  it('builds sheet URL with tour offer query', () => {
    expect(characterSheetUrlWithTourOffer('abc')).toBe('/characters/abc?offerTour=1');
  });
});
