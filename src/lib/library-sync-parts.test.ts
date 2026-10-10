import { describe, expect, it } from 'vitest';
import { syncItemProperties, syncPowerParts } from './library-sync';

describe('sync keeps identical parts and still collapses properties', () => {
  const potency = { id: 12, name: 'Potency Increase' };

  it('does not collapse a second copy of the same power part', () => {
    const parts = [
      { id: 12, name: 'Potency Increase', op_1_lvl: 0 },
      { id: 12, name: 'Potency Increase', op_1_lvl: 0 },
    ];
    const result = syncPowerParts('QA CR Power 8', parts, [potency]);
    expect(result.value).toEqual(parts);
    expect(result.changed).toBe(false);
    expect(result.hasDrift).toBe(false);
  });

  it('still collapses the same item property', () => {
    const twoHanded = { id: 3, name: 'Two-Handed' };
    const result = syncItemProperties('Shield', [twoHanded, { ...twoHanded }], [twoHanded]);
    expect(result.value).toEqual([twoHanded]);
    expect(result.changed).toBe(true);
  });
});
