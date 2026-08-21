/**
 * Property type must survive a load/save round trip: `normalizePropertyType` runs on load,
 * so any value it does not recognise is silently rewritten in the DB on the next save.
 */

import { describe, expect, it } from 'vitest';
import type { ItemProperty } from '@/hooks';
import {
  normalizePropertyType,
  propertyFormToSavePayload,
  propertyToFormState,
} from './admin-property-form';

describe('normalizePropertyType', () => {
  it.each([
    ['General', 'General'],
    ['general', 'General'],
    ['Armor', 'Armor'],
    ['shield', 'Shield'],
    ['weapon', 'Weapon'],
  ])('keeps %s as %s', (input, expected) => {
    expect(normalizePropertyType(input)).toBe(expected);
  });

  it('does not classify an unset type as Armor', () => {
    expect(normalizePropertyType(undefined)).not.toBe('Armor');
  });
});

describe('property round trip', () => {
  it('saves a General property back as General', () => {
    const property = {
      id: '1',
      name: 'Balanced',
      description: 'Applies to any armament.',
      type: 'general',
    } as ItemProperty;

    const saved = propertyFormToSavePayload(propertyToFormState(property));

    expect(saved.type).toBe('General');
  });
});
