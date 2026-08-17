import { describe, expect, it } from 'vitest';
import { buildCustomEquipmentItem } from './build-custom-equipment';

describe('buildCustomEquipmentItem (DEV-V-009-T022 / TASK-815)', () => {
  it('builds a one-off equipment row with a custom- id', () => {
    const item = buildCustomEquipmentItem('  Rope  ', '  50 ft  ', 2);
    expect(item.id).toMatch(/^custom-/);
    expect(item.name).toBe('Rope');
    expect(item.description).toBe('50 ft');
    expect(item.type).toBe('equipment');
    expect(item.quantity).toBe(2);
    expect(item.equipped).toBe(false);
    expect(item.cost).toBe(0);
  });

  it('normalizes blank notes and invalid quantity', () => {
    const item = buildCustomEquipmentItem('Quest key', '   ', 0);
    expect(item.description).toBe('');
    expect(item.quantity).toBe(1);
  });
});
