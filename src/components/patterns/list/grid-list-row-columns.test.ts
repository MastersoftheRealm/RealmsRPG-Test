import { describe, expect, it } from 'vitest';
import { columnsAlreadyShowTrainingPoints } from './grid-list-row-columns';

describe('columnsAlreadyShowTrainingPoints', () => {
  it('detects TP / Training Points column keys and labels', () => {
    expect(columnsAlreadyShowTrainingPoints([{ key: 'TP', value: 3 }])).toBe(true);
    expect(columnsAlreadyShowTrainingPoints([{ key: 'energy', label: 'TP', value: 1 }])).toBe(true);
    expect(
      columnsAlreadyShowTrainingPoints([{ key: 'cost', label: 'Training Points', value: 2 }], 'TP'),
    ).toBe(true);
  });

  it('returns false when no TP column is present', () => {
    expect(
      columnsAlreadyShowTrainingPoints([
        { key: 'Energy', value: 4 },
        { key: 'Action', value: 'Basic Action' },
      ]),
    ).toBe(false);
  });
});
