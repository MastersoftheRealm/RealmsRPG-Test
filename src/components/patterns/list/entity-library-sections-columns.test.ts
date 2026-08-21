import { describe, expect, it } from 'vitest';
import { buildCreatureEquipmentColumns } from './entity-library-sections-columns';

describe('buildCreatureEquipmentColumns (TASK-813)', () => {
  it('formats type and does not fake Qty 1 when quantity is missing', () => {
    const cols = buildCreatureEquipmentColumns('adventuring_gear', undefined);
    expect(cols.find((c) => c.key === 'type')?.value).toBe('Adventuring Gear');
    expect(cols.find((c) => c.key === 'quantity')?.value).toBe('-');
  });
});
