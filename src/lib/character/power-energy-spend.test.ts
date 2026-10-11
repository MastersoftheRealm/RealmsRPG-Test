import { describe, expect, it } from 'vitest';
import { energyAfterPowerUse } from './power-energy-spend';

describe('energyAfterPowerUse', () => {
  it('does not spend Energy when the power is innate (86e3jvfmf)', () => {
    expect(
      energyAfterPowerUse([{ id: 'charm-beast', innate: true }], 'charm-beast', 7, 18),
    ).toEqual({ currentEnergy: 18, spent: false });
  });

  it('matches an innate flag when the row id and stored id differ by type', () => {
    expect(energyAfterPowerUse([{ id: 7, innate: true }], '7', 7, 18)).toEqual({
      currentEnergy: 18,
      spent: false,
    });
  });

  it('still spends Energy for a power that is not innate', () => {
    expect(
      energyAfterPowerUse([{ id: 'charm-beast', innate: false }], 'charm-beast', 7, 18),
    ).toEqual({ currentEnergy: 11, spent: true });
  });

  it('leaves Energy unchanged when the pool is short', () => {
    expect(energyAfterPowerUse([{ id: 'bolt' }], 'bolt', 7, 4)).toEqual({
      currentEnergy: 4,
      spent: false,
    });
  });
});
