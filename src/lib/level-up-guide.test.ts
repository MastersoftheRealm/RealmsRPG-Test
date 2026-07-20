import { beforeEach, describe, expect, it } from 'vitest';
import { buildLevelUpGuideContent } from './level-up-guide';
import {
  TUTORIALS_ENABLED_KEY,
  TUTORIAL_MILESTONES_KEY,
} from './onboarding-preferences';
import type { Character } from '@/types';

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

function baseCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: 'c1',
    name: 'Test',
    level: 1,
    abilities: { strength: 2, dexterity: 2, constitution: 2, intelligence: 2, wisdom: 2, charisma: 2 },
    ...overrides,
  } as Character;
}

describe('buildLevelUpGuideContent', () => {
  beforeEach(() => {
    installMemoryStorage();
  });

  it('returns null when tutorials are off', () => {
    localStorage.setItem(TUTORIALS_ENABLED_KEY, '0');
    expect(buildLevelUpGuideContent(baseCharacter(), 1, 2)).toBeNull();
  });

  it('offers first_level_up on first level increase', () => {
    const guide = buildLevelUpGuideContent(baseCharacter(), 1, 2);
    expect(guide?.milestoneId).toBe('first_level_up');
    expect(guide?.highlightTarget).toBe('sheet-tour-header');
    expect(guide?.enterEditMode).toBe(false);
    expect(guide?.bullets.length).toBeGreaterThan(0);
  });

  it('prefers first_ability_point when AP gains and not yet seen', () => {
    localStorage.setItem(
      TUTORIAL_MILESTONES_KEY,
      JSON.stringify({ first_level_up: true })
    );
    const guide = buildLevelUpGuideContent(baseCharacter({ level: 2 }), 2, 3);
    expect(guide?.milestoneId).toBe('first_ability_point');
    expect(guide?.highlightTarget).toBe('sheet-tour-abilities');
    expect(guide?.enterEditMode).toBe(true);
  });

  it('returns null when all relevant milestones seen', () => {
    localStorage.setItem(
      TUTORIAL_MILESTONES_KEY,
      JSON.stringify({
        first_level_up: true,
        first_ability_point: true,
        first_library_slot: true,
      })
    );
    expect(buildLevelUpGuideContent(baseCharacter(), 1, 5)).toBeNull();
  });
});
