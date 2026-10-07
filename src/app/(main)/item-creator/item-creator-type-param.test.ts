import { readFileSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { itemCreatorTypeHref } from '@/lib/library/armament-library-labels';
import {
  ARMOR_LIBRARY_LABELS,
  SHIELD_LIBRARY_LABELS,
  WEAPON_LIBRARY_LABELS,
} from '../library/components/library-entity-tab.types';
import type { ItemCreatorCache } from './item-creator-bootstrap';

vi.mock('@/lib/game/creator-cache', () => ({
  readCreatorCache: vi.fn(() => null),
}));

import { readCreatorCache } from '@/lib/game/creator-cache';
import { bootstrapItemCreatorFormState, parseItemCreatorTypeParam } from './item-creator-bootstrap';

const readCache = vi.mocked(readCreatorCache);

function cachedDraft(
  armamentType: ItemCreatorCache['armamentType'],
  name: string,
): ItemCreatorCache {
  return {
    name,
    description: '',
    armamentType,
    selectedProperties: [],
    damage: { amount: 1, size: 4, type: 'slashing' },
    isTwoHanded: false,
    damageReduction: 0,
    agilityReduction: 0,
    criticalRangeIncrease: 0,
    shieldDR: { amount: 1, size: 4 },
    hasShieldDamage: false,
    shieldDamage: { amount: 1, size: 4 },
    abilityRequirement: null,
    timestamp: Date.now(),
  };
}

describe('item creator ?type= (86e3jzd2w)', () => {
  beforeEach(() => {
    readCache.mockReset();
    readCache.mockReturnValue(null);
  });

  it('parses weapon, armor, and shield and ignores unknown values', () => {
    expect(parseItemCreatorTypeParam('armor')).toBe('Armor');
    expect(parseItemCreatorTypeParam('Shield')).toBe('Shield');
    expect(parseItemCreatorTypeParam(' weapon ')).toBe('Weapon');
    expect(parseItemCreatorTypeParam('accessory')).toBeNull();
    expect(parseItemCreatorTypeParam(null)).toBeNull();
  });

  it('opens as Armor or Shield even when a Weapon draft is cached', () => {
    readCache.mockReturnValue(cachedDraft('Weapon', 'Cached Blade'));

    const armor = bootstrapItemCreatorFormState({
      editItemId: null,
      itemProperties: [],
      rawItems: [],
      requestedType: 'Armor',
    });
    expect(armor.armamentType).toBe('Armor');
    expect(armor.name).toBe('');

    const shield = bootstrapItemCreatorFormState({
      editItemId: null,
      itemProperties: [],
      rawItems: [],
      requestedType: 'Shield',
    });
    expect(shield.armamentType).toBe('Shield');
    expect(shield.name).toBe('');
  });

  it('keeps a cached draft when it is already the requested type', () => {
    readCache.mockReturnValue(cachedDraft('Armor', 'Cached Plate'));

    const armor = bootstrapItemCreatorFormState({
      editItemId: null,
      itemProperties: [],
      rawItems: [],
      requestedType: 'Armor',
    });
    expect(armor.armamentType).toBe('Armor');
    expect(armor.name).toBe('Cached Plate');
  });

  it('still restores the cached type when no ?type= is present', () => {
    readCache.mockReturnValue(cachedDraft('Shield', 'Cached Buckler'));

    const form = bootstrapItemCreatorFormState({
      editItemId: null,
      itemProperties: [],
      rawItems: [],
    });
    expect(form.armamentType).toBe('Shield');
    expect(form.name).toBe('Cached Buckler');
  });

  it('lets an edited item win over ?type=', () => {
    readCache.mockReturnValue(cachedDraft('Armor', 'Cached Plate'));

    const form = bootstrapItemCreatorFormState({
      editItemId: 'item-1',
      itemProperties: [],
      rawItems: [{ id: 'item-1', name: 'Saved Sword', type: 'weapon' }],
      requestedType: 'Shield',
    });
    expect(form.armamentType).toBe('Weapon');
    expect(form.name).toBe('Saved Sword');
  });

  it('points Create Armor and Create Shield at ?type=', () => {
    expect(itemCreatorTypeHref('armor')).toBe('/item-creator?type=armor');
    expect(itemCreatorTypeHref('shield')).toBe('/item-creator?type=shield');
    expect(ARMOR_LIBRARY_LABELS.createHref).toBe('/item-creator?type=armor');
    expect(SHIELD_LIBRARY_LABELS.createHref).toBe('/item-creator?type=shield');
    expect(WEAPON_LIBRARY_LABELS.createHref).toBe('/item-creator?type=weapon');

    const libraryPage = readFileSync(path.join(import.meta.dirname, '../library/page.tsx'), 'utf8');
    expect(libraryPage).toContain("itemCreatorTypeHref('armor')");
    expect(libraryPage).toContain("itemCreatorTypeHref('shield')");

    const creatorPage = readFileSync(path.join(import.meta.dirname, 'page.tsx'), 'utf8');
    expect(creatorPage).toContain("parseItemCreatorTypeParam(searchParams.get('type'))");
    expect(creatorPage).toContain('requestedType');
  });
});
