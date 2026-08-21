import { defined } from '@/lib/utils';
import { chipLabelsFromDetailSections } from '@/lib/glr';
import { describe, expect, it } from 'vitest';
import {
  mapPowerRows,
  mapTechniqueRows,
  type LibraryEntityRowContext,
} from './library-entity-rows';
import type { CharacterPower, CharacterTechnique } from '@/types';

const baseCtx: LibraryEntityRowContext = {
  powerPartsDb: [],
  techniquePartsDb: [],
  itemPropertiesDb: [],
  currentEnergy: 20,
  showLibraryEditControls: false,
  rollContext: null,
  hasMissingForEntry: () => false,
  onUsePower: () => {},
  onUseTechnique: () => {},
};

function columnKeys(row: { columns?: Array<{ key: string }> | undefined }): string[] {
  return (row.columns ?? []).map((c) => c.key);
}

describe('mapPowerRows / mapTechniqueRows — Energy is rightSlot only (TASK-502)', () => {
  it('powers: no Energy column when spend handler is present', () => {
    const powers: CharacterPower[] = [
      {
        id: 'p1',
        name: 'Bolt',
        cost: 4,
        actionType: 'Action',
        damage: '1d8',
      } as CharacterPower,
    ];
    const row = defined(mapPowerRows(powers, baseCtx)[0]);
    expect(columnKeys(row)).not.toContain('energy');
    expect(columnKeys(row)).toEqual(['action', 'damage', 'area', 'duration']);
    expect(row.rightSlot).toBeTruthy();
  });

  it('techniques: no Energy column when spend handler is present', () => {
    const techniques: CharacterTechnique[] = [
      {
        id: 't1',
        name: 'Strike',
        cost: 3,
        actionType: 'Action',
        weaponName: 'Sword',
        tp: 2,
      } as CharacterTechnique,
    ];
    const row = defined(mapTechniqueRows(techniques, baseCtx)[0]);
    expect(columnKeys(row)).not.toContain('energy');
    expect(columnKeys(row)).toEqual(['action', 'weapon']);
    expect(row.totalTp).toBeUndefined();
    const chips = chipLabelsFromDetailSections(row.detailSections);
    expect(chips.some((l) => /training points\s+2/i.test(l))).toBe(true);
    expect(row.rightSlot).toBeTruthy();
  });

  it('zero-cost rows omit the energy rightSlot control', () => {
    const powers: CharacterPower[] = [
      { id: 'innate', name: 'Innate', cost: 0, innate: true } as CharacterPower,
    ];
    const row = defined(mapPowerRows(powers, baseCtx)[0]);
    expect(row.rightSlot).toBeNull();
  });

  it('view-only (no onUse): still renders disabled spend chrome, not a static column', () => {
    const powers: CharacterPower[] = [
      { id: 'p2', name: 'View', cost: 5, actionType: 'Action' } as CharacterPower,
    ];
    const row = defined(mapPowerRows(powers, { ...baseCtx, onUsePower: undefined })[0]);
    expect(columnKeys(row)).not.toContain('energy');
    expect(row.rightSlot).toBeTruthy();
  });
});
