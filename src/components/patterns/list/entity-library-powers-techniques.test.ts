import { describe, expect, it } from 'vitest';
import { POWER_COLUMNS, POWER_COLUMNS_WITH_ENERGY } from './entity-library-sections-columns';
import { powerListFactCells } from './entity-library-powers-techniques';

const row = {
  energyCost: 4,
  actionType: 'Basic',
  duration: '2 Rounds',
  area: 'Sphere 2',
  damage: '1d8 Ice',
};

function headerFactKeys(columns: ReadonlyArray<{ key: string }>): string[] {
  return columns.map((col) => col.key).filter((key) => key !== 'name');
}

describe('powerListFactCells', () => {
  it('follows stat-block headers Energy, Action, Duration, Area, Damage (86e3jx63e)', () => {
    const cells = powerListFactCells(row, true);
    expect(cells.map((cell) => cell.key)).toEqual(headerFactKeys(POWER_COLUMNS_WITH_ENERGY));
    expect(cells.map((cell) => cell.key)).toEqual([
      'energy',
      'action',
      'duration',
      'area',
      'damage',
    ]);
    expect(cells.find((cell) => cell.key === 'damage')?.value).toBe('1d8 Ice');
  });

  it('follows the sheet play headers when the energy column is off', () => {
    expect(powerListFactCells(row, false).map((cell) => cell.key)).toEqual(
      headerFactKeys(POWER_COLUMNS),
    );
  });
});
