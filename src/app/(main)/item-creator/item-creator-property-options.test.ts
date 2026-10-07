import { describe, expect, it } from 'vitest';
import { propertyOptionsForCard } from './item-creator-property-options';

const properties = [
  { id: 1, name: 'Critical Range' },
  { id: 2, name: 'Finesse' },
  { id: 3, name: 'Vicious' },
];

describe('property dropdown excludes used properties (86e3jww87)', () => {
  it('hides a property that another card already uses', () => {
    const options = propertyOptionsForCard(properties, 2, [1]);
    expect(options.map((property) => property.name)).toEqual(['Finesse', 'Vicious']);
  });

  it('keeps the current property when another card has the same one', () => {
    const options = propertyOptionsForCard(properties, 1, [1]);
    expect(options.map((property) => property.id)).toEqual([1, 2, 3]);
  });

  it('still lists every property on the first card', () => {
    const options = propertyOptionsForCard(properties, 1, []);
    expect(options).toHaveLength(3);
  });
});
